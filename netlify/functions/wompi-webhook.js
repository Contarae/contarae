import crypto from "crypto";
import { getStore } from "@netlify/blobs";

function getValueByPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function buildNetlifyFormPayload(formName, paidRecord, reference) {
  const params = new URLSearchParams();
  params.append("form-name", formName);

  const formData = paidRecord.formData || {};

  Object.entries(formData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (["estado_pago", "consecutivo", "referencia_wompi"].includes(key)) return;
    params.append(key, String(value));
  });

  params.append("referencia_wompi", reference);
  params.append("consecutivo", String(paidRecord.consecutive || ""));
  params.append("estado_pago", "APROBADO");
  params.append(
    "wompi_transaction_id",
    String(paidRecord.wompiTransaction?.id || "")
  );

  return params;
}

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Event-Checksum",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers }
    );
  }

  try {
    const body = await req.json();

    const eventName = body?.event;
    const transaction = body?.data?.transaction;
    const signature = body?.signature;
    const eventSecret = process.env.WOMPI_EVENTS_SECRET;

    if (!eventSecret) {
      return new Response(
        JSON.stringify({ error: "Falta WOMPI_EVENTS_SECRET en variables de entorno" }),
        { status: 500, headers }
      );
    }

    if (!eventName || !transaction || !signature) {
      return new Response(
        JSON.stringify({ error: "Evento incompleto" }),
        { status: 400, headers }
      );
    }

    const properties = signature.properties || [];
    const timestamp = String(signature.timestamp || "");
    const wompiChecksum = String(signature.checksum || "").toUpperCase();

    const concatenatedValues = properties
      .map((path) => String(getValueByPath(body.data, path) ?? ""))
      .join("");

    const localChecksum = crypto
      .createHash("sha256")
      .update(`${concatenatedValues}${timestamp}${eventSecret}`)
      .digest("hex")
      .toUpperCase();

    if (localChecksum !== wompiChecksum) {
      return new Response(
        JSON.stringify({ error: "Firma del evento inválida" }),
        { status: 401, headers }
      );
    }

    if (eventName !== "transaction.updated") {
      return new Response(
        JSON.stringify({ ok: true, message: "Evento ignorado", event: eventName }),
        { status: 200, headers }
      );
    }

    const reference = transaction.reference;
    const status = transaction.status;

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "El evento no trae referencia" }),
        { status: 400, headers }
      );
    }

    if (status !== "APPROVED") {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Evento recibido, pero no aprobado",
          reference,
          status
        }),
        { status: 200, headers }
      );
    }

    const store = getStore("certification-requests");
    const formName = process.env.NETLIFY_FORM_NAME || "certificacion";

    let paidRecord = await store.get(`paid:${reference}`, { type: "json" });

    if (!paidRecord) {
      const pendingRecord = await store.get(`pending:${reference}`, { type: "json" });

      if (!pendingRecord) {
        return new Response(
          JSON.stringify({ error: "Solicitud pendiente no encontrada" }),
          { status: 404, headers }
        );
      }

      const seqRecord = await store.get("meta:last-sequence", { type: "json" });
      const lastSequence = seqRecord?.lastSequence || 999;
      const newSequence = lastSequence + 1;

      paidRecord = {
        ...pendingRecord,
        status: "approved",
        approvedAt: new Date().toISOString(),
        consecutive: newSequence,
        wompiTransaction: {
          id: transaction.id,
          status: transaction.status,
          amount_in_cents: transaction.amount_in_cents,
          currency: transaction.currency,
          payment_method_type: transaction.payment_method_type,
          customer_email: transaction.customer_email
        }
      };

      await store.setJSON(`paid:${reference}`, paidRecord);
      await store.setJSON(`pending:${reference}`, {
        ...pendingRecord,
        status: "approved",
        consecutive: newSequence,
        approvedAt: paidRecord.approvedAt
      });
      await store.setJSON("meta:last-sequence", {
        lastSequence: newSequence
      });
    }

    if (paidRecord.netlifySubmittedAt) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Solicitud ya aprobada y enviada a Netlify Forms",
          reference,
          consecutivo: paidRecord.consecutive,
          submittedAt: paidRecord.netlifySubmittedAt
        }),
        { status: 200, headers }
      );
    }

    const origin = new URL(req.url).origin;
    const params = buildNetlifyFormPayload(formName, paidRecord, reference);

    const submitResponse = await fetch(`${origin}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });

    if (!submitResponse.ok) {
      const responseText = await submitResponse.text();
      return new Response(
        JSON.stringify({
          error: "Netlify Forms no aceptó el envío",
          detail: responseText
        }),
        { status: 500, headers }
      );
    }

    const updatedPaidRecord = {
      ...paidRecord,
      netlifySubmittedAt: new Date().toISOString(),
      netlifyFormName: formName
    };

    await store.setJSON(`paid:${reference}`, updatedPaidRecord);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Webhook procesado y formulario enviado correctamente",
        reference,
        consecutivo: updatedPaidRecord.consecutive,
        submittedAt: updatedPaidRecord.netlifySubmittedAt
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error procesando webhook de Wompi",
        detail: error.message
      }),
      { status: 500, headers }
    );
  }
};
