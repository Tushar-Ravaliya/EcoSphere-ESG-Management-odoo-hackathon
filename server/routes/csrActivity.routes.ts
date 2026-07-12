import express from "express";
import asyncHandler from "express-async-handler";
import CSRActivity from "../models/CSRActivity.js";
import { protect, requireRole } from "../middleware/auth.js";

const router = express.Router();

// GET /api/csr-activities
router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    const activities = await CSRActivity.find(filter)
      .populate("category", "name type")
      .sort({ date: -1 });
    res.json(activities);
  })
);

// GET /api/csr-activities/:id
router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const activity = await CSRActivity.findById(req.params.id).populate("category", "name type");
    if (!activity) {
      res.status(404);
      throw new Error("CSR activity not found");
    }
    res.json(activity);
  })
);

// POST /api/csr-activities  — admin / manager
router.post(
  "/",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const { title } = req.body;
    if (!title) {
      res.status(400);
      throw new Error("title is required");
    }
    const activity = await CSRActivity.create(req.body);
    res.status(201).json(activity);
  })
);

// PUT /api/csr-activities/:id  — admin / manager
router.put(
  "/:id",
  protect,
  requireRole("admin", "manager"),
  asyncHandler(async (req, res) => {
    const activity = await CSRActivity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("category", "name type");
    if (!activity) {
      res.status(404);
      throw new Error("CSR activity not found");
    }
    res.json(activity);
  })
);

// DELETE /api/csr-activities/:id  — admin only
router.delete(
  "/:id",
  protect,
  requireRole("admin"),
  asyncHandler(async (req, res) => {
    const activity = await CSRActivity.findByIdAndDelete(req.params.id);
    if (!activity) {
      res.status(404);
      throw new Error("CSR activity not found");
    }
    res.json({ message: "CSR activity deleted" });
  })
);

export default router;
