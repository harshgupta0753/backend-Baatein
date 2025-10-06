import { Server as SocketIOServer,Socket } from 'socket.io';
import dotenv from 'dotenv';  
import jwt from 'jsonwebtoken';
import { registerUserEvents } from './userEvents.ts';
import { registerChatEvents } from './chatEvents.ts';
import Conversation from '../modals/Conversation.ts';

dotenv.config();

export function initializeSocket(server:any):SocketIOServer {
const io = new SocketIOServer(server, {
    cors:{
        origin:"*",
    },
});

io.use((socket:Socket,next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error("Authentication error: Token not provided"));
    }

    jwt.verify(token, process.env.JWT_SECRET as string, (err:any, decoded:any) => {
        if (err) {
            return next(new Error("Authentication error: Invalid token"));
        }  
        
        let userData=decoded.user;
        socket.data=userData;
        socket.data.userId=userData.id;
        next();
    });
});

io.on('connection', async(socket:Socket) => {
    const userId = socket.data.userId;
    console.log(`User connected: ${userId}, username: ${socket.data.name}`);

    registerChatEvents(io,socket);
    registerUserEvents(io,socket);

    try {
        const conversations=await Conversation.find({
            participants:userId,
        }).select("_id");

        conversations.forEach((conversation)=>{
            socket.join(conversation._id.toString());
        });
    } catch (error : any) {
        console.log("Error joining conversations: ",error);
        
    }

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${userId}`);
    });
});
     return io;   
}