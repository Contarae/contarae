import { buildClientPortalHeaders, getClientPortalSessionFromRequest } from "./utils/client-portal-auth.js";
import { validateOrCommitImport } from "./utils/client-portal-data.js";

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
    const module = String(body?.module || "").trim();
    const rows = Array.isArray(body?.rows) ? body.rows : [];
    const commit = Boolean(body?.commit);
    const actor = session.impersonatedBy ? `soporte:${session.impersonatedBy}` : session.username;
    const result = await validateOrCommitImport(session.companyId, module, rows, commit, actor);

    return new Response(JSON.stringify(result), { status: result.ok ? 200 : 400, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ ok: false, error: "No fue posible procesar el cargue", detail: error.message }),
      { status: 500, headers }
    );
  }
};
