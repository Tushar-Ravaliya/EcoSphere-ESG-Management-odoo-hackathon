import mongoose from "mongoose";

const policySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    status: { type: String, enum: ["Active", "Archived"], default: "Active" },
  },
  { timestamps: true }
);

export default mongoose.model("Policy", policySchema);
