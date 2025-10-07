"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerChatEvents = registerChatEvents;
const Conversation_ts_1 = __importDefault(require("../modals/Conversation.ts"));
const Message_ts_1 = __importDefault(require("../modals/Message.ts"));
function registerChatEvents(io, socket) {
    socket.on("getConversations", async () => {
        console.log("getConversations event");
        try {
            const userId = socket.data.userId;
            if (!userId) {
                socket.emit("getConversations", {
                    success: false,
                    msg: "unauthorized",
                });
                return;
            }
            const conversations = await Conversation_ts_1.default.find({
                participants: userId
            })
                .sort({ updatedAt: -1 })
                .populate({
                path: "lastMessage",
                select: "content senderId attachement createdAt"
            })
                .populate({
                path: "participants",
                select: "name avatar email",
            }).lean();
            socket.emit("getConversations", {
                success: true,
                data: conversations,
            });
        }
        catch (error) {
            console.log("getConversations error: ", error);
            socket.emit("getConversations", {
                success: false,
                msg: "Failed to fetch conversation",
            });
        }
    });
    socket.on("newConversation", async (data) => {
        console.log("newConversation event: ", data);
        try {
            if (data.type == 'direct') {
                const existingConversation = await Conversation_ts_1.default.findOne({
                    type: 'direct',
                    participants: { $all: data.participants, $size: 2 },
                }).populate({
                    path: "participants",
                    select: "name avatar email",
                }).lean();
                if (existingConversation) {
                    socket.emit("newConversation", {
                        success: true,
                        data: { ...existingConversation, isNew: false },
                    });
                    return;
                }
            }
            const conversation = await Conversation_ts_1.default.create({
                type: data.type,
                participants: data.participants,
                name: data.name || "",
                avatar: data.avatar || "",
                createdBy: socket.data.userId,
            });
            const connectedSockets = Array.from(io.sockets.sockets.values()).filter((s) => data.participants.includes(s.data.userId));
            connectedSockets.forEach((participantSocket) => {
                participantSocket.join(conversation._id.toString());
            });
            const populatedConversation = await Conversation_ts_1.default.findById(conversation._id)
                .populate({
                path: "participants",
                select: "name avatar email",
            }).lean();
            if (!populatedConversation) {
                throw new Error("Failed to populate conversation");
            }
            io.to(conversation._id.toString()).emit("newConversation", {
                success: true,
                data: { ...populatedConversation, isNew: true },
            });
        }
        catch (error) {
            console.log("newConversation error: ", error);
            socket.emit("newConversation", {
                success: false,
                msg: "Failed to create conversation",
            });
        }
    });
    socket.on("newMessage", async (data) => {
        console.log("newMessage event: ", data);
        try {
            const message = await Message_ts_1.default.create({
                conversationId: data.conversationId,
                senderId: data.sender.id,
                content: data.content,
                attachement: data.attachement
            });
            io.to(data.conversationId).emit("newMessage", {
                success: true,
                data: {
                    id: message._id,
                    content: data.content,
                    sender: {
                        id: data.sender.id,
                        name: data.sender.name,
                        avatar: data.sender.avatar,
                    },
                    attachement: data.attachement,
                    createdAt: new Date().toISOString(),
                    conversationId: data.conversationId,
                },
            });
            await Conversation_ts_1.default.findByIdAndUpdate(data.conversationId, {
                lastMessage: message._id,
            });
        }
        catch (error) {
            console.log("newMessage errors: ", error);
            socket.emit("newMessage", {
                success: false,
                msg: "Failed to send message"
            });
        }
    });
    socket.on("getMessages", async (data) => {
        console.log("getMessage event: ", data);
        try {
            const messages = await Message_ts_1.default.find({
                conversationId: data.conversationId,
            })
                .sort({ createdAt: -1 })
                .populate({
                path: "senderId",
                select: "name avatar",
            })
                .lean();
            const messageWithSender = messages.map(message => ({
                ...message,
                id: message._id,
                sender: {
                    id: message.senderId._id,
                    name: message.senderId.name,
                    avatar: message.senderId.avatar,
                }
            }));
            socket.emit("getMessages", {
                success: true,
                data: messageWithSender,
            });
        }
        catch (error) {
            console.log("getMessage errors: ", error);
            socket.emit("getMessage", {
                success: false,
                msg: "Failed to fetch message"
            });
        }
    });
}
