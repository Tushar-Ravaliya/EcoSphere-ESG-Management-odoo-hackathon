import mongoose from "mongoose";

const auditSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    auditor: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null }, // null = org-wide
    scheduledDate: { type: Date, required: true },
    completedDate: { type: Date },
    status: {
      type: String,
      enum: ["Scheduled", "In Progress", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    findings: { type: String }, // free-text summary
  },
  { timestamps: true }
);

export default mongoose.model("Audit", auditSchema);
