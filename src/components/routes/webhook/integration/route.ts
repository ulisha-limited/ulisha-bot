import http from "http";
import { findPendingUserByCode } from "../../../services/user";
import redis from "../../../redis";

const PROJECT_WEBHOOK_TOKEN =
  process.env.PROJECT_WEBHOOK_TOKEN || "hello-world";

export default async function IntegrationWebhook(
  req: http.IncomingMessage,
  res: http.ServerResponse<http.IncomingMessage> & {
    req: http.IncomingMessage;
  },
): Promise<boolean> {
  if (req.url !== "/webhook/integration" && req.method !== "POST") return false;

  try {
    let body = "";
    for await (const chunk of req) {
      body += chunk;
    }

    const data = JSON.parse(body);
    const { code, token } = data;

    if (!token || token !== PROJECT_WEBHOOK_TOKEN) {
      res.writeHead(401, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Invalid or missing token" }));
      return true;
    }

    if (!code) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Missing code" }));
      return true;
    }

    const pendingLogin = await findPendingUserByCode(code);
    if (!pendingLogin) {
      res.writeHead(400, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: "Code is invalid or expired." }));
      return true;
    }

    await Promise.all([
      redis.set(
        `user:${pendingLogin}`,
        JSON.stringify({ created_at: Date.now() }),
      ),
      redis.del(`pending-user:${pendingLogin}`),
    ]);

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Webhook received successfully\n");
  } catch (error) {
    console.error("Error handling webhook:", error);

    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Invalid request body" }));
  }

  return true;
}
