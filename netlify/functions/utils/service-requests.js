import crypto from "crypto";
import { getStore } from "@netlify/blobs";
import {
  formatBytes,
  isAllowedSupportContentType,
  normalizeContentType,
  normalizeReference,
  sanitizeFileName
} from "./certification-supports.js";

const SERVICE_STORE_NAME = "service-requests";
const SERVICE_REQUEST_PREFIX = "request:";
const SERVICE_PAYMENT_PREFIX = "payment:";
const SERVICE_DOCUMENT_PREFIX = "service-documents";
const MAX_SERVICE_DOCUMENTS_PER_UPLOAD = 8;
const MAX_SERVICE_DOCUMENT_SIZE = 10 * 1024 * 1024;
const DEFAULT_CURRENCY = "COP";
const DEFAULT_WOMPI_PUBLIC_KEY = "pub_prod_aEMHipEJ29G4pZOiIwgRC1GOvbqIYzP6";

export const SERVICE_REQUEST_STATUSES = [
  "nuevo",
  "cotizado",
  "pendiente_documentos",
  "en_proceso",
  "pendiente_pago",
  "finalizado",
  "cancelado"
];

export const SERVICE_PAYMENT_STATUSES = [
  "pendiente",
  "parcial",
  "pagado",
  "pagado_manual",
  "no_requiere"
];

const DEFAULT_SERVICE_TYPE = "otros";

function cleanText(value = "") {
  return String(value || "").trim();
}

function formatProperName(value = "") {
  return cleanText(value)
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) => {
      if (!part) return "";
      return part
        .split("-")
        .map((segment) => segment ? `${segment.charAt(0).toLocaleUpperCase("es-CO")}${segment.slice(1)}` : "")
        .join("-");
    })
    .join(" ");
}

export function normalizeDocumentNumber(value = "") {
  return String(value || "").replace(/[^\dA-Za-z.-]/g, "").trim();
}

function canonicalDocumentNumber(value = "") {
  return normalizeDocumentNumber(value).replace(/[^\dA-Za-z]/g, "").toUpperCase();
}

