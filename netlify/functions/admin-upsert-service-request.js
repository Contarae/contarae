import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { upsertServiceRequest } from "./utils/service-requests.js";

export default async (req) => {
  const headers = buildAdminHeaders();

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  const session = getAdminSessionFromRequest(req);

  if (!session.configured) {
    return new Response(JSON.stringify({ error: "El panel no está configurado." }), {
      status: 500,
      headers
    });
  }

  if (!session.authenticated) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers
    });
  }

  try {
    const body = await req.json();
    const detail = await upsertServiceRequest(body, session.username);

    return new Response(
      JSON.stringify({
        ok: true,
        detail
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible guardar la solicitud operativa",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
