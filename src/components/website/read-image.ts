const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export async function readImageFile(file: File) {
  if (!ACCEPTED.includes(file.type)) {
    throw new Error("Upload a JPG, PNG, or WebP image");
  }
  if (file.size > 4 * 1024 * 1024) {
    throw new Error("Image must be 4 MB or smaller");
  }

  const dataBase64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? "").split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read that image"));
    reader.readAsDataURL(file);
  });

  if (!dataBase64) throw new Error("Could not read that image");
  return dataBase64;
}
