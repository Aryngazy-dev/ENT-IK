import { describe, expect, it } from "vitest";
import { answerSubmissionSchema } from "@/shared/validation/progress";

describe("progress submission", () => {
  const value = { clientEventId: "550e8400-e29b-41d4-a716-446655440000", sessionId: "clx1234567890123456789012", questionId: "clx1234567890123456789013", optionIds: ["option-a"], elapsedSeconds: 12, occurredAt: "2026-11-08T10:00:00Z" };
  it("accepts an idempotent answer event", () => expect(answerSubmissionSchema.safeParse(value).success).toBe(true));
  it("rejects a missing client event ID", () => expect(answerSubmissionSchema.safeParse({ ...value, clientEventId: "" }).success).toBe(false));
});
