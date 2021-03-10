"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatServer = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const chatCtrl = __importStar(require("./controllers/ws/chat.controller"));
class ChatServer {
    constructor(io) {
        this.users = {};
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
    findUserSocketID(userID) {
        if (this.users[userID])
            return this.users[userID];
        else
            return "0";
    }
    attachEventHandlers(io) {
        this.rootSocket.on('connection', (socket) => {
            const extSocket = socket;
            this.users[extSocket.userID] = extSocket.id;
            extSocket.on('loadUsers', (res) => {
                chatCtrl.loadUsers(extSocket, (err, resData) => {
                    if (err)
                        return res(err);
                    return res(null, resData);
                });
            });
            extSocket.on('startConversation', (data, res) => {
                chatCtrl.postDmTextAlt(extSocket, data, (err, resData) => {
                    if (err)
                        return res(err);
                    return res(null, resData);
                });
            });
            extSocket.on('loadDirectConversations', (data, res) => {
                chatCtrl.loadDirectConversations(extSocket, data, (err, resData) => {
                    if (err)
                        return res(err);
                    return res(null, resData);
                });
            });
            extSocket.on('sendDM', (data, res) => {
                chatCtrl.postDmText(extSocket, data, (err, resData) => {
                    if (resData && resData.oppID) {
                        const oppID = this.findUserSocketID(resData.oppID);
                        if (oppID !== "0") {
                            this.rootSocket.to(oppID).emit('newDM', { message: resData.message, sender: resData.sender });
                        }
                    }
                    if (err)
                        return res(err);
                    return res(null, resData);
                });
            });
            extSocket.on('disconnect', () => {
                delete this.users[extSocket.userID];
            });
        });
    }
}
exports.ChatServer = ChatServer;
