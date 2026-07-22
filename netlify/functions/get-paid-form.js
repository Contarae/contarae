import { getStore } from "@netlify/blobs";
import corsUtils from "./utils/cors.cjs";

const { buildCorsHeaders } = corsUtils;

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
    "Content-Type": "application/json"
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
    const reference = url.searchParams.get("reference");

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "Falta la referencia" }),
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
