import { pingMongo } from "../lib/mongodb.js";
import { mongoErrorMessage } from "../lib/mongo-error.js";
import { setCors, handleOptions } from "../lib/cors.js";

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const result = await pingMongo();
    return res.status(200).json(result);
  } catch (err) {
    console.error("health check failed:", err);
    return res.status(503).json({
      ok: false,
      error: mongoErrorMessage(err),
      vercel: Boolean(process.env.VERCEL),
      env: {
        MONGODB_URI: Boolean(process.env.MONGODB_URI),
        JWT_SECRET: Boolean(process.env.JWT_SECRET),
      },
    });
  }
}
