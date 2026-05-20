import { getDb, COLLECTIONS } from "../../lib/mongodb.js";
import { verifyPassword, signToken } from "../../lib/auth.js";
import { setCors, handleOptions } from "../../lib/cors.js";

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body || {};
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!normalizedEmail || !password) {
      return res.status(400).json({ error: "Email and password are required." });
    }

    const db = await getDb();
    const user = await db.collection(COLLECTIONS.users).findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken({ sub: user._id.toString(), email: user.email });

    return res.status(200).json({
      token,
      user: { email: user.email, name: user.name || user.email },
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ error: "Login failed." });
  }
}
