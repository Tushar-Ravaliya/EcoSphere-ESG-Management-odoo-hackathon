import express from "express";
import asyncHandler from "express-async-handler";
import ComplianceIssue from "../models/ComplianceIssue.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const issues = await ComplianceIssue.find().populate("owner", "name email");
  res.json(issues); // isOverdue virtual is included via toJSON
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await ComplianceIssue.create(req.body));
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const issue = await ComplianceIssue.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(issue);
}));

// Overdue issues still open - feeds the notification system
router.get("/alerts/overdue", asyncHandler(async (req, res) => {
  const overdue = await ComplianceIssue.find({
    status: { $ne: "Resolved" },
    dueDate: { $lt: new Date() },
  }).populate("owner", "name email");
  res.json(overdue);
}));

export default router;
