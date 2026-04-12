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
    const paidRecord = await store.get(`paid:${reference}`, { type: "json" });

    if (!paidRecord) {
      return new Response(
        JSON.stringify({ error: "Solicitud aprobada no encontrada" }),
        {
          status: 404,
          headers
        }
      );
    }

    if (paidRecord.netlifySubmittedAt) {
      return new Response(
        JSON.stringify({
          ok: true,
          message: "La solicitud ya fue enviada a Netlify Forms",
          reference,
          submittedAt: paidRecord.netlifySubmittedAt
        }),
        {
          status: 200,
          headers
        }
      );
    }

    const formName = process.env.NETLIFY_FORM_NAME || "certificacion";
    const origin = new URL(req.url).origin;

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
    params.append("total_ingresos", String(formData.total_ingresos || ""));
    params.append("tarifa_pagada", String(formData.tarifa_pagada || ""));
    params.append(
      "wompi_transaction_id",
      String(paidRecord.wompiTransaction?.id || "")
    );

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
        {
          status: 500,
          headers
        }
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
        message: "Solicitud enviada correctamente a Netlify Forms",
        reference,
        consecutivo: paidRecord.consecutive,
        submittedAt: updatedPaidRecord.netlifySubmittedAt
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error enviando la solicitud final a Netlify Forms",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
