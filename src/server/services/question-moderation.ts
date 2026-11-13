import { db } from "@/server/db/client";
import { isLikelyDuplicate } from "@/server/services/question-deduplication";

export async function approveQuestion(id: string) {
  const question = await db.question.findUnique({ where: { id }, select: { id: true, topicId: true, textRu: true, status: true } });
  if (!question || question.status !== "DRAFT") throw new Error("QUESTION_NOT_DRAFT");
  const approved = await db.question.findMany({ where: { topicId: question.topicId, status: "APPROVED", id: { not: question.id } }, select: { id: true, textRu: true }, take: 500 });
  const duplicate = approved.find((candidate) => isLikelyDuplicate(question.textRu, candidate.textRu));
  if (duplicate) throw new Error(`LIKELY_DUPLICATE:${duplicate.id}`);
  return db.question.update({ where: { id }, data: { status: "APPROVED" } });
}
export async function rejectQuestion(id: string) { return db.question.update({ where: { id }, data: { status: "REJECTED" } }); }
