
import express from "express";

import {
    getUpcomingEvents,
    getEventDetails,
    createEvent,
    getMyEvents,
    updateEvent,
    deleteEvent,
    joinEvent,
    getMyJoinedEvents,
} from "../controllers/event.controller.js";

import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();


// Public GET Route
router.get("/upcoming", getUpcomingEvents);

// Private GET Routes
router.get("/my-events", verifyToken, getMyEvents);
router.get("/joined/my-events", verifyToken, getMyJoinedEvents);

// Dynamic GET Route
router.get("/:id", getEventDetails);


// Private POST Routes
router.post("/", verifyToken, createEvent);
router.post("/:id/join", verifyToken, joinEvent);

// Private PATCH and DELETE Routes
router.patch("/:id", verifyToken, updateEvent);
router.delete("/:id", verifyToken, deleteEvent);

export default router;
