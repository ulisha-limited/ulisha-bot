import log from "./utils/log";
import {
  Call,
  Client,
  GroupNotification,
  LocalAuth,
  Message,
  Reaction,
  WAState,
} from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import LoadingBar from "./utils/loadingBar";
import messageEvent from "./events/message";
import groupLeave from "./events/groups/leave";
import groupJoin from "./events/groups/join";
import ready from "./events/ready";
import callEvent from "./events/call";

let instance: Client | null = null;
let isLoadingBarStarted = false;
const loadingBar = LoadingBar("Loading Client   | {bar} | {value}%");

async function client(): Promise<Client> {
  if (instance) return instance; // prevent re-creating

  const newClient = new Client({
    puppeteer: {
      headless: true,
      args: [
        "--window-size=1280,800",
        "--disable-crash-reporter",
        "--disable-breakpad",
        "--disable-infobars",
        "--no-default-browser-check",
        "--disable-extensions",
        "--disable-component-extensions-with-background-pages",
        "--noerrdialogs",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-background-timer-throttling",
        "--disable-renderer-backgrounding",
        "--disable-backgrounding-occluded-windows",
        "--disable-sync",
        "--metrics-recording-only",
        "--disable-hang-monitor",
      ],
      defaultViewport: { width: 1366, height: 768 },
      executablePath:
        process.env.PUPPETEER_EXEC_PATH || "/opt/google/chrome/google-chrome",
    },
    authStrategy: new LocalAuth(),
  });

  registerEvents(newClient);

  instance = newClient;
  await newClient.initialize();
  return newClient;
}

function registerEvents(client: Client): void {
  client.on("loading_screen", (percent: number, message: string) => {
    if (!isLoadingBarStarted) {
      loadingBar.start(100, 0, { message });
      isLoadingBarStarted = true;
    }
    if (percent >= 99) loadingBar.stop();
    loadingBar.update(percent, { message });
  });

  client.on("authenticated", () =>
    log.info("Auth", "Client authenticated successfully."),
  );

  client.on("qr", (qr: string) => {
    log.info("QR", "Scan this QR code with your WhatsApp app:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => ready());

  client.on("message_create", (msg: Message) => messageEvent(msg, "create"));

  client.on(
    "message_edit",
    (msg: Message, newBody: string, prevBody: string) => {
      msg.body = newBody;
      messageEvent(msg, "edit");
    },
  );

  client.on("call", (call: Call) => callEvent(call));

  client.on("group_join", (notif: GroupNotification) => groupJoin(notif));
  client.on("group_leave", (notif: GroupNotification) => groupLeave(notif));

  client.on("auth_failure", () => {
    loadingBar.stop();
    log.error("Auth", "Authentication failed. Please try again.");
  });

  client.on("disconnected", (reason: WAState | "LOGOUT") => {
    throw Error(`Client has been disconnected reason: ${reason}`);
  });
}

export { client };
export default client;
