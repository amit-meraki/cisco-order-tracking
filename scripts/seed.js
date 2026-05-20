import "dotenv/config";
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "cisco_orders";

if (!uri) {
  console.error("Set MONGODB_URI in .env");
  process.exit(1);
}

const defaultUsers = [
  {
    email: process.env.SEED_ADMIN_EMAIL || "admin@example.com",
    password: process.env.SEED_ADMIN_PASSWORD || "changeme123",
    name: "Admin",
  },
];

function parseSeedUsers() {
  if (process.env.SEED_USERS) {
    try {
      const parsed = JSON.parse(process.env.SEED_USERS);
      if (!Array.isArray(parsed)) throw new Error("SEED_USERS must be a JSON array");
      return parsed.map((u) => ({
        email: String(u.email).trim().toLowerCase(),
        password: String(u.password),
        name: u.name || u.email,
      }));
    } catch (err) {
      console.error("Invalid SEED_USERS:", err.message);
      process.exit(1);
    }
  }
  return defaultUsers.map((u) => ({
    email: u.email.trim().toLowerCase(),
    password: u.password,
    name: u.name,
  }));
}

async function seed() {
  const users = parseSeedUsers();
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const usersCol = db.collection("users");
    const ordersCol = db.collection("orders");

    await usersCol.createIndex({ email: 1 }, { unique: true });
    await ordersCol.createIndex({ orderNo: 1 }, { unique: true });

    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 12);
      const result = await usersCol.updateOne(
        { email: user.email },
        {
          $set: {
            email: user.email,
            passwordHash,
            name: user.name,
            updatedAt: new Date(),
          },
          $setOnInsert: { createdAt: new Date() },
        },
        { upsert: true }
      );
      const action = result.upsertedCount ? "created" : "updated";
      console.log(`User ${user.email} (${action})`);
    }

    console.log("\nSeeded users (login only — no sign-up in app):");
    users.forEach((u) => console.log(`  ${u.email}`));
    console.log("\nChange passwords via SEED_ADMIN_PASSWORD or SEED_USERS, then re-run npm run seed");
  } finally {
    await client.close();
  }
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
