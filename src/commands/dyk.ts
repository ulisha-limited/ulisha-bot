import { Message } from "../types/message"
import { dyk } from "../components/utils/data";

export const info = {
  command: "dyk",
  description: "Did you know? Get a random trivia.",
  usage: "dyk",
  example: "dyk",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {
  const response = dyk[Math.floor(Math.random() * dyk.length)];
  await msg.reply(response);
}
