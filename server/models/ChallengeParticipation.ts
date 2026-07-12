import mongoose from "mongoose";

const challengeParticipationSchema = new mongoose.Schema(
  {
    challenge: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge", required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    progress: { type: Number, default: 0 }, // 0-100
    proof: { type: Boolean, default: false },
    approvalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    xpAwarded: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("ChallengeParticipation", challengeParticipationSchema);
