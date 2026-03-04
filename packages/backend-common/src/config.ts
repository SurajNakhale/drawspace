declare global {
    namespace Express {
        interface Request {
            userId?: string;
        }
    }
}


export const JWT_SECRET = process.env.JWT_SECRET || "123123";