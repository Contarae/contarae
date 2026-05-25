import { getStore } from "@netlify/blobs";
import {
  getIssuedCertificateDownloadPath,
  getSupportDownloadPath
} from "./certification-supports.js";
import { authenticateAdminCredentials } from "./admin-auth.js";

const FINAL_FAILED_STATUSES = new Set([
  "declined",
  "error",
  "voided",
  "failed",
  "rejected",
  "canceled",
  "cancelled"
]);

export const CERTIFICATION_STATUSES = [
  "pago_no_confirmado",
  "en_revision",
  "documentos_solicitados",
  "enviada",
  "rechazada"
];

export const LOCKED_CERTIFICATION_STATUSES = new Set([
  "pago_no_confirmado",
  "enviada",
  "rechazada"
]);

export function isCertificationLockedStatus(status = "") {
  return LOCKED_CERTIFICATION_STATUSES.has(String(status || "").trim());
}

export function getCertificationStore() {
  return getStore("certification-requests");
}

function joinValues(values = []) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" - ");
}

function normalizePhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57") && digits.length >= 12) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

export function inferCertificationStatus(record = {}, source = "pending") {
  const paymentStatus = String(record.status || "").toLowerCase();

  if (FINAL_FAILED_STATUSES.has(paymentStatus)) return "pago_no_confirmado";
  if (record.certificationStatus) return record.certificationStatus;
  if (paymentStatus === "approved" || source === "paid") return "en_revision";

  return "en_revision";
}

const CERTIFICATE_EDITABLE_FIELDS = [
  "nombre",
  "tipo_documento",
  "numero_documento",
  "lugar_expedicion",
  "correo",
  "telefono",
  "destino",
  "entidad",
  "periodo",
  "ingresos_laborales",
  "pensiones",
  "dividendos",
  "inversiones",
  "arriendos",
  "remesas",
  "ingresos_independiente",
  "otros_ingresos",
  "otros_descripcion",
  "nota_aclaratoria_certificacion",
  "ingresos_eventuales_json",
  "periodo_meses",
  "total_ingresos",
  "total_ingresos_periodo",
  "total_ingresos_eventuales",
  "total_ingresos_global_periodo"
];

function parseEventualIncomeRows(value) {
  try {
    const parsed = JSON.parse(String(value || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        concept: String(row?.concept || "").trim(),
        value: String(row?.value || row?.amount || "").trim()
      }))
      .filter((row) => hasMeaningfulCurrencyValue(row.value) && row.concept);
  } catch {
    return [];
  }
}

function resolveCertifiedMonths(formData = {}) {
  const explicitMonths = Number(String(formData.periodo_meses || "").replace(/\D/g, "")) || 0;
  if (explicitMonths > 0) return explicitMonths;

  const normalized = String(formData.periodo || "").toLowerCase();
  if (normalized.includes("6")) return 6;
  if (normalized.includes("3")) return 3;
  if (normalized.includes("año") || normalized.includes("ano")) return 12;
  if (normalized.includes("mes")) return 1;
  return 0;
}

function computeCertificationTotals(formData = {}) {
  const monthlyTotal =
    parseCurrency(formData.ingresos_laborales) +
    parseCurrency(formData.pensiones) +
    parseCurrency(formData.dividendos) +
    parseCurrency(formData.inversiones) +
    parseCurrency(formData.arriendos) +
    parseCurrency(formData.remesas) +
    parseCurrency(formData.ingresos_independiente) +
    parseCurrency(formData.otros_ingresos);
  const certifiedMonths = resolveCertifiedMonths(formData);
  const recurringPeriodTotal = monthlyTotal * certifiedMonths;
  const eventualTotal = parseEventualIncomeRows(formData.ingresos_eventuales_json).reduce(
    (sum, row) => sum + parseCurrency(row.value),
    0
  );
  const globalPeriodTotal = recurringPeriodTotal + eventualTotal;

  return {
    monthlyTotal,
    certifiedMonths,
    recurringPeriodTotal,
    eventualTotal,
    globalPeriodTotal
  };
}

function parseCurrency(value) {
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
    if (dotParts.length > 2) {
      return Number(dotParts.join("")) || 0;
    }
    if (dotParts.length === 2 && dotParts[1].length === 3) {
      return Number(dotParts.join("")) || 0;
    }
  }

  return Number(normalized) || 0;
}

function hasMeaningfulCurrencyValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return parseCurrency(raw) > 0;
}

function formatCurrencyValue(value) {
  const amount = Number(value || 0);
  return amount > 0
    ? new Intl.NumberFormat("es-CO").format(amount).replace(/^/, "$ ")
    : "";
}

export function buildCertificateData(record = {}) {
  const formData = record.formData || {};
  const overrides = record.certificateOverrides || {};
  const merged = {};

  CERTIFICATE_EDITABLE_FIELDS.forEach((field) => {
    merged[field] =
      overrides[field] !== undefined && overrides[field] !== null
        ? String(overrides[field] || "")
        : String(formData[field] || "");
  });

  if (!merged.total_ingresos) {
    const totals = computeCertificationTotals(merged);
    merged.total_ingresos = formatCurrencyValue(totals.monthlyTotal) || String(formData.total_ingresos || "");
  }

  const totals = computeCertificationTotals(merged);

  if (!merged.total_ingresos_periodo) {
    merged.total_ingresos_periodo =
      formatCurrencyValue(totals.recurringPeriodTotal) || String(formData.total_ingresos_periodo || "");
  }

  if (totals.eventualTotal > 0) {
    if (!merged.total_ingresos_eventuales) {
      merged.total_ingresos_eventuales =
        formatCurrencyValue(totals.eventualTotal) || String(formData.total_ingresos_eventuales || "");
    }

    if (!merged.total_ingresos_global_periodo) {
      merged.total_ingresos_global_periodo =
        formatCurrencyValue(totals.globalPeriodTotal) || String(formData.total_ingresos_global_periodo || "");
    }
  } else {
    merged.total_ingresos_eventuales = "";
    merged.total_ingresos_global_periodo = "";
  }

  if (!merged.periodo_meses && totals.certifiedMonths) {
    merged.periodo_meses = String(totals.certifiedMonths);
  }

  return merged;
}

function buildIncomeItems(formData = {}) {
  const rows = [
    ["Ingresos laborales", formData.ingresos_laborales],
    ["Pensiones", formData.pensiones],
    ["Dividendos", formData.dividendos],
    ["Inversiones", formData.inversiones],
    ["Arriendos", formData.arriendos],
    ["Remesas", formData.remesas],
    ["Ingresos por actividad independiente", formData.ingresos_independiente],
    ["Otros ingresos mensuales recurrentes", formData.otros_ingresos]
  ]
    .filter(([, value]) => hasMeaningfulCurrencyValue(value))
    .map(([label, value]) => ({ label, value }));

  if (hasMeaningfulCurrencyValue(formData.otros_ingresos) && String(formData.otros_descripcion || "").trim()) {
    rows.push({
      label: "Detalle otros ingresos mensuales recurrentes",
      value: String(formData.otros_descripcion || "").trim()
    });
  }

  parseEventualIncomeRows(formData.ingresos_eventuales_json).forEach((row, index) => {
    rows.push({
      label: `Ingreso eventual ${index + 1}`,
      value: `${row.value} — ${row.concept}`
    });
  });

  return rows;
}

function getUpdatedAt(record = {}) {
  return (
    record.updatedAt ||
    record.lastReviewedAt ||
    record.requestedDocumentsAt ||
    record.sentToClientAt ||
    record.approvedAt ||
    record.createdAt ||
    record.lastEventAt ||
    ""
  );
}

