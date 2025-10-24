import speedTest from "speedtest-net";
import log from "../components/utils/log";
import redis from "../components/redis";
import { CronJobInfo } from "../cron";
import * as Sentry from "@sentry/node";

export const CACHE_KEY = "speedtest:result";
const CACHE_TTL = 60 * 60; // 1 hour

export const info: CronJobInfo = {
  name: "SpeedTestJob",
  description: "Runs an internet speed test and logs results.",
  schedule: "0 * * * *", // every hour
  runOnStartup: true,
};

export default async function () {
  try {
    const results = await speedTest({ acceptLicense: true, acceptGdpr: true });
    console.log(""); // to create new line
    log.info(
      "SpeedTestJob",
      `Download: ${results.download.bandwidth / 125000} Mbps`,
    );
    log.info(
      "SpeedTestJob",
      `Upload: ${results.upload.bandwidth / 125000} Mbps`,
    );
    log.info("SpeedTestJob", `Ping: ${results.ping.latency} ms`);
    await redis.set(CACHE_KEY, JSON.stringify(results), {
      expiration: {
        type: "EX",
        value: CACHE_TTL,
      },
    });
  } catch (err) {
    Sentry.captureException(err);
    log.error("SpeedTestJob", err);
  }
}
