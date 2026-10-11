import { getStore } from "@netlify/blobs";
import corsUtils from "./utils/cors.cjs";

const { buildCorsHeaders } = corsUtils;

function normalizeCertificationReference(value = "") {
  return String(value || "").trim().toUpperCase();
}

function isValidCertificationReference(reference = "") {
  return /^CONTARAE-\d{10,}-[A-Z0-9]{5,10}$/.test(normalizeCertificationReference(reference));
}

function buildPublicPaidRecord(record = {}) {
  return {
    reference: record.reference || "",
    status: record.status || "",
    approvedAt: record.approvedAt || "",
    consecutive: record.consecutive || "",
    ga4PaymentApprovedSentAt: record.ga4PaymentApprovedSentAt || "",
    pricing: {
      finalAmount: Number(record.pricing?.finalAmount || 0) || 0
    },
    wompiTransaction: {
      id: record.wompiTransaction?.id || "",
      status: record.wompiTransaction?.status || ""
    }
  };
}

export default async (req, context) => {
  const headers = buildCorsHeaders(req, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });

  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers
    });
  }

  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      {
        status: 405,
        headers
      }
    );
  }

  try {
    const url = new URL(req.url);
    const reference = normalizeCertificationReference(url.searchParams.get("reference"));

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Falta la referencia" }),
        {
          status: 400,
          headers
        }
      );
    }

    if (!isValidCertificationReference(reference)) {
      return new Response(
        JSON.stringify({ error: "Referencia inválida" }),
        {
          status: 400,
          headers
        }
      );
    }

    const store = getStore("certification-requests");
    const record = await store.get(`paid:${reference}`, { type: "json" });

    if (!record) {
      return new Response(
        JSON.stringify({
          ok: false,
          message: "Solicitud aún no procesada",
          reference
        }),
        {
          status: 404,
          headers
        }
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        reference,
        record: buildPublicPaidRecord(record)
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error consultando la solicitud aprobada",
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
  path: ["/api/get-paid-form", "/.netlify/functions/get-paid-form"],
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
