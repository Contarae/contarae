import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { getLatestBackupManifest } from "./utils/data-backup.js";
import { listSecurityEvents } from "./utils/security-audit.js";

const REQUIRED_ENV_VARS = [
  "ADMIN_PANEL_USERNAME",
  "ADMIN_PANEL_PASSWORD",
  "ADMIN_PANEL_SECRET",
  "CLIENT_PORTAL_SECRET",
  "WOMPI_EVENTS_SECRET",
  "WOMPI_INTEGRITY_KEY",
  "RESEND_API_KEY"
];

function envStatus() {
  return REQUIRED_ENV_VARS.map((name) => ({
    name,
    configured: Boolean(process.env[name])
  }));
}

export default async (req) => {
  const headers = buildAdminHeaders();
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });

  const session = getAdminSessionFromRequest(req);
  if (!session.configured) return new Response(JSON.stringify({ error: "El panel no está configurado." }), { status: 500, headers });
  if (!session.authenticated) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers });

  try {
    const [latestBackup, securityEvents] = await Promise.all([
      getLatestBackupManifest(),
      listSecurityEvents({ limit: 12 })
    ]);

    return new Response(
      JSON.stringify({
        ok: true,
        generatedAt: new Date().toISOString(),
        latestBackup,
        securityEvents,
        environment: envStatus()
      }),
      { status: 200, headers }
    );
  } catch {
    return new Response(JSON.stringify({ error: "No fue posible consultar la salud operativa." }), { status: 500, headers });
  }
};
