import { getStore } from "@netlify/blobs";

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

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
        record
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