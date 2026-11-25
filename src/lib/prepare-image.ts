const MAX_DATA_URL = 700_000;

export async function fileToJpeg(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("That file isn't a photo.");
  }
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("Folio couldn't open that photo. Try a JPG or PNG.");
  }
  try {
    let url = paintJpeg(bitmap, 1280, 0.72);
    if (url.length > MAX_DATA_URL) url = paintJpeg(bitmap, 1024, 0.6);
    if (url.length > MAX_DATA_URL) url = paintJpeg(bitmap, 800, 0.55);
    if (url.length > 900_000) {
      throw new Error("That photo is too heavy. Try a smaller one.");
    }
    return url;
  } finally {
    bitmap.close();
  }
}

function paintJpeg(bitmap: ImageBitmap, maxEdge: number, quality: number): string {
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't prepare that photo.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function makeThumb(dataUrl: string): Promise<string> {
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("thumb"));
    img.src = dataUrl;
  });
  const canvas = document.createElement("canvas");
  const width = 160;
  const height = Math.max(1, Math.round((img.height / img.width) * width));
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", 0.7);
}
