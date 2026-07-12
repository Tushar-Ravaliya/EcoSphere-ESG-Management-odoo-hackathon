import express from "express";
import asyncHandler from "express-async-handler";
import ChallengeParticipation from "../models/ChallengeParticipation.js";
import Challenge from "../models/Challenge.js";
import Employee from "../models/Employee.js";
import { checkAndAwardBadges } from "../utils/badgeCheck.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const filter: any = {};
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.challenge) filter.challenge = req.query.challenge;
  res.json(
    await ChallengeParticipation.find(filter).populate("employee", "name").populate("challenge", "title xp")
  );
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await ChallengeParticipation.create(req.body));
}));

router.patch("/:id/approve", asyncHandler(async (req, res) => {
  const participation = await ChallengeParticipation.findById(req.params.id).populate("challenge");
  if (!participation) {
    res.status(404);
    throw new Error("Participation not found");
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
    { $inc: { xp: participation.xpAwarded, completedChallengeCount: 1 } },
    { new: true }
  );

  const newBadges = await checkAndAwardBadges(employee);

  res.json({ participation, newBadges });
}));

export default router;
