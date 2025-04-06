import { Schema, model as createModel } from "mongoose";

interface IMetric {
    cached_players: number,
    players_with_streak: number,
    players_with_hidden_streak: number,
    players_without_streak: number,
    players_without_labymod: number,
    addon_downloads: number,
    createdAt: Date
}

const schema = new Schema<IMetric>({
    cached_players: {
        type: Number,
        required: true
    },
    players_with_streak: {
        type: Number,
        required: true
    },
    players_with_hidden_streak: {
        type: Number,
        required: true
    },
    players_without_streak: {
        type: Number,
        required: true
    },
    players_without_labymod: {
        type: Number,
        required: true
    },
    addon_downloads: {
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

export default createModel<IMetric>('metrics', schema);