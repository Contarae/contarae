import { buildClientPortalHeaders, getClientPortalSessionFromRequest } from "./utils/client-portal-auth.js";
import { upsertPortalEntity } from "./utils/client-portal-data.js";

export default async (req) => {
  const headers = buildClientPortalHeaders();

  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo no permitido" }), { status: 405, headers });
  }

  const session = getClientPortalSessionFromRequest(req);
  if (!session.configured) {
    return new Response(JSON.stringify({ error: "El portal para clientes no esta configurado." }), { status: 500, headers });
  }
  if (!session.authenticated) {
    return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers });
  }

  try {
    const body = await req.json();
    const type = String(body?.type || "").trim();
    const payload = body?.payload || {};
    const actor = session.impersonatedBy ? `soporte:${session.impersonatedBy}` : session.username;
    const data = await upsertPortalEntity(session.companyId, type, payload, actor);

    return new Response(JSON.stringify({ ok: true, data }), { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "No fue posible guardar el registro" }),
      { status: 400, headers }
    );
  }
};
