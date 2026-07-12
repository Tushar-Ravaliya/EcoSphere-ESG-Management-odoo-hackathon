import mongoose from "mongoose";

const challengeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    description: { type: String },
    xp: { type: Number, required: true },
    difficulty: { type: String, enum: ["Easy", "Medium", "Hard"], default: "Easy" },
    evidenceRequired: { type: Boolean, default: false },
    deadline: { type: Date },
    status: {
      type: String,
      enum: ["Draft", "Active", "Under Review", "Completed", "Archived"],
      default: "Draft",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Challenge", challengeSchema);
