import mongoose from "mongoose";

const employeeParticipationSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    activity: { type: mongoose.Schema.Types.ObjectId, ref: "CSRActivity", required: true },
    proof: { type: Boolean, default: false }, // stand-in for real file upload
    approvalStatus: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending" },
    pointsEarned: { type: Number, default: 0 },
    completionDate: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("EmployeeParticipation", employeeParticipationSchema);
