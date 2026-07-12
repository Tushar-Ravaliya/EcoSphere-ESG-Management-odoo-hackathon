import mongoose from "mongoose";

const emissionFactorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // e.g. "Diesel (litre)", "Grid Electricity (kWh)"
    unit: { type: String, required: true },
    co2PerUnit: { type: Number, required: true }, // kg CO2e per unit
    sourceType: { type: String, enum: ["Purchase", "Manufacturing", "Expense", "Fleet", "Manual"], default: "Manual" },
  },
  { timestamps: true }
);

export default mongoose.model("EmissionFactor", emissionFactorSchema);
