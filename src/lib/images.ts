/**
 * Shrinks a phone photo before it is uploaded.
 *
 * A tablet or phone camera writes 5–12 MB per picture. A loan application
 * sends five files in one request, and full-size photos were enough to run
 * the server out of memory mid-upload, which the customer saw as "the
 * connection dropped". A reviewer needs to see a face and a shop front, not
 * every pixel: 2000 px on the long side at JPEG quality 0.8 is about
 * 0.3–0.8 MB and still sharp on any screen.
 *
 * Anything that is not a picture (a PDF statement), is already small, or that
 * this browser cannot decode (HEIC on most browsers) is sent unchanged, so
 * shrinking can never be the reason an upload fails.
 */

const MAX_SIDE = 2000;
const QUALITY = 0.8;
const LEAVE_UNDER_BYTES = 800 * 1024;

export async function shrinkImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  if (file.size <= LEAVE_UNDER_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    // 'from-image' applies the camera's rotation, so a portrait photo stays upright.
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    // JPEG has no transparency; a white ground keeps a PNG screenshot readable.
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg', lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}
