import mongoose from "mongoose";

const complianceIssueSchema = new mongoose.Schema(
  {
    auditTitle: { type: String, required: true }, // simplified stand-in for a full Audit model
    severity: { type: String, enum: ["Low", "Medium", "High", "Critical"], required: true },
    description: { type: String },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    dueDate: { type: Date, required: true },
    status: { type: String, enum: ["Open", "In Progress", "Resolved"], default: "Open" },
  },
  { timestamps: true }
);

// Virtual: is this issue overdue right now?
complianceIssueSchema.virtual("isOverdue").get(function (this: any) {
  return this.status !== "Resolved" && this.dueDate < new Date();
});
complianceIssueSchema.set("toJSON", { virtuals: true });

export default mongoose.model("ComplianceIssue", complianceIssueSchema);
