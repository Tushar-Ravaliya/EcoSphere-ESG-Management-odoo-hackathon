import mongoose from "mongoose";

const environmentalGoalSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null }, // null = org-wide
    targetCO2: { type: Number, required: true }, // kg CO2e target
    currentCO2: { type: Number, default: 0 },   // updated on each carbon transaction
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["Active", "Achieved", "Missed", "Archived"],
      default: "Active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("EnvironmentalGoal", environmentalGoalSchema);
