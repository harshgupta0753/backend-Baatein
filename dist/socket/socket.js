"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeSocket = initializeSocket;
const socket_io_1 = require("socket.io");
const dotenv_1 = __importDefault(require("dotenv"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userEvents_ts_1 = require("./userEvents.ts");
const chatEvents_ts_1 = require("./chatEvents.ts");
const Conversation_ts_1 = __importDefault(require("../modals/Conversation.ts"));
dotenv_1.default.config();
function initializeSocket(server) {
    const io = new socket_io_1.Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth.token;
        if (!token) {
            return next(new Error("Authentication error: Token not provided"));
        }
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return next(new Error("Authentication error: Invalid token"));
            }
            let userData = decoded.user;
            socket.data = userData;
            socket.data.userId = userData.id;
            next();
        });
    });
    io.on('connection', async (socket) => {
        const userId = socket.data.userId;
        console.log(`User connected: ${userId}, username: ${socket.data.name}`);
        (0, chatEvents_ts_1.registerChatEvents)(io, socket);
        (0, userEvents_ts_1.registerUserEvents)(io, socket);
        try {
            const conversations = await Conversation_ts_1.default.find({
                participants: userId,
            }).select("_id");
            conversations.forEach((conversation) => {
                socket.join(conversation._id.toString());
            });
        }
        catch (error) {
            console.log("Error joining conversations: ", error);
        }
        socket.on('disconnect', () => {
            console.log(`User disconnected: ${userId}`);
        });
    });
    return io;
}
