import "../lib/load-env.js";
import express from "express";
import loginHandler from "../api/auth/login.js";
import ordersHandler from "../api/orders/index.js";
import orderNoHandler from "../api/orders/[orderNo].js";

const app = express();
const PORT = process.env.API_PORT || 3000;

app.use(express.json());

function run(handler) {
  return (req, res) => handler(req, res);
}

app.all("/api/auth/login", run(loginHandler));

app.all("/api/orders", run(ordersHandler));

app.all("/api/orders/:orderNo", (req, res) => {
  req.query = { ...req.query, orderNo: req.params.orderNo };
  return run(orderNoHandler)(req, res);
});

app.listen(PORT, () => {
  console.log(`API server http://localhost:${PORT}`);
  console.log("Env:", {
    MONGODB_URI: process.env.MONGODB_URI ? "set" : "MISSING",
    JWT_SECRET: process.env.JWT_SECRET ? "set" : "MISSING",
  });
});
