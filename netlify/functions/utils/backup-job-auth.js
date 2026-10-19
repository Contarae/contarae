import crypto from "crypto";

function secret() {
  return process.env.ADMIN_PANEL_SECRET || process.env.ADMIN_SECRET || "";
}

export function createBackupJobToken(now = Date.now()) {
  if (!secret()) throw new Error("Backup job authentication is not configured.");
  const signature = crypto.createHmac("sha256", secret()).update(`contarae:backup:${now}`).digest("hex");
  return `Bearer ${now}.${signature}`;
}

export function verifyBackupJobToken(token = "", now = Date.now()) {
  if (!secret()) return false;
  const match = String(token || "").match(/^Bearer (\d{13})\.([a-f0-9]{64})$/);
  if (!match || Math.abs(now - Number(match[1])) > 300000) return false;
  const expected = createBackupJobToken(Number(match[1]));
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(token));
}
