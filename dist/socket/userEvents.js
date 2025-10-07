"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserEvents = registerUserEvents;
const User_ts_1 = __importDefault(require("../modals/User.ts"));
const token_ts_1 = require("../utils/token.ts");
function registerUserEvents(io, socket) {
    socket.on("testSocket", (data) => {
        socket.emit("testSocket", { msg: "realtime updates working" });
    });
    socket.on("updateProfile", async (data) => {
        console.log('updateprofile event: ', data);
        const userId = socket.data.userId;
        if (!userId) {
            return socket.emit("updateProfile", {
                success: false, msg: "Unauthorized"
            });
        }
        try {
            const updatedUser = await User_ts_1.default.findByIdAndUpdate(userId, { name: data.name, avatar: data.avatar }, { new: true });
            if (!updatedUser) {
                return socket.emit("updateProfile", {
                    success: false, msg: "User not found"
                });
            }
            const newToken = (0, token_ts_1.generateToken)(updatedUser);
            socket.emit('updateProfile', {
                success: true,
                data: { token: newToken },
                msg: "Profile updated successfully"
            });
        }
        catch (error) {
            console.log("Error updating profile: ", error);
            socket.emit('updateProfile', {
                success: false, msg: "Error updating Profile"
            });
        }
    });
    socket.on("getContacts", async () => {
        try {
            const currentUserId = socket.data.userId;
            if (!currentUserId) {
                socket.emit("getContacts", {
                    success: false,
                    msg: "Unathorized",
                });
                return;
            }
            const users = await User_ts_1.default.find({ _id: { $ne: currentUserId } }, { password: 0 }).lean();
            const contacts = users.map((user) => ({
                id: user._id.toString(),
                name: user.name,
                email: user.email,
                avatar: user.avatar || "",
            }));
            socket.emit("getContacts", {
                success: true,
                data: contacts,
            });
        }
        catch (error) {
            console.log("getContracts error: ", error);
            socket.emit("getContacts", {
                success: false,
                msg: "Failed to fetch contacts",
            });
        }
    });
}
;
