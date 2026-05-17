import { buildClientPortalHeaders, getClientPortalSessionFromRequest } from "./utils/client-portal-auth.js";
import { compactCompanyData, loadCompanyData } from "./utils/client-portal-data.js";

export default async (req) => {
  const headers = buildClientPortalHeaders();

  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "GET") {
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
    const url = new URL(req.url);
    const scope = url.searchParams.get("scope") || "full";
    const data = await loadCompanyData(session.companyId, session.companyName);
    const responseData = scope === "summary" ? compactCompanyData(data) : data;
    return new Response(JSON.stringify({ ok: true, data: responseData }), { status: 200, headers });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "No fue posible cargar la informacion del portal", detail: error.message }),
      { status: 500, headers }
    );
  }
};
