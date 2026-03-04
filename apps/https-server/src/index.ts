import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import { authMiddleware } from "./middleware";
import { JWT_SECRET } from "@repo/backend-common/config"
import { signupSchema, signinSchema, roomSchema } from "@repo/common/types"
const app = express();

app.use(express.json())
//signup endpoint
app.post("/signup",async (req, res) => {

    const parsed = signupSchema.safeParse(req.body);

    if(!parsed.success){
        res.json({
            message: "invalid input!!"
        })
        return;
    }

    const user = parsed.data;
    const password = user?.password;
    
    const hashpass = await bcrypt.hash(password as string, 5)

    //inser user into database
    try{
        
     let createdUser =  await userDB.create({
            name: user?.name,
            username: user?.username,
            password: hashpass,
        })

        if(!createdUser){
            res.json({
                error: "error occured"
            })
        }
        res.json({
            message: "user created!! signup successfull"
        })

    }
    catch(err){
        res.json({
            message: console.log(err)
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


    let user = await userDb.findOne({
        username: data.username
    })

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
            userId: user._id
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
    //ehich user created the room 
    const userId = req.userId;
    const data = parsed.data;


    let room = await roomdb.create({
            name: data?.name,
            createdby: req.userId
    })

    res.json({
        message: "room created successfully",
        roomId: room._id
    })
})



app.listen({port: 3001})