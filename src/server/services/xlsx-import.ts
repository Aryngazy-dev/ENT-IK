import { inflateRawSync } from "node:zlib";

const decoder = new TextDecoder("utf-8");
const zipSignature = 0x04034b50;
const centralSignature = 0x02014b50;
const endSignature = 0x06054b50;

function xmlText(value: string): string { return value.replace(/<[^>]*>/g, "").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&").trim(); }
function columnIndex(reference: string): number { return reference.replace(/\d/g, "").split("").reduce((total, char) => total * 26 + char.charCodeAt(0) - 64, 0) - 1; }

/** Parses ordinary OOXML workbooks without evaluating formulas or external XML entities. */
export function parseXlsxFirstSheet(bytes: Uint8Array, maxRows = 5_000): Record<string, string>[] {
  if (bytes.byteLength > 5_000_000) throw new Error("XLSX-файл превышает лимит 5 МБ");
  const data = Buffer.from(bytes);
  let end = -1;
  for (let index = data.length - 22; index >= Math.max(0, data.length - 65_557); index -= 1) if (data.readUInt32LE(index) === endSignature) { end = index; break; }
  if (end < 0) throw new Error("Некорректный XLSX-архив");
  const directoryOffset = data.readUInt32LE(end + 16); const files = new Map<string, Buffer>();
  for (let cursor = directoryOffset; cursor + 46 <= data.length && data.readUInt32LE(cursor) === centralSignature;) {
    const method = data.readUInt16LE(cursor + 10); const compressedSize = data.readUInt32LE(cursor + 20); const nameLength = data.readUInt16LE(cursor + 28); const extraLength = data.readUInt16LE(cursor + 30); const commentLength = data.readUInt16LE(cursor + 32); const localOffset = data.readUInt32LE(cursor + 42); const name = decoder.decode(data.subarray(cursor + 46, cursor + 46 + nameLength));
    if (localOffset + 30 > data.length || data.readUInt32LE(localOffset) !== zipSignature) throw new Error("Некорректный XLSX-архив");
    const localNameLength = data.readUInt16LE(localOffset + 26); const localExtraLength = data.readUInt16LE(localOffset + 28); const start = localOffset + 30 + localNameLength + localExtraLength; const compressed = data.subarray(start, start + compressedSize);
    if (compressed.length !== compressedSize) throw new Error("Повреждённый XLSX-файл");
    if (method === 0) files.set(name, compressed); else if (method === 8) files.set(name, inflateRawSync(compressed)); else throw new Error("Неподдерживаемое сжатие XLSX");
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  const worksheet = files.get("xl/worksheets/sheet1.xml"); if (!worksheet) throw new Error("Не найдена первая таблица XLSX");
  const shared = decoder.decode(files.get("xl/sharedStrings.xml") ?? Buffer.alloc(0)); const sharedStrings = [...shared.matchAll(/<si[^>]*>([\s\S]*?)<\/si>/g)].map((match) => xmlText(match[1]));
  const rows = [...decoder.decode(worksheet).matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].slice(0, maxRows + 1).map((match) => {
    const result: string[] = [];
    for (const cell of match[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g)) { const reference = /\br="([A-Z]+\d+)"/.exec(cell[1])?.[1]; if (!reference) continue; const type = /\bt="([^"]+)"/.exec(cell[1])?.[1]; const raw = /<v[^>]*>([\s\S]*?)<\/v>/.exec(cell[2])?.[1] ?? /<is[^>]*>([\s\S]*?)<\/is>/.exec(cell[2])?.[1] ?? ""; result[columnIndex(reference)] = type === "s" ? (sharedStrings[Number(raw)] ?? "") : xmlText(raw); }
    return result;
  });
  if (rows.length < 2) throw new Error("XLSX должен содержать заголовок и хотя бы одну строку");
  const headers = rows.shift()!.map((header) => header.trim()); if (!headers.some(Boolean)) throw new Error("Не найдены заголовки XLSX");
  return rows.filter((row) => row.some((value) => value?.trim())).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] ?? ""])));
}
