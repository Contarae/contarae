import { listPublicServicePaymentsByDocument } from "./utils/service-requests.js";
import corsUtils from "./utils/cors.cjs";
import requestSecurity from "./utils/request-security.cjs";

const { buildCorsHeaders } = corsUtils;
const { assertContentLength, assertNoHoneypot } = requestSecurity;
const MAX_PAYMENT_LOOKUP_PAYLOAD_BYTES = 16 * 1024;

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
    assertContentLength(req, MAX_PAYMENT_LOOKUP_PAYLOAD_BYTES);
    const body = await req.json();
    assertNoHoneypot(body);
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

export const config = {
  path: ["/api/public-service-payments", "/.netlify/functions/public-service-payments"],
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
