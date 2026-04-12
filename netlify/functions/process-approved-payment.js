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
    const reference = data.reference;

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

    // Si ya fue procesada, devolvemos el registro existente
    const existingPaid = await store.get(`paid:${reference}`, { type: "json" });
    if (existingPaid) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "La solicitud ya estaba procesada",
          record: existingPaid
        }),
        {
          status: 200,
          headers
        }
      );
    }

    const pendingRecord = await store.get(`pending:${reference}`, { type: "json" });

    if (!pendingRecord) {
      return new Response(
        JSON.stringify({ error: "Solicitud pendiente no encontrada" }),
        {
          status: 404,
          headers
        }
      );
    }

    // Leemos el último consecutivo usado
    const seqRecord = await store.get("meta:last-sequence", { type: "json" });
    const lastSequence = seqRecord?.lastSequence || 999;
    const newSequence = lastSequence + 1;

    const paidRecord = {
      ...pendingRecord,
      status: "approved",
      approvedAt: new Date().toISOString(),
      consecutive: newSequence
    };

    // Guardamos el registro final pagado
    await store.setJSON(`paid:${reference}`, paidRecord);

    // Actualizamos también el pendiente para dejar trazabilidad
    await store.setJSON(`pending:${reference}`, {
      ...pendingRecord,
      status: "approved",
      consecutive: newSequence,
      approvedAt: paidRecord.approvedAt
    });

    // Guardamos el último consecutivo usado
    await store.setJSON("meta:last-sequence", {
      lastSequence: newSequence
    });

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Pago aprobado procesado correctamente",
        reference,
        consecutive: newSequence,
        record: paidRecord
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error procesando el pago aprobado",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};