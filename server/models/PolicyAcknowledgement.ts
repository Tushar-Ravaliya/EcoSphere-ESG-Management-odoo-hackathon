import mongoose from "mongoose";

const policyAcknowledgementSchema = new mongoose.Schema(
  {
    policy: { type: mongoose.Schema.Types.ObjectId, ref: "Policy", required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    acknowledgedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

policyAcknowledgementSchema.index({ policy: 1, employee: 1 }, { unique: true });

export default mongoose.model("PolicyAcknowledgement", policyAcknowledgementSchema);
