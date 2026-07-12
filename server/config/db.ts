import mongoose from "mongoose";
import dns from "node:dns";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

export const connectDB = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || "");
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err: any) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};
