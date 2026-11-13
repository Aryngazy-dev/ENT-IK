import { db } from "@/server/db/client";
import { shuffledOptions } from "@/shared/scoring/answers";
import { examConfig } from "@/shared/config/exam";
import type { z } from "zod";
import type { createTrainingSessionSchema } from "@/shared/validation/session";

type CreateTrainingSession = z.infer<typeof createTrainingSessionSchema>;
type SafeOption = { id: string; contentRu: string; contentKk: string | null; mediaAssetId: string | null };
type SafeMedia = { url: string; altRu: string; captionRu: string | null; type: string };
export type SafeSessionQuestion = { ordinal: number; questionId: string; variantId: string | null; markedForReview: boolean; type: string; textRu: string; textKk: string | null; contextRu: string | null; contextKk: string | null; media: SafeMedia | null; interaction: { kind: "CHRONOLOGY"; items: { id: string; contentRu: string }[] } | { kind: "MATCHING"; left: { id: string; contentRu: string }[]; right: { id: string; contentRu: string }[] } | { kind: "TRUE_FALSE"; statements: { id: string; contentRu: string }[] } | null; options: SafeOption[] };

export async function createTrainingSession(userId: string, input: CreateTrainingSession) {
  const candidates = await db.question.findMany({ where: { topicId: input.topicId, status: "APPROVED" }, take: input.questionCount * 3, include: { variants: { where: { language: "RU" } }, options: true } });
  const selected = shuffledOptions(candidates).slice(0, input.questionCount);
  if (selected.length < input.questionCount) throw new Error("NOT_ENOUGH_QUESTIONS");
  return db.testSession.create({ data: { userId, mode: "TRAINING", title: "Тренировка по теме", questions: { create: selected.map((question, ordinal) => ({ questionId: question.id, variantId: question.variants.length ? shuffledOptions(question.variants)[0].id : undefined, ordinal })) } }, include: { questions: { orderBy: { ordinal: "asc" } } } });
}

export async function createMockExamSession(userId: string) {
  const candidates = await db.question.findMany({ where: { status: "APPROVED" }, take: examConfig.mockExam.questions * 3, include: { variants: { where: { language: "RU" } } } });
  const selected = shuffledOptions(candidates).slice(0, examConfig.mockExam.questions);
  if (selected.length < examConfig.mockExam.questions) throw new Error("NOT_ENOUGH_QUESTIONS");
  const expiresAt = new Date(Date.now() + examConfig.mockExam.durationMinutes * 60_000);
  return db.testSession.create({ data: { userId, mode: "MOCK_EXAM", title: "Пробный ЕНТ: История Казахстана", expiresAt, questions: { create: selected.map((question, ordinal) => ({ questionId: question.id, variantId: question.variants.length ? shuffledOptions(question.variants)[0].id : undefined, ordinal })) } } });
}

export async function createMistakesSession(userId: string, questionCount = 10) {
  const attempts = await db.attempt.findMany({ where: { userId, isCorrect: false, question: { status: "APPROVED" } }, orderBy: { answeredAt: "desc" }, include: { question: { include: { variants: { where: { language: "RU" } } } } }, take: questionCount * 5 });
  const unique = [...new Map(attempts.map((attempt) => [attempt.questionId, attempt.question])).values()].slice(0, questionCount);
  if (unique.length === 0) throw new Error("NO_MISTAKES");
  return db.testSession.create({ data: { userId, mode: "MISTAKES", title: "Работа над ошибками", questions: { create: unique.map((question, ordinal) => ({ questionId: question.id, variantId: question.variants.length ? shuffledOptions(question.variants)[0].id : undefined, ordinal })) } } });
}

export async function createPersonSession(userId: string, personId: string, questionCount = 10) {
  const candidates = await db.question.findMany({ where: { status: "APPROVED", persons: { some: { personId } } }, take: questionCount * 3, include: { variants: { where: { language: "RU" } } } });
  const selected = shuffledOptions(candidates).slice(0, questionCount); if (!selected.length) throw new Error("NO_PERSON_QUESTIONS");
  return db.testSession.create({ data: { userId, mode: "PERSONS", title: "Тренажёр по личности", questions: { create: selected.map((question, ordinal) => ({ questionId: question.id, variantId: question.variants.length ? shuffledOptions(question.variants)[0].id : undefined, ordinal })) } } });
}

