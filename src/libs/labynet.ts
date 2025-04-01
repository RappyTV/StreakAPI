import axios, { AxiosError } from "axios";
import config from "./config";

type StreakResponse = {
    playtime: {
        streak: number
    } | undefined
}

export function fetchStreak(uuid: string): Promise<number | undefined> {
    return new Promise(async (resolve, reject) => {
        try {
            const response = await axios.get(`https://laby.net/api/v3/user/${uuid}/game-stats?now=${Date.now()}`, {
                headers: {
                    'User-Agent': `StreakAPI v${config.version} (https://github.com/RappyTV/StreakAPI) - ${config.contact}`
                }
            });
            const data = response.data as StreakResponse;

            resolve(data.playtime?.streak);
        } catch(error: any) {
            if(error instanceof AxiosError) {
                if(error.response) {
                    if(error.response.status === 429) {
                        reject(new LabyNetError('Rate limited. Please try again later!'));
                    }
                    reject(new LabyNetError(error.response.data?.error || 'An unknown laby.net error ocurred!'));
                } else if(error.request) {
                    reject(new LabyNetError('No response received from LabyNet API!'));
                } else {
                    reject(new LabyNetError(`Failed to fetch streak: ${error.message}`));
                }
            } else {
                reject(new LabyNetError(error?.message || 'An unknown request error ocurred!'));
            }
        }
    });
};

export class LabyNetError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "LabyNetError";
    }
}