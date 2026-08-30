import { randomUUID } from "crypto";
import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

// Invitation photos used to be stored inline as base64 data URLs inside
// data/store.json - fine for a handful of invites, but every read/write of
// that file re-parses the whole thing, so it gets slower and heavier with
// every AI-generated/uploaded image. This writes the actual bytes to disk
// under public/uploads and returns a short URL path for the store instead.
const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");

/** Decodes a `data:image/...;base64,...` URL, normalizes it (capped
 *  dimensions, re-encoded as webp) with sharp, and writes it under
 *  public/uploads. Returns the public URL path to store on the record
 *  (e.g. "/uploads/<prefix>-<uuid>.webp"). Non-data-URL input (already a
 *  "/uploads/..." path from a previous save, or empty) is returned as-is. */
export async function saveImageDataUrl(dataUrl: string, prefix: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith("data:")) return dataUrl;

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return dataUrl;

  const buffer = Buffer.from(match[2], "base64");
  await mkdir(UPLOADS_DIR, { recursive: true });

  const filename = `${prefix}-${randomUUID()}.webp`;
  const outPath = path.join(UPLOADS_DIR, filename);

  await sharp(buffer)
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toFile(outPath);

  return `/uploads/${filename}`;
}

/** Best-effort delete of a previously-saved upload (e.g. when an invite's
 *  photo is replaced, or the invite itself is purged). Never throws - a
 *  missing/already-deleted file, or a non-local URL, is not an error here. */
export async function deleteStoredImage(urlPath: string | undefined | null): Promise<void> {
  if (!urlPath || !urlPath.startsWith("/uploads/")) return;
  const filePath = path.join(process.cwd(), "public", urlPath);
  try {
    await unlink(filePath);
  } catch {
    // already gone, or never existed - fine either way.
  }
}

/** Writes an already-decoded buffer (e.g. the output of a server-side
 *  compositing step in Phase B) directly, skipping the data-URL parse. */
export async function saveImageBuffer(buffer: Buffer, prefix: string): Promise<string> {
  await mkdir(UPLOADS_DIR, { recursive: true });
  const filename = `${prefix}-${randomUUID()}.webp`;
  await writeFile(path.join(UPLOADS_DIR, filename), buffer);
  return `/uploads/${filename}`;
}