export async function createSmartReviewSession(userId: string, questionCount = 10) {
  const progress = await db.userProgress.findMany({ where: { userId, topicId: { not: null } }, orderBy: [{ nextReviewAt: "asc" }, { correctCount: "asc" }], take: 20 });
  const topicIds = progress.map((item) => item.topicId!).filter(Boolean);
  const candidates = await db.question.findMany({ where: { status: "APPROVED", topicId: { in: topicIds } }, take: questionCount * 5, include: { variants: { where: { language: "RU" } } } });
  const selected = shuffledOptions(candidates).slice(0, questionCount); if (!selected.length) throw new Error("NO_REVIEW_CONTENT");
  return db.testSession.create({ data: { userId, mode: "SMART_REVIEW", title: "Умное повторение", questions: { create: selected.map((question, ordinal) => ({ questionId: question.id, variantId: question.variants.length ? shuffledOptions(question.variants)[0].id : undefined, ordinal })) } } });
}

export async function getSafeSession(userId: string, sessionId: string): Promise<{ id: string; mode: string; title: string; startedAt: Date; expiresAt: Date | null; questions: SafeSessionQuestion[] } | null> {
  const session = await db.testSession.findFirst({ where: { id: sessionId, userId }, include: { questions: { orderBy: { ordinal: "asc" }, include: { variant: true, question: { include: { options: true, mediaAsset: { select: { storageKey: true, altRu: true, captionRu: true, type: true } } } } } } } });
  if (!session) return null;
  return { id: session.id, mode: session.mode, title: session.title, startedAt: session.startedAt, expiresAt: session.expiresAt, questions: session.questions.map((entry) => { const payload = questionPayloadSchema.parse(entry.question.payload); const interaction = payload.kind === "CHRONOLOGY" ? { kind: "CHRONOLOGY" as const, items: shuffledOptions(payload.items.map(({ id, contentRu }) => ({ id, contentRu }))) } : payload.kind === "MATCHING" ? { kind: "MATCHING" as const, left: payload.pairs.map(({ leftId: id, leftRu: contentRu }) => ({ id, contentRu })), right: shuffledOptions(payload.pairs.map(({ rightId: id, rightRu: contentRu }) => ({ id, contentRu }))) } : payload.kind === "TRUE_FALSE" ? { kind: "TRUE_FALSE" as const, statements: payload.statements.map(({ id, contentRu }) => ({ id, contentRu })) } : null; return { ordinal: entry.ordinal, questionId: entry.question.id, variantId: entry.variantId, markedForReview: entry.markedForReview, type: entry.question.type, textRu: entry.variant?.text ?? entry.question.textRu, textKk: entry.question.textKk, contextRu: entry.variant?.contextText ?? entry.question.contextRu, contextKk: entry.question.contextKk, media: entry.question.mediaAsset ? { url: `/uploads/${entry.question.mediaAsset.storageKey}`, altRu: entry.question.mediaAsset.altRu, captionRu: entry.question.mediaAsset.captionRu, type: entry.question.mediaAsset.type } : null, interaction, options: shuffledOptions(entry.question.options.map(({ id, contentRu, contentKk, mediaAssetId }) => ({ id, contentRu, contentKk, mediaAssetId }))) }; }) };
}

export async function completeSession(userId: string, sessionId: string) {
  const session = await db.testSession.findFirst({ where: { id: sessionId, userId } });
  if (!session) throw new Error("SESSION_NOT_FOUND");
  if (session.status === "COMPLETED") return session;
  return db.testSession.update({ where: { id: session.id }, data: { status: "COMPLETED", completedAt: new Date() } });
}

export async function getSessionResults(userId: string, sessionId: string) {
  const session = await db.testSession.findFirst({ where: { id: sessionId, userId, status: "COMPLETED" }, include: { questions: { orderBy: { ordinal: "asc" }, include: { question: { include: { options: { orderBy: { sortOrder: "asc" } } } } } }, attempts: { orderBy: { answeredAt: "desc" } } } });
  if (!session) return null;
  const latestByQuestion = new Map<string, typeof session.attempts[number]>();
  for (const attempt of session.attempts) if (!latestByQuestion.has(attempt.questionId)) latestByQuestion.set(attempt.questionId, attempt);
  const items = session.questions.map((entry) => { const attempt = latestByQuestion.get(entry.questionId); return { ordinal: entry.ordinal, questionId: entry.questionId, textRu: entry.question.textRu, explanationRu: entry.question.explanationRu, selectedOptionIds: (attempt?.answer as { optionIds?: string[] } | undefined)?.optionIds ?? [], isCorrect: attempt?.isCorrect ?? false, options: entry.question.options.map((option) => ({ id: option.id, contentRu: option.contentRu, isCorrect: option.isCorrect })) }; });
  const answered = items.filter((item) => item.selectedOptionIds.length > 0).length; const correct = items.filter((item) => item.isCorrect).length;
  return { id: session.id, title: session.title, total: items.length, answered, correct, scorePercent: items.length ? Math.round((correct / items.length) * 100) : 0, items };
}
