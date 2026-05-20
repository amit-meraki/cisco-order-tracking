import "./load-env.js";
import { MongoClient } from "mongodb";

const globalKey = Symbol.for("cisco.mongo");

function getClientPromise() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not set");
  }

  if (!global[globalKey]) {
    const client = new MongoClient(uri);
    global[globalKey] = client.connect();
  }
  return global[globalKey];
}

export async function getDb() {
  const client = await getClientPromise();
  return client.db(process.env.MONGODB_DB || "cisco_orders");
}

export const COLLECTIONS = {
  users: "users",
  orders: "orders",
};
