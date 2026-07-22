import { getStore } from "@netlify/blobs";
import corsUtils from "./utils/cors.cjs";

const { buildCorsHeaders } = corsUtils;

function buildPublicPendingRecord(record = {}) {
  return {
    reference: record.reference || "",
    status: record.status || "pending",
    lastEventStatus: record.lastEventStatus || "",
    lastEventAt: record.lastEventAt || "",
    approvedAt: record.approvedAt || "",
    consecutive: record.consecutive || ""
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
    const record = await store.get(`pending:${reference}`, { type: "json" });

    if (!record) {
      return new Response(
        JSON.stringify({ error: "Solicitud no encontrada" }),
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
        record: buildPublicPendingRecord(record)
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error consultando la solicitud pendiente",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
