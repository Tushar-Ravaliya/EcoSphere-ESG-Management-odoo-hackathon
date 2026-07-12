import mongoose from "mongoose";

// Join table: which employee unlocked which badge and when.
const employeeBadgeSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    badge: { type: mongoose.Schema.Types.ObjectId, ref: "Badge", required: true },
    unlockedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

employeeBadgeSchema.index({ employee: 1, badge: 1 }, { unique: true });

export default mongoose.model("EmployeeBadge", employeeBadgeSchema);
