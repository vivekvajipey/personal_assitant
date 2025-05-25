import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";

export interface LLMConfig {
  model: "openai" | "anthropic";
  openaiKey?: string;
  anthropicKey?: string;
  botName?: string;
}

export async function generateReply(text: string, config: LLMConfig): Promise<string> {
  const systemPrompt = `you are ${config.botName ?? "arthur"}, a friend who always talks in all lowercase and sends very short messages.`;

  if (config.model === "anthropic") {
    return generateAnthropicReply(text, systemPrompt, config.anthropicKey!);
  } else {
    return generateOpenAIReply(text, systemPrompt, config.openaiKey!);
  }
}

async function generateAnthropicReply(text: string, system: string, apiKey: string): Promise<string> {
  const anthropic = new Anthropic({ apiKey });
  const messages = [{ role: "user" as const, content: text }];

  const res = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    system,
    messages,
    max_tokens: 100,
    temperature: 0.7
  });

  const textBlock = res.content.find(block => block.type === 'text');
  if (textBlock && textBlock.type === 'text') {
    return textBlock.text.trim();
  }
  
  return "hmm, something went wrong with claude";
}

async function generateOpenAIReply(text: string, system: string, apiKey: string): Promise<string> {
  const openai = new OpenAI({ apiKey });
  const messages = [
    { role: "system" as const, content: system },
    { role: "user" as const, content: text }
  ];

  const res = await openai.chat.completions.create({
    model: "gpt-4o-2024-11-20",
    messages,
    max_tokens: 100,
    temperature: 0.7
  });

  return res.choices[0]?.message?.content?.trim() ?? "sorry, got no response from gpt";
} 