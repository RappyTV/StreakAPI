import { Schema, model as createModel } from "mongoose";
import Logger from "../../libs/Logger";

const day = 1000 * 60 * 60 * 24;
const week = day * 7;
const month = week * 4;

interface IStreak {
    uuid: string,
    streak?: number,
    cache_age: number,
    cache_expires: number
}

const schema = new Schema<IStreak>({
    uuid: {
        type: String,
        required: true,
        unique: true
    },
    streak: Number,
    cache_age: {
        type: Number,
        required: true
    },
    cache_expires: {
        type: Number,
        required: true
    }
}, {
    methods: {
        
    }
});

const model = createModel<IStreak>('streaks', schema);

export function saveStreak(uuid: string, streak: number | undefined): Promise<number> {
    return new Promise(async (resolve, reject) => {
        try {
            const cacheAge = Date.now();
            await model.insertOne({
                uuid,
                streak,
                cache_age: cacheAge,
                cache_expires: calculateStreakCacheExpiration(streak)
            });
            Logger.debug(`Saved new streak for ${uuid}: ${streak ?? 'Hidden'}`);
            resolve(cacheAge);
        } catch(error) {
            reject(new Error(`Failed to save streak for ${uuid}: ${error}`));
        }
    });
}

export function calculateStreakCacheExpiration(streak: number | undefined, cacheAge: number = Date.now()): number {
    if(streak === undefined) {
        return cacheAge + month;
    } else if(streak === 0) {
        return cacheAge + week;
    } else {
        return cacheAge + day;
    }
}

export default model;