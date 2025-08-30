// frontend/pages/api/auth/google.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "./[...nextauth]";

export default async function handler(req, res) {
  // You don't need this file for NextAuth, 
  // NextAuth automatically handles /api/auth/signin
  res.status(404).json({ error: "Use NextAuth signIn at /api/auth/signin" });
}
