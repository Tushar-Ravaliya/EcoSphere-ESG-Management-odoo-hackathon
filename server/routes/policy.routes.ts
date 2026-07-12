import express from "express";
import asyncHandler from "express-async-handler";
import Policy from "../models/Policy.js";
import PolicyAcknowledgement from "../models/PolicyAcknowledgement.js";
import Employee from "../models/Employee.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/policies
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    else filter.status = "Active"; // default: only active policies
    res.json(await Policy.find(filter).sort({ createdAt: -1 }));
  })
);

// GET /api/policies/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      res.status(404);
      throw new Error("Policy not found");
    }
    res.json(policy);
  })
);

// POST /api/policies  — admin only
router.post(
  "/",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    if (!req.body.title) {
      res.status(400);
      throw new Error("title is required");
    }
    const policy = await Policy.create(req.body);
    res.status(201).json(policy);
  })
);

// PUT /api/policies/:id  — admin only
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const policy = await Policy.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!policy) {
      res.status(404);
      throw new Error("Policy not found");
    }
    res.json(policy);
  })
);

// PATCH /api/policies/:id/archive  — admin only
router.patch(
  "/:id/archive",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const policy = await Policy.findByIdAndUpdate(req.params.id, { status: "Archived" }, { new: true });
    if (!policy) {
      res.status(404);
      throw new Error("Policy not found");
    }
    res.json(policy);
  })
);

// POST /api/policies/:id/acknowledge  — any authenticated user
router.post(
  "/:id/acknowledge",
  protect,
  asyncHandler(async (req, res) => {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      res.status(404);
      throw new Error("Policy not found");
    }
    if (policy.status === "Archived") {
      res.status(400);
      throw new Error("Cannot acknowledge an archived policy");
    }

    // Use the authenticated user's id; allow admin to supply employeeId override
    const employeeId = (req as any).user.role === "admin" && req.body.employeeId
      ? req.body.employeeId
      : (req as any).user._id;

    // upsert: safe to call multiple times
    const ack = await PolicyAcknowledgement.findOneAndUpdate(
      { policy: req.params.id, employee: employeeId },
      { acknowledgedAt: new Date() },
      { upsert: true, new: true }
    );
    res.status(201).json(ack);
  })
);

// GET /api/policies/:id/acknowledgements  — who has acknowledged
router.get(
  "/:id/acknowledgements",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const acks = await PolicyAcknowledgement.find({ policy: req.params.id })
      .populate("employee", "name email department")
      .sort({ acknowledgedAt: -1 });
    res.json(acks);
  })
);

// GET /api/policies/:id/pending  — who has NOT acknowledged (for reminders)
router.get(
  "/:id/pending",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const acknowledged = await PolicyAcknowledgement.find({ policy: req.params.id }).select("employee");
    const acknowledgedIds = acknowledged.map((a: any) => a.employee.toString());
    const pending = await Employee.find({ _id: { $nin: acknowledgedIds } }).select("name email department");
    res.json(pending);
  })
);

export default router;
