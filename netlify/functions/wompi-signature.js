const {
  calculateCertificationPricingAsync,
  normalizePromoCode
} = require("./utils/promo-codes.cjs");
const { buildCorsHeaders } = require("./utils/cors.cjs");

exports.handler = async (event) => {
  const headers = buildCorsHeaders(event, {
    "Content-Type": "application/json"
  });

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Método no permitido" })
    };
  }

  try {
    const { reference, amountInCents, currency, monthlyIncome, promoCode } = JSON.parse(event.body);
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;

    if (!integrityKey) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Falta configurar la llave de integridad de Wompi." })
      };
    }

    const pricing = await calculateCertificationPricingAsync({
      monthlyIncome,
      promoCode
    });
    const expectedAmountInCents = pricing.finalAmount * 100;
    const requestedAmountInCents = Number(amountInCents || 0);

    if (normalizePromoCode(promoCode) && !pricing.promoApplied) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Código promocional no válido o inactivo." })
      };
    }

    if (requestedAmountInCents !== expectedAmountInCents) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: "El valor de pago no coincide con la tarifa calculada.",
          expectedAmountInCents
        })
      };
    }

    const crypto = require("crypto");
    const signature = crypto
      .createHash("sha256")
      .update(`${reference}${amountInCents}${currency}${integrityKey}`)
      .digest("hex");

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        signature,
        pricing: {
          baseAmount: pricing.baseAmount,
          discountAmount: pricing.discountAmount,
          finalAmount: pricing.finalAmount,
          promoApplied: pricing.promoApplied,
          promoCode: pricing.promoCode,
          allyName: pricing.promoAllyName
        }
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Error generando firma" })
    };
  }
};
