import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function requireJwtSecret() {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not set");
  }
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

export function signToken(payload) {
  requireJwtSecret();
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token) {
  requireJwtSecret();
  return jwt.verify(token, JWT_SECRET);
}

export function getBearerToken(req) {
  const header = req.headers.authorization || req.headers.Authorization;
  if (!header || typeof header !== "string") return null;
  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) return null;
  return token;
}

export function getUserFromRequest(req) {
  const token = getBearerToken(req);
  if (!token) return null;
  try {
    const decoded = verifyToken(token);
    return { email: decoded.email, sub: decoded.sub };
  } catch {
    return null;
  }
}

export function requireAuth(req, res) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "Sign in required." });
    return null;
  }
  return user;
}
