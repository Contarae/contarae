import { getStore } from "@netlify/blobs";
import { getSupportDownloadPath } from "./certification-supports.js";
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
  "destino",
  "entidad",
  "periodo",
  "ingresos_laborales",
  "pensiones",
  "dividendos",
  "inversiones",
  "arriendos",
  "remesas",
  "otros_ingresos",
  "otros_descripcion",
  "total_ingresos"
];

function parseCurrency(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
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
    const computedTotal =
      parseCurrency(merged.ingresos_laborales) +
      parseCurrency(merged.pensiones) +
      parseCurrency(merged.dividendos) +
      parseCurrency(merged.inversiones) +
      parseCurrency(merged.arriendos) +
      parseCurrency(merged.remesas) +
      parseCurrency(merged.otros_ingresos);

    merged.total_ingresos = formatCurrencyValue(computedTotal) || String(formData.total_ingresos || "");
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
    ["Otros ingresos", formData.otros_ingresos]
  ]
    .filter(([, value]) => hasMeaningfulCurrencyValue(value))
    .map(([label, value]) => ({ label, value }));

  if (hasMeaningfulCurrencyValue(formData.otros_ingresos) && String(formData.otros_descripcion || "").trim()) {
    rows.push({
      label: "Descripción otros ingresos",
      value: String(formData.otros_descripcion || "").trim()
    });
  }

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
    fee: formData.tarifa_pagada || "",
    consecutive: record.consecutive || "",
    supportFilesCount: supportFiles.length,
    createdAt: record.createdAt || "",
    approvedAt: record.approvedAt || "",
    updatedAt: getUpdatedAt(record),
    lastEventStatus: record.lastEventStatus || "",
    netlifySubmittedAt: record.netlifySubmittedAt || "",
    businessNotificationSentAt: record.businessNotificationSentAt || "",
    customerNotificationSentAt: record.customerNotificationSentAt || ""
  };
}

function buildDetail(record, source) {
  const formData = record.formData || {};
  const certificateData = buildCertificateData(record);
  const normalizedPhone = normalizePhone(formData.telefono);
  const customerEmail =
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
    contact: {
      email: customerEmail,
      rawPhone: formData.telefono || "",
      whatsappPhone: normalizedPhone
    }
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
      return record ? summarizeRecord(record, "pending") : null;
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

  if (paidRecord) {
    await store.setJSON(`paid:${reference}`, {
      ...paidRecord,
      ...sharedUpdates
    });
  }

  if (pendingRecord) {
    await store.setJSON(`pending:${reference}`, {
      ...pendingRecord,
      ...sharedUpdates
    });
  }

  return getCertificationByReference(reference);
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

  if (paidRecord) {
    await store.setJSON(`paid:${reference}`, {
      ...paidRecord,
      ...sharedUpdates
    });
  }

  if (pendingRecord) {
    await store.setJSON(`pending:${reference}`, {
      ...pendingRecord,
      ...sharedUpdates
    });
  }

  return getCertificationByReference(reference);
}

export async function mergeCertificationRecordUpdates(reference, sharedUpdates = {}) {
  const store = getCertificationStore();
  const { paidRecord, pendingRecord, record } = await getCertificationByReference(reference);

  if (!record) {
    throw new Error("Solicitud no encontrada");
  }

  if (paidRecord) {
    await store.setJSON(`paid:${reference}`, {
      ...paidRecord,
      ...sharedUpdates
    });
  }

  if (pendingRecord) {
    await store.setJSON(`pending:${reference}`, {
      ...pendingRecord,
      ...sharedUpdates
    });
  }

  return getCertificationByReference(reference);
}
