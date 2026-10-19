import { createBackupJobToken } from "./utils/backup-job-auth.js";
import { recordSecurityEvent } from "./utils/security-audit.js";

export default async req => {
  try {
    const baseUrl = process.env.URL;
    if (!baseUrl || new URL(baseUrl).protocol !== "https:") throw new Error("Missing production URL for backup dispatch.");
    const response = await fetch(new URL("/.netlify/functions/automatic-data-backup-background", baseUrl), {
      method: "POST",
      headers: { Authorization: createBackupJobToken() },
      redirect: "error",
      signal: AbortSignal.timeout(15000)
    });
    if (response.status !== 202) throw new Error("Background backup was not accepted.");
    await recordSecurityEvent(req, { type: "automatic_backup_queued", actor: "system", outcome: "queued" });
    return new Response(JSON.stringify({ queued: true }), { status: 202 });
  } catch (error) {
    await recordSecurityEvent(req, { type: "automatic_backup_dispatch_failed", actor: "system", outcome: "failed", reason: error.message });
    return new Response(JSON.stringify({ error: "No fue posible iniciar el respaldo." }), { status: 500 });
  }
};

export const config = { schedule: "0 5 * * *" };
