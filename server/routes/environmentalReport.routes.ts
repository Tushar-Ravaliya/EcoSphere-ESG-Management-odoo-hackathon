import express from "express";
import asyncHandler from "express-async-handler";
import CarbonTransaction from "../models/CarbonTransaction.js";
import EnvironmentalGoal from "../models/EnvironmentalGoal.js";
import EmissionFactor from "../models/EmissionFactor.js";
import Department from "../models/Department.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/environmental-report/summary
 * Overall environmental summary with optional filters:
 *   ?from=YYYY-MM-DD&to=YYYY-MM-DD&department=<id>
 */
router.get(
  "/summary",
  protect,
  asyncHandler(async (req, res) => {
    const match: any = {};
    if (req.query.department) match.department = req.query.department;
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from as string);
      if (req.query.to) match.date.$lte = new Date(req.query.to as string);
    }

    // Total CO2 for the period
    const totalAgg = await CarbonTransaction.aggregate([
      { $match: match },
      { $group: { _id: null, totalCO2: { $sum: "$calculatedCO2" }, count: { $sum: 1 } } },
    ]);

    // CO2 grouped by department
    const byDept = await CarbonTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$department",
          totalCO2: { $sum: "$calculatedCO2" },
          transactionCount: { $sum: 1 },
        },
      },
      {
        $lookup: { from: "departments", localField: "_id", foreignField: "_id", as: "dept" },
      },
      { $unwind: { path: "$dept", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          department: "$dept.name",
          departmentCode: "$dept.code",
          totalCO2: 1,
          transactionCount: 1,
        },
      },
      { $sort: { totalCO2: -1 } },
    ]);

    // CO2 grouped by source type (via emission factor)
    const bySource = await CarbonTransaction.aggregate([
      { $match: match },
      {
        $lookup: {
          from: "emissionfactors",
          localField: "emissionFactor",
          foreignField: "_id",
          as: "factor",
        },
      },
      { $unwind: "$factor" },
      {
        $group: {
          _id: "$factor.sourceType",
          totalCO2: { $sum: "$calculatedCO2" },
          transactionCount: { $sum: 1 },
        },
      },
      { $project: { sourceType: "$_id", totalCO2: 1, transactionCount: 1, _id: 0 } },
      { $sort: { totalCO2: -1 } },
    ]);

    // Monthly trend
    const monthlyTrend = await CarbonTransaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" },
          },
          totalCO2: { $sum: "$calculatedCO2" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          period: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $cond: [
                  { $lt: ["$_id.month", 10] },
                  { $concat: ["0", { $toString: "$_id.month" }] },
                  { $toString: "$_id.month" },
                ],
              },
            ],
          },
          totalCO2: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      totalCO2: totalAgg[0]?.totalCO2 ?? 0,
      transactionCount: totalAgg[0]?.count ?? 0,
      byDepartment: byDept,
      bySourceType: bySource,
      monthlyTrend,
    });
  })
);

/**
 * GET /api/environmental-report/goals
 * All environmental goals with live progress, filterable by department & status.
 */
router.get(
  "/goals",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.status) filter.status = req.query.status;

    const goals = await EnvironmentalGoal.find(filter)
      .populate("department", "name code")
      .sort({ endDate: 1 });

    const result = goals.map((g: any) => ({
      ...g.toObject(),
      progressPct: g.targetCO2 > 0 ? Math.min(100, Math.round((g.currentCO2 / g.targetCO2) * 100)) : 0,
      onTrack: g.currentCO2 <= g.targetCO2,
    }));

    res.json(result);
  })
);

/**
 * GET /api/environmental-report/department/:departmentId
 * Detailed carbon breakdown for a single department.
 */
router.get(
  "/department/:departmentId",
  protect,
  asyncHandler(async (req, res) => {
    const { departmentId } = req.params;

    const dept = await Department.findById(departmentId);
    if (!dept) {
      res.status(404);
      throw new Error("Department not found");
    }

    const match: any = { department: dept._id };
    if (req.query.from || req.query.to) {
      match.date = {};
      if (req.query.from) match.date.$gte = new Date(req.query.from as string);
      if (req.query.to) match.date.$lte = new Date(req.query.to as string);
    }

    const transactions = await CarbonTransaction.find(match)
      .populate("emissionFactor", "name unit co2PerUnit sourceType")
      .sort({ date: -1 });

    const totalCO2 = transactions.reduce((sum, t) => sum + t.calculatedCO2, 0);

    const goals = await EnvironmentalGoal.find({
      $or: [{ department: dept._id }, { department: null }],
      status: { $in: ["Active", "Achieved", "Missed"] },
    });

    res.json({
      department: { id: dept._id, name: dept.name, code: dept.code },
      totalCO2,
      transactionCount: transactions.length,
      transactions,
      goals: goals.map((g: any) => ({
        ...g.toObject(),
        progressPct: g.targetCO2 > 0 ? Math.min(100, Math.round((g.currentCO2 / g.targetCO2) * 100)) : 0,
      })),
    });
  })
);

export default router;
