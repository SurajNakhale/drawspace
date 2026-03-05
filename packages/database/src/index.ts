// export { prisma } from "./client.js"; // exports instance of prisma
// export * from "../generated/prisma/client.js"; // exports generated types from prisma


import { PrismaClient } from "../generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!
})

export const prismaClient = new PrismaClient({ adapter })