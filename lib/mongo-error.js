export function mongoErrorMessage(err) {
  const msg = err?.message || String(err);

  if (msg.includes("MONGODB_URI is not set")) {
    return "MONGODB_URI is missing. Add it in Vercel → Settings → Environment Variables, then redeploy.";
  }

  if (
    msg.includes("authentication failed") ||
    msg.includes("bad auth") ||
    err?.code === 8000
  ) {
    return "MongoDB authentication failed. Check username/password in MONGODB_URI (URL-encode special characters in the password).";
  }

  if (
    msg.includes("timed out") ||
    msg.includes("Server selection") ||
    msg.includes("ECONNREFUSED") ||
    msg.includes("ENOTFOUND") ||
    err?.code === "ETIMEOUT"
  ) {
    return "Cannot reach MongoDB from Vercel. In Atlas → Network Access, add 0.0.0.0/0 (Allow access from anywhere), wait 1–2 minutes, then try again.";
  }

  if (msg.includes("IP") || msg.includes("whitelist")) {
    return "MongoDB blocked this connection. In Atlas → Network Access, allow 0.0.0.0/0 for Vercel serverless.";
  }

  return msg;
}
