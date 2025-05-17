import PQueue from "p-queue";
import streaks, { calculateStreakCacheExpiration, getStreakLabel } from "../database/schemas/streaks";
import { fetchStreak } from "./labynet";
import Logger from "./Logger";
import { isConnected } from "../database/mongo";

const queue = new PQueue({ interval: 10000, intervalCap: 5 });
const inProgress = new Set<string>();

function renewCache(uuid: string): Promise<void> {
    if(inProgress.has(uuid)) return Promise.resolve();
    inProgress.add(uuid);
    return new Promise<void>(async (resolve, reject) => {
        if(!isConnected()) return resolve();
        Logger.debug('Renewal started for', uuid);
        const streak = await streaks.findOne({ uuid });
        if(!streak) return resolve();
        try {
            const newStreak = await fetchStreak(uuid);
            streak.streak = newStreak;
            streak.cache_age = Date.now();
            streak.cache_expires = calculateStreakCacheExpiration(newStreak);
            await streak.save();
            Logger.debug(`Renewal completed for ${uuid}: ${getStreakLabel(streak.streak)}`);
            resolve();
        } catch(error) {
            Logger.error(`Renewal failed for ${streak.uuid}: ${error}`);
            resolve();
        } finally {
            inProgress.delete(uuid);
        }
    });
}

export async function processExpiredCaches() {
    if(!isConnected()) return;
    const expiredCaches = await streaks.find({ cache_expires: { $lt: Date.now() } });

    for(const streak of expiredCaches) {
        Logger.debug('Renewal queued for', streak.uuid);
        queue.add(() => renewCache(streak.uuid), { id: streak.uuid, priority: Date.now() - streak.cache_expires });
    }
}