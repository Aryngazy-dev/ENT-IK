import { z } from "zod";
import { assertCorrectOptionCount, questionPayloadSchema } from "@/shared/question-types/schema";

const questionType = z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "CONTEXT", "CHRONOLOGY", "MATCHING", "ODD_ONE_OUT", "TRUE_FALSE", "CAUSE_EFFECT", "MAP_CLICK", "DEFINITION"]);

export const questionInputSchema = z.object({
  topicId: z.string().cuid(), subtopicId: z.string().cuid().optional(), sourceMaterialId: z.string().cuid().optional(), groupId: z.string().cuid().optional(), mediaAssetId: z.string().cuid().optional(),
  type: questionType, difficulty: z.enum(["EASY", "MEDIUM", "HARD"]), status: z.enum(["DRAFT", "APPROVED", "REJECTED", "ARCHIVED"]).default("DRAFT"),
  textRu: z.string().trim().min(10).max(4000), textKk: z.string().trim().min(10).max(4000).optional(), contextRu: z.string().trim().max(10000).optional(), contextKk: z.string().trim().max(10000).optional(),
  explanationRu: z.string().trim().min(10).max(10000), explanationKk: z.string().trim().min(10).max(10000).optional(), tags: z.array(z.string().trim().min(1).max(64)).max(15).default([]),
  imageRole: z.enum(["PROMPT", "OPTION", "EXPLANATION"]).optional(), interactionType: z.enum(["NONE", "SELECT_MARKER", "CLICK_REGION", "CLICK_MARKER", "LABEL_MARKERS"]).default("NONE"), payload: questionPayloadSchema,
}).superRefine((value, context) => {
  if (!assertCorrectOptionCount(value.payload)) context.addIssue({ code: "custom", path: ["payload"], message: "Неверное число правильных вариантов" });
  if (value.payload.kind !== value.type) context.addIssue({ code: "custom", path: ["type"], message: "Тип вопроса не совпадает с payload" });
});
