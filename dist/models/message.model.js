"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Messages = void 0;
//Require Mongoose
const mongoose_1 = __importDefault(require("mongoose"));
const MessageSchema = new mongoose_1.default.Schema({
    conversationID: {
        type: mongoose_1.default.Schema.Types.ObjectId,
        required: true
    },
    senderID: { type: mongoose_1.default.Schema.Types.ObjectId, required: true },
    text: {
        type: String,
    },
    files: [
        {
            type: String,
        }
    ],
    date: { type: Date, default: Date.now, expires: 120000000 },
});
exports.Messages = mongoose_1.default.model('Message', MessageSchema);
