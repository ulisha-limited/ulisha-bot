import { Message } from "../types/message";
import { client } from "../components/client";
import log from "../components/utils/log";
import redis from "../components/redis";
import { isAdmin, logoutUser } from "../components/services/user";

export const info = {
  command: "logout",
  description: "Log out your ulisha store account.",
  usage: "logout --client",
  example: "logout [--client]",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {
  const match = /^logout(?:\s+--client)?$/i.exec(msg.body.trim());
  if (!match) return;
  const logoutClient = msg.body.includes("--client");

  const jid = msg.author ?? msg.from;
  const lid = jid.split("@")[0];
  const isLogout = await logoutUser(lid);
  if (!logoutClient && !isLogout) return;
  if (!logoutClient) await msg.reply("You have been logout.");

  if (!logoutClient) return;

  const admin = await isAdmin(lid);
  if (!admin) return;

  try {
    (await client()).logout();
    log.info("Logout", "Client logged out successfully.");
  } catch (error) {
    log.error("Logout", "Failed to log out the client.", error);
    await msg.reply("An error occurred while trying to log out.");
  }
}