export function parseCurrency(value) {
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

function formatCurrencyValue(value) {
  const amount = Number(value || 0);
  return amount > 0 ? `$ ${new Intl.NumberFormat("es-CO").format(amount)}` : "";
}

function normalizeCurrencyValue(value) {
  return formatCurrencyValue(parseCurrency(value));
}

function sanitizeStatus(value, fallback = "nuevo") {
  const normalized = cleanText(value);
  return SERVICE_REQUEST_STATUSES.includes(normalized) ? normalized : fallback;
}

function sanitizePaymentStatus(value, fallback = "pendiente") {
  const normalized = cleanText(value);
  return SERVICE_PAYMENT_STATUSES.includes(normalized) ? normalized : fallback;
}

function normalizeDate(value = "") {
  const raw = cleanText(value);
  if (!raw) return "";
  const date = new Date(`${raw.slice(0, 10)}T00:00:00-05:00`);
  if (Number.isNaN(date.getTime())) return "";
  return raw.slice(0, 10);
}

function randomId() {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function createPaymentId() {
  return randomId().replace(/-/g, "").slice(0, 12).toUpperCase();
}

function buildPaymentReference(now = new Date()) {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  return `CONTARAE-PAY-${datePart}-${createPaymentId().slice(0, 6)}`;
}

function buildIntegritySignature(reference, amountInCents, currency = DEFAULT_CURRENCY) {
  const integrityKey = process.env.WOMPI_INTEGRITY_KEY || "";
  if (!integrityKey) {
    throw new Error("Falta WOMPI_INTEGRITY_KEY para generar links de pago.");
  }

  return crypto
    .createHash("sha256")
    .update(`${reference}${amountInCents}${currency}${integrityKey}`)
    .digest("hex");
}

function getPublicBaseUrl(origin = "") {
  const explicitUrl =
    process.env.PUBLIC_SITE_URL ||
    process.env.URL ||
    process.env.DEPLOY_PRIME_URL ||
    "";
  return String(origin || explicitUrl || "https://contarae.com").replace(/\/+$/, "");
}

function getWompiPublicKey() {
  return process.env.WOMPI_PUBLIC_KEY || DEFAULT_WOMPI_PUBLIC_KEY;
}

function normalizePaymentAmount(value) {
  const amount = Math.round(parseCurrency(value));
  return Number.isFinite(amount) && amount > 0 ? amount : 0;
}

function summarizePayment(payment = {}) {
  const amount = Number(payment.amount || 0);
  return {
    ...payment,
    amountLabel: formatCurrencyValue(amount) || "$ 0",
    checkoutUrl: payment.checkoutUrl || ""
  };
}

function sortByDateDesc(items = []) {
  return [...items].sort((left, right) => {
    return new Date(right.createdAt || right.paidAt || right.updatedAt || 0) -
      new Date(left.createdAt || left.paidAt || left.updatedAt || 0);
  });
}

export function getServiceRequestStore() {
  return getStore(SERVICE_STORE_NAME);
}

export function createServiceReference(now = new Date()) {
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, "");
  const unique = randomId().replace(/-/g, "").slice(0, 6).toUpperCase();
  return `CONTARAE-SOL-${datePart}-${unique}`;
}

export function getServiceDocumentDownloadPath(reference, blobKey) {
  return `/api/admin-download-service-request-document?reference=${encodeURIComponent(normalizeReference(reference))}&key=${encodeURIComponent(String(blobKey || ""))}`;
}

export function buildServiceRequestDetail(record = {}) {
  const agreedPriceAmount = parseCurrency(record.agreedPrice);
  const amountPaidAmount = parseCurrency(record.amountPaid);
  const balanceAmount = Math.max(agreedPriceAmount - amountPaidAmount, 0);
  const payments = sortByDateDesc(Array.isArray(record.payments) ? record.payments : []).map(summarizePayment);
  const paymentLinks = sortByDateDesc(Array.isArray(record.paymentLinks) ? record.paymentLinks : []).map(summarizePayment);

  const documents = (Array.isArray(record.documents) ? record.documents : []).map((document) => ({
    ...document,
    downloadPath: document?.blobKey ? getServiceDocumentDownloadPath(record.reference, document.blobKey) : "",
    sizeLabel: formatBytes(document?.size)
  }));

  return {
    ...record,
    documents,
    payments,
    paymentLinks,
    financials: {
      agreedPriceAmount,
      amountPaidAmount,
      balanceAmount,
      balance: formatCurrencyValue(balanceAmount)
    }
  };
}

export function summarizeServiceRequest(record = {}) {
  const detail = buildServiceRequestDetail(record);
  return {
    reference: detail.reference || "",
    title: detail.title || "",
    serviceType: detail.serviceType || DEFAULT_SERVICE_TYPE,
    status: detail.status || "nuevo",
    paymentStatus: detail.paymentStatus || "pendiente",
    dueDate: detail.dueDate || "",
    agreedPrice: detail.agreedPrice || "",
    amountPaid: detail.amountPaid || "",
    balance: detail.financials?.balance || "",
    clientName: detail.client?.name || "",
    clientDocumentType: detail.client?.documentType || "",
    clientDocumentNumber: detail.client?.documentNumber || "",
    clientEmail: detail.client?.email || "",
    clientPhone: detail.client?.phone || "",
    comments: detail.comments || "",
    documentsCount: detail.documents?.length || 0,
    paymentsCount: detail.payments?.length || 0,
    paymentLinksCount: detail.paymentLinks?.length || 0,
    createdAt: detail.createdAt || "",
    updatedAt: detail.updatedAt || ""
  };
}

export function sanitizeServiceRequestInput(input = {}, existing = {}) {
  const now = new Date().toISOString();
  const reference = normalizeReference(input.reference || existing.reference) || createServiceReference();
  const clientInput = input.client || {};
  const existingClient = existing.client || {};
  const agreedPrice = normalizeCurrencyValue(input.agreedPrice ?? existing.agreedPrice);
  const amountPaid = normalizeCurrencyValue(input.amountPaid ?? existing.amountPaid);

  return {
    ...existing,
    reference,
    title: cleanText(input.title ?? existing.title),
    serviceType: cleanText(input.serviceType ?? existing.serviceType) || DEFAULT_SERVICE_TYPE,
    status: sanitizeStatus(input.status ?? existing.status),
    paymentStatus: sanitizePaymentStatus(input.paymentStatus ?? existing.paymentStatus),
    agreedPrice,
    amountPaid,
    dueDate: normalizeDate(input.dueDate ?? existing.dueDate),
    comments: cleanText(input.comments ?? existing.comments),
    client: {
      name: formatProperName(clientInput.name ?? existingClient.name),
      documentType: cleanText(clientInput.documentType ?? existingClient.documentType) || "CC",
      documentNumber: normalizeDocumentNumber(clientInput.documentNumber ?? existingClient.documentNumber),
      phone: cleanText(clientInput.phone ?? existingClient.phone),
      email: cleanText(clientInput.email ?? existingClient.email).toLowerCase()
    },
    documents: Array.isArray(existing.documents) ? existing.documents : [],
    payments: Array.isArray(existing.payments) ? existing.payments : [],
    paymentLinks: Array.isArray(existing.paymentLinks) ? existing.paymentLinks : [],
    createdAt: existing.createdAt || now,
    createdBy: existing.createdBy || cleanText(input.actor) || "admin",
    updatedAt: now,
    updatedBy: cleanText(input.actor) || existing.updatedBy || "admin"
  };
}

export async function listAllServiceRequests() {
  const store = getServiceRequestStore();
  const list = await store.list({ prefix: SERVICE_REQUEST_PREFIX });
  const records = await Promise.all(
    (list.blobs || []).map(async ({ key }) => {
      const record = await store.get(key, { type: "json" });
      return record ? summarizeServiceRequest(record) : null;
    })
  );

  return records.filter(Boolean).sort((left, right) => {
    return new Date(left.dueDate || left.updatedAt || left.createdAt || 0) -
      new Date(right.dueDate || right.updatedAt || right.createdAt || 0);
  });
}

export async function getServiceRequestByReference(reference) {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) return null;

  const store = getServiceRequestStore();
  const record = await store.get(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, { type: "json" });

  return record ? buildServiceRequestDetail(record) : null;
}

