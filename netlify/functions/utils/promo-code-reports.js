import { getStore } from "@netlify/blobs";
import promoUtils from "./promo-codes.cjs";

const {
  formatMoneyValue,
  normalizePromoCode,
  parseMoneyValue
} = promoUtils;

function isWompiApprovedCertification(record = {}) {
  const transaction = record.wompiTransaction || {};
  return (
    String(record.status || "").toLowerCase() === "approved" &&
    String(transaction.status || "").toUpperCase() === "APPROVED" &&
    Boolean(transaction.id)
  );
}

function getSalePromoCode(record = {}) {
  return normalizePromoCode(record.promoReferral?.code || record.formData?.codigo_promocional);
}

function getCustomerName(record = {}) {
  return String(record.certificateData?.nombre || record.formData?.nombre || "").trim();
}

function getApprovedAt(record = {}) {
  return record.approvedAt || record.wompiTransaction?.created_at || record.createdAt || "";
}

function getMonthKey(value = "") {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return "sin-fecha";
  return date.toISOString().slice(0, 7);
}

function parseLabeledMoney(...values) {
  for (const value of values) {
    const parsed = parseMoneyValue(value);
    if (parsed > 0) return parsed;
  }
  return 0;
}

function saleFromRecord(record = {}) {
  const referral = record.promoReferral || {};
  const formData = record.formData || {};
  const pricing = record.pricing || {};
  const baseAmount = Number(referral.baseAmount || pricing.baseAmount || 0) ||
    parseLabeledMoney(formData.tarifa_base);
  const discountAmount = Number(referral.discountAmount || pricing.discountAmount || 0) ||
    parseLabeledMoney(formData.descuento_promocional);
  const finalAmount = Number(referral.finalAmount || pricing.finalAmount || 0) ||
    parseLabeledMoney(formData.tarifa_pagada);
  const commissionAmount = Number(referral.commissionAmount || 0) ||
    parseLabeledMoney(formData.comision_aliado_estimada);

  return {
    reference: record.reference || "",
    consecutive: record.consecutive || "",
    customerName: getCustomerName(record),
    customerEmail: formData.correo || formData.email || record.wompiTransaction?.customer_email || "",
    destination: [formData.destino, formData.entidad].filter(Boolean).join(" · "),
    approvedAt: getApprovedAt(record),
    certificationStatus: record.certificationStatus || "",
    wompiTransactionId: record.wompiTransaction?.id || "",
    paymentMethod: record.wompiTransaction?.payment_method_type || "Wompi",
    baseAmount,
    baseAmountLabel: formatMoneyValue(baseAmount),
    discountAmount,
    discountAmountLabel: formatMoneyValue(discountAmount),
    finalAmount,
    finalAmountLabel: formatMoneyValue(finalAmount),
    commissionAmount,
    commissionAmountLabel: formatMoneyValue(commissionAmount)
  };
}

function buildTotals(sales = []) {
  const totals = sales.reduce((acc, sale) => ({
    salesCount: acc.salesCount + 1,
    baseAmount: acc.baseAmount + Number(sale.baseAmount || 0),
    discountAmount: acc.discountAmount + Number(sale.discountAmount || 0),
    finalAmount: acc.finalAmount + Number(sale.finalAmount || 0),
    commissionAmount: acc.commissionAmount + Number(sale.commissionAmount || 0)
  }), {
    salesCount: 0,
    baseAmount: 0,
    discountAmount: 0,
    finalAmount: 0,
    commissionAmount: 0
  });

  return {
    ...totals,
    baseAmountLabel: formatMoneyValue(totals.baseAmount),
    discountAmountLabel: formatMoneyValue(totals.discountAmount),
    finalAmountLabel: formatMoneyValue(totals.finalAmount),
    commissionAmountLabel: formatMoneyValue(totals.commissionAmount)
  };
}

function buildPeriods(sales = []) {
  const byMonth = new Map();

  sales.forEach((sale) => {
    const key = getMonthKey(sale.approvedAt);
    byMonth.set(key, [...(byMonth.get(key) || []), sale]);
  });

  return Array.from(byMonth.entries())
    .map(([period, periodSales]) => ({
      period,
      ...buildTotals(periodSales)
    }))
    .sort((left, right) => right.period.localeCompare(left.period));
}

export async function listWompiConfirmedPromoSales(code = "") {
  const normalizedCode = normalizePromoCode(code);
  const store = getStore("certification-requests");
  const list = await store.list({ prefix: "paid:" });
  const records = await Promise.all(
    (list.blobs || []).map(async ({ key }) => store.get(key, { type: "json" }))
  );

  return records
    .filter(Boolean)
    .filter(isWompiApprovedCertification)
    .filter((record) => {
      const saleCode = getSalePromoCode(record);
      if (!saleCode) return false;
      return normalizedCode ? saleCode === normalizedCode : true;
    })
    .map((record) => ({
      ...saleFromRecord(record),
      code: getSalePromoCode(record)
    }))
    .sort((left, right) => new Date(right.approvedAt || 0) - new Date(left.approvedAt || 0));
}

export async function buildPromoCodeSalesIndex() {
  const sales = await listWompiConfirmedPromoSales();
  const grouped = sales.reduce((acc, sale) => ({
    ...acc,
    [sale.code]: [...(acc[sale.code] || []), sale]
  }), {});

  return Object.fromEntries(
    Object.entries(grouped).map(([code, codeSales]) => [code, buildTotals(codeSales)])
  );
}

export async function buildPromoCodeReport(code = "") {
  const normalizedCode = normalizePromoCode(code);
  if (!normalizedCode) throw new Error("Falta el código promocional.");

  const sales = await listWompiConfirmedPromoSales(normalizedCode);
  return {
    code: normalizedCode,
    generatedAt: new Date().toISOString(),
    totals: buildTotals(sales),
    periods: buildPeriods(sales),
    sales
  };
}
