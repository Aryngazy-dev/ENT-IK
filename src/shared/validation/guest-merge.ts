import { z } from "zod";
export const guestMergeSchema = z.object({ mergeId: z.string().uuid(), topics: z.array(z.object({ topicId: z.string().cuid(), answeredCount: z.number().int().min(0).max(100000), correctCount: z.number().int().min(0).max(100000), lastReviewedAt: z.coerce.date().optional() }).refine((item) => item.correctCount <= item.answeredCount)).max(500) });
