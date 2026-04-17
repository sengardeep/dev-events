import mongoose, { type Mongoose } from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI

type MongooseCache = {
    conn: Mongoose | null
    promise: Promise<Mongoose> | null
}

const globalForMongoose = globalThis as typeof globalThis & {
    mongooseCache?: MongooseCache
}

// Reuse the same cache during hot reloads to avoid opening extra connections.
const cached = globalForMongoose.mongooseCache ?? { conn: null, promise: null }

if (!globalForMongoose.mongooseCache) {
    globalForMongoose.mongooseCache = cached
}

// Return a single shared Mongoose connection for the whole app lifecycle.
export default async function connectToDatabase(): Promise<Mongoose> {
    if (!MONGODB_URI) {
        throw new Error("Please define the MONGODB_URI environment variable.")
    }

    if (cached.conn) {
        return cached.conn
    }

    if (!cached.promise) {
        cached.promise = mongoose.connect(MONGODB_URI)
    }

    try {
        cached.conn = await cached.promise
    } catch (error) {
        cached.promise = null
        throw error
    }

    return cached.conn
}