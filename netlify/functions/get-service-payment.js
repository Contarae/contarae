import { getServicePaymentByReference } from "./utils/service-requests.js";
import corsUtils from "./utils/cors.cjs";

const { buildCorsHeaders } = corsUtils;

function normalizePaymentReference(value = "") {
  return String(value || "").trim().toUpperCase();
}

function isValidServicePaymentReference(reference = "") {
  return /^CONTARAE-PAY-\d{8}-[A-Z0-9]{6}$/.test(normalizePaymentReference(reference));
}

export default async (req) => {
  const headers = buildCorsHeaders(req, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  try {
    const url = new URL(req.url);
    const reference = normalizePaymentReference(url.searchParams.get("reference") || url.searchParams.get("ref"));

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia del pago" }), {
        status: 400,
        headers
      });
    }

    if (!isValidServicePaymentReference(reference)) {
      return new Response(JSON.stringify({ error: "Referencia de pago inválida" }), {
        status: 400,
        headers
      });
    }

    const result = await getServicePaymentByReference(reference);

    if (!result) {
      return new Response(JSON.stringify({ error: "Link de pago no encontrado" }), {
        status: 404,
        headers
      });
    }

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
        error: "No fue posible consultar el pago",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};

export const config = {
  path: ["/api/get-service-payment", "/.netlify/functions/get-service-payment"],
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
