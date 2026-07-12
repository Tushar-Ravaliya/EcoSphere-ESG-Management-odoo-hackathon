import express from "express";
import asyncHandler from "express-async-handler";
import { protect, requireRole } from "../middleware/auth.js";
import { sendPDF, sendExcel, ReportData, fmt } from "../utils/reportBuilder.js";

import CarbonTransaction from "../models/CarbonTransaction.js";
import EnvironmentalGoal from "../models/EnvironmentalGoal.js";
import EmployeeParticipation from "../models/EmployeeParticipation.js";
import CSRActivity from "../models/CSRActivity.js";
import ChallengeParticipation from "../models/ChallengeParticipation.js";
import Challenge from "../models/Challenge.js";
import ComplianceIssue from "../models/ComplianceIssue.js";
import PolicyAcknowledgement from "../models/PolicyAcknowledgement.js";
import Policy from "../models/Policy.js";
import Employee from "../models/Employee.js";
import EmployeeBadge from "../models/EmployeeBadge.js";
import Badge from "../models/Badge.js";

const router = express.Router();

/**
 * GET /api/reports/export
 * Unified ESG + Gamification Report Export
 * Query params:
 *   - format: "pdf" | "excel" (default: pdf)
 *   - module: "environmental" | "social" | "governance" | "gamification" | "all" (default: all)
 *   - from: date filter (optional)
 *   - to: date filter (optional)
 *   - department: ObjectId (optional)
 */
