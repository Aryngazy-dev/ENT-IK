import type { QuestionPayload } from "@/shared/question-types/schema";

export type SubmittedAnswer = { optionIds?: string[]; point?: { x: number; y: number }; orderedIds?: string[]; matches?: { leftId: string; rightId: string }[]; truths?: { id: string; value: boolean }[] };

export function scoreAnswer(payload: QuestionPayload, answer: SubmittedAnswer): boolean {
  let options: { id: string; isCorrect: boolean }[];
  switch (payload.kind) {
    case "SINGLE_CHOICE": case "MULTIPLE_CHOICE": case "CONTEXT": case "ODD_ONE_OUT": case "CAUSE_EFFECT": case "DEFINITION": options = payload.options; break;
    case "CHRONOLOGY": return payload.items.slice().sort((a, b) => a.correctOrder - b.correctOrder).map((item) => item.id).join("|") === (answer.orderedIds ?? []).join("|");
    case "MATCHING": { const submitted = new Map((answer.matches ?? []).map((item) => [item.leftId, item.rightId])); return payload.pairs.length === submitted.size && payload.pairs.every((pair) => submitted.get(pair.leftId) === pair.rightId); }
    case "TRUE_FALSE": { const submitted = new Map((answer.truths ?? []).map((item) => [item.id, item.value])); return payload.statements.length === submitted.size && payload.statements.every((statement) => submitted.get(statement.id) === statement.isTrue); }
    default: return false;
  }
  const expected = options.filter((option) => option.isCorrect).map((option) => option.id).sort();
  const submitted = [...new Set(answer.optionIds ?? [])].sort();
  return expected.length === submitted.length && expected.every((id, index) => id === submitted[index]);
}

export function shuffledOptions<T>(options: readonly T[], random: () => number = Math.random): T[] {
  const result = [...options];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
}
