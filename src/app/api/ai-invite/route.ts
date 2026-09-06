import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserImageRegenerationsUsed, incrementUserImageRegenerations } from "@/lib/store";

// Each call here is a real Gemini image-generation cost - capped per
// account so one user can't run up an unbounded bill. Free/uncapped ONLY
// for `freeCorrection` (quickUpdateImage's plain structured-field fix -
// typo/name/date/address/time on an already-generated image, nothing
// visual). Everything else counts against this same shared pool: a brand
// new design (guided form / AI-designer chat, no baseImage at all) AND a
// free-text design-change request via the chat (DesignChangeChat -
// baseImage present, but a real visual edit, not a plain field fix).
const MAX_IMAGE_REGENERATIONS = 10;

// Generates an invitation background/design image from a guided form +
// optional free text, via Google's Gemini image-generation models through
// the Interactions API (all Imagen models - the previous :predict-based
// approach here - were shut down by Google on 2026-08-17; image generation
// now goes through the same generateContent-family text models, requested
// via POST .../v1beta/interactions instead of .../models/{id}:predict).
// The AI-designer chat path (see ai-designer/chat/route.ts) now asks for the
// full finished invitation, real Hebrew event text rendered inside the
// image and all - current-generation models handle that far better than
// the "never put text in the image" assumption this comment used to carry.
// The older guided-form path below (no chat, just category/color/style)
// still asks for a text-free background, since it was never given the
// user's actual event details in a shape meant for rendering into an image.
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "יצירת תמונות ב-AI לא הוגדרה עדיין במערכת (חסר מפתח API)" },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);

  // The AI-designer chat (src/app/api/ai-designer/chat) assembles its own
  // complete English prompt once it has asked enough questions - when it's
  // given directly, skip the guided-form prompt-building below entirely.
  const rawPrompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";

  const eventType = typeof body?.eventType === "string" ? body.eventType.trim() : "";
  const color = typeof body?.color === "string" ? body.color.trim() : "";
  const background = typeof body?.background === "string" ? body.background.trim() : "";
  const elements = typeof body?.elements === "string" ? body.elements.trim() : "";
  const style = typeof body?.style === "string" ? body.style.trim() : "";
  const freeText = typeof body?.freeText === "string" ? body.freeText.trim() : "";

  if (!rawPrompt && !eventType && !color && !background && !elements && !style && !freeText) {
    return NextResponse.json({ error: "יש למלא לפחות פרט אחד" }, { status: 400 });
  }

  // A `baseImage` means "edit this exact existing image" rather than a
  // brand-new design from scratch. It's either a data: URL (an image
  // generated earlier this session, still in client state) or a plain
  // https:// URL (an already-saved invite's photo, on Google Cloud
  // Storage) - resolved to actual bytes below, AFTER the quota check,
  // since fetching it costs nothing quota-wise.
  const rawBaseImage = typeof body?.baseImage === "string" ? body.baseImage.trim() : "";
  const isCorrection = !!rawBaseImage;
  // ONLY quickUpdateImage's plain structured-field fix sets this - a real
  // visual edit via baseImage (a design-chat request) still costs quota
  // even though it also attaches a baseImage.
  const isFreeCorrection = isCorrection && body?.freeCorrection === true;

  if (!isFreeCorrection) {
    const used = await getUserImageRegenerationsUsed(user.id);
    if (used >= MAX_IMAGE_REGENERATIONS) {
      return NextResponse.json(
        {
          error: `הגעתם למגבלה של ${MAX_IMAGE_REGENERATIONS} שינויי עיצוב לחשבון. תיקון טקסט בלבד (שמות, תאריך, כתובת, שעה) בהזמנה קיימת אינו כלול במגבלה ותמיד זמין.`,
        },
        { status: 403 }
      );
    }
  }

  // "3:4" was Imagen's own `parameters.aspectRatio` - the Interactions API
  // doesn't take a matching structured field for this model family, so the
  // ratio requirement is folded into the prompt text itself instead, same
  // as the existing "portrait orientation" instruction right after it.
  //
  // The AI-designer chat's own prompt (rawPrompt) now asks for the full
  // invitation - real event text rendered inside the image - instead of a
  // text-free background (current-generation image models turn out to
  // handle Hebrew text in-image far better than the older Imagen models
  // this comment used to warn about), so it must NOT get the "no text"
  // instruction the guided-form path below still uses.
  const promptParts = rawPrompt
    ? [rawPrompt, "Portrait orientation, 9:16 aspect ratio, high-end professional graphic design."]
    : [
        `An elegant, professional digital invitation background design${eventType ? ` for a ${eventType}` : ""}.`,
        color && `Color palette: ${color}.`,
        background && `Background style: ${background}.`,
        elements && `Decorative elements: ${elements}.`,
        style && `Overall mood and style: ${style}.`,
        freeText,
        "Portrait orientation, 3:4 aspect ratio, high-end graphic design, tasteful negative space in the center and lower area for text to be added later, absolutely no text, no letters, no words, no numbers in the image.",
      ];
  const prompt = promptParts.filter(Boolean).join(" ");

  const model = process.env.GEMINI_IMAGE_MODEL || "gemini-3.1-flash-image";

  // Resolve baseImage to actual bytes. A data: URL (fresh this-session
  // image) is parsed directly; a plain URL (an already-saved invite's
  // photo, on Google Cloud Storage) is fetched right here, server-side -
  // deliberately NOT done in the browser, because that bucket has no CORS
  // policy allowing a page on this app's origin to read it via fetch() -
  // exactly what broke every "quick update" on an already-saved invite
  // (surfacing to the user only as a generic "שגיאת רשת") before this
  // moved server-side, where CORS doesn't apply at all.
  let baseImagePart: { mimeType: string; data: string } | null = null;
  if (isCorrection) {
    const dataUrlMatch = /^data:([^;]+);base64,(.+)$/.exec(rawBaseImage);
    if (dataUrlMatch) {
      baseImagePart = { mimeType: dataUrlMatch[1], data: dataUrlMatch[2] };
    } else {
      try {
        const imgRes = await fetch(rawBaseImage);
        if (!imgRes.ok) throw new Error(`fetch failed: ${imgRes.status}`);
        const buf = Buffer.from(await imgRes.arrayBuffer());
        baseImagePart = { mimeType: imgRes.headers.get("content-type") || "image/webp", data: buf.toString("base64") };
      } catch {
        return NextResponse.json({ error: "לא ניתן היה לטעון את התמונה הקיימת" }, { status: 502 });
      }
    }
  }

  // How many independent attempts to generate in parallel, offered to the
  // user as options to pick between (DesignChangeChat) - all of them
  // together still cost exactly ONE credit (checked/incremented once,
  // below), same as a single-variant call. Capped at 3 regardless of what
  // the client asks for - a display/cost safety net, not a real setting.
  const variantCount = Math.min(Math.max(1, Number(body?.variantCount) || 1), 3);

  // Nudges each parallel attempt to actually diverge from the others
  // rather than relying purely on incidental sampling variance - without
  // this, two calls with the identical prompt can come back near-identical,
  // defeating the point of offering a choice.
  const variantPrompt = (i: number) =>
    variantCount > 1
      ? `${prompt}\n\nThis is option ${i + 1} of ${variantCount} independent alternatives being generated for the client to choose between - keep every protection/instruction above exactly as stated, but make your own independent creative interpretation of exactly how to fit the change in, so this option reads as meaningfully different from the other alternative(s) - not a near-duplicate.`
      : prompt;

  // The image block goes BEFORE the text block when present, so the model
  // sees "here is the actual image" before it reads "edit only this text in
  // it" - this is a real edit of those exact pixels, not a blind
  // regenerate-from-a-description (which a from-scratch generation model
  // can't reproduce identically twice) - that mismatch used to be the real
  // cause of a plain typo fix coming back with a randomly different-looking
  // background/style.
  function buildInput(text: string) {
    return baseImagePart
      ? [{ type: "image", mime_type: baseImagePart.mimeType, data: baseImagePart.data }, { type: "text", text }]
      : [{ type: "text", text }];
  }

  interface ImageContent { data?: string; mime_type?: string }

  async function generateOne(text: string): Promise<{ dataUrl: string } | { error: string }> {
    try {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/interactions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey as string },
        body: JSON.stringify({ model, input: buildInput(text) }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) return { error: data?.error?.message || "שגיאה ביצירת התמונה" };

      // `output_image` is the documented convenience field for the last
      // generated image; fall back to scanning the steps timeline for an
      // image content block in case a particular response omits it.
      let imageContent: ImageContent | undefined = data?.output_image;
      if (!imageContent?.data) {
        for (const step of data?.steps ?? []) {
          const found = (step?.content ?? []).find((c: ImageContent & { type?: string }) => c?.type === "image" && c?.data);
          if (found) {
            imageContent = found;
            break;
          }
        }
      }
      if (!imageContent?.data) return { error: "לא התקבלה תמונה מהשירות" };
      const mimeType = imageContent.mime_type || "image/png";
      return { dataUrl: `data:${mimeType};base64,${imageContent.data}` };
    } catch {
      return { error: "שגיאת רשת מול שירות ה-AI" };
    }
  }

  const results = await Promise.all(
    Array.from({ length: variantCount }, (_, i) => generateOne(variantPrompt(i)))
  );
  const dataUrls = results.filter((r): r is { dataUrl: string } => "dataUrl" in r).map((r) => r.dataUrl);

  if (dataUrls.length === 0) {
    const firstError = results.find((r): r is { error: string } => "error" in r);
    return NextResponse.json({ error: firstError?.error || "שגיאה ביצירת התמונה" }, { status: 502 });
  }

  // Counts against the quota unless it's the one free-correction path, and
  // only once at least one variant actually came back - a fully failed
  // call above already returned early without reaching here, so it never
  // costs quota either. Exactly one credit no matter how many variants
  // were requested/succeeded.
  let regenerationsUsed: number | undefined;
  if (!isFreeCorrection) {
    regenerationsUsed = await incrementUserImageRegenerations(user.id);
  }
  const quotaFields =
    regenerationsUsed !== undefined
      ? { regenerationsUsed, regenerationsRemaining: Math.max(0, MAX_IMAGE_REGENERATIONS - regenerationsUsed) }
      : {};

  // variantCount>1 always responds with `variants` (even if only one came
  // back - some failed) so the client has one consistent shape to handle;
  // variantCount===1 (every existing caller) keeps the original single
  // `imageDataUrl` shape untouched.
  return NextResponse.json(
    variantCount > 1
      ? { variants: dataUrls, ...quotaFields }
      : { imageDataUrl: dataUrls[0], ...quotaFields }
  );
}

// Lets the create-flow show "נשארו לכם X שינויים עיצוביים" right away, on
// page load - before the user has made any AI call at all this session -
// instead of only after their first generation/design-chat response.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "יש להתחבר" }, { status: 401 });
  }
  const used = await getUserImageRegenerationsUsed(user.id);
  return NextResponse.json({ regenerationsUsed: used, regenerationsRemaining: Math.max(0, MAX_IMAGE_REGENERATIONS - used) });
}
