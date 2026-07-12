import express from "express";
import asyncHandler from "express-async-handler";
import EmployeeParticipation from "../models/EmployeeParticipation.js";
import Employee from "../models/Employee.js";
import { checkAndAwardBadges } from "../utils/badgeCheck.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

const POINTS_PER_APPROVED_ACTIVITY = 10;

// GET /api/employee-participations
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.employee) filter.employee = req.query.employee;
    if (req.query.activity) filter.activity = req.query.activity;
    if (req.query.approvalStatus) filter.approvalStatus = req.query.approvalStatus;

    const participations = await EmployeeParticipation.find(filter)
      .populate("employee", "name email department")
      .populate({ path: "activity", select: "title category status", populate: { path: "category", select: "name" } })
      .sort({ createdAt: -1 });
    res.json(participations);
  })
);

// GET /api/employee-participations/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const participation = await EmployeeParticipation.findById(req.params.id)
      .populate("employee", "name email")
      .populate("activity", "title status");
    if (!participation) {
      res.status(404);
      throw new Error("Participation not found");
    }
    res.json(participation);
  })
);

// POST /api/employee-participations  — employee submits participation
router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const { employee, activity } = req.body;
    if (!employee || !activity) {
      res.status(400);
      throw new Error("employee and activity are required");
    }
    // prevent duplicate submissions
    const existing = await EmployeeParticipation.findOne({ employee, activity });
    if (existing) {
      res.status(409);
      throw new Error("Employee has already submitted participation for this activity");
    }
    const participation = await EmployeeParticipation.create(req.body);
    res.status(201).json(participation);
  })
);

// PUT /api/employee-participations/:id  — update proof or details before approval
router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    // once approved/rejected, no further edits
    const existing = await EmployeeParticipation.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error("Participation not found");
    }
    if (existing.approvalStatus !== "Pending") {
      res.status(400);
      throw new Error("Cannot edit a participation that has already been reviewed");
    }
    // prevent client from self-approving
    delete req.body.approvalStatus;
    delete req.body.pointsEarned;

    const updated = await EmployeeParticipation.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    res.json(updated);
  })
);

// PATCH /api/employee-participations/:id/approve  — manager / admin
router.patch(
  "/:id/approve",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const participation = await EmployeeParticipation.findById(req.params.id);
    if (!participation) {
      res.status(404);
      throw new Error("Participation not found");
    }
    if (participation.approvalStatus !== "Pending") {
      res.status(400);
      throw new Error("Participation has already been reviewed");
    }
    // Evidence Requirement business rule
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
  })
);

// PATCH /api/employee-participations/:id/reject  — manager / admin
router.patch(
  "/:id/reject",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const participation = await EmployeeParticipation.findById(req.params.id);
    if (!participation) {
      res.status(404);
      throw new Error("Participation not found");
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
