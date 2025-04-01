import type { ElysiaApp } from "..";
import config from "../libs/config";

export default (app: ElysiaApp) => app.get('/', () => ({
    version: config.version
}));