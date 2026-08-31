import { randomUUID } from "crypto";
import { Storage } from "@google-cloud/storage";
import sharp from "sharp";

// Invitation photos used to be written to public/uploads on local disk -
// that broke completely once the app moved to Cloud Run: the container
// filesystem is wiped on every new revision/restart, so every image
// "disappeared" the next time anyone deployed (invites kept the DB row and
// the /uploads/... path, the file behind it was just gone). Google Cloud
// Storage is the actual persistent home for these now - a bucket
// (ciel-invite-images) already exists in the project with public read
// access and the Cloud Run service's own service account already has
// object-admin rights on it, so no credentials to manage here: the
// @google-cloud/storage client picks up Application Default Credentials
// automatically (the attached service account on Cloud Run; `gcloud auth
// application-default login` locally).
const BUCKET_NAME = process.env.GCS_BUCKET || "ciel-invite-images";

let storage: Storage | undefined;
function getBucket() {
  if (!storage) storage = new Storage();
  return storage.bucket(BUCKET_NAME);
}

function publicUrl(filename: string): string {
  return `https://storage.googleapis.com/${BUCKET_NAME}/${filename}`;
}

/** True for a URL this module owns (so deleteStoredImage knows what it can
 *  safely try to remove) - either the current GCS form or the old local
 *  "/uploads/..." form from before this migration (harmless no-op now). */
function isOwnedUrl(url: string): boolean {
  return url.startsWith(publicUrl("")) || url.startsWith("/uploads/");
}

/** Decodes a `data:image/...;base64,...` URL, normalizes it (capped
 *  dimensions, re-encoded as webp) with sharp, and uploads it to the
 *  ciel-invite-images bucket. Returns the public https:// URL to store on
 *  the record. Non-data-URL input (already a saved URL from a previous
 *  save, or empty) is returned as-is. */
export async function saveImageDataUrl(dataUrl: string, prefix: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return dataUrl;

  const buffer = Buffer.from(match[2], "base64");
  const webp = await sharp(buffer)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const filename = `${prefix}-${randomUUID()}.webp`;
  await getBucket().file(filename).save(webp, { contentType: "image/webp" });

  return publicUrl(filename);
}

/** Best-effort delete of a previously-saved upload (e.g. when an invite's
 *  photo is replaced, or the invite itself is purged). Never throws - a
 *  missing/already-deleted object, or a URL this module doesn't own, is not
 *  an error here. */
export async function deleteStoredImage(urlPath: string | undefined | null): Promise<void> {
  if (!urlPath || !isOwnedUrl(urlPath)) return;
  if (urlPath.startsWith("/uploads/")) return; // old local-disk form - nothing left to delete
  const filename = urlPath.slice(publicUrl("").length);
  try {
    await getBucket().file(filename).delete();
  } catch (err) {
    // Genuinely-missing/already-deleted is fine and expected here - but a
    // real auth/permission failure (e.g. no Application Default Credentials
    // configured for local dev) would also land in this catch and go
    // completely silent otherwise, which is worth a server-log trace to
    // actually diagnose instead of just guessing.
    console.error("[imageStorage] deleteStoredImage failed", filename, err);
  }
}

/** Uploads an already-decoded buffer (e.g. the output of a server-side
 *  compositing step in Phase B) directly, skipping the data-URL parse. */
export async function saveImageBuffer(buffer: Buffer, prefix: string): Promise<string> {
  const filename = `${prefix}-${randomUUID()}.webp`;
  await getBucket().file(filename).save(buffer, { contentType: "image/webp" });
  return publicUrl(filename);
}
