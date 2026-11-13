import { z } from "zod";

export const createTrainingSessionSchema = z.object({ topicId: z.string().cuid(), questionCount: z.number().int().min(1).max(50).default(10) });
