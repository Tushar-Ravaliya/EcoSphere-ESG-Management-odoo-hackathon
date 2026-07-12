import mongoose from "mongoose";

const carbonTransactionSchema = new mongoose.Schema(
  {
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", required: true },
    emissionFactor: { type: mongoose.Schema.Types.ObjectId, ref: "EmissionFactor", required: true },
    quantity: { type: Number, required: true },
    calculatedCO2: { type: Number, required: true }, // quantity * emissionFactor.co2PerUnit
    date: { type: Date, default: Date.now },
    notes: { type: String },
  },
  { timestamps: true }
);

export default mongoose.model("CarbonTransaction", carbonTransactionSchema);
