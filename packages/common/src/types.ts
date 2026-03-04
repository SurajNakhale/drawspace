import z from "zod"


export const signupSchema = z.object({
    name: z.string().min(3).max(6),
    username: z.string().min(5).max(6),
    password: z.string().min(3).min(6)
})

export const signinSchema = z.object({  
    username: z.string().min(5).max(6),
    password: z.string().min(3).min(6)
})

export const roomSchema = z.object({
    name: z.string().min(3).max(6)
})