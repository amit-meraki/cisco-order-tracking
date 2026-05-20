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

  try {
    const db = await getDb();
    const ordersCol = db.collection(COLLECTIONS.orders);

    if (req.method === "GET") {
      const docs = await ordersCol.find({}).sort({ orderNo: 1 }).toArray();
      return res.status(200).json({ orders: docs.map(serializeOrder) });
    }

    if (req.method === "POST") {
      const user = requireAuth(req, res);
      if (!user) return;

      const patch = validateOrderPayload(req.body, { requireAll: true });
      const existing = await ordersCol.findOne({ orderNo: patch.orderNo });
      if (existing) {
        return res.status(409).json({ error: `Order "${patch.orderNo}" already exists.` });
      }

      const doc = {
        orderNo: patch.orderNo,
        status: patch.status,
        description: patch.description ?? "",
        ticketNumber: patch.ticketNumber ?? "",
        createdAt: new Date(),
        updatedAt: patch.updatedAt,
        createdBy: user.email,
      };

      const result = await ordersCol.insertOne(doc);
      return res.status(201).json({
        order: serializeOrder({ _id: result.insertedId, ...doc }),
      });
    }

    if (req.method === "PUT" && req.body?.replaceAll) {
      const user = requireAuth(req, res);
      if (!user) return;

      const items = req.body.orders;
      if (!Array.isArray(items)) {
        return res.status(400).json({ error: "orders must be an array." });
      }

      await ordersCol.deleteMany({});
      if (items.length === 0) {
        return res.status(200).json({ orders: [], imported: 0 });
      }

      const docs = items
        .map((item) => {
          const orderNo = normalizeOrderNo(item.orderNo);
          if (!orderNo) return null;
          return {
            orderNo,
            status: item.status || "Pending",
            description: (item.description || "").trim(),
            ticketNumber: (item.ticketNumber || "").trim(),
            createdAt: new Date(),
            updatedAt: new Date(),
            createdBy: user.email,
          };
        })
        .filter(Boolean);

      if (docs.length) await ordersCol.insertMany(docs);
      const all = await ordersCol.find({}).sort({ orderNo: 1 }).toArray();
      return res.status(200).json({
        orders: all.map(serializeOrder),
        imported: docs.length,
      });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (err) {
    console.error("orders index error:", err);
    const message = mongoErrorMessage(err);
    if (message.includes("required")) {
      return res.status(400).json({ error: message });
    }
    const isMongo =
      message.includes("MongoDB") ||
      message.includes("MONGODB_URI") ||
      message.includes("Atlas");
    return res.status(isMongo ? 503 : 500).json({ error: message });
  }
}
