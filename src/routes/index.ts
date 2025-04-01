import { t } from "elysia";
import type { ElysiaApp } from "..";
import config from "../libs/config";

export default (app: ElysiaApp) => app.get('/', () => ({
    version: config.version
}), {
    detail: { tags: ['API'], description: 'Returns the API version' },
    response: { 200: t.Object({ version: t.String({ default: config.version }) }, { description: 'The API version' }) }
});