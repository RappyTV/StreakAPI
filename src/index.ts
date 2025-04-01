import Elysia, { ValidationError } from "elysia";
import config from "./libs/config";
import Logger from "./libs/Logger";
import { getRouter } from "./libs/route-loader";
import { join } from "path";
import cors from "@elysiajs/cors";
import swagger from "@elysiajs/swagger";
import { connect as connectDatabase } from "./database/mongo";
import { handleErrors } from "./libs/error-handler";
import { randomUUID } from "crypto";
import { startCacheExpirationChecker } from "./libs/cron-jobs";

handleErrors();

const elysia = new Elysia()
    .use(cors())
    .use(getRouter(join(__dirname, 'routes')))
    .use(swagger({
        path: '/docs',
        autoDarkMode: true,
        exclude: [
            '/docs',
            '/docs/json'
        ],
        documentation: {
            info: {
                version: config.version,
                title: 'LabyMod Streak API',
                description: 'This API is a cache proxy for LabyMod Streaks. It allows you to fetch streaks from the LabyMod API without hitting their rate limits.',
                license: {
                    name: 'MIT',
                    url: 'https://github.com/RappyTV/StreakAPI/blob/master/LICENSE'
                },
                contact: {
                    name: 'RappyTV',
                    url: 'https://www.rappytv.com',
                    email: 'contact@rappytv.com'
                }
            },
            tags: [
                { name: 'API', description: 'About the API' },
                { name: 'Streaks', description: 'Get player streaks' }
            ]
        }
    }))
    .onStart(async () => {
        Logger.info(`Elysia running on port ${config.port}!`);
        await connectDatabase(config.srv);

        startCacheExpirationChecker();
    })
    .onError(({ code, set, error, request }) => {
        if(code == 'VALIDATION') {
            set.status = 422;
            error = error as ValidationError;
            return { error: error.message.trim() };
        } else if(code == 'NOT_FOUND') {
            set.status = 404;
            return { error: 'Not found!' };
        } else {
            set.status = 500;
            const requestId = randomUUID();
            Logger.error(`An error ocurred with request ${requestId}: ${error}`);
            return { error: 'An unknown error ocurred!', id: requestId };
        }
    })
    .listen(config.port);

export type ElysiaApp = typeof elysia;