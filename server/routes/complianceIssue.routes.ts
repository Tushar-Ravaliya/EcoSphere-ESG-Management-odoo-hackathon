import express from "express";
import asyncHandler from "express-async-handler";
import ComplianceIssue from "../models/ComplianceIssue.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/compliance-issues
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.audit) filter.audit = req.query.audit;
    if (req.query.owner) filter.owner = req.query.owner;

    const issues = await ComplianceIssue.find(filter)
      .populate("audit", "title scheduledDate status")
      .populate("owner", "name email")
      .sort({ dueDate: 1 });
    res.json(issues); // isOverdue virtual included via toJSON
  })
);

// GET /api/compliance-issues/alerts/overdue  — must be before /:id
router.get(
  "/alerts/overdue",
  protect,
  asyncHandler(async (req, res) => {
    const overdue = await ComplianceIssue.find({
      status: { $ne: "Resolved" },
      dueDate: { $lt: new Date() },
    })
      .populate("audit", "title")
      .populate("owner", "name email");
    res.json(overdue);
  })
);

// GET /api/compliance-issues/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const issue = await ComplianceIssue.findById(req.params.id)
      .populate("audit", "title scheduledDate status")
      .populate("owner", "name email");
    if (!issue) {
      res.status(404);
      throw new Error("Compliance issue not found");
    }
    res.json(issue);
  })
);

// POST /api/compliance-issues  — admin / manager
// Business rule: owner and dueDate are required (enforced by model + here)
router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { audit, severity, owner, dueDate } = req.body;
    if (!audit || !severity || !owner || !dueDate) {
      res.status(400);
      throw new Error("audit, severity, owner and dueDate are required");
    }
    const issue = await ComplianceIssue.create(req.body);
    res.status(201).json(
      await issue.populate([
        { path: "audit", select: "title" },
        { path: "owner", select: "name email" },
      ])
    );
  })
);

// PUT /api/compliance-issues/:id  — admin / manager
router.put(
  "/:id",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const issue = await ComplianceIssue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("audit", "title")
      .populate("owner", "name email");
    if (!issue) {
      res.status(404);
      throw new Error("Compliance issue not found");
    }
    res.json(issue);
  })
);

// PATCH /api/compliance-issues/:id/resolve  — admin / manager
router.patch(
  "/:id/resolve",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const issue = await ComplianceIssue.findByIdAndUpdate(
      req.params.id,
      { status: "Resolved" },
      { new: true }
    );
    if (!issue) {
      res.status(404);
      throw new Error("Compliance issue not found");
    }
    res.json(issue);
  })
);

// DELETE /api/compliance-issues/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const issue = await ComplianceIssue.findByIdAndDelete(req.params.id);
    if (!issue) {
      res.status(404);
      throw new Error("Compliance issue not found");
    }
    res.json({ message: "Compliance issue deleted" });
  })
);

export default router;
