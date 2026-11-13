import { processNextGenerationJob } from "@/server/services/generation-queue";

async function run() { while (true) { const job = await processNextGenerationJob(); if (!job) await new Promise((resolve) => setTimeout(resolve, 2_000)); } }
void run();
