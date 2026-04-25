import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { createServicePaymentLink } from "./utils/service-requests.js";

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
    const reference = String(body?.reference || "").trim();

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia de la solicitud" }), {
        status: 400,
        headers
      });
    }

    const origin = new URL(req.url).origin;
    const result = await createServicePaymentLink(reference, body, session.username, origin);

    return new Response(
      JSON.stringify({
        ok: true,
        ...result
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible generar el link de pago",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
