export function normalizeOrderNo(value) {
  return String(value ?? "").trim();
}

export function validateOrderPayload(body, { requireAll = false } = {}) {
  const orderNo = normalizeOrderNo(body.orderNo);
  const status = body.status != null ? String(body.status).trim() : "";
  const description =
    body.description != null ? String(body.description).trim() : undefined;
  const ticketNumber =
    body.ticketNumber != null ? String(body.ticketNumber).trim() : undefined;

  if (requireAll) {
    if (!orderNo) throw new Error("Order number is required.");
    if (!status) throw new Error("Status is required.");
  }

  const patch = { updatedAt: new Date() };
  if (orderNo) patch.orderNo = orderNo;
  if (status) patch.status = status;
  if (description !== undefined) patch.description = description;
  if (ticketNumber !== undefined) patch.ticketNumber = ticketNumber;

  return patch;
}
