import mongoose from "mongoose";
import bcrypt from "bcryptjs";

export interface IEmployee extends mongoose.Document {
  name: string;
  email: string;
  password: string;
  department?: mongoose.Types.ObjectId;
  role: "admin" | "manager" | "employee";
  xp: number;
  points: number;
  completedChallengeCount: number;
  matchPassword(entered: string): Promise<boolean>;
  isModified(path: string): boolean; // inherited from mongoose.Document but added here for safety
}

const employeeSchema = new mongoose.Schema<IEmployee>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    role: { type: String, enum: ["admin", "manager", "employee"], default: "employee" },
    xp: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    completedChallengeCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

employeeSchema.pre<IEmployee>("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

employeeSchema.methods.matchPassword = function (entered: string): Promise<boolean> {
  return bcrypt.compare(entered, this.password);
};

export default mongoose.model<IEmployee>("Employee", employeeSchema);
