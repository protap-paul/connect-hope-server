
import { getDB, getMongoClient } from "../config/db.js";
import { ObjectId } from "mongodb";

const ALLOWED_EVENT_TYPES = [
    "Cleanup",
    "Plantation",
    "Donation",
    "Blood Donation",
    "Food Distribution",
    "Winter Clothes Distribution",
    "Educational Support",
    "Community Support",
    "Other",
];

// Get Upcoming Events
const getUpcomingEvents = async (req, res) => {
    try {
        const db = getDB();

        const currentDate = new Date();

        const events = await db
            .collection("events")
            .find({
                eventDate: { $gt: currentDate },
            })
            .sort({ eventDate: 1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Upcoming events fetched successfully",
            data: events,
        });
    } catch (error) {
        console.error("Get Upcoming Events Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch upcoming events",
        });
    }
};

// Get Single Event Details
const getEventDetails = async (req, res) => {
    try {
        const { id } = req.params;

        // Validate MongoDB ObjectId
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID",
            });
        }

        const db = getDB();

        const event = await db.collection("events").findOne({
            _id: new ObjectId(id),
        });
        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Event not found",
            });
        }
        res.status(200).json({
            success: true,
            message: "Event details fetched successfully.",
            data: event,
        });
    } catch (error) {
        console.error("Get Event Details Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch event details",
        });
    }
}

const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            eventType,
            thumbnail,
            location,
            eventDate,
        } = req.body;

        // Validate required fields
        if (
            !title?.trim() ||
            !description?.trim() ||
            !eventType?.trim() ||
            !thumbnail?.trim() ||
            !location?.trim() ||
            !eventDate
        ) {
            return res.status(400).json({
                success: false,
                message: "All event fields are required.",
            });
        }

        // Validate event type
        if (!ALLOWED_EVENT_TYPES.includes(eventType.trim())) {
            return res.status(400).json({
                success: false,
                message: "Invalid event type.",
            });
        }

        // Validate title length
        if (title.trim().length > 100) {
            return res.status(400).json({
                success: false,
                message: "Event title cannot exceed 100 characters.",
            });
        }

        // Validate description length
        if (description.trim().length > 2000) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 2000 characters.",
            });
        }

        // Validate location length
        if (location.trim().length > 150) {
            return res.status(400).json({
                success: false,
                message: "Location cannot exceed 150 characters.",
            });
        }

        // Validate thumbnail URL
        try {
            const imageUrl = new URL(thumbnail.trim());

            if (!["http:", "https:"].includes(imageUrl.protocol)) {
                throw new Error("Invalid URL protocol");
            }
        } catch {
            return res.status(400).json({
                success: false,
                message: "Please provide a valid thumbnail URL.",
            });
        }

        // Validate event date
        const parsedDate = new Date(eventDate);

        if (Number.isNaN(parsedDate.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Invalid event date.",
            });
        }

        if (parsedDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: "Event date must be in the future.",
            });
        }

        // Get authenticated user information
        const { id, email } = req.user;

        if (!id || !email) {
            return res.status(401).json({
                success: false,
                message: "Authenticated user information is missing.",
            });
        }

        const db = getDB();

        const newEvent = {
            title: title.trim(),
            description: description.trim(),
            eventType: eventType.trim(),
            thumbnail: thumbnail.trim(),
            location: location.trim(),
            eventDate: parsedDate,

            // Never trust creator identity from req.body
            creatorId: id,
            creatorEmail: email,

            createdAt: new Date(),
        };

        const result = await db.collection("events").insertOne(newEvent);

        res.status(201).json({
            success: true,
            message: "Event created successfully.",
            data: {
                _id: result.insertedId,
                ...newEvent,
            },
        });

    } catch (error) {
        console.error("Create Event Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to create event.",
        });
    }
};

const getMyEvents = async (req, res) => {
    try {
        const db = getDB();

        // Get authenticated user's ID
        const { id } = req.user;

        if (!id) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        // Find events created by the logged-in user
        const events = await db.collection("events")
            .find({
                creatorId: id,
            })
            .sort({
                eventDate: 1,
            })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Your events fetched successfully.",
            data: events,
        });

    } catch (error) {
        console.error("Get My Events Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your events.",
        });
    }
};