export async function deleteServiceRequest(reference, actor = "admin") {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) throw new Error("Falta la referencia de la solicitud.");

  const store = getServiceRequestStore();
  const requestKey = `${SERVICE_REQUEST_PREFIX}${normalizedReference}`;
  const record = await store.get(requestKey, { type: "json" });
  if (!record) throw new Error("La solicitud no existe o ya fue eliminada.");

  const paymentLinks = Array.isArray(record.paymentLinks) ? record.paymentLinks : [];
  const documents = Array.isArray(record.documents) ? record.documents : [];
  await Promise.all([
    store.delete(requestKey),
    ...paymentLinks
      .filter((link) => link.reference)
      .map((link) => store.delete(`${SERVICE_PAYMENT_PREFIX}${normalizeReference(link.reference)}`)),
    ...documents
      .filter((document) => document.blobKey)
      .map((document) => store.delete(document.blobKey))
  ]);

  return {
    ...record,
    deletedAt: new Date().toISOString(),
    deletedBy: cleanText(actor) || "admin"
  };
}

function seedLegacyPaidAmount(record = {}, actor = "admin", now = new Date().toISOString()) {
  const payments = Array.isArray(record.payments) ? record.payments : [];
  if (payments.length) return payments;

  const legacyAmount = parseCurrency(record.amountPaid);
  if (legacyAmount <= 0) return payments;

  return [
    {
      id: randomId(),
      reference: `MANUAL-${createPaymentId()}`,
      serviceReference: normalizeReference(record.reference),
      amount: legacyAmount,
      amountLabel: formatCurrencyValue(legacyAmount),
      currency: DEFAULT_CURRENCY,
      status: "manual",
      source: "manual",
      method: "Pago registrado",
      note: "Valor pagado registrado en la solicitud antes de crear el historial de pagos.",
      paidAt: cleanText(record.updatedAt || record.createdAt) || now,
      createdAt: now,
      createdBy: actor
    }
  ];
}

export async function upsertServiceRequest(input = {}, actor = "admin") {
  const store = getServiceRequestStore();
  const reference = normalizeReference(input.reference);
  const existing = reference
    ? await store.get(`${SERVICE_REQUEST_PREFIX}${reference}`, { type: "json" })
    : null;

  const sanitizedRecord = sanitizeServiceRequestInput({ ...input, actor }, existing || {});
  const record = mergePaymentState({
    ...sanitizedRecord,
    payments: seedLegacyPaidAmount(sanitizedRecord, actor)
  });
  validateServiceRequestRecord(record);
  await store.setJSON(`${SERVICE_REQUEST_PREFIX}${record.reference}`, record);

  return buildServiceRequestDetail(record);
}

