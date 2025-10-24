import { Message } from "../types/message"
import { joke } from "../components/utils/data";

export const info = {
  command: "joke",
  description: "Get a random joke.",
  usage: "joke",
  example: "joke",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {
  const response = joke[Math.floor(Math.random() * joke.length)];
  await msg.reply(response);
}
