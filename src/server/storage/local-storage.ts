import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const maxBytes = 10 * 1024 * 1024;
const allowed = new Map<string, string>([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["image/avif", "avif"]]);

function root(): string { return path.resolve(process.env.STORAGE_LOCAL_PATH ?? "./public/uploads"); }
export function hasExpectedImageSignature(bytes: Uint8Array, mimeType: string): boolean {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return [0x89, 0x50, 0x4e, 0x47].every((value, index) => bytes[index] === value);
  if (mimeType === "image/webp") return new TextDecoder().decode(bytes.slice(0, 4)) === "RIFF" && new TextDecoder().decode(bytes.slice(8, 12)) === "WEBP";
  if (mimeType === "image/avif") return new TextDecoder().decode(bytes.slice(4, 12)).includes("ftyp");
  return false;
}

export type StoredMedia = { storageKey: string; publicUrl: string; size: number };
export async function storeImage(file: File): Promise<StoredMedia> {
  if (!allowed.has(file.type)) throw new Error("Поддерживаются только JPEG, PNG, WebP и AVIF");
  if (file.size === 0 || file.size > maxBytes) throw new Error("Размер изображения должен быть от 1 байта до 10 МБ");
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (!hasExpectedImageSignature(bytes, file.type)) throw new Error("Тип файла не совпадает с его содержимым");
  const extension = allowed.get(file.type)!;
  const storageKey = `${randomUUID()}.${extension}`;
  await mkdir(root(), { recursive: true });
  await writeFile(path.join(root(), storageKey), bytes, { flag: "wx" });
  return { storageKey, publicUrl: `/uploads/${storageKey}`, size: bytes.byteLength };
}
