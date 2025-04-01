import mongoose from "mongoose";
import Logger from "../libs/Logger";

let registered = false;

export async function connect(connectionString: string) {
    registerEventHandler(connectionString);
    
    return await mongoose.connect(connectionString)
        .catch((err) => Logger.error(`Failed to establish database connection! ${err}`));
}

function registerEventHandler(connectionString: string) {
    if(registered) return;

    mongoose.connection
        .on('connecting', () => Logger.debug('Connecting to database...'))
        .on('connected', () => Logger.info('Connected to database!'))
        .on('disconnected', () => {
            Logger.error('Lost database connection');
            setTimeout(() => connect(connectionString), 10000);
        });
    registered = true;
}

export function isConnected(): boolean {
    return mongoose.connection.readyState == 1;
}