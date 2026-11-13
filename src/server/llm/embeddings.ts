import { db } from "@/server/db/client";
import { examConfig } from "@/shared/config/exam";

export interface EmbeddingProvider { embed(text: string): Promise<number[]>; }
class OpenAiEmbeddingProvider implements EmbeddingProvider {
  async embed(text: string): Promise<number[]> { const key = process.env.OPENAI_API_KEY; if (!key) throw new Error("OPENAI_API_KEY is not configured"); const response = await fetch("https://api.openai.com/v1/embeddings", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_EMBEDDING_MODEL ?? "text-embedding-3-small", input: text }) }); if (!response.ok) throw new Error(`Embedding API error ${response.status}`); const body = await response.json() as { data?: { embedding?: number[] }[] }; const vector = body.data?.[0]?.embedding; if (!vector) throw new Error("Embedding missing from response"); return vector; }
}
export function getEmbeddingProvider(): EmbeddingProvider { if ((process.env.AI_PROVIDER ?? "") === "openai") return new OpenAiEmbeddingProvider(); throw new Error("Embeddings require AI_PROVIDER=openai"); }
export async function saveQuestionEmbedding(questionId: string, text: string): Promise<void> { const vector = await getEmbeddingProvider().embed(text); await db.$executeRawUnsafe(`UPDATE "Question" SET embedding = $1::vector WHERE id = $2`, `[${vector.join(",")}]`, questionId); }
export async function findVectorDuplicates(text: string): Promise<{ id: string; similarity: number }[]> { const vector = await getEmbeddingProvider().embed(text); return db.$queryRawUnsafe<{ id: string; similarity: number }[]>(`SELECT id, 1 - (embedding <=> $1::vector) AS similarity FROM "Question" WHERE embedding IS NOT NULL AND 1 - (embedding <=> $1::vector) >= $2 ORDER BY similarity DESC LIMIT 5`, `[${vector.join(",")}]`, examConfig.duplicateSimilarityThreshold); }
