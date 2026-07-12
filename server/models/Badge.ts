import mongoose from "mongoose";

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    icon: { type: String }, // emoji or icon name, keep simple for hackathon
    unlockRule: {
      type: {
        type: String,
        enum: ["xp", "completedChallengeCount", "points"],
        required: true,
      },
      threshold: { type: Number, required: true },
    },
  },
  { timestamps: true }
);

export default mongoose.model("Badge", badgeSchema);
