export type CsvPreview = { headers: string[]; rows: Record<string, string>[]; errors: string[] };

function parseRow(line: string): string[] {
  const cells: string[] = []; let cell = ""; let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const current = line[index]; const next = line[index + 1];
    if (current === '"' && quoted && next === '"') { cell += '"'; index += 1; }
    else if (current === '"') quoted = !quoted;
    else if (current === "," && !quoted) { cells.push(cell.trim()); cell = ""; }
    else cell += current;
  }
  cells.push(cell.trim());
  return cells;
}

export function previewCsv(input: string, maximumRows = 50): CsvPreview {
  const lines = input.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [], errors: ["Файл пуст"] };
  const headers = parseRow(lines[0]);
  const errors = headers.some((header) => !header) ? ["Заголовки столбцов не могут быть пустыми"] : [];
  if (new Set(headers).size !== headers.length) errors.push("Заголовки столбцов должны быть уникальными");
  const rows = lines.slice(1, maximumRows + 1).map((line, rowIndex) => {
    const cells = parseRow(line);
    if (cells.length !== headers.length) errors.push(`Строка ${rowIndex + 2}: ожидалось ${headers.length} значений, получено ${cells.length}`);
    return Object.fromEntries(headers.map((header, index) => [header, cells[index] ?? ""]));
  });
  return { headers, rows, errors };
}
