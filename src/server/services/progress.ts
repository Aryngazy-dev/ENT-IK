import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import { questionPayloadSchema } from "@/shared/question-types/schema";
import { scoreAnswer } from "@/shared/scoring/answers";
import { isPointInPolygon, isWithinMarkerRadius } from "@/server/services/map-geometry";
import type { z } from "zod";
import type { answerSubmissionSchema } from "@/shared/validation/progress";

type AnswerSubmission = z.infer<typeof answerSubmissionSchema>;
export type PersistAnswerResult = { isCorrect: boolean; duplicate: boolean; revealCorrectness: boolean };

export async function persistAnswer(userId: string, input: AnswerSubmission): Promise<PersistAnswerResult> {
  return db.$transaction(async (transaction) => {
    const duplicate = await transaction.attempt.findUnique({ where: { clientEventId: input.clientEventId }, include: { session: { select: { mode: true } } } });
    if (duplicate) return { isCorrect: duplicate.isCorrect ?? false, duplicate: true, revealCorrectness: duplicate.session.mode === "TRAINING" || duplicate.session.mode === "MISTAKES" };
    const session = await transaction.testSession.findFirst({ where: { id: input.sessionId, userId, status: "ACTIVE" } });
    if (!session || (session.expiresAt && session.expiresAt <= new Date())) throw new Error("SESSION_UNAVAILABLE");
    const assigned = await transaction.sessionQuestion.findFirst({ where: { sessionId: session.id, questionId: input.questionId } });
    if (!assigned) throw new Error("QUESTION_NOT_ASSIGNED");
    const question = await transaction.question.findUnique({ where: { id: input.questionId }, select: { id: true, topicId: true, payload: true, mediaAssetId: true } });
    if (!question) throw new Error("QUESTION_NOT_FOUND");
    const payload = questionPayloadSchema.parse(question.payload);
    let isCorrect = scoreAnswer(payload, { optionIds: input.optionIds, orderedIds: input.orderedIds, matches: input.matches, truths: input.truths });
    if (payload.kind === "MAP_CLICK") {
      if (!input.point || !question.mediaAssetId) throw new Error("MAP_POINT_REQUIRED");
      if (payload.target.type === "marker") { const marker = await transaction.mapMarker.findFirst({ where: { id: payload.target.id, mapAsset: { mediaAssetId: question.mediaAssetId } } }); isCorrect = Boolean(marker && isWithinMarkerRadius(input.point, { x: Number(marker.x), y: Number(marker.y) }, 3)); }
      else { const region = await transaction.mapRegion.findFirst({ where: { id: payload.target.id, mapAsset: { mediaAssetId: question.mediaAssetId } } }); const coordinates = region?.geometry as { coordinates?: [number, number][] } | null; isCorrect = Boolean(coordinates?.coordinates && isPointInPolygon(input.point, coordinates.coordinates.map(([x, y]) => ({ x, y })))); }
    }
    await transaction.attempt.create({ data: { clientEventId: input.clientEventId, sessionId: input.sessionId, questionId: input.questionId, userId, answer: { optionIds: input.optionIds, orderedIds: input.orderedIds, matches: input.matches, truths: input.truths, point: input.point } as Prisma.InputJsonValue, isCorrect, elapsedSeconds: input.elapsedSeconds, answeredAt: input.occurredAt } });
    await transaction.progressEvent.create({ data: { clientEventId: `progress-${input.clientEventId}`, userId, type: "ANSWERED", payload: { sessionId: input.sessionId, questionId: input.questionId, isCorrect } as Prisma.InputJsonValue, occurredAt: input.occurredAt } });
    const current = await transaction.userProgress.findUnique({ where: { userId_topicId: { userId, topicId: question.topicId } } });
    const answeredCount = (current?.answeredCount ?? 0) + 1; const correctCount = (current?.correctCount ?? 0) + Number(isCorrect); const ratio = correctCount / answeredCount;
    const nextReviewAt = new Date(input.occurredAt); nextReviewAt.setUTCDate(nextReviewAt.getUTCDate() + (isCorrect ? ratio >= .8 ? 7 : 2 : 1));
    await transaction.userProgress.upsert({ where: { userId_topicId: { userId, topicId: question.topicId } }, create: { userId, topicId: question.topicId, answeredCount, correctCount, mastery: ratio >= 0.8 && answeredCount >= 10 ? "CONSOLIDATED" : "LEARNING", lastReviewedAt: input.occurredAt, nextReviewAt }, update: { answeredCount, correctCount, mastery: ratio >= 0.8 && answeredCount >= 10 ? "CONSOLIDATED" : "LEARNING", lastReviewedAt: input.occurredAt, nextReviewAt } });
    const day = new Date(Date.UTC(input.occurredAt.getUTCFullYear(), input.occurredAt.getUTCMonth(), input.occurredAt.getUTCDate()));
    await transaction.dailyActivity.upsert({ where: { userId_day: { userId, day } }, create: { userId, day, answers: 1 }, update: { answers: { increment: 1 } } });
    return { isCorrect, duplicate: false, revealCorrectness: session.mode === "TRAINING" || session.mode === "MISTAKES" };
  });
}
