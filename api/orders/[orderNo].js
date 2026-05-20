import { getDb, COLLECTIONS } from "../../lib/mongodb.js";
import { mongoErrorMessage } from "../../lib/mongo-error.js";
import { requireAuth } from "../../lib/auth.js";
import { setCors, handleOptions } from "../../lib/cors.js";
import { normalizeOrderNo, validateOrderPayload } from "../../lib/orders.js";

function serializeOrder(doc) {
  return {
    id: doc._id.toString(),
    orderNo: doc.orderNo,
    status: doc.status,
    description: doc.description || "",
    ticketNumber: doc.ticketNumber || "",
    updatedAt: doc.updatedAt,
  };
}

export default async function handler(req, res) {
  setCors(res);
  if (handleOptions(req, res)) return;

  const orderNo = normalizeOrderNo(req.query.orderNo);
  if (!orderNo) {
    return res.status(400).json({ error: "Order number is required." });
  }

  try {
    const user = requireAuth(req, res);
    if (!user) return;

    const db = await getDb();
    const ordersCol = db.collection(COLLECTIONS.orders);
    const existing = await ordersCol.findOne({ orderNo });

    if (req.method === "PUT") {
      if (!existing) {
        return res.status(404).json({ error: `Order "${orderNo}" not found.` });
      }

      const patch = validateOrderPayload(req.body);
      delete patch.orderNo;

      if (!patch.status && patch.description === undefined && patch.ticketNumber === undefined) {
        return res.status(400).json({ error: "No fields to update." });
      }

      await ordersCol.updateOne({ orderNo }, { $set: patch });
      const updated = await ordersCol.findOne({ orderNo });
      return res.status(200).json({ order: serializeOrder(updated) });
    }

    if (req.method === "DELETE") {
      if (!existing) {
        return res.status(404).json({ error: `Order "${orderNo}" not found.` });
      }
      await ordersCol.deleteOne({ orderNo });
      return res.status(200).json({ deleted: orderNo });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("orders [orderNo] error:", err);
    const message = mongoErrorMessage(err);
    const isMongo =
      message.includes("MongoDB") ||
      message.includes("MONGODB_URI") ||
      message.includes("Atlas");
    return res.status(isMongo ? 503 : 500).json({ error: message });
  }
}
