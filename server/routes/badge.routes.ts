import express from "express";
import asyncHandler from "express-async-handler";
import Badge from "../models/Badge.js";
import EmployeeBadge from "../models/EmployeeBadge.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  res.json(await Badge.find());
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await Badge.create(req.body));
}));

// Badges unlocked by one employee - for their profile page.
router.get("/employee/:employeeId", asyncHandler(async (req, res) => {
  const unlocked = await EmployeeBadge.find({ employee: req.params.employeeId }).populate("badge");
  res.json(unlocked);
}));

export default router;
