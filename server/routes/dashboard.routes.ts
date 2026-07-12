import express from "express";
import asyncHandler from "express-async-handler";
import CarbonTransaction from "../models/CarbonTransaction.js";
import EmployeeParticipation from "../models/EmployeeParticipation.js";
import ChallengeParticipation from "../models/ChallengeParticipation.js";
import ComplianceIssue from "../models/ComplianceIssue.js";
import Department from "../models/Department.js";

const router = express.Router();

// Configurable weights - move to a Settings/ESGConfig collection if you have time,
// hardcoded here to match the doc's default (Env 40 / Social 30 / Gov 30).
const WEIGHTS = { environmental: 0.4, social: 0.3, governance: 0.3 };

// GET /api/dashboard/scores
// Computes a live per-department ESG score. This is intentionally computed on read
// instead of stored, so there is no separate DepartmentScore sync job to maintain.
router.get(
  "/scores",
  asyncHandler(async (req, res) => {
    const departments = await Department.find();

    const results = await Promise.all(
      departments.map(async (dept: any) => {
        // Environmental: lower total CO2 = better. Normalize against a simple cap for demo purposes.
        const carbonAgg = await CarbonTransaction.aggregate([
          { $match: { department: dept._id } },
          { $group: { _id: null, totalCO2: { $sum: "$calculatedCO2" } } },
        ]);
        const totalCO2 = carbonAgg[0]?.totalCO2 || 0;
        const CO2_CAP_FOR_DEMO = 1000; // tune based on your seeded data scale
        const environmentalScore = Math.max(0, 100 - (totalCO2 / CO2_CAP_FOR_DEMO) * 100);

        // Social: % of CSR participations approved, scaled to 100
        const csrTotal = await EmployeeParticipation.countDocuments();
        const csrApproved = await EmployeeParticipation.countDocuments({ approvalStatus: "Approved" });
        const challengeTotal = await ChallengeParticipation.countDocuments();
        const challengeApproved = await ChallengeParticipation.countDocuments({ approvalStatus: "Approved" });
        const socialDenominator = csrTotal + challengeTotal || 1;
        const socialScore = ((csrApproved + challengeApproved) / socialDenominator) * 100;

        // Governance: penalize open/overdue compliance issues
        const openIssues = await ComplianceIssue.countDocuments({ status: { $ne: "Resolved" } });
        const overdueIssues = await ComplianceIssue.countDocuments({
          status: { $ne: "Resolved" },
          dueDate: { $lt: new Date() },
        });
        const governanceScore = Math.max(0, 100 - openIssues * 5 - overdueIssues * 10);

        const totalScore =
          environmentalScore * WEIGHTS.environmental +
          socialScore * WEIGHTS.social +
          governanceScore * WEIGHTS.governance;

        return {
          department: dept.name,
          departmentId: dept._id,
          environmentalScore: Math.round(environmentalScore),
          socialScore: Math.round(socialScore),
          governanceScore: Math.round(governanceScore),
          totalScore: Math.round(totalScore),
        };
      })
    );

    const overallScore = results.length
      ? Math.round(results.reduce((sum, r) => sum + r.totalScore, 0) / results.length)
      : 0;

    res.json({ departments: results, overallScore, weights: WEIGHTS });
  })
);

export default router;
