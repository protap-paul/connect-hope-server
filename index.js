
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
const allowedOrigins = [
    "http://localhost:3000",
    process.env.CLIENT_URL,
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            // Allow requests without an Origin header (e.g. Postman)
            if (!origin || allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error("Not allowed by CORS"));
        },
        methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

app.use(express.json({ limit: "10kb" }));

// Ensure MongoDB connection before handling requests
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database Connection Error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Database connection failed.",
        });
    }
});

// Routes
app.use("/api/events", eventRoutes);
app.use("/api/users", userRoutes);

// Protected Test Route
app.get("/api/protected", verifyToken, (req, res) => {
    res.status(200).json({
        success: true,
        message: "You have accessed a protected route!",
        user: req.user,
    });
});

// Ignore browser favicon request
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});

// Home Route
app.get("/", (req, res) => {
    res.send("Welcome to ConnectHope Server!");
});

// Handle Unknown Routes
app.use((req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
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

// Local Development Server
if (!process.env.VERCEL) {
    const startServer = async () => {
        try {
            await connectDB();

            app.listen(PORT, () => {
                console.log(
                    `ConnectHope Server running on port ${PORT}`
                );
            });
        } catch (error) {
            console.error(
                "Server failed to start:",
                error.message
            );
            process.exit(1);
        }
    };

    startServer();
}

// Export Express app for Vercel
export default app;
