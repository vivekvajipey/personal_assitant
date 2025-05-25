// src/index.ts
import { generateReply } from "./llm";

export interface Env {
  TELEGRAM_BOT_TOKEN: string;
  OPENAI_API_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  BOT_NAME?: string;
  MODEL?: "openai" | "anthropic";
}

export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    if (req.method !== "POST") {
      return new Response("arthur is awake");
    }

    try {
      const update = await req.json<any>();
      console.log("Received update:", JSON.stringify(update));
      
      const text = update?.message?.text ?? "";
      const chatId = update?.message?.chat?.id;

      if (!text || !chatId) {
        console.log("No text or chatId found");
        return new Response("ok");
      }

      console.log(`Processing message: "${text}" from chat ${chatId}`);

      const reply = await generateReply(text, {
        model: env.MODEL ?? "openai",
        openaiKey: env.OPENAI_API_KEY,
        anthropicKey: env.ANTHROPIC_API_KEY,
        botName: env.BOT_NAME
      });

      console.log(`Generated reply: "${reply}"`);

      await fetch(
        `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: chatId, text: reply })
        }
      );

      console.log("Message sent successfully");
      return new Response("ok");
    } catch (error) {
      console.error("Error processing request:", error);
      return new Response("error", { status: 500 });
    }
  }
};