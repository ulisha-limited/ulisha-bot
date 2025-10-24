import { Message } from "../types/message";
import { quiz } from "../components/utils/data";
import log from "../components/utils/log";
import redis from "../components/redis";

export const info = {
  command: "quiz",
  description: "Get a random quiz question.",
  usage: "quiz",
  example: "quiz",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {
  const id = Math.floor(Math.random() * quiz.length);
  const response = quiz[id];

  let text = `
    \`${response.question}\`
  `;

  if (response.choices && response.choices.length > 0) {
    text += `
    *Options:*
    ${response.choices
      .map((choice: string, index: number) => `${index + 1}. ${choice}`)
      .join("\n    ")}
    `;
  }

  const messageReturn = await msg.reply(text);
  await redis.set(
    `quiz:${messageReturn.id.id}`,
    JSON.stringify({ quiz_id: id.toString() }),
    {
      expiration: {
        type: "EX",
        value: 3600, // 1 hour
      },
    },
  );
}
