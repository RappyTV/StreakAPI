import { t } from "elysia";
import type { ElysiaApp } from "../..";
import streaks, { saveStreak } from "../../database/schemas/streaks";
import { fetchStreak, LabyNetError } from "../../libs/labynet";
import { isConnected } from "../../database/mongo";

export default (app: ElysiaApp) => app.get('/:uuid', async ({ params, error }) => {
    const strippedUuid = params.uuid.replaceAll('-', '');
    const streak = await streaks.findOne({ uuid: strippedUuid });
    if(!streak) {
        try {
            const streak = await fetchStreak(params.uuid);
            const cacheAge = await saveStreak(strippedUuid, streak);

            return {
                cache_age: cacheAge,
                streak: streak || -1
            };
        } catch(err) {
            if(!(err instanceof LabyNetError)) throw err;
            return error(err.status as 500, { error: err.message });
        }
    }

    return {
        cache_age: streak.cache_age,
        streak: streak.streak || -1
    };
}, {
    detail: { tags: ['Streaks'], description: 'Fetches the LabyMod Streak of a player' },
    response: {
        200: t.Object({ cache_age: t.Number({ default: Date.now() }), streak: t.Number({ default: 420 }) }, { description: 'The players LabyMod Streak' }),
        429: t.Object({ error: t.String() }, { description: 'We\'re ratelimited by laby.net' }),
        500: t.Object({ error: t.String() }, { description: 'An error ocurred with our request to laby.net' }),
        502: t.Object({ error: t.String() }, { description: 'We didn\'t receive a response from laby.net' }),
        503: t.Object({ error: t.String() }, { description: 'Our database is not reachable' })
    },
    beforeHandle({ set }) {
        if(!isConnected()) {
            set.status = 503;
            return { error: 'Our database is not reachable at the moment!' };
        }
    }
});