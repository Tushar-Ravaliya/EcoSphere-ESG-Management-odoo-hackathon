// Run with: npm run seed
// Wipes and reseeds enough demo data to make the dashboard, leaderboard,
// CSR flow, challenge flow, and compliance page look populated for a demo.

import dotenv from "dotenv";
import mongoose from "mongoose";
import { connectDB } from "../config/db.js";

import Department from "../models/Department.js";
import Employee from "../models/Employee.js";
import Category from "../models/Category.js";
import EmissionFactor from "../models/EmissionFactor.js";
import CarbonTransaction from "../models/CarbonTransaction.js";
import CSRActivity from "../models/CSRActivity.js";
import EmployeeParticipation from "../models/EmployeeParticipation.js";
import Challenge from "../models/Challenge.js";
import ChallengeParticipation from "../models/ChallengeParticipation.js";
import Badge from "../models/Badge.js";
import Reward from "../models/Reward.js";
import Policy from "../models/Policy.js";
import ComplianceIssue from "../models/ComplianceIssue.js";
import Audit from "../models/Audit.js";

dotenv.config();

const run = async (): Promise<void> => {
  await connectDB();

  await Promise.all([
    Department.deleteMany(),
    Employee.deleteMany(),
    Category.deleteMany(),
    EmissionFactor.deleteMany(),
    CarbonTransaction.deleteMany(),
    CSRActivity.deleteMany(),
    EmployeeParticipation.deleteMany(),
    Challenge.deleteMany(),
    ChallengeParticipation.deleteMany(),
    Badge.deleteMany(),
    Reward.deleteMany(),
    Policy.deleteMany(),
    ComplianceIssue.deleteMany(),
    Audit.deleteMany(),
  ]);

  const engineering = await Department.create({ name: "Engineering", code: "ENG", employeeCount: 2 });
  const operations = await Department.create({ name: "Operations", code: "OPS", employeeCount: 1 });

  const admin = await Employee.create({
    name: "Admin User",
    email: "admin@ecosphere.test",
    password: "password123",
    department: engineering._id as mongoose.Types.ObjectId,
    role: "admin",
  });
  const alice = await Employee.create({
    name: "Alice Sharma",
    email: "alice@ecosphere.test",
    password: "password123",
    department: engineering._id as mongoose.Types.ObjectId,
    role: "employee",
    xp: 40,
    points: 20,
  });
  const bob = await Employee.create({
    name: "Bob Patel",
    email: "bob@ecosphere.test",
    password: "password123",
    department: operations._id as mongoose.Types.ObjectId,
    role: "employee",
  });

  await Department.findByIdAndUpdate(engineering._id, { head: admin._id });

  const csrCategory = await Category.create({ name: "Community Cleanup", type: "CSR Activity" });
  const challengeCategory = await Category.create({ name: "Energy Saving", type: "Challenge" });

  const dieselFactor = await EmissionFactor.create({
    name: "Diesel (litre)",
    unit: "litre",
    co2PerUnit: 2.68,
    sourceType: "Fleet",
  });
  const electricityFactor = await EmissionFactor.create({
    name: "Grid Electricity (kWh)",
    unit: "kWh",
    co2PerUnit: 0.82,
    sourceType: "Manufacturing",
  });

  await CarbonTransaction.create([
    { department: engineering._id, emissionFactor: electricityFactor._id, quantity: 500, calculatedCO2: 500 * 0.82 },
    { department: operations._id, emissionFactor: dieselFactor._id, quantity: 100, calculatedCO2: 100 * 2.68 },
  ]);

  const cleanupActivity = await CSRActivity.create({
    title: "Riverside Cleanup Drive",
    category: csrCategory._id as mongoose.Types.ObjectId,
    description: "Volunteer cleanup of the riverside park",
    status: "Completed",
  });

  await EmployeeParticipation.create({
    employee: alice._id,
    activity: cleanupActivity._id,
    proof: true,
    approvalStatus: "Pending",
  });

  const challenge = await Challenge.create({
    title: "Cut office AC usage by 10%",
    category: challengeCategory._id as mongoose.Types.ObjectId,
    description: "Reduce AC runtime during working hours for one week",
    xp: 30,
    difficulty: "Medium",
    evidenceRequired: false,
    status: "Active",
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  await ChallengeParticipation.create({
    challenge: challenge._id,
    employee: bob._id,
    progress: 50,
    approvalStatus: "Pending",
  });

  await Badge.create([
    { name: "First Steps", description: "Earned your first 10 XP", icon: "🌱", unlockRule: { type: "xp", threshold: 10 } },
    { name: "Green Champion", description: "Reached 100 XP", icon: "🏆", unlockRule: { type: "xp", threshold: 100 } },
    { name: "Challenge Streak", description: "Completed 3 challenges", icon: "🔥", unlockRule: { type: "completedChallengeCount", threshold: 3 } },
  ]);

  await Reward.create([
    { name: "Company Water Bottle", description: "Reusable steel bottle", pointsRequired: 20, stock: 15 },
    { name: "Extra Day Off", description: "One additional paid leave day", pointsRequired: 200, stock: 5 },
  ]);

  await Policy.create({ title: "Code of Conduct 2026", description: "Annual acknowledgement of company conduct policy" });
 
  const envAudit = await Audit.create({
    title: "Q2 Environmental Audit",
    description: "Quarterly review of carbon footprints and greenhouse gas reports",
    auditor: admin._id,
    department: engineering._id,
    scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    completedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    status: "Completed",
    findings: "Minor issues found regarding carbon reporting intervals"
  });

  const privacyAudit = await Audit.create({
    title: "Data Privacy Review",
    description: "Bi-annual verification of compliance with privacy protocols",
    auditor: admin._id,
    department: null,
    scheduledDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    status: "In Progress"
  });

  await ComplianceIssue.create([
    {
      audit: envAudit._id,
      severity: "Medium",
      description: "Missing emission logs for March",
      owner: admin._id,
      dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // already overdue, for demo
      status: "Open",
    },
    {
      audit: privacyAudit._id,
      severity: "High",
      description: "Employee data access policy needs update",
      owner: admin._id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      status: "In Progress",
    },
  ]);

  console.log("Seed complete. Login with admin@ecosphere.test / password123");
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
