import promoUtils from "./utils/promo-codes.cjs";
import corsUtils from "./utils/cors.cjs";
import requestSecurity from "./utils/request-security.cjs";
import { boundedEventHandler } from "./utils/bounded-event-handler.js";

const {
  calculateCertificationPricingAsync,
  normalizePromoCode
} = promoUtils;
const { buildCorsHeaders } = corsUtils;
const { readEventJsonBody, assertNoHoneypot } = requestSecurity;

const MAX_PROMO_PAYLOAD_BYTES = 12 * 1024;

export const eventHandler = async (event) => {
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
    const body = readEventJsonBody(event, MAX_PROMO_PAYLOAD_BYTES);
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
      statusCode: error.status || 500,
      headers,
      body: JSON.stringify({ valid: false, error: [400, 413].includes(error.status) ? error.message : "No fue posible validar el código." })
    };
  }
};

export default boundedEventHandler(eventHandler, MAX_PROMO_PAYLOAD_BYTES);

export const config = {
  path: ["/api/validate-promo-code", "/.netlify/functions/validate-promo-code"],
  rateLimit: {
    windowLimit: 60,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
