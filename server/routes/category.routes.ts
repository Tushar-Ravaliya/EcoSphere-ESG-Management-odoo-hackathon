import express from "express";
import asyncHandler from "express-async-handler";
import Category from "../models/Category.js";

const router = express.Router();

router.get("/", asyncHandler(async (req, res) => {
  const filter = req.query.type ? { type: req.query.type as string } : {};
  res.json(await Category.find(filter));
}));

router.post("/", asyncHandler(async (req, res) => {
  res.status(201).json(await Category.create(req.body));
}));

export default router;
