import { getStore } from "@netlify/blobs";
import promoUtils from "./utils/promo-codes.cjs";

const {
  calculateCertificationPricing,
  buildReferralSnapshot,
  normalizePromoCode
} = promoUtils;

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
    const pricing = calculateCertificationPricing({
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
