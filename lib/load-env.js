import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Vercel injects env vars at runtime — only load .env file for local dev
if (!process.env.VERCEL) {
  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
  dotenv.config({ path: path.join(root, ".env") });
}
