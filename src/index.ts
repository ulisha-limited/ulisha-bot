import dotenv from "dotenv";
dotenv.config({ quiet: true, debug: process.env.DEBUG === "true" });

import "./instrument";
import { registerCronJobs } from "./cron";
import { client } from "./components/client";
import { checkRequirements } from "./components/utils/requirements";
import { mapCommands } from "./components/utils/cmd/loader";
import watcher from "./components/utils/cmd/watcher";
import "./components/process";
import "./components/server";
import MemoryMonitor from "./components/utils/memMonitor";

const autoReload = process.env.AUTO_RELOAD === "true";
const monitor = new MemoryMonitor({
  interval: 60000,
  thresholdMB: parseInt(process.env.PROJECT_THRESHOLD_MEMORY || "1024", 10),
});
const autoUpdateTimer: NodeJS.Timeout | null = null;
const autoUpdateDaily = process.env.PHISHTANK_AUTO_UPDATE === "true";


async function main() {
  checkRequirements();
  await Promise.all([
    monitor.start(),
    registerCronJobs(),
  ]);

  await client();

  await mapCommands();
  // Watch for changes
  if (autoReload) await watcher();
}

main();
