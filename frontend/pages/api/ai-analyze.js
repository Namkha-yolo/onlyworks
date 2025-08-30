import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth/[...nextauth]";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Not authenticated" });

  const { imageData, goal } = req.body;

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: "OpenAI API key not configured" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: `Analyze this screenshot for productivity. User's goal: "${goal}". Return ONLY valid JSON with productivityScore, activity, insights.`,
          },
        ],
        max_tokens: 200,
      }),
    });

    const data = await response.json();
    res.status(200).json({ success: true, analysis: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