function summarizeRecord(record, source) {
  const formData = record.formData || {};
  const supportFiles = Array.isArray(record.supportFiles) ? record.supportFiles : [];
  const hasEventuals = Boolean(String(formData.total_ingresos_eventuales || "").trim());

  return {
    reference: record.reference,
    source,
    paymentStatus: String(record.status || "").toLowerCase() || (source === "paid" ? "approved" : "pending"),
    certificationStatus: inferCertificationStatus(record, source),
    customerName: formData.nombre || "",
    customerEmail:
      formData.correo ||
      formData.email ||
      record.wompiTransaction?.customer_email ||
      "",
    customerPhone: formData.telefono || "",
    destination: joinValues([formData.destino, formData.entidad]),
    period: formData.periodo || "",
    totalIncome: formData.total_ingresos || "",
    recurringPeriodTotal: formData.total_ingresos_periodo || "",
    eventualIncomeTotal: hasEventuals ? formData.total_ingresos_eventuales || "" : "",
    globalPeriodIncomeTotal: hasEventuals ? formData.total_ingresos_global_periodo || "" : "",
    baseFee: formData.tarifa_base || "",
    promoCode: formData.codigo_promocional || "",
    promoAllyName: formData.aliado_estrategico || "",
    promoDiscount: formData.descuento_promocional || "",
    promoCommissionEstimate: formData.comision_aliado_estimada || "",
    fee: formData.tarifa_pagada || "",
    consecutive: record.consecutive || "",
    certificateVersion: Number(record.certificateVersion || 0) || null,
    certificateVerificationCode: record.certificateVerificationCode || "",
    issuedCertificates: Array.isArray(record.issuedCertificates) ? record.issuedCertificates : [],
    certificateIssuedAt: record.certificateIssuedAt || "",
    supportFilesCount: supportFiles.length,
    createdAt: record.createdAt || "",
    approvedAt: record.approvedAt || "",
    updatedAt: getUpdatedAt(record),
    lastEventStatus: record.lastEventStatus || "",
    netlifySubmittedAt: record.netlifySubmittedAt || "",
    businessNotificationSentAt: record.businessNotificationSentAt || "",
    customerNotificationSentAt: record.customerNotificationSentAt || "",
    allyNotificationSentAt: record.allyNotificationSentAt || ""
  };
}

function buildIssuedCertificateHistory(record = {}) {
  const certificates = Array.isArray(record.issuedCertificates)
    ? record.issuedCertificates
    : [];

  return certificates
    .filter((certificate) => certificate && typeof certificate === "object")
    .map((certificate) => ({
      ...certificate,
      downloadPath: certificate.blobKey
        ? getIssuedCertificateDownloadPath(record.reference, certificate.blobKey)
        : ""
    }))
    .sort((left, right) => Number(right.version || 0) - Number(left.version || 0));
}

function buildDetail(record, source) {
  const formData = record.formData || {};
  const certificateData = buildCertificateData(record);
  const normalizedPhone = normalizePhone(certificateData.telefono || formData.telefono);
  const customerEmail =
    certificateData.correo ||
    formData.correo ||
    formData.email ||
    record.wompiTransaction?.customer_email ||
    "";
  const supportFiles = Array.isArray(record.supportFiles) ? record.supportFiles : [];

  return {
    summary: summarizeRecord(record, source),
    source,
    record,
    formData,
    certificateData,
    incomes: buildIncomeItems(formData),
    supportFiles: supportFiles.map((file) => ({
      ...file,
      downloadPath: getSupportDownloadPath(record.reference, file.blobKey)
    })),
    issuedCertificates: buildIssuedCertificateHistory(record),
    contact: {
      email: customerEmail,
      rawPhone: certificateData.telefono || formData.telefono || "",
      whatsappPhone: normalizedPhone
    },
    totals: {
      monthlyRecurring: certificateData.total_ingresos || "",
      recurringPeriod: certificateData.total_ingresos_periodo || "",
      eventualPeriod: certificateData.total_ingresos_eventuales || "",
      globalPeriod: certificateData.total_ingresos_global_periodo || "",
      periodMonths: certificateData.periodo_meses || ""
    },
    certificateSecurity: {
      version: Number(record.certificateVersion || 0) || null,
      verificationCode: record.certificateVerificationCode || "",
      verificationUrl: record.certificateVerificationUrl || "",
      hash: record.certificateHash || ""
    }
  };
}

function buildMutationResult({
  store,
  source,
  paidRecord,
  pendingRecord,
  record
}) {
  return {
    store,
    source,
    record,
    paidRecord,
    pendingRecord,
    detail: record ? buildDetail(record, source) : null
  };
}

export async function getCertificationByReference(reference) {
  const store = getCertificationStore();
  const paidRecord = await store.get(`paid:${reference}`, { type: "json" });
  const pendingRecord = await store.get(`pending:${reference}`, { type: "json" });
  const source = paidRecord ? "paid" : pendingRecord ? "pending" : "";
  const record = paidRecord || pendingRecord || null;

  return {
    store,
    source,
    record,
    paidRecord,
    pendingRecord,
    detail: record ? buildDetail(record, source) : null
  };
}

