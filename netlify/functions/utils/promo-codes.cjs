const COP_FORMATTER = new Intl.NumberFormat("es-CO");

const STRATEGIC_ALLY_PROMO_CODES = [
  { id: "ALIADO_01", code: "EMBAJADA2026", allyName: "ANGGIE RAMIREZ", allyEmail: "conta.diegovera@gmail.com", discountRate: 0.15, commissionRate: 0.20, active: true },
  { id: "ALIADO_02", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_03", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_04", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_05", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_06", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_07", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_08", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_09", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_10", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_11", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_12", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_13", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_14", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_15", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_16", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_17", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_18", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_19", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_20", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_21", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_22", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_23", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_24", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_25", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_26", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_27", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_28", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_29", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false },
  { id: "ALIADO_30", code: "", allyName: "", allyEmail: "", discountRate: 0.15, commissionRate: 0.1, active: false }
];

function normalizePromoCode(value) {
  return String(value || "").trim().toUpperCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function parseMoneyValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;

  const normalized = raw.replace(/\$/g, "").replace(/\s+/g, "").replace(/[^\d,.-]/g, "");
  if (!normalized) return 0;

  if (normalized.includes(",") && normalized.includes(".")) {
    return Number(normalized.replace(/\./g, "").replace(",", ".")) || 0;
  }

  if (normalized.includes(",")) {
    const commaParts = normalized.split(",");
    if (commaParts.length === 2 && commaParts[1].length <= 2) {
      return Number(normalized.replace(/\./g, "").replace(",", ".")) || 0;
    }
    return Number(normalized.replace(/,/g, "")) || 0;
  }

  if (normalized.includes(".")) {
    const dotParts = normalized.split(".");
    if (dotParts.length > 2) return Number(dotParts.join("")) || 0;
    if (dotParts.length === 2 && dotParts[1].length === 3) return Number(dotParts.join("")) || 0;
  }

  return Number(normalized) || 0;
}

function formatMoneyValue(value) {
  const amount = Math.max(0, Math.round(Number(value || 0)));
  return `$ ${COP_FORMATTER.format(amount)}`;
}

function getCertificationPriceByMonthlyIncome(monthlyIncome) {
  const amount = Math.max(0, Math.round(Number(monthlyIncome || 0)));
  if (amount <= 2000000) return 100000;
  if (amount <= 4000000) return 120000;
  if (amount <= 6000000) return 140000;
  if (amount <= 8000000) return 160000;
  if (amount <= 10000000) return 180000;
  return 200000;
}

function getActivePromoCode(inputCode) {
  const normalized = normalizePromoCode(inputCode);
  if (!normalized) return null;

  return (
    STRATEGIC_ALLY_PROMO_CODES.find((item) => {
      const itemCode = normalizePromoCode(item.code);
      return (
        item.active === true &&
        itemCode &&
        itemCode === normalized &&
        String(item.allyName || "").trim() &&
        normalizeEmail(item.allyEmail)
      );
    }) || null
  );
}

function calculateCertificationPricing({ monthlyIncome, promoCode } = {}) {
  const monthlyAmount = typeof monthlyIncome === "number" ? monthlyIncome : parseMoneyValue(monthlyIncome);
  const baseAmount = getCertificationPriceByMonthlyIncome(monthlyAmount);
  const promo = getActivePromoCode(promoCode);
  const discountRate = promo ? Number(promo.discountRate || 0) : 0;
  const commissionRate = promo ? Number(promo.commissionRate || 0) : 0;
  const discountAmount = promo ? Math.round(baseAmount * discountRate) : 0;
  const finalAmount = Math.max(0, baseAmount - discountAmount);
  const commissionAmount = promo ? Math.round(finalAmount * commissionRate) : 0;

  return {
    monthlyIncome: monthlyAmount,
    baseAmount,
    baseAmountLabel: formatMoneyValue(baseAmount),
    promoApplied: Boolean(promo),
    promoCode: promo ? normalizePromoCode(promo.code) : "",
    promoAllyName: promo ? String(promo.allyName || "").trim() : "",
    promoAllyEmail: promo ? normalizeEmail(promo.allyEmail) : "",
    discountRate,
    discountRateLabel: promo ? `${Math.round(discountRate * 100)}%` : "",
    discountAmount,
    discountAmountLabel: promo ? formatMoneyValue(discountAmount) : "",
    finalAmount,
    finalAmountLabel: formatMoneyValue(finalAmount),
    commissionRate,
    commissionRateLabel: promo ? `${Math.round(commissionRate * 100)}%` : "",
    commissionAmount,
    commissionAmountLabel: promo ? formatMoneyValue(commissionAmount) : ""
  };
}

function buildReferralSnapshot(pricing) {
  if (!pricing?.promoApplied) return null;

  return {
    code: pricing.promoCode,
    allyName: pricing.promoAllyName,
    allyEmail: pricing.promoAllyEmail,
    discountRate: pricing.discountRate,
    discountRateLabel: pricing.discountRateLabel,
    discountAmount: pricing.discountAmount,
    discountAmountLabel: pricing.discountAmountLabel,
    baseAmount: pricing.baseAmount,
    baseAmountLabel: pricing.baseAmountLabel,
    finalAmount: pricing.finalAmount,
    finalAmountLabel: pricing.finalAmountLabel,
    commissionRate: pricing.commissionRate,
    commissionRateLabel: pricing.commissionRateLabel,
    commissionAmount: pricing.commissionAmount,
    commissionAmountLabel: pricing.commissionAmountLabel
  };
}

module.exports = {
  STRATEGIC_ALLY_PROMO_CODES,
  normalizePromoCode,
  parseMoneyValue,
  formatMoneyValue,
  getCertificationPriceByMonthlyIncome,
  getActivePromoCode,
  calculateCertificationPricing,
  buildReferralSnapshot
};
