import express from "express";
import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const employees = await Employee.find().select("-password").populate("department", "name code");
  res.json(employees);
}));

router.post("/", asyncHandler(async (req, res) => {
  const employee = await Employee.create(req.body); // password auto-hashed by pre-save hook
  res.status(201).json({ ...employee.toObject(), password: undefined });
}));

router.get("/leaderboard", asyncHandler(async (req, res) => {
  const leaderboard = await Employee.find().select("name xp points department").sort({ xp: -1 }).limit(20);
  res.json(leaderboard);
}));

export default router;
