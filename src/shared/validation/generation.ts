import { z } from "zod";
export const generationRequestSchema = z.object({ sourceMaterialId: z.string().cuid(), maximumQuestions: z.number().int().min(1).max(50).default(10) });
