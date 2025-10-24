import { Message } from "../types/message"
import { ball } from "../components/utils/data";

export const info = {
  command: "8ball",
  description: "Ask the magic 8-ball a question.",
  usage: "8ball <question>",
  example: "8ball Will I win the lottery?",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {
  if (!/^8ball\b/i.test(msg.body)) return;

  const response = ball[Math.floor(Math.random() * ball.length)];
  await msg.reply(response);
}
