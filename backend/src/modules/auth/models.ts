import mongoose from "mongoose";
import bcrypt from "bcrypt";
import type { Role } from "../../types.js";

export interface IUser extends mongoose.Document {
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "viewer"], required: true, default: "viewer" }
  },
  { timestamps: true }
);

userSchema.index({ email: 1 });

userSchema.methods.comparePassword = async function (candidate: string): Promise<boolean> {
  return bcrypt.compare(candidate, this.passwordHash);
};

export const User = mongoose.model<IUser>("User", userSchema);

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
