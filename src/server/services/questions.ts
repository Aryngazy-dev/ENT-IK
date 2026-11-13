import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import type { z } from "zod";
import type { questionInputSchema } from "@/shared/validation/question";

type QuestionInput = z.infer<typeof questionInputSchema>;
function optionsFrom(input: QuestionInput) {
  const payload = input.payload;
  switch (payload.kind) {
    case "SINGLE_CHOICE": case "MULTIPLE_CHOICE": case "CONTEXT": case "ODD_ONE_OUT": case "CAUSE_EFFECT": case "DEFINITION":
      return payload.options.map((option, sortOrder) => ({ contentRu: option.contentRu, contentKk: option.contentKk, isCorrect: option.isCorrect, sortOrder }));
    default: return [];
  }
}
export async function createQuestion(input: QuestionInput) {
  const { payload, ...data } = input;
  return db.question.create({ data: { ...data, payload: payload as unknown as Prisma.InputJsonValue, origin: "MANUAL", options: { create: optionsFrom(input) } }, include: { options: { orderBy: { sortOrder: "asc" } } } });
}
export async function updateQuestion(id: string, input: QuestionInput) {
  const { payload, ...data } = input;
  return db.$transaction(async (transaction) => { await transaction.questionOption.deleteMany({ where: { questionId: id } }); return transaction.question.update({ where: { id }, data: { ...data, payload: payload as unknown as Prisma.InputJsonValue, options: { create: optionsFrom(input) } }, include: { options: { orderBy: { sortOrder: "asc" } } } }); });
}
