
import { MongoClient } from "mongodb";

let db;
let client;
let clientPromise;

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        const dbName = process.env.DB_NAME;

        if (!uri || !dbName) {
            throw new Error("MongoDB environment variables are missing");
        }

        // Reuse the existing MongoDB connection
        if (!clientPromise) {
            client = new MongoClient(uri);
            clientPromise = client.connect();
        }

        if (!db) {
            await clientPromise;
            db = client.db(dbName);

            // Create unique compound index for participants
            await db.collection("participants").createIndex(
                {
                    eventId: 1,
                    userId: 1,
                },
                {
                    unique: true,
                }
            );

            console.log("Participant Unique Index Created!");
            console.log("MongoDB Connected Successfully!");
        }

        return db;
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);

        // Allow a future invocation to retry a failed connection
        clientPromise = null;
        client = null;
        db = null;

        throw error;
    }
};

const getDB = () => {
    if (!db) {
        throw new Error("Database is not connected yet");
    }

    return db;
};

const getMongoClient = () => {
    if (!client) {
        throw new Error("MongoDB client is not connected yet");
    }

    return client;
};

export { connectDB, getDB, getMongoClient };