export async function listAllCertifications() {
  const store = getCertificationStore();
  const [paidList, pendingList] = await Promise.all([
    store.list({ prefix: "paid:" }),
    store.list({ prefix: "pending:" })
  ]);

  const entries = new Map();
  const shouldIncludePendingRecord = (record = {}) => {
    const paymentStatus = String(record.status || "").toLowerCase();
    const lastEventStatus = String(record.lastEventStatus || "").toLowerCase();
    const explicitCertificationStatus = String(record.certificationStatus || "").trim();

    if (paymentStatus === "approved") return true;
    if (FINAL_FAILED_STATUSES.has(paymentStatus)) return true;
    if (FINAL_FAILED_STATUSES.has(lastEventStatus)) return true;
    if (
      explicitCertificationStatus &&
      explicitCertificationStatus !== "en_revision"
    ) {
      return true;
    }

    return false;
  };

  const paidRecords = await Promise.all(
    (paidList.blobs || []).map(async ({ key }) => {
      const record = await store.get(key, { type: "json" });
      return record ? summarizeRecord(record, "paid") : null;
    })
  );

  paidRecords.filter(Boolean).forEach((item) => {
    entries.set(item.reference, item);
  });

  const pendingRecords = await Promise.all(
    (pendingList.blobs || []).map(async ({ key }) => {
      const record = await store.get(key, { type: "json" });
      if (!record || !shouldIncludePendingRecord(record)) return null;
      return summarizeRecord(record, "pending");
    })
  );

  pendingRecords.filter(Boolean).forEach((item) => {
    if (!entries.has(item.reference)) {
      entries.set(item.reference, item);
    }
  });

  return Array.from(entries.values()).sort((left, right) => {
    return new Date(left.createdAt || left.approvedAt || left.updatedAt || 0) -
      new Date(right.createdAt || right.approvedAt || right.updatedAt || 0);
  });
}

export async function updateCertificationRecord(reference, updates = {}, actor = "admin") {
  const store = getCertificationStore();
  const { paidRecord, pendingRecord, record } = await getCertificationByReference(reference);

  if (!record) {
    throw new Error("Solicitud no encontrada");
  }

  const currentCertificationStatus = inferCertificationStatus(
    record,
    paidRecord ? "paid" : "pending"
  );

  if (isCertificationLockedStatus(currentCertificationStatus)) {
    const overridePassword = String(updates.overridePassword || "");
    const auth = authenticateAdminCredentials(actor, overridePassword);
    if (!auth.ok) {
      throw new Error("Este expediente está bloqueado. Ingresa nuevamente la contraseña para habilitar su edición.");
    }
  }

  const now = new Date().toISOString();
  const nextCertificationStatus =
    updates.certificationStatus ||
    inferCertificationStatus(
      {
        ...record,
        certificationStatus: record.certificationStatus
      },
      paidRecord ? "paid" : "pending"
    );

  const sharedUpdates = {
    certificationStatus: nextCertificationStatus,
    adminNotes:
      updates.adminNotes !== undefined
        ? String(updates.adminNotes || "")
        : String(record.adminNotes || ""),
    requestedDocumentsMessage:
      updates.requestedDocumentsMessage !== undefined
        ? String(updates.requestedDocumentsMessage || "")
        : String(record.requestedDocumentsMessage || ""),
    certificateAdjustmentNote:
      updates.certificateAdjustmentNote !== undefined
        ? String(updates.certificateAdjustmentNote || "")
        : String(record.certificateAdjustmentNote || ""),
    certificateOverrides:
      updates.certificateOverrides !== undefined
        ? { ...(updates.certificateOverrides || {}) }
        : { ...(record.certificateOverrides || {}) },
    updatedAt: now,
    lastReviewedAt: now,
    lastReviewedBy: actor,
    reviewAction: updates.action || record.reviewAction || ""
  };

  if (updates.action === "request_documents") {
    sharedUpdates.certificationStatus = updates.certificationStatus || "documentos_solicitados";
    sharedUpdates.requestedDocumentsAt = now;
    sharedUpdates.lastContactChannel = updates.contactChannel || record.lastContactChannel || "";
  }

  if (sharedUpdates.certificationStatus === "enviada" && !record.sentToClientAt) {
    sharedUpdates.sentToClientAt = now;
  }

  const updatedPaidRecord = paidRecord ? { ...paidRecord, ...sharedUpdates } : null;
  const updatedPendingRecord = pendingRecord ? { ...pendingRecord, ...sharedUpdates } : null;

  if (updatedPaidRecord) {
    await store.setJSON(`paid:${reference}`, updatedPaidRecord);
  }

  if (updatedPendingRecord) {
    await store.setJSON(`pending:${reference}`, updatedPendingRecord);
  }

  return buildMutationResult({
    store,
    source: updatedPaidRecord ? "paid" : "pending",
    paidRecord: updatedPaidRecord,
    pendingRecord: updatedPendingRecord,
    record: updatedPaidRecord || updatedPendingRecord
  });
}

