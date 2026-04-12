import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { listAllCertifications } from "./utils/certification-admin.js";

export default async (req) => {
  const headers = buildAdminHeaders();

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  const session = getAdminSessionFromRequest(req);

  if (!session.configured) {
    return new Response(
      JSON.stringify({ error: "El panel no está configurado." }),
      {
        status: 500,
        headers
      }
    );
  }

  if (!session.authenticated) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers
    });
  }

  try {
    const records = await listAllCertifications();

    return new Response(
      JSON.stringify({
        ok: true,
        records
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible listar las solicitudes",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
