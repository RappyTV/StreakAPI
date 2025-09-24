import { CronJob } from "cron";
import { processExpiredCaches, getQueueStats } from "./cache-renew";
import config from "./config";
import Logger from "./Logger";
import { saveMetrics } from "./metrics";

const tz = 'Europe/Berlin';

export function startCacheExpirationChecker() {
    new CronJob('*/2 * * * *', processExpiredCaches, null, true, tz, null, true);

    new CronJob('*/10 * * * *', () => {
        const stats = getQueueStats();
        Logger.info(`Queue stats - Size: ${stats.size}, Pending: ${stats.pending}, In Progress: ${stats.inProgress}`);
    }, null, true, tz);
}

export function startMetrics() {
    if(!config.metrics.enabled) return;
    Logger.debug('Metrics initialized.');
    new CronJob(config.metrics.cron, saveMetrics, null, true, tz);
}