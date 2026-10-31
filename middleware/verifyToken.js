
import {
    createRemoteJWKSet,
    jwtVerify,
} from "jose";

let JWKS;

const getJWKS = () => {
    if (!JWKS) {
        const authBaseUrl = process.env.AUTH_BASE_URL;

        if (!authBaseUrl) {
            throw new Error("AUTH_BASE_URL is missing");
        }

        const jwksUrl = new URL("/api/auth/jwks", authBaseUrl);

        JWKS = createRemoteJWKSet(jwksUrl);
    }

    return JWKS;
};

const verifyToken = async (req, res, next) => {
    try {
        // Get Authorization header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized access. Token required.",
            });
        }

        // Extract JWT token
        const token = authHeader.split(" ")[1];

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Invalid authorization token.",
            });
        }

        // Verify JWT
        const { payload } = await jwtVerify(token, getJWKS(), {
            issuer: process.env.AUTH_BASE_URL,
            audience: process.env.AUTH_BASE_URL,
        });

        // Attach verified user information
        req.user = {
            id: payload.sub,
            email: payload.email,
        };

        next();

    } catch (error) {
        console.error("JWT Verification Error:", error.message);

        return res.status(401).json({
            success: false,
            message: "Invalid or expired token.",
        });
    }
};

export default verifyToken;
