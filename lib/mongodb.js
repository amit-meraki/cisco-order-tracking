import "./load-env.js";
import { MongoClient } from "mongodb";
import { mongoErrorMessage } from "./mongo-error.js";

const globalKey = Symbol.for("cisco.mongo.client");

function getMongoOptions() {
  return {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 15000,
    connectTimeoutMS: 15000,
    socketTimeoutMS: 45000,
  };
}

function getClientPromise() {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!global[globalKey]) {
    const client = new MongoClient(uri, getMongoOptions());
    global[globalKey] = client.connect().catch((err) => {
      global[globalKey] = undefined;
      throw err;
    });
  }
  return global[globalKey];
}

export async function getDb() {
  try {
    const client = await getClientPromise();
    return client.db(process.env.MONGODB_DB || "cisco_orders");
  } catch (err) {
    throw new Error(mongoErrorMessage(err));
  }
}

export async function pingMongo() {
  const db = await getDb();
  await db.command({ ping: 1 });
  return {
    ok: true,
    database: db.databaseName,
    vercel: Boolean(process.env.VERCEL),
    env: {
      MONGODB_URI: Boolean(process.env.MONGODB_URI),
      JWT_SECRET: Boolean(process.env.JWT_SECRET),
      MONGODB_DB: process.env.MONGODB_DB || "cisco_orders",
    },
  };
}

export const COLLECTIONS = {
  users: "users",
  orders: "orders",
};
