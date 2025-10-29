import { Message } from "../types/message";
import { Command, commands } from "../components/utils/cmd/loader";
import redis from "../components/redis"

export const info: Command = {
  command: "login",
  description: "Login to Ulisha Store.",
  usage: "login",
  example: "login",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {

}
