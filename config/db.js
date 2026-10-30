
import { MongoClient } from "mongodb";

let db;

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI;
        const dbName = process.env.DB_NAME;

        if (!uri || !dbName) {
            throw new Error("MongoDB environment variables are missing");
        }

        const client = new MongoClient(uri);

        await client.connect();

        db = client.db(dbName);

        console.log("MongoDB Connected Successfully!");

        return db;
    } catch (error) {
        console.error("MongoDB Connection Failed:", error.message);
        throw error;
    }
};

const getDB = () => {
    if (!db) {
        throw new Error("Database is not connected yet");
    }

    return db;
};

export { connectDB, getDB };
