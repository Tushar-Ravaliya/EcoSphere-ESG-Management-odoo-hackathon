import express from "express";
import asyncHandler from "express-async-handler";
import EmissionFactor from "../models/EmissionFactor.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/emission-factors
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.sourceType) filter.sourceType = req.query.sourceType;
    res.json(await EmissionFactor.find(filter).sort({ name: 1 }));
  })
);

// GET /api/emission-factors/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const factor = await EmissionFactor.findById(req.params.id);
    if (!factor) {
      res.status(404);
      throw new Error("Emission factor not found");
    }
    res.json(factor);
  })
);

// POST /api/emission-factors  — admin only
router.post(
  "/",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const { name, unit, co2PerUnit, sourceType } = req.body;
    if (!name || !unit || co2PerUnit === undefined) {
      res.status(400);
      throw new Error("name, unit and co2PerUnit are required");
    }
    const factor = await EmissionFactor.create({ name, unit, co2PerUnit, sourceType });
    res.status(201).json(factor);
  })
);

// PUT /api/emission-factors/:id  — admin only
router.put(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const factor = await EmissionFactor.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!factor) {
      res.status(404);
      throw new Error("Emission factor not found");
    }
    res.json(factor);
  })
);

// DELETE /api/emission-factors/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const factor = await EmissionFactor.findByIdAndDelete(req.params.id);
    if (!factor) {
      res.status(404);
      throw new Error("Emission factor not found");
    }
    res.json({ message: "Emission factor deleted" });
  })
);

export default router;
