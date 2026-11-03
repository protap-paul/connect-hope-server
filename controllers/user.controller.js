import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const getMyProfile = async (req, res) => {
    try {
        const db = getDB();

        const userId = req.user.id;

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        // Find user using ObjectId
        const user = await db.collection("user").findOne(
            { _id: new ObjectId(userId) },
            {
                projection: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    image: 1,
                    createdAt: 1,
                },
            }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User profile not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile fetched successfully.",
            data: user,
        });
    } catch (error) {
        console.error("Get Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch user profile.",
        });
    }
};

const updateMyProfile = async (req, res) => {
    try {
        const db = getDB();
        const userId = req.user.id;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid user ID.",
            });
        }

        const { name, image } = req.body;

        // Validate name
        if (name !== undefined) {
            if (typeof name !== "string" || name.trim().length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Name must contain at least 2 characters.",
                });
            }
        }

        // Validate image URL
        if (image !== undefined) {
            if (typeof image !== "string") {
                return res.status(400).json({
                    success: false,
                    message: "Invalid profile image URL.",
                });
            }

            try {
                const imageUrl = new URL(image);

                if (!["http:", "https:"].includes(imageUrl.protocol)) {
                    throw new Error("Invalid protocol");
                }
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid image URL.",
                });
            }
        }

        // Prevent empty update
        if (name === undefined && image === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide name or image to update.",
            });
        }

        const updateData = {
            updatedAt: new Date(),
        };

        if (name !== undefined) {
            updateData.name = name.trim();
        }

        if (image !== undefined) {
            updateData.image = image.trim();
        }

        const result = await db.collection("user").findOneAndUpdate(
            { _id: new ObjectId(userId) },
            { $set: updateData },
            {
                returnDocument: "after",
                projection: {
                    _id: 1,
                    name: 1,
                    email: 1,
                    image: 1,
                    createdAt: 1,
                    updatedAt: 1,
                },
            }
        );

        if (!result) {
            return res.status(404).json({
                success: false,
                message: "User profile not found.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Profile updated successfully.",
            data: result,
        });
    } catch (error) {
        console.error("Update Profile Error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to update profile.",
        });
    }
};

export { getMyProfile, updateMyProfile };