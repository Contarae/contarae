const {
  calculateCertificationPricingAsync,
  normalizePromoCode
} = require("./utils/promo-codes.cjs");
const { buildCorsHeaders } = require("./utils/cors.cjs");
const { assertNoHoneypot } = require("./utils/request-security.cjs");

const MAX_SIGNATURE_PAYLOAD_BYTES = 20 * 1024;

function normalizeCertificationReference(value = "") {
  return String(value || "").trim().toUpperCase();
}

function isValidCertificationReference(reference = "") {
  return /^CONTARAE-\d{10,}-[A-Z0-9]{5,10}$/.test(normalizeCertificationReference(reference));
}

exports.handler = async (event) => {
  const headers = buildCorsHeaders(event, {
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
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
    const contentLength = Number(event.headers?.["content-length"] || event.headers?.["Content-Length"] || 0);
    if (contentLength > MAX_SIGNATURE_PAYLOAD_BYTES) {
      return {
        statusCode: 413,
        headers,
        body: JSON.stringify({ error: "La solicitud supera el tamaño permitido." })
      };
    }

    const body = JSON.parse(event.body || "{}");
    assertNoHoneypot(body);
    const { reference, amountInCents, currency, monthlyIncome, promoCode } = body;
    const normalizedReference = normalizeCertificationReference(reference);
    const normalizedCurrency = String(currency || "").trim().toUpperCase();
    const requestedAmountInCents = Number(amountInCents || 0);
    const integrityKey = process.env.WOMPI_INTEGRITY_KEY;

    if (!isValidCertificationReference(normalizedReference)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Referencia de pago inválida." })
      };
    }

    if (normalizedCurrency !== "COP") {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Moneda no permitida." })
      };
    }

    if (!Number.isInteger(requestedAmountInCents) || requestedAmountInCents <= 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: "Valor de pago inválido." })
      };
    }

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
      .update(`${normalizedReference}${requestedAmountInCents}${normalizedCurrency}${integrityKey}`)
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

exports.config = {
  path: ["/api/wompi-signature", "/.netlify/functions/wompi-signature"],
  rateLimit: {
    windowLimit: 40,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
