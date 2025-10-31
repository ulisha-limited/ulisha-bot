import http from "http";
import log from "./utils/log";
import * as Sentry from "@sentry/node";
import IntegrationWebhook from "./routes/webhook/integration/route";

const MAX_PORT_TRIES = 10;
const PROJECT_HOST_WEBSITE =
  process.env.PROJECT_HOST_WEBSITE || "http://localhost:3000";

function startServer(port: number, tries = 0) {
  const server = http.createServer(async (req, res) => {
    if (await IntegrationWebhook(req, res)) return;

    res.writeHead(302, { Location: PROJECT_HOST_WEBSITE });
    res.end();
  });

  server.listen(port, () => {
    log.info("Server", `HTTP server started on port ${port}`);
  });

  server.on("error", (err: any) => {
    if (err.code === "EADDRINUSE" && tries < MAX_PORT_TRIES) {
      log.warn("Server", `Port ${port} in use, trying port ${port + 1}`);
      startServer(port + 1, tries + 1);
    } else {
      log.error("Server", `Failed to start server: ${err.message}`);
      process.exit(1);
    }
    Sentry.captureException(err);
  });

  return server;
}

const PORT: number = parseInt(process.env.PORT || "3000");
const server = startServer(PORT);

export default server;
