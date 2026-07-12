import express from "express";
import asyncHandler from "express-async-handler";
import Reward from "../models/Reward.js";
import Employee from "../models/Employee.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  res.json(await Reward.find({ status: "Active" }));
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await Reward.create(req.body));
}));

// POST /:id/redeem  { employeeId }
router.post("/:id/redeem", asyncHandler(async (req, res) => {
  const reward = await Reward.findById(req.params.id);
  const employee = await Employee.findById(req.body.employeeId);

  if (!reward || reward.stock <= 0) {
    res.status(400);
    throw new Error("Reward is out of stock");
  }
  if (!employee || employee.points < reward.pointsRequired) {
    res.status(400);
    throw new Error("Not enough points to redeem this reward");
  }

  reward.stock -= 1;
  employee.points -= reward.pointsRequired;
  await reward.save();
  await employee.save();

  res.json({ reward, employeePointsRemaining: employee.points });
}));

export default router;
