import express from "express";
import asyncHandler from "express-async-handler";
import Challenge from "../models/Challenge.js";
import ChallengeParticipation from "../models/ChallengeParticipation.js";
import Badge from "../models/Badge.js";
import EmployeeBadge from "../models/EmployeeBadge.js";
import Employee from "../models/Employee.js";
import Reward from "../models/Reward.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /api/gamification-report/summary
 * Overall gamification engagement metrics.
 * Filters: ?department=
 */
router.get(
  "/summary",
  protect,
  asyncHandler(async (req, res) => {
    const employeeFilter: any = {};
    if (req.query.department) employeeFilter.department = req.query.department;

    const employees = await Employee.find(employeeFilter).select("_id");
    const employeeIds = employees.map((e) => e._id);

    // Challenge stats
    const totalChallenges = await Challenge.countDocuments();
    const activeChallenges = await Challenge.countDocuments({ status: "Active" });
    const completedChallenges = await Challenge.countDocuments({ status: "Completed" });

    const totalParticipations = await ChallengeParticipation.countDocuments(
      employeeIds.length ? { employee: { $in: employeeIds } } : {}
    );
    const approvedParticipations = await ChallengeParticipation.countDocuments({
      ...(employeeIds.length ? { employee: { $in: employeeIds } } : {}),
      approvalStatus: "Approved",
    });

    // XP stats
    const xpStats = await Employee.aggregate([
      ...(req.query.department ? [{ $match: { department: employeeFilter.department } }] : []),
      { $group: { _id: null, totalXP: { $sum: "$xp" }, avgXP: { $avg: "$xp" }, maxXP: { $max: "$xp" } } },
    ]);

    // Badge stats
    const totalBadges = await Badge.countDocuments();
    const badgesUnlocked = await EmployeeBadge.countDocuments(
      employeeIds.length ? { employee: { $in: employeeIds } } : {}
    );

    // Reward stats
    const activeRewards = await Reward.countDocuments({ status: "Active" });
    const pointsStats = await Employee.aggregate([
      ...(req.query.department ? [{ $match: { department: employeeFilter.department } }] : []),
      { $group: { _id: null, totalPoints: { $sum: "$points" }, avgPoints: { $avg: "$points" } } },
    ]);

    res.json({
      challenges: {
        total: totalChallenges,
        active: activeChallenges,
        completed: completedChallenges,
        participations: totalParticipations,
        approved: approvedParticipations,
        participationRate: totalChallenges > 0 ? Math.round((totalParticipations / totalChallenges) * 100) : 0,
      },
      xp: {
        total: xpStats[0]?.totalXP ?? 0,
        average: Math.round(xpStats[0]?.avgXP ?? 0),
        highest: xpStats[0]?.maxXP ?? 0,
      },
      badges: {
        total: totalBadges,
        unlocked: badgesUnlocked,
        unlockRate: totalBadges > 0 ? Math.round((badgesUnlocked / totalBadges) * 100) : 0,
      },
      rewards: {
        active: activeRewards,
        totalPoints: pointsStats[0]?.totalPoints ?? 0,
        avgPoints: Math.round(pointsStats[0]?.avgPoints ?? 0),
      },
    });
  })
);

/**
 * GET /api/gamification-report/leaderboard
 * Top employees by XP.
 * Filters: ?department=&limit=20
 */
router.get(
  "/leaderboard",
  protect,
  asyncHandler(async (req, res) => {
    const limit = parseInt(req.query.limit as string) || 20;
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;

    const leaderboard = await Employee.find(filter)
      .select("name email xp points completedChallengeCount department")
      .populate("department", "name")
      .sort({ xp: -1 })
      .limit(limit);

    const withRank = leaderboard.map((emp, idx) => ({
      rank: idx + 1,
      employeeId: emp._id,
      name: emp.name,
      email: emp.email,
      xp: emp.xp,
      points: emp.points,
      completedChallenges: emp.completedChallengeCount,
      department: (emp as any).department?.name ?? null,
    }));

    res.json(withRank);
  })
);

/**
 * GET /api/gamification-report/challenges
 * Challenge engagement breakdown.
 * Filters: ?status=&category=
 */
router.get(
  "/challenges",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const challenges = await Challenge.find(filter)
      .populate("category", "name")
      .sort({ createdAt: -1 });

    const result = await Promise.all(
      challenges.map(async (ch) => {
        const participations = await ChallengeParticipation.countDocuments({ challenge: ch._id });
        const approved = await ChallengeParticipation.countDocuments({
          challenge: ch._id,
          approvalStatus: "Approved",
        });
        return {
          ...ch.toObject(),
          participations,
          approved,
          completionRate: participations > 0 ? Math.round((approved / participations) * 100) : 0,
        };
      })
    );

    res.json(result);
  })
);

/**
 * GET /api/gamification-report/badges
 * Badge unlock stats.
 */
router.get(
  "/badges",
  protect,
  asyncHandler(async (req, res) => {
    const badges = await Badge.find().sort({ "unlockRule.threshold": 1 });

    const result = await Promise.all(
      badges.map(async (badge) => {
        const unlockCount = await EmployeeBadge.countDocuments({ badge: badge._id });
        return {
          ...badge.toObject(),
          unlockedBy: unlockCount,
        };
      })
    );

    res.json(result);
  })
);

/**
 * GET /api/gamification-report/employee/:employeeId
 * Individual employee gamification profile.
 */
router.get(
  "/employee/:employeeId",
  protect,
  asyncHandler(async (req, res) => {
    const employee = await Employee.findById(req.params.employeeId)
      .select("name email xp points completedChallengeCount department")
      .populate("department", "name");
    if (!employee) {
      res.status(404);
      throw new Error("Employee not found");
    }

    const participations = await ChallengeParticipation.find({ employee: employee._id })
      .populate("challenge", "title xp difficulty")
      .sort({ createdAt: -1 });

    const badges = await EmployeeBadge.find({ employee: employee._id })
      .populate("badge")
      .sort({ unlockedAt: -1 });

    const approved = participations.filter((p) => p.approvalStatus === "Approved").length;
    const pending = participations.filter((p) => p.approvalStatus === "Pending").length;

    res.json({
      employee: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        xp: employee.xp,
        points: employee.points,
        completedChallenges: employee.completedChallengeCount,
        department: (employee as any).department?.name ?? null,
      },
      challengeParticipations: {
        total: participations.length,
        approved,
        pending,
        rejected: participations.length - approved - pending,
        list: participations,
      },
      badges: {
        total: badges.length,
        list: badges,
      },
    });
  })
);

export default router;
