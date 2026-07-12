import express from "express";
import asyncHandler from "express-async-handler";
import Policy from "../models/Policy.js";
import PolicyAcknowledgement from "../models/PolicyAcknowledgement.js";
import Employee from "../models/Employee.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  res.json(await Policy.find({ status: "Active" }));
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await Policy.create(req.body));
}));

// POST /:id/acknowledge  { employeeId }
router.post("/:id/acknowledge", asyncHandler(async (req, res) => {
  const ack = await PolicyAcknowledgement.create({
    policy: req.params.id,
    employee: req.body.employeeId,
  });
  res.status(201).json(ack);
}));

// Who has NOT acknowledged a given policy yet (for reminder notifications)
router.get("/:id/pending", asyncHandler(async (req, res) => {
  const acknowledged = await PolicyAcknowledgement.find({ policy: req.params.id }).select("employee");
  const acknowledgedIds = acknowledged.map((a: any) => a.employee.toString());
  const pending = await Employee.find({ _id: { $nin: acknowledgedIds } }).select("name email");
  res.json(pending);
}));

export default router;