function calculatePaymentState(record = {}) {
  const payments = Array.isArray(record.payments) ? record.payments : [];
  const paymentHistoryAmount = payments.reduce((sum, payment) => {
    if (["approved", "manual"].includes(payment.status)) {
      return sum + Number(payment.amount || 0);
    }
    return sum;
  }, 0);
  const amountPaid = payments.length ? paymentHistoryAmount : parseCurrency(record.amountPaid);
  const agreedPrice = parseCurrency(record.agreedPrice);
  const balance = Math.max(agreedPrice - amountPaid, 0);
  const paymentStatus =
    agreedPrice <= 0
      ? "no_requiere"
      : amountPaid <= 0
        ? "pendiente"
        : balance > 0
          ? "parcial"
          : payments.some((payment) => payment.source === "wompi")
            ? "pagado"
            : "pagado_manual";

  return {
    amountPaid,
    balance,
    paymentStatus
  };
}

function supersedePendingPaymentLinks(paymentLinks = [], actor = "admin", reason = "balance_changed", now = new Date().toISOString()) {
  const supersededLinks = [];
  const nextLinks = (Array.isArray(paymentLinks) ? paymentLinks : []).map((link) => {
    if (link.status !== "pending") return link;
    const nextLink = {
      ...link,
      status: "superseded",
      supersededAt: now,
      supersededBy: actor,
      supersededReason: reason
    };
    supersededLinks.push(nextLink);
    return nextLink;
  });

  return {
    paymentLinks: nextLinks,
    supersededLinks
  };
}

async function createPaymentLinkForRecord(store, record = {}, input = {}, actor = "admin", origin = "", options = {}) {
  const normalizedReference = normalizeReference(record.reference);
  if (!normalizedReference) throw new Error("Falta la referencia de la solicitud.");

  const detail = buildServiceRequestDetail(record);
  const defaultAmount = Math.round(detail.financials?.balanceAmount || 0);
  const amount = defaultAmount;

  if (amount <= 0) {
    return {
      detail,
      paymentLink: null,
      created: false,
      reused: false
    };
  }

  const existingLinks = Array.isArray(record.paymentLinks) ? record.paymentLinks : [];
  const reusableLink = existingLinks.find((link) =>
    link.status === "pending" &&
    link.checkoutUrl &&
    Math.round(Number(link.amount || 0)) === amount
  );

  if (options.reuseExisting && reusableLink) {
    return {
      detail,
      paymentLink: summarizePayment(reusableLink),
      created: false,
      reused: true
    };
  }

  const now = new Date().toISOString();
  const { paymentLinks, supersededLinks } = supersedePendingPaymentLinks(
    existingLinks,
    actor,
    "new_balance_link",
    now
  );

  const paymentReference = buildPaymentReference();
  const amountInCents = amount * 100;
  const currency = DEFAULT_CURRENCY;
  const baseUrl = getPublicBaseUrl(origin);
  const checkoutUrl = `${baseUrl}/pago-solicitud?ref=${encodeURIComponent(paymentReference)}`;
  const signature = buildIntegritySignature(paymentReference, amountInCents, currency);
  const description =
    cleanText(input.description) ||
    `Pago servicio CONTARAE ${record.title || record.serviceType || normalizedReference}`;

  const paymentLink = {
    id: randomId(),
    reference: paymentReference,
    serviceReference: normalizedReference,
    amount,
    amountInCents,
    amountLabel: formatCurrencyValue(amount),
    currency,
    status: "pending",
    source: "wompi_link",
    description,
    checkoutUrl,
    signature,
    publicKey: getWompiPublicKey(),
    createdAt: now,
    createdBy: actor,
    lastEventStatus: "",
    lastEventAt: ""
  };

  const nextRecord = mergePaymentState({
    ...record,
    status: record.status === "nuevo" || record.status === "cotizado" ? "pendiente_pago" : record.status,
    paymentLinks: [...paymentLinks, paymentLink],
    updatedAt: now,
    updatedBy: actor
  });

  await Promise.all(
    supersededLinks
      .filter((link) => link.reference)
      .map((link) => store.setJSON(`${SERVICE_PAYMENT_PREFIX}${link.reference}`, link))
  );
  await store.setJSON(`${SERVICE_PAYMENT_PREFIX}${paymentReference}`, paymentLink);
  await store.setJSON(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, nextRecord);

  return {
    detail: buildServiceRequestDetail(nextRecord),
    paymentLink: summarizePayment(paymentLink),
    created: true,
    reused: false
  };
}

