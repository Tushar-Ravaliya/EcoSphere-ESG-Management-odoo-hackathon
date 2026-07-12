import express from "express";
import asyncHandler from "express-async-handler";
import EmployeeParticipation from "../models/EmployeeParticipation.js";
import Employee from "../models/Employee.js";
import { checkAndAwardBadges } from "../utils/badgeCheck.js";

const router = express.Router();

const POINTS_PER_APPROVED_ACTIVITY = 10; // tune as needed, or move to a Settings collection

router.get("/", asyncHandler(async (req, res) => {
  const filter: any = {};
  if (req.query.employee) filter.employee = req.query.employee;
  if (req.query.activity) filter.activity = req.query.activity;
  res.json(
    await EmployeeParticipation.find(filter).populate("employee", "name").populate("activity", "title")
  );
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await EmployeeParticipation.create(req.body));
}));

// PATCH /:id/approve  -> approves participation, awards points, checks badges
router.patch("/:id/approve", asyncHandler(async (req, res) => {
  const participation = await EmployeeParticipation.findById(req.params.id);
  if (!participation) {
    res.status(404);
    throw new Error("Participation not found");
  }

  // Evidence Requirement business rule: block approval if proof missing.
  if (!participation.proof) {
    res.status(400);
    throw new Error("Cannot approve: proof of participation is required");
  }

  participation.approvalStatus = "Approved";
  participation.pointsEarned = POINTS_PER_APPROVED_ACTIVITY;
  participation.completionDate = new Date();
  await participation.save();

  const employee = await Employee.findByIdAndUpdate(
    participation.employee,
    { $inc: { points: POINTS_PER_APPROVED_ACTIVITY } },
    { new: true }
  );

  const newBadges = await checkAndAwardBadges(employee);

  res.json({ participation, newBadges });
}));

router.patch("/:id/reject", asyncHandler(async (req, res) => {
  const participation = await EmployeeParticipation.findByIdAndUpdate(
    req.params.id,
    { approvalStatus: "Rejected" },
    { new: true }
  );
  res.json(participation);
}));

export default router;
