import express from "express";
import asyncHandler from "express-async-handler";
import Department from "../models/Department.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const departments = await Department.find().populate("head", "name email");
  res.json(departments);
}));

router.post("/", asyncHandler(async (req, res) => {
  const dept = await Department.create(req.body);
  res.status(201).json(dept);
}));

router.put("/:id", asyncHandler(async (req, res) => {
  const dept = await Department.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(dept);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await Department.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted" });
}));

export default router;