function mergePaymentState(record = {}) {
  const state = calculatePaymentState(record);
  return {
    ...record,
    amountPaid: formatCurrencyValue(state.amountPaid),
    paymentStatus: state.paymentStatus
  };
}

function validateServiceRequestRecord(record = {}) {
  const client = record.client || {};
  const required = [
    [client.name, "Ingresa el nombre del cliente."],
    [client.documentType, "Selecciona el tipo de documento del cliente."],
    [client.documentNumber, "Ingresa el número de documento del cliente."],
    [client.phone, "Ingresa el WhatsApp o teléfono del cliente."],
    [client.email, "Ingresa el correo electrónico del cliente."],
    [record.title, "Ingresa el título de la solicitud."],
    [record.serviceType, "Selecciona el tipo de servicio."],
    [record.status, "Selecciona el estado de la solicitud."],
    [record.paymentStatus, "Selecciona el estado de pago."],
    [record.dueDate, "Selecciona la fecha de vencimiento de la solicitud."]
  ];
  const missing = required.find(([value]) => !cleanText(value));
  if (missing) throw new Error(missing[1]);
  if (!canonicalDocumentNumber(client.documentNumber)) throw new Error("Ingresa un número de documento válido.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanText(client.email))) throw new Error("Ingresa un correo electrónico válido.");
  if (parseCurrency(record.agreedPrice) <= 0) throw new Error("Ingresa el costo pactado del servicio.");
}

export async function createServicePaymentLink(reference, input = {}, actor = "admin", origin = "") {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) throw new Error("Falta la referencia de la solicitud.");

  const store = getServiceRequestStore();
  const record = await store.get(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, { type: "json" });
  if (!record) throw new Error("Solicitud no encontrada.");

  const result = await createPaymentLinkForRecord(store, record, input, actor, origin, { reuseExisting: false });
  if (!result.paymentLink) {
    throw new Error("La solicitud no tiene saldo pendiente para generar un link de pago.");
  }

  return {
    detail: result.detail,
    paymentLink: result.paymentLink
  };
}

export async function ensureServicePaymentLink(reference, input = {}, actor = "admin", origin = "") {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) throw new Error("Falta la referencia de la solicitud.");

  const store = getServiceRequestStore();
  const record = await store.get(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, { type: "json" });
  if (!record) throw new Error("Solicitud no encontrada.");

  return createPaymentLinkForRecord(store, record, input, actor, origin, { reuseExisting: true });
}

export async function registerManualServicePayment(reference, input = {}, actor = "admin") {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) throw new Error("Falta la referencia de la solicitud.");

  const store = getServiceRequestStore();
  const record = await store.get(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, { type: "json" });
  if (!record) throw new Error("Solicitud no encontrada.");

  const amount = normalizePaymentAmount(input.amount);
  if (amount <= 0) {
    throw new Error("Ingresa un valor de pago manual válido.");
  }

  const now = new Date().toISOString();
  const existingPayments = seedLegacyPaidAmount(record, actor, now);
  const currentRecord = {
    ...record,
    payments: existingPayments
  };
  const currentState = calculatePaymentState(currentRecord);
  if (currentState.balance <= 0) {
    throw new Error("La solicitud no tiene saldo pendiente para registrar un pago.");
  }
  if (amount > currentState.balance) {
    throw new Error(`El pago manual no puede superar el saldo pendiente de ${formatCurrencyValue(currentState.balance)}.`);
  }

  const payment = {
    id: randomId(),
    reference: `MANUAL-${createPaymentId()}`,
    serviceReference: normalizedReference,
    amount,
    amountLabel: formatCurrencyValue(amount),
    currency: DEFAULT_CURRENCY,
    status: "manual",
    source: "manual",
    method: cleanText(input.method) || "Pago manual",
    note: cleanText(input.note),
    paidAt: cleanText(input.paidAt) || now,
    createdAt: now,
    createdBy: actor
  };
  const { paymentLinks, supersededLinks } = supersedePendingPaymentLinks(
    currentRecord.paymentLinks,
    actor,
    "manual_payment",
    now
  );

  const nextRecord = mergePaymentState({
    ...currentRecord,
    paymentLinks,
    payments: [...existingPayments, payment],
    updatedAt: now,
    updatedBy: actor
  });

  await Promise.all(
    supersededLinks
      .filter((link) => link.reference)
      .map((link) => store.setJSON(`${SERVICE_PAYMENT_PREFIX}${link.reference}`, link))
  );
  await store.setJSON(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, nextRecord);

  return {
    detail: buildServiceRequestDetail(nextRecord),
    payment: summarizePayment(payment)
  };
}

