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
        //db call to create new user in users table
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
    catch(err: any){
        res.status(500).json({
            message: "error creating user",
            error: err.message,
            code: err.code,
            meta: err.meta
        })
    }

})


//signin endpoint
app.post("/signin", async (req, res) => {

    try{
        const parsed = signinSchema.safeParse(req.body);
    
        if(!parsed.success){
            res.status(400).json({
                message: "invalid input!!"
            })
            return;
        }
    
        let data = parsed.data
    
        //database call to check the user present or not
        let user = await prisma.user.findUnique({
            where: {
                username: data.username
            }
        });
    
        if(!user){
            res.status(401).json({
                message: "user does not exist"
            })
            return;
        }
    
        let passMatch = await bcrypt.compare(data.password, user.password)
    
        if(!passMatch){
            res.status(401).json({
                message: "incorrect password"
            })
            return;
        }
    
        if(passMatch){
            let token = jwt.sign({
                userId: user.id
            }, 
            JWT_SECRET, 
            { expiresIn: "7d" }
        )
    
            return res.json({
                token,
                message: "signin successfully"
            });
        }

    }
    catch(err){
        return res.status(500).json({
            message: "Internal server error"
        });
    }

})



//create room endpoint
app.post("/create-room", authMiddleware, async (req, res) => {
    //which user created the room 
    const userId = (req as any).userId;
    
    if (!userId){
        return res.status(401).json({
            message: "Unauthorized"
        });
    }
    
    const parsed = roomSchema.safeParse(req.body);
    
    if (!parsed.success) {
        return res.status(400).json({
            message: "Invalid input"
        })
    }
    
    const { slug } = parsed.data;
    
    try{
        const existing = await prisma.room.findUnique({
            where: { 
                slug 
            }
        })

        if (existing) {
            return res.status(400).json({
                message: "Room already exists"
            })
        }

        const room = await prisma.room.create({
            data: {
                slug,
                adminId: userId
            }
        })
    
        return res.json({
            message: "room created successfully",
            roomId: room.id
        })

    }
    catch(err){
        return res.status(500).json({
            message: "Ineternal Server error"
        })
    }
})




app.listen(3001, () => {
    console.log("HTTPS Server running on port 3001")
})