export async function appendSupportFilesToCertification(reference, supportFiles = [], actor = "admin", options = {}) {
  const store = getCertificationStore();
  const { paidRecord, pendingRecord, record } = await getCertificationByReference(reference);

  if (!record) {
    throw new Error("Solicitud no encontrada");
  }

  const currentCertificationStatus = inferCertificationStatus(
    record,
    paidRecord ? "paid" : "pending"
  );

  if (isCertificationLockedStatus(currentCertificationStatus)) {
    const overridePassword = String(options.overridePassword || "");
    const auth = authenticateAdminCredentials(actor, overridePassword);
    if (!auth.ok) {
      throw new Error("Este expediente está bloqueado. Ingresa nuevamente la contraseña para cargar nuevos soportes.");
    }
  }

  const existingSupportFiles = Array.isArray(record.supportFiles) ? record.supportFiles : [];
  const mergedSupportFiles = [...existingSupportFiles];

  supportFiles.forEach((file) => {
    if (!file?.blobKey) return;
    if (mergedSupportFiles.some((current) => current.blobKey === file.blobKey)) return;
    mergedSupportFiles.push(file);
  });

  const now = new Date().toISOString();
  const sharedUpdates = {
    supportFiles: mergedSupportFiles,
    certificationStatus:
      record.certificationStatus === "documentos_solicitados"
        ? "en_revision"
        : inferCertificationStatus(record, paidRecord ? "paid" : "pending"),
    updatedAt: now,
    lastReviewedAt: now,
    lastReviewedBy: actor
  };

  const updatedPaidRecord = paidRecord ? { ...paidRecord, ...sharedUpdates } : null;
  const updatedPendingRecord = pendingRecord ? { ...pendingRecord, ...sharedUpdates } : null;

  if (updatedPaidRecord) {
    await store.setJSON(`paid:${reference}`, updatedPaidRecord);
  }

  if (updatedPendingRecord) {
    await store.setJSON(`pending:${reference}`, updatedPendingRecord);
  }

  return buildMutationResult({
    store,
    source: updatedPaidRecord ? "paid" : "pending",
    paidRecord: updatedPaidRecord,
    pendingRecord: updatedPendingRecord,
    record: updatedPaidRecord || updatedPendingRecord
  });
}

export async function mergeCertificationRecordUpdates(reference, sharedUpdates = {}) {
  const store = getCertificationStore();
  const { paidRecord, pendingRecord, record } = await getCertificationByReference(reference);

  if (!record) {
    throw new Error("Solicitud no encontrada");
  }

  const updatedPaidRecord = paidRecord ? { ...paidRecord, ...sharedUpdates } : null;
  const updatedPendingRecord = pendingRecord ? { ...pendingRecord, ...sharedUpdates } : null;

  if (updatedPaidRecord) {
    await store.setJSON(`paid:${reference}`, updatedPaidRecord);
  }

  if (updatedPendingRecord) {
    await store.setJSON(`pending:${reference}`, updatedPendingRecord);
  }

  return buildMutationResult({
    store,
    source: updatedPaidRecord ? "paid" : "pending",
    paidRecord: updatedPaidRecord,
    pendingRecord: updatedPendingRecord,
    record: updatedPaidRecord || updatedPendingRecord
  });
}
