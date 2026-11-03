import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import eventRoutes from "./routes/event.routes.js";
import userRoutes from "./routes/user.routes.js";
import verifyToken from "./middleware/verifyToken.js";

dotenv.config();

const app = express();

const PORT = process.env.PORT || 5000;

// Middleware
app.use(
    cors({
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PATCH", "DELETE"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "10kb" }));

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);

// Test Route

app.get("/api/protected", verifyToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: "You have accessed a protected route!",
        user: req.user,
    });
});

app.get("/", (req, res) => {
    res.send("Welcome to ConnectHope Server!");
});

// Handle unknown API routes
app.use((req, res, next) => {
    const error = new Error(
        `Route not found: ${req.originalUrl}`
    );

    error.statusCode = 404;

    next(error);
});

// Global Error Handler
app.use((error, req, res, next) => {
    console.error("Global Error:", error);

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message:
            statusCode === 500
                ? "Internal Server Error."
                : error.message,
    });
});

// Start Server
const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`ConnectHope Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server failed to start:", error.message);
        process.exit(1);
    }
};

startServer();
