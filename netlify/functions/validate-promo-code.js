const {
  calculateCertificationPricing,
  normalizePromoCode
} = require("./utils/promo-codes.cjs");

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

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
    const body = JSON.parse(event.body || "{}");
    const code = normalizePromoCode(body.code);

    if (!code) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ valid: false, error: "Ingresa un código promocional." })
      };
    }

    const pricing = calculateCertificationPricing({
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
