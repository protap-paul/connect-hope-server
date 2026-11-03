import express from "express";
import { getMyProfile, updateMyProfile } from "../controllers/user.controller.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

// Get logged-in user's profile
router.get("/me", verifyToken, getMyProfile);
router.patch("/me", verifyToken, updateMyProfile);

export default router;