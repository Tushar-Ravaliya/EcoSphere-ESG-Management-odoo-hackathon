import mongoose from "mongoose";

const csrActivitySchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: "Category" },
    description: { type: String },
    date: { type: Date, default: Date.now },
    status: { type: String, enum: ["Planned", "Active", "Completed"], default: "Planned" },
  },
  { timestamps: true }
);

export default mongoose.model("CSRActivity", csrActivitySchema);
