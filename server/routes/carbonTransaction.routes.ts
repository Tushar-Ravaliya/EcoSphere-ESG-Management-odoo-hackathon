import express from "express";
import asyncHandler from "express-async-handler";
import CarbonTransaction from "../models/CarbonTransaction.js";
import EmissionFactor from "../models/EmissionFactor.js";
import EnvironmentalGoal from "../models/EnvironmentalGoal.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// Helper: after a new carbon transaction, update relevant active goals
async function syncGoals(departmentId: any, addedCO2: number) {
  const now = new Date();
  // org-wide goals (department: null) + department-specific goals
  await EnvironmentalGoal.updateMany(
    {
      status: "Active",
      startDate: { $lte: now },
      endDate: { $gte: now },
      $or: [{ department: null }, { department: departmentId }],
    },
    { $inc: { currentCO2: addedCO2 } }
  );

  // Flip any goal that now exceeds its target to "Missed", or mark Achieved
  const goals = await EnvironmentalGoal.find({
    status: "Active",
    endDate: { $lt: now },
  });
  for (const goal of goals) {
    goal.status = goal.currentCO2 <= goal.targetCO2 ? "Achieved" : "Missed";
    await goal.save();
  }
}

// GET /api/carbon-transactions
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.department) filter.department = req.query.department;
    if (req.query.from || req.query.to) {
      filter.date = {};
      if (req.query.from) filter.date.$gte = new Date(req.query.from as string);
      if (req.query.to) filter.date.$lte = new Date(req.query.to as string);
    }
    if (req.query.sourceType) {
      // join through EmissionFactor
      const factors = await EmissionFactor.find({ sourceType: req.query.sourceType }).select("_id");
      filter.emissionFactor = { $in: factors.map((f) => f._id) };
    }

    const transactions = await CarbonTransaction.find(filter)
      .populate("department", "name code")
      .populate("emissionFactor", "name unit co2PerUnit sourceType")
      .sort({ date: -1 });
    res.json(transactions);
  })
);

// GET /api/carbon-transactions/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const tx = await CarbonTransaction.findById(req.params.id)
      .populate("department", "name code")
      .populate("emissionFactor", "name unit co2PerUnit sourceType");
    if (!tx) {
      res.status(404);
      throw new Error("Carbon transaction not found");
    }
    res.json(tx);
  })
);

// POST /api/carbon-transactions
// body: { department, emissionFactor, quantity, date?, notes? }
// calculatedCO2 is always derived server-side
router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { department, emissionFactor, quantity, date, notes } = req.body;
    if (!department || !emissionFactor || quantity === undefined) {
      res.status(400);
      throw new Error("department, emissionFactor and quantity are required");
    }
    const factor = await EmissionFactor.findById(emissionFactor);
    if (!factor) {
      res.status(404);
      throw new Error("Emission factor not found");
    }
    const calculatedCO2 = quantity * factor.co2PerUnit;
    const tx = await CarbonTransaction.create({
      department,
      emissionFactor,
      quantity,
      calculatedCO2,
      date: date || new Date(),
      notes,
    });

    // keep goal progress up to date
    await syncGoals(department, calculatedCO2);

    res.status(201).json(
      await tx.populate([
        { path: "department", select: "name code" },
        { path: "emissionFactor", select: "name unit co2PerUnit sourceType" },
      ])
    );
  })
);

// PUT /api/carbon-transactions/:id
router.put(
  "/:id",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const existing = await CarbonTransaction.findById(req.params.id);
    if (!existing) {
      res.status(404);
      throw new Error("Carbon transaction not found");
    }

    const { quantity, emissionFactor: newFactorId } = req.body;

    // Recalculate CO2 if quantity or factor changed
    let calculatedCO2 = existing.calculatedCO2;
    const factorId = newFactorId || existing.emissionFactor;
    const factor = await EmissionFactor.findById(factorId);
    if (!factor) {
      res.status(404);
      throw new Error("Emission factor not found");
    }
    const newQty = quantity !== undefined ? quantity : existing.quantity;
    calculatedCO2 = newQty * factor.co2PerUnit;

    // Adjust goal CO2: remove old, add new
    const co2Diff = calculatedCO2 - existing.calculatedCO2;
    if (co2Diff !== 0) await syncGoals(existing.department, co2Diff);

    const updated = await CarbonTransaction.findByIdAndUpdate(
      req.params.id,
      { ...req.body, calculatedCO2 },
      { new: true, runValidators: true }
    )
      .populate("department", "name code")
      .populate("emissionFactor", "name unit co2PerUnit sourceType");

    res.json(updated);
  })
);

// DELETE /api/carbon-transactions/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const tx = await CarbonTransaction.findByIdAndDelete(req.params.id);
    if (!tx) {
      res.status(404);
      throw new Error("Carbon transaction not found");
    }
    // Reverse the CO2 contribution from goals
    await syncGoals(tx.department, -tx.calculatedCO2);
    res.json({ message: "Carbon transaction deleted" });
  })
);

export default router;