const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user;

        // Validate Event ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        // Only allow these fields to be updated
        const allowedFields = [
            "title",
            "description",
            "eventType",
            "thumbnail",
            "location",
            "eventDate",
        ];

        const updateData = {};

        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (
                    typeof req.body[field] !== "string" ||
                    !req.body[field].trim()
                ) {
                    return res.status(400).json({
                        success: false,
                        message: `${field} must be a valid non-empty string.`,
                    });
                }

                updateData[field] = req.body[field].trim();
            }
        }

        // Validate event type
        if (
            updateData.eventType &&
            !ALLOWED_EVENT_TYPES.includes(updateData.eventType)
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid event type.",
            });
        }

        // Validate title length
        if (updateData.title && updateData.title.length > 100) {
            return res.status(400).json({
                success: false,
                message: "Event title cannot exceed 100 characters.",
            });
        }

        // Validate description length
        if (
            updateData.description &&
            updateData.description.length > 2000
        ) {
            return res.status(400).json({
                success: false,
                message: "Description cannot exceed 2000 characters.",
            });
        }

        // Validate location length
        if (updateData.location && updateData.location.length > 150) {
            return res.status(400).json({
                success: false,
                message: "Location cannot exceed 150 characters.",
            });
        }

        // Validate thumbnail URL
        if (updateData.thumbnail) {
            try {
                const imageUrl = new URL(updateData.thumbnail);

                if (!["http:", "https:"].includes(imageUrl.protocol)) {
                    throw new Error("Invalid URL protocol");
                }
            } catch {
                return res.status(400).json({
                    success: false,
                    message: "Please provide a valid thumbnail URL.",
                });
            }
        }

        // Validate updated event date
        if (updateData.eventDate) {
            const parsedDate = new Date(updateData.eventDate);

            if (Number.isNaN(parsedDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid event date.",
                });
            }

            if (parsedDate <= new Date()) {
                return res.status(400).json({
                    success: false,
                    message: "Event date must be in the future.",
                });
            }

            updateData.eventDate = parsedDate;
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                success: false,
                message: "No valid fields provided for update.",
            });
        }

        const db = getDB();

        // Update only the event owned by the logged-in user
        const result = await db.collection("events").updateOne(
            {
                _id: new ObjectId(id),
                creatorId: userId,
            },
            {
                $set: {
                    ...updateData,
                    updatedAt: new Date(),
                },
            }
        );

        if (result.matchedCount === 0) {
            return res.status(404).json({
                success: false,
                message: "Event not found or you are not authorized to update it.",
            });
        }

        res.status(200).json({
            success: true,
            message: "Event updated successfully.",
        });

    } catch (error) {
        console.error("Update Event Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to update event.",
        });
    }
};

const deleteEvent = async (req, res) => {
    try {
        const db = getDB();
        const { id } = req.params;
        const { id: userId } = req.user;
        // Validate Event ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        const eventId = new ObjectId(id);

        // Start MongoDB transaction
        const session = getMongoClient().startSession();

        try {
            await session.withTransaction(async () => {
                // Delete only the event owned by the logged-in user
                const result = await db.collection("events").deleteOne(
                    {
                        _id: eventId,
                        creatorId: userId,
                    },
                    { session }
                );

                if (result.deletedCount === 0) {
                    const error = new Error(
                        "Event not found or you are not authorized to delete it."
                    );
                    error.statusCode = 404;
                    throw error;
                }

                // Delete all participants of this event
                await db.collection("participants").deleteMany(
                    { eventId },
                    { session }
                );
            });

            res.status(200).json({
                success: true,
                message: "Event and its participants deleted successfully.",
            });
        } finally {
            await session.endSession();
        }
    } catch (error) {
        console.error("Delete Event Error:", error);

        res.status(error.statusCode || 500).json({
            success: false,
            message: error.statusCode
                ? error.message
                : "Failed to delete event.",
        });
    }
};

const joinEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId, email } = req.user;

        // Validate Event ID
        if (!ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "Invalid event ID.",
            });
        }

        if (!userId || !email) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        const db = getDB();
        const eventId = new ObjectId(id);

        // Check whether the event exists and is upcoming
        const event = await db.collection("events").findOne({
            _id: eventId,
            eventDate: { $gt: new Date() },
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: "Upcoming event not found.",
            });
        }

        // Check whether the user already joined
        const existingParticipant = await db
            .collection("participants")
            .findOne({
                eventId,
                userId,
            });

        if (existingParticipant) {
            return res.status(409).json({
                success: false,
                message: "You have already joined this event.",
            });
        }

        // Create participant record
        const newParticipant = {
            eventId,
            userId,
            userEmail: email,
            joinedAt: new Date(),
        };

        const result = await db
            .collection("participants")
            .insertOne(newParticipant);

        res.status(201).json({
            success: true,
            message: "You have successfully joined the event.",
            data: {
                _id: result.insertedId,
                ...newParticipant,
            },
        });

    } catch (error) {
        console.error("Join Event Error:", error);

        // Handle duplicate participant records
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "You have already joined this event.",
            });
        }

        res.status(500).json({
            success: false,
            message: "Failed to join event.",
        });
    }
};

const getMyJoinedEvents = async (req, res) => {
    try {
        const { id: userId } = req.user;

        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "User authentication required.",
            });
        }

        const db = getDB();

        // Find all events joined by the logged-in user
        const participants = await db
            .collection("participants")
            .find({ userId })
            .toArray();

        // Return empty array if user has not joined any event
        if (participants.length === 0) {
            return res.status(200).json({
                success: true,
                message: "You have not joined any events yet.",
                data: [],
            });
        }

        // Extract event IDs
        const eventIds = participants.map(
            (participant) => participant.eventId
        );

        // Find all joined events
        const events = await db
            .collection("events")
            .find({
                _id: { $in: eventIds },
            })
            .sort({ eventDate: 1 })
            .toArray();

        res.status(200).json({
            success: true,
            message: "Your joined events fetched successfully.",
            data: events,
        });

    } catch (error) {
        console.error("Get My Joined Events Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to fetch your joined events.",
        });
    }
};


export { getUpcomingEvents, getEventDetails, createEvent, getMyEvents, updateEvent, deleteEvent, joinEvent, getMyJoinedEvents };
