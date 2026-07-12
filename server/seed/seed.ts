// Run with: bun run seed
// Wipes and reseeds highly rich demo data to make all charts, timelines,
// leaderboards, audit logs, and gamification locker look completely populated.

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
import EmployeeBadge from "../models/EmployeeBadge.js";
import PolicyAcknowledgement from "../models/PolicyAcknowledgement.js";

dotenv.config();

const run = async (): Promise<void> => {
  await connectDB();

  console.log("Wiping existing records...");
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
    EmployeeBadge.deleteMany(),
    PolicyAcknowledgement.deleteMany(),
  ]);

  console.log("Seeding departments...");
  const engineering = await Department.create({ name: "Engineering", code: "ENG", employeeCount: 3 });
  const operations = await Department.create({ name: "Operations", code: "OPS", employeeCount: 2 });
  const marketing = await Department.create({ name: "Sales & Marketing", code: "MKT", employeeCount: 2 });
  const hr = await Department.create({ name: "Human Resources", code: "HR", employeeCount: 2 });

  console.log("Seeding employees...");
  // Admins & Managers
  const admin = await Employee.create({
    name: "Admin User",
    email: "admin@ecosphere.test",
    password: "password123",
    department: engineering._id as mongoose.Types.ObjectId,
    role: "admin",
  });
  
  const eva = await Employee.create({
    name: "Eva Long",
    email: "eva@ecosphere.test",
    password: "password123",
    department: operations._id as mongoose.Types.ObjectId,
    role: "manager",
    xp: 50,
    points: 15,
  });

  // Employees
  const alice = await Employee.create({
    name: "Alice Sharma",
    email: "alice@ecosphere.test",
    password: "password123",
    department: engineering._id as mongoose.Types.ObjectId,
    role: "employee",
    xp: 110,
    points: 70,
    completedChallengeCount: 3,
  });

  const bob = await Employee.create({
    name: "Bob Patel",
    email: "bob@ecosphere.test",
    password: "password123",
    department: operations._id as mongoose.Types.ObjectId,
    role: "employee",
    xp: 15,
    points: 5,
    completedChallengeCount: 0,
  });

  const charlie = await Employee.create({
    name: "Charlie Singh",
    email: "charlie@ecosphere.test",
    password: "password123",
    department: marketing._id as mongoose.Types.ObjectId,
    role: "employee",
    xp: 85,
    points: 40,
    completedChallengeCount: 2,
  });

  const diana = await Employee.create({
    name: "Diana Green",
    email: "diana@ecosphere.test",
    password: "password123",
    department: hr._id as mongoose.Types.ObjectId,
    role: "employee",
    xp: 220,
    points: 110,
    completedChallengeCount: 5,
  });

  // Assign department heads
  await Department.findByIdAndUpdate(engineering._id, { head: admin._id });
  await Department.findByIdAndUpdate(operations._id, { head: eva._id });

  console.log("Seeding categories...");
  const catCleanup = await Category.create({ name: "Community Action", type: "CSR Activity", status: "Active" });
  const catRecycle = await Category.create({ name: "E-Waste & Recycling", type: "CSR Activity", status: "Active" });
  const catEnergy = await Category.create({ name: "Energy Saving", type: "Challenge", status: "Active" });
  const catPaper = await Category.create({ name: "Office Conservation", type: "Challenge", status: "Active" });
  const catCommute = await Category.create({ name: "Sustainable Commuting", type: "Challenge", status: "Active" });

  console.log("Seeding emission factors...");
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
  const naturalGasFactor = await EmissionFactor.create({
    name: "Natural Gas (m³)",
    unit: "m³",
    co2PerUnit: 1.93,
    sourceType: "Expense",
  });
  const flightFactor = await EmissionFactor.create({
    name: "Short-haul Flight (km)",
    unit: "km",
    co2PerUnit: 0.15,
    sourceType: "Fleet",
  });
  const paperFactor = await EmissionFactor.create({
    name: "Paper Waste (kg)",
    unit: "kg",
    co2PerUnit: 0.50,
    sourceType: "Expense",
  });

  console.log("Seeding carbon transactions (spread over past 3 months for charts)...");
  const now = new Date();
  const daysAgo = (num: number) => new Date(now.getTime() - num * 24 * 60 * 60 * 1000);

  await CarbonTransaction.create([
    // May 2026
    { department: engineering._id, emissionFactor: electricityFactor._id, quantity: 500, calculatedCO2: 500 * 0.82, date: daysAgo(65), notes: "Servers baseline usage" },
    { department: operations._id, emissionFactor: dieselFactor._id, quantity: 150, calculatedCO2: 150 * 2.68, date: daysAgo(60), notes: "Warehouse delivery trucks" },
    { department: marketing._id, emissionFactor: flightFactor._id, quantity: 2000, calculatedCO2: 2000 * 0.15, date: daysAgo(55), notes: "Client summit travel" },
    // June 2026
    { department: engineering._id, emissionFactor: electricityFactor._id, quantity: 450, calculatedCO2: 450 * 0.82, date: daysAgo(35), notes: "Development servers" },
    { department: operations._id, emissionFactor: dieselFactor._id, quantity: 120, calculatedCO2: 120 * 2.68, date: daysAgo(32), notes: "Supply run" },
    { department: hr._id, emissionFactor: naturalGasFactor._id, quantity: 80, calculatedCO2: 80 * 1.93, date: daysAgo(30), notes: "Office central heating" },
    { department: marketing._id, emissionFactor: paperFactor._id, quantity: 60, calculatedCO2: 60 * 0.50, date: daysAgo(28), notes: "Promo handouts printed" },
    // July 2026 (Recent)
    { department: engineering._id, emissionFactor: electricityFactor._id, quantity: 400, calculatedCO2: 400 * 0.82, date: daysAgo(10), notes: "AC and lights cooling" },
    { department: operations._id, emissionFactor: dieselFactor._id, quantity: 100, calculatedCO2: 100 * 2.68, date: daysAgo(5), notes: "Logistics fuel usage" },
    { department: hr._id, emissionFactor: paperFactor._id, quantity: 20, calculatedCO2: 20 * 0.50, date: daysAgo(2), notes: "Quarterly employee booklets" },
  ]);

  console.log("Seeding CSR Activities & participations...");
  const cleanupActivity = await CSRActivity.create({
    title: "Riverside Park Cleanup Drive",
    category: catCleanup._id as mongoose.Types.ObjectId,
    description: "Volunteer trash gathering drive at the community riverside park.",
    status: "Completed",
    date: daysAgo(12)
  });

  const plantingActivity = await CSRActivity.create({
    title: "Tree Planting Campaign",
    category: catCleanup._id as mongoose.Types.ObjectId,
    description: "EcoSphere company forest planting, aiming for 200 new saplings.",
    status: "Completed",
    date: daysAgo(6)
  });

  const ewasteActivity = await CSRActivity.create({
    title: "E-Waste Recycle drive",
    category: catRecycle._id as mongoose.Types.ObjectId,
    description: "Drop off old hardware, cables, and monitors for safe recovery processing.",
    status: "Active",
    date: daysAgo(2)
  });

  // Seed participations
  await EmployeeParticipation.create([
    { employee: alice._id, activity: cleanupActivity._id, proof: true, approvalStatus: "Approved", pointsEarned: 10, completionDate: daysAgo(11) },
    { employee: diana._id, activity: cleanupActivity._id, proof: true, approvalStatus: "Approved", pointsEarned: 10, completionDate: daysAgo(11) },
    
    { employee: charlie._id, activity: plantingActivity._id, proof: true, approvalStatus: "Approved", pointsEarned: 10, completionDate: daysAgo(5) },
    { employee: diana._id, activity: plantingActivity._id, proof: true, approvalStatus: "Approved", pointsEarned: 10, completionDate: daysAgo(5) },
    
    { employee: alice._id, activity: plantingActivity._id, proof: true, approvalStatus: "Pending" },
    { employee: bob._id, activity: ewasteActivity._id, proof: true, approvalStatus: "Pending" },
  ]);

  console.log("Seeding Challenges & participations...");
  const challengeAC = await Challenge.create({
    title: "Reduce office AC runtime by 15%",
    category: catEnergy._id as mongoose.Types.ObjectId,
    description: "Set AC temperature to 24°C and power down units when rooms are vacant.",
    xp: 30,
    difficulty: "Medium",
    evidenceRequired: false,
    status: "Active",
    deadline: daysAgo(-8)
  });

  const challengeCommute = await Challenge.create({
    title: "Bike or walk to work Friday",
    category: catCommute._id as mongoose.Types.ObjectId,
    description: "Commute emissions-free for at least one Friday this month.",
    xp: 20,
    difficulty: "Easy",
    evidenceRequired: true,
    status: "Active",
    deadline: daysAgo(-5)
  });

  const challengePaperless = await Challenge.create({
    title: "Go paperless for 30 Days",
    category: catPaper._id as mongoose.Types.ObjectId,
    description: "Transition all report prints and contracts entirely to secure digital signoffs.",
    xp: 50,
    difficulty: "Hard",
    evidenceRequired: true,
    status: "Active",
    deadline: daysAgo(-20)
  });

  // Seed challenge participations
  await ChallengeParticipation.create([
    { challenge: challengeAC._id, employee: bob._id, progress: 60, approvalStatus: "Pending" },
    { challenge: challengeCommute._id, employee: diana._id, progress: 100, proof: true, approvalStatus: "Approved", xpAwarded: 20 },
    { challenge: challengePaperless._id, employee: alice._id, progress: 100, proof: true, approvalStatus: "Approved", xpAwarded: 50 },
    { challenge: challengePaperless._id, employee: charlie._id, progress: 100, proof: true, approvalStatus: "Approved", xpAwarded: 50 },
    { challenge: challengeCommute._id, employee: alice._id, progress: 100, proof: false, approvalStatus: "Pending" },
  ]);

  console.log("Seeding badges...");
  const badgeFirst = await Badge.create({ name: "First Steps", description: "Earned your first 10 XP", icon: "🌱", unlockRule: { type: "xp", threshold: 10 } });
  const badgeChamp = await Badge.create({ name: "Green Champion", description: "Reached 100 XP milestone", icon: "🏆", unlockRule: { type: "xp", threshold: 100 } });
  const badgeStreak = await Badge.create({ name: "Challenge Streak", description: "Completed 3 challenges", icon: "🔥", unlockRule: { type: "completedChallengeCount", threshold: 3 } });

  // Unlock badges for employees
  await EmployeeBadge.create([
    { employee: alice._id, badge: badgeFirst._id, unlockedAt: daysAgo(20) },
    { employee: alice._id, badge: badgeStreak._id, unlockedAt: daysAgo(5) },
    { employee: alice._id, badge: badgeChamp._id, unlockedAt: daysAgo(2) },
    { employee: charlie._id, badge: badgeFirst._id, unlockedAt: daysAgo(10) },
    { employee: diana._id, badge: badgeFirst._id, unlockedAt: daysAgo(15) },
    { employee: diana._id, badge: badgeChamp._id, unlockedAt: daysAgo(1) },
  ]);

  console.log("Seeding redeemable rewards...");
  await Reward.create([
    { name: "Company Water Bottle", description: "Reusable thermal steel flask.", pointsRequired: 20, stock: 12, status: "Active" },
    { name: "Eco Canvas Tote Bag", description: "Organic cotton canvas bag for grocery runs.", pointsRequired: 10, stock: 35, status: "Active" },
    { name: "Smart Smart-Plug", description: "Wifi-enabled outlet to scheduler appliance energy cutoffs.", pointsRequired: 60, stock: 8, status: "Active" },
    { name: "Extra Day Paid Leave", description: "One additional paid day off for environmental champions.", pointsRequired: 200, stock: 4, status: "Active" },
  ]);

  console.log("Seeding policy checklists...");
  const policyConduct = await Policy.create({ title: "Corporate Code of Conduct 2026", description: "Annual corporate guidelines on ethics, transparency, and conduct policy.", status: "Active" });
  const policySafety = await Policy.create({ title: "Green Sourcing standard", description: "Mandates that supplier bids must document eco-certifications and recycling plans.", status: "Active" });

  // Acknowledge policies
  await PolicyAcknowledgement.create([
    { policy: policyConduct._id, employee: admin._id },
    { policy: policyConduct._id, employee: alice._id },
    { policy: policyConduct._id, employee: bob._id },
    { policy: policyConduct._id, employee: diana._id },
    
    { policy: policySafety._id, employee: admin._id },
    { policy: policySafety._id, employee: diana._id },
  ]);

  console.log("Seeding audits & compliance issues...");
  const auditEnv = await Audit.create({
    title: "Q2 Greenhouse Gas Review",
    description: "Quarterly inspection of carbon spreadsheets and factory fuel invoices.",
    auditor: admin._id,
    department: operations._id,
    scheduledDate: daysAgo(15),
    completedDate: daysAgo(12),
    status: "Completed",
    findings: "Fuel transactions logged correctly, but fleet odometer readings were missing on two delivery logs."
  });

  const auditPrivacy = await Audit.create({
    title: "Data Protection Inspection",
    description: "Verification of compliance with regional data privacy laws.",
    auditor: admin._id,
    department: null, // Organization-wide
    scheduledDate: daysAgo(2),
    status: "In Progress"
  });

  const auditLogistics = await Audit.create({
    title: "Q3 Workplace Safety Audit",
    description: "General warehouse safety checkup and emergency drill logging.",
    auditor: eva._id,
    department: operations._id,
    scheduledDate: daysAgo(-5), // future
    status: "Scheduled"
  });

  // Seed compliance issues
  await ComplianceIssue.create([
    {
      audit: auditEnv._id,
      severity: "Medium",
      description: "Missing emission logs for warehouse transport fleet in May.",
      owner: eva._id,
      dueDate: daysAgo(2), // overdue
      status: "Open",
    },
    {
      audit: auditPrivacy._id,
      severity: "High",
      description: "Customer database encryption key rotation overdue by 10 days.",
      owner: admin._id,
      dueDate: daysAgo(-10), // future
      status: "In Progress",
    },
    {
      audit: auditEnv._id,
      severity: "Critical",
      description: "Grid electricity invoices missing for May baseline calibration.",
      owner: alice._id,
      dueDate: daysAgo(5), // overdue
      status: "Open",
    }
  ]);

  console.log("Seeding process completed successfully!");
  console.log("Seeded database is populated with rich timelines.");
  console.log("Quick login profiles:");
  console.log(" * admin@ecosphere.test (Admin)");
  console.log(" * eva@ecosphere.test (Manager)");
  console.log(" * alice@ecosphere.test / bob@ecosphere.test / charlie@ecosphere.test / diana@ecosphere.test (Employees)");
  console.log(" (Password for all: password123)");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
