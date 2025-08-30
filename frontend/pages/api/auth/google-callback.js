// frontend/pages/api/auth/google-callback.js
// NOT needed with NextAuth
export default async function handler(req, res) {
  res.status(404).json({ error: "NextAuth handles the callback automatically" });
}
