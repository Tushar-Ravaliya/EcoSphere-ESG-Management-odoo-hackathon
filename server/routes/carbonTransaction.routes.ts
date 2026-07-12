import express from "express";
import asyncHandler from "express-async-handler";
import CarbonTransaction from "../models/CarbonTransaction.js";
import EmissionFactor from "../models/EmissionFactor.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const filter: any = {};
  if (req.query.department) filter.department = req.query.department;
  const transactions = await CarbonTransaction.find(filter)
    .populate("department", "name")
    .populate("emissionFactor", "name unit co2PerUnit")
    .sort({ date: -1 });
  res.json(transactions);
}));

// POST body: { department, emissionFactor, quantity, date, notes }
// calculatedCO2 is derived server-side, never trust a client-sent value.
router.post("/", asyncHandler(async (req, res) => {
  const { department, emissionFactor, quantity, date, notes } = req.body;
  const factor = await EmissionFactor.findById(emissionFactor);
  if (!factor) {
    res.status(404);
    throw new Error("Emission factor not found");
  }
  const calculatedCO2 = quantity * factor.co2PerUnit;
  const tx = await CarbonTransaction.create({ department, emissionFactor, quantity, calculatedCO2, date, notes });
  res.status(201).json(tx);
}));

export default router;
