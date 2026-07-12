import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";
import Employee from "../models/Employee.js";
import { Request, Response, NextFunction } from "express";

export const protect = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  let token: string | undefined;
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }
  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token");
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as jwt.JwtPayload;
  req.user = await Employee.findById(decoded.id).select("-password");
  next();
});

export const requireRole = (...roles: string[]) => (req: Request, res: Response, next: NextFunction) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error("Not authorized for this action");
  }
  next();
};
