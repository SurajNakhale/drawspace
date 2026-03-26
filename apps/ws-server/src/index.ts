import jwt from "jsonwebtoken";
import { WebSocket, WebSocketServer } from "ws";
import { JWT_SECRET } from "@repo/backend-common/config"
import { prisma } from "@repo/database/client";
const wss = new WebSocketServer({port: 8080});

interface User {
    ws: WebSocket,
    rooms: string[],
    userId: string
}

const users: User[] = [];

function checkUser(token: string): string | any {
    try{
        const decoded = jwt.verify(token, JWT_SECRET);
    
        if(typeof decoded == "string"){
            return null;
        }
    
        if(!decoded || !decoded.userId){
            return null;
        }
    
        return decoded.userId;
    }
    catch(err){
        return null;
    }

}

wss.on("connection", (socket, request)=>{

    let url = request.url;
    if(!url){
        return;
    } 

    const queryParams = new URLSearchParams(url.split("?")[1]);
    const token = queryParams.get('token') || "";
    const userId = checkUser(token);

    if(userId == null){
        socket.close();
        return;
    }

    users.push({
        ws: socket,
        rooms: [],
        userId
    })


    socket.on("message", async(data) => {
        let parsedData = JSON.parse(data.toString()); // {type: join-room, roomId: 1} // {type: leave-room, roomId: 1} // {type: chat, message: "hither, roomId: 1"}

        if(parsedData.type == "join-room"){
            let roomId = parsedData.roomId;

            let user = users.find(u => u.ws == socket);
            if(user){
                user.rooms.push(roomId)
            }
        }

        if(parsedData.type == "leave-room"){
            let roomId = parsedData.roomId;

            let user = users.find(u => u.ws == socket);
            if(!user){
                return; 
            }

            user.rooms = user.rooms.filter(x => x != roomId);
        }


        if(parsedData.type == "chat"){
            let roomId = parsedData.roomId;
            let message = parsedData.message;
            
            await prisma.chat.create({
                data: {
                    //@ts-ignore
                    roomId: Number(roomId),
                    message,
                    userId
                }
            })
            users.forEach(user => {
                if(user.rooms.includes(roomId)){
                    user.ws.send(JSON.stringify({
                        type: "chat",
                        message: message,
                        roomId
                    }))
                }
            }) 
        }
    })
})