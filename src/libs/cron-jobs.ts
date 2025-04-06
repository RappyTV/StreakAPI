import { CronJob } from "cron";
import { processExpiredCaches } from "./cache-renew";
import config from "./config";
import Logger from "./Logger";
import { saveMetrics } from "./metrics";

const tz = 'Europe/Berlin';

export function startCacheExpirationChecker() {
    new CronJob('* * * * *', processExpiredCaches, null, true, tz, null, true);
}

export function startMetrics() {
    if(!config.metrics.enabled) return;
    Logger.debug('Metrics initialized.');
    new CronJob(config.metrics.cron, saveMetrics, null, true, tz);
}