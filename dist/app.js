"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = void 0;
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const chat_server_1 = require("./chat.server");
const path_1 = __importDefault(require("path"));
mongoose_1.default.connect(String(process.env.MONGO_URI), { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true });
mongoose_1.default.connection.on('connected', () => {
    console.log('Database connected');
});
mongoose_1.default.connection.on('error', err => {
    console.error('Mongo_Connection_Error: ' + err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('Database disconnected');
});
const app = express_1.default();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(express_1.default.static('build'));
//enable cors
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'content-type,X-Requested-With,authorization');
    next();
});
//userRoutes
app.use('/api/user', user_routes_1.default);
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(__dirname, 'build', 'index.html'));
});
// error handler
app.use((err, req, res, next) => {
    console.error(err.message);
    const status = err.status || 500;
    const message = err.message || 'Something went wrong';
    res.status(status).send({ status, message });
});
process.on('uncaughtException', err => {
    console.error('uncaughtError', err);
    process.exit(1); //mandatory (as per the Node.js docs)
});
exports.server = http_1.createServer(app);
const io = new socket_io_1.Server(exports.server, {
    perMessageDeflate: false,
    cors: {
        origin: "*",
        methods: ["GET", "POST"],
        allowedHeaders: ["my-custom-header"],
        credentials: true
    }
});
const chatServer = new chat_server_1.ChatServer(io);
