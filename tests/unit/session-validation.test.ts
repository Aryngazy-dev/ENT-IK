import { describe, expect, it } from "vitest";
import { createTrainingSessionSchema } from "@/shared/validation/session";
describe("training session validation", () => {
  it("limits a training session to fifty questions", () => expect(createTrainingSessionSchema.safeParse({ topicId: "clx1234567890123456789012", questionCount: 51 }).success).toBe(false));
  it("accepts a bounded request", () => expect(createTrainingSessionSchema.safeParse({ topicId: "clx1234567890123456789012", questionCount: 10 }).success).toBe(true));
});
