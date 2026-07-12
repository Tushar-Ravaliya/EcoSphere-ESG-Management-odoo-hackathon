import express, { Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { connectDB } from "./config/db.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

import authRoutes from "./routes/auth.routes.js";
import departmentRoutes from "./routes/department.routes.js";
import employeeRoutes from "./routes/employee.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import emissionFactorRoutes from "./routes/emissionFactor.routes.js";
import carbonTransactionRoutes from "./routes/carbonTransaction.routes.js";
import csrActivityRoutes from "./routes/csrActivity.routes.js";
import employeeParticipationRoutes from "./routes/employeeParticipation.routes.js";
import challengeRoutes from "./routes/challenge.routes.js";
import challengeParticipationRoutes from "./routes/challengeParticipation.routes.js";
import badgeRoutes from "./routes/badge.routes.js";
import rewardRoutes from "./routes/reward.routes.js";
import policyRoutes from "./routes/policy.routes.js";
import complianceIssueRoutes from "./routes/complianceIssue.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import environmentalGoalRoutes from "./routes/environmentalGoal.routes.js";
import environmentalReportRoutes from "./routes/environmentalReport.routes.js";

connectDB();

const app = express();

app.use(cors({ origin: process.env.CLIENT_URL || "*" }));
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => res.json({ status: "EcoSphere API running" }));

app.use("/api/auth", authRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/emission-factors", emissionFactorRoutes);
app.use("/api/carbon-transactions", carbonTransactionRoutes);
app.use("/api/csr-activities", csrActivityRoutes);
app.use("/api/employee-participations", employeeParticipationRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/challenge-participations", challengeParticipationRoutes);
app.use("/api/badges", badgeRoutes);
app.use("/api/rewards", rewardRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/compliance-issues", complianceIssueRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/environmental-goals", environmentalGoalRoutes);
app.use("/api/environmental-report", environmentalReportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
