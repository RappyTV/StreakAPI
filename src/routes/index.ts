import { t } from "elysia";
import type { ElysiaApp } from "..";
import config from "../libs/config";
import Metrics from "../database/schemas/metrics";
import { isConnected } from "../database/mongo";

export default (app: ElysiaApp) => app.get('/', () => ({
    version: config.version
}), {
    detail: { tags: ['API'], description: 'Returns the API version' },
    response: { 200: t.Object({ version: t.String({ default: config.version }) }, { description: 'The API version' }) }
}).get('/metrics', async ({ query: { latest } }) => {
    const metrics = await Metrics.find();

    return metrics.filter((doc) => latest != 'true' || doc.id == (metrics.at(-1)?.id ?? 0)).map((metric) => ({
        time: metric.createdAt.getTime(),
        cached_players: metric.cached_players,
        players_with_streak: metric.players_with_streak,
        players_with_hidden_streak: metric.players_with_hidden_streak,
        players_without_streak: metric.players_without_streak,
        players_without_labymod: metric.players_without_labymod,
        addon_downloads: metric.addon_downloads
    }));
}, {
    detail: {
        tags: ['API'],
        description: 'Get the API metrics'
    },
    response: {
        200: t.Array(t.Object({ time: t.Number({ default: Date.now() }), cached_players: t.Number({ default: 0 }), players_with_streak: t.Number({ default: 0 }), players_with_hidden_streak: t.Number({ default: 0 }), players_without_streak: t.Number({ default: 0 }), players_without_labymod: t.Number({ default: 0 }), addon_downloads: t.Number({ default: 0 }) }, { description: 'The metric list' })),
        503: t.Object({ error: t.String() }, { description: 'Our database is not reachable' })
    },
    query: t.Object({ latest: t.Optional(t.String({ error: 'Field "latest" needs to be of type string.' })) }, { additionalProperties: true }),
    beforeHandle({ set }) {
        if(!isConnected()) {
            set.status = 503;
            return { error: 'Our database is not reachable at the moment!' };
        }
    }
});