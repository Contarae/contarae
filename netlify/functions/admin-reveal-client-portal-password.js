import {
  authenticateAdminCredentials,
  buildAdminHeaders,
  getAdminSessionFromRequest
} from "./utils/admin-auth.js";
import { revealClientPortalPassword } from "./utils/client-portal-users.js";

export default async (req) => {
  const headers = buildAdminHeaders();
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });

  const session = getAdminSessionFromRequest(req);
  if (!session.configured) return new Response(JSON.stringify({ error: "El panel no está configurado." }), { status: 500, headers });
  if (!session.authenticated) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers });

  try {
    const body = await req.json();
    const password = String(body?.adminPassword || "");
    const auth = authenticateAdminCredentials(session.username, password);
    if (!auth.ok) return new Response(JSON.stringify({ error: "Contraseña de funcionario inválida." }), { status: 401, headers });

    const result = await revealClientPortalPassword(body?.userId, session.username);
    return new Response(JSON.stringify(result), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: "No fue posible consultar la clave.", detail: error.message }), { status: 400, headers });
  }
};
