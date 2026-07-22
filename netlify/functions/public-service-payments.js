import { listPublicServicePaymentsByDocument } from "./utils/service-requests.js";
import corsUtils from "./utils/cors.cjs";

const { buildCorsHeaders } = corsUtils;

export default async (req) => {
  const headers = buildCorsHeaders(req, {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  try {
    const body = await req.json();
    const result = await listPublicServicePaymentsByDocument(body);

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
        error: "No fue posible consultar los pagos",
        detail: error.message
      }),
      {
        status: 400,
        headers
      }
    );
  }
};