export async function getServicePaymentByReference(paymentReference) {
  const normalizedReference = normalizeReference(paymentReference);
  if (!normalizedReference) return null;

  const store = getServiceRequestStore();
  const paymentLink = await store.get(`${SERVICE_PAYMENT_PREFIX}${normalizedReference}`, { type: "json" });
  if (!paymentLink) return null;

  const request = await store.get(`${SERVICE_REQUEST_PREFIX}${paymentLink.serviceReference}`, { type: "json" });
  if (!request) return null;

  return {
    payment: summarizePayment(paymentLink),
    request: {
      reference: request.reference,
      title: request.title,
      serviceType: request.serviceType,
      status: request.status,
      paymentStatus: request.paymentStatus,
      client: request.client || {},
      dueDate: request.dueDate || ""
    }
  };
}

function buildPublicPaymentSummary(detail = {}) {
  const pendingLink = (detail.paymentLinks || []).find((link) => link.status === "pending" && link.checkoutUrl);
  const latestLink = pendingLink || (detail.paymentLinks || []).find((link) => link.checkoutUrl) || null;
  const balanceAmount = Number(detail.financials?.balanceAmount || 0);
  const agreedPriceAmount = Number(detail.financials?.agreedPriceAmount || 0);
  const amountPaidAmount = Number(detail.financials?.amountPaidAmount || 0);

  return {
    reference: detail.reference || "",
    title: detail.title || "",
    serviceType: detail.serviceType || DEFAULT_SERVICE_TYPE,
    status: detail.status || "nuevo",
    paymentStatus: detail.paymentStatus || "pendiente",
    dueDate: detail.dueDate || "",
    agreedPrice: formatCurrencyValue(agreedPriceAmount),
    amountPaid: formatCurrencyValue(amountPaidAmount) || "$ 0",
    balance: formatCurrencyValue(balanceAmount) || "$ 0",
    balanceAmount,
    canPay: balanceAmount > 0 && Boolean(pendingLink?.checkoutUrl),
    paymentLink: latestLink
      ? {
          reference: latestLink.reference || "",
          status: latestLink.status || "pending",
          amount: latestLink.amount || 0,
          amountLabel: latestLink.amountLabel || formatCurrencyValue(latestLink.amount),
          checkoutUrl: latestLink.checkoutUrl || "",
          createdAt: latestLink.createdAt || ""
        }
      : null,
    updatedAt: detail.updatedAt || ""
  };
}

export async function listPublicServicePaymentsByDocument(input = {}) {
  const documentNumber = normalizeDocumentNumber(input.documentNumber);
  const canonicalDocument = canonicalDocumentNumber(input.documentNumber);
  const documentType = cleanText(input.documentType).toUpperCase();

  if (!canonicalDocument || canonicalDocument.length < 5) {
    throw new Error("Ingresa un número de documento válido.");
  }

  const store = getServiceRequestStore();
  const list = await store.list({ prefix: SERVICE_REQUEST_PREFIX });
  const records = await Promise.all(
    (list.blobs || []).map(async ({ key }) => store.get(key, { type: "json" }))
  );

  const matchingRecords = records
    .filter(Boolean)
    .filter((record) => {
      const client = record.client || {};
      const sameDocument = canonicalDocumentNumber(client.documentNumber) === canonicalDocument;
      const sameType = !documentType || cleanText(client.documentType).toUpperCase() === documentType;
      return sameDocument && sameType;
    })
    .filter((record) => record.status !== "cancelado")
    .map(buildServiceRequestDetail)
    .filter((detail) => Number(detail.financials?.agreedPriceAmount || 0) > 0)
    .map(buildPublicPaymentSummary)
    .sort((left, right) => {
      if ((right.balanceAmount || 0) !== (left.balanceAmount || 0)) {
        return (right.balanceAmount || 0) - (left.balanceAmount || 0);
      }
      return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0);
    });

  const pending = matchingRecords.filter((request) => request.balanceAmount > 0);
  const paid = matchingRecords.filter((request) => request.balanceAmount <= 0);
  const pendingAmount = pending.reduce((sum, request) => sum + Number(request.balanceAmount || 0), 0);

  return {
    documentType,
    documentNumber,
    clientName: records.find((record) => {
      const client = record?.client || {};
      return canonicalDocumentNumber(client.documentNumber) === canonicalDocument &&
        (!documentType || cleanText(client.documentType).toUpperCase() === documentType);
    })?.client?.name || "",
    pendingAmount,
    pendingAmountLabel: formatCurrencyValue(pendingAmount) || "$ 0",
    requests: matchingRecords,
    pendingCount: pending.length,
    paidCount: paid.length
  };
}

