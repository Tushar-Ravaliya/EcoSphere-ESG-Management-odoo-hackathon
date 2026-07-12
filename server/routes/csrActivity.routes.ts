import express from "express";
import asyncHandler from "express-async-handler";
import CSRActivity from "../models/CSRActivity.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  res.json(await CSRActivity.find().populate("category", "name"));
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await CSRActivity.create(req.body));
}));

export default router;
