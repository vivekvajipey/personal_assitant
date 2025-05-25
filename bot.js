import dotenv from 'dotenv';
import TelegramBot from 'node-telegram-bot-api';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

dotenv.config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true });

let openai, anthropic;

if (process.env.MODEL === 'openai') {
    openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
    });
}
if (process.env.MODEL === 'anthropic') {
    anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
    });
}

bot.on('message', async (msg) => {
  // Ignore service messages (user joined, etc.)
  if (!msg.text) return;

  const chatId = msg.chat.id;

  const prompt = [
    { role: 'system',
      content: `You are ${process.env.BOT_NAME || 'Arthur'}, a friend that always talks in all lowercase and sends very short messages.` },
    { role: 'user', content: msg.text }
  ];

  try {
    let reply;
    
    if (process.env.MODEL === 'openai') {
        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-2024-11-20',
            messages: prompt,
            temperature: 0.7,
            max_tokens: 100
        });
        reply = completion.choices[0].message.content.trim();
    } else if (process.env.MODEL === 'anthropic') {
        const completion = await anthropic.messages.create({
            model: 'claude-sonnet-4-20250514',
            messages: prompt.slice(1),
            system: prompt[0].content,
            max_tokens: 100,
            temperature: 0.7
        });
        reply = completion.content[0].text.trim();
    }
    
    await bot.sendMessage(chatId, reply);
    console.log(`[${chatId}] ${msg.text} → ${reply}`);
  } catch (err) {
    console.error(err);
    await bot.sendMessage(chatId,
        "sorry, arthur is having trouble reaching his brain right now.");
  }
});