export async function listServicePayments() {
  const records = await listAllServiceRequests();
  const details = await Promise.all(records.map((record) => getServiceRequestByReference(record.reference)));
  const items = [];

  details.filter(Boolean).forEach((detail) => {
    const requestSummary = summarizeServiceRequest(detail);
    (detail.paymentLinks || []).forEach((payment) => {
      items.push({
        ...payment,
        kind: "link",
        request: requestSummary
      });
    });
    (detail.payments || []).forEach((payment) => {
      items.push({
        ...payment,
        kind: "payment",
        request: requestSummary
      });
    });
  });

  return sortByDateDesc(items);
}

export async function processServicePaymentEvent(paymentReference, transaction = {}) {
  const normalizedReference = normalizeReference(paymentReference);
  if (!normalizedReference) throw new Error("Falta la referencia del pago.");

  const store = getServiceRequestStore();
  const paymentLink = await store.get(`${SERVICE_PAYMENT_PREFIX}${normalizedReference}`, { type: "json" });
  if (!paymentLink) return null;

  const request = await store.get(`${SERVICE_REQUEST_PREFIX}${paymentLink.serviceReference}`, { type: "json" });
  if (!request) throw new Error("La solicitud asociada al pago no existe.");

  const status = String(transaction.status || "").toUpperCase().trim();
  const now = new Date().toISOString();
  const finalFailedStatuses = new Set(["DECLINED", "ERROR", "VOIDED", "FAILED", "REJECTED", "CANCELED", "CANCELLED"]);
  const approved = status === "APPROVED";
  const failed = finalFailedStatuses.has(status);
  const amount = Math.round(Number(transaction.amount_in_cents || paymentLink.amountInCents || 0) / 100);
  const paidAt = cleanText(transaction.finalized_at || transaction.created_at) || now;

  const nextPaymentLink = {
    ...paymentLink,
    status: approved ? "approved" : failed ? "failed" : paymentLink.status || "pending",
    lastEventStatus: status,
    lastEventAt: now,
    wompiTransaction: {
      id: transaction.id,
      status: transaction.status,
      reference: transaction.reference || normalizedReference,
      amount_in_cents: transaction.amount_in_cents,
      currency: transaction.currency,
      payment_method_type: transaction.payment_method_type,
      customer_email: transaction.customer_email,
      finalized_at: transaction.finalized_at || "",
      created_at: transaction.created_at || ""
    }
  };

  let payments = seedLegacyPaidAmount(request, "wompi-webhook", now);

  if (approved && !payments.some((payment) => payment.reference === normalizedReference)) {
    payments = [
      ...payments,
      {
        id: randomId(),
        reference: normalizedReference,
        serviceReference: paymentLink.serviceReference,
        amount,
        amountLabel: formatCurrencyValue(amount),
        currency: transaction.currency || DEFAULT_CURRENCY,
        status: "approved",
        source: "wompi",
        method: transaction.payment_method_type || "Wompi",
        paidAt,
        createdAt: now,
        wompiTransaction: nextPaymentLink.wompiTransaction
      }
    ];
  }

  const mappedPaymentLinks = (Array.isArray(request.paymentLinks) ? request.paymentLinks : []).map((link) =>
    link.reference === normalizedReference ? nextPaymentLink : link
  );
  const { paymentLinks, supersededLinks } = approved
    ? supersedePendingPaymentLinks(mappedPaymentLinks, "wompi-webhook", "wompi_payment_approved", now)
    : { paymentLinks: mappedPaymentLinks, supersededLinks: [] };

  const nextRequest = mergePaymentState({
    ...request,
    paymentLinks,
    payments,
    updatedAt: now,
    updatedBy: "wompi-webhook"
  });

  await store.setJSON(`${SERVICE_PAYMENT_PREFIX}${normalizedReference}`, nextPaymentLink);
  await Promise.all(
    supersededLinks
      .filter((link) => link.reference && link.reference !== normalizedReference)
      .map((link) => store.setJSON(`${SERVICE_PAYMENT_PREFIX}${link.reference}`, link))
  );
  await store.setJSON(`${SERVICE_REQUEST_PREFIX}${paymentLink.serviceReference}`, nextRequest);

  return {
    payment: summarizePayment(nextPaymentLink),
    detail: buildServiceRequestDetail(nextRequest),
    approved,
    failed,
    status
  };
}

