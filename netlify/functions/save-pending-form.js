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

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      {
        status: 405,
        headers
      }
    );
  }

  try {
    const data = await req.json();
    const reference = String(data.reference || "").trim();

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
    const {
      supportFiles = [],
      reference: ignoredReference,
      ...formPayload
    } = data;

    const pendingRecord = {
      reference,
      status: "pending",
      createdAt: new Date().toISOString(),
      supportFiles: Array.isArray(supportFiles) ? supportFiles : [],
      formData: {
        ...formPayload,
        referencia_wompi: formPayload.referencia_wompi || reference
      }
    };

    await store.setJSON(`pending:${reference}`, pendingRecord);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Solicitud pendiente guardada correctamente",
        reference
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error guardando la solicitud pendiente",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
