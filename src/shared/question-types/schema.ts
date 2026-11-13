import { z } from "zod";

export const optionSchema = z.object({
  id: z.string().min(1),
  contentRu: z.string().min(1),
  contentKk: z.string().min(1).optional(),
  isCorrect: z.boolean(),
});

export const pointSchema = z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) });

const singleChoiceSchema = z.object({ kind: z.literal("SINGLE_CHOICE"), options: z.array(optionSchema).min(4).max(5) });
const multipleChoiceSchema = z.object({ kind: z.literal("MULTIPLE_CHOICE"), options: z.array(optionSchema).min(5).max(6) });
const mapClickSchema = z.object({
  kind: z.literal("MAP_CLICK"),
  target: z.object({ type: z.enum(["marker", "polygon"]), id: z.string().min(1) }),
});
const chronologySchema = z.object({ kind: z.literal("CHRONOLOGY"), items: z.array(z.object({ id: z.string(), contentRu: z.string().min(1), correctOrder: z.number().int().min(1) })).min(3).max(8) });
const matchingSchema = z.object({ kind: z.literal("MATCHING"), pairs: z.array(z.object({ leftId: z.string(), leftRu: z.string().min(1), rightId: z.string(), rightRu: z.string().min(1) })).min(3).max(8) });
const trueFalseSchema = z.object({ kind: z.literal("TRUE_FALSE"), statements: z.array(z.object({ id: z.string(), contentRu: z.string().min(1), isTrue: z.boolean() })).min(2).max(8) });
const causeEffectSchema = z.object({ kind: z.literal("CAUSE_EFFECT"), options: z.array(optionSchema).min(4).max(6) });
const definitionSchema = z.object({ kind: z.literal("DEFINITION"), options: z.array(optionSchema).min(4).max(5) });
const oddOneOutSchema = z.object({ kind: z.literal("ODD_ONE_OUT"), options: z.array(optionSchema).min(4).max(6) });
const contextSchema = z.object({ kind: z.literal("CONTEXT"), options: z.array(optionSchema).min(4).max(5) });

export const questionPayloadSchema = z.discriminatedUnion("kind", [singleChoiceSchema, multipleChoiceSchema, contextSchema, chronologySchema, matchingSchema, oddOneOutSchema, trueFalseSchema, causeEffectSchema, mapClickSchema, definitionSchema]);
export type QuestionPayload = z.infer<typeof questionPayloadSchema>;

export function assertCorrectOptionCount(payload: QuestionPayload): boolean {
  if (["MAP_CLICK", "CHRONOLOGY", "MATCHING", "TRUE_FALSE"].includes(payload.kind)) return true;
  switch (payload.kind) {
    case "SINGLE_CHOICE": return payload.options.filter((option) => option.isCorrect).length === 1;
    case "MULTIPLE_CHOICE": return payload.options.filter((option) => option.isCorrect).length >= 2;
    case "CONTEXT": case "ODD_ONE_OUT": case "CAUSE_EFFECT": case "DEFINITION": return payload.options.filter((option) => option.isCorrect).length === 1;
    default: return false;
  }
}
