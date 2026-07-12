import express from "express";
import asyncHandler from "express-async-handler";
import EmployeeParticipation from "../models/EmployeeParticipation.js";
import CSRActivity from "../models/CSRActivity.js";
import Employee from "../models/Employee.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/social-report/summary
 * Overall social participation summary.
 * Filters: ?from=&to=&department=&employee=&category=
 */
router.get(
  "/summary",
  protect,
  asyncHandler(async (req, res) => {
    // Build activity filter first so we can scope participations
    const activityFilter: any = {};
    if (req.query.category) activityFilter.category = req.query.category;

    const activityIds = req.query.category
      ? (await CSRActivity.find(activityFilter).select("_id")).map((a) => a._id)
      : null;

    const match: any = {};
    if (activityIds) match.activity = { $in: activityIds };
    if (req.query.employee) match.employee = req.query.employee;
    if (req.query.from || req.query.to) {
      match.completionDate = {};
      if (req.query.from) match.completionDate.$gte = new Date(req.query.from as string);
      if (req.query.to) match.completionDate.$lte = new Date(req.query.to as string);
    }

    // Scope to department: find employees in that department first
    if (req.query.department) {
      const deptEmployees = await Employee.find({ department: req.query.department }).select("_id");
      match.employee = { $in: deptEmployees.map((e) => e._id) };
    }

    const total = await EmployeeParticipation.countDocuments(match);
    const approved = await EmployeeParticipation.countDocuments({ ...match, approvalStatus: "Approved" });
    const rejected = await EmployeeParticipation.countDocuments({ ...match, approvalStatus: "Rejected" });
    const pending = await EmployeeParticipation.countDocuments({ ...match, approvalStatus: "Pending" });

    const totalPointsAwarded = await EmployeeParticipation.aggregate([
      { $match: { ...match, approvalStatus: "Approved" } },
      { $group: { _id: null, total: { $sum: "$pointsEarned" } } },
    ]);

    // Participations per activity
    const byActivity = await EmployeeParticipation.aggregate([
      { $match: match },
      { $group: { _id: "$activity", total: { $sum: 1 }, approved: { $sum: { $cond: [{ $eq: ["$approvalStatus", "Approved"] }, 1, 0] } } } },
      { $lookup: { from: "csractivities", localField: "_id", foreignField: "_id", as: "activity" } },
      { $unwind: { path: "$activity", preserveNullAndEmptyArrays: true } },
      { $project: { activityTitle: "$activity.title", total: 1, approved: 1, _id: 0 } },
      { $sort: { total: -1 } },
    ]);

    // Monthly participation trend
    const monthlyTrend = await EmployeeParticipation.aggregate([
      { $match: { ...match, approvalStatus: "Approved" } },
      {
        $group: {
          _id: { year: { $year: "$completionDate" }, month: { $month: "$completionDate" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
      {
        $project: {
          period: {
            $concat: [
              { $toString: "$_id.year" }, "-",
              { $cond: [{ $lt: ["$_id.month", 10] }, { $concat: ["0", { $toString: "$_id.month" }] }, { $toString: "$_id.month" }] },
            ],
          },
          count: 1,
          _id: 0,
        },
      },
    ]);

    res.json({
      total,
      approved,
      rejected,
      pending,
      approvalRate: total > 0 ? Math.round((approved / total) * 100) : 0,
      totalPointsAwarded: totalPointsAwarded[0]?.total ?? 0,
      byActivity,
      monthlyTrend,
    });
  })
);

/**
 * GET /api/social-report/leaderboard
 * Top employees by points earned from CSR activity participation.
 * Filters: ?department=&limit=10
 */
router.get(
  "/leaderboard",
  protect,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 10;

    const employeeFilter: any = {};
    if (req.query.department) employeeFilter.department = req.query.department;

    const leaderboard = await EmployeeParticipation.aggregate([
      { $match: { approvalStatus: "Approved" } },
      { $group: { _id: "$employee", totalPoints: { $sum: "$pointsEarned" }, activitiesCompleted: { $sum: 1 } } },
      { $sort: { totalPoints: -1 } },
      { $limit: limit },
      { $lookup: { from: "employees", localField: "_id", foreignField: "_id", as: "employee" } },
      { $unwind: "$employee" },
      ...(req.query.department
        ? [{ $match: { "employee.department": new (await import("mongoose")).default.Types.ObjectId(req.query.department as string) } }]
        : []),
      {
        $project: {
          employeeName: "$employee.name",
          employeeId: "$employee._id",
          totalPoints: 1,
          activitiesCompleted: 1,
          _id: 0,
        },
      },
    ]);

    res.json(leaderboard);
  })
);

/**
 * GET /api/social-report/activity/:activityId
 * Detailed breakdown for a single CSR activity.
 */
router.get(
  "/activity/:activityId",
  protect,
  asyncHandler(async (req, res) => {
    const activity = await CSRActivity.findById(req.params.activityId).populate("category", "name");
    if (!activity) {
      res.status(404);
      throw new Error("CSR activity not found");
    }

    const participations = await EmployeeParticipation.find({ activity: activity._id })
      .populate("employee", "name email department")
      .sort({ createdAt: -1 });

    const approved = participations.filter((p) => p.approvalStatus === "Approved").length;
    const pending = participations.filter((p) => p.approvalStatus === "Pending").length;
    const rejected = participations.filter((p) => p.approvalStatus === "Rejected").length;

    res.json({
      activity,
      stats: { total: participations.length, approved, pending, rejected },
      participations,
    });
  })
);

export default router;
