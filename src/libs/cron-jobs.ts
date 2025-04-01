import { CronJob } from "cron";
import { processExpiredCaches } from "./cache-renew";

const tz = 'Europe/Berlin';

export function startCacheExpirationChecker() {
    new CronJob('* * * * *', processExpiredCaches, null, true, tz, null, true);
}