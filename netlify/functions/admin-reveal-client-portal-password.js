import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { recordSecurityEvent } from "./utils/security-audit.js";

export default async (req) => {
  const headers = buildAdminHeaders();
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });

  const session = getAdminSessionFromRequest(req);
  if (!session.configured) return new Response(JSON.stringify({ error: "El panel no está configurado." }), { status: 500, headers });
  if (!session.authenticated) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers });

  await recordSecurityEvent(req, {
    type: "client_portal_password_reveal_blocked",
    actor: session.username,
    outcome: "blocked",
    reason: "password_reveal_disabled"
  });

  return new Response(
    JSON.stringify({
      error: "Por seguridad ya no es posible revelar claves. Usa la opción de restablecer contraseña temporal."
    }),
    { status: 410, headers }
  );
};
