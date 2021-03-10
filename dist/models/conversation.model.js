"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conversations = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const ConversationSchema = new mongoose_1.default.Schema({
    type: {
        type: String,
        required: true
    },
    room: {
        type: String,
    },
    members: [
        {
            type: String, required: true
        }
    ],
    lastMessagedAt: { type: Number }
});
exports.Conversations = mongoose_1.default.model('Conversation', ConversationSchema);