router.get(
  "/export",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const format = (req.query.format as string) || "pdf";
    const module = (req.query.module as string) || "all";
    const from = req.query.from ? new Date(req.query.from as string) : null;
    const to = req.query.to ? new Date(req.query.to as string) : null;
    const department = req.query.department ? req.query.department : null;

    const filters: Record<string, string> = {
      Module: module,
      From: from ? from.toISOString().split("T")[0] : "",
      To: to ? to.toISOString().split("T")[0] : "",
      Department: department ? String(department) : "",
    };

    const data: ReportData = {
      title: `EcoSphere ESG Report — ${module.charAt(0).toUpperCase() + module.slice(1)}`,
      generatedAt: new Date().toISOString(),
      filters,
      sections: [],
    };

    // ─── Environmental ──────────────────────────────────────────────────────────

    if (module === "all" || module === "environmental") {
      const carbonMatch: any = {};
      if (department) carbonMatch.department = department;
      if (from || to) {
        carbonMatch.date = {};
        if (from) carbonMatch.date.$gte = from;
        if (to) carbonMatch.date.$lte = to;
      }

      const carbonTxs = await CarbonTransaction.find(carbonMatch)
        .populate("department", "name")
        .populate("emissionFactor", "name unit sourceType")
        .limit(100)
        .sort({ date: -1 });

      data.sections.push({
        title: "Environmental — Carbon Transactions",
        rows: carbonTxs.map((tx) => ({
          Date: tx.date.toISOString().split("T")[0],
          Department: (tx as any).department?.name ?? "-",
          Factor: (tx as any).emissionFactor?.name ?? "-",
          Unit: (tx as any).emissionFactor?.unit ?? "-",
          Quantity: fmt(tx.quantity),
          "CO2 (kg)": fmt(tx.calculatedCO2),
        })),
      });

      const goalFilter: any = {};
      if (department) goalFilter.department = department;
      const goals = await EnvironmentalGoal.find(goalFilter)
        .populate("department", "name")
        .sort({ endDate: 1 })
        .limit(50);

      data.sections.push({
        title: "Environmental — Goals",
        rows: goals.map((g) => ({
          Title: g.title,
          Department: (g as any).department?.name ?? "Org-wide",
          "Target CO2": fmt(g.targetCO2),
          "Current CO2": fmt(g.currentCO2),
          "Progress %": fmt((g.currentCO2 / g.targetCO2) * 100, 1),
          Status: g.status,
        })),
      });
    }

    // ─── Social ─────────────────────────────────────────────────────────────────

    if (module === "all" || module === "social") {
      const csrMatch: any = {};
      if (from || to) {
        csrMatch.completionDate = {};
        if (from) csrMatch.completionDate.$gte = from;
        if (to) csrMatch.completionDate.$lte = to;
      }
      if (department) {
        const deptEmps = await Employee.find({ department }).select("_id");
        csrMatch.employee = { $in: deptEmps.map((e) => e._id) };
      }

      const csrParticipations = await EmployeeParticipation.find(csrMatch)
        .populate("employee", "name")
        .populate("activity", "title")
        .limit(100)
        .sort({ createdAt: -1 });

      data.sections.push({
        title: "Social — CSR Participation",
        rows: csrParticipations.map((p) => ({
          Employee: (p as any).employee?.name ?? "-",
          Activity: (p as any).activity?.title ?? "-",
          "Approval Status": p.approvalStatus,
          "Points Earned": p.pointsEarned,
          "Completion Date": p.completionDate ? p.completionDate.toISOString().split("T")[0] : "-",
        })),
      });

      const activities = await CSRActivity.find().populate("category", "name").limit(50);
      data.sections.push({
        title: "Social — CSR Activities",
        rows: activities.map((a) => ({
          Title: a.title,
          Category: (a as any).category?.name ?? "-",
          Status: a.status,
          Date: a.date.toISOString().split("T")[0],
        })),
      });
    }

    // ─── Governance ─────────────────────────────────────────────────────────────

    if (module === "all" || module === "governance") {
      const issues = await ComplianceIssue.find()
        .populate("audit", "title")
        .populate("owner", "name")
        .limit(100)
        .sort({ dueDate: 1 });

      data.sections.push({
        title: "Governance — Compliance Issues",
        rows: issues.map((i) => ({
          Audit: (i as any).audit?.title ?? "-",
          Description: i.description || "-",
          Severity: i.severity,
          Owner: (i as any).owner?.name ?? "-",
          "Due Date": i.dueDate.toISOString().split("T")[0],
          Status: i.status,
          Overdue: (i as any).isOverdue ? "Yes" : "No",
        })),
      });

      const policies = await Policy.find({ status: "Active" }).limit(50);
      const policyAckRows = await Promise.all(
        policies.map(async (pol) => {
          const ackCount = await PolicyAcknowledgement.countDocuments({ policy: pol._id });
          const totalEmps = await Employee.countDocuments();
          return {
            Policy: pol.title,
            Acknowledged: ackCount,
            Total: totalEmps,
            "Ack Rate %": totalEmps > 0 ? fmt((ackCount / totalEmps) * 100, 1) : "0",
          };
        })
      );

      data.sections.push({
        title: "Governance — Policy Acknowledgements",
        rows: policyAckRows,
      });
    }

    // ─── Gamification ───────────────────────────────────────────────────────────

    if (module === "all" || module === "gamification") {
      const empFilter: any = {};
      if (department) empFilter.department = department;

      const topEmps = await Employee.find(empFilter)
        .select("name xp points completedChallengeCount")
        .sort({ xp: -1 })
        .limit(20);

      data.sections.push({
        title: "Gamification — Leaderboard (Top 20 by XP)",
        rows: topEmps.map((emp, idx) => ({
          Rank: idx + 1,
          Employee: emp.name,
          XP: emp.xp,
          Points: emp.points,
          "Challenges Completed": emp.completedChallengeCount,
        })),
      });

      const challenges = await Challenge.find().populate("category", "name").limit(50);
      const challengeRows = await Promise.all(
        challenges.map(async (ch) => {
          const total = await ChallengeParticipation.countDocuments({ challenge: ch._id });
          const approved = await ChallengeParticipation.countDocuments({
            challenge: ch._id,
            approvalStatus: "Approved",
          });
          return {
            Title: ch.title,
            Category: (ch as any).category?.name ?? "-",
            XP: ch.xp,
            Difficulty: ch.difficulty,
            Status: ch.status,
            Participations: total,
            Approved: approved,
          };
        })
      );

      data.sections.push({
        title: "Gamification — Challenges",
        rows: challengeRows,
      });

      const badges = await Badge.find().limit(50);
      const badgeRows = await Promise.all(
        badges.map(async (badge) => {
          const unlockCount = await EmployeeBadge.countDocuments({ badge: badge._id });
          return {
            Badge: badge.name,
            Type: badge.unlockRule.type,
            Threshold: badge.unlockRule.threshold,
            "Unlocked By": unlockCount,
          };
        })
      );

      data.sections.push({
        title: "Gamification — Badges",
        rows: badgeRows,
      });
    }

    // ─── Send ───────────────────────────────────────────────────────────────────

    if (format === "excel") {
      await sendExcel(res, data);
    } else {
      sendPDF(res, data);
    }
  })
);

export default router;
