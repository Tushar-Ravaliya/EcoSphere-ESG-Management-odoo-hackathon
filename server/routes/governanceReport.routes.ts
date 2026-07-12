import express from "express";
import asyncHandler from "express-async-handler";
import Audit from "../models/Audit.js";
import ComplianceIssue from "../models/ComplianceIssue.js";
import Policy from "../models/Policy.js";
import PolicyAcknowledgement from "../models/PolicyAcknowledgement.js";
import Employee from "../models/Employee.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/governance-report/summary
 * Governance health overview.
 * Filters: ?from=&to=&department=
 */
router.get(
  "/summary",
  protect,
  asyncHandler(async (req, res) => {
    const auditFilter: any = {};
    if (req.query.department) auditFilter.department = req.query.department;
    if (req.query.from || req.query.to) {
      auditFilter.scheduledDate = {};
      if (req.query.from) auditFilter.scheduledDate.$gte = new Date(req.query.from as string);
      if (req.query.to) auditFilter.scheduledDate.$lte = new Date(req.query.to as string);
    }

    // Audit stats
    const totalAudits = await Audit.countDocuments(auditFilter);
    const completedAudits = await Audit.countDocuments({ ...auditFilter, status: "Completed" });
    const scheduledAudits = await Audit.countDocuments({ ...auditFilter, status: "Scheduled" });

    // Compliance issue stats
    const totalIssues = await ComplianceIssue.countDocuments();
    const openIssues = await ComplianceIssue.countDocuments({ status: "Open" });
    const inProgressIssues = await ComplianceIssue.countDocuments({ status: "In Progress" });
    const resolvedIssues = await ComplianceIssue.countDocuments({ status: "Resolved" });
    const overdueIssues = await ComplianceIssue.countDocuments({
      status: { $ne: "Resolved" },
      dueDate: { $lt: new Date() },
    });

    // Issues by severity
    const bySeverity = await ComplianceIssue.aggregate([
      { $group: { _id: "$severity", count: { $sum: 1 } } },
      { $project: { severity: "$_id", count: 1, _id: 0 } },
      { $sort: { count: -1 } },
    ]);

    // Policy acknowledgement rate
    const activePolicies = await Policy.countDocuments({ status: "Active" });
    const totalEmployees = await Employee.countDocuments();
    const totalPossibleAcks = activePolicies * totalEmployees;
    const actualAcks = await PolicyAcknowledgement.countDocuments();
    const ackRate = totalPossibleAcks > 0 ? Math.round((actualAcks / totalPossibleAcks) * 100) : 0;

    // Governance score: penalise open + overdue issues, reward high ack rate
    const governanceScore = Math.max(
      0,
      Math.min(100, 100 - openIssues * 5 - overdueIssues * 10 + Math.round(ackRate * 0.2))
    );

    res.json({
      audits: { total: totalAudits, completed: completedAudits, scheduled: scheduledAudits },
      complianceIssues: {
        total: totalIssues,
        open: openIssues,
        inProgress: inProgressIssues,
        resolved: resolvedIssues,
        overdue: overdueIssues,
        bySeverity,
      },
      policyAcknowledgement: {
        activePolicies,
        totalEmployees,
        acknowledged: actualAcks,
        rate: ackRate,
      },
      governanceScore,
    });
  })
);

/**
 * GET /api/governance-report/policies
 * Per-policy acknowledgement breakdown.
 */
router.get(
  "/policies",
  protect,
  asyncHandler(async (req, res) => {
    const policies = await Policy.find({ status: "Active" });
    const totalEmployees = await Employee.countDocuments();

    const result = await Promise.all(
      policies.map(async (p) => {
        const ackCount = await PolicyAcknowledgement.countDocuments({ policy: p._id });
        return {
          policy: { id: p._id, title: p.title },
          acknowledged: ackCount,
          pending: Math.max(0, totalEmployees - ackCount),
          ackRate: totalEmployees > 0 ? Math.round((ackCount / totalEmployees) * 100) : 0,
        };
      })
    );

    res.json(result);
  })
);

/**
 * GET /api/governance-report/audits
 * Audit list with associated open issue counts.
 * Filters: ?status=&department=
 */
router.get(
  "/audits",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.department) filter.department = req.query.department;

    const audits = await Audit.find(filter)
      .populate("auditor", "name email")
      .populate("department", "name code")
      .sort({ scheduledDate: -1 });

    const result = await Promise.all(
      audits.map(async (a: any) => {
        const openIssueCount = await ComplianceIssue.countDocuments({
          audit: a._id,
          status: { $ne: "Resolved" },
        });
        const overdueIssueCount = await ComplianceIssue.countDocuments({
          audit: a._id,
          status: { $ne: "Resolved" },
          dueDate: { $lt: new Date() },
        });
        return { ...a.toObject(), openIssueCount, overdueIssueCount };
      })
    );

    res.json(result);
  })
);

/**
 * GET /api/governance-report/compliance-issues
 * Filtered compliance issues with overdue flagging.
 * Filters: ?severity=&status=&owner=&from=&to=
 */
router.get(
  "/compliance-issues",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.severity) filter.severity = req.query.severity;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.owner) filter.owner = req.query.owner;
    if (req.query.from || req.query.to) {
      filter.dueDate = {};
      if (req.query.from) filter.dueDate.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.dueDate.$lte = new Date(req.query.to as string);
    }

    const issues = await ComplianceIssue.find(filter)
      .populate("audit", "title department")
      .populate("owner", "name email")
      .sort({ dueDate: 1 });

    res.json(issues); // isOverdue virtual included via toJSON
  })
);

export default router;
