import dbConnect from "../../lib/dbConnect";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const { imageData, aiAnalysis, trigger, goal } = req.body;
  await dbConnect();

  // Here, save to a Screenshot model if you create one
  console.log("Screenshot would be saved for user:", session.user.id);

  res.status(200).json({ success: true, message: "Screenshot saved" });
}
