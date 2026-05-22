import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { buildPromoCodeReport } from "./utils/promo-code-reports.js";

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
    const url = new URL(req.url);
    const report = await buildPromoCodeReport(url.searchParams.get("code") || "");

    return new Response(
      JSON.stringify({
        ok: true,
        report
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible generar el informe del código promocional.",
        detail: error.message
      }),
      {
        status: 400,
        headers
      }
    );
  }
};
