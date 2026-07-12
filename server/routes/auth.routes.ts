import express from "express";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";

const router = express.Router();

const genToken = (id: any): string => jwt.sign({ id }, process.env.JWT_SECRET || "", { expiresIn: "7d" });

// POST /api/auth/login  { email, password }
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const employee = await Employee.findOne({ email });
    if (employee && (await employee.matchPassword(password))) {
      res.json({
        _id: employee._id,
        name: employee.name,
        role: employee.role,
        department: employee.department,
        xp: employee.xp,
        points: employee.points,
        token: genToken(employee._id),
      });
    } else {
      res.status(401);
      throw new Error("Invalid email or password");
    }
  })
);

export default router;
