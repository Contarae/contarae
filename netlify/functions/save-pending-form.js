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

    if (!data.reference) {
      return new Response(
        JSON.stringify({ error: "Falta la referencia" }),
        {
          status: 400,
          headers
        }
      );
    }

    const store = getStore("certification-requests");

    const pendingRecord = {
      reference: data.reference,
      status: "pending",
      createdAt: new Date().toISOString(),
      formData: data
    };

    await store.setJSON(`pending:${data.reference}`, pendingRecord);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Solicitud pendiente guardada correctamente",
        reference: data.reference
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