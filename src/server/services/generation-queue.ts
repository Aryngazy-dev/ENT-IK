import { Prisma } from "@prisma/client";
import { db } from "@/server/db/client";
import { generateQuestionDrafts } from "@/server/services/ai-generation";

export async function enqueueGeneration(sourceMaterialId: string, requestedById: string, maximumQuestions: number) {
  return db.generationJob.create({ data: { sourceMaterialId, requestedById, maximumQuestions } });
}

export async function processGenerationJob(jobId: string) {
  const claimed = await db.generationJob.updateMany({ where: { id: jobId, status: "QUEUED" }, data: { status: "RUNNING", lockedAt: new Date(), attempts: { increment: 1 }, error: null } });
  if (!claimed.count) return null;
  const job = await db.generationJob.findUniqueOrThrow({ where: { id: jobId } });
  try { const result = await generateQuestionDrafts(job.sourceMaterialId, job.maximumQuestions); return await db.generationJob.update({ where: { id: job.id }, data: { status: "COMPLETED", result: result as Prisma.InputJsonValue } }); }
  catch (error) { return db.generationJob.update({ where: { id: job.id }, data: { status: "FAILED", error: error instanceof Error ? error.message : "Unknown error" } }); }
}

/** The worker runner can be invoked by a scheduled process or a separate service. */
export async function processNextGenerationJob() {
  const job = await db.generationJob.findFirst({ where: { status: "QUEUED" }, orderBy: { createdAt: "asc" } });
  return job ? processGenerationJob(job.id) : null;
}
