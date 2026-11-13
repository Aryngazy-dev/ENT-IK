import { z } from "zod";

export const extractedFactSchema = z.object({ id: z.string().min(1), statement: z.string().min(10), evidence: z.string().min(10), entities: z.array(z.string()).max(10), dates: z.array(z.string()).max(10) });
export const factsResponseSchema = z.object({ facts: z.array(extractedFactSchema).max(100) });
export const generatedQuestionSchema = z.object({ type: z.enum(["SINGLE_CHOICE", "MULTIPLE_CHOICE", "CONTEXT", "ODD_ONE_OUT", "CAUSE_EFFECT", "DEFINITION"]), difficulty: z.enum(["EASY", "MEDIUM", "HARD"]), textRu: z.string().min(10), contextRu: z.string().optional(), options: z.array(z.object({ contentRu: z.string().min(1), isCorrect: z.boolean() })).min(4).max(6), explanationRu: z.string().min(10), sourceEvidence: z.string().min(10), variantsRu: z.array(z.string().min(10)).min(3).max(5) });
export const generatedQuestionsResponseSchema = z.object({ questions: z.array(generatedQuestionSchema).max(50) });
export const verificationResponseSchema = z.object({ approved: z.boolean(), reasons: z.array(z.string()).max(10), unsupportedClaims: z.array(z.string()).max(20) });
