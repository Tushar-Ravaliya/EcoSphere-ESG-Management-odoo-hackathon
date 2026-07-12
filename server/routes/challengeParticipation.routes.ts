import express from "express";
import asyncHandler from "express-async-handler";
import ChallengeParticipation from "../models/ChallengeParticipation.js";
import Challenge from "../models/Challenge.js";
import Employee from "../models/Employee.js";
import { checkAndAwardBadges } from "../utils/badgeCheck.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/challenge-participations
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.challenge) filter.challenge = req.query.challenge;
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;

    const participations = await ChallengeParticipation.find(filter)
      .populate("employee", "name email department")
      .populate({ path: "challenge", select: "title xp difficulty status", populate: { path: "category", select: "name" } })
      .sort({ createdAt: -1 });
    res.json(participations);
  })
);

// GET /api/challenge-participations/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const participation = await ChallengeParticipation.findById(req.params.id)
      .populate("employee", "name email")
      .populate("challenge", "title xp evidenceRequired");
    if (!participation) {
      res.status(404);
      throw new Error("Challenge participation not found");
    }
    res.json(participation);
  })
);

// POST /api/challenge-participations  — employee joins a challenge
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { employee, challenge } = req.body;
    if (!employee || !challenge) {
      res.status(400);
      throw new Error("employee and challenge are required");
    }

    const ch = await Challenge.findById(challenge);
    if (!ch || ch.status !== "Active") {
      res.status(400);
      throw new Error("Can only join Active challenges");
    }

    const existing = await ChallengeParticipation.findOne({ employee, challenge });
    if (existing) {
      res.status(409);
      throw new Error("Employee has already joined this challenge");
    }

    const participation = await ChallengeParticipation.create(req.body);
    res.status(201).json(participation);
  })
);

// PATCH /api/challenge-participations/:id/progress  — employee updates their progress + proof
router.patch(
  "/:id/progress",
  protect,
  asyncHandler(async (req, res) => {
    const { progress, proof } = req.body;
    const participation = await ChallengeParticipation.findById(req.params.id);
    if (!participation) {
      res.status(404);
      throw new Error("Challenge participation not found");
    }
    if (participation.approvalStatus !== "Pending") {
      res.status(400);
      throw new Error("Cannot update a participation that has already been reviewed");
    }
    if (progress !== undefined) participation.progress = Math.min(100, Math.max(0, progress));
    if (proof !== undefined) participation.proof = proof;
    await participation.save();
    res.json(participation);
  })
);

// PATCH /api/challenge-participations/:id/approve  — manager / admin
router.patch(
  "/:id/approve",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const participation = await ChallengeParticipation.findById(req.params.id).populate("challenge");
    if (!participation) {
      res.status(404);
      throw new Error("Challenge participation not found");
    }
    if (participation.approvalStatus !== "Pending") {
      res.status(400);
      throw new Error("Participation has already been reviewed");
    }

    const challenge = participation.challenge as any;
    if (challenge.evidenceRequired && !participation.proof) {
      res.status(400);
      throw new Error("Cannot approve: evidence is required for this challenge");
    }

    participation.approvalStatus = "Approved";
    participation.xpAwarded = challenge.xp;
    await participation.save();

    const employee = await Employee.findByIdAndUpdate(
      participation.employee,
      { $inc: { xp: challenge.xp, completedChallengeCount: 1 } },
      { new: true }
    );

    const newBadges = await checkAndAwardBadges(employee);

    res.json({ participation, newBadges });
  })
);

// PATCH /api/challenge-participations/:id/reject  — manager / admin
router.patch(
  "/:id/reject",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const participation = await ChallengeParticipation.findById(req.params.id);
    if (!participation) {
      res.status(404);
      throw new Error("Challenge participation not found");
    }
    if (participation.approvalStatus !== "Pending") {
      res.status(400);
      throw new Error("Participation has already been reviewed");
    }
    participation.approvalStatus = "Rejected";
    await participation.save();
    res.json(participation);
  })
);

export default router;
