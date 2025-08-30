import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";
import { signOut } from "next-auth/react";

export default async function handler(req, res) {
  // Client should call `signOut()` instead; API route just clears session cookie
  res.status(200).json({ success: true, message: "Logged out successfully" });
}
