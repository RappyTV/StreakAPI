import PQueue from "p-queue";
import streaks, { calculateStreakCacheExpiration, getStreakLabel } from "../database/schemas/streaks";
import { fetchStreak } from "./labynet";
import Logger from "./Logger";
import { isConnected } from "../database/mongo";

const queue = new PQueue({ 
    interval: 60000,  // 60 seconds
    intervalCap: 9,   // 9 requests per interval (leaving 1 for buffer)
    concurrency: 1    // Process one at a time to respect rate limits
});

const inProgress = new Set<string>();
let lastBatchTime = 0;
const BATCH_INTERVAL = 5 * 60 * 1000; // Process batches every 5 minutes
const BATCH_SIZE = 100; // Process up to 100 expired caches per batch

function renewCache(uuid: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
        if (!isConnected()) return resolve();

        try {
            const streak = await streaks.findOne({ uuid });
            if (!streak) {
                Logger.debug(`Streak not found for ${uuid}, skipping renewal`);
                return resolve();
            }

            Logger.debug(`Renewal started for ${uuid}`);
            const newStreak = await fetchStreak(uuid);

            streak.streak = newStreak;
            streak.cache_age = Date.now();
            streak.cache_expires = calculateStreakCacheExpiration(newStreak);
            await streak.save();
            
            Logger.debug(`Renewal completed for ${uuid}: ${getStreakLabel(newStreak)}`);
        } catch (error: any) {    
            if (error.status === 429) Logger.warn('Rate limit hit during renewal, backing off...');
            else Logger.error(`Renewal failed for ${uuid}: ${error.message || error}`);
        } finally {
            inProgress.delete(uuid);
            resolve();
        }
    });
}

export async function processExpiredCaches() {
    if (!isConnected()) return;
    
    const now = Date.now();
    
    // Only process batches every BATCH_INTERVAL to reduce database load
    if (now - lastBatchTime < BATCH_INTERVAL) {
        return;
    }
    
    try {
        // Get expired caches in batches, sorted by expiration time (oldest first)
        const expiredCaches = await streaks.find({ 
            cache_expires: { $lt: now } 
        })
        .sort({ cache_expires: 1 }) // Oldest expired first
        .limit(BATCH_SIZE)
        .lean(); // Use lean() for better performance when we don't need full documents

        if (expiredCaches.length === 0) {
            Logger.debug('No expired caches found');
            lastBatchTime = now;
            return;
        }

        Logger.info(`Found ${expiredCaches.length} expired caches to process`);
        
        let queuedCount = 0;
        for (const streak of expiredCaches) {
            const uuid = streak.uuid;
            
            // Skip if already in progress
            if (inProgress.has(uuid)) {
                Logger.debug(`Skipping ${uuid} - already in progress`);
                continue;
            }
            
            inProgress.add(uuid);
            
            // Calculate priority based on how long it's been expired (older = higher priority)
            const expiredFor = now - streak.cache_expires;
            const priority = expiredFor;
            
            queue.add(() => renewCache(uuid), { 
                id: uuid, 
                priority 
            });
            
            queuedCount++;
        }
        
        Logger.info(`Queued ${queuedCount} cache renewals. Queue size: ${queue.size}, Pending: ${queue.pending}`);
        lastBatchTime = now;
        
    } catch (error: any) {
        Logger.error(`Error processing expired caches: ${error.message || error}`);
    }
}

// Function to get queue statistics for monitoring
export function getQueueStats() {
    return {
        size: queue.size,
        pending: queue.pending,
        inProgress: inProgress.size,
        isPaused: queue.isPaused
    };
}

// Function to manually trigger cache processing (useful for testing)
export async function forceProcessExpiredCaches() {
    lastBatchTime = 0; // Reset the batch timer
    await processExpiredCaches();
}

// Graceful shutdown function
export function shutdownQueue() {
    Logger.info('Shutting down cache renewal queue...');
    queue.pause();
    queue.clear();
    inProgress.clear();
}