function buildServiceDocumentBlobKey(reference, originalName) {
  const normalizedReference = normalizeReference(reference);
  const fileName = sanitizeFileName(originalName);
  return `${SERVICE_DOCUMENT_PREFIX}/${normalizedReference}/${randomId()}-${fileName}`;
}

function buildServiceDocumentRecord({
  reference,
  blobKey,
  originalName,
  contentType,
  size,
  uploadedAt,
  uploadedBy
}) {
  return {
    id: randomId(),
    reference: normalizeReference(reference),
    blobKey,
    originalName: sanitizeFileName(originalName),
    contentType: normalizeContentType(contentType, originalName),
    size: Number(size || 0),
    uploadedAt: uploadedAt || new Date().toISOString(),
    uploadedBy: cleanText(uploadedBy) || "admin"
  };
}

export async function uploadServiceRequestDocuments(reference, files = [], actor = "admin") {
  const normalizedReference = normalizeReference(reference);
  if (!normalizedReference) throw new Error("Falta la referencia de la solicitud.");
  if (!files.length) throw new Error("No seleccionaste documentos para cargar.");
  if (files.length > MAX_SERVICE_DOCUMENTS_PER_UPLOAD) {
    throw new Error(`Solo puedes adjuntar hasta ${MAX_SERVICE_DOCUMENTS_PER_UPLOAD} documentos por carga.`);
  }

  const store = getServiceRequestStore();
  const record = await store.get(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, { type: "json" });
  if (!record) throw new Error("Solicitud no encontrada.");

  const uploaded = [];

  for (const file of files) {
    const contentType = normalizeContentType(file.type, file.name);

    if (!isAllowedSupportContentType(contentType, file.name)) {
      throw new Error(`El archivo "${file.name}" no tiene un formato permitido. Usa PDF, JPG, PNG, WEBP, HEIC, DOC o DOCX.`);
    }

    if (Number(file.size || 0) > MAX_SERVICE_DOCUMENT_SIZE) {
      throw new Error(`El archivo "${file.name}" supera el límite de ${formatBytes(MAX_SERVICE_DOCUMENT_SIZE)}.`);
    }

    const blobKey = buildServiceDocumentBlobKey(normalizedReference, file.name);
    const uploadedAt = new Date().toISOString();

    await store.set(blobKey, await file.arrayBuffer(), {
      metadata: {
        reference: normalizedReference,
        originalName: file.name,
        contentType,
        size: Number(file.size || 0),
        uploadedAt,
        uploadedBy: actor
      }
    });

    uploaded.push(
      buildServiceDocumentRecord({
        reference: normalizedReference,
        blobKey,
        originalName: file.name,
        contentType,
        size: file.size,
        uploadedAt,
        uploadedBy: actor
      })
    );
  }

  const updated = {
    ...record,
    documents: [...(Array.isArray(record.documents) ? record.documents : []), ...uploaded],
    updatedAt: new Date().toISOString(),
    updatedBy: actor
  };

  await store.setJSON(`${SERVICE_REQUEST_PREFIX}${normalizedReference}`, updated);

  return {
    detail: buildServiceRequestDetail(updated),
    uploadedCount: uploaded.length
  };
}

export async function getServiceRequestDocument(reference, key) {
  const normalizedReference = normalizeReference(reference);
  const blobKey = String(key || "");

  if (!normalizedReference || !blobKey) {
    throw new Error("Faltan parámetros para descargar el documento.");
  }

  if (!blobKey.startsWith(`${SERVICE_DOCUMENT_PREFIX}/${normalizedReference}/`)) {
    throw new Error("Ruta de documento inválida.");
  }

  const store = getServiceRequestStore();
  const blob = await store.getWithMetadata(blobKey, { type: "arrayBuffer" });

  if (!blob) {
    return null;
  }

  return {
    data: blob.data,
    metadata: {
      contentType: String(blob.metadata?.contentType || "application/octet-stream"),
      originalName: sanitizeFileName(String(blob.metadata?.originalName || blobKey.split("/").pop() || "documento"))
    }
  };
}
