import express from "express";
import asyncHandler from "express-async-handler";
import Audit from "../models/Audit.js";
import ComplianceIssue from "../models/ComplianceIssue.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/audits
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;
    if (req.query.auditor) filter.auditor = req.query.auditor;

    const audits = await Audit.find(filter)
      .populate("auditor", "name email")
      .populate("department", "name code")
      .sort({ scheduledDate: -1 });
    res.json(audits);
  })
);

// GET /api/audits/:id  — with its compliance issues
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const audit = await Audit.findById(req.params.id)
      .populate("auditor", "name email")
      .populate("department", "name code");
    if (!audit) {
      res.status(404);
      throw new Error("Audit not found");
    }
    const issues = await ComplianceIssue.find({ audit: audit._id }).populate("owner", "name email");
    res.json({ audit, issues });
  })
);

// POST /api/audits  — admin / manager
router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { title, auditor, scheduledDate } = req.body;
    if (!title || !auditor || !scheduledDate) {
      res.status(400);
      throw new Error("title, auditor and scheduledDate are required");
    }
    const audit = await Audit.create(req.body);
    res.status(201).json(audit);
  })
);

// PUT /api/audits/:id  — admin / manager
router.put(
  "/:id",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const audit = await Audit.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate("auditor", "name email")
      .populate("department", "name code");
    if (!audit) {
      res.status(404);
      throw new Error("Audit not found");
    }
    res.json(audit);
  })
);

// PATCH /api/audits/:id/complete  — marks audit completed with findings
router.patch(
  "/:id/complete",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const audit = await Audit.findByIdAndUpdate(
      req.params.id,
      { status: "Completed", completedDate: new Date(), findings: req.body.findings },
      { new: true }
    );
    if (!audit) {
      res.status(404);
      throw new Error("Audit not found");
    }
    res.json(audit);
  })
);

// DELETE /api/audits/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const audit = await Audit.findByIdAndDelete(req.params.id);
    if (!audit) {
      res.status(404);
      throw new Error("Audit not found");
    }
    res.json({ message: "Audit deleted" });
  })
);

export default router;
