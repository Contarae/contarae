const {
  calculateCertificationPricingAsync,
  normalizePromoCode
} = require("./utils/promo-codes.cjs");
const { buildCorsHeaders } = require("./utils/cors.cjs");
const { assertContentLength, assertNoHoneypot } = require("./utils/request-security.cjs");

const MAX_PROMO_PAYLOAD_BYTES = 12 * 1024;

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
    assertContentLength(event, MAX_PROMO_PAYLOAD_BYTES);
    const body = JSON.parse(event.body || "{}");
    assertNoHoneypot(body);
    const code = normalizePromoCode(body.code);

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, error: "Ingresa un código promocional." })
      };
    }

    const pricing = await calculateCertificationPricingAsync({
      monthlyIncome: body.monthlyIncome,
      promoCode: code
    });

    if (!pricing.promoApplied) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          valid: false,
          code,
          baseAmount: pricing.baseAmount,
          baseAmountLabel: pricing.baseAmountLabel,
          finalAmount: pricing.baseAmount,
          finalAmountLabel: pricing.baseAmountLabel,
          error: "Este código no está activo o no existe."
        })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        code: pricing.promoCode,
        allyName: pricing.promoAllyName,
        baseAmount: pricing.baseAmount,
        baseAmountLabel: pricing.baseAmountLabel,
        discountRate: pricing.discountRate,
        discountRateLabel: pricing.discountRateLabel,
        discountAmount: pricing.discountAmount,
        discountAmountLabel: pricing.discountAmountLabel,
        finalAmount: pricing.finalAmount,
        finalAmountLabel: pricing.finalAmountLabel
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ valid: false, error: "No fue posible validar el código." })
    };
  }
};

exports.config = {
  path: ["/api/validate-promo-code", "/.netlify/functions/validate-promo-code"],
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
