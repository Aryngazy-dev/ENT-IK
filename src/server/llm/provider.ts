export type LlmRequest = { system: string; prompt: string; schemaName: string };
export interface LlmProvider { generate(request: LlmRequest): Promise<unknown>; }

class OpenAiProvider implements LlmProvider {
  async generate(request: LlmRequest): Promise<unknown> {
    const key = process.env.OPENAI_API_KEY; if (!key) throw new Error("OPENAI_API_KEY is not configured");
    const response = await fetch("https://api.openai.com/v1/chat/completions", { method: "POST", headers: { authorization: `Bearer ${key}`, "content-type": "application/json" }, body: JSON.stringify({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: request.system }, { role: "user", content: request.prompt }] }) });
    if (!response.ok) throw new Error(`OpenAI error ${response.status}`);
    const body = await response.json() as { choices?: { message?: { content?: string } }[] };
    return JSON.parse(body.choices?.[0]?.message?.content ?? "{}");
  }
}
class AnthropicProvider implements LlmProvider {
  async generate(request: LlmRequest): Promise<unknown> {
    const key = process.env.ANTHROPIC_API_KEY; if (!key) throw new Error("ANTHROPIC_API_KEY is not configured");
    const response = await fetch("https://api.anthropic.com/v1/messages", { method: "POST", headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" }, body: JSON.stringify({ model: process.env.ANTHROPIC_MODEL ?? "claude-3-5-haiku-latest", max_tokens: 8000, system: request.system, messages: [{ role: "user", content: `${request.prompt}\n\nОтветь только валидным JSON.` }] }) });
    if (!response.ok) throw new Error(`Anthropic error ${response.status}`);
    const body = await response.json() as { content?: { text?: string }[] };
    return JSON.parse(body.content?.[0]?.text ?? "{}");
  }
}
export function getLlmProvider(): LlmProvider { const provider = process.env.AI_PROVIDER ?? "mock"; if (provider === "openai") return new OpenAiProvider(); if (provider === "anthropic") return new AnthropicProvider(); throw new Error("AI_PROVIDER must be openai or anthropic to run generation"); }
