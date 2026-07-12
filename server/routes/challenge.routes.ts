import express from "express";
import asyncHandler from "express-async-handler";
import Challenge from "../models/Challenge.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Valid lifecycle transitions
const TRANSITIONS: Record<string, string[]> = {
  Draft: ["Active", "Archived"],
  Active: ["Under Review", "Archived"],
  "Under Review": ["Completed", "Active", "Archived"],
  Completed: ["Archived"],
  Archived: [],
};

// GET /api/challenges
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.difficulty) filter.difficulty = req.query.difficulty;

    const challenges = await Challenge.find(filter)
      .populate("category", "name type")
      .sort({ createdAt: -1 });
    res.json(challenges);
  })
);

// GET /api/challenges/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const challenge = await Challenge.findById(req.params.id).populate("category", "name type");
    if (!challenge) {
      res.status(404);
      throw new Error("Challenge not found");
    }
    res.json(challenge);
  })
);

// POST /api/challenges  — admin / manager
router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { title, xp } = req.body;
    if (!title || xp === undefined) {
      res.status(400);
      throw new Error("title and xp are required");
    }
    const challenge = await Challenge.create(req.body);
    res.status(201).json(challenge);
  })
);

// PUT /api/challenges/:id  — admin / manager (only when Draft)
router.put(
  "/:id",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      res.status(404);
      throw new Error("Challenge not found");
    }
    if (challenge.status !== "Draft") {
      res.status(400);
      throw new Error("Only Draft challenges can be fully edited");
    }
    // status changes must go through the /status endpoint
    delete req.body.status;
    const updated = await Challenge.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category", "name type");
    res.json(updated);
  })
);

// PATCH /api/challenges/:id/status  — enforces lifecycle
router.patch(
  "/:id/status",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { status } = req.body;
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      res.status(404);
      throw new Error("Challenge not found");
    }
    const allowed = TRANSITIONS[challenge.status] ?? [];
    if (!allowed.includes(status)) {
      res.status(400);
      throw new Error(`Cannot transition from "${challenge.status}" to "${status}"`);
    }
    challenge.status = status;
    await challenge.save();
    res.json(challenge);
  })
);

// DELETE /api/challenges/:id  — admin only, only Draft/Archived
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const challenge = await Challenge.findById(req.params.id);
    if (!challenge) {
      res.status(404);
      throw new Error("Challenge not found");
    }
    if (!["Draft", "Archived"].includes(challenge.status)) {
      res.status(400);
      throw new Error("Only Draft or Archived challenges can be deleted");
    }
    await challenge.deleteOne();
    res.json({ message: "Challenge deleted" });
  })
);

export default router;
