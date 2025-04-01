import type { ElysiaApp } from "../..";
import streaks, { saveStreak } from "../../database/schemas/streaks";
import { fetchStreak, LabyNetError } from "../../libs/labynet";

export default (app: ElysiaApp) => app.get('/:uuid', async ({ params }) => {
    const strippedUuid = params.uuid.replaceAll('-', '');
    const streak = await streaks.findOne({ uuid: strippedUuid });
    if(!streak) {
        try {
            const streak = await fetchStreak(params.uuid);
            const cacheAge = await saveStreak(strippedUuid, streak);

            return {
                streak: streak || -1,
                cache_age: cacheAge
            };
        } catch(error) {
            if(!(error instanceof LabyNetError)) throw error;
            return {
                error: error.message
            };
        }
    }

    return {
        streak: streak.streak || -1,
        cache_age: streak.cache_age
    };
});