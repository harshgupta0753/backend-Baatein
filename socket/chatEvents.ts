import { Server as SocketIOServer, Socket } from "socket.io";
import Conversation from "../modals/Conversation.js";
import Message from "../modals/Message.js";

export function registerChatEvents(io: SocketIOServer, socket: Socket) {

    socket.on("getConversations",async()=>{
        console.log("getConversations event");
        try {
            const userId=socket.data.userId;
            if(!userId){
                socket.emit("getConversations",{
                    success:false,
                    msg:"unauthorized",
                });
                return;
            }

            const conversations=await Conversation.find({
                participants: userId
            })
            .sort({updatedAt:-1})
            .populate({
                path:"lastMessage",
                select:"content senderId attachement createdAt"
            })
            .populate({
                    path: "participants",
                    select: "name avatar email",
            }).lean();

            socket.emit("getConversations",{
                success:true,
                data:conversations,
            })


        } catch (error:any) {
            console.log("getConversations error: ", error);
            socket.emit("getConversations", {
                success: false,
                msg: "Failed to fetch conversation",
            });
        }
    })

    socket.on("newConversation", async (data) => {
        console.log("newConversation event: ", data);

        try {
            if (data.type == 'direct') {
                const existingConversation = await Conversation.findOne({
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

            const conversation = await Conversation.create({
                type: data.type,
                participants: data.participants,
                name: data.name || "",
                avatar: data.avatar || "",
                createdBy: socket.data.userId,
            });

            const connectedSockets = Array.from(io.sockets.sockets.values()).filter((s) =>
                data.participants.includes(s.data.userId));

            connectedSockets.forEach((participantSocket) => {
                participantSocket.join(conversation._id.toString());
            });

            const populatedConversation = await Conversation.findById(conversation._id)
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



        } catch (error: any) {

            console.log("newConversation error: ", error);
            socket.emit("newConversation", {
                success: false,
                msg: "Failed to create conversation",
            });

        }
    });

socket.on("newMessage", async (data)=>{
    console.log("newMessage event: ", data);
    try {
        const message =await Message.create({
            conversationId:data.conversationId,
            senderId:data.sender.id,
            content:data.content,
            attachement:data.attachement
        });

        io.to(data.conversationId).emit("newMessage",{
            success:true,
            data:{
                id:message._id,
                content:data.content,
                sender:{
                    id:data.sender.id,
                    name:data.sender.name,
                    avatar:data.sender.avatar,
                },
                attachement:data.attachement,
                createdAt: new Date().toISOString(),
                conversationId: data.conversationId,
            },
        });

        await Conversation.findByIdAndUpdate(data.conversationId,{
            lastMessage:message._id,
        });
        
    } catch ( error :any) {
        console.log("newMessage errors: ",error);
        socket.emit("newMessage",{
            success:false,
            msg:"Failed to send message"
        })
        
    }

})

socket.on("getMessages", async (data:{conversationId:string})=>{
    console.log("getMessage event: ", data);
    try {
        const messages =await Message.find({
            conversationId: data.conversationId,
        })
        .sort({createdAt: -1})
        .populate<{senderId:{_id:string;name:string; avatar:string}}>({
            path:"senderId",
            select:"name avatar",
        })
        .lean();   

        const messageWithSender =messages.map(message=>({
            ...message,
            id:message._id,
            sender:{
                id:message.senderId._id,
                name:message.senderId.name,
                avatar:message.senderId.avatar,
            }
        }))

        socket.emit("getMessages",{
            success:true,
            data:messageWithSender,
        });
    } catch ( error :any) {
        console.log("getMessage errors: ",error);
        socket.emit("getMessage",{
            success:false,
            msg:"Failed to fetch message"
        })
        
    }

})
}