import { Message } from "../types/message";
import log from "../components/utils/log";
import agentHandler from "../components/ai/agentHandler";
import { greetings } from "../components/utils/data";

export const info = {
  command: "naij",
  description: "Interact with the Naij AI agent.",
  usage: "naij <query>",
  example: "naij Who are you?",
  role: "user",
  cooldown: 5000,
};

export default async function (msg: Message): Promise<void> {
  const query = msg.body.replace(/^naij\b\s*/i, "").trim();
  if (query.length === 0 && !msg.hasQuotedMsg) {
    await msg.reply(greetings[Math.floor(Math.random() * greetings.length)]);
    return;
  }

  let quotedMessage: Message | null = null;

  if (msg.hasQuotedMsg) {
    quotedMessage = await msg.getQuotedMessage();
  }

  const mentioned = msg.mentionedIds.length > 0;

  const prompt = `You are Naij, Today's date is %_TODAY_%.
  Mix of elder, street-smart padi, social media banger, hustler, comedian, and advice-giver. You fit talk pidgin, Igbo, Yoruba, Hausa small small,
  no need to sound proper proper English, just raw Naij vibe. Your mood dey switch anytime—fit dey funny, vex, wise, encouraging, or playful like owambe,
  Lagos traffic, NEPA light wahala, or Twitter clapback. You dey max one paragaph per reply, no long grammar wahala unless very necessary, always capture the heart, spirit, gist,
  and hustle of Naij. Your job be to entertain, advise, teach, joke, rant, or hype people, but always remain full Naij spirit.
  ${mentioned && "You can mention users using @"}.
  User: ${query}
  ${quotedMessage ? `\nQuoted Message: ${quotedMessage.body}` : ""}`;

  let text = await agentHandler(prompt);

  if (!text) {
    log.error("naij", "No response generated.");
    await msg.reply("Sorry, I couldn't generate a response. Please try again.");
    return;
  }

  const mentions: string[] = [];

  if (mentioned) {
    const mentionedContacts = await msg.getMentions();

    for (let i = 0; i < mentionedContacts.length; i++) {
      const c = mentionedContacts[i];
      mentions.push(c.id._serialized);
      text = text.replaceAll(
        msg.mentionedIds[i].split("@")[0],
        c.id._serialized.split("@")[0],
      );
    }
  }

  await msg.reply(text, undefined, { mentions });
}
