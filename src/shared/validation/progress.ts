import { z } from "zod";

export const answerSubmissionSchema = z.object({
  clientEventId: z.string().uuid(), sessionId: z.string().cuid(), questionId: z.string().cuid(),
  optionIds: z.array(z.string().min(1)).max(8).default([]), orderedIds: z.array(z.string().min(1)).max(10).optional(), matches: z.array(z.object({ leftId: z.string().min(1), rightId: z.string().min(1) })).max(10).optional(), truths: z.array(z.object({ id: z.string().min(1), value: z.boolean() })).max(10).optional(), point: z.object({ x: z.number().min(0).max(100), y: z.number().min(0).max(100) }).optional(), elapsedSeconds: z.number().int().min(0).max(60 * 60), occurredAt: z.coerce.date(),
});
