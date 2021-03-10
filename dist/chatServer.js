"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatServer = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class ChatServer {
    constructor(io) {
        this.rootSocket = io.of('/');
        this.attachMiddlewares();
        this.attachEventHandlers(io);
    }
    attachMiddlewares() {
        this.rootSocket.use(async (socket, next) => {
            try {
                const extSocket = socket;
                const token = extSocket.handshake.auth.token;
                const userInfo = await jsonwebtoken_1.default.verify(token, String(process.env.ACCESS_TOKEN_SECRET));
                extSocket.userID = userInfo.userID;
                next();
            }
            catch (err) {
                next(err);
            }
        });
    }
    attachEventHandlers(io) {
        this.rootSocket.on('connection', (socket) => {
            const extSocket = socket;
            console.log("Connected");
            socket.on('disconnect', () => {
                console.log("Disconnected");
            });
        });
    }
}
exports.ChatServer = ChatServer;
