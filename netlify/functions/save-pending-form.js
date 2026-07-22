import { getStore } from "@netlify/blobs";
import promoUtils from "./utils/promo-codes.cjs";
import corsUtils from "./utils/cors.cjs";

const {
  calculateCertificationPricingAsync,
  buildReferralSnapshot,
  normalizePromoCode
} = promoUtils;
const { buildCorsHeaders } = corsUtils;

const MAX_PENDING_PAYLOAD_BYTES = 200 * 1024;

function isValidCertificationReference(reference = "") {
  return /^CONTARAE-\d{10,}-[A-Z0-9]{5,10}$/.test(String(reference || "").trim());
}

function hasRequiredPendingFields(formPayload = {}) {
  const email = String(formPayload.correo || formPayload.email || "").trim();
  return Boolean(
    String(formPayload.nombre || "").trim() &&
      String(formPayload.tipo_documento || "").trim() &&
      String(formPayload.numero_documento || "").trim() &&
      String(formPayload.telefono || "").trim() &&
      email &&
      String(formPayload.destino || "").trim() &&
      String(formPayload.periodo || "").trim() &&
      String(formPayload.periodo_meses || "").trim() &&
      String(formPayload.total_ingresos_num || formPayload.total_ingresos || "").trim()
  );
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
    const contentLength = Number(req.headers.get("content-length") || 0);
    if (contentLength > MAX_PENDING_PAYLOAD_BYTES) {
      return new Response(
        JSON.stringify({ error: "La solicitud supera el tamaño permitido." }),
        {
          status: 413,
          headers
        }
      );
    }

    const data = await req.json();
    const reference = String(data.reference || "").trim();

    if (!reference || !isValidCertificationReference(reference)) {
      return new Response(
        JSON.stringify({ error: "Referencia de solicitud inválida." }),
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

    if (!hasRequiredPendingFields(formPayload)) {
      return new Response(
        JSON.stringify({ error: "La solicitud no contiene los campos mínimos requeridos." }),
        {
          status: 400,
          headers
        }
      );
    }

    const pricing = await calculateCertificationPricingAsync({
      monthlyIncome: formPayload.total_ingresos_num || formPayload.total_ingresos,
      promoCode: formPayload.codigo_promocional
    });
    const promoWasProvided = Boolean(normalizePromoCode(formPayload.codigo_promocional));

    if (promoWasProvided && !pricing.promoApplied) {
      return new Response(
        JSON.stringify({ error: "El código promocional no está activo o no existe." }),
        {
          status: 400,
          headers
        }
      );
    }

    const promoReferral = buildReferralSnapshot(pricing);

    const pendingRecord = {
      reference,
      status: "pending",
      createdAt: new Date().toISOString(),
      supportFiles: Array.isArray(supportFiles) ? supportFiles : [],
      pricing: {
        baseAmount: pricing.baseAmount,
        discountAmount: pricing.discountAmount,
        finalAmount: pricing.finalAmount,
        promoApplied: pricing.promoApplied
      },
      promoReferral,
      formData: {
        ...formPayload,
        total_ingresos_num: String(pricing.monthlyIncome || ""),
        tarifa_base: pricing.baseAmountLabel,
        descuento_promocional: pricing.promoApplied ? pricing.discountAmountLabel : "",
        codigo_promocional: pricing.promoApplied ? pricing.promoCode : "",
        aliado_estrategico: pricing.promoApplied ? pricing.promoAllyName : "",
        porcentaje_descuento_promocional: pricing.promoApplied ? pricing.discountRateLabel : "",
        porcentaje_comision_aliado: pricing.promoApplied ? pricing.commissionRateLabel : "",
        comision_aliado_estimada: pricing.promoApplied ? pricing.commissionAmountLabel : "",
        tarifa_pagada: pricing.finalAmountLabel,
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
