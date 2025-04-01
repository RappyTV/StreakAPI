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
                        reject(new LabyNetError('Rate limited. Please try again later!', error.response.status));
                    }
                    reject(new LabyNetError(error.response.data?.error || 'An unknown laby.net error ocurred!', error.response.status));
                } else if(error.request) {
                    reject(new LabyNetError('No response received from LabyNet API!', 502));
                } else {
                    reject(new LabyNetError(`Failed to fetch streak: ${error.message}`, 502));
                }
            } else {
                reject(new LabyNetError(error?.message || 'An unknown request error ocurred!', 500));
            }
        }
    });
};

export class LabyNetError extends Error {
    public status: number;

    constructor(message: string, status: number) {
        super(message);
        this.name = "LabyNetError";
        this.status = status;
    }
}