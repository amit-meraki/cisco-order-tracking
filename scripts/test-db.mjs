import { getDb, COLLECTIONS } from "../lib/mongodb.js";

try {
  const db = await getDb();
  const users = await db.collection(COLLECTIONS.users).countDocuments();
  const orders = await db.collection(COLLECTIONS.orders).countDocuments();
  console.log("MongoDB OK — users:", users, "orders:", orders);
} catch (err) {
  console.error("MongoDB FAIL:", err.message);
  process.exit(1);
}

process.exit(0);
