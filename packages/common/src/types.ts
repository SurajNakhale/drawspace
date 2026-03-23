import z from "zod"


export const signupSchema = z.object({
    name: z.string().min(3).max(6),
    username: z.string().min(5).max(12),
    password: z.string().min(3).max(12)
})

export const signinSchema = z.object({  
    username: z.string().min(5).max(12),
    password: z.string().min(3).max(12)
})

export const roomSchema = z.object({
    slug: z.string().min(4).max(12)
})