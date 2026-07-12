import express from "express";
import asyncHandler from "express-async-handler";
import EnvironmentalGoal from "../models/EnvironmentalGoal.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/environmental-goals
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;

    const goals = await EnvironmentalGoal.find(filter)
      .populate("department", "name code")
      .sort({ endDate: 1 });

    // Attach progress percentage to each goal
    const withProgress = goals.map((g: any) => ({
      ...g.toObject(),
      progressPct: g.targetCO2 > 0 ? Math.min(100, Math.round((g.currentCO2 / g.targetCO2) * 100)) : 0,
    }));

    res.json(withProgress);
  })
);

// GET /api/environmental-goals/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const goal = await EnvironmentalGoal.findById(req.params.id).populate("department", "name code");
    if (!goal) {
      res.status(404);
      throw new Error("Environmental goal not found");
    }
    res.json({
      ...goal.toObject(),
      progressPct: goal.targetCO2 > 0 ? Math.min(100, Math.round((goal.currentCO2 / goal.targetCO2) * 100)) : 0,
    });
  })
);

// POST /api/environmental-goals  — admin / manager
router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { title, targetCO2, startDate, endDate } = req.body;
    if (!title || targetCO2 === undefined || !startDate || !endDate) {
      res.status(400);
      throw new Error("title, targetCO2, startDate and endDate are required");
    }
    if (new Date(endDate) <= new Date(startDate)) {
      res.status(400);
      throw new Error("endDate must be after startDate");
    }
    const goal = await EnvironmentalGoal.create(req.body);
    res.status(201).json(goal);
  })
);

// PUT /api/environmental-goals/:id
router.put(
  "/:id",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    // Prevent direct overwrite of currentCO2 from client
    delete req.body.currentCO2;

    const goal = await EnvironmentalGoal.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("department", "name code");

    if (!goal) {
      res.status(404);
      throw new Error("Environmental goal not found");
    }
    res.json(goal);
  })
);

// PATCH /api/environmental-goals/:id/archive  — admin only
router.patch(
  "/:id/archive",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const goal = await EnvironmentalGoal.findByIdAndUpdate(
      req.params.id,
      { status: "Archived" },
      { new: true }
    );
    if (!goal) {
      res.status(404);
      throw new Error("Environmental goal not found");
    }
    res.json(goal);
  })
);

// DELETE /api/environmental-goals/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const goal = await EnvironmentalGoal.findByIdAndDelete(req.params.id);
    if (!goal) {
      res.status(404);
      throw new Error("Environmental goal not found");
    }
    res.json({ message: "Environmental goal deleted" });
  })
);

export default router;
