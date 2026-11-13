import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import { getLlmProvider } from "@/server/llm/provider";
import { generateValidated } from "@/server/llm/json";
import { factsResponseSchema, generatedQuestionsResponseSchema, verificationResponseSchema } from "@/shared/ai/schema";
import { factExtractionPrompt } from "@/prompts/fact-extraction";
import { questionGenerationPrompt } from "@/prompts/question-generation";
import { verificationPrompt } from "@/prompts/verification";
import { findVectorDuplicates, saveQuestionEmbedding } from "@/server/llm/embeddings";

export async function generateQuestionDrafts(sourceMaterialId: string, maximumQuestions: number): Promise<{ created: number; rejected: number }> {
  const material = await db.sourceMaterial.findUnique({ where: { id: sourceMaterialId }, include: { topic: true } });
  if (!material?.topic) throw new Error("MATERIAL_OR_TOPIC_NOT_FOUND");
  const provider = getLlmProvider();
  const facts = await generateValidated(provider, factsResponseSchema, { system: "Ты возвращаешь исключительно JSON без Markdown.", schemaName: "facts", prompt: factExtractionPrompt(material.rawText) });
  let created = 0; let rejected = 0;
  for (const fact of facts.facts) {
    if (created >= maximumQuestions) break;
    const proposed = await generateValidated(provider, generatedQuestionsResponseSchema, { system: "Ты возвращаешь исключительно JSON без Markdown.", schemaName: "questions", prompt: questionGenerationPrompt(fact.statement, fact.evidence, material.rawText) });
    for (const question of proposed.questions) {
      if (created >= maximumQuestions) break;
      const verification = await generateValidated(provider, verificationResponseSchema, { system: "Ты возвращаешь исключительно JSON без Markdown.", schemaName: "verification", prompt: verificationPrompt(JSON.stringify(question), material.rawText) });
      if (!verification.approved) { rejected += 1; continue; }
      const correct = question.options.filter((option) => option.isCorrect); if ((question.type === "MULTIPLE_CHOICE" && correct.length < 2) || (question.type !== "MULTIPLE_CHOICE" && correct.length !== 1)) { rejected += 1; continue; }
      const vectorDuplicates = process.env.AI_PROVIDER === "openai" ? await findVectorDuplicates(question.textRu) : [];
      if (vectorDuplicates.length) { rejected += 1; continue; }
      const group = await db.questionGroup.create({ data: { factKey: fact.statement } });
      const createdQuestion = await db.question.create({ data: { topicId: material.topicId!, sourceMaterialId: material.id, groupId: group.id, type: question.type, difficulty: question.difficulty, status: "DRAFT", origin: "AI", textRu: question.textRu, contextRu: question.contextRu, explanationRu: question.explanationRu, payload: { kind: question.type, options: question.options.map((option, index) => ({ id: `generated-${index}`, ...option })) } as Prisma.InputJsonValue, tags: ["ai", "verified"], options: { create: question.options.map((option, sortOrder) => ({ contentRu: option.contentRu, isCorrect: option.isCorrect, sortOrder })) }, variants: { create: question.variantsRu.map((text) => ({ language: "RU", text })) } } });
      if (process.env.AI_PROVIDER === "openai") await saveQuestionEmbedding(createdQuestion.id, createdQuestion.textRu);
      created += 1;
    }
  }
  return { created, rejected };
}
