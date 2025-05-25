// src/index.ts
import { OpenAI } from "openai";
import Anthropic from "@anthropic-ai/sdk";
 
export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  OPENAI_API_KEY?:   string;
  ANTHROPIC_API_KEY?: string;
  BOT_NAME?:         string;
  MODEL?:            "openai" | "anthropic";
}

/* ─────────  Worker entry point  ───────── */
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("arthur is awake");
    }

    // Telegram → Worker
    const update = await req.json<any>();
    const text   = update?.message?.text ?? "";
    const chatId = update?.message?.chat?.id;

    /* ---- build the prompt Arthur always uses ---- */
    const system  =
      `you are ${env.BOT_NAME ?? "arthur"}, a friend who always talks in ` +
      `all lowercase and sends very short messages.`;

    const messages =
      env.MODEL === "anthropic"
        ? /* Claude format: system, then { role, content }[] */
          [{ role: "user", content: text }]
        : /* OpenAI format: [{ role, content } ... ] */
          [
            { role: "system", content: system },
            { role: "user",   content: text  }
          ];

    /* ---- call whichever model the secret selects ---- */
    let reply = "hmm, something went wrong";

    if (env.MODEL === "anthropic") {
      /* SDK version — remove try/catch clutter for brevity */
      const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY! });

      const res = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        system,
        messages,
        max_tokens: 100,
        temperature: 0.7
      });
      reply = res.content[0].text.trim();
    } else {
      /* default to OpenAI */
      const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY! });

      const res = await openai.chat.completions.create({
        model: "gpt-4o-2024-11-20",
        messages: messages as any,
        max_tokens: 100,
        temperature: 0.7
      });
      reply = res.choices[0].message.content.trim();
    }

    /* ---- send it back to Telegram ---- */
    await fetch(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: reply })
      }
    );

    /* Telegram only needs a 200 OK quickly */
    return new Response("ok");
  }
};