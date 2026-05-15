import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { listClientPortalUsers } from "./utils/client-portal-users.js";

export default async (req) => {
  const headers = buildAdminHeaders();
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "GET") return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });

  const session = getAdminSessionFromRequest(req);
  if (!session.configured) return new Response(JSON.stringify({ error: "El panel no está configurado." }), { status: 500, headers });
  if (!session.authenticated) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers });

  try {
    const users = await listClientPortalUsers();
    return new Response(JSON.stringify({ users }), { status: 200, headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: "No fue posible cargar usuarios del portal.", detail: error.message }), { status: 500, headers });
  }
};
