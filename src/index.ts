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
                description: 'This is the official GlobalTags API documentation containing detailed descriptions about the API endpoints and their usage.',
                license: {
                    name: 'MIT',
                    // url: 'https://github.com/Global-Tags/API/blob/master/LICENSE'
                },
                contact: {
                    name: 'RappyTV',
                    url: 'https://www.rappytv.com',
                    email: 'contact@rappytv.com'
                }
            },
            // tags: [
            //     { name: 'API', description: 'Get info about the API' },
            //     { name: 'Interactions', description: 'Interact with other players' },
            //     { name: 'Settings', description: 'Modify the settings of your GlobalTag' },
            //     { name: 'Roles', description: 'Holds role management routes' },
            //     { name: 'Gift codes', description: 'Holds gift code actions' },
            //     { name: 'Admin', description: 'Admininstrative actions' },
            //     { name: 'Connections', description: 'Manage account connections' }
            // ]
        }
    }))
    .onStart(() => {
        Logger.info(`Elysia running on port ${config.port}!`);
        connectDatabase(config.srv);
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