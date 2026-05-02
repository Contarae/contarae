import {
  authenticateAdminCredentials,
  buildAdminHeaders,
  getAdminSessionFromRequest
} from "./utils/admin-auth.js";
import { voidManualServicePayment } from "./utils/service-requests.js";

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
    const username = String(body?.username || "");
    const password = String(body?.password || "");
    const auth = authenticateAdminCredentials(username, password);

    if (!auth.ok || username !== session.username) {
      return new Response(JSON.stringify({ error: "Usuario o contraseña inválidos." }), {
        status: 401,
        headers
      });
    }

    const result = await voidManualServicePayment(
      body?.reference,
      body?.paymentReference,
      { reason: body?.reason },
      session.username
    );

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
        error: "No fue posible anular el pago.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
