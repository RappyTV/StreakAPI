import metrics from "../database/schemas/metrics";
import streaks from "../database/schemas/streaks";
import Logger from "./Logger";
import axios from "axios";

type Addon = {
    id: number,
    namespace: string,
    name: string,
    featured: boolean,
    verified: boolean,
    organization: number,
    author: string,
    downloads: number,
    download_string: string,
    short_description: string,
    rating: {
        count: number,
        rating: number
    },
    changelog: string,
    required_labymod_build: number,
    releases: number,
    last_update: number,
    licence: string,
    version_string: string,
    meta: [],
    dependencies: [{ namespace: string, optional: boolean }],
    permissions: [string],
    source_url: string,
    brand_images: [{ type: string, hash: string }],
    tags: [number]
}

export async function saveMetrics() {
    const cachedPlayers = await streaks.find();
    const addon = await fetchAddon('streakdisplay');
    
    metrics.insertMany({
        cached_players: cachedPlayers.length,
        players_with_streak: cachedPlayers.filter((streak) => streak.streak !== undefined && streak.streak > 0).length,
        players_with_hidden_streak: cachedPlayers.filter((streak) => streak.streak === -1).length,
        players_without_streak: cachedPlayers.filter((streak) => streak.streak === 0).length,
        players_without_labymod: cachedPlayers.filter((streak) => streak.streak === undefined).length,
        addon_downloads: addon?.downloads ?? 0
    }).catch((error) => {
        Logger.error(`Error while trying to save metrics: ${error}`);
    }).catch((error) =>
        Logger.error(`Error while trying to save metrics: ${error}`)
    ).then(() =>
        Logger.debug('New metrics saved!')
    );
}

async function fetchAddon(namespace: string): Promise<Addon | null> {
    try {
        const data = await axios.get(`https://flintmc.net/api/client-store/get-modification/${namespace}?now=${Date.now()}`, { headers: { 'Accept-Encoding': 'gzip' } });
        return data.data as Addon;
    } catch(error) {
        Logger.error(`Error while trying to fetch addon "${namespace}": ${error}`);
        return null;
    }
}