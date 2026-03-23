import "dotenv/config";
import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { authMiddleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config"
import { signupSchema, signinSchema, roomSchema } from "@repo/common/types"
import { prisma } from "@repo/database/client";

const app = express();

app.use(express.json())

// Mock data storage
const users: any[] = [];
const rooms: any[] = [];

//signup endpoint
app.post("/signup", async (req, res) => {
    const parsed = signupSchema.safeParse(req.body);

    if(!parsed.success){
        res.status(400).json({
            message: "invalid input!!"
        })
        console.log(parsed.error)
        return;
    }

    const data = parsed.data;
    const password = data?.password;
    
    const hashpass = await bcrypt.hash(password as string, 5)

    
    try{
        console.log("DB URL =", process.env.DATABASE_URL)
        const user = await prisma.user.create({
            data: {
                name: data.name,
                username: data.username,
                password: hashpass
            }
        })

        res.status(201).json({
            message: "user created!! signup successfull",
            user: {
                id: user.id,
                name: user.name,
                username: user.username
            }
        })

    }
    catch(err){
        res.status(500).json({
            message: "error creating user",
            error: err
        })
    }

})


//signin endpoint
app.post("/signin", async (req, res) => {
    const parsed = signinSchema.safeParse(req.body);

    if(!parsed.success){
        res.json({
            message: "invalid input!!"
        })
        return;
    }

    let data = parsed.data 

    let user = users.find(u => u.username === data.username);

    if(!user){
        res.json({
            message: "user does not exist pls signup first!!!!"
        })
        return;
    }

    let passMatch = await bcrypt.compare(data.password, user.password)

    if(!passMatch){
        res.json({
            message: "incorrect password pls try again!!"
        })
        return;
    }

    if(passMatch){
        let token = jwt.sign({
            userId: user.id
        }, JWT_SECRET)

        res.json({
            token: token,
            message: "signin successfully"
        })
    }
})



//create room endpoint
app.post("/create-room", authMiddleware, async (req, res) => {
    const parsed = roomSchema.safeParse(req.body);
    //which user created the room 
    const userId = (req as any).userId;
    const data = parsed.data;

      if (!userId) {
        return res.status(401).json({
            message: "Unauthorized"
        });
    }

    const room = {
        id: `room_${Date.now()}`,
        slug: data!.slug,
        adminId: userId,
        createdAt: new Date()
    };
    rooms.push(room);

    res.json({
        message: "room created successfully",
        roomId: room.id
    })
})




app.listen(3001, () => {
    console.log("HTTPS Server running on port 3001")
})