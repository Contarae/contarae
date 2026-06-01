const COP_FORMATTER = new Intl.NumberFormat("es-CO");
const crypto = require("crypto");
const { getStore } = require("@netlify/blobs");

const PROMO_CODE_STORE_NAME = "promo-codes";
const PROMO_CODE_PREFIX = "code:";

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

function cleanText(value) {
  return String(value || "").trim();
}

function randomId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function promoStore() {
  return getStore(PROMO_CODE_STORE_NAME);
}

function isMissingBlobsEnvironmentError(error) {
  return String(error?.name || "") === "MissingBlobsEnvironmentError" ||
    String(error?.message || "").includes("environment has not been configured to use Netlify Blobs");
}

function createPromoStorageUnavailableError(error) {
  const storageError = new Error(
    "El almacenamiento de códigos promocionales no está disponible. Revisa la configuración de Netlify Blobs del sitio antes de crear o editar códigos."
  );
  storageError.code = "PROMO_STORAGE_UNAVAILABLE";
  storageError.cause = error;
  return storageError;
}

function getPromoCodeKey(code) {
  return `${PROMO_CODE_PREFIX}${encodeURIComponent(normalizePromoCode(code))}`;
}

function normalizeRate(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  if (numeric > 1) return Math.max(0, Math.min(numeric / 100, 1));
  return Math.max(0, Math.min(numeric, 1));
}

function formatRateLabel(value) {
  const rate = normalizeRate(value);
  return `${Math.round(rate * 100)}%`;
}

function normalizeDateValue(value = "") {
  const raw = cleanText(value);
  if (!raw) return "";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "" : raw;
}

function isPromoCurrentlyUsable(promo = {}, now = new Date()) {
  if (!promo || typeof promo !== "object") return false;
  if (promo.active !== true) return false;
  if (!normalizePromoCode(promo.code)) return false;
  if (!cleanText(promo.allyName)) return false;
  if (!normalizeEmail(promo.allyEmail)) return false;

  if (promo.startsAt) {
    const startsAt = new Date(promo.startsAt);
    if (!Number.isNaN(startsAt.getTime()) && startsAt > now) return false;
  }

  if (promo.expiresAt) {
    const expiresAt = new Date(promo.expiresAt);
    if (!Number.isNaN(expiresAt.getTime()) && expiresAt < now) return false;
  }

  const maxUses = Number(promo.maxUses || 0);
  const usesCount = Number(promo.usesCount || 0);
  if (maxUses > 0 && usesCount >= maxUses) return false;

  return true;
}

function normalizeStoredPromoCode(input = {}, existing = {}, actor = "admin") {
  const now = new Date().toISOString();
  const code = normalizePromoCode(input.code ?? existing.code);
  if (!code) throw new Error("Ingresa el código promocional.");

  const allyName = cleanText(input.allyName ?? existing.allyName);
  const allyEmail = normalizeEmail(input.allyEmail ?? existing.allyEmail);
  if (!allyName) throw new Error("Ingresa el nombre del aliado.");
  if (!allyEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(allyEmail)) {
    throw new Error("Ingresa un correo válido para el aliado.");
  }

  const discountRate = normalizeRate(input.discountRate ?? existing.discountRate, 0.15);
  const commissionRate = normalizeRate(input.commissionRate ?? existing.commissionRate, 0.1);
  const maxUses = Math.max(0, Math.round(Number(input.maxUses ?? existing.maxUses ?? 0) || 0));
  const usesCount = Math.max(0, Math.round(Number(existing.usesCount || 0) || 0));
  const startsAt = normalizeDateValue(input.startsAt ?? existing.startsAt);
  const expiresAt = normalizeDateValue(input.expiresAt ?? existing.expiresAt);

  if (startsAt && expiresAt && new Date(startsAt) > new Date(expiresAt)) {
    throw new Error("La fecha de inicio no puede ser posterior al vencimiento.");
  }

  return {
    id: existing.id || input.id || `PROMO-${randomId().replace(/-/g, "").slice(0, 10).toUpperCase()}`,
    code,
    allyName,
    allyEmail,
    discountRate,
    discountRateLabel: formatRateLabel(discountRate),
    commissionRate,
    commissionRateLabel: formatRateLabel(commissionRate),
    active: input.active === undefined ? existing.active !== false : Boolean(input.active),
    startsAt,
    expiresAt,
    maxUses,
    usesCount,
    notes: cleanText(input.notes ?? existing.notes),
    source: "blob",
    createdAt: existing.createdAt || now,
    createdBy: existing.createdBy || actor,
    updatedAt: now,
    updatedBy: actor,
    auditTrail: [
      ...(Array.isArray(existing.auditTrail) ? existing.auditTrail : []),
      {
        id: randomId(),
        action: existing.id ? "updated" : "created",
        at: now,
        by: actor
      }
    ]
  };
}

function normalizeLegacyPromoCode(item = {}) {
  const discountRate = normalizeRate(item.discountRate, 0.15);
  const commissionRate = normalizeRate(item.commissionRate, 0.1);
  return {
    ...item,
    code: normalizePromoCode(item.code),
    allyName: cleanText(item.allyName),
    allyEmail: normalizeEmail(item.allyEmail),
    discountRate,
    discountRateLabel: formatRateLabel(discountRate),
    commissionRate,
    commissionRateLabel: formatRateLabel(commissionRate),
    active: item.active === true,
    startsAt: "",
    expiresAt: "",
    maxUses: 0,
    usesCount: 0,
    notes: "",
    source: "legacy"
  };
}

function findLegacyPromoCode(code) {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;
  return STRATEGIC_ALLY_PROMO_CODES
    .map(normalizeLegacyPromoCode)
    .find((record) => normalizePromoCode(record.code) === normalized) || null;
}

function hydratePromoRecord(record = {}) {
  const discountRate = normalizeRate(record.discountRate, 0.15);
  const commissionRate = normalizeRate(record.commissionRate, 0.1);
  return {
    ...record,
    code: normalizePromoCode(record.code),
    allyName: cleanText(record.allyName),
    allyEmail: normalizeEmail(record.allyEmail),
    discountRate,
    discountRateLabel: formatRateLabel(discountRate),
    commissionRate,
    commissionRateLabel: formatRateLabel(commissionRate),
    active: record.active === true,
    startsAt: normalizeDateValue(record.startsAt),
    expiresAt: normalizeDateValue(record.expiresAt),
    maxUses: Math.max(0, Math.round(Number(record.maxUses || 0) || 0)),
    usesCount: Math.max(0, Math.round(Number(record.usesCount || 0) || 0)),
    notes: cleanText(record.notes),
    source: "blob",
    auditTrail: Array.isArray(record.auditTrail) ? record.auditTrail : []
  };
}

async function listStoredPromoCodes() {
  let records = [];
  let storageAvailable = true;

  try {
    const store = promoStore();
    const list = await store.list({ prefix: PROMO_CODE_PREFIX });
    records = await Promise.all(
      (list.blobs || []).map(async ({ key }) => store.get(key, { type: "json" }))
    );
  } catch (error) {
    if (!isMissingBlobsEnvironmentError(error)) throw error;
    storageAvailable = false;
  }

  return {
    records: records
      .filter(Boolean)
      .map(hydratePromoRecord),
    storageAvailable
  };
}

async function listPromoCodes({ includeLegacy = true } = {}) {
  const entries = new Map();
  const stored = await listStoredPromoCodes();

  stored.records.forEach((record) => {
    entries.set(normalizePromoCode(record.code), record);
  });

  if (includeLegacy) {
    STRATEGIC_ALLY_PROMO_CODES
      .map(normalizeLegacyPromoCode)
      .filter((record) => normalizePromoCode(record.code))
      .forEach((record) => {
        if (!entries.has(normalizePromoCode(record.code))) {
          entries.set(normalizePromoCode(record.code), record);
        }
      });
  }

  return {
    records: Array.from(entries.values()).sort((left, right) => {
      if (left.active !== right.active) return left.active ? -1 : 1;
      return normalizePromoCode(left.code).localeCompare(normalizePromoCode(right.code));
    }),
    storageAvailable: stored.storageAvailable
  };
}

async function getPromoCodeByCode(code, { includeLegacy = true } = {}) {
  const normalized = normalizePromoCode(code);
  if (!normalized) return null;

  let stored = null;

  try {
    const store = promoStore();
    stored = await store.get(getPromoCodeKey(normalized), { type: "json" });
  } catch (error) {
    if (!isMissingBlobsEnvironmentError(error)) throw error;
  }

  if (stored) return hydratePromoRecord(stored);

  if (!includeLegacy) return null;
  return findLegacyPromoCode(normalized);
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
  if (amount <= 2000000) return 80000;
  if (amount <= 5000000) return 95000;
  if (amount <= 8000000) return 110000;
  if (amount <= 12000000) return 125000;
  if (amount <= 18000000) return 140000;
  return 155000;
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

async function getActivePromoCodeAsync(inputCode) {
  const promo = await getPromoCodeByCode(inputCode);
  return isPromoCurrentlyUsable(promo) ? promo : null;
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

async function calculateCertificationPricingAsync({ monthlyIncome, promoCode } = {}) {
  const monthlyAmount = typeof monthlyIncome === "number" ? monthlyIncome : parseMoneyValue(monthlyIncome);
  const baseAmount = getCertificationPriceByMonthlyIncome(monthlyAmount);
  const promo = await getActivePromoCodeAsync(promoCode);
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
    promoAllyName: promo ? cleanText(promo.allyName) : "",
    promoAllyEmail: promo ? normalizeEmail(promo.allyEmail) : "",
    discountRate,
    discountRateLabel: promo ? formatRateLabel(discountRate) : "",
    discountAmount,
    discountAmountLabel: promo ? formatMoneyValue(discountAmount) : "",
    finalAmount,
    finalAmountLabel: formatMoneyValue(finalAmount),
    commissionRate,
    commissionRateLabel: promo ? formatRateLabel(commissionRate) : "",
    commissionAmount,
    commissionAmountLabel: promo ? formatMoneyValue(commissionAmount) : ""
  };
}

async function upsertPromoCode(input = {}, actor = "admin") {
  const originalCode = normalizePromoCode(input.originalCode || input.previousCode || input.code);
  const nextCode = normalizePromoCode(input.code);
  let store;
  let existingByOriginal = null;
  let existingByNext = null;

  try {
    store = promoStore();
    existingByOriginal = originalCode
      ? await store.get(getPromoCodeKey(originalCode), { type: "json" })
      : null;
    existingByNext = nextCode
      ? await store.get(getPromoCodeKey(nextCode), { type: "json" })
      : null;
  } catch (error) {
    if (!isMissingBlobsEnvironmentError(error)) throw error;
    throw createPromoStorageUnavailableError(error);
  }

  const legacyByOriginal = findLegacyPromoCode(originalCode);
  const legacyByNext = findLegacyPromoCode(nextCode);

  if (legacyByOriginal && originalCode !== nextCode) {
    throw new Error("Los códigos promocionales heredados solo pueden editarse conservando el mismo código.");
  }

  if (legacyByNext && !legacyByOriginal) {
    throw new Error("Ya existe un código promocional con ese nombre.");
  }

  if (
    existingByNext &&
    existingByOriginal &&
    existingByNext.id &&
    existingByOriginal.id &&
    existingByNext.id !== existingByOriginal.id
  ) {
    throw new Error("Ya existe un código promocional con ese nombre.");
  }

  if (existingByNext && !existingByOriginal && input.id && existingByNext.id !== input.id) {
    throw new Error("Ya existe un código promocional con ese nombre.");
  }

  const promo = normalizeStoredPromoCode(input, existingByOriginal || existingByNext || {}, actor);
  try {
    await store.setJSON(getPromoCodeKey(promo.code), promo);

    if (originalCode && originalCode !== promo.code) {
      await store.delete(getPromoCodeKey(originalCode));
    }
  } catch (error) {
    if (!isMissingBlobsEnvironmentError(error)) throw error;
    throw createPromoStorageUnavailableError(error);
  }

  return promo;
}

async function updatePromoCodeStatus(code, active, actor = "admin") {
  const normalized = normalizePromoCode(code);
  let existing = null;

  try {
    const store = promoStore();
    existing = normalized ? await store.get(getPromoCodeKey(normalized), { type: "json" }) : null;
  } catch (error) {
    if (!isMissingBlobsEnvironmentError(error)) throw error;
    throw createPromoStorageUnavailableError(error);
  }

  if (!existing) throw new Error("El código promocional no existe en el administrador.");
  const hydrated = hydratePromoRecord(existing);
  return upsertPromoCode({ ...hydrated, originalCode: hydrated.code, active }, actor);
}

async function registerPromoCodeUse(code, { reference = "", actor = "system" } = {}) {
  const existing = await getPromoCodeByCode(code, { includeLegacy: false });
  if (!existing) return null;

  const now = new Date().toISOString();
  const previousReferences = Array.isArray(existing.useReferences) ? existing.useReferences : [];
  if (reference && previousReferences.includes(reference)) return existing;

  const nextRecord = {
    ...existing,
    usesCount: Math.max(0, Number(existing.usesCount || 0)) + 1,
    useReferences: reference ? [...previousReferences, reference] : previousReferences,
    updatedAt: now,
    updatedBy: actor,
    auditTrail: [
      ...(Array.isArray(existing.auditTrail) ? existing.auditTrail : []),
      {
        id: randomId(),
        action: "used",
        at: now,
        by: actor,
        reference
      }
    ]
  };

  try {
    const store = promoStore();
    await store.setJSON(getPromoCodeKey(nextRecord.code), nextRecord);
  } catch (error) {
    if (!isMissingBlobsEnvironmentError(error)) throw error;
    return existing;
  }
  return nextRecord;
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
  getActivePromoCodeAsync,
  calculateCertificationPricing,
  calculateCertificationPricingAsync,
  listPromoCodes,
  getPromoCodeByCode,
  upsertPromoCode,
  updatePromoCodeStatus,
  registerPromoCodeUse,
  isMissingBlobsEnvironmentError,
  buildReferralSnapshot
};
