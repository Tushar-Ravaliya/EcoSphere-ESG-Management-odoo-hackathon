import Badge from "../models/Badge.js";
import EmployeeBadge from "../models/EmployeeBadge.js";

/**
 * Call this after any action that changes an employee's xp / points / completedChallengeCount
 * (e.g. after approving a CSR participation, or after a challenge is marked Approved).
 * It auto-awards any badge whose unlockRule is now satisfied and wasn't already unlocked.
 * Returns the list of newly unlocked badges (useful for triggering a toast + notification).
 */
export const checkAndAwardBadges = async (employee: any): Promise<any[]> => {
  const allBadges = await Badge.find();
  const alreadyUnlocked = await EmployeeBadge.find({ employee: employee._id }).select("badge");
  const unlockedIds = new Set(alreadyUnlocked.map((b: any) => b.badge.toString()));

  const newlyUnlocked: any[] = [];

  for (const badge of allBadges as any[]) {
    if (unlockedIds.has(badge._id.toString())) continue;

    const metric =
      badge.unlockRule.type === "xp"
        ? employee.xp
        : badge.unlockRule.type === "points"
        ? employee.points
        : employee.completedChallengeCount;

    if (metric >= badge.unlockRule.threshold) {
      await EmployeeBadge.create({ employee: employee._id, badge: badge._id });
      newlyUnlocked.push(badge);
    }
  }

  return newlyUnlocked;
};
