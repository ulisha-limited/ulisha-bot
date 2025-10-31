import { Message } from "../types/message";
import { Command, commands } from "../components/utils/cmd/loader";
import redis from "../components/redis";
import { loginUser, pendingUser } from "../components/services/user";
import crypto from "crypto";

function generateLoginCode(length: number = 8): string {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(length);
  let result = "";

  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }

  return result;
}

export const info: Command = {
  command: "login",
  description: "Login to Ulisha Store.",
  usage: "login",
  example: "login",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {
  const jid = msg.author ?? msg.from;
  const lid = jid.split("@")[0];

  const isLogin = await loginUser(lid);
  if (isLogin) {
    await msg.reply("You are already loggedin.");
    return;
  }

  // initiate pending login
  const hasPendingLogin: { code: string } | null = await pendingUser(lid);
  if (hasPendingLogin) {
    await msg.reply(
      `
      \`${hasPendingLogin.code}\`

      The code is only available for a few minutes.
      www.ulishastore.com/my-account
    `,
      undefined,
      {
        linkPreview: true,
      },
    );
    return;
  }

  const generatedCode = generateLoginCode(8);
  await redis.set(
    `pending-user:${lid}`,
    JSON.stringify({ code: generatedCode }),
    {
      expiration: {
        type: "EX",
        value: 900, // 15 minutes
      },
    },
  );
  await msg.reply(
    `
    \`${generatedCode}\`

    The code is only available for a few minutes.
    www.ulishastore.com/my-account
  `,
    undefined,
    {
      linkPreview: true,
    },
  );
}
