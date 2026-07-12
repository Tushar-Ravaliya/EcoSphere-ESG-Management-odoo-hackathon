import express from "express";
import asyncHandler from "express-async-handler";
import Badge from "../models/Badge.js";
import EmployeeBadge from "../models/EmployeeBadge.js";
import Employee from "../models/Employee.js";
import { checkAndAwardBadges } from "../utils/badgeCheck.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/badges
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    res.json(await Badge.find().sort({ "unlockRule.threshold": 1 }));
  })
);

// GET /api/badges/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const badge = await Badge.findById(req.params.id);
    if (!badge) {
      res.status(404);
      throw new Error("Badge not found");
    }
    res.json(badge);
  })
);

// POST /api/badges  — admin only
router.post(
  "/",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { name, unlockRule } = req.body;
    if (!name || !unlockRule?.type || unlockRule?.threshold === undefined) {
      res.status(400);
      throw new Error("name and unlockRule (type + threshold) are required");
    }
    const badge = await Badge.create(req.body);
    res.status(201).json(badge);
  })
);

// PUT /api/badges/:id  — admin only
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!badge) {
      res.status(404);
      throw new Error("Badge not found");
    }
    res.json(badge);
  })
);

// DELETE /api/badges/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) {
      res.status(404);
      throw new Error("Badge not found");
    }
    res.json({ message: "Badge deleted" });
  })
);

// GET /api/badges/employee/:employeeId  — badges earned by an employee
router.get(
  "/employee/:employeeId",
  protect,
  asyncHandler(async (req, res) => {
    const unlocked = await EmployeeBadge.find({ employee: req.params.employeeId })
      .populate("badge")
      .sort({ unlockedAt: -1 });
    res.json(unlocked);
  })
);

// POST /api/badges/employee/:employeeId/check  — manually trigger badge check (admin)
router.post(
  "/employee/:employeeId/check",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }
    const newBadges = await checkAndAwardBadges(employee);
    res.json({ newBadges, count: newBadges.length });
  })
);

export default router;
