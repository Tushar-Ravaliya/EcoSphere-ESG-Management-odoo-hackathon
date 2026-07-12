import express from "express";
import asyncHandler from "express-async-handler";
import Reward from "../models/Reward.js";
import Employee from "../models/Employee.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/rewards
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    else filter.status = "Active";
    res.json(await Reward.find(filter).sort({ pointsRequired: 1 }));
  })
);

// GET /api/rewards/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const reward = await Reward.findById(req.params.id);
    if (!reward) {
      res.status(404);
      throw new Error("Reward not found");
    }
    res.json(reward);
  })
);

// POST /api/rewards  — admin only
router.post(
  "/",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { name, pointsRequired } = req.body;
    if (!name || pointsRequired === undefined) {
      res.status(400);
      throw new Error("name and pointsRequired are required");
    }
    const reward = await Reward.create(req.body);
    res.status(201).json(reward);
  })
);

// PUT /api/rewards/:id  — admin only
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const reward = await Reward.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!reward) {
      res.status(404);
      throw new Error("Reward not found");
    }
    res.json(reward);
  })
);

// DELETE /api/rewards/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const reward = await Reward.findByIdAndDelete(req.params.id);
    if (!reward) {
      res.status(404);
      throw new Error("Reward not found");
    }
    res.json({ message: "Reward deleted" });
  })
);

// POST /api/rewards/:id/redeem  — authenticated employee
// Business rule: deducts points, checks stock
router.post(
  "/:id/redeem",
  protect,
  asyncHandler(async (req, res) => {
    const reward = await Reward.findById(req.params.id);
    if (!reward || reward.status !== "Active") {
      res.status(404);
      throw new Error("Reward not found or inactive");
    }
    if (reward.stock <= 0) {
      res.status(400);
      throw new Error("Reward is out of stock");
    }

    // allow admin to redeem on behalf of another employee
    const employeeId =
      (req as any).user.role === "admin" && req.body.employeeId
        ? req.body.employeeId
        : (req as any).user._id;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }
    if (employee.points < reward.pointsRequired) {
      res.status(400);
      throw new Error(`Not enough points. Need ${reward.pointsRequired}, have ${employee.points}`);
    }

    reward.stock -= 1;
    employee.points -= reward.pointsRequired;
    await reward.save();
    await employee.save();

    res.json({
      message: "Reward redeemed successfully",
      reward: { id: reward._id, name: reward.name },
      employeePointsRemaining: employee.points,
    });
  })
);

export default router;
