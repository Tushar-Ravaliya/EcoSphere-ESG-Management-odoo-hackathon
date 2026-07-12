import express from "express";
import asyncHandler from "express-async-handler";
import Challenge from "../models/Challenge.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const filter: any = {};
  if (req.query.status) filter.status = req.query.status;
  res.json(await Challenge.find(filter).populate("category", "name"));
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await Challenge.create(req.body));
}));

// PATCH /:id/status  { status: 'Active' | 'Under Review' | 'Completed' | 'Archived' }
router.patch("/:id/status", asyncHandler(async (req, res) => {
  const challenge = await Challenge.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
  res.json(challenge);
}));

export default router;
