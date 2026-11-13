import type { z } from "zod";
import type { LlmProvider } from "@/server/llm/provider";

export async function generateValidated<T>(provider: LlmProvider, schema: z.ZodType<T>, request: Parameters<LlmProvider["generate"]>[0], retries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) { try { return schema.parse(await provider.generate(request)); } catch (error) { lastError = error; } }
  throw new Error(`LLM returned invalid ${request.schemaName}: ${lastError instanceof Error ? lastError.message : "unknown error"}`);
}
