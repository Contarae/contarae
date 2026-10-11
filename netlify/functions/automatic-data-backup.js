import { createStructuredDataBackup } from "./utils/data-backup.js";
import { recordSecurityEvent } from "./utils/security-audit.js";

export default async (req) => {
  try {
    const result = await createStructuredDataBackup();
    const totals = Object.fromEntries(
      Object.entries(result.summary || {}).map(([storeName, summary]) => [
        storeName,
        {
          scanned: summary.scanned,
          included: summary.included,
          skipped: summary.skipped
        }
      ])
    );

    console.log("Structured data backup completed", {
      backupKey: result.backupKey,
      totals,
      retention: result.retention
    });
    await recordSecurityEvent(req, {
      type: "automatic_backup_completed",
      actor: "system",
      subject: result.backupKey,
      outcome: "ok",
      details: { sha256: result.sha256, totals }
    });

    return new Response(
      JSON.stringify({
        ok: true,
        backupKey: result.backupKey,
        generatedAt: result.generatedAt,
        totals,
        retention: result.retention
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  } catch (error) {
    console.error("Structured data backup failed", {
      message: error.message
    });
    await recordSecurityEvent(req, {
      type: "automatic_backup_failed",
      actor: "system",
      outcome: "failed",
      reason: error.message
    });

    return new Response(
      JSON.stringify({
        ok: false,
        error: "No fue posible crear el respaldo automatico."
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};

export const config = {
  schedule: "0 5 * * *"
};
