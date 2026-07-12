import express from "express";
import asyncHandler from "express-async-handler";
import EmissionFactor from "../models/EmissionFactor.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  res.json(await EmissionFactor.find());
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await EmissionFactor.create(req.body));
}));

export default router;
