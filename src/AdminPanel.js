import { startTransition, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

const F = "'Outfit',sans-serif";
const FH = "'Libre Baskerville',serif";

const STATUS_META = {
  pago_no_confirmado: { label: "Pago no confirmado", tone: "#DC2626", bg: "rgba(220,38,38,.10)" },
  en_revision: { label: "En revision", tone: "#0F766E", bg: "rgba(13,148,136,.10)" },
  documentos_solicitados: { label: "Documentos solicitados al cliente", tone: "#B45309", bg: "rgba(245,158,11,.14)" },
  enviada: { label: "Enviada", tone: "#15803D", bg: "rgba(34,197,94,.12)" },
  rechazada: { label: "Rechazada", tone: "#7F1D1D", bg: "rgba(239,68,68,.12)" }
};

const PAYMENT_META = {
  approved: { label: "Pago aprobado", tone: "#15803D", bg: "rgba(34,197,94,.12)" },
  pending: { label: "Pago pendiente", tone: "#64748B", bg: "rgba(100,116,139,.10)" },
  declined: { label: "Declinado", tone: "#DC2626", bg: "rgba(220,38,38,.10)" },
  error: { label: "Error", tone: "#DC2626", bg: "rgba(220,38,38,.10)" },
  voided: { label: "Anulado", tone: "#B45309", bg: "rgba(245,158,11,.12)" }
};

const ADMIN_MODULES = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Centro operativo",
    description: "Resumen de solicitudes generales, vencimientos, alertas, cartera y tareas pendientes."
  },
  {
    id: "solicitudes",
    label: "Solicitudes",
    title: "Solicitudes de servicios",
    description: "Gestiona servicios personalizados sin mezclar el flujo automatizado de certificaciones."
  },
  {
    id: "clientes",
    label: "Clientes",
    title: "Clientes",
    description: "Consulta clientes reales sin duplicados por documento, servicios asociados, pagos y cartera."
  },
  {
    id: "potenciales",
    label: "Clientes potenciales",
    title: "Clientes potenciales",
    description: "Gestiona contactos captados desde formularios, herramientas web y campañas antes de convertirlos en solicitudes."
  },
  {
    id: "pagos",
    label: "Pagos",
    title: "Pagos y cartera",
    description: "Gestiona links de pago, pagos manuales, saldos pendientes y recaudo por solicitud."
  },
  {
    id: "certificaciones",
    label: "Certificaciones",
    title: "Certificaciones de ingresos",
    description: "Revisa pagos aprobados, registra notas internas y emite certificaciones automatizadas."
  }
];

const SERVICE_TYPES = [
  ["declaracion_renta", "Declaración de renta"],
  ["tramite_tributario", "Trámite tributario"],
  ["asesoria_contable", "Asesoría contable"],
  ["respuesta_requerimiento", "Respuesta a requerimiento"],
  ["constitucion_rut", "RUT / Cámara de Comercio"],
  ["planeacion_financiera", "Planeación financiera"],
  ["otros", "Otros servicios"]
];

const SERVICE_STATUS_META = {
  nuevo: { label: "Nuevo", tone: "#1D4ED8", bg: "rgba(37,99,235,.10)" },
  cotizado: { label: "Cotizado", tone: "#7C3AED", bg: "rgba(124,58,237,.10)" },
  pendiente_documentos: { label: "Pendiente documentos", tone: "#B45309", bg: "rgba(245,158,11,.14)" },
  en_proceso: { label: "En proceso", tone: "#0F766E", bg: "rgba(13,148,136,.10)" },
  pendiente_pago: { label: "Pendiente pago", tone: "#C2410C", bg: "rgba(249,115,22,.12)" },
  finalizado: { label: "Finalizado", tone: "#15803D", bg: "rgba(34,197,94,.12)" },
  cancelado: { label: "Cancelado", tone: "#991B1B", bg: "rgba(220,38,38,.10)" }
};

const SERVICE_PAYMENT_META = {
  pendiente: { label: "Saldo pendiente", tone: "#C2410C", bg: "rgba(249,115,22,.12)" },
  parcial: { label: "Abono parcial", tone: "#B45309", bg: "rgba(245,158,11,.14)" },
  pagado: { label: "Pagado por Wompi", tone: "#15803D", bg: "rgba(34,197,94,.12)" },
  pagado_manual: { label: "Pagado manual", tone: "#15803D", bg: "rgba(34,197,94,.12)" },
  no_requiere: { label: "No requiere pago", tone: "#475569", bg: "rgba(100,116,139,.10)" }
};

const EMPTY_MANUAL_PAYMENT_DRAFT = {
  amount: "",
  method: "Nequi",
  paidAt: "",
  transactionReference: "",
  payerName: "",
  note: ""
};
const EMPTY_TASK_DRAFT = {
  title: "",
  dueDate: "",
  note: ""
};
const EMPTY_DELETE_CREDENTIALS = { username: "", password: "", reason: "" };

const CERTIFICATE_CURRENCY_FIELDS = [
  "ingresos_laborales",
  "pensiones",
  "dividendos",
  "inversiones",
  "arriendos",
  "remesas",
  "otros_ingresos"
];

const CERTIFICATE_TOTAL_FIELDS = [
  "total_ingresos",
  "total_ingresos_periodo",
  "total_ingresos_eventuales",
  "total_ingresos_global_periodo"
];

const CERTIFICATE_INCOME_LABELS = [
  ["ingresos_laborales", "Ingresos laborales"],
  ["pensiones", "Pensiones"],
  ["dividendos", "Dividendos"],
  ["inversiones", "Inversiones"],
  ["arriendos", "Arriendos"],
  ["remesas", "Remesas"],
  ["otros_ingresos", "Otros ingresos mensuales recurrentes"]
];

const ORIGINAL_FORM_FIELDS = [
  ["nombre", "Nombre completo"],
  ["tipo_documento", "Tipo de documento"],
  ["numero_documento", "Número de documento"],
  ["lugar_expedicion", "Lugar de expedición"],
  ["correo", "Correo electrónico"],
  ["telefono", "Teléfono / WhatsApp"],
  ["destino", "Destino del documento"],
  ["entidad", "Entidad receptora"],
  ["periodo", "Período a certificar"],
  ["periodo_meses", "Meses certificados"],
  ["total_ingresos", "Total mensual recurrente"],
  ["total_ingresos_periodo", "Total recurrente del período"],
  ["total_ingresos_eventuales", "Total eventuales del período"],
  ["total_ingresos_global_periodo", "Total global del período"]
];

const PDF_PRIMARY_FIELDS = [
  ["nombre", "Nombre para el PDF"],
  ["tipo_documento", "Tipo de documento"],
  ["numero_documento", "Número de documento"],
  ["lugar_expedicion", "Lugar de expedición"],
  ["correo", "Correo para envío"],
  ["telefono", "WhatsApp para contacto"],
  ["destino", "Destino"],
  ["entidad", "Entidad"],
  ["periodo", "Período"],
  ["periodo_meses", "Meses certificados"],
  ["total_ingresos", "Total mensual recurrente"],
  ["total_ingresos_periodo", "Total recurrente del período"],
  ["total_ingresos_eventuales", "Total eventuales del período"],
  ["total_ingresos_global_periodo", "Total global del período"]
];

const PDF_NOTE_FIELDS = [
  ["otros_descripcion", "Detalle otros ingresos mensuales recurrentes"]
];

const CERTIFICATE_CLARIFICATION_FIELD = "nota_aclaratoria_certificacion";

const shell = {
  minHeight: "100vh",
  background:
    "radial-gradient(circle at top left, rgba(56,189,248,.12), transparent 26%), linear-gradient(180deg,#eef4ff,#f8fbff 46%,#f5f8fd 100%)",
  color: "#0B1D3A"
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 14,
  border: "1px solid rgba(37,99,235,.14)",
  background: "#fff",
  fontFamily: F,
  fontSize: 14,
  outline: "none",
  boxSizing: "border-box"
};

const subtleDangerButtonStyle = {
  padding: "8px 10px",
  borderRadius: 12,
  border: "1px solid rgba(220,38,38,.14)",
  background: "rgba(220,38,38,.04)",
  color: "#B91C1C",
  fontFamily: F,
  fontSize: 12,
  fontWeight: 800,
  cursor: "pointer"
};

function formatDate(value) {
  if (!value) return "Sin fecha";

  try {
    return new Intl.DateTimeFormat("es-CO", {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (!Number.isFinite(value) || value <= 0) return "0 B";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function normalizeCurrencyInput(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  return `$ ${new Intl.NumberFormat("es-CO").format(Number(digits))}`;
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

function formatProperName(value = "") {
  return String(value || "")
    .trim()
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

function buildClientIdentityKey(values = {}) {
  const documentKey = String(values.documentNumber || values.clientDocumentNumber || "")
    .replace(/[^\dA-Za-z]/g, "")
    .toUpperCase();
  if (documentKey) return `doc:${documentKey}`;

  const emailKey = String(values.email || values.clientEmail || "").trim().toLowerCase();
  if (emailKey) return `email:${emailKey}`;

  const phoneKey = String(values.phone || values.clientPhone || "").replace(/\D/g, "");
  if (phoneKey) return `phone:${phoneKey}`;

  return `name:${formatProperName(values.name || values.clientName || "sin-cliente").toLowerCase()}`;
}

function normalizeDocumentIdentity(value = "") {
  return String(value || "").replace(/[^\dA-Za-z]/g, "").toUpperCase();
}

function buildClientDocumentKey(values = {}) {
  const documentKey = normalizeDocumentIdentity(values.documentNumber || values.clientDocumentNumber);
  return documentKey ? `doc:${documentKey}` : "";
}

function hasMeaningfulCurrencyValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return parseCurrency(raw) > 0;
}

function getServiceTypeLabel(type) {
  return SERVICE_TYPES.find(([value]) => value === type)?.[1] || "Otros servicios";
}

function inferServiceTypeFromText(value = "") {
  const text = String(value || "").toLowerCase();
  if (text.includes("renta") || text.includes("declar")) return "declaracion_renta";
  if (text.includes("rut") || text.includes("cámara") || text.includes("camara") || text.includes("comercio")) return "constitucion_rut";
  if (text.includes("requerimiento") || text.includes("dian")) return "respuesta_requerimiento";
  if (text.includes("tribut")) return "tramite_tributario";
  if (text.includes("plane")) return "planeacion_financiera";
  if (text.includes("asesor")) return "asesoria_contable";
  return "otros";
}

function getServiceStatusMeta(status) {
  return SERVICE_STATUS_META[status] || SERVICE_STATUS_META.nuevo;
}

function getServicePaymentMeta(status) {
  return SERVICE_PAYMENT_META[status] || SERVICE_PAYMENT_META.pendiente;
}

function isVoidedServicePayment(payment = {}) {
  const status = String(payment.status || "").toLowerCase();
  return ["voided", "reversed", "annulled", "anulado"].includes(status) || Boolean(payment.voided || payment.voidedAt);
}

function isAppliedServicePayment(payment = {}) {
  return ["approved", "manual"].includes(String(payment.status || "").toLowerCase()) && !isVoidedServicePayment(payment);
}

function getServicePaymentMovementBadge(payment = {}) {
  if (isVoidedServicePayment(payment)) {
    return { label: "Pago anulado", meta: { tone: "#B45309", bg: "rgba(245,158,11,.14)" } };
  }
  if (payment.kind === "payment") {
    return payment.source === "wompi"
      ? { label: "Pago Wompi aplicado", meta: getServicePaymentMeta("pagado") }
      : { label: "Pago manual aplicado", meta: getServicePaymentMeta("pagado_manual") };
  }
  if (payment.status === "approved") return { label: "Link aprobado", meta: getServicePaymentMeta("pagado") };
  if (payment.status === "failed") return { label: "Link fallido", meta: { tone: "#991B1B", bg: "rgba(220,38,38,.10)" } };
  if (payment.status === "superseded") return { label: "Link reemplazado", meta: { tone: "#64748B", bg: "rgba(100,116,139,.10)" } };
  return { label: "Link pendiente", meta: getServicePaymentMeta("pendiente") };
}

function getVisibleServiceStatusBadge(record = {}) {
  const status = record.status || "nuevo";
  const paymentStatus = record.paymentStatus || "pendiente";
  if (status === "pendiente_pago" && ["pendiente", "parcial"].includes(paymentStatus)) {
    return null;
  }
  const meta = getServiceStatusMeta(status);
  return { label: meta.label, meta };
}

function getServiceStateSummary(record = {}) {
  const statusBadge = getVisibleServiceStatusBadge(record);
  const paymentLabel = getServicePaymentMeta(record.paymentStatus).label;
  return statusBadge ? `${statusBadge.label} · ${paymentLabel}` : paymentLabel;
}

function formatMoney(value) {
  const amount = parseCurrency(value);
  return amount > 0 ? `$ ${new Intl.NumberFormat("es-CO").format(amount)}` : "$ 0";
}

function formatDateOnly(value) {
  if (!value) return "Sin vencimiento";

  try {
    return new Intl.DateTimeFormat("es-CO", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }).format(new Date(`${String(value).slice(0, 10)}T00:00:00-05:00`));
  } catch {
    return value;
  }
}

function getTodayDateString() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(now);
  const byType = parts.reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${byType.year}-${byType.month}-${byType.day}`;
}

function daysUntilDue(dueDate) {
  if (!dueDate) return null;
  const today = new Date(`${getTodayDateString()}T00:00:00-05:00`);
  const due = new Date(`${String(dueDate).slice(0, 10)}T00:00:00-05:00`);
  if (Number.isNaN(due.getTime())) return null;
  return Math.ceil((due.getTime() - today.getTime()) / 86400000);
}

function getMonthLabel(year, monthIndex) {
  return new Intl.DateTimeFormat("es-CO", {
    month: "long",
    year: "numeric",
    timeZone: "America/Bogota"
  }).format(new Date(Date.UTC(year, monthIndex, 1, 12)));
}

function buildMonthlyDueCalendar(records = [], baseDate = getTodayDateString()) {
  const [baseYear, baseMonth] = String(baseDate).slice(0, 10).split("-").map(Number);
  const year = baseYear || new Date().getFullYear();
  const monthIndex = Number.isFinite(baseMonth) ? baseMonth - 1 : new Date().getMonth();
  const firstDay = new Date(Date.UTC(year, monthIndex, 1, 12));
  const daysInMonth = new Date(Date.UTC(year, monthIndex + 1, 0, 12)).getUTCDate();
  const mondayStartOffset = (firstDay.getUTCDay() + 6) % 7;
  const activeRecords = records.filter((record) => !["finalizado", "cancelado"].includes(record.status));
  const byDate = activeRecords.reduce((acc, record) => {
    const date = String(record.dueDate || "").slice(0, 10);
    if (!date) return acc;
    acc[date] = [...(acc[date] || []), record];
    return acc;
  }, {});

  const cells = [];
  for (let index = 0; index < mondayStartOffset; index += 1) {
    cells.push({ empty: true, key: `empty-${index}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const requests = byDate[date] || [];
    const urgentCount = requests.filter((request) => getDueMeta(request).urgent).length;
    cells.push({
      key: date,
      date,
      day,
      requests,
      urgentCount,
      isToday: date === getTodayDateString()
    });
  }

  return {
    label: getMonthLabel(year, monthIndex),
    cells
  };
}

function getDueMeta(request = {}) {
  if (!request.dueDate) {
    return { label: "Sin vencimiento", tone: "#64748B", bg: "rgba(100,116,139,.10)", urgent: false };
  }

  const days = daysUntilDue(request.dueDate);
  if (days === null) {
    return { label: "Fecha inválida", tone: "#991B1B", bg: "rgba(220,38,38,.10)", urgent: true };
  }

  if (["finalizado", "cancelado"].includes(request.status)) {
    return { label: `Venció: ${formatDateOnly(request.dueDate)}`, tone: "#475569", bg: "rgba(100,116,139,.10)", urgent: false };
  }

  if (days < 0) {
    return { label: `Vencida hace ${Math.abs(days)} día(s)`, tone: "#DC2626", bg: "rgba(220,38,38,.10)", urgent: true };
  }

  if (days === 0) {
    return { label: "Vence hoy", tone: "#DC2626", bg: "rgba(220,38,38,.10)", urgent: true };
  }

  if (days <= 3) {
    return { label: `Vence en ${days} día(s)`, tone: "#B45309", bg: "rgba(245,158,11,.14)", urgent: true };
  }

  return { label: `Vence: ${formatDateOnly(request.dueDate)}`, tone: "#15803D", bg: "rgba(34,197,94,.12)", urgent: false };
}

function buildEmptyServiceDraft() {
  return {
    reference: "",
    title: "",
    serviceType: "declaracion_renta",
    status: "nuevo",
    paymentStatus: "pendiente",
    agreedPrice: "",
    amountPaid: "",
    dueDate: "",
    comments: "",
    client: {
      name: "",
      documentType: "CC",
      documentNumber: "",
      phone: "",
      email: ""
    }
  };
}

function buildServiceDraftFromDetail(detail = null) {
  if (!detail) return buildEmptyServiceDraft();

  return {
    reference: detail.reference || "",
    title: detail.title || "",
    serviceType: detail.serviceType || "otros",
    status: detail.status || "nuevo",
    paymentStatus: detail.paymentStatus || "pendiente",
    agreedPrice: detail.agreedPrice || "",
    amountPaid: detail.amountPaid || "",
    dueDate: detail.dueDate || "",
    comments: detail.comments || "",
    client: {
      name: formatProperName(detail.client?.name || ""),
      documentType: detail.client?.documentType || "CC",
      documentNumber: detail.client?.documentNumber || "",
      phone: detail.client?.phone || "",
      email: detail.client?.email || ""
    }
  };
}

function buildServiceDashboard(records = []) {
  const activeRecords = records.filter((record) => !["finalizado", "cancelado"].includes(record.status));
  const overdue = activeRecords.filter((record) => {
    const days = daysUntilDue(record.dueDate);
    return days !== null && days < 0;
  });
  const dueSoon = activeRecords.filter((record) => {
    const days = daysUntilDue(record.dueDate);
    return days !== null && days >= 0 && days <= 3;
  });
  const pendingPayment = records.filter((record) => ["pendiente", "parcial"].includes(record.paymentStatus));
  const totalSales = records.reduce((sum, record) => sum + parseCurrency(record.agreedPrice), 0);
  const totalPaid = records.reduce((sum, record) => sum + parseCurrency(record.amountPaid), 0);
  const receivables = Math.max(totalSales - totalPaid, 0);
  const calendar = [...activeRecords]
    .filter((record) => record.dueDate)
    .sort((left, right) => new Date(left.dueDate) - new Date(right.dueDate))
    .slice(0, 12);
  const byType = SERVICE_TYPES.map(([type, label]) => ({
    type,
    label,
    count: activeRecords.filter((record) => record.serviceType === type).length
  })).filter((item) => item.count > 0);

  return {
    activeCount: activeRecords.length,
    overdueCount: overdue.length,
    dueSoonCount: dueSoon.length,
    pendingPaymentCount: pendingPayment.length,
    totalSales: `$ ${new Intl.NumberFormat("es-CO").format(totalSales)}`,
    totalPaid: `$ ${new Intl.NumberFormat("es-CO").format(totalPaid)}`,
    receivables: `$ ${new Intl.NumberFormat("es-CO").format(receivables)}`,
    calendar,
    byType
  };
}

function buildClientRows(records = []) {
  const clients = new Map();

  records.forEach((record, index) => {
    const documentNumber = String(record.clientDocumentNumber || "").trim();
    const key = buildClientDocumentKey(record) || `sin-documento:${record.reference || index}`;
    const current = clients.get(key) || {
      key,
      name: formatProperName(record.clientName) || "Cliente sin nombre",
      documentNumber,
      email: record.clientEmail || "",
      phone: record.clientPhone || "",
      requests: 0,
      active: 0,
      totalAgreed: 0,
      totalPaid: 0,
      receivable: 0,
      lastUpdatedAt: ""
    };

    current.requests += 1;
    if (!["finalizado", "cancelado"].includes(record.status)) current.active += 1;
    current.totalAgreed += parseCurrency(record.agreedPrice);
    current.totalPaid += parseCurrency(record.amountPaid);
    current.receivable += Math.max(parseCurrency(record.agreedPrice) - parseCurrency(record.amountPaid), 0);
    current.lastUpdatedAt =
      !current.lastUpdatedAt || new Date(record.updatedAt || 0) > new Date(current.lastUpdatedAt || 0)
        ? record.updatedAt
        : current.lastUpdatedAt;
    clients.set(key, current);
  });

  return Array.from(clients.values()).sort((left, right) => {
    return new Date(right.lastUpdatedAt || 0) - new Date(left.lastUpdatedAt || 0);
  });
}

function buildLeadRows(leads = []) {
  return leads.map((lead) => ({
    ...lead,
    key: lead.id || `lead:${lead.createdAt || ""}:${lead.email || ""}:${lead.phone || ""}`,
    leadIds: lead.id ? [lead.id] : [],
    recordsCount: 1,
    name: formatProperName(lead.name) || "Cliente sin nombre"
  })).sort((left, right) => {
    return new Date(right.createdAt || 0) - new Date(left.createdAt || 0);
  });
}

function normalizeWhatsappPhone(value = "") {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57") && digits.length === 12) return digits;
  if (digits.length === 10 && digits.startsWith("3")) return `57${digits}`;
  return digits.length > 10 ? digits : "";
}

function encodeMailtoComponent(value = "") {
  return encodeURIComponent(String(value || "")).replace(/\+/g, "%2B");
}

function buildMailtoHref({ to = "", bcc = [], subject = "", body = "" } = {}) {
  const encodedTo = String(to || "").trim() ? encodeMailtoComponent(String(to || "").trim()) : "";
  const params = [];
  const bccList = bcc.map((email) => String(email || "").trim()).filter(Boolean);

  if (bccList.length) params.push(`bcc=${bccList.map(encodeMailtoComponent).join(",")}`);
  if (subject) params.push(`subject=${encodeMailtoComponent(subject)}`);
  if (body) params.push(`body=${encodeMailtoComponent(body)}`);

  return `mailto:${encodedTo}${params.length ? `?${params.join("&")}` : ""}`;
}

function buildLeadWhatsappLink(lead, message = "") {
  const phone = normalizeWhatsappPhone(lead?.phone);
  if (!phone) return "";
  const text = message || `Hola ${lead?.name || ""}, te saludamos de CONTARAE. Recibimos tus datos para ${lead?.serviceInterest || "asesoría contable"} y queremos ayudarte con tu solicitud.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function buildLeadMailtoLink(leads = [], subject = "CONTARAE - Información de tu solicitud", body = "") {
  const emails = leads.map((lead) => String(lead.email || "").trim()).filter(Boolean);
  if (!emails.length) return "";
  const mailBody = body || "Hola, te saludamos de CONTARAE. Queremos compartirte información relacionada con tu solicitud y quedamos atentos para ayudarte.";
  return buildMailtoHref({ bcc: emails, subject, body: mailBody });
}

function buildClientWhatsappLink(client, message = "") {
  const phone = normalizeWhatsappPhone(client?.phone);
  if (!phone) return "";
  const text = message || `Hola ${client?.name || ""}, te saludamos de CONTARAE. Queremos hacer seguimiento a tus servicios activos y resolver cualquier inquietud.`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

function buildLeadsCsv(leads = []) {
  const headers = ["id", "fecha", "nombre", "documento", "whatsapp", "correo", "servicio", "comentario", "autoriza_tratamiento", "autoriza_comunicaciones", "origen"];
  const escape = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = leads.map((lead) => [
    lead.id,
    lead.createdAt,
    lead.name,
    lead.documentNumber,
    lead.phone,
    lead.email,
    lead.serviceInterest,
    lead.comment,
    lead.treatmentConsent ? "SI" : "NO",
    lead.marketingConsent ? "SI" : "NO",
    lead.sourcePath || lead.sourceLabel
  ].map(escape).join(","));
  return [headers.join(","), ...rows].join("\n");
}

function csvEscape(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function buildCsv(headers = [], rows = []) {
  return [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => headers.map((header) => csvEscape(row[header])).join(","))
  ].join("\n");
}

function downloadCsvFile(filename, csvContent) {
  if (typeof document === "undefined") return;
  const blob = new Blob([`\uFEFF${csvContent}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadBlobFile(filename, blob) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function buildClientsCsv(clients = []) {
  const headers = ["nombre", "documento", "whatsapp", "correo", "solicitudes", "activas", "valor_servicios", "valor_pagado", "saldo_pendiente", "ultima_actualizacion"];
  return buildCsv(headers, clients.map((client) => ({
    nombre: client.name,
    documento: client.documentNumber,
    whatsapp: client.phone,
    correo: client.email,
    solicitudes: client.requests,
    activas: client.active,
    valor_servicios: formatMoney(client.totalAgreed),
    valor_pagado: formatMoney(client.totalPaid),
    saldo_pendiente: formatMoney(client.receivable),
    ultima_actualizacion: client.lastUpdatedAt
  })));
}

function buildServiceRequestsCsv(records = []) {
  const headers = ["referencia", "cliente", "tipo_documento", "documento", "whatsapp", "correo", "servicio", "tipo", "estado", "estado_pago", "costo_pactado", "valor_pagado", "saldo", "vencimiento", "documentos", "tareas", "tareas_pendientes", "tareas_vencidas", "comentarios", "creado", "actualizado"];
  return buildCsv(headers, records.map((record) => ({
    referencia: record.reference,
    cliente: formatProperName(record.clientName),
    tipo_documento: record.clientDocumentType || "",
    documento: record.clientDocumentNumber,
    whatsapp: record.clientPhone,
    correo: record.clientEmail,
    servicio: record.title,
    tipo: getServiceTypeLabel(record.serviceType),
    estado: getServiceStatusMeta(record.status).label,
    estado_pago: getServicePaymentMeta(record.paymentStatus).label,
    costo_pactado: record.agreedPrice,
    valor_pagado: record.amountPaid,
    saldo: record.balance,
    vencimiento: record.dueDate,
    documentos: record.documentsCount,
    tareas: record.tasksCount || 0,
    tareas_pendientes: record.pendingTasksCount || 0,
    tareas_vencidas: record.overdueTasksCount || 0,
    comentarios: record.comments || "",
    creado: record.createdAt,
    actualizado: record.updatedAt
  })));
}

function buildPaymentsCsv(payments = [], certificationRecords = []) {
  const headers = ["tipo", "referencia_pago", "referencia_solicitud", "cliente", "concepto", "estado", "valor", "metodo", "comprobante", "pagador", "soportes", "fecha", "anulado_el", "motivo_anulacion", "link"];
  const serviceRows = payments.map((payment) => ({
    tipo: payment.kind === "payment" ? "Pago solicitud" : "Link solicitud",
    referencia_pago: payment.reference,
    referencia_solicitud: payment.request?.reference || payment.serviceReference || "",
    cliente: formatProperName(payment.request?.clientName),
    concepto: payment.request?.title || getServiceTypeLabel(payment.request?.serviceType),
    estado: isVoidedServicePayment(payment) ? "anulado" : payment.status || "",
    valor: payment.amountLabel || formatMoney(payment.amount),
    metodo: payment.method || payment.source || "",
    comprobante: payment.transactionReference || "",
    pagador: payment.payerName || "",
    soportes: payment.supportFiles?.length || 0,
    fecha: payment.paidAt || payment.createdAt,
    anulado_el: payment.voidedAt || "",
    motivo_anulacion: payment.voidReason || "",
    link: payment.checkoutUrl || ""
  }));
  const certificationRows = certificationRecords.map((record) => ({
    tipo: "Certificación",
    referencia_pago: record.paymentReference || record.reference,
    referencia_solicitud: record.reference,
    cliente: formatProperName(record.customerName),
    concepto: record.destination || "Certificación de ingresos",
    estado: record.paymentStatus || record.certificationStatus,
    valor: record.fee || "$ 0",
    metodo: record.paymentMethod || "Wompi",
    comprobante: "",
    pagador: "",
    soportes: "",
    fecha: record.approvedAt || record.createdAt || record.updatedAt,
    anulado_el: "",
    motivo_anulacion: "",
    link: ""
  }));
  return buildCsv(headers, [...serviceRows, ...certificationRows]);
}

function buildCertificationsCsv(records = []) {
  const headers = ["referencia", "consecutivo", "cliente", "documento", "correo", "telefono", "destino", "entidad", "estado_certificacion", "estado_pago", "tarifa_base", "codigo_promocional", "aliado", "descuento_promocional", "tarifa", "comision_aliado_estimada", "soportes", "creado", "actualizado"];
  return buildCsv(headers, records.map((record) => ({
    referencia: record.reference,
    consecutivo: record.consecutive,
    cliente: formatProperName(record.customerName),
    documento: record.customerDocument,
    correo: record.customerEmail,
    telefono: record.customerPhone,
    destino: record.destination,
    entidad: record.entity,
    estado_certificacion: getStatusMeta(record.certificationStatus).label,
    estado_pago: getPaymentMeta(record.paymentStatus).label,
    tarifa_base: record.baseFee,
    codigo_promocional: record.promoCode,
    aliado: record.promoAllyName,
    descuento_promocional: record.promoDiscount,
    tarifa: record.fee,
    comision_aliado_estimada: record.promoCommissionEstimate,
    soportes: record.supportFilesCount || record.supportsCount || 0,
    creado: record.createdAt,
    actualizado: record.updatedAt
  })));
}

function normalizeComparableValue(field, value) {
  if (CERTIFICATE_CURRENCY_FIELDS.includes(field) || CERTIFICATE_TOTAL_FIELDS.includes(field)) {
    return String(parseCurrency(value));
  }
  if (field === "ingresos_eventuales_json") {
    return JSON.stringify(parseEventualIncomeRows(value));
  }
  return String(value || "").trim();
}

function buildReviewDraft(detail = null) {
  return {
    certificationStatus: detail?.summary?.certificationStatus || "en_revision",
    adminNotes: detail?.record?.adminNotes || "",
    certificateAdjustmentNote: detail?.record?.certificateAdjustmentNote || "",
    requestedDocumentsMessage: detail?.record?.requestedDocumentsMessage || ""
  };
}

function buildCertificateDraftState(source = {}) {
  return recalculateCertificateDerivedFields({
    nombre: source?.nombre || "",
    tipo_documento: source?.tipo_documento || "",
    numero_documento: source?.numero_documento || "",
    lugar_expedicion: source?.lugar_expedicion || "",
    correo: source?.correo || source?.email || "",
    telefono: source?.telefono || "",
    destino: source?.destino || "",
    entidad: source?.entidad || "",
    periodo: source?.periodo || "",
    ingresos_laborales: source?.ingresos_laborales || "",
    pensiones: source?.pensiones || "",
    dividendos: source?.dividendos || "",
    inversiones: source?.inversiones || "",
    arriendos: source?.arriendos || "",
    remesas: source?.remesas || "",
    otros_ingresos: source?.otros_ingresos || "",
    otros_descripcion: source?.otros_descripcion || "",
    [CERTIFICATE_CLARIFICATION_FIELD]: source?.[CERTIFICATE_CLARIFICATION_FIELD] || "",
    ingresos_eventuales_json: source?.ingresos_eventuales_json || "[]",
    periodo_meses: source?.periodo_meses || "",
    total_ingresos: source?.total_ingresos || "",
    total_ingresos_periodo: source?.total_ingresos_periodo || "",
    total_ingresos_eventuales: source?.total_ingresos_eventuales || "",
    total_ingresos_global_periodo: source?.total_ingresos_global_periodo || ""
  });
}

function createEmptyEventualIncome() {
  return { concept: "", value: "" };
}

function isCompleteEventualIncomeRow(row = {}) {
  return hasMeaningfulCurrencyValue(row.value) && String(row.concept || "").trim();
}

function parseEventualIncomeRows(rawValue) {
  try {
    const parsed = JSON.parse(String(rawValue || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        concept: String(row?.concept || ""),
        value: normalizeCurrencyInput(row?.value || row?.amount || "")
      }));
  } catch {
    return [];
  }
}

function serializeEventualIncomeRows(rows = []) {
  return JSON.stringify(
    rows
      .map((row) => ({
        concept: String(row?.concept || ""),
        value: normalizeCurrencyInput(row?.value || row?.amount || "")
      }))
  );
}

function recalculateCertificateDerivedFields(values = {}) {
  const monthlyTotal = CERTIFICATE_CURRENCY_FIELDS.reduce((sum, field) => sum + parseCurrency(values[field]), 0);
  const months = Number(String(values.periodo_meses || "").replace(/\D/g, "")) || 0;
  const eventualRows = parseEventualIncomeRows(values.ingresos_eventuales_json).filter(isCompleteEventualIncomeRow);
  const eventualTotal = eventualRows.reduce((sum, row) => sum + parseCurrency(row.value), 0);
  const recurringPeriodTotal = monthlyTotal * months;
  const globalPeriodTotal = recurringPeriodTotal + eventualTotal;

  return {
    ...values,
    total_ingresos: monthlyTotal ? normalizeCurrencyInput(monthlyTotal) : "",
    total_ingresos_periodo: recurringPeriodTotal ? normalizeCurrencyInput(recurringPeriodTotal) : "",
    total_ingresos_eventuales: eventualTotal ? normalizeCurrencyInput(eventualTotal) : "",
    total_ingresos_global_periodo: eventualTotal ? normalizeCurrencyInput(globalPeriodTotal) : ""
  };
}

function isFieldModified(originalValues = {}, draftValues = {}, field) {
  return normalizeComparableValue(field, originalValues?.[field]) !== normalizeComparableValue(field, draftValues?.[field]);
}

function recalculateCertificateTotal(values = {}) {
  return recalculateCertificateDerivedFields(values).total_ingresos;
}

function buildCertificateIncomePreview(values = {}) {
  const rows = CERTIFICATE_INCOME_LABELS
    .map(([field, label]) => ({
      label,
      value: String(values[field] || "").trim()
    }))
    .filter((item) => hasMeaningfulCurrencyValue(item.value));

  if (hasMeaningfulCurrencyValue(values.otros_ingresos) && String(values.otros_descripcion || "").trim()) {
    rows.push({
      label: "Detalle otros ingresos mensuales recurrentes",
      value: String(values.otros_descripcion || "").trim()
    });
  }

  return rows;
}

function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.en_revision;
}

function getPaymentMeta(status) {
  return PAYMENT_META[status] || PAYMENT_META.pending;
}

function buildSupportMessage(detail, customMessage) {
  const summary = detail?.summary || {};
  const certificateData = detail?.certificateData || {};
  const customerName = certificateData.nombre || summary.customerName || "";
  const base = [
    `Hola ${customerName},`,
    "",
    `Tu solicitud ${summary.consecutive ? `N° ${summary.consecutive}` : ""} de certificacion de ingresos en CONTARAE se encuentra en revision.`,
    "",
    customMessage ||
      "Para continuar necesitamos soportes adicionales o una aclaracion sobre la informacion reportada. Por favor responde este mensaje o envianos los documentos faltantes.",
    "",
    `Referencia: ${summary.reference || ""}`
  ]
    .filter(Boolean)
    .join("\n");

  return base;
}

function buildWhatsappLink(detail, customMessage) {
  const phone = detail?.contact?.whatsappPhone;
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildSupportMessage(detail, customMessage))}`;
}

function buildMailtoLink(detail, customMessage) {
  const email = detail?.contact?.email;
  if (!email) return "";
  const summary = detail?.summary || {};
  const subject = `CONTARAE | Documentacion adicional ${summary.consecutive ? `N° ${summary.consecutive}` : summary.reference || ""}`;
  return buildMailtoHref({ to: email, subject, body: buildSupportMessage(detail, customMessage) });
}

function buildDeliveryWhatsappLink(detail) {
  const phone = detail?.contact?.whatsappPhone;
  if (!phone) return "";
  const summary = detail?.summary || {};
  const certificateData = detail?.certificateData || {};
  const customerEmail = detail?.contact?.email;
  const customerName = certificateData.nombre || summary.customerName || "";
  const message = [
    `Hola ${customerName},`,
    "",
    `Tu certificación de ingresos de CONTARAE ${summary.consecutive ? `N° ${summary.consecutive}` : ""} ya fue emitida.`,
    customerEmail ? `La enviamos al correo registrado: ${customerEmail}.` : "La enviamos al correo registrado en la solicitud.",
    "",
    "Si necesitas apoyo para presentarla o verificar algún adjunto, puedes responder este mensaje."
  ]
    .filter(Boolean)
    .join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function normalizeServiceWhatsappPhone(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("57") && digits.length >= 12) return digits;
  if (digits.length === 10) return `57${digits}`;
  return digits;
}

function buildServiceRequestSummaryMessage(draft = {}, detail = null) {
  const balance = Math.max(parseCurrency(draft.agreedPrice) - parseCurrency(draft.amountPaid), 0);
  const clientName = String(draft.client?.name || "cliente").trim();
  const reference = draft.reference || detail?.reference || "pendiente de guardar";
  const serviceType = getServiceTypeLabel(draft.serviceType);
  const dueDate = draft.dueDate ? formatDateOnly(draft.dueDate) : "sin fecha de vencimiento definida";
  const documentsCount = detail?.documents?.length || 0;

  return [
    `Hola ${clientName},`,
    "",
    "Te compartimos el resumen de tu solicitud en CONTARAE:",
    "",
    `Referencia: ${reference}`,
    `Servicio: ${serviceType}`,
    `Asunto: ${draft.title || serviceType}`,
    `Estado: ${getServiceStatusMeta(draft.status).label}`,
    `Fecha de vencimiento: ${dueDate}`,
    `Costo pactado: ${draft.agreedPrice || "$ 0"}`,
    `Valor pagado: ${draft.amountPaid || "$ 0"}`,
    `Saldo pendiente: ${formatMoney(balance)}`,
    `Documentos cargados: ${documentsCount}`,
    "",
    "Si tienes documentos pendientes o necesitas hacer alguna aclaración, puedes responder este mensaje."
  ].join("\n");
}

function buildServiceWhatsappLink(draft = {}, detail = null, mode = "summary") {
  const phone = normalizeServiceWhatsappPhone(draft.client?.phone || detail?.client?.phone);
  if (!phone) return "";

  if (mode === "chat") {
    return `https://wa.me/${phone}`;
  }

  return `https://wa.me/${phone}?text=${encodeURIComponent(buildServiceRequestSummaryMessage(draft, detail))}`;
}

function buildServicePaymentWhatsappLink(draft = {}, paymentLink = null) {
  const phone = normalizeServiceWhatsappPhone(draft.client?.phone);
  if (!phone || !paymentLink?.checkoutUrl) return "";

  const message = [
    `Hola ${draft.client?.name || ""},`,
    "",
    "Te compartimos el link de pago de tu solicitud en CONTARAE:",
    "",
    `Referencia de solicitud: ${draft.reference || ""}`,
    `Servicio: ${draft.title || getServiceTypeLabel(draft.serviceType)}`,
    `Valor a pagar: ${paymentLink.amountLabel || paymentLink.amount || ""}`,
    `Link de pago: ${paymentLink.checkoutUrl}`,
    "",
    "Cuando el pago sea confirmado, el estado se actualizará automáticamente."
  ].join("\n");

  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function buildServiceTemplateMessage(draft = {}, detail = null, template = "documents") {
  const clientName = String(draft.client?.name || "cliente").trim();
  const reference = draft.reference || detail?.reference || "";
  const serviceTitle = draft.title || getServiceTypeLabel(draft.serviceType);
  const balance = Math.max(parseCurrency(draft.agreedPrice) - parseCurrency(draft.amountPaid), 0);
  const messages = {
    documents: [
      `Hola ${clientName},`,
      "",
      `Para continuar con tu solicitud ${reference ? `(${reference}) ` : ""}de ${serviceTitle}, necesitamos que nos compartas los documentos o aclaraciones pendientes.`,
      "",
      "Puedes enviarlos por este mismo chat para avanzar con la revisión."
    ],
    payment: [
      `Hola ${clientName},`,
      "",
      `Tu solicitud ${reference ? `(${reference}) ` : ""}registra un saldo pendiente de ${formatMoney(balance)}.`,
      "",
      "Si deseas, podemos enviarte el link de pago actualizado o revisar un medio alternativo."
    ],
    progress: [
      `Hola ${clientName},`,
      "",
      `Te confirmamos que tu solicitud ${reference ? `(${reference}) ` : ""}se encuentra en proceso.`,
      "",
      "Te estaremos informando cualquier novedad o documento adicional requerido."
    ],
    final: [
      `Hola ${clientName},`,
      "",
      `Tu servicio ${reference ? `(${reference}) ` : ""}ha sido finalizado por CONTARAE.`,
      "",
      "Quedamos atentos si necesitas soporte adicional o un nuevo servicio."
    ]
  };

  return (messages[template] || messages.documents).join("\n");
}

function buildServiceTemplateWhatsappLink(draft = {}, detail = null, template = "documents") {
  const phone = normalizeServiceWhatsappPhone(draft.client?.phone || detail?.client?.phone);
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(buildServiceTemplateMessage(draft, detail, template))}`;
}

function buildServiceTemplateMailtoLink(draft = {}, detail = null, template = "documents") {
  const email = draft.client?.email || detail?.client?.email;
  if (!email) return "";
  return buildMailtoHref({
    to: email,
    subject: `CONTARAE | ${draft.reference || "Solicitud"} - ${draft.title || getServiceTypeLabel(draft.serviceType)}`,
    body: buildServiceTemplateMessage(draft, detail, template)
  });
}

function Badge({ children, meta }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "7px 12px",
        borderRadius: 999,
        background: meta.bg,
        color: meta.tone,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: ".4px",
        fontFamily: F
      }}
    >
      {children}
    </span>
  );
}

function InfoTile({ label, value }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: 18,
        background: "#fff",
        border: "1px solid rgba(37,99,235,.10)"
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "1.2px", fontWeight: 800, color: "#64748B", marginBottom: 6, fontFamily: F }}>
        {label}
      </div>
      <div style={{ fontSize: 15, lineHeight: 1.5, color: "#0F172A", fontFamily: F, fontWeight: 700 }}>
        {value || "Sin dato"}
      </div>
    </div>
  );
}

function ClientTimeline({ items = [] }) {
  if (!items.length) {
    return (
      <div style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.7 }}>
        Aún no hay actividad registrada para mostrar.
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {items.map((item, index) => (
        <div key={`${item.date}-${item.title}-${index}`} style={{ display: "grid", gridTemplateColumns: "18px minmax(0,1fr)", gap: 10, alignItems: "start" }}>
          <span style={{ width: 10, height: 10, borderRadius: 999, background: item.tone || "#2563EB", marginTop: 7, boxShadow: `0 0 0 4px ${item.bg || "rgba(37,99,235,.10)"}` }} />
          <div style={{ paddingBottom: 10, borderBottom: "1px solid rgba(37,99,235,.08)" }}>
            <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 900, lineHeight: 1.4 }}>{item.title}</div>
            {item.note ? <div style={{ fontFamily: F, color: "#52647F", fontSize: 13, lineHeight: 1.6, marginTop: 3 }}>{item.note}</div> : null}
            <div style={{ fontFamily: F, color: "#94A3B8", fontSize: 12, marginTop: 5 }}>{formatDate(item.date)}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ModuleNav({ activeModule, counts, onChange }) {
  return (
    <div className="admin-module-nav" style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <label style={{ display: "grid", gap: 4, minWidth: 220 }}>
        <span style={{ fontSize: 10, letterSpacing: "1.4px", fontWeight: 900, color: "#64748B", fontFamily: F }}>IR A MÓDULO</span>
        <select
          value={activeModule}
          onChange={(event) => onChange(event.target.value)}
          style={{
            width: "100%",
            padding: "10px 34px 10px 13px",
            borderRadius: 999,
            border: "1px solid rgba(37,99,235,.16)",
            background: "#fff",
            color: "#0B1D3A",
            fontFamily: F,
            fontWeight: 900,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 10px 26px rgba(15,23,42,.06)"
          }}
          aria-label="Seleccionar módulo del panel"
        >
          {ADMIN_MODULES.map((module) => {
            const count = counts?.[module.id];
            return (
              <option key={module.id} value={module.id}>
                {module.label}{typeof count === "number" ? ` (${count})` : ""}
              </option>
            );
          })}
        </select>
      </label>
    </div>
  );
}

const DASHBOARD_PERIOD_OPTIONS = [
  { value: "today", label: "Hoy" },
  { value: "week", label: "Semana" },
  { value: "month", label: "Mes" },
  { value: "year", label: "Año" },
  { value: "all", label: "Todo" }
];

function toDateString(value) {
  if (!value) return "";
  const raw = String(value).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : "";
}

function parseDashboardDate(value) {
  const raw = toDateString(value);
  if (!raw) return null;
  const date = new Date(`${raw}T00:00:00-05:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function addDaysToDateString(value, days) {
  const date = parseDashboardDate(value);
  if (!date) return value;
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function getDashboardPeriodRange(period, today = getTodayDateString()) {
  const current = parseDashboardDate(today) || new Date();
  const end = toDateString(today);
  if (period === "all") return { start: "", end: "", label: "histórico completo" };
  if (period === "today") return { start: end, end, label: "hoy" };
  if (period === "week") {
    const day = current.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    return { start: addDaysToDateString(end, mondayOffset), end, label: "esta semana" };
  }
  if (period === "year") {
    return { start: `${end.slice(0, 4)}-01-01`, end, label: "este año" };
  }
  return { start: `${end.slice(0, 7)}-01`, end, label: "este mes" };
}

function getPreviousDashboardRange(range, period) {
  if (!range?.start || !range?.end || period === "all") return { start: "", end: "" };
  if (period === "today") {
    const previous = addDaysToDateString(range.start, -1);
    return { start: previous, end: previous };
  }
  if (period === "week") {
    return { start: addDaysToDateString(range.start, -7), end: addDaysToDateString(range.end, -7) };
  }
  if (period === "year") {
    const year = Number(range.start.slice(0, 4)) - 1;
    return { start: `${year}-01-01`, end: `${year}-12-31` };
  }
  const [year, month] = range.start.split("-").map(Number);
  const previousMonth = new Date(Date.UTC(year, month - 2, 1, 12));
  const previousYear = previousMonth.getUTCFullYear();
  const previousMonthNumber = previousMonth.getUTCMonth() + 1;
  const start = `${previousYear}-${String(previousMonthNumber).padStart(2, "0")}-01`;
  const lastDay = new Date(Date.UTC(previousYear, previousMonthNumber, 0, 12)).getUTCDate();
  return { start, end: `${previousYear}-${String(previousMonthNumber).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}` };
}

function isWithinDashboardRange(value, range) {
  if (!range?.start && !range?.end) return true;
  const date = toDateString(value);
  if (!date) return false;
  if (range.start && date < range.start) return false;
  if (range.end && date > range.end) return false;
  return true;
}

function getDashboardRecordDate(record = {}) {
  return record.createdAt || record.updatedAt || record.dueDate || "";
}

function getTrendText(current, previous, period) {
  if (period === "all") return "Vista histórica";
  if (!previous && !current) return "Sin movimiento previo";
  if (!previous) return "Nuevo movimiento";
  const diff = current - previous;
  const pct = Math.round((diff / Math.max(previous, 1)) * 100);
  if (diff === 0) return "Sin variación";
  return `${diff > 0 ? "+" : ""}${pct}% vs período anterior`;
}

function getRequestBalance(record = {}) {
  return Math.max(parseCurrency(record.agreedPrice) - parseCurrency(record.amountPaid), 0);
}

function getMonthKeyOffset(baseDate, offset) {
  const date = parseDashboardDate(`${toDateString(baseDate).slice(0, 7)}-01`) || new Date();
  date.setMonth(date.getMonth() + offset);
  return date.toISOString().slice(0, 7);
}

function getShortMonthLabel(monthKey) {
  const [year, month] = String(monthKey || "").split("-").map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat("es-CO", {
    month: "short",
    timeZone: "America/Bogota"
  }).format(new Date(Date.UTC(year, month - 1, 1, 12)));
}

function buildDashboardTimeline({ serviceRecords = [], payments = [], leads = [], certifications = [] } = {}) {
  const serviceItems = serviceRecords.map((record) => ({
    type: "solicitudes",
    typeLabel: "Solicitud",
    date: record.updatedAt || record.createdAt || record.dueDate,
    title: record.title || getServiceTypeLabel(record.serviceType),
    note: `${formatProperName(record.clientName) || "Cliente sin nombre"} · ${getServiceStateSummary(record)}`,
    tone: "#1D4ED8",
    bg: "rgba(37,99,235,.10)",
    reference: record.reference
  }));
  const paymentItems = payments
    .filter((payment) => payment.kind === "payment")
    .map((payment) => ({
      type: "pagos",
      typeLabel: "Pago",
      date: payment.paidAt || payment.createdAt,
      title: isVoidedServicePayment(payment) ? "Pago anulado" : "Pago registrado",
      note: `${payment.amount || "$ 0"} · ${payment.method || payment.source || "Medio sin dato"} · ${payment.serviceReference || payment.reference || ""}`,
      tone: isVoidedServicePayment(payment) ? "#B45309" : "#15803D",
      bg: isVoidedServicePayment(payment) ? "rgba(245,158,11,.14)" : "rgba(34,197,94,.12)",
      reference: payment.serviceReference || payment.reference || ""
    }));
  const leadItems = leads.map((lead) => ({
    type: "potenciales",
    typeLabel: "Cliente potencial",
    date: lead.createdAt,
    title: "Cliente potencial",
    note: `${formatProperName(lead.name) || "Cliente sin nombre"} · ${lead.serviceInterest || "Servicio por definir"}`,
    tone: "#7C3AED",
    bg: "rgba(124,58,237,.10)",
    reference: lead.documentNumber || lead.email || lead.phone || ""
  }));
  const certificationItems = certifications.map((record) => ({
    type: "certificaciones",
    typeLabel: "Certificación",
    date: record.updatedAt || record.approvedAt || record.createdAt,
    title: "Certificación",
    note: `${formatProperName(record.customerName) || "Cliente sin nombre"} · ${getStatusMeta(record.certificationStatus).label}`,
    tone: "#C2410C",
    bg: "rgba(249,115,22,.12)",
    reference: record.consecutive ? `N° ${record.consecutive}` : record.reference
  }));

  return [...serviceItems, ...paymentItems, ...leadItems, ...certificationItems]
    .filter((item) => item.date)
    .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));
}

function buildDashboardActivityCsv(items = []) {
  const headers = ["fecha", "tipo", "titulo", "detalle", "referencia"];
  return buildCsv(headers, items.map((item) => ({
    fecha: item.date,
    tipo: item.typeLabel || item.type,
    titulo: item.title,
    detalle: item.note,
    referencia: item.reference || ""
  })));
}

function StatCard({ label, value, note, tone = "#1D4ED8", trend, compact = false }) {
  return (
    <section style={{ padding: compact ? 16 : 18, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 16px 34px rgba(15,23,42,.05)" }}>
      <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.2px", fontWeight: 900, color: "#64748B", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: FH, color: tone, fontSize: 30, lineHeight: 1.1, fontWeight: 700 }}>{value}</div>
      {note ? <div style={{ marginTop: 8, fontFamily: F, color: "#52647F", fontSize: 13, lineHeight: 1.6 }}>{note}</div> : null}
      {trend ? <div style={{ marginTop: 9, fontFamily: F, color: tone, fontSize: 12, fontWeight: 900 }}>{trend}</div> : null}
    </section>
  );
}

function ProgressRow({ label, value, amount, max, tone = "#1D4ED8" }) {
  const percent = max > 0 ? Math.max(4, Math.min(100, Math.round((value / max) * 100))) : 0;
  return (
    <div style={{ display: "grid", gap: 7 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, fontFamily: F, fontSize: 13, color: "#334155", fontWeight: 800 }}>
        <span>{label}</span>
        <span>{amount}</span>
      </div>
      <div style={{ height: 9, borderRadius: 999, background: "rgba(37,99,235,.08)", overflow: "hidden" }}>
        <div style={{ width: `${percent}%`, height: "100%", borderRadius: 999, background: tone }} />
      </div>
    </div>
  );
}

function DashboardPanel({ title, eyebrow, children, action }) {
  return (
    <section style={{ padding: 22, borderRadius: 26, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "start", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          {eyebrow ? <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 5 }}>{eyebrow}</div> : null}
          <h2 style={{ margin: 0, fontFamily: FH, fontSize: 24, color: "#0B1D3A" }}>{title}</h2>
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function EmptyDashboardNote({ children }) {
  return (
    <div style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.7, fontSize: 13 }}>
      {children}
    </div>
  );
}

function ActivityPulseCard({ stats = [], highlights = [], onOpenLog }) {
  return (
    <DashboardPanel
      eyebrow="ACTIVIDAD"
      title="Pulso operativo"
      action={(
        <button type="button" onClick={onOpenLog} style={{ padding: "10px 13px", borderRadius: 14, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
          Ver bitácora
        </button>
      )}
    >
      <div className="admin-activity-stat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginBottom: 14 }}>
        {stats.map((item) => (
          <div key={item.label} style={{ padding: 12, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
            <div style={{ fontFamily: F, fontSize: 10, letterSpacing: "1px", color: "#64748B", fontWeight: 900 }}>{item.label}</div>
            <div style={{ fontFamily: FH, color: item.tone, fontSize: 24, marginTop: 4 }}>{item.value}</div>
          </div>
        ))}
      </div>
      {highlights.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {highlights.slice(0, 3).map((item, index) => (
            <div key={`${item.title}-${item.date}-${index}`} style={{ display: "grid", gridTemplateColumns: "10px minmax(0,1fr)", gap: 10, alignItems: "start", padding: 10, borderRadius: 16, background: "#fff", border: "1px solid rgba(37,99,235,.08)" }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: item.tone || "#2563EB", marginTop: 6 }} />
              <div>
                <div style={{ fontFamily: F, fontSize: 13, color: "#0F172A", fontWeight: 900, lineHeight: 1.35 }}>{item.title}</div>
                <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.55 }}>{item.note}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyDashboardNote>No hay alertas ni movimientos recientes para destacar.</EmptyDashboardNote>
      )}
    </DashboardPanel>
  );
}

function ActivityLogDialog({ open, items = [], onClose }) {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const term = search.trim().toLowerCase();
  const filteredItems = items.filter((item) => {
    if (filter !== "all" && item.type !== filter) return false;
    if (!term) return true;
    return [item.typeLabel, item.title, item.note, item.reference, item.date].join(" ").toLowerCase().includes(term);
  });

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.62)", zIndex: 16000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <section className="admin-modal-card" style={{ width: "min(980px,100%)", maxHeight: "90vh", overflowY: "auto", padding: 22, borderRadius: 28, background: "rgba(255,255,255,.98)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 30px 80px rgba(15,23,42,.24)" }} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "start", marginBottom: 16 }}>
          <div>
            <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.5px", color: "#1D4ED8", fontWeight: 900, marginBottom: 5 }}>BITÁCORA OPERATIVA</div>
            <h2 style={{ margin: 0, fontFamily: FH, color: "#0B1D3A", fontSize: 34, lineHeight: 1.08 }}>Actividad completa</h2>
            <div style={{ marginTop: 8, fontFamily: F, color: "#64748B", fontSize: 13, lineHeight: 1.6 }}>{filteredItems.length} movimiento(s) visibles.</div>
          </div>
          <button type="button" onClick={onClose} style={{ width: 44, height: 44, borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#0B1D3A", fontFamily: F, fontWeight: 900, cursor: "pointer" }} aria-label="Cerrar bitácora">
            X
          </button>
        </div>

        <div className="admin-request-filter-grid" style={{ display: "grid", gridTemplateColumns: "minmax(220px,1fr) minmax(180px,240px) auto", gap: 10, marginBottom: 16 }}>
          <input style={inputStyle} value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por cliente, referencia o detalle" />
          <select style={inputStyle} value={filter} onChange={(event) => setFilter(event.target.value)}>
            <option value="all">Todos los movimientos</option>
            <option value="solicitudes">Solicitudes</option>
            <option value="pagos">Pagos</option>
            <option value="certificaciones">Certificaciones</option>
            <option value="potenciales">Clientes potenciales</option>
          </select>
          <button type="button" onClick={() => downloadCsvFile(`bitacora-contarae-${new Date().toISOString().slice(0, 10)}.csv`, buildDashboardActivityCsv(filteredItems))} disabled={!filteredItems.length} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: filteredItems.length ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "#CBD5E1", color: "#fff", fontFamily: F, fontWeight: 900, cursor: filteredItems.length ? "pointer" : "not-allowed" }}>
            Exportar Excel
          </button>
        </div>

        {filteredItems.length ? (
          <ClientTimeline items={filteredItems} />
        ) : (
          <EmptyDashboardNote>No se encontraron movimientos con los filtros actuales.</EmptyDashboardNote>
        )}
      </section>
    </div>,
    document.body
  );
}

function OperationsDashboard({
  summary,
  serviceRecords,
  certificationRecords = [],
  clientLeads = [],
  payments = [],
  loading,
  error,
  onOpenRequest,
  onOpenModule,
  onNewRequest
}) {
  const today = getTodayDateString();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(today);
  const [period, setPeriod] = useState("month");
  const [activityLogOpen, setActivityLogOpen] = useState(false);
  const range = useMemo(() => getDashboardPeriodRange(period, today), [period, today]);
  const previousRange = useMemo(() => getPreviousDashboardRange(range, period), [range, period]);
  const calendar = useMemo(() => buildMonthlyDueCalendar(serviceRecords, today), [serviceRecords, today]);
  const selectedDayRequests = serviceRecords.filter((record) => String(record.dueDate || "").slice(0, 10) === selectedCalendarDate);
  const certificationPending = certificationRecords.filter((record) => ["en_revision", "documentos_solicitados"].includes(record.certificationStatus)).length;
  const currentPayments = payments.filter((payment) => payment.kind === "payment" && isAppliedServicePayment(payment) && isWithinDashboardRange(payment.paidAt || payment.createdAt, range));
  const previousPayments = payments.filter((payment) => payment.kind === "payment" && isAppliedServicePayment(payment) && isWithinDashboardRange(payment.paidAt || payment.createdAt, previousRange));
  const currentPaidAmount = currentPayments.reduce((sum, payment) => sum + parseCurrency(payment.amount), 0);
  const previousPaidAmount = previousPayments.reduce((sum, payment) => sum + parseCurrency(payment.amount), 0);
  const currentLeads = clientLeads.filter((lead) => isWithinDashboardRange(lead.createdAt, range));
  const previousLeads = clientLeads.filter((lead) => isWithinDashboardRange(lead.createdAt, previousRange));
  const pendingTasks = serviceRecords.reduce((sum, record) => sum + Number(record.pendingTasksCount || 0), 0);
  const overdueTasks = serviceRecords.reduce((sum, record) => sum + Number(record.overdueTasksCount || 0), 0);
  const currentServiceRecords = serviceRecords.filter((record) => isWithinDashboardRange(getDashboardRecordDate(record), range));
  const previousServiceRecords = serviceRecords.filter((record) => isWithinDashboardRange(getDashboardRecordDate(record), previousRange));
  const currentSalesAmount = currentServiceRecords
    .reduce((sum, record) => sum + parseCurrency(record.agreedPrice), 0);
  const previousSalesAmount = previousServiceRecords
    .reduce((sum, record) => sum + parseCurrency(record.agreedPrice), 0);
  const paidServiceCount = serviceRecords.filter((record) => parseCurrency(record.amountPaid) > 0).length;
  const finishedServiceCount = serviceRecords.filter((record) => record.status === "finalizado").length;
  const ticketAverage = currentServiceRecords.length ? currentSalesAmount / currentServiceRecords.length : 0;
  const paymentRate = summary.totalSales === "$ 0" ? 0 : Math.round((parseCurrency(summary.totalPaid) / Math.max(parseCurrency(summary.totalSales), 1)) * 100);
  const appliedPayments = payments.filter((payment) => payment.kind === "payment" && isAppliedServicePayment(payment));
  const voidedPayments = payments.filter((payment) => payment.kind === "payment" && isVoidedServicePayment(payment));
  const activeRecords = serviceRecords.filter((record) => !["finalizado", "cancelado"].includes(record.status));
  const receivableRecords = serviceRecords
    .map((record) => ({ ...record, balanceAmount: getRequestBalance(record), dueDays: daysUntilDue(record.dueDate) }))
    .filter((record) => record.balanceAmount > 0 && record.status !== "cancelado");
  const traffic = [
    {
      label: "Pagado",
      count: serviceRecords.filter((record) => getRequestBalance(record) <= 0 && parseCurrency(record.agreedPrice) > 0).length,
      amount: serviceRecords.reduce((sum, record) => getRequestBalance(record) <= 0 ? sum + parseCurrency(record.agreedPrice) : sum, 0),
      tone: "#15803D"
    },
    {
      label: "Pago parcial",
      count: serviceRecords.filter((record) => getRequestBalance(record) > 0 && parseCurrency(record.amountPaid) > 0).length,
      amount: serviceRecords.reduce((sum, record) => getRequestBalance(record) > 0 && parseCurrency(record.amountPaid) > 0 ? sum + getRequestBalance(record) : sum, 0),
      tone: "#B45309"
    },
    {
      label: "Pendiente",
      count: serviceRecords.filter((record) => getRequestBalance(record) > 0 && parseCurrency(record.amountPaid) <= 0).length,
      amount: serviceRecords.reduce((sum, record) => getRequestBalance(record) > 0 && parseCurrency(record.amountPaid) <= 0 ? sum + getRequestBalance(record) : sum, 0),
      tone: "#C2410C"
    },
    {
      label: "Vencido",
      count: receivableRecords.filter((record) => record.dueDays !== null && record.dueDays < 0).length,
      amount: receivableRecords.reduce((sum, record) => record.dueDays !== null && record.dueDays < 0 ? sum + record.balanceAmount : sum, 0),
      tone: "#DC2626"
    }
  ];
  const maxTrafficAmount = Math.max(...traffic.map((item) => item.amount), 1);
  const agingBuckets = [
    { label: "Al día / sin vencer", tone: "#15803D", records: receivableRecords.filter((record) => record.dueDays === null || record.dueDays >= 0) },
    { label: "1 a 7 días", tone: "#B45309", records: receivableRecords.filter((record) => record.dueDays !== null && record.dueDays < 0 && Math.abs(record.dueDays) <= 7) },
    { label: "8 a 30 días", tone: "#C2410C", records: receivableRecords.filter((record) => record.dueDays !== null && record.dueDays < -7 && Math.abs(record.dueDays) <= 30) },
    { label: "+30 días", tone: "#DC2626", records: receivableRecords.filter((record) => record.dueDays !== null && record.dueDays < -30) }
  ].map((bucket) => ({
    ...bucket,
    amount: bucket.records.reduce((sum, record) => sum + record.balanceAmount, 0)
  }));
  const maxAgingAmount = Math.max(...agingBuckets.map((item) => item.amount), 1);
  const monthSeries = [-5, -4, -3, -2, -1, 0].map((offset) => {
    const monthKey = getMonthKeyOffset(today, offset);
    const sales = serviceRecords
      .filter((record) => String(record.createdAt || record.updatedAt || "").startsWith(monthKey))
      .reduce((sum, record) => sum + parseCurrency(record.agreedPrice), 0);
    const paid = payments
      .filter((payment) => payment.kind === "payment" && isAppliedServicePayment(payment) && String(payment.paidAt || payment.createdAt || "").startsWith(monthKey))
      .reduce((sum, payment) => sum + parseCurrency(payment.amount), 0);
    return { monthKey, label: getShortMonthLabel(monthKey), sales, paid };
  });
  const maxMonthAmount = Math.max(...monthSeries.flatMap((item) => [item.sales, item.paid]), 1);
  const byTypeDetailed = SERVICE_TYPES.map(([type, label]) => {
    const records = serviceRecords.filter((record) => record.serviceType === type);
    return {
      type,
      label,
      count: records.length,
      amount: records.reduce((sum, record) => sum + parseCurrency(record.agreedPrice), 0)
    };
  }).filter((item) => item.count > 0).sort((left, right) => right.amount - left.amount);
  const maxTypeAmount = Math.max(...byTypeDetailed.map((item) => item.amount), 1);
  const funnel = [
    { label: "Potenciales", value: clientLeads.length, note: "Leads web", tone: "#7C3AED" },
    { label: "Solicitudes", value: serviceRecords.length, note: "Servicios creados", tone: "#1D4ED8" },
    { label: "Con pago", value: paidServiceCount, note: "Con recaudo", tone: "#15803D" },
    { label: "Finalizados", value: finishedServiceCount, note: "Cerrados", tone: "#0F766E" }
  ];
  const urgentRecords = [
    ...activeRecords.filter((record) => {
      const days = daysUntilDue(record.dueDate);
      return days !== null && days < 0;
    }).map((record) => ({ ...record, priorityLabel: "Vencida", priorityTone: "#DC2626" })),
    ...activeRecords.filter((record) => {
      const days = daysUntilDue(record.dueDate);
      return days !== null && days >= 0 && days <= 3;
    }).map((record) => ({ ...record, priorityLabel: "Próxima", priorityTone: "#B45309" })),
    ...receivableRecords.filter((record) => record.balanceAmount > 0).map((record) => ({ ...record, priorityLabel: "Cartera", priorityTone: "#C2410C" })),
    ...activeRecords.filter((record) => Number(record.pendingTasksCount || 0) > 0).map((record) => ({ ...record, priorityLabel: "Tareas", priorityTone: "#7C3AED" }))
  ].filter((record, index, list) => list.findIndex((item) => item.reference === record.reference) === index).slice(0, 6);
  const timeline = buildDashboardTimeline({ serviceRecords, payments, leads: clientLeads, certifications: certificationRecords });
  const activityStats = [
    { label: "Solicitudes", value: timeline.filter((item) => item.type === "solicitudes").length, tone: "#1D4ED8" },
    { label: "Pagos", value: timeline.filter((item) => item.type === "pagos").length, tone: "#15803D" },
    { label: "Clientes", value: timeline.filter((item) => item.type === "potenciales").length, tone: "#7C3AED" },
    { label: "Certif.", value: timeline.filter((item) => item.type === "certificaciones").length, tone: "#C2410C" }
  ];
  const activityHighlights = urgentRecords.length
    ? urgentRecords.slice(0, 3).map((record) => ({
      date: record.dueDate || record.updatedAt || record.createdAt,
      title: `${record.priorityLabel}: ${record.title || getServiceTypeLabel(record.serviceType)}`,
      note: `${formatProperName(record.clientName) || "Cliente sin nombre"} · ${record.balanceAmount ? formatMoney(record.balanceAmount) : getServiceStateSummary(record)}`,
      tone: record.priorityTone
    }))
    : timeline.slice(0, 3);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {error ? (
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 700 }}>
          {error}
        </div>
      ) : null}
      <section style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: 18, borderRadius: 24, background: "rgba(255,255,255,.92)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 18px 42px rgba(15,23,42,.06)" }} className="admin-dashboard-command">
        <div>
          <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.4px", fontWeight: 900, color: "#1D4ED8", marginBottom: 5 }}>PANEL EJECUTIVO</div>
          <div style={{ fontFamily: FH, color: "#0B1D3A", fontSize: 25, lineHeight: 1.2 }}>Indicadores de {range.label}</div>
          <div style={{ fontFamily: F, color: "#64748B", fontSize: 13, lineHeight: 1.6, marginTop: 5 }}>Ventas, recaudo, cartera, agenda y operación en una sola vista.</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }} className="admin-dashboard-actions">
          <select value={period} onChange={(event) => setPeriod(event.target.value)} style={{ ...inputStyle, width: 150, fontWeight: 900, cursor: "pointer" }} aria-label="Seleccionar periodo del dashboard">
            {DASHBOARD_PERIOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button type="button" onClick={onNewRequest} style={{ padding: "12px 14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
            Nueva solicitud
          </button>
          <button type="button" onClick={() => onOpenModule("pagos")} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
            Ver pagos
          </button>
        </div>
      </section>
      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
        <StatCard label="VENTAS DEL PERÍODO" value={loading ? "..." : formatMoney(currentSalesAmount)} tone="#1D4ED8" note={`${currentServiceRecords.length} solicitud(es) creada(s).`} trend={getTrendText(currentSalesAmount, previousSalesAmount, period)} />
        <StatCard label="RECAUDO DEL PERÍODO" value={loading ? "..." : formatMoney(currentPaidAmount)} tone="#15803D" note={`${currentPayments.length} pago(s) aplicado(s).`} trend={getTrendText(currentPaidAmount, previousPaidAmount, period)} />
        <StatCard label="CUENTAS POR COBRAR" value={loading ? "..." : summary.receivables} tone="#0F766E" note={`${summary.pendingPaymentCount} solicitud(es) con pago pendiente o parcial.`} />
        <StatCard label="TICKET PROMEDIO" value={loading ? "..." : formatMoney(ticketAverage)} tone="#7C3AED" note="Promedio de venta pactada por servicio del período." />
        <StatCard label="SOLICITUDES ACTIVAS" value={loading ? "..." : summary.activeCount} note="Servicios generales, no certificaciones." />
        <StatCard label="VENCIDAS" value={loading ? "..." : summary.overdueCount} tone="#DC2626" note="Requieren atención prioritaria." />
        <StatCard label="PRÓXIMAS A VENCER" value={loading ? "..." : summary.dueSoonCount} tone="#B45309" note="Vencen hoy o en máximo 3 días." />
        <StatCard label="CLIENTES NUEVOS" value={loading ? "..." : currentLeads.length} tone="#7C3AED" note="Leads captados desde la web." trend={getTrendText(currentLeads.length, previousLeads.length, period)} />
        <StatCard label="CERTIFICACIONES" value={loading ? "..." : certificationPending} tone="#C2410C" note="Pendientes o con documentos solicitados." />
        <StatCard label="TAREAS ABIERTAS" value={loading ? "..." : pendingTasks} tone="#B45309" note={`${overdueTasks} tarea(s) vencida(s).`} />
        <StatCard label="TASA DE PAGO" value={loading ? "..." : `${paymentRate}%`} tone="#15803D" note={`${formatMoney(parseCurrency(summary.totalPaid))} recaudado sobre ${summary.totalSales}.`} />
        <StatCard label="PAGOS ANULADOS" value={loading ? "..." : voidedPayments.length} tone="#C2410C" note={`${appliedPayments.length} pago(s) aplicado(s) en histórico.`} />
      </div>

      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "stretch" }}>
        <DashboardPanel eyebrow="SALUD COMERCIAL" title="Embudo de servicios">
          <div className="admin-funnel-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
            {funnel.map((stage, index) => {
              const previousValue = index === 0 ? stage.value : Math.max(funnel[index - 1].value, 1);
              const conversion = index === 0 ? 100 : Math.round((stage.value / previousValue) * 100);
              return (
                <div key={stage.label} style={{ padding: 14, borderRadius: 18, border: "1px solid rgba(37,99,235,.10)", background: "#F8FBFF" }}>
                  <div style={{ fontFamily: F, fontSize: 11, color: "#64748B", fontWeight: 900, letterSpacing: "1px" }}>{stage.label}</div>
                  <div style={{ fontFamily: FH, color: stage.tone, fontSize: 28, marginTop: 5 }}>{loading ? "..." : stage.value}</div>
                  <div style={{ fontFamily: F, color: "#52647F", fontSize: 12, lineHeight: 1.5 }}>{stage.note}</div>
                  <div style={{ marginTop: 10, height: 8, borderRadius: 999, background: "rgba(37,99,235,.08)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(8, Math.min(100, conversion))}%`, height: "100%", borderRadius: 999, background: stage.tone }} />
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardPanel>

        <DashboardPanel eyebrow="CARTERA" title="Semáforo financiero">
          <div style={{ display: "grid", gap: 12 }}>
            {traffic.map((item) => (
              <ProgressRow key={item.label} label={`${item.label} · ${item.count}`} value={item.amount} amount={formatMoney(item.amount)} max={maxTrafficAmount} tone={item.tone} />
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        <DashboardPanel eyebrow="TENDENCIA" title="Ventas vs recaudo">
          <div style={{ display: "grid", gap: 12 }}>
            {monthSeries.map((item) => (
              <div key={item.monthKey} style={{ display: "grid", gridTemplateColumns: "48px minmax(0,1fr)", gap: 10, alignItems: "center" }}>
                <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", fontWeight: 900, textTransform: "capitalize" }}>{item.label}</div>
                <div style={{ display: "grid", gap: 5 }}>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(37,99,235,.08)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(3, Math.round((item.sales / maxMonthAmount) * 100))}%`, height: "100%", background: "#1D4ED8", borderRadius: 999 }} />
                  </div>
                  <div style={{ height: 8, borderRadius: 999, background: "rgba(21,128,61,.08)", overflow: "hidden" }}>
                    <div style={{ width: `${Math.max(3, Math.round((item.paid / maxMonthAmount) * 100))}%`, height: "100%", background: "#15803D", borderRadius: 999 }} />
                  </div>
                </div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontFamily: F, fontSize: 12, color: "#52647F", fontWeight: 800 }}>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: "#1D4ED8", marginRight: 6 }} />Ventas</span>
              <span><span style={{ display: "inline-block", width: 10, height: 10, borderRadius: 999, background: "#15803D", marginRight: 6 }} />Recaudo</span>
            </div>
          </div>
        </DashboardPanel>

        <DashboardPanel eyebrow="CARTERA POR EDAD" title="Antigüedad de saldos">
          <div style={{ display: "grid", gap: 12 }}>
            {agingBuckets.map((item) => (
              <ProgressRow key={item.label} label={`${item.label} · ${item.records.length}`} value={item.amount} amount={formatMoney(item.amount)} max={maxAgingAmount} tone={item.tone} />
            ))}
          </div>
        </DashboardPanel>
      </div>

      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: 18, alignItems: "start" }}>
        <DashboardPanel
          eyebrow="CALENDARIO Y ALERTAS"
          title={calendar.label}
          action={(
            <button type="button" onClick={() => onOpenModule("solicitudes")} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
              Ver solicitudes
            </button>
          )}
        >
          <div className="admin-calendar-weekdays" style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 8, marginBottom: 8 }}>
            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((day) => (
              <div key={day} style={{ fontFamily: F, color: "#64748B", fontSize: 11, fontWeight: 900, textAlign: "center", letterSpacing: ".8px" }}>{day}</div>
            ))}
          </div>
          <div className="admin-calendar-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 8 }}>
            {calendar.cells.map((cell) => {
              if (cell.empty) {
                return <div key={cell.key} style={{ minHeight: 78 }} />;
              }
              const selected = cell.date === selectedCalendarDate;
              const hasRequests = cell.requests.length > 0;
              const tone = cell.urgentCount ? "#DC2626" : hasRequests ? "#1D4ED8" : "#64748B";
              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => setSelectedCalendarDate(cell.date)}
                  style={{
                    minHeight: 78,
                    padding: 10,
                    borderRadius: 18,
                    border: selected ? "2px solid rgba(37,99,235,.70)" : cell.isToday ? "1px solid rgba(37,99,235,.32)" : "1px solid rgba(37,99,235,.10)",
                    background: selected ? "rgba(37,99,235,.10)" : cell.urgentCount ? "rgba(254,242,242,.90)" : hasRequests ? "#F8FBFF" : "#fff",
                    cursor: "pointer",
                    textAlign: "left"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 6, alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: F, fontSize: 13, fontWeight: 900, color: cell.isToday ? "#1D4ED8" : "#0F172A" }}>{cell.day}</span>
                    {hasRequests ? (
                      <span style={{ minWidth: 22, height: 22, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: cell.urgentCount ? "rgba(220,38,38,.12)" : "rgba(37,99,235,.10)", color: tone, fontFamily: F, fontWeight: 900, fontSize: 11 }}>
                        {cell.requests.length}
                      </span>
                    ) : null}
                  </div>
                  <div style={{ fontFamily: F, color: tone, fontSize: 11, fontWeight: 800, lineHeight: 1.35 }}>
                    {hasRequests ? `${cell.requests.length} vencimiento(s)` : "Libre"}
                  </div>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 18, padding: 16, borderRadius: 20, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
              <div>
                <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.2px", fontWeight: 900, color: "#64748B" }}>DÍA SELECCIONADO</div>
                <div style={{ fontFamily: FH, color: "#0B1D3A", fontSize: 20 }}>{formatDateOnly(selectedCalendarDate)}</div>
              </div>
              <Badge meta={{ tone: "#1D4ED8", bg: "rgba(37,99,235,.10)" }}>{selectedDayRequests.length} solicitud(es)</Badge>
            </div>
            {selectedDayRequests.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {selectedDayRequests.map((request) => {
                  const dueMeta = getDueMeta(request);
                  return (
                    <button key={request.reference} type="button" onClick={() => onOpenRequest(request.reference)} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", textAlign: "left", padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.10)", background: "#fff", cursor: "pointer" }}>
                      <div>
                        <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 900 }}>{request.title || getServiceTypeLabel(request.serviceType)}</div>
                        <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>{formatProperName(request.clientName) || "Cliente sin nombre"} · {request.reference}</div>
                      </div>
                      <Badge meta={dueMeta}>{dueMeta.label}</Badge>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontFamily: F, color: "#64748B", lineHeight: 1.7, fontSize: 13 }}>
                No hay solicitudes con vencimiento para este día.
              </div>
            )}
          </div>
        </DashboardPanel>

        <DashboardPanel eyebrow="PRIORIDADES" title="Agenda operativa">
          {urgentRecords.length ? (
            <div style={{ display: "grid", gap: 9 }}>
              {urgentRecords.map((record) => (
                <button key={record.reference} type="button" onClick={() => onOpenRequest(record.reference)} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", textAlign: "left", padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.10)", background: "#F8FBFF", cursor: "pointer" }}>
                  <div>
                    <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 900, lineHeight: 1.35 }}>{record.title || getServiceTypeLabel(record.serviceType)}</div>
                    <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>{formatProperName(record.clientName) || "Cliente sin nombre"} · {record.balanceAmount ? formatMoney(record.balanceAmount) : getServiceStateSummary(record)}</div>
                  </div>
                  <span style={{ padding: "7px 10px", borderRadius: 999, background: `${record.priorityTone}18`, color: record.priorityTone, fontFamily: F, fontSize: 11, fontWeight: 900 }}>{record.priorityLabel}</span>
                </button>
              ))}
            </div>
          ) : (
            <EmptyDashboardNote>No hay prioridades críticas por ahora.</EmptyDashboardNote>
          )}
          <div style={{ marginTop: 18, fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 10 }}>RESUMEN FINANCIERO</div>
          <div style={{ display: "grid", gap: 12 }}>
            <InfoTile label="Ventas pactadas" value={summary.totalSales} />
            <InfoTile label="Ingresos recibidos" value={summary.totalPaid} />
            <InfoTile label="Servicios registrados" value={serviceRecords.length} />
          </div>
        </DashboardPanel>
      </div>

      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18, alignItems: "start" }}>
        <DashboardPanel eyebrow="PORTAFOLIO" title="Servicios con mayor movimiento">
          {byTypeDetailed.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {byTypeDetailed.map((item) => (
                <ProgressRow key={item.type} label={`${item.label} · ${item.count}`} value={item.amount} amount={formatMoney(item.amount)} max={maxTypeAmount} tone="#1D4ED8" />
              ))}
            </div>
          ) : (
            <EmptyDashboardNote>Sin servicios clasificados todavía.</EmptyDashboardNote>
          )}
        </DashboardPanel>

        <ActivityPulseCard stats={activityStats} highlights={activityHighlights} onOpenLog={() => setActivityLogOpen(true)} />
      </div>
      <ActivityLogDialog open={activityLogOpen} items={timeline} onClose={() => setActivityLogOpen(false)} />
    </div>
  );
}

function ServiceRequestsModule({
  records,
  filteredRecords,
  selectedReference,
  detail,
  draft,
  search,
  statusFilter,
  paymentFilter,
  loading,
  error,
  detailLoading,
  saving,
  docFiles,
  uploadingDocs,
  paymentLinkBusy,
  manualPaymentBusy,
  manualPaymentDraft,
  manualPaymentFiles,
  taskDraft,
  taskBusy,
  onSearchChange,
  onStatusFilterChange,
  onPaymentFilterChange,
  onSelect,
  onNew,
  onSave,
  onDraftChange,
  onClientChange,
  onCurrencyChange,
  onDocSelection,
  onRemoveDoc,
  onUploadDocs,
  onCreatePaymentLink,
  onManualPaymentChange,
  onPaymentSupportSelection,
  onRemovePaymentSupport,
  onRegisterManualPayment,
  onTaskChange,
  onSaveTask,
  onCompleteTask,
  onCopyPaymentLink,
  onVoidPayment,
  onRetryDetail,
  onRequestDelete,
  onExportRequests,
  onOpenClient,
  dialogOpen,
  onClose
}) {
  const balance = Math.max(parseCurrency(draft.agreedPrice) - parseCurrency(draft.amountPaid), 0);
  const visibleStatusBadge = getVisibleServiceStatusBadge(draft);
  const summaryWhatsappLink = buildServiceWhatsappLink(draft, detail, "summary");
  const chatWhatsappLink = buildServiceWhatsappLink(draft, detail, "chat");
  const paymentLinks = Array.isArray(detail?.paymentLinks) ? detail.paymentLinks : [];
  const activePaymentLink = paymentLinks.find((link) => link.status === "pending" && link.checkoutUrl) || null;
  const latestPaymentLink = activePaymentLink || paymentLinks[0] || null;
  const latestPaymentLinkActive = latestPaymentLink?.status === "pending";
  const paymentWhatsappLink = latestPaymentLinkActive ? buildServicePaymentWhatsappLink(draft, latestPaymentLink) : "";
  const paymentLinkStatusLabel = {
    pending: "Link vigente",
    approved: "Link pagado",
    failed: "Link fallido",
    superseded: "Link reemplazado"
  }[latestPaymentLink?.status] || "Link generado";
  const detailError = dialogOpen && selectedReference ? error : "";
  const loadingDetail = Boolean(detailLoading || (selectedReference && !detail && !draft.reference && !detailError));
  const tasks = Array.isArray(detail?.tasks) ? detail.tasks : [];
  const pendingTasks = tasks.filter((task) => task.status === "pending");
  const timeline = Array.isArray(detail?.timeline) ? detail.timeline : [];
  const templateActions = [
    ["documents", "Pedir documentos"],
    ["payment", "Recordar pago"],
    ["progress", "Actualizar avance"],
    ["final", "Cierre del servicio"]
  ];

  const detailContent = (
    <div className="admin-request-drawer-card" style={{ width: "min(1120px, 100%)", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 28, border: "1px solid rgba(37,99,235,.12)", boxShadow: "0 30px 80px rgba(15,23,42,.24)" }} onClick={(event) => event.stopPropagation()}>
      <div style={{ position: "sticky", top: 0, zIndex: 3, background: "rgba(255,255,255,.96)", backdropFilter: "blur(12px)", padding: "22px 24px", borderBottom: "1px solid rgba(37,99,235,.10)", borderRadius: "28px 28px 0 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
              {visibleStatusBadge ? <Badge meta={visibleStatusBadge.meta}>{visibleStatusBadge.label}</Badge> : null}
              <Badge meta={getServicePaymentMeta(draft.paymentStatus)}>{getServicePaymentMeta(draft.paymentStatus).label}</Badge>
              {draft.dueDate ? <Badge meta={getDueMeta(draft)}>{getDueMeta(draft).label}</Badge> : null}
            </div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.08, color: "#0B1D3A" }}>
              {loadingDetail ? "Cargando solicitud..." : draft.reference ? "Editar solicitud" : "Nueva solicitud"}
            </h2>
            <p style={{ margin: "10px 0 0", fontFamily: F, fontSize: 14, color: "#52647F", lineHeight: 1.8 }}>
              {draft.reference || "Se generará una referencia única al guardar por primera vez."}
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <div style={{ minWidth: 190, padding: "12px 15px", borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
              <div style={{ fontFamily: F, fontSize: 10, letterSpacing: "1.2px", fontWeight: 900, color: "#64748B", marginBottom: 4 }}>SALDO</div>
              <div style={{ fontFamily: FH, fontSize: 24, color: balance > 0 ? "#C2410C" : "#15803D" }}>{formatMoney(balance)}</div>
            </div>
            <button type="button" onClick={onClose} style={{ width: 44, height: 44, borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#0B1D3A", fontFamily: F, fontWeight: 900, cursor: "pointer" }} aria-label="Cerrar solicitud">
              X
            </button>
          </div>
        </div>
      </div>

      <div className="admin-request-drawer-body" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(320px,400px)", gap: 18, padding: 24, alignItems: "start" }}>
        <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
          <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 14 }}>DATOS DEL CLIENTE</div>
          {loadingDetail ? (
            <div style={{ padding: 14, borderRadius: 16, background: "#F8FBFF", color: "#64748B", fontFamily: F, marginBottom: 14 }}>
              Cargando la información de la solicitud seleccionada...
            </div>
          ) : null}
          {detailError ? (
            <div style={{ padding: 14, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 700, lineHeight: 1.6, marginBottom: 14 }}>
              <div>{detailError}</div>
              {selectedReference ? (
                <button type="button" onClick={onRetryDetail} style={{ marginTop: 10, padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(220,38,38,.18)", background: "#fff", color: "#DC2626", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                  Reintentar carga
                </button>
              ) : null}
            </div>
          ) : null}
          <div className="admin-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10, marginBottom: 18 }}>
            <input style={inputStyle} placeholder="Nombre del cliente" value={draft.client.name} onChange={(event) => onClientChange("name", event.target.value)} />
            <input style={inputStyle} placeholder="Número de documento" value={draft.client.documentNumber} onChange={(event) => onClientChange("documentNumber", event.target.value)} />
            <select style={inputStyle} value={draft.client.documentType} onChange={(event) => onClientChange("documentType", event.target.value)}>
              <option value="CC">Cédula de ciudadanía</option>
              <option value="CE">Cédula de extranjería</option>
              <option value="NIT">NIT</option>
              <option value="PAS">Pasaporte</option>
            </select>
            <input style={inputStyle} placeholder="WhatsApp / teléfono" value={draft.client.phone} onChange={(event) => onClientChange("phone", event.target.value)} />
            <input style={inputStyle} placeholder="Correo electrónico" value={draft.client.email} onChange={(event) => onClientChange("email", event.target.value)} />
          </div>

          <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 14 }}>DATOS DEL SERVICIO</div>
          <div style={{ display: "grid", gap: 10 }}>
            <input style={inputStyle} placeholder="Título o asunto de la solicitud" value={draft.title} onChange={(event) => onDraftChange("title", event.target.value)} />
            <div className="admin-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
              <select style={inputStyle} value={draft.serviceType} onChange={(event) => onDraftChange("serviceType", event.target.value)}>
                {SERVICE_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <input style={inputStyle} type="date" value={draft.dueDate} onChange={(event) => onDraftChange("dueDate", event.target.value)} />
              <select style={inputStyle} value={draft.status} onChange={(event) => onDraftChange("status", event.target.value)}>
                {Object.keys(SERVICE_STATUS_META).map((status) => <option key={status} value={status}>{getServiceStatusMeta(status).label}</option>)}
              </select>
              <select style={inputStyle} value={draft.paymentStatus} onChange={(event) => onDraftChange("paymentStatus", event.target.value)}>
                {Object.keys(SERVICE_PAYMENT_META).map((status) => <option key={status} value={status}>{getServicePaymentMeta(status).label}</option>)}
              </select>
              <input style={inputStyle} placeholder="Costo pactado" value={draft.agreedPrice} onChange={(event) => onCurrencyChange("agreedPrice", event.target.value)} />
              <div style={{ display: "grid", gap: 6 }}>
                <input style={{ ...inputStyle, background: "#F8FBFF", color: "#475569" }} placeholder="Valor pagado" value={draft.amountPaid || "$ 0"} disabled readOnly />
                <span style={{ fontFamily: F, color: "#64748B", fontSize: 11, lineHeight: 1.4 }}>
                  Se calcula automáticamente con los movimientos de pago.
                </span>
              </div>
            </div>
            <textarea style={{ ...inputStyle, minHeight: 132, resize: "vertical" }} placeholder="Comentarios, acuerdos, pendientes o detalles de negociación" value={draft.comments} onChange={(event) => onDraftChange("comments", event.target.value)} />
            <button type="button" onClick={onSave} disabled={saving || loadingDetail} style={{ padding: "13px 16px", borderRadius: 16, border: "none", background: saving || loadingDetail ? "#CBD5E1" : "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: saving || loadingDetail ? "not-allowed" : "pointer" }}>
              {saving ? "Guardando..." : "Guardar solicitud"}
            </button>
            {draft.reference ? (
              <button type="button" onClick={() => onRequestDelete(draft.reference, draft.title || draft.client?.name || "solicitud")} disabled={saving || loadingDetail} style={{ ...subtleDangerButtonStyle, justifySelf: "start", opacity: saving || loadingDetail ? 0.55 : 1, cursor: saving || loadingDetail ? "not-allowed" : "pointer" }}>
                Eliminar registro
              </button>
            ) : null}
          </div>
        </section>

        <div style={{ display: "grid", gap: 18 }}>
          <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
            <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>PAGOS</div>
            <div style={{ display: "grid", gap: 10, marginBottom: 14 }}>
              <button type="button" onClick={onCreatePaymentLink} disabled={!draft.reference || paymentLinkBusy || balance <= 0} style={{ padding: "12px 14px", borderRadius: 14, border: "none", background: !draft.reference || paymentLinkBusy || balance <= 0 ? "#CBD5E1" : "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: !draft.reference || paymentLinkBusy || balance <= 0 ? "not-allowed" : "pointer" }}>
                {paymentLinkBusy ? "Generando link..." : "Generar link de pago por saldo"}
              </button>
              {latestPaymentLink?.checkoutUrl ? (
                <div style={{ padding: 12, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 8 }}>
                    <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>{paymentLinkStatusLabel}</div>
                    <Badge meta={latestPaymentLinkActive ? getServicePaymentMeta("pendiente") : { tone: "#64748B", bg: "rgba(100,116,139,.10)" }}>
                      {latestPaymentLink.amountLabel || formatMoney(latestPaymentLink.amount)}
                    </Badge>
                  </div>
                  {latestPaymentLinkActive ? (
                    <>
                      <div style={{ fontFamily: F, fontSize: 13, color: "#0F172A", fontWeight: 800, lineHeight: 1.5, wordBreak: "break-word", marginBottom: 10 }}>{latestPaymentLink.checkoutUrl}</div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" onClick={() => onCopyPaymentLink(latestPaymentLink.checkoutUrl)} style={{ padding: "9px 11px", borderRadius: 12, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                          Copiar link
                        </button>
                        <a href={latestPaymentLink.checkoutUrl} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 11px", borderRadius: 12, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, textDecoration: "none" }}>
                          Abrir
                        </a>
                        {paymentWhatsappLink ? (
                          <a href={paymentWhatsappLink} target="_blank" rel="noopener noreferrer" style={{ padding: "9px 11px", borderRadius: 12, background: "#25D366", color: "#fff", fontFamily: F, fontWeight: 900, textDecoration: "none" }}>
                            Enviar link
                          </a>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontFamily: F, fontSize: 12, color: "#B45309", lineHeight: 1.7 }}>
                      Este link ya no está vigente. Genera un nuevo link para cobrar el saldo actual.
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            <div style={{ padding: 12, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 14 }}>
              <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.1px", fontWeight: 900, color: "#64748B", marginBottom: 10 }}>REGISTRAR PAGO MANUAL</div>
              <div style={{ display: "grid", gap: 8 }}>
                <input style={inputStyle} placeholder="Valor pagado" value={manualPaymentDraft.amount} onChange={(event) => onManualPaymentChange("amount", event.target.value)} />
                <select style={inputStyle} value={manualPaymentDraft.method} onChange={(event) => onManualPaymentChange("method", event.target.value)}>
                  <option value="Nequi">Nequi</option>
                  <option value="Transferencia bancaria">Transferencia bancaria</option>
                  <option value="Daviplata">Daviplata</option>
                  <option value="Efectivo">Efectivo</option>
                  <option value="Wompi manual">Wompi manual</option>
                  <option value="PSE externo">PSE externo</option>
                  <option value="Otro medio">Otro medio</option>
                </select>
                <input style={inputStyle} type="date" value={manualPaymentDraft.paidAt} onChange={(event) => onManualPaymentChange("paidAt", event.target.value)} />
                <input style={inputStyle} placeholder="Referencia, comprobante o número de transacción" value={manualPaymentDraft.transactionReference} onChange={(event) => onManualPaymentChange("transactionReference", event.target.value)} />
                <input style={inputStyle} placeholder="Pagador u origen del pago (opcional)" value={manualPaymentDraft.payerName} onChange={(event) => onManualPaymentChange("payerName", event.target.value)} />
                <textarea style={{ ...inputStyle, minHeight: 78, resize: "vertical" }} placeholder="Nota interna del pago o soporte pendiente" value={manualPaymentDraft.note} onChange={(event) => onManualPaymentChange("note", event.target.value)} />
                <div style={{ display: "grid", gap: 8 }}>
                  <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx" onChange={onPaymentSupportSelection} style={{ ...inputStyle, padding: "10px 12px", cursor: "pointer" }} />
                  {manualPaymentFiles?.length ? (
                    <div style={{ display: "grid", gap: 6 }}>
                      {manualPaymentFiles.map((file, index) => (
                        <div key={`${file.name}-${file.lastModified}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: "9px 10px", borderRadius: 12, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontFamily: F, fontSize: 12, color: "#0F172A", fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
                            <div style={{ fontFamily: F, fontSize: 11, color: "#64748B" }}>{formatBytes(file.size)}</div>
                          </div>
                          <button type="button" onClick={() => onRemovePaymentSupport(index)} style={{ padding: "7px 9px", borderRadius: 10, border: "1px solid rgba(220,38,38,.14)", background: "rgba(220,38,38,.06)", color: "#DC2626", fontFamily: F, fontWeight: 900, fontSize: 11, cursor: "pointer" }}>
                            Quitar
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
                <button type="button" onClick={onRegisterManualPayment} disabled={!draft.reference || manualPaymentBusy || parseCurrency(manualPaymentDraft.amount) <= 0} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: !draft.reference || manualPaymentBusy || parseCurrency(manualPaymentDraft.amount) <= 0 ? "#CBD5E1" : "linear-gradient(135deg,#15803D,#22C55E)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: !draft.reference || manualPaymentBusy || parseCurrency(manualPaymentDraft.amount) <= 0 ? "not-allowed" : "pointer" }}>
                  {manualPaymentBusy ? "Registrando..." : "Registrar pago manual"}
                </button>
              </div>
            </div>

            {detail?.payments?.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {detail.payments.slice(0, 6).map((payment) => (
                  <div key={payment.id || payment.reference} style={{ padding: 12, borderRadius: 14, background: isVoidedServicePayment(payment) ? "rgba(245,158,11,.08)" : "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                      <strong style={{ fontFamily: F, color: "#0F172A", fontSize: 13 }}>{payment.amountLabel || formatMoney(payment.amount)}</strong>
                      <Badge meta={getServicePaymentMovementBadge({ ...payment, kind: "payment" }).meta}>{getServicePaymentMovementBadge({ ...payment, kind: "payment" }).label}</Badge>
                    </div>
                    <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>
                      {payment.method || payment.source} · {formatDate(payment.paidAt || payment.createdAt)} · {payment.reference}
                      {payment.transactionReference ? ` · Comp. ${payment.transactionReference}` : ""}
                    </div>
                    {payment.note ? <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>{payment.note}</div> : null}
                    {payment.supportFiles?.length ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {payment.supportFiles.map((file) => (
                          <a key={file.id || file.blobKey} href={file.downloadPath} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 9px", borderRadius: 10, background: "#fff", border: "1px solid rgba(37,99,235,.12)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, fontSize: 11, textDecoration: "none" }}>
                            {file.originalName || "Soporte"}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {payment.voidReason ? <div style={{ fontFamily: F, color: "#B45309", fontSize: 12, lineHeight: 1.6, marginTop: 4 }}>Anulado: {payment.voidReason}</div> : null}
                    {payment.source !== "wompi" && !isVoidedServicePayment(payment) ? (
                      <button type="button" onClick={() => onVoidPayment(draft.reference, payment.reference, payment.amountLabel || formatMoney(payment.amount))} style={{ ...subtleDangerButtonStyle, marginTop: 8 }}>
                        Anular pago
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: F, color: "#64748B", fontSize: 13, lineHeight: 1.7 }}>Aún no hay pagos registrados.</div>
            )}
          </section>

          <section style={{ padding: 20, borderRadius: 22, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
            <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>CONTACTO</div>
            <div style={{ fontFamily: F, fontSize: 13, color: "#52647F", lineHeight: 1.7, marginBottom: 14 }}>
              Envía un resumen claro o abre el chat directo con el cliente.
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              <button type="button" onClick={() => onOpenClient(draft.client)} disabled={!normalizeDocumentIdentity(draft.client?.documentNumber)} style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: normalizeDocumentIdentity(draft.client?.documentNumber) ? "#1D4ED8" : "#94A3B8", fontFamily: F, fontWeight: 900, cursor: normalizeDocumentIdentity(draft.client?.documentNumber) ? "pointer" : "not-allowed" }}>
                Consultar cliente
              </button>
              {summaryWhatsappLink ? (
                <a href={summaryWhatsappLink} target="_blank" rel="noopener noreferrer" style={{ padding: "12px 14px", borderRadius: 14, background: "#25D366", color: "#fff", fontFamily: F, fontWeight: 900, textDecoration: "none", textAlign: "center" }}>
                  Enviar resumen por WhatsApp
                </a>
              ) : (
                <button type="button" disabled style={{ padding: "12px 14px", borderRadius: 14, border: "none", background: "#CBD5E1", color: "#fff", fontFamily: F, fontWeight: 900, cursor: "not-allowed" }}>
                  Enviar resumen por WhatsApp
                </button>
              )}
              {chatWhatsappLink ? (
                <a href={chatWhatsappLink} target="_blank" rel="noopener noreferrer" style={{ padding: "12px 14px", borderRadius: 14, background: "#fff", color: "#15803D", border: "1px solid rgba(21,128,61,.20)", fontFamily: F, fontWeight: 900, textDecoration: "none", textAlign: "center" }}>
                  Abrir chat
                </a>
              ) : (
                <button type="button" disabled style={{ padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(148,163,184,.24)", background: "#fff", color: "#94A3B8", fontFamily: F, fontWeight: 900, cursor: "not-allowed" }}>
                  Abrir chat
                </button>
              )}
            </div>
            {!chatWhatsappLink ? (
              <div style={{ marginTop: 12, fontFamily: F, color: "#B45309", fontSize: 12, lineHeight: 1.7 }}>
                Registra el WhatsApp del cliente para habilitar estos accesos.
              </div>
            ) : null}
            <div style={{ marginTop: 16, padding: 12, borderRadius: 16, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
              <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.1px", fontWeight: 900, color: "#64748B", marginBottom: 10 }}>PLANTILLAS RÁPIDAS</div>
              <div style={{ display: "grid", gap: 8 }}>
                {templateActions.map(([template, label]) => {
                  const whatsapp = buildServiceTemplateWhatsappLink(draft, detail, template);
                  const mailto = buildServiceTemplateMailtoLink(draft, detail, template);
                  return (
                    <div key={template} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto auto", gap: 8, alignItems: "center" }}>
                      <span style={{ fontFamily: F, fontSize: 12, color: "#334155", fontWeight: 800 }}>{label}</span>
                      {whatsapp ? <a href={whatsapp} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 9px", borderRadius: 10, background: "#25D366", color: "#fff", fontFamily: F, fontWeight: 900, fontSize: 11, textDecoration: "none" }}>WA</a> : <span style={{ color: "#CBD5E1", fontFamily: F, fontSize: 11, fontWeight: 900 }}>WA</span>}
                      {mailto ? <a href={mailto} style={{ padding: "7px 9px", borderRadius: 10, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, fontSize: 11, textDecoration: "none" }}>Correo</a> : <span style={{ color: "#CBD5E1", fontFamily: F, fontSize: 11, fontWeight: 900 }}>Correo</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>TAREAS INTERNAS</div>
                <div style={{ fontFamily: F, fontSize: 13, color: "#64748B" }}>Alertas operativas asociadas a la solicitud.</div>
              </div>
              <Badge meta={pendingTasks.length ? { tone: "#B45309", bg: "rgba(245,158,11,.14)" } : { tone: "#15803D", bg: "rgba(34,197,94,.12)" }}>{pendingTasks.length} pendiente(s)</Badge>
            </div>
            <div style={{ display: "grid", gap: 8, padding: 12, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 12 }}>
              <input style={inputStyle} placeholder="Tarea pendiente, ejemplo: solicitar RUT actualizado" value={taskDraft.title} onChange={(event) => onTaskChange("title", event.target.value)} />
              <input style={inputStyle} type="date" value={taskDraft.dueDate} onChange={(event) => onTaskChange("dueDate", event.target.value)} />
              <textarea style={{ ...inputStyle, minHeight: 72, resize: "vertical" }} placeholder="Nota interna de la tarea" value={taskDraft.note} onChange={(event) => onTaskChange("note", event.target.value)} />
              <button type="button" onClick={() => onSaveTask()} disabled={!draft.reference || taskBusy || !String(taskDraft.title || "").trim()} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: !draft.reference || taskBusy || !String(taskDraft.title || "").trim() ? "#CBD5E1" : "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: !draft.reference || taskBusy || !String(taskDraft.title || "").trim() ? "not-allowed" : "pointer" }}>
                {taskBusy ? "Guardando tarea..." : "Agregar tarea"}
              </button>
            </div>
            {tasks.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {tasks.slice(0, 8).map((task) => {
                  const taskDone = task.status === "done";
                  const overdue = !taskDone && task.dueDate && task.dueDate < getTodayDateString();
                  return (
                    <div key={task.id} style={{ padding: 12, borderRadius: 14, background: taskDone ? "rgba(34,197,94,.08)" : overdue ? "rgba(254,242,242,.90)" : "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "flex-start", marginBottom: 4 }}>
                        <strong style={{ fontFamily: F, color: "#0F172A", fontSize: 13, lineHeight: 1.4 }}>{task.title}</strong>
                        <Badge meta={taskDone ? getServicePaymentMeta("pagado_manual") : overdue ? { tone: "#DC2626", bg: "rgba(220,38,38,.10)" } : { tone: "#B45309", bg: "rgba(245,158,11,.14)" }}>
                          {taskDone ? "Hecha" : overdue ? "Vencida" : "Pendiente"}
                        </Badge>
                      </div>
                      <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>
                        {task.dueDate ? `Vence: ${formatDateOnly(task.dueDate)}` : "Sin vencimiento"}{task.note ? ` · ${task.note}` : ""}
                      </div>
                      {!taskDone ? (
                        <button type="button" onClick={() => onCompleteTask(task)} disabled={taskBusy} style={{ marginTop: 8, padding: "8px 10px", borderRadius: 11, border: "1px solid rgba(21,128,61,.18)", background: "#fff", color: "#15803D", fontFamily: F, fontWeight: 900, fontSize: 12, cursor: taskBusy ? "not-allowed" : "pointer" }}>
                          Marcar completada
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ fontFamily: F, color: "#64748B", fontSize: 13, lineHeight: 1.7 }}>No hay tareas internas registradas.</div>
            )}
          </section>

          <section style={{ padding: 20, borderRadius: 22, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>DOCUMENTOS</div>
                <div style={{ fontFamily: F, fontSize: 13, color: "#64748B" }}>Adjuntos propios de esta solicitud.</div>
              </div>
              <Badge meta={{ tone: "#475569", bg: "rgba(100,116,139,.10)" }}>{detail?.documents?.length || 0} archivo(s)</Badge>
            </div>
            {!draft.reference ? (
              <div style={{ padding: 14, borderRadius: 18, background: "#fff", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, fontSize: 13, color: "#64748B", lineHeight: 1.7, marginBottom: 14 }}>
                Guarda la solicitud para crear la referencia única y habilitar la carga de documentos.
              </div>
            ) : (
              <>
                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx" onChange={onDocSelection} style={{ ...inputStyle, padding: "10px 12px", cursor: "pointer", marginBottom: docFiles.length ? 10 : 12 }} />
                {docFiles.length ? (
                  <div style={{ display: "grid", gap: 8, marginBottom: 12 }}>
                    {docFiles.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}-${index}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 14, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                        <div>
                          <div style={{ fontFamily: F, fontSize: 13, color: "#0F172A", fontWeight: 800 }}>{file.name}</div>
                          <div style={{ fontFamily: F, fontSize: 12, color: "#64748B" }}>{formatBytes(file.size)}</div>
                        </div>
                        <button type="button" onClick={() => onRemoveDoc(index)} style={{ padding: "8px 10px", borderRadius: 12, border: "1px solid rgba(220,38,38,.14)", background: "rgba(220,38,38,.06)", color: "#DC2626", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                          Quitar
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}
                <button type="button" onClick={onUploadDocs} disabled={!docFiles.length || uploadingDocs} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "none", background: !docFiles.length || uploadingDocs ? "#CBD5E1" : "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: !docFiles.length || uploadingDocs ? "not-allowed" : "pointer", marginBottom: 14 }}>
                  {uploadingDocs ? "Cargando documentos..." : "Cargar documentos"}
                </button>
              </>
            )}

            {detail?.documents?.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {detail.documents.map((file) => (
                  <div key={file.id || file.blobKey} style={{ padding: 14, borderRadius: 18, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                    <div style={{ fontFamily: F, fontSize: 14, color: "#0F172A", fontWeight: 900, lineHeight: 1.4 }}>{file.originalName || "Documento adjunto"}</div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7, marginBottom: 10 }}>{file.sizeLabel || formatBytes(file.size)} · {formatDate(file.uploadedAt)}</div>
                    <a href={file.downloadPath} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", padding: "9px 12px", borderRadius: 12, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, textDecoration: "none", fontSize: 13 }}>
                      Ver documento
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: F, color: "#64748B", fontSize: 13, lineHeight: 1.7 }}>
                No hay documentos cargados para esta solicitud.
              </div>
            )}
          </section>

          <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>BITÁCORA</div>
                <div style={{ fontFamily: F, fontSize: 13, color: "#64748B" }}>Historial de cambios, pagos, documentos y tareas.</div>
              </div>
              <Badge meta={{ tone: "#475569", bg: "rgba(100,116,139,.10)" }}>{timeline.length} evento(s)</Badge>
            </div>
            {timeline.length ? (
              <div style={{ display: "grid", gap: 10 }}>
                {timeline.slice(0, 12).map((item) => (
                  <div key={item.id} style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr)", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ width: 10, height: 10, borderRadius: 999, marginTop: 6, background: item.tone || "#1D4ED8" }} />
                    <div>
                      <div style={{ fontFamily: F, color: "#0F172A", fontSize: 13, fontWeight: 900, lineHeight: 1.4 }}>{item.title}</div>
                      <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>
                        {formatDate(item.at)}{item.by ? ` · ${item.by}` : ""}{item.note ? ` · ${item.note}` : ""}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: F, color: "#64748B", fontSize: 13, lineHeight: 1.7 }}>La bitácora se alimentará con los próximos movimientos de esta solicitud.</div>
            )}
          </section>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <section style={{ padding: 22, borderRadius: 28, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 5 }}>LISTADO OPERATIVO</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 32, color: "#0B1D3A" }}>Solicitudes generales</h2>
            <p style={{ margin: "8px 0 0", fontFamily: F, color: "#64748B", fontSize: 14, lineHeight: 1.7 }}>
              {records.length} solicitud(es) registradas. Abre una solicitud para editar datos, pagos, documentos y contacto.
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={onExportRequests} disabled={!records.length} style={{ padding: "13px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: records.length ? "#1D4ED8" : "#94A3B8", fontFamily: F, fontWeight: 900, cursor: records.length ? "pointer" : "not-allowed" }}>
              Descargar Excel
            </button>
            <button type="button" onClick={onNew} style={{ padding: "13px 16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
              Nueva solicitud
            </button>
          </div>
        </div>

        <div className="admin-request-filter-grid" style={{ display: "grid", gridTemplateColumns: "minmax(280px,1fr) minmax(180px,.28fr) minmax(180px,.28fr)", gap: 10, marginBottom: 16 }}>
          <input style={inputStyle} placeholder="Buscar por cliente, documento o referencia" value={search} onChange={(event) => onSearchChange(event.target.value)} />
          <select style={inputStyle} value={statusFilter} onChange={(event) => onStatusFilterChange(event.target.value)}>
            <option value="all">Todos los estados</option>
            {Object.keys(SERVICE_STATUS_META).map((status) => (
              <option key={status} value={status}>{getServiceStatusMeta(status).label}</option>
            ))}
          </select>
          <select style={inputStyle} value={paymentFilter} onChange={(event) => onPaymentFilterChange(event.target.value)}>
            <option value="all">Todos los pagos</option>
            {Object.keys(SERVICE_PAYMENT_META).map((status) => (
              <option key={status} value={status}>{getServicePaymentMeta(status).label}</option>
            ))}
          </select>
        </div>

        {loading && <div style={{ fontFamily: F, color: "#64748B", fontSize: 14, marginBottom: 12 }}>Cargando solicitudes...</div>}
        {error && <div style={{ padding: 14, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 700, marginBottom: 14 }}>{error}</div>}

        <div className="admin-request-list" style={{ display: "grid", gap: 10 }}>
          {filteredRecords.map((record) => {
            const selected = selectedReference === record.reference;
            const dueMeta = getDueMeta(record);
            const statusBadge = getVisibleServiceStatusBadge(record);
            return (
              <button
                key={record.reference}
                type="button"
                onClick={() => onSelect(record.reference)}
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0,1.4fr) minmax(130px,.45fr) minmax(130px,.45fr) minmax(110px,.35fr)",
                  gap: 14,
                  alignItems: "center",
                  textAlign: "left",
                  padding: 16,
                  borderRadius: 18,
                  border: selected ? "1px solid rgba(37,99,235,.24)" : "1px solid rgba(37,99,235,.10)",
                  background: selected ? "rgba(37,99,235,.08)" : "#fff",
                  cursor: "pointer"
                }}
              >
                <div>
                  <div style={{ fontFamily: F, fontSize: 15, fontWeight: 900, color: "#0F172A", lineHeight: 1.4 }}>{formatProperName(record.clientName) || "Cliente sin nombre"}</div>
                  <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", marginTop: 4 }}>{record.reference}</div>
                  <div style={{ fontFamily: F, fontSize: 13, color: "#41556F", lineHeight: 1.55, marginTop: 4 }}>{record.title || getServiceTypeLabel(record.serviceType)}</div>
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {statusBadge ? <Badge meta={statusBadge.meta}>{statusBadge.label}</Badge> : null}
                  <Badge meta={dueMeta}>{dueMeta.label}</Badge>
                </div>
                <div>
                  <Badge meta={getServicePaymentMeta(record.paymentStatus)}>{getServicePaymentMeta(record.paymentStatus).label}</Badge>
                </div>
                <div style={{ fontFamily: F, fontSize: 12, color: "#52647F", fontWeight: 900, textAlign: "right" }}>
                  <div>Saldo: {record.balance || "$ 0"}</div>
                  <div>Docs: {record.documentsCount || 0}</div>
                  <div>Tareas: {record.pendingTasksCount || 0}</div>
                </div>
              </button>
            );
          })}
          {!filteredRecords.length && !loading ? (
            <div style={{ padding: 14, borderRadius: 16, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.7 }}>
              No hay solicitudes generales con estos filtros.
            </div>
          ) : null}
        </div>
      </section>
      {dialogOpen && typeof document !== "undefined" ? createPortal(
        <div className="admin-request-drawer-overlay" style={{ position: "fixed", inset: 0, zIndex: 15000, background: "rgba(8,15,29,.62)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
          {detailContent}
        </div>,
        document.body
      ) : null}
    </>
  );
}

function PotentialClientsModule({
  leads = [],
  leadsLoading,
  leadsError,
  selectedLeadIds = new Set(),
  onToggleAllLeads,
  onOpenLeadDetail,
  onExportLeads,
  onCopyLeadPhones,
  onOpenBulkEmail
}) {
  const leadRows = useMemo(() => buildLeadRows(leads), [leads]);
  const authorizedLeads = leadRows.filter((lead) => lead.marketingConsent);
  const selectedAuthorizedLeads = leadRows.filter((lead) => (lead.leadIds || [lead.id]).some((id) => selectedLeadIds.has(id)) && lead.marketingConsent);
  const allAuthorizedSelected = authorizedLeads.length > 0 && authorizedLeads.every((lead) => (lead.leadIds || [lead.id]).some((id) => selectedLeadIds.has(id)));

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ padding: 18, borderRadius: 24, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 16px 36px rgba(15,23,42,.06)" }}>
        <div style={{ fontFamily: F, color: "#52647F", fontSize: 13, lineHeight: 1.7 }}>
          Cada registro representa una solicitud de contacto independiente. Un mismo documento puede aparecer varias veces si el cliente diligenció distintos formularios o herramientas.
        </div>
      </section>

      <section style={{ padding: 22, borderRadius: 28, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 5 }}>CONTACTOS CAPTADOS DESDE LA WEB</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 32, color: "#0B1D3A" }}>{leadRows.length} registro(s)</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => onToggleAllLeads(allAuthorizedSelected ? [] : authorizedLeads.flatMap((lead) => lead.leadIds || [lead.id]).filter(Boolean))} disabled={!authorizedLeads.length} style={{ padding: "10px 13px", borderRadius: 13, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: authorizedLeads.length ? "pointer" : "not-allowed" }}>
              {allAuthorizedSelected ? "Quitar selección" : "Seleccionar autorizados"}
            </button>
            <button type="button" onClick={onExportLeads} disabled={!leads.length} style={{ padding: "10px 13px", borderRadius: 13, border: "none", background: leads.length ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "#CBD5E1", color: "#fff", fontFamily: F, fontWeight: 900, cursor: leads.length ? "pointer" : "not-allowed" }}>
              Descargar Excel
            </button>
            <button type="button" onClick={() => onCopyLeadPhones(selectedAuthorizedLeads)} disabled={!selectedAuthorizedLeads.length} style={{ padding: "10px 13px", borderRadius: 13, border: "1px solid rgba(21,128,61,.20)", background: "#fff", color: "#15803D", fontFamily: F, fontWeight: 900, cursor: selectedAuthorizedLeads.length ? "pointer" : "not-allowed" }}>
              Copiar WhatsApps
            </button>
            <a href={buildLeadMailtoLink(selectedAuthorizedLeads)} onClick={(event) => { if (!selectedAuthorizedLeads.length) event.preventDefault(); else onOpenBulkEmail(selectedAuthorizedLeads); }} style={{ padding: "10px 13px", borderRadius: 13, background: selectedAuthorizedLeads.length ? "rgba(37,99,235,.08)" : "#E2E8F0", color: selectedAuthorizedLeads.length ? "#1D4ED8" : "#94A3B8", fontFamily: F, fontWeight: 900, textDecoration: "none", cursor: selectedAuthorizedLeads.length ? "pointer" : "not-allowed" }}>
              Correo masivo
            </a>
          </div>
        </div>

        {leadsLoading ? <div style={{ fontFamily: F, color: "#64748B" }}>Cargando clientes potenciales...</div> : null}
        {leadsError ? <div style={{ padding: 14, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 700, marginBottom: 14 }}>{leadsError}</div> : null}

        {leadRows.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {leadRows.map((lead) => {
              const leadIds = lead.leadIds || [lead.id];
              const selected = leadIds.some((id) => selectedLeadIds.has(id));
              return (
                <div key={lead.key || lead.id} className="admin-client-row" style={{ display: "grid", gridTemplateColumns: "auto minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: 14, borderRadius: 18, border: selected ? "1px solid rgba(37,99,235,.28)" : "1px solid rgba(37,99,235,.10)", background: selected ? "rgba(37,99,235,.06)" : "#fff" }}>
                  <input
                    type="checkbox"
                    checked={selected}
                    disabled={!lead.marketingConsent}
                    onChange={() => {
                      const currentSelection = Array.from(selectedLeadIds);
                      const nextSelection = selected
                        ? currentSelection.filter((id) => !leadIds.includes(id))
                        : Array.from(new Set([...currentSelection, ...leadIds]));
                      onToggleAllLeads(nextSelection);
                    }}
                    title={lead.marketingConsent ? "Seleccionar para comunicaciones" : "No autorizó comunicaciones comerciales"}
                  />
                  <button type="button" onClick={() => onOpenLeadDetail(lead)} style={{ minWidth: 0, border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ fontFamily: F, fontSize: 15, fontWeight: 900, color: "#0F172A", lineHeight: 1.4 }}>{formatProperName(lead.name)}</div>
                      <Badge meta={lead.marketingConsent ? { tone: "#15803D", bg: "rgba(34,197,94,.12)" } : { tone: "#B45309", bg: "rgba(245,158,11,.14)" }}>
                        {lead.marketingConsent ? "Autoriza" : "Gestión"}
                      </Badge>
                    </div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.serviceInterest || "Servicio pendiente"} · {lead.documentNumber || "Sin documento"} · {formatDate(lead.createdAt)}
                    </div>
                  </button>
                  <button type="button" onClick={() => onOpenLeadDetail(lead)} style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                    Ver
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 18, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.8 }}>
            Aún no hay clientes potenciales captados desde la web.
          </div>
        )}
      </section>
    </div>
  );
}

function ClientsModule({
  clients = [],
  records = [],
  onOpenClientDetail,
  onExportClients
}) {
  const totalSales = clients.reduce((sum, client) => sum + Number(client.totalAgreed || 0), 0);
  const totalPaid = clients.reduce((sum, client) => sum + Number(client.totalPaid || 0), 0);
  const totalReceivable = clients.reduce((sum, client) => sum + Number(client.receivable || 0), 0);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
        <StatCard label="CLIENTES ÚNICOS" value={clients.length} note="Agrupados exclusivamente por número de documento." tone="#1D4ED8" />
        <StatCard label="SOLICITUDES" value={records.length} note="Servicios generales asociados." tone="#7C3AED" />
        <StatCard label="VALOR SERVICIOS" value={formatMoney(totalSales)} note={`Pagado: ${formatMoney(totalPaid)}`} tone="#0F766E" />
        <StatCard label="CARTERA" value={formatMoney(totalReceivable)} note="Saldo pendiente por cliente." tone="#C2410C" />
      </div>

      <section style={{ padding: 18, borderRadius: 24, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 16px 36px rgba(15,23,42,.06)" }}>
        <div style={{ fontFamily: F, color: "#52647F", fontSize: 13, lineHeight: 1.7 }}>
          Este módulo consolida clientes reales por número de documento. Si se crea una nueva solicitud con un documento existente, se suma al mismo expediente del cliente.
        </div>
      </section>

      <section style={{ padding: 22, borderRadius: 28, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 5 }}>CLIENTES DE SOLICITUDES GENERALES</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 32, color: "#0B1D3A" }}>{clients.length} cliente(s)</h2>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            <Badge meta={{ tone: "#475569", bg: "rgba(100,116,139,.10)" }}>{records.length} solicitud(es)</Badge>
            <button type="button" onClick={onExportClients} disabled={!clients.length} style={{ padding: "10px 13px", borderRadius: 13, border: "none", background: clients.length ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "#CBD5E1", color: "#fff", fontFamily: F, fontWeight: 900, cursor: clients.length ? "pointer" : "not-allowed" }}>
              Descargar Excel
            </button>
          </div>
        </div>

        {clients.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {clients.map((client) => (
              <div key={client.key} className="admin-client-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3,minmax(110px,.3fr)) auto", gap: 12, alignItems: "center", padding: 14, borderRadius: 18, border: "1px solid rgba(37,99,235,.10)", background: "#fff" }}>
                <button type="button" onClick={() => onOpenClientDetail(client)} style={{ minWidth: 0, border: "none", background: "transparent", padding: 0, textAlign: "left", cursor: "pointer" }}>
                  <div style={{ fontFamily: F, fontSize: 15, fontWeight: 900, color: "#0F172A", lineHeight: 1.4 }}>{formatProperName(client.name)}</div>
                  <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {client.documentNumber || "Sin documento"} · {client.email || "Sin correo"} · {client.phone || "Sin teléfono"}
                  </div>
                </button>
                <InfoTile label="Solicitudes" value={`${client.requests} (${client.active} activa)`} />
                <InfoTile label="Servicios" value={formatMoney(client.totalAgreed)} />
                <InfoTile label="Pagado" value={formatMoney(client.totalPaid)} />
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", alignItems: "center", flexWrap: "wrap" }}>
                  <Badge meta={client.receivable > 0 ? getServicePaymentMeta("pendiente") : getServicePaymentMeta("pagado_manual")}>
                    {client.receivable > 0 ? formatMoney(client.receivable) : "Sin saldo"}
                  </Badge>
                  <button type="button" onClick={() => onOpenClientDetail(client)} style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                    Ver
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: 18, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.8 }}>
            Aún no hay clientes registrados en el módulo de solicitudes generales.
          </div>
        )}
      </section>
    </div>
  );
}

function ClientDetailDialog({
  detail,
  records = [],
  onClose,
  onOpenRequest,
  onCreateRequest,
  onDeleteLead,
  onDeleteServiceRequest
}) {
  const [activeTab, setActiveTab] = useState("resumen");
  const safeDetail = detail || {};
  const isLead = safeDetail.type === "lead";
  const lead = safeDetail.lead || {};
  const client = safeDetail.client || {};
  const detailKey = isLead ? lead.id : client.key;

  useEffect(() => {
    setActiveTab("resumen");
  }, [detailKey, isLead]);

  if (!detail || typeof document === "undefined") return null;

  const clientDocumentKey = normalizeDocumentIdentity(
    client.documentNumber || String(client.key || "").replace(/^doc:/i, "")
  );
  const clientRecords = isLead ? [] : records.filter((record) => {
    const recordDocumentKey = normalizeDocumentIdentity(record.clientDocumentNumber);
    const sameDocument = Boolean(clientDocumentKey && recordDocumentKey && recordDocumentKey === clientDocumentKey);
    const sameDocumentKey = Boolean(client.key && buildClientDocumentKey(record) && buildClientDocumentKey(record) === client.key);
    const sameEmail = Boolean(!clientDocumentKey && client.email && record.clientEmail && String(record.clientEmail).trim().toLowerCase() === String(client.email).trim().toLowerCase());
    const samePhone = Boolean(!clientDocumentKey && client.phone && record.clientPhone && normalizeWhatsappPhone(record.clientPhone) === normalizeWhatsappPhone(client.phone));
    return sameDocument || sameDocumentKey || sameEmail || samePhone;
  });
  const clientTotals = clientRecords.reduce((acc, record) => {
    acc.totalAgreed += parseCurrency(record.agreedPrice);
    acc.totalPaid += parseCurrency(record.amountPaid);
    acc.receivable += Math.max(parseCurrency(record.agreedPrice) - parseCurrency(record.amountPaid), 0);
    return acc;
  }, { totalAgreed: 0, totalPaid: 0, receivable: 0 });
  const subject = isLead ? lead : client;
  const whatsappLink = isLead ? buildLeadWhatsappLink(lead) : buildClientWhatsappLink(client);
  const email = String(subject.email || "").trim();
  const tabs = isLead
    ? [
        ["resumen", "Resumen"],
        ["comunicaciones", "Comunicaciones"],
        ["actividad", "Historial"]
      ]
    : [
        ["resumen", "Resumen"],
        ["solicitudes", "Solicitudes"],
        ["pagos", "Pagos"],
        ["actividad", "Historial"]
      ];
  const activityItems = isLead
    ? [
        {
          title: "Cliente captado desde la web",
          note: lead.serviceInterest || "Registro creado desde formulario de contacto.",
          date: lead.createdAt,
          tone: "#2563EB",
          bg: "rgba(37,99,235,.10)"
        },
        lead.marketingConsent ? {
          title: "Autorizó comunicaciones comerciales",
          note: "Puede incluirse en acciones de WhatsApp o correo masivo.",
          date: lead.createdAt,
          tone: "#15803D",
          bg: "rgba(34,197,94,.12)"
        } : {
          title: "Uso limitado a gestión de solicitud",
          note: "No autorizó comunicaciones comerciales masivas.",
          date: lead.createdAt,
          tone: "#B45309",
          bg: "rgba(245,158,11,.14)"
        }
      ].filter((item) => item.date)
    : clientRecords.flatMap((record) => [
        {
          title: "Solicitud creada",
          note: `${record.title || getServiceTypeLabel(record.serviceType)} · ${record.reference}`,
          date: record.createdAt,
          tone: "#2563EB",
          bg: "rgba(37,99,235,.10)"
        },
        {
          title: "Última actualización",
          note: getServiceStateSummary(record),
          date: record.updatedAt,
          tone: "#0F766E",
          bg: "rgba(13,148,136,.10)"
        },
        Number(record.documentsCount || 0) > 0 ? {
          title: "Documentos cargados",
          note: `${record.documentsCount} documento(s) adjunto(s) en la solicitud.`,
          date: record.updatedAt,
          tone: "#7C3AED",
          bg: "rgba(124,58,237,.10)"
        } : null,
        Number(record.paymentsCount || 0) > 0 ? {
          title: "Pagos registrados",
          note: `${record.paymentsCount} pago(s) aplicado(s). Saldo actual: ${record.balance || "$ 0"}.`,
          date: record.updatedAt,
          tone: "#15803D",
          bg: "rgba(34,197,94,.12)"
        } : null
      ].filter(Boolean))
      .filter((item) => item.date)
      .sort((left, right) => new Date(right.date || 0) - new Date(left.date || 0));

  return createPortal(
    <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.62)", zIndex: 15000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={onClose}>
      <div className="admin-modal-card" style={{ width: "min(820px, 100%)", maxHeight: "92vh", overflowY: "auto", background: "#fff", borderRadius: 28, padding: 28, border: "1px solid rgba(37,99,235,.12)", boxShadow: "0 28px 72px rgba(15,23,42,.20)" }} onClick={(event) => event.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#1D4ED8", fontWeight: 900, fontFamily: F, marginBottom: 10 }}>
              {isLead ? "CLIENTE POTENCIAL" : "CLIENTE"}
            </div>
            <h3 style={{ margin: 0, fontFamily: FH, fontSize: "clamp(28px,4vw,38px)", lineHeight: 1.08, color: "#0B1D3A" }}>
              {formatProperName(subject.name) || "Cliente sin nombre"}
            </h3>
          </div>
          <button type="button" onClick={onClose} style={{ width: 42, height: 42, borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#0B1D3A", fontFamily: F, fontWeight: 900, cursor: "pointer" }} aria-label="Cerrar detalle de cliente">
            X
          </button>
        </div>

        <div className="admin-client-tabbar" style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 6, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 16 }}>
          {tabs.map(([id, label]) => (
            <button key={id} type="button" onClick={() => setActiveTab(id)} style={{ padding: "9px 12px", borderRadius: 13, border: "none", background: activeTab === id ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "transparent", color: activeTab === id ? "#fff" : "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
              {label}
            </button>
          ))}
        </div>

        {activeTab === "resumen" ? (
          <>
            <div className="admin-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
              <InfoTile label="Documento" value={subject.documentNumber || client.documentNumber} />
              <InfoTile label="WhatsApp" value={subject.phone} />
              <InfoTile label="Correo" value={subject.email} />
            </div>
            {isLead ? (
              <>
                <div className="admin-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
                  <InfoTile label="Servicio de interés" value={lead.serviceInterest || "Servicio pendiente"} />
                  <InfoTile label="Fecha de registro" value={formatDate(lead.createdAt)} />
                  <InfoTile label="Origen" value={lead.sourceLabel || lead.sourcePath || "Formulario web"} />
                </div>
                <div style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F, color: "#334155", lineHeight: 1.7, marginBottom: 16 }}>
                  {lead.comment || "Sin comentario registrado."}
                </div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 18 }}>
                  <Badge meta={lead.treatmentConsent ? { tone: "#15803D", bg: "rgba(34,197,94,.12)" } : { tone: "#B45309", bg: "rgba(245,158,11,.14)" }}>
                    {lead.treatmentConsent ? "Autoriza tratamiento" : "Sin autorización de tratamiento"}
                  </Badge>
                  <Badge meta={lead.marketingConsent ? { tone: "#15803D", bg: "rgba(34,197,94,.12)" } : { tone: "#B45309", bg: "rgba(245,158,11,.14)" }}>
                    {lead.marketingConsent ? "Autoriza comunicaciones" : "Solo gestión de solicitud"}
                  </Badge>
                </div>
              </>
            ) : (
              <div className="admin-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10, marginBottom: 16 }}>
                <InfoTile label="Solicitudes" value={client.requests} />
                <InfoTile label="Valor servicios" value={formatMoney(clientTotals.totalAgreed || client.totalAgreed)} />
                <InfoTile label="Saldo pendiente" value={(clientTotals.receivable || client.receivable) > 0 ? formatMoney(clientTotals.receivable || client.receivable) : "Sin saldo"} />
              </div>
            )}
          </>
        ) : null}

        {activeTab === "comunicaciones" ? (
          <section style={{ padding: 16, borderRadius: 20, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 16 }}>
            <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.2px", fontWeight: 900, color: "#1D4ED8", marginBottom: 10 }}>PERMISOS Y CONTACTO</div>
            <div style={{ display: "grid", gap: 10 }}>
              <InfoTile label="Tratamiento de datos" value={lead.treatmentConsent ? "Autorizado" : "No autorizado"} />
              <InfoTile label="Comunicaciones comerciales" value={lead.marketingConsent ? "Autorizadas" : "No autorizadas"} />
              <InfoTile label="Canal recomendado" value={lead.phone ? "WhatsApp" : lead.email ? "Correo" : "Sin canal registrado"} />
            </div>
          </section>
        ) : null}

        {activeTab === "solicitudes" ? (
          <section style={{ padding: 16, borderRadius: 20, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 16 }}>
            <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.2px", fontWeight: 900, color: "#1D4ED8", marginBottom: 10 }}>SOLICITUDES DEL CLIENTE</div>
            {clientRecords.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {clientRecords.map((record) => (
                  <div key={record.reference} className="admin-client-request-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", padding: 12, borderRadius: 16, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                    <div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                        {getVisibleServiceStatusBadge(record) ? <Badge meta={getVisibleServiceStatusBadge(record).meta}>{getVisibleServiceStatusBadge(record).label}</Badge> : null}
                        <Badge meta={getDueMeta(record)}>{getDueMeta(record).label}</Badge>
                      </div>
                      <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 900, lineHeight: 1.4 }}>{record.title || getServiceTypeLabel(record.serviceType)}</div>
                      <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>{record.reference} · Saldo {record.balance || "$ 0"}</div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <button type="button" onClick={() => onOpenRequest(record.reference)} style={{ padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                        Abrir
                      </button>
                      <button type="button" onClick={() => onDeleteServiceRequest(record.reference, record.title || record.clientName || "solicitud")} style={subtleDangerButtonStyle}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: F, color: "#64748B", lineHeight: 1.7 }}>No se encontraron solicitudes asociadas.</div>
            )}
          </section>
        ) : null}

        {activeTab === "pagos" ? (
          <section style={{ padding: 16, borderRadius: 20, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 16 }}>
            <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.2px", fontWeight: 900, color: "#1D4ED8", marginBottom: 10 }}>PAGOS Y CARTERA</div>
            {clientRecords.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {clientRecords.map((record) => (
                  <div key={record.reference} className="admin-client-request-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 10, alignItems: "center", padding: 12, borderRadius: 16, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                    <div>
                      <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 900, lineHeight: 1.4 }}>{record.title || getServiceTypeLabel(record.serviceType)}</div>
                      <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>Pactado: {record.agreedPrice || "$ 0"} · Pagado: {record.amountPaid || "$ 0"}</div>
                    </div>
                    <Badge meta={getServicePaymentMeta(record.paymentStatus)}>{record.balance || "$ 0"}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: F, color: "#64748B", lineHeight: 1.7 }}>No hay pagos o cartera asociados.</div>
            )}
          </section>
        ) : null}

        {activeTab === "actividad" ? (
          <section style={{ padding: 16, borderRadius: 20, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 16 }}>
            <div style={{ fontFamily: F, fontSize: 12, letterSpacing: "1.2px", fontWeight: 900, color: "#1D4ED8", marginBottom: 12 }}>HISTORIAL</div>
            <ClientTimeline items={activityItems} />
          </section>
        ) : null}

        <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap" }}>
          <button type="button" onClick={() => isLead ? onDeleteLead(lead) : onClose()} style={isLead ? subtleDangerButtonStyle : { ...subtleDangerButtonStyle, visibility: "hidden" }}>
            Eliminar registro
          </button>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => onCreateRequest(isLead ? { type: "lead", lead } : { type: "client", client })} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
              Crear solicitud
            </button>
            {whatsappLink ? <a href={whatsappLink} target="_blank" rel="noopener noreferrer" style={{ padding: "11px 14px", borderRadius: 14, background: "#25D366", color: "#fff", fontFamily: F, fontWeight: 900, textDecoration: "none" }}>WhatsApp</a> : null}
            {email ? <a href={buildMailtoHref({ to: email })} style={{ padding: "11px 14px", borderRadius: 14, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, textDecoration: "none" }}>Correo</a> : null}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ProtectedDeleteDialog({
  dialog,
  credentials,
  busy,
  error,
  onChange,
  onCancel,
  onConfirm
}) {
  if (!dialog?.open || typeof document === "undefined") return null;
  const reasonRequired = Boolean(dialog.requireReason);
  const confirmDisabled = busy ||
    !credentials.username.trim() ||
    !credentials.password.trim() ||
    (reasonRequired && !String(credentials.reason || "").trim());
  const actionText = dialog.confirmLabel || "Confirmar eliminación";

  return createPortal(
    <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.68)", zIndex: 16000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => !busy && onCancel()}>
      <div className="admin-modal-card" style={{ width: "min(540px, 100%)", background: "#fff", borderRadius: 28, padding: 28, border: "1px solid rgba(220,38,38,.18)", boxShadow: "0 28px 72px rgba(15,23,42,.24)" }} onClick={(event) => event.stopPropagation()}>
        <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#B91C1C", fontWeight: 900, fontFamily: F, marginBottom: 10 }}>{dialog.kicker || "ACCIÓN PROTEGIDA"}</div>
        <h3 style={{ margin: 0, fontFamily: FH, fontSize: 30, lineHeight: 1.1, color: "#0B1D3A" }}>{dialog.title || "Eliminar registro"}</h3>
        <p style={{ margin: "12px 0 18px", fontFamily: F, color: "#52647F", lineHeight: 1.8 }}>
          {dialog.description || "Esta acción eliminará el registro seleccionado. Confirma el usuario y la contraseña del panel para continuar."}
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <input style={inputStyle} placeholder="Usuario del panel" value={credentials.username} onChange={(event) => onChange("username", event.target.value)} disabled={busy} />
          <input style={inputStyle} type="password" placeholder="Contraseña del panel" value={credentials.password} onChange={(event) => onChange("password", event.target.value)} disabled={busy} />
          {reasonRequired ? (
            <textarea style={{ ...inputStyle, minHeight: 92, resize: "vertical" }} placeholder="Motivo obligatorio de la acción" value={credentials.reason || ""} onChange={(event) => onChange("reason", event.target.value)} disabled={busy} />
          ) : null}
        </div>
        {error ? (
          <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 700 }}>
            {error}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 18 }}>
          <button type="button" onClick={onCancel} disabled={busy} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: busy ? "not-allowed" : "pointer" }}>
            Cancelar
          </button>
          <button type="button" onClick={onConfirm} disabled={confirmDisabled} style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: confirmDisabled ? "#CBD5E1" : "linear-gradient(135deg,#991B1B,#DC2626)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: confirmDisabled ? "not-allowed" : "pointer" }}>
            {busy ? "Procesando..." : actionText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PaymentsModule({ payments, certificationRecords = [], loading, error, onOpenRequest, onOpenCertification, onCopyPaymentLink, onExportPayments, onVoidPayment }) {
  const [paymentView, setPaymentView] = useState("servicios");
  const pendingLinks = payments.filter((payment) => payment.kind === "link" && payment.status === "pending");
  const approvedPayments = payments.filter((payment) => payment.kind === "payment");
  const pendingAmount = pendingLinks.reduce((sum, payment) => sum + parseCurrency(payment.amount), 0);
  const paidAmount = approvedPayments.reduce((sum, payment) => isAppliedServicePayment(payment) ? sum + parseCurrency(payment.amount) : sum, 0);
  const voidedPayments = approvedPayments.filter(isVoidedServicePayment);
  const certificationPaid = certificationRecords.filter((record) => record.paymentStatus === "approved" || record.source === "paid");
  const certificationPending = certificationRecords.filter((record) => record.paymentStatus !== "approved" && record.source !== "paid");
  const certificationPaidAmount = certificationPaid.reduce((sum, record) => sum + parseCurrency(record.fee), 0);
  const certificationPendingAmount = certificationPending.reduce((sum, record) => sum + parseCurrency(record.fee), 0);
  const showServices = paymentView === "servicios" || paymentView === "todos";
  const showCertifications = paymentView === "certificaciones" || paymentView === "todos";

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ padding: 18, borderRadius: 24, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 16px 36px rgba(15,23,42,.06)" }}>
        <div className="admin-request-filter-grid" style={{ display: "grid", gridTemplateColumns: "minmax(240px,320px) minmax(0,1fr) auto", gap: 12, alignItems: "end" }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.2px", fontWeight: 900, color: "#64748B" }}>VER PAGOS</span>
            <select value={paymentView} onChange={(event) => setPaymentView(event.target.value)} style={inputStyle}>
              <option value="servicios">Solicitudes generales</option>
              <option value="certificaciones">Certificaciones</option>
              <option value="todos">Todo separado por tipo</option>
            </select>
          </label>
          <div style={{ fontFamily: F, color: "#52647F", fontSize: 13, lineHeight: 1.7 }}>
            Los movimientos se separan por origen para que no se mezclen links de solicitudes con pagos de certificaciones.
          </div>
          <button type="button" onClick={onExportPayments} disabled={!payments.length && !certificationRecords.length} style={{ padding: "12px 14px", borderRadius: 14, border: "none", background: payments.length || certificationRecords.length ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "#CBD5E1", color: "#fff", fontFamily: F, fontWeight: 900, cursor: payments.length || certificationRecords.length ? "pointer" : "not-allowed" }}>
            Descargar Excel
          </button>
        </div>
      </section>

      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
        <StatCard label="LINKS SOLICITUDES" value={loading ? "..." : pendingLinks.length} note={`Saldo por cobrar: ${formatMoney(pendingAmount)}`} tone="#C2410C" />
        <StatCard label="PAGOS SOLICITUDES" value={loading ? "..." : approvedPayments.length} note={`Recaudado: ${formatMoney(paidAmount)} · Anulados: ${voidedPayments.length}`} tone="#15803D" />
        <StatCard label="CERTIFICACIONES PAGADAS" value={certificationPaid.length} note={`Recaudado: ${formatMoney(certificationPaidAmount)}`} tone="#1D4ED8" />
        <StatCard label="CERTIFICACIONES PENDIENTES" value={certificationPending.length} note={`Valor asociado: ${formatMoney(certificationPendingAmount)}`} tone="#B45309" />
      </div>

      {showServices ? (
      <section style={{ padding: 22, borderRadius: 28, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 5 }}>SOLICITUDES GENERALES</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 32, color: "#0B1D3A" }}>Links y pagos de solicitudes</h2>
          </div>
          <Badge meta={{ tone: "#475569", bg: "rgba(100,116,139,.10)" }}>{payments.length} movimiento(s)</Badge>
        </div>

        {error ? (
          <div style={{ padding: 14, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 700, marginBottom: 14 }}>
            {error}
          </div>
        ) : null}

        {payments.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {payments.map((payment) => {
              const request = payment.request || {};
              const isPayment = payment.kind === "payment";
              const paymentBadge = getServicePaymentMovementBadge(payment);
              return (
                <div className="admin-payment-movement-card" key={`${payment.kind}-${payment.reference}-${payment.createdAt || payment.paidAt}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: 16, borderRadius: 18, border: "1px solid rgba(37,99,235,.10)", background: isVoidedServicePayment(payment) ? "rgba(245,158,11,.08)" : "#fff" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                      <Badge meta={paymentBadge.meta}>{paymentBadge.label}</Badge>
                      <span style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{formatDate(payment.paidAt || payment.createdAt)}</span>
                    </div>
                    <div style={{ fontFamily: F, fontSize: 15, color: "#0F172A", fontWeight: 900, lineHeight: 1.4 }}>{formatProperName(request.clientName) || "Cliente sin nombre"} · {payment.amountLabel || formatMoney(payment.amount)}</div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                      {request.title || getServiceTypeLabel(request.serviceType)} · {payment.reference}
                      {isPayment && payment.method ? ` · ${payment.method}` : ""}
                      {payment.transactionReference ? ` · Comp. ${payment.transactionReference}` : ""}
                    </div>
                    {payment.supportFiles?.length ? (
                      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
                        {payment.supportFiles.map((file) => (
                          <a key={file.id || file.blobKey} href={file.downloadPath} target="_blank" rel="noopener noreferrer" style={{ padding: "7px 9px", borderRadius: 10, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.12)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, fontSize: 11, textDecoration: "none" }}>
                            {file.originalName || "Soporte"}
                          </a>
                        ))}
                      </div>
                    ) : null}
                    {payment.voidReason ? <div style={{ fontFamily: F, fontSize: 12, color: "#B45309", lineHeight: 1.6 }}>Anulado: {payment.voidReason}</div> : null}
                  </div>
                  <div className="admin-payment-movement-actions" style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {request.reference ? (
                      <button type="button" onClick={() => onOpenRequest(request.reference)} style={{ padding: "9px 11px", borderRadius: 12, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                        Ver solicitud
                      </button>
                    ) : null}
                    {payment.checkoutUrl ? (
                      <button type="button" onClick={() => onCopyPaymentLink(payment.checkoutUrl)} style={{ padding: "9px 11px", borderRadius: 12, border: "none", background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                        Copiar link
                      </button>
                    ) : null}
                    {isPayment && payment.source !== "wompi" && !isVoidedServicePayment(payment) ? (
                      <button type="button" onClick={() => onVoidPayment(request.reference, payment.reference, payment.amountLabel || formatMoney(payment.amount))} style={subtleDangerButtonStyle}>
                        Anular
                      </button>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 18, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.8 }}>
            Aún no hay links ni pagos registrados en solicitudes generales.
          </div>
        )}
      </section>
      ) : null}

      {showCertifications ? (
      <section style={{ padding: 22, borderRadius: 28, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 5 }}>CERTIFICACIONES</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 32, color: "#0B1D3A" }}>Pagos de certificaciones</h2>
          </div>
          <Badge meta={{ tone: "#475569", bg: "rgba(100,116,139,.10)" }}>{certificationRecords.length} registro(s)</Badge>
        </div>

        {certificationRecords.length ? (
          <div style={{ display: "grid", gap: 10 }}>
            {certificationRecords.map((record) => {
              const paid = record.paymentStatus === "approved" || record.source === "paid";
              return (
                <div className="admin-payment-movement-card" key={`cert-${record.reference}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: 16, borderRadius: 18, border: "1px solid rgba(37,99,235,.10)", background: "#fff" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                      <Badge meta={getPaymentMeta(record.paymentStatus)}>{paid ? "Pago confirmado" : getPaymentMeta(record.paymentStatus).label}</Badge>
                      <Badge meta={getStatusMeta(record.certificationStatus)}>{getStatusMeta(record.certificationStatus).label}</Badge>
                      <span style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{formatDate(record.approvedAt || record.createdAt || record.updatedAt)}</span>
                    </div>
                    <div style={{ fontFamily: F, fontSize: 15, color: "#0F172A", fontWeight: 900, lineHeight: 1.4 }}>{formatProperName(record.customerName) || "Cliente sin nombre"} · {record.fee || "$ 0"}</div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>{record.consecutive ? `N° ${record.consecutive}` : record.reference} · {record.destination || "Destino pendiente"}</div>
                  </div>
                  <button type="button" onClick={() => onOpenCertification(record.reference)} style={{ padding: "9px 11px", borderRadius: 12, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                    Ver certificación
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: 18, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.8 }}>
            Aún no hay certificaciones visibles en el panel.
          </div>
        )}
      </section>
      ) : null}
    </div>
  );
}

export default function AdminPanel() {
  const responsiveCss = `
    @media (max-width: 1024px) {
      .admin-shell-grid,
      .admin-detail-grid,
      .admin-dashboard-grid,
      .admin-dashboard-command {
        grid-template-columns: 1fr !important;
      }

      .admin-sidebar,
      .admin-left-column {
        position: static !important;
        top: auto !important;
      }
    }

    @media (max-width: 768px) {
      .admin-topbar {
        grid-template-columns: 1fr !important;
        align-items: stretch !important;
      }

      .admin-shell-grid,
      .admin-detail-grid,
      .admin-info-grid,
      .admin-original-grid,
      .admin-pdf-primary-grid,
      .admin-pdf-income-grid,
      .admin-module-select-card,
      .admin-dashboard-grid,
      .admin-request-filter-grid,
      .admin-request-list button,
      .admin-request-drawer-body {
        grid-template-columns: 1fr !important;
      }

      .admin-topbar-actions,
      .admin-dashboard-actions,
      .admin-module-nav,
      .admin-module-nav label {
        width: 100% !important;
      }

      .admin-dashboard-actions select,
      .admin-dashboard-actions button {
        width: 100% !important;
      }

      .admin-funnel-grid {
        grid-template-columns: repeat(2,minmax(0,1fr)) !important;
      }

      .admin-activity-stat-grid {
        grid-template-columns: repeat(2,minmax(0,1fr)) !important;
      }

      .admin-module-select-card > div:last-child {
        grid-template-columns: 1fr !important;
      }

      .admin-module-tab-grid {
        display: none !important;
      }

      .admin-login-card,
      .admin-sidebar,
      .admin-main {
        padding: 16px !important;
        border-radius: 20px !important;
      }

      .admin-sidebar-list {
        max-height: min(52vh, 520px) !important;
        overflow-y: auto !important;
        padding-right: 0 !important;
      }

      .admin-payment-movement-card {
        grid-template-columns: 1fr !important;
      }

      .admin-client-row,
      .admin-client-request-row {
        grid-template-columns: 1fr !important;
      }

      .admin-client-row > button,
      .admin-client-request-row button {
        width: 100% !important;
      }

      .admin-payment-movement-actions {
        justify-content: stretch !important;
      }

      .admin-payment-movement-actions button {
        width: 100% !important;
      }

      .admin-calendar-grid {
        gap: 6px !important;
      }

      .admin-calendar-grid button {
        min-height: 62px !important;
        padding: 8px !important;
      }

      .admin-modal-overlay {
        padding: 12px !important;
        align-items: flex-start !important;
        overflow-y: auto !important;
      }

      .admin-modal-card {
        width: 100% !important;
        padding: 18px !important;
        border-radius: 20px !important;
        margin-top: 12px !important;
      }

      .admin-request-drawer-overlay {
        padding: 10px !important;
        align-items: flex-start !important;
        overflow-y: auto !important;
      }

      .admin-request-drawer-card {
        max-height: none !important;
        border-radius: 20px !important;
        margin-top: 10px !important;
      }
    }

    @media (max-width: 520px) {
      .admin-funnel-grid,
      .admin-activity-stat-grid {
        grid-template-columns: 1fr !important;
      }
    }
  `;

  const [session, setSession] = useState({
    loading: true,
    configured: true,
    authenticated: false,
    username: ""
  });
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loginBusy, setLoginBusy] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [records, setRecords] = useState([]);
  const [listLoading, setListLoading] = useState(false);
  const [listError, setListError] = useState("");
  const [selectedReference, setSelectedReference] = useState("");
  const [certificationDialogOpen, setCertificationDialogOpen] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [professionalConfig, setProfessionalConfig] = useState(null);
  const [draft, setDraft] = useState(buildReviewDraft());
  const [certificateDraft, setCertificateDraft] = useState(buildCertificateDraftState());
  const [pdfEditMode, setPdfEditMode] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");
  const [pendingSupportFiles, setPendingSupportFiles] = useState([]);
  const [uploadingSupports, setUploadingSupports] = useState(false);
  const [uploadingProfessionalType, setUploadingProfessionalType] = useState("");
  const [preparingOutput, setPreparingOutput] = useState("");
  const [editOverridePassword, setEditOverridePassword] = useState("");
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);
  const [unlockPassword, setUnlockPassword] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [sendDialogOpen, setSendDialogOpen] = useState(false);
  const [sendBusy, setSendBusy] = useState(false);
  const [sendSuccessDialog, setSendSuccessDialog] = useState({
    open: false,
    title: "",
    message: "",
    whatsappLink: "",
    customerEmail: ""
  });
  const [sendDraft, setSendDraft] = useState({
    includeProfessionalCard: false,
    includeJccBackground: false,
    confirmedReview: false
  });
  const [activeModule, setActiveModule] = useState("dashboard");
  const [serviceRecords, setServiceRecords] = useState([]);
  const [serviceLoading, setServiceLoading] = useState(false);
  const [serviceError, setServiceError] = useState("");
  const [serviceSearch, setServiceSearch] = useState("");
  const [serviceStatusFilter, setServiceStatusFilter] = useState("all");
  const [servicePaymentFilter, setServicePaymentFilter] = useState("all");
  const [selectedServiceReference, setSelectedServiceReference] = useState("");
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [serviceDetail, setServiceDetail] = useState(null);
  const [serviceDraft, setServiceDraft] = useState(buildEmptyServiceDraft());
  const [serviceDetailLoading, setServiceDetailLoading] = useState(false);
  const [serviceSaving, setServiceSaving] = useState(false);
  const [serviceDocFiles, setServiceDocFiles] = useState([]);
  const [serviceUploadingDocs, setServiceUploadingDocs] = useState(false);
  const [servicePayments, setServicePayments] = useState([]);
  const [servicePaymentsLoading, setServicePaymentsLoading] = useState(false);
  const [servicePaymentsError, setServicePaymentsError] = useState("");
  const [clientLeads, setClientLeads] = useState([]);
  const [clientLeadsLoading, setClientLeadsLoading] = useState(false);
  const [clientLeadsError, setClientLeadsError] = useState("");
  const [selectedLeadIds, setSelectedLeadIds] = useState(new Set());
  const [clientDetailDialog, setClientDetailDialog] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [deleteCredentials, setDeleteCredentials] = useState(EMPTY_DELETE_CREDENTIALS);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [paymentLinkBusy, setPaymentLinkBusy] = useState(false);
  const [manualPaymentBusy, setManualPaymentBusy] = useState(false);
  const [manualPaymentDraft, setManualPaymentDraft] = useState(EMPTY_MANUAL_PAYMENT_DRAFT);
  const [manualPaymentFiles, setManualPaymentFiles] = useState([]);
  const [taskDraft, setTaskDraft] = useState(EMPTY_TASK_DRAFT);
  const [taskBusy, setTaskBusy] = useState(false);
  const [backupBusy, setBackupBusy] = useState(false);
  const draftRef = useRef(draft);
  const certificateDraftRef = useRef(certificateDraft);
  const certificationDetailRequestRef = useRef(0);

  const deferredSearch = useDeferredValue(search);
  const deferredServiceSearch = useDeferredValue(serviceSearch);
  const certificateIncomePreview = useMemo(
    () => buildCertificateIncomePreview(certificateDraft),
    [certificateDraft]
  );
  const certificateEventualEditorRows = useMemo(
    () => parseEventualIncomeRows(certificateDraft.ingresos_eventuales_json),
    [certificateDraft.ingresos_eventuales_json]
  );
  const certificateEventualPreview = useMemo(
    () => certificateEventualEditorRows.filter(isCompleteEventualIncomeRow),
    [certificateEventualEditorRows]
  );
  const lockedStatuses = new Set(["enviada", "pago_no_confirmado", "rechazada"]);
  const isLockedStatus = lockedStatuses.has(detail?.summary?.certificationStatus);
  const editLocked = Boolean(isLockedStatus && !editOverridePassword);
  const originalFormData = detail?.formData || {};
  const activeModuleMeta = ADMIN_MODULES.find((module) => module.id === activeModule) || ADMIN_MODULES[0];

  useEffect(() => {
    draftRef.current = draft;
  }, [draft]);

  useEffect(() => {
    certificateDraftRef.current = certificateDraft;
  }, [certificateDraft]);

  const handleTogglePdfEditMode = () => {
    if (editLocked) {
      setUnlockDialogOpen(true);
      return;
    }
    setPdfEditMode((current) => !current);
  };

  const getModifiedFieldMeta = (field) => {
    const modified = isFieldModified(originalFormData, certificateDraft, field);
    return {
      modified,
      label: modified ? "Modificado" : "Original"
    };
  };

  const loadSession = async () => {
    try {
      const response = await fetch("/api/admin-session");
      const data = await response.json();
      setSession({
        loading: false,
        configured: Boolean(data.configured),
        authenticated: Boolean(data.authenticated),
        username: data.username || ""
      });
    } catch (error) {
      setSession({
        loading: false,
        configured: true,
        authenticated: false,
        username: ""
      });
      setLoginError("No fue posible validar la sesion del panel.");
    }
  };

  const loadRecords = async () => {
    setListLoading(true);
    setListError("");

    try {
      const response = await fetch("/api/admin-list-certifications");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No fue posible cargar las solicitudes.");
      }

      startTransition(() => {
        setRecords(data.records || []);
      });
    } catch (error) {
      setListError(error.message);
    } finally {
      setListLoading(false);
    }
  };

  const loadServiceRecords = async (preferredReference = "") => {
    setServiceLoading(true);
    setServiceError("");

    try {
      const response = await fetch("/api/admin-list-service-requests");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible cargar las solicitudes generales.");
      }

      const nextRecords = data.records || [];
      setServiceRecords(nextRecords);

      const nextReference = preferredReference ||
        (selectedServiceReference && nextRecords.some((record) => record.reference === selectedServiceReference)
          ? selectedServiceReference
          : "");

      if (nextReference && nextReference !== selectedServiceReference) {
        setSelectedServiceReference(nextReference);
      } else if (selectedServiceReference && !nextReference) {
        setSelectedServiceReference("");
        setServiceDetail(null);
        setServiceDraft(buildEmptyServiceDraft());
        setServiceDocFiles([]);
        setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
        setManualPaymentFiles([]);
        setTaskDraft(EMPTY_TASK_DRAFT);
        setServiceDialogOpen(false);
      }
    } catch (error) {
      setServiceError(error.message);
    } finally {
      setServiceLoading(false);
    }
  };

  const loadServiceDetail = async (reference) => {
    if (!reference) return null;

    setServiceDetailLoading(true);
    setServiceError("");

    try {
      const response = await fetch(`/api/admin-get-service-request?reference=${encodeURIComponent(reference)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible cargar la solicitud general.");
      }

      setServiceDetail(data.detail);
      setServiceDraft(buildServiceDraftFromDetail(data.detail));
      setServiceDocFiles([]);
      setManualPaymentFiles([]);
      setTaskDraft(EMPTY_TASK_DRAFT);
      return data.detail;
    } catch (error) {
      setServiceError(error.message);
      return null;
    } finally {
      setServiceDetailLoading(false);
    }
  };

  const loadServicePayments = async () => {
    setServicePaymentsLoading(true);
    setServicePaymentsError("");

    try {
      const response = await fetch("/api/admin-list-service-payments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible cargar los pagos.");
      }

      setServicePayments(data.payments || []);
    } catch (error) {
      setServicePaymentsError(error.message);
    } finally {
      setServicePaymentsLoading(false);
    }
  };

  const loadClientLeads = async () => {
    setClientLeadsLoading(true);
    setClientLeadsError("");

    try {
      const response = await fetch("/api/admin-list-client-leads");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible cargar los clientes captados.");
      }

      const nextLeads = data.leads || [];
      setClientLeads(nextLeads);
      setSelectedLeadIds((current) => {
        const validIds = new Set(nextLeads.map((lead) => lead.id));
        return new Set([...current].filter((leadId) => validIds.has(leadId)));
      });
    } catch (error) {
      setClientLeadsError(error.message);
    } finally {
      setClientLeadsLoading(false);
    }
  };

  const loadDetail = async (reference) => {
    if (!reference) return;
    const requestId = certificationDetailRequestRef.current + 1;
    certificationDetailRequestRef.current = requestId;
    const isCurrentRequest = () => requestId === certificationDetailRequestRef.current;

    setDetailLoading(true);
    setDetailError("");

    try {
      const response = await fetch(`/api/admin-get-certification?reference=${encodeURIComponent(reference)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No fue posible cargar el detalle.");
      }

      if (!isCurrentRequest()) return null;
      setDetail(data.detail);
      setProfessionalConfig(data.professionalConfig || null);
      setDraft(buildReviewDraft(data.detail));
      setCertificateDraft(buildCertificateDraftState(data.detail?.certificateData));
      setEditOverridePassword("");
      setUnlockPassword("");
      setUnlockError("");
      setUnlockDialogOpen(false);
      setPendingSupportFiles([]);
      setPdfEditMode(false);
      return data.detail;
    } catch (error) {
      if (isCurrentRequest()) {
        setDetailError(error.message);
      }
      return null;
    } finally {
      if (isCurrentRequest()) {
        setDetailLoading(false);
      }
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  useEffect(() => {
    if (session.authenticated) {
      loadRecords();
      loadServiceRecords();
      loadServicePayments();
      loadClientLeads();
    }
  }, [session.authenticated]);

  useEffect(() => {
    if (session.authenticated && serviceDialogOpen && selectedServiceReference) {
      loadServiceDetail(selectedServiceReference);
    }
  }, [session.authenticated, serviceDialogOpen, selectedServiceReference]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredRecords = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();
    const filtered = records.filter((record) => {
      const matchesFilter = filter === "all" ? true : record.certificationStatus === filter;
      if (!matchesFilter) return false;
      if (!term) return true;

      return [
        record.reference,
        record.consecutive,
        record.customerName,
        record.customerEmail,
        record.destination
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    const sorted = [...filtered];
    sorted.sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));

    return sorted;
  }, [records, filter, deferredSearch]);

  const filteredServiceRecords = useMemo(() => {
    const term = deferredServiceSearch.trim().toLowerCase();
    const filtered = serviceRecords.filter((record) => {
      if (serviceStatusFilter !== "all" && record.status !== serviceStatusFilter) return false;
      if (servicePaymentFilter !== "all" && record.paymentStatus !== servicePaymentFilter) return false;
      if (!term) return true;

      return [
        record.reference,
        record.title,
        record.clientName,
        record.clientDocumentNumber,
        record.clientEmail,
        record.clientPhone,
        getServiceTypeLabel(record.serviceType)
      ]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });

    return [...filtered].sort((left, right) => {
      const leftDays = daysUntilDue(left.dueDate);
      const rightDays = daysUntilDue(right.dueDate);
      if (leftDays === null && rightDays !== null) return 1;
      if (leftDays !== null && rightDays === null) return -1;
      if (leftDays !== null && rightDays !== null) return leftDays - rightDays;
      return new Date(right.updatedAt || 0) - new Date(left.updatedAt || 0);
    });
  }, [serviceRecords, serviceStatusFilter, servicePaymentFilter, deferredServiceSearch]);

  const serviceDashboard = useMemo(() => buildServiceDashboard(serviceRecords), [serviceRecords]);
  const clientRows = useMemo(() => buildClientRows(serviceRecords), [serviceRecords]);
  const clientLeadRows = useMemo(() => buildLeadRows(clientLeads), [clientLeads]);

  const scrollAdminMainIntoViewOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth <= 768) {
      window.setTimeout(() => document.querySelector(".admin-main")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginBusy(true);
    setLoginError("");

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No fue posible iniciar sesion.");
      }

      await loadSession();
      setCredentials({ username: "", password: "" });
    } catch (error) {
      setLoginError(error.message);
    } finally {
      setLoginBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin-logout", { method: "POST" });
    certificationDetailRequestRef.current += 1;
    setRecords([]);
    setSelectedReference("");
    setCertificationDialogOpen(false);
    setDetail(null);
    setDraft(buildReviewDraft());
    setCertificateDraft(buildCertificateDraftState());
    setServiceRecords([]);
    setServicePayments([]);
    setClientLeads([]);
    setSelectedLeadIds(new Set());
    setClientDetailDialog(null);
    setDeleteDialog(null);
    setDeleteCredentials(EMPTY_DELETE_CREDENTIALS);
    setDeleteError("");
    setSelectedServiceReference("");
    setServiceDialogOpen(false);
    setServiceDetail(null);
    setServiceDetailLoading(false);
    setServiceDraft(buildEmptyServiceDraft());
    setServiceDocFiles([]);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
    setManualPaymentFiles([]);
    setTaskDraft(EMPTY_TASK_DRAFT);
    setEditOverridePassword("");
    setUnlockPassword("");
    setUnlockError("");
    setUnlockDialogOpen(false);
    setPdfEditMode(false);
    loadSession();
  };

  const persistDraft = async (action = "save", extra = {}) => {
    if (!detail?.summary?.reference) return null;
    const reviewDraftSnapshot = extra.reviewDraft || draftRef.current;
    const certificateDraftSnapshot = extra.certificateDraft || recalculateCertificateDerivedFields({ ...certificateDraftRef.current });

    const response = await fetch("/api/admin-update-certification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: detail.summary.reference,
        certificationStatus: reviewDraftSnapshot.certificationStatus,
        adminNotes: reviewDraftSnapshot.adminNotes,
        certificateAdjustmentNote: reviewDraftSnapshot.certificateAdjustmentNote,
        requestedDocumentsMessage: reviewDraftSnapshot.requestedDocumentsMessage,
        certificateOverrides: certificateDraftSnapshot,
        overridePassword: editOverridePassword,
        action,
        ...extra
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.detail || data.error || "No fue posible guardar los cambios.");
    }

    setDetail(data.detail);
    setDraft(buildReviewDraft(data.detail));
    setCertificateDraft(buildCertificateDraftState(data.detail?.certificateData));
    await loadRecords();
    return data.detail;
  };

  const handleSave = async () => {
    try {
      await persistDraft("save");
      setPdfEditMode(false);
      setNotice("Cambios guardados.");
    } catch (error) {
      setDetailError(error.message);
    }
  };

  const handleQuickStatus = async (nextStatus) => {
    try {
      setDraft((current) => ({ ...current, certificationStatus: nextStatus }));
      const reviewDraftSnapshot = {
        ...draftRef.current,
        certificationStatus: nextStatus
      };
      const certificateDraftSnapshot = recalculateCertificateDerivedFields({ ...certificateDraftRef.current });
      await fetch("/api/admin-update-certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: detail.summary.reference,
        certificationStatus: nextStatus,
        adminNotes: reviewDraftSnapshot.adminNotes,
        certificateAdjustmentNote: reviewDraftSnapshot.certificateAdjustmentNote,
        requestedDocumentsMessage: reviewDraftSnapshot.requestedDocumentsMessage,
        certificateOverrides: certificateDraftSnapshot,
        overridePassword: editOverridePassword,
        action: "save"
      })
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || data.error || "No fue posible actualizar el estado.");
        setDetail(data.detail);
        setDraft(buildReviewDraft(data.detail));
        setCertificateDraft(buildCertificateDraftState(data.detail?.certificateData));
      });
      await loadRecords();
      setNotice("Estado actualizado.");
    } catch (error) {
      setDetailError(error.message);
    }
  };

  const handleRegisterAndOpen = async (channel) => {
    if (!detail) return;

    const link =
      channel === "whatsapp"
        ? buildWhatsappLink(detail, draft.requestedDocumentsMessage)
        : buildMailtoLink(detail, draft.requestedDocumentsMessage);

    if (!link) {
      setDetailError(
        channel === "whatsapp"
          ? "La solicitud no tiene un numero de WhatsApp valido."
          : "La solicitud no tiene correo electronico valido."
      );
      return;
    }

    window.open(link, "_blank", "noopener,noreferrer");

    try {
      await persistDraft("request_documents", {
        certificationStatus: "documentos_solicitados",
        contactChannel: channel
      });
      setNotice(
        channel === "whatsapp"
          ? "Solicitud registrada y WhatsApp abierto."
          : "Solicitud registrada y correo abierto."
      );
    } catch (error) {
      setDetailError(error.message);
    }
  };

  const handlePendingSupportSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setPendingSupportFiles((current) => [...current, ...files]);
    event.target.value = "";
  };

  const handleRemovePendingSupport = (index) => {
    setPendingSupportFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleUploadSupports = async () => {
    if (!detail?.summary?.reference || !pendingSupportFiles.length) return;

    setUploadingSupports(true);
    setDetailError("");

    try {
      const body = new FormData();
      body.append("reference", detail.summary.reference);
      if (editOverridePassword) {
        body.append("overridePassword", editOverridePassword);
      }
      pendingSupportFiles.forEach((file) => body.append("files", file));

      const response = await fetch("/api/admin-upload-certification-supports", {
        method: "POST",
        body
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No fue posible cargar los soportes.");
      }

      setDetail(data.detail);
      setPendingSupportFiles([]);
      await loadRecords();
      setNotice(
        data.uploadedCount === 1
          ? "Soporte cargado en la solicitud."
          : `Se cargaron ${data.uploadedCount} soportes en la solicitud.`
      );
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setUploadingSupports(false);
    }
  };

  const handleSelectServiceRequest = (reference) => {
    const sameReference = reference && reference === selectedServiceReference;
    setSelectedServiceReference(reference);
    setServiceDetail(null);
    setServiceDetailLoading(Boolean(reference));
    setServiceDraft(buildEmptyServiceDraft());
    setServiceDocFiles([]);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
    setManualPaymentFiles([]);
    setTaskDraft(EMPTY_TASK_DRAFT);
    setServiceError("");
    setActiveModule("solicitudes");
    setServiceDialogOpen(true);
    if (sameReference) {
      loadServiceDetail(reference);
    }
  };

  const handleStartNewServiceRequest = () => {
    setSelectedServiceReference("");
    setServiceDetail(null);
    setServiceDetailLoading(false);
    setServiceDraft(buildEmptyServiceDraft());
    setServiceDocFiles([]);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
    setManualPaymentFiles([]);
    setTaskDraft(EMPTY_TASK_DRAFT);
    setServiceError("");
    setActiveModule("solicitudes");
    setServiceDialogOpen(true);
  };

  const handleCloseServiceDialog = () => {
    if (serviceSaving || serviceUploadingDocs || paymentLinkBusy || manualPaymentBusy || taskBusy) return;
    setServiceDialogOpen(false);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
    setManualPaymentFiles([]);
    setTaskDraft(EMPTY_TASK_DRAFT);
  };

  const handleOpenCertificationRecord = (reference) => {
    if (!reference) return;
    setSelectedReference(reference);
    setCertificationDialogOpen(true);
    setDetail(null);
    setDetailLoading(true);
    setDetailError("");
    setActiveModule("certificaciones");
    loadDetail(reference);
  };

  const handleCloseCertificationDialog = () => {
    if (preparingOutput || sendBusy || uploadingSupports) return;
    certificationDetailRequestRef.current += 1;
    setCertificationDialogOpen(false);
    setSelectedReference("");
    setDetail(null);
    setDetailLoading(false);
    setDetailError("");
    setPendingSupportFiles([]);
    setPdfEditMode(false);
    setUnlockDialogOpen(false);
    setSendDialogOpen(false);
    setUnlockPassword("");
    setUnlockError("");
    if (session.authenticated) {
      loadRecords();
    }
  };

  const handleModuleChange = (moduleId) => {
    setActiveModule(moduleId);
    if (moduleId !== "certificaciones") {
      certificationDetailRequestRef.current += 1;
      setCertificationDialogOpen(false);
      setSelectedReference("");
      setDetail(null);
      setDetailLoading(false);
      setDetailError("");
      setPendingSupportFiles([]);
      setPdfEditMode(false);
      setUnlockDialogOpen(false);
      setSendDialogOpen(false);
    }
    if (moduleId !== "solicitudes") {
      setServiceDialogOpen(false);
      setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
      setManualPaymentFiles([]);
      setTaskDraft(EMPTY_TASK_DRAFT);
    }
  };

  const handleServiceDraftChange = (field, value) => {
    setServiceDraft((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleServiceClientChange = (field, value) => {
    setServiceDraft((current) => ({
      ...current,
      client: {
        ...current.client,
        [field]: value
      }
    }));
  };

  const handleServiceCurrencyChange = (field, value) => {
    setServiceDraft((current) => ({
      ...current,
      [field]: normalizeCurrencyInput(value)
    }));
  };

  const saveServiceRequest = async () => {
    setServiceSaving(true);
    setServiceError("");

    try {
      const clientInput = serviceDraft.client || {};
      const requiredValidations = [
        [clientInput.name, "Ingresa el nombre del cliente antes de guardar."],
        [clientInput.documentType, "Selecciona el tipo de documento del cliente."],
        [clientInput.documentNumber, "Ingresa el número de documento del cliente."],
        [clientInput.phone, "Ingresa el WhatsApp o teléfono del cliente."],
        [clientInput.email, "Ingresa el correo electrónico del cliente."],
        [serviceDraft.title, "Ingresa un título o asunto para la solicitud."],
        [serviceDraft.serviceType, "Selecciona el tipo de servicio."],
        [serviceDraft.status, "Selecciona el estado de la solicitud."],
        [serviceDraft.paymentStatus, "Selecciona el estado de pago."],
        [serviceDraft.dueDate, "Selecciona la fecha de vencimiento de la solicitud."]
      ];

      const missing = requiredValidations.find(([value]) => !String(value || "").trim());
      if (missing) throw new Error(missing[1]);

      if (!normalizeDocumentIdentity(clientInput.documentNumber)) {
        throw new Error("El número de documento debe tener caracteres válidos.");
      }

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(clientInput.email || "").trim())) {
        throw new Error("Ingresa un correo electrónico válido.");
      }

      if (parseCurrency(serviceDraft.agreedPrice) <= 0) {
        throw new Error("Ingresa el costo pactado del servicio.");
      }

      const payload = {
        ...serviceDraft,
        client: {
          ...serviceDraft.client,
          name: formatProperName(serviceDraft.client?.name || "")
        }
      };

      setServiceDraft(payload);

      const response = await fetch("/api/admin-upsert-service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible guardar la solicitud general.");
      }

      setServiceDetail(data.detail);
      setServiceDraft(buildServiceDraftFromDetail(data.detail));
      setSelectedServiceReference(data.detail.reference);
      await loadServiceRecords(data.detail.reference);
      await loadServicePayments();
      if (data.paymentLinkWarning) {
        setNotice(`Solicitud general guardada. No se pudo generar el link automático: ${data.paymentLinkWarning}`);
      } else if (data.paymentLinkCreated) {
        setNotice("Solicitud general guardada y link de pago generado automáticamente.");
      } else if (data.paymentLinkReused) {
        setNotice("Solicitud general guardada. El link de pago vigente quedó disponible en el portal.");
      } else {
        setNotice("Solicitud general guardada.");
      }
      return data.detail;
    } catch (error) {
      setServiceError(error.message);
      return null;
    } finally {
      setServiceSaving(false);
    }
  };

  const handleServiceDocSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setServiceDocFiles((current) => [...current, ...files]);
    event.target.value = "";
  };

  const handleRemoveServiceDoc = (index) => {
    setServiceDocFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleCopyPaymentLink = async (url) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setNotice("Link de pago copiado.");
    } catch {
      setNotice("No fue posible copiar automáticamente. Puedes copiar el link manualmente.");
    }
  };

  const handleCreateServicePaymentLink = async () => {
    if (!serviceDraft.reference) return;

    setPaymentLinkBusy(true);
    setServiceError("");

    try {
      const response = await fetch("/api/admin-create-service-payment-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: serviceDraft.reference
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible generar el link de pago.");
      }

      setServiceDetail(data.detail);
      setServiceDraft(buildServiceDraftFromDetail(data.detail));
      await loadServiceRecords(data.detail.reference);
      await loadServicePayments();
      setNotice("Link de pago generado para esta solicitud.");
      if (data.paymentLink?.checkoutUrl) {
        await handleCopyPaymentLink(data.paymentLink.checkoutUrl);
      }
    } catch (error) {
      setServiceError(error.message);
    } finally {
      setPaymentLinkBusy(false);
    }
  };

  const handleManualPaymentDraftChange = (field, value) => {
    setManualPaymentDraft((current) => ({
      ...current,
      [field]: field === "amount" ? normalizeCurrencyInput(value) : value
    }));
  };

  const handlePaymentSupportSelection = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setManualPaymentFiles((current) => [...current, ...files]);
    event.target.value = "";
  };

  const handleRemovePaymentSupport = (index) => {
    setManualPaymentFiles((current) => current.filter((_, fileIndex) => fileIndex !== index));
  };

  const handleTaskDraftChange = (field, value) => {
    setTaskDraft((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleRegisterManualServicePayment = async () => {
    if (!serviceDraft.reference) return;

    setManualPaymentBusy(true);
    setServiceError("");

    try {
      const body = new FormData();
      body.append("reference", serviceDraft.reference);
      body.append("amount", manualPaymentDraft.amount);
      body.append("method", manualPaymentDraft.method);
      body.append("paidAt", manualPaymentDraft.paidAt);
      body.append("transactionReference", manualPaymentDraft.transactionReference);
      body.append("payerName", manualPaymentDraft.payerName);
      body.append("note", manualPaymentDraft.note);
      manualPaymentFiles.forEach((file) => body.append("supportFiles", file));

      const response = await fetch("/api/admin-register-service-payment", {
        method: "POST",
        body
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible registrar el pago manual.");
      }

      setServiceDetail(data.detail);
      setServiceDraft(buildServiceDraftFromDetail(data.detail));
      setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
      setManualPaymentFiles([]);
      await loadServiceRecords(data.detail.reference);
      await loadServicePayments();
      const nextBalance = Number(data.detail?.financials?.balanceAmount || 0);
      setNotice(
        nextBalance > 0
          ? `Pago manual registrado. El saldo quedó en ${formatMoney(nextBalance)}; genera un nuevo link si deseas cobrar el saldo restante.`
          : "Pago manual registrado. La solicitud quedó sin saldo pendiente."
      );
    } catch (error) {
      setServiceError(error.message);
    } finally {
      setManualPaymentBusy(false);
    }
  };

  const handleSaveServiceTask = async (taskOverride = null) => {
    if (!serviceDraft.reference) return;
    const taskPayload = taskOverride || taskDraft;
    if (!String(taskPayload.title || "").trim()) {
      setServiceError("Ingresa el título de la tarea.");
      return;
    }

    setTaskBusy(true);
    setServiceError("");

    try {
      const response = await fetch("/api/admin-upsert-service-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: serviceDraft.reference,
          task: taskPayload
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible guardar la tarea.");
      }

      setServiceDetail(data.detail);
      setServiceDraft(buildServiceDraftFromDetail(data.detail));
      if (!taskOverride) {
        setTaskDraft(EMPTY_TASK_DRAFT);
      }
      await loadServiceRecords(data.detail.reference);
      setNotice(taskOverride?.status === "done" ? "Tarea marcada como completada." : "Tarea agregada a la solicitud.");
    } catch (error) {
      setServiceError(error.message);
    } finally {
      setTaskBusy(false);
    }
  };

  const handleCompleteServiceTask = (task) => {
    if (!task?.id) return;
    handleSaveServiceTask({ ...task, status: "done" });
  };

  const handleUploadServiceDocuments = async () => {
    if (!serviceDraft.reference || !serviceDocFiles.length) return;

    setServiceUploadingDocs(true);
    setServiceError("");

    try {
      const body = new FormData();
      body.append("reference", serviceDraft.reference);
      serviceDocFiles.forEach((file) => body.append("files", file));

      const response = await fetch("/api/admin-upload-service-request-documents", {
        method: "POST",
        body
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible cargar los documentos.");
      }

      setServiceDetail(data.detail);
      setServiceDraft(buildServiceDraftFromDetail(data.detail));
      setServiceDocFiles([]);
      await loadServiceRecords(data.detail.reference);
      await loadServicePayments();
      setNotice(data.uploadedCount === 1 ? "Documento cargado en la solicitud." : `Se cargaron ${data.uploadedCount} documentos.`);
    } catch (error) {
      setServiceError(error.message);
    } finally {
      setServiceUploadingDocs(false);
    }
  };

  const handleOpenClientRequests = (client) => {
    setClientDetailDialog(null);
    setServiceSearch(client.documentNumber || client.name || "");
    setServiceStatusFilter("all");
    setServicePaymentFilter("all");
    const clientDocumentKey = normalizeDocumentIdentity(client.documentNumber);
    const matchingRequest = serviceRecords.find((record) => {
      return normalizeDocumentIdentity(record.clientDocumentNumber) === clientDocumentKey && Boolean(clientDocumentKey);
    });

    if (matchingRequest?.reference) {
      handleSelectServiceRequest(matchingRequest.reference);
      return;
    }

    setSelectedServiceReference("");
    setServiceDetail(null);
    setServiceDraft(buildEmptyServiceDraft());
    setServiceDocFiles([]);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
    setManualPaymentFiles([]);
    setTaskDraft(EMPTY_TASK_DRAFT);
    setServiceError("");
    setActiveModule("solicitudes");
    scrollAdminMainIntoViewOnMobile();
  };

  const handleOpenClientByDocument = (client = {}) => {
    const documentKey = normalizeDocumentIdentity(client.documentNumber);
    if (!documentKey) {
      setNotice("Registra el número de documento para consultar el expediente del cliente.");
      return;
    }

    const existingClient = clientRows.find((row) => normalizeDocumentIdentity(row.documentNumber) === documentKey) || {
      key: `doc:${documentKey}`,
      name: formatProperName(client.name || "Cliente sin nombre"),
      documentNumber: client.documentNumber,
      email: client.email || "",
      phone: client.phone || "",
      requests: 0,
      active: 0,
      totalAgreed: 0,
      totalPaid: 0,
      receivable: 0,
      lastUpdatedAt: ""
    };

    setServiceDialogOpen(false);
    setClientDetailDialog({ type: "client", client: existingClient });
    setActiveModule("clientes");
    scrollAdminMainIntoViewOnMobile();
  };

  const handleCreateRequestFromClient = (source = {}) => {
    const isLeadSource = source.type === "lead";
    const sourceClient = isLeadSource ? source.lead || {} : source.client || {};
    const serviceInterest = String(sourceClient.serviceInterest || "").trim();
    const comments = isLeadSource
      ? [
          sourceClient.createdAt ? `Cliente captado desde la web el ${formatDate(sourceClient.createdAt)}.` : "Cliente captado desde la web.",
          serviceInterest ? `Servicio de interés: ${serviceInterest}.` : "",
          sourceClient.comment ? `Comentario inicial: ${sourceClient.comment}` : ""
        ].filter(Boolean).join("\n")
      : "Solicitud creada desde el expediente del cliente.";

    setClientDetailDialog(null);
    setSelectedServiceReference("");
    setServiceDetail(null);
    setServiceDetailLoading(false);
    setServiceDraft({
      ...buildEmptyServiceDraft(),
      title: isLeadSource
        ? `Solicitud - ${serviceInterest || "Asesoría contable"}`
        : `Nueva solicitud - ${sourceClient.name || "Cliente"}`,
      serviceType: inferServiceTypeFromText(serviceInterest || sourceClient.comment || ""),
      comments,
      client: {
        name: formatProperName(sourceClient.name || ""),
        documentType: "CC",
        documentNumber: sourceClient.documentNumber || "",
        phone: sourceClient.phone || "",
        email: sourceClient.email || ""
      }
    });
    setServiceDocFiles([]);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
    setManualPaymentFiles([]);
    setTaskDraft(EMPTY_TASK_DRAFT);
    setServiceError("");
    setActiveModule("solicitudes");
    setServiceDialogOpen(true);
    setNotice("Solicitud nueva preparada con los datos del cliente.");
    scrollAdminMainIntoViewOnMobile();
  };

  const openDeleteDialog = (dialog) => {
    setDeleteDialog({ open: true, ...dialog });
    setDeleteCredentials({ ...EMPTY_DELETE_CREDENTIALS, username: session.username || "" });
    setDeleteError("");
  };

  const handleRequestLeadDelete = (lead) => {
    openDeleteDialog({
      type: "lead",
      id: lead.id,
      title: "Eliminar cliente captado",
      description: `Se eliminará el registro de ${lead.name || "este cliente"} captado desde la web. Esta acción no elimina solicitudes generales.`
    });
  };

  const handleRequestServiceDelete = (reference, label = "solicitud") => {
    openDeleteDialog({
      type: "service-request",
      reference,
      title: "Eliminar solicitud",
      description: `Se eliminará la solicitud ${label} junto con sus documentos y links de pago asociados.`
    });
  };

  const handleRequestPaymentVoid = (reference, paymentReference, amountLabel = "este pago") => {
    openDeleteDialog({
      type: "service-payment",
      reference,
      paymentReference,
      title: "Anular pago",
      kicker: "ANULACIÓN FINANCIERA",
      confirmLabel: "Anular pago",
      requireReason: true,
      description: `Se anulará el movimiento ${amountLabel} (${paymentReference}). El saldo de la solicitud se recalculará y, si queda cartera pendiente, el próximo link de pago se generará por el saldo actualizado.`
    });
  };

  const handleDeleteCredentialChange = (field, value) => {
    setDeleteCredentials((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleCancelDelete = () => {
    if (deleteBusy) return;
    setDeleteDialog(null);
    setDeleteCredentials(EMPTY_DELETE_CREDENTIALS);
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog?.type) return;

    setDeleteBusy(true);
    setDeleteError("");

    try {
      let endpoint = "/api/admin-delete-service-request";
      let payload = { reference: deleteDialog.reference };

      if (deleteDialog.type === "lead") {
        endpoint = "/api/admin-delete-client-lead";
        payload = { id: deleteDialog.id };
      } else if (deleteDialog.type === "service-payment") {
        endpoint = "/api/admin-void-service-payment";
        payload = {
          reference: deleteDialog.reference,
          paymentReference: deleteDialog.paymentReference,
          reason: deleteCredentials.reason
        };
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          username: deleteCredentials.username,
          password: deleteCredentials.password
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible eliminar el registro.");
      }

      if (deleteDialog.type === "lead") {
        setClientLeads((current) => current.filter((lead) => lead.id !== deleteDialog.id));
        setSelectedLeadIds((current) => {
          const next = new Set(current);
          next.delete(deleteDialog.id);
          return next;
        });
      } else if (deleteDialog.type === "service-payment") {
        if (data.detail) {
          setServiceDetail(data.detail);
          setServiceDraft(buildServiceDraftFromDetail(data.detail));
          setSelectedServiceReference(data.detail.reference);
        }
      } else {
        setServiceRecords((current) => current.filter((record) => record.reference !== deleteDialog.reference));
        setServicePayments((current) => current.filter((payment) => payment.request?.reference !== deleteDialog.reference && payment.serviceReference !== deleteDialog.reference));
        if (selectedServiceReference === deleteDialog.reference) {
          setSelectedServiceReference("");
          setServiceDialogOpen(false);
          setServiceDetail(null);
          setServiceDraft(buildEmptyServiceDraft());
          setServiceDocFiles([]);
          setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
        }
      }

      if (deleteDialog.type !== "service-payment") {
        setClientDetailDialog(null);
      }
      setDeleteDialog(null);
      setDeleteCredentials(EMPTY_DELETE_CREDENTIALS);
      setNotice(deleteDialog.type === "lead"
        ? "Cliente captado eliminado."
        : deleteDialog.type === "service-payment"
          ? "Pago anulado. El saldo de la solicitud fue recalculado."
          : "Solicitud eliminada.");

      if (deleteDialog.type === "service-payment") {
        await Promise.all([loadServiceRecords(data.detail?.reference || deleteDialog.reference), loadServicePayments()]);
      } else {
        await Promise.all([loadClientLeads(), loadServiceRecords(), loadServicePayments()]);
      }
    } catch (error) {
      setDeleteError(error.message);
    } finally {
      setDeleteBusy(false);
    }
  };

  const handleToggleAllLeads = (leadIds = []) => {
    setSelectedLeadIds(new Set(leadIds));
  };

  const handleExportClientLeads = () => {
    const csv = buildLeadsCsv(clientLeadRows);
    downloadCsvFile(`clientes-potenciales-contarae-${new Date().toISOString().slice(0, 10)}.csv`, csv);
    setNotice("Base de clientes potenciales exportada.");
  };

  const handleExportClients = () => {
    downloadCsvFile(`clientes-contarae-${new Date().toISOString().slice(0, 10)}.csv`, buildClientsCsv(clientRows));
    setNotice("Base de clientes exportada.");
  };

  const handleExportServiceRequests = () => {
    downloadCsvFile(`solicitudes-contarae-${new Date().toISOString().slice(0, 10)}.csv`, buildServiceRequestsCsv(serviceRecords));
    setNotice("Libro de solicitudes exportado.");
  };

  const handleExportPayments = () => {
    downloadCsvFile(`pagos-contarae-${new Date().toISOString().slice(0, 10)}.csv`, buildPaymentsCsv(servicePayments, records));
    setNotice("Libro de pagos y cartera exportado.");
  };

  const handleExportCertifications = () => {
    downloadCsvFile(`certificaciones-contarae-${new Date().toISOString().slice(0, 10)}.csv`, buildCertificationsCsv(records));
    setNotice("Libro de certificaciones exportado.");
  };

  const handleDownloadBackup = async () => {
    setBackupBusy(true);
    setNotice("");

    try {
      const response = await fetch("/api/admin-export-operations-backup");
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || data.error || "No fue posible generar el backup.");
      }

      const blob = await response.blob();
      downloadBlobFile(`backup-contarae-${new Date().toISOString().slice(0, 10)}.json`, blob);
      setNotice("Backup operativo descargado.");
    } catch (error) {
      setNotice(error.message);
    } finally {
      setBackupBusy(false);
    }
  };

  const handleCopyLeadPhones = async (leads = []) => {
    const phones = leads.map((lead) => normalizeWhatsappPhone(lead.phone)).filter(Boolean);
    if (!phones.length) return;

    try {
      await navigator.clipboard.writeText(phones.join("\n"));
      setNotice("WhatsApps autorizados copiados.");
    } catch {
      setNotice("No fue posible copiar automaticamente. Puedes copiar los numeros desde la lista.");
    }
  };

  const handleOpenBulkEmail = (leads = []) => {
    if (leads.length) {
      setNotice(`Correo masivo preparado para ${leads.length} cliente(s) autorizado(s).`);
    }
  };

  const handleRefreshPanel = () => {
    loadRecords();
    loadServiceRecords();
    loadServicePayments();
    loadClientLeads();
    if (selectedServiceReference) {
      loadServiceDetail(selectedServiceReference);
    }
    if (selectedReference) {
      loadDetail(selectedReference);
    }
  };

  const handleCertificateFieldChange = (field, value) => {
    setCertificateDraft((current) => {
      const nextValue = CERTIFICATE_CURRENCY_FIELDS.includes(field)
        ? normalizeCurrencyInput(value)
        : value;
      return recalculateCertificateDerivedFields({
        ...current,
        [field]: nextValue
      });
    });
  };

  const handleResetCertificateDraft = () => {
    setCertificateDraft(buildCertificateDraftState(detail?.formData));
    setDraft((current) => ({ ...current, certificateAdjustmentNote: "" }));
  };

  const handleOpenPreviewPdf = async () => {
    if (!detail?.summary?.reference) return;

    setPreparingOutput("preview");
    setDetailError("");
    const previewWindow = typeof window !== "undefined" ? window.open("", "_blank") : null;

    try {
      if (previewWindow && previewWindow.document) {
        previewWindow.document.write("<p style=\"font-family:Arial,sans-serif;padding:24px;color:#1D4ED8;\">Preparando borrador actualizado...</p>");
        previewWindow.document.close();
      }
      const previewDraft = recalculateCertificateDerivedFields({ ...certificateDraftRef.current });
      await persistDraft("save", { certificateDraft: previewDraft });
      const response = await fetch("/api/admin-preview-certification-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: detail.summary.reference,
          certificateOverrides: previewDraft
        })
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || "No fue posible generar el borrador actualizado.");
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);

      if (previewWindow && !previewWindow.closed) {
        previewWindow.location.href = pdfUrl;
      } else {
        window.open(pdfUrl, "_blank", "noopener,noreferrer");
      }

      window.setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
      setNotice("Borrador actualizado con los últimos cambios.");
    } catch (error) {
      if (previewWindow && !previewWindow.closed) {
        previewWindow.close();
      }
      setDetailError(error.message);
    } finally {
      setPreparingOutput("");
    }
  };

  const handleProfessionalDocumentUpload = async (type, event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadingProfessionalType(type);
    setDetailError("");

    try {
      const body = new FormData();
      body.append("type", type);
      body.append("file", file);

      const response = await fetch("/api/admin-upload-professional-document", {
        method: "POST",
        body
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No fue posible actualizar el documento profesional.");
      }

      setProfessionalConfig(data.professionalConfig || null);
      setNotice("Documento profesional actualizado.");
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setUploadingProfessionalType("");
    }
  };

  const handleUnlockEditing = async () => {
    setUnlockBusy(true);
    setUnlockError("");

    try {
      const response = await fetch("/api/admin-verify-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: unlockPassword })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible validar la contraseña.");
      }

      setEditOverridePassword(unlockPassword);
      setUnlockDialogOpen(false);
      setUnlockPassword("");
      setNotice("Edición habilitada para esta certificación enviada.");
    } catch (error) {
      setUnlockError(error.message);
    } finally {
      setUnlockBusy(false);
    }
  };

  const handleRelockEditing = () => {
    setEditOverridePassword("");
    setUnlockPassword("");
    setUnlockError("");
    setUnlockDialogOpen(false);
    setPdfEditMode(false);
    setNotice("La certificación volvió a quedar protegida contra edición.");
  };

  const openSendDialog = async () => {
    if (!detail?.summary?.reference) return;
    if (detail?.summary?.certificationStatus === "enviada") {
      setDetailError("Esta certificación ya fue enviada al cliente.");
      return;
    }

    setPreparingOutput("send");
    setDetailError("");

    try {
      await persistDraft("save");
      setSendDraft({
        includeProfessionalCard: false,
        includeJccBackground: false,
        confirmedReview: false
      });
      setSendDialogOpen(true);
      setNotice("Datos de emisión guardados antes de confirmar el envío.");
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setPreparingOutput("");
    }
  };

  const handleSendCertification = async () => {
    if (!detail?.summary?.reference) return;

    setSendBusy(true);
    setDetailError("");

    try {
      const reference = detail.summary.reference;
      const previewDraft = recalculateCertificateDerivedFields({ ...certificateDraftRef.current });
      const response = await fetch("/api/admin-send-certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference,
          certificateOverrides: previewDraft,
          includeProfessionalCard: sendDraft.includeProfessionalCard,
          includeJccBackground: sendDraft.includeJccBackground,
          confirmedReview: sendDraft.confirmedReview
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible enviar la certificación.");
      }

      setEditOverridePassword("");
      setPdfEditMode(false);
      setSendDialogOpen(false);
      const refreshedDetail = (await loadDetail(reference)) || data.detail;
      await loadRecords();
      const whatsappLink = buildDeliveryWhatsappLink(refreshedDetail);
      setSendSuccessDialog({
        open: true,
        title: "Certificación enviada correctamente",
        message: refreshedDetail?.contact?.email
          ? `El PDF fue enviado al correo ${refreshedDetail.contact.email}. El expediente ya quedó actualizado y puedes continuar con la notificación por WhatsApp si lo deseas.`
          : "El PDF fue enviado correctamente al cliente. El expediente ya quedó actualizado y puedes continuar con la notificación por WhatsApp si lo deseas.",
        whatsappLink,
        customerEmail: refreshedDetail?.contact?.email || ""
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
      setNotice("Certificación enviada correctamente. El expediente ya fue actualizado.");
    } catch (error) {
      setDetailError(error.message);
    } finally {
      setSendBusy(false);
    }
  };

  if (session.loading) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{responsiveCss}</style>
        <div style={{ fontFamily: F, color: "#1D4ED8", fontWeight: 700 }}>Cargando panel interno...</div>
      </div>
    );
  }

  if (!session.authenticated) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{responsiveCss}</style>
        <div className="admin-login-card" style={{ width: "min(460px, 100%)", padding: 32, borderRadius: 28, background: "rgba(255,255,255,.92)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 24px 54px rgba(15,23,42,.10)" }}>
          <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#2563EB", fontWeight: 800, fontFamily: F, marginBottom: 12 }}>PANEL INTERNO CONTARAE</div>
          <h1 style={{ fontFamily: FH, fontSize: 38, lineHeight: 1.08, margin: "0 0 12px", color: "#0B1D3A" }}>Panel operativo CONTARAE</h1>
          <p style={{ fontFamily: F, fontSize: 15, color: "#4B5D79", lineHeight: 1.8, marginBottom: 22 }}>
            Acceso privado para gestionar solicitudes, clientes, pagos, vencimientos, documentos y certificaciones de CONTARAE.
          </p>

          {!session.configured && (
            <div style={{ padding: 16, borderRadius: 18, background: "rgba(220,38,38,.08)", border: "1px solid rgba(220,38,38,.14)", color: "#991B1B", fontFamily: F, lineHeight: 1.7, marginBottom: 18 }}>
              El panel aun no esta configurado. Debes crear en Netlify las variables `ADMIN_PANEL_USERNAME`, `ADMIN_PANEL_PASSWORD` y `ADMIN_PANEL_SECRET`.
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "grid", gap: 14 }}>
            <input
              style={inputStyle}
              placeholder="Usuario"
              value={credentials.username}
              onChange={(event) => setCredentials((current) => ({ ...current, username: event.target.value }))}
              disabled={!session.configured || loginBusy}
            />
            <input
              style={inputStyle}
              type="password"
              placeholder="Contraseña"
              value={credentials.password}
              onChange={(event) => setCredentials((current) => ({ ...current, password: event.target.value }))}
              disabled={!session.configured || loginBusy}
            />
            <button
              type="submit"
              disabled={!session.configured || loginBusy}
              style={{
                padding: "14px 18px",
                borderRadius: 16,
                border: "none",
                cursor: session.configured && !loginBusy ? "pointer" : "not-allowed",
                background: session.configured ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "#CBD5E1",
                color: "#fff",
                fontFamily: F,
                fontWeight: 800,
                fontSize: 15
              }}
            >
              {loginBusy ? "Validando acceso..." : "Entrar al panel"}
            </button>
          </form>

          {loginError && (
            <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 600 }}>
              {loginError}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={shell}>
      <style>{responsiveCss}</style>
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "16px 20px 36px" }}>
        <div className="admin-topbar" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", alignItems: "center", gap: 14, marginBottom: 18, padding: "14px 16px", borderRadius: 24, background: "rgba(255,255,255,.72)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 16px 38px rgba(15,23,42,.06)", backdropFilter: "blur(12px)" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "1.7px", color: "#2563EB", fontWeight: 900, fontFamily: F, marginBottom: 5 }}>PANEL INTERNO</div>
            <h1 style={{ fontFamily: FH, fontSize: "clamp(26px,3vw,38px)", margin: 0, lineHeight: 1.05, color: "#0B1D3A" }}>{activeModuleMeta.title}</h1>
            <p style={{ margin: "6px 0 0", fontFamily: F, fontSize: 13, color: "#52647F", lineHeight: 1.55 }}>
              {activeModuleMeta.description}
            </p>
          </div>
          <div className="admin-topbar-actions" style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", justifyContent: "flex-end" }}>
            <ModuleNav
              activeModule={activeModule}
              onChange={handleModuleChange}
              counts={{
                solicitudes: serviceRecords.length,
                clientes: clientRows.length,
                potenciales: clientLeadRows.length,
                pagos: servicePayments.length,
                certificaciones: records.length
              }}
            />
            <div style={{ padding: "9px 12px", borderRadius: 999, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 800, fontSize: 13 }}>
              Sesión: {session.username}
            </div>
            <button onClick={handleRefreshPanel} style={{ padding: "9px 13px", borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              Actualizar
            </button>
            <button onClick={handleDownloadBackup} disabled={backupBusy} style={{ padding: "9px 13px", borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: backupBusy ? "#94A3B8" : "#1D4ED8", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: backupBusy ? "not-allowed" : "pointer" }}>
              {backupBusy ? "Generando..." : "Backup JSON"}
            </button>
            <button onClick={handleLogout} style={{ padding: "9px 13px", borderRadius: 999, border: "1px solid rgba(220,38,38,.16)", background: "#fff", color: "#DC2626", fontFamily: F, fontWeight: 800, fontSize: 13, cursor: "pointer" }}>
              Cerrar sesión
            </button>
          </div>
        </div>

        {notice && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 16, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 700 }}>
            {notice}
          </div>
        )}

        {activeModule === "dashboard" ? (
          <OperationsDashboard
            summary={serviceDashboard}
            serviceRecords={serviceRecords}
            certificationRecords={records}
            clientLeads={clientLeads}
            payments={servicePayments}
            loading={serviceLoading}
            error={serviceError}
            onOpenRequest={handleSelectServiceRequest}
            onOpenModule={handleModuleChange}
            onNewRequest={handleStartNewServiceRequest}
          />
        ) : null}

        {activeModule === "solicitudes" ? (
          <ServiceRequestsModule
            records={serviceRecords}
            filteredRecords={filteredServiceRecords}
            selectedReference={selectedServiceReference}
            detail={serviceDetail}
            draft={serviceDraft}
            search={serviceSearch}
            statusFilter={serviceStatusFilter}
            paymentFilter={servicePaymentFilter}
            loading={serviceLoading}
            error={serviceError}
            detailLoading={serviceDetailLoading}
            saving={serviceSaving}
            docFiles={serviceDocFiles}
            uploadingDocs={serviceUploadingDocs}
            paymentLinkBusy={paymentLinkBusy}
            manualPaymentBusy={manualPaymentBusy}
            manualPaymentDraft={manualPaymentDraft}
            manualPaymentFiles={manualPaymentFiles}
            taskDraft={taskDraft}
            taskBusy={taskBusy}
            onSearchChange={setServiceSearch}
            onStatusFilterChange={setServiceStatusFilter}
            onPaymentFilterChange={setServicePaymentFilter}
            onSelect={handleSelectServiceRequest}
            onNew={handleStartNewServiceRequest}
            onSave={saveServiceRequest}
            onDraftChange={handleServiceDraftChange}
            onClientChange={handleServiceClientChange}
            onCurrencyChange={handleServiceCurrencyChange}
            onDocSelection={handleServiceDocSelection}
            onRemoveDoc={handleRemoveServiceDoc}
            onUploadDocs={handleUploadServiceDocuments}
            onCreatePaymentLink={handleCreateServicePaymentLink}
            onManualPaymentChange={handleManualPaymentDraftChange}
            onPaymentSupportSelection={handlePaymentSupportSelection}
            onRemovePaymentSupport={handleRemovePaymentSupport}
            onRegisterManualPayment={handleRegisterManualServicePayment}
            onTaskChange={handleTaskDraftChange}
            onSaveTask={handleSaveServiceTask}
            onCompleteTask={handleCompleteServiceTask}
            onCopyPaymentLink={handleCopyPaymentLink}
            onRetryDetail={() => loadServiceDetail(selectedServiceReference)}
            onRequestDelete={handleRequestServiceDelete}
            onVoidPayment={handleRequestPaymentVoid}
            onExportRequests={handleExportServiceRequests}
            onOpenClient={handleOpenClientByDocument}
            dialogOpen={serviceDialogOpen}
            onClose={handleCloseServiceDialog}
          />
        ) : null}

        {activeModule === "clientes" ? (
          <ClientsModule
            clients={clientRows}
            records={serviceRecords}
            onOpenClientDetail={(client) => setClientDetailDialog({ type: "client", client })}
            onExportClients={handleExportClients}
          />
        ) : null}

        {activeModule === "potenciales" ? (
          <PotentialClientsModule
            leads={clientLeads}
            leadsLoading={clientLeadsLoading}
            leadsError={clientLeadsError}
            selectedLeadIds={selectedLeadIds}
            onToggleAllLeads={handleToggleAllLeads}
            onOpenLeadDetail={(lead) => setClientDetailDialog({ type: "lead", lead })}
            onExportLeads={handleExportClientLeads}
            onCopyLeadPhones={handleCopyLeadPhones}
            onOpenBulkEmail={handleOpenBulkEmail}
          />
        ) : null}

        {activeModule === "pagos" ? (
          <PaymentsModule
            payments={servicePayments}
            certificationRecords={records}
            loading={servicePaymentsLoading}
            error={servicePaymentsError}
            onOpenRequest={handleSelectServiceRequest}
            onOpenCertification={handleOpenCertificationRecord}
            onCopyPaymentLink={handleCopyPaymentLink}
            onExportPayments={handleExportPayments}
            onVoidPayment={handleRequestPaymentVoid}
          />
        ) : null}

        {activeModule === "certificaciones" ? (
        <div className="admin-shell-grid" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 18, alignItems: "start" }}>
          <aside className="admin-sidebar" style={{ padding: 20, borderRadius: 26, background: "rgba(255,255,255,.92)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
            <div className="admin-request-filter-grid" style={{ display: "grid", gridTemplateColumns: "minmax(240px,1fr) minmax(220px,320px) minmax(220px,320px) auto", gap: 10, marginBottom: 16, alignItems: "stretch" }}>
              <input style={inputStyle} placeholder="Buscar por cliente, referencia o entidad" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select style={inputStyle} value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">Todas las certificaciones</option>
                {["pago_no_confirmado", "en_revision", "documentos_solicitados", "enviada", "rechazada"].map((status) => (
                  <option key={status} value={status}>
                    {getStatusMeta(status).label}
                  </option>
                ))}
              </select>
              <div style={{ padding: "11px 14px", borderRadius: 14, border: "1px solid rgba(37,99,235,.14)", background: "#F8FBFF", fontFamily: F, fontSize: 12, color: "#52647F", lineHeight: 1.6 }}>
                Orden: fecha de registro, de la más antigua a la más reciente.
              </div>
              <button type="button" onClick={handleExportCertifications} disabled={!records.length} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: records.length ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "#CBD5E1", color: "#fff", fontFamily: F, fontWeight: 900, cursor: records.length ? "pointer" : "not-allowed" }}>
                Descargar Excel
              </button>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", letterSpacing: "1.2px", fontFamily: F }}>CERTIFICACIONES</div>
              <div style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{filteredRecords.length}</div>
            </div>

            {listLoading && <div style={{ fontFamily: F, color: "#64748B", fontSize: 14 }}>Cargando certificaciones...</div>}
            {listError && <div style={{ fontFamily: F, color: "#991B1B", fontSize: 14 }}>{listError}</div>}

            <div className="admin-sidebar-list" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 10 }}>
              {filteredRecords.map((record) => {
                const selected = selectedReference === record.reference;
                const statusMeta = getStatusMeta(record.certificationStatus);
                return (
                  <button
                    key={record.reference}
                    type="button"
                    onClick={() => handleOpenCertificationRecord(record.reference)}
                    style={{
                      textAlign: "left",
                      padding: 16,
                      borderRadius: 18,
                      border: selected ? "1px solid rgba(37,99,235,.22)" : "1px solid rgba(37,99,235,.10)",
                      background: selected ? "rgba(37,99,235,.08)" : "#fff",
                      cursor: "pointer"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 8 }}>
                      <div style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.4 }}>{formatProperName(record.customerName) || "Solicitud sin nombre"}</div>
                      <Badge meta={statusMeta}>{statusMeta.label}</Badge>
                    </div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", marginBottom: 6 }}>
                      {record.consecutive ? `N° ${record.consecutive}` : record.reference}
                    </div>
                    <div style={{ fontFamily: F, fontSize: 13, color: "#41556F", lineHeight: 1.55 }}>
                      {record.destination || "Destino pendiente"}
                    </div>
                    <div style={{ marginTop: 8, fontFamily: F, fontSize: 12, color: "#64748B" }}>
                      Actualizado: {formatDate(record.updatedAt || record.approvedAt || record.createdAt)}
                    </div>
                    <div style={{ marginTop: 6, fontFamily: F, fontSize: 12, color: "#52647F", fontWeight: 700 }}>
                      Soportes: {record.supportFilesCount || 0}
                    </div>
                  </button>
                );
              })}
              {!filteredRecords.length && !listLoading ? (
                <div style={{ padding: 18, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.18)", fontFamily: F, color: "#64748B", lineHeight: 1.8 }}>
                  No hay certificaciones con los filtros actuales.
                  <button type="button" onClick={() => { setSearch(""); setFilter("all"); }} style={{ display: "block", marginTop: 10, padding: "9px 12px", borderRadius: 12, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
                    Quitar filtros
                  </button>
                </div>
              ) : null}
            </div>
          </aside>

          {certificationDialogOpen && selectedReference && typeof document !== "undefined" ? createPortal(
          <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.62)", zIndex: 15000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={handleCloseCertificationDialog}>
          <main className="admin-main admin-modal-card" style={{ width: "min(1180px,100%)", maxHeight: "92vh", overflowY: "auto", padding: 22, borderRadius: 28, background: "rgba(255,255,255,.98)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 30px 80px rgba(15,23,42,.24)" }} onClick={(event) => event.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(37,99,235,.10)" }}>
              <div>
                <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>DETALLE DE CERTIFICACIÓN</div>
                <div style={{ fontFamily: F, fontSize: 13, color: "#64748B", lineHeight: 1.5 }}>{detail?.summary?.reference || selectedReference}</div>
              </div>
              <button type="button" onClick={(event) => { event.stopPropagation(); handleCloseCertificationDialog(); }} style={{ width: 44, height: 44, borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#0B1D3A", fontFamily: F, fontWeight: 900, cursor: preparingOutput || sendBusy || uploadingSupports ? "not-allowed" : "pointer", opacity: preparingOutput || sendBusy || uploadingSupports ? 0.55 : 1 }} aria-label="Cerrar certificación">
                X
              </button>
            </div>
            {detailLoading && <div style={{ fontFamily: F, color: "#64748B" }}>Cargando detalle...</div>}
            {detailError && <div style={{ marginBottom: 12, fontFamily: F, color: "#991B1B" }}>{detailError}</div>}

            {detail && !detailLoading && (
              <>
                <div style={{ display: "flex", justifyContent: "space-between", gap: 18, flexWrap: "wrap", marginBottom: 18 }}>
                  <div>
                    <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
                      <Badge meta={getStatusMeta(detail.summary.certificationStatus)}>{getStatusMeta(detail.summary.certificationStatus).label}</Badge>
                      <Badge meta={getPaymentMeta(detail.summary.paymentStatus)}>{getPaymentMeta(detail.summary.paymentStatus).label}</Badge>
                    </div>
                    <h2 style={{ margin: 0, fontFamily: FH, fontSize: "clamp(26px,3vw,38px)", lineHeight: 1.08, color: "#0B1D3A" }}>
                      {formatProperName(detail.summary.customerName) || "Solicitud sin nombre"}
                    </h2>
                    <p style={{ margin: "10px 0 0", fontFamily: F, fontSize: 14, color: "#52647F", lineHeight: 1.8 }}>
                      {detail.summary.consecutive ? `Solicitud N° ${detail.summary.consecutive}` : detail.summary.reference} · {detail.summary.destination || "Destino no registrado"}
                    </p>
                  </div>
                  <div style={{ minWidth: 240, padding: 18, borderRadius: 22, background: "linear-gradient(135deg,#0B1D3A,#14345B)", color: "#fff" }}>
                    <div style={{ fontSize: 11, letterSpacing: "1.5px", fontWeight: 800, color: "#93C5FD", fontFamily: F, marginBottom: 8 }}>REFERENCIA WOMPI</div>
                    <div style={{ fontSize: 20, fontWeight: 800, fontFamily: F, lineHeight: 1.3, marginBottom: 10 }}>{detail.summary.reference}</div>
                    <div style={{ fontSize: 13, color: "rgba(226,232,240,.75)", lineHeight: 1.7, fontFamily: F }}>
                      Pago: {detail.summary.paymentStatus}<br />
                      Aprobado: {formatDate(detail.summary.approvedAt || detail.summary.createdAt)}
                    </div>
                  </div>
                </div>

                <div className="admin-info-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 18 }}>
                  <InfoTile label="Correo operativo" value={detail.contact.email} />
                  <InfoTile label="WhatsApp operativo" value={detail.contact.rawPhone} />
                  <InfoTile label="Periodo original" value={detail.summary.period} />
                  <InfoTile label="Meses certificados" value={detail.totals?.periodMonths} />
                  <InfoTile label="Total mensual recurrente" value={detail.totals?.monthlyRecurring || detail.summary.totalIncome} />
                  <InfoTile label="Total recurrente del período" value={detail.totals?.recurringPeriod} />
                  {detail.totals?.eventualPeriod ? <InfoTile label="Total eventuales del período" value={detail.totals?.eventualPeriod} /> : null}
                  {detail.totals?.globalPeriod ? <InfoTile label="Total global del período" value={detail.totals?.globalPeriod} /> : null}
                  {detail.summary.promoCode ? <InfoTile label="Código referido" value={`${detail.summary.promoCode}${detail.summary.promoAllyName ? ` · ${detail.summary.promoAllyName}` : ""}`} /> : null}
                  {detail.summary.promoDiscount ? <InfoTile label="Descuento referido" value={detail.summary.promoDiscount} /> : null}
                  <InfoTile label="Tarifa pagada" value={detail.summary.fee} />
                  {detail.summary.promoCommissionEstimate ? <InfoTile label="Comisión estimada aliado" value={detail.summary.promoCommissionEstimate} /> : null}
                  <InfoTile label="Registrada" value={formatDate(detail.summary.createdAt)} />
                </div>

                {isLockedStatus ? (
                  <div style={{ marginBottom: 18, padding: 18, borderRadius: 22, background: editLocked ? "rgba(245,158,11,.10)" : "rgba(34,197,94,.10)", border: editLocked ? "1px solid rgba(245,158,11,.18)" : "1px solid rgba(34,197,94,.18)", display: "flex", justifyContent: "space-between", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: editLocked ? "#B45309" : "#15803D", fontFamily: F, marginBottom: 6 }}>
                        EXPEDIENTE {editLocked ? "PROTEGIDO" : "DESBLOQUEADO"}
                      </div>
                      <div style={{ fontFamily: F, fontSize: 14, color: "#334155", lineHeight: 1.8 }}>
                        Este expediente está en estado <strong>{getStatusMeta(detail.summary.certificationStatus).label}</strong>. {editLocked ? "Para volver a modificarlo debes ingresar nuevamente la contraseña del usuario." : "La edición temporal quedó habilitada para esta sesión."}
                      </div>
                    </div>
                    {editLocked ? (
                      <button type="button" onClick={() => setUnlockDialogOpen(true)} style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#B45309,#F59E0B)", color: "#fff", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>
                        Habilitar edición con contraseña
                      </button>
                    ) : (
                      <button type="button" onClick={handleRelockEditing} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(220,38,38,.14)", background: "#fff", color: "#DC2626", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>
                        Volver a bloquear
                      </button>
                    )}
                  </div>
                ) : null}

                <div className="admin-detail-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 18, alignItems: "start" }}>
                  <div className="admin-left-column" style={{ display: "grid", gap: 18, position: "sticky", top: 20 }}>
                    <div style={{ padding: "0 2px" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.6px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>EXPEDIENTE</div>
                      <div style={{ fontFamily: F, fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
                        Evidencia original del cliente y versión operativa para emitir el PDF.
                      </div>
                    </div>
                    <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>FORMULARIO ORIGINAL DEL CLIENTE</div>
                      <div className="admin-original-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 10 }}>
                        {ORIGINAL_FORM_FIELDS.map(([field, label]) => (
                          <div
                            key={field}
                            style={{
                              padding: "12px 14px",
                              borderRadius: 16,
                              background: "#F8FBFF",
                              border: "1px solid rgba(37,99,235,.10)"
                            }}
                          >
                            <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.1px", fontWeight: 800, color: "#64748B", marginBottom: 6 }}>
                              {label}
                            </div>
                            <div style={{ fontFamily: F, fontSize: 14, color: "#0F172A", lineHeight: 1.6, fontWeight: 700 }}>
                              {String(originalFormData[field] || "").trim() || "Sin dato"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                        <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F }}>INGRESOS REPORTADOS EN FORMULARIO</div>
                        <div style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>Solo lectura</div>
                      </div>
                      {detail.incomes.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {detail.incomes.map((item) => (
                            <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: "1px solid rgba(37,99,235,.08)" }}>
                              <div style={{ fontFamily: F, color: "#334155", fontSize: 14 }}>{item.label}</div>
                              <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 700, textAlign: "right" }}>{item.value}</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontFamily: F, color: "#64748B", fontSize: 14 }}>No hay conceptos diligenciados.</div>
                      )}
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
                        <div>
                          <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>DATOS PARA EMISIÓN DEL PDF</div>
                          <div style={{ fontFamily: F, fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
                            Aquí ajustas la versión que sí se usará para emitir y enviar el certificado.
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                          <button
                            type="button"
                            onClick={handleTogglePdfEditMode}
                            style={{
                              width: 44,
                              height: 44,
                              borderRadius: 14,
                              border: "1px solid rgba(37,99,235,.14)",
                              background: pdfEditMode && !editLocked ? "rgba(37,99,235,.10)" : "#fff",
                              color: "#1D4ED8",
                              fontFamily: F,
                              fontWeight: 800,
                              cursor: "pointer",
                              fontSize: 18
                            }}
                            aria-label={pdfEditMode ? "Desactivar edición" : "Activar edición"}
                            title={pdfEditMode ? "Desactivar edición" : "Activar edición"}
                          >
                            ✎
                          </button>
                          <button
                            type="button"
                            onClick={handleResetCertificateDraft}
                            disabled={editLocked || !pdfEditMode}
                            style={{
                              padding: "9px 12px",
                              borderRadius: 14,
                              border: "1px solid rgba(37,99,235,.14)",
                              background: "#fff",
                              color: "#1D4ED8",
                              fontFamily: F,
                              fontWeight: 800,
                              cursor: editLocked || !pdfEditMode ? "not-allowed" : "pointer",
                              opacity: editLocked || !pdfEditMode ? 0.65 : 1
                            }}
                          >
                            Restaurar base original
                          </button>
                        </div>
                      </div>
                      {editLocked ? (
                        <div style={{ marginBottom: 14, padding: 12, borderRadius: 16, background: "rgba(245,158,11,.10)", border: "1px solid rgba(245,158,11,.18)", fontFamily: F, fontSize: 13, color: "#92400E", lineHeight: 1.7 }}>
                          La edición está bloqueada porque el PDF ya fue enviado. Usa la opción <strong>Habilitar edición con contraseña</strong> para modificar esta certificación.
                        </div>
                      ) : null}
                      <div className="admin-pdf-primary-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10, marginBottom: 12 }}>
                        {PDF_PRIMARY_FIELDS.map(([field, label]) => {
                          const fieldMeta = getModifiedFieldMeta(field);
                          const isDerivedField = CERTIFICATE_TOTAL_FIELDS.includes(field);
                          return (
                            <div
                              key={field}
                              style={{
                                padding: 12,
                                borderRadius: 16,
                                border: fieldMeta.modified ? "1px solid rgba(245,158,11,.24)" : "1px solid rgba(37,99,235,.10)",
                                background: fieldMeta.modified ? "rgba(245,158,11,.08)" : "#F8FBFF"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.1px", fontWeight: 800, color: "#64748B" }}>{label}</div>
                                {fieldMeta.modified ? (
                                  <span style={{ padding: "4px 8px", borderRadius: 999, background: "rgba(245,158,11,.16)", color: "#B45309", fontFamily: F, fontSize: 11, fontWeight: 800 }}>
                                    Modificado
                                  </span>
                                ) : null}
                              </div>
                              <input
                                disabled={!pdfEditMode || editLocked || isDerivedField}
                                style={{ ...inputStyle, background: !pdfEditMode || editLocked || isDerivedField ? "#EFF6FF" : "#fff", marginBottom: fieldMeta.modified ? 8 : 0 }}
                                placeholder={label}
                                value={certificateDraft[field]}
                                onChange={(event) => {
                                  if (field === "periodo_meses") {
                                    handleCertificateFieldChange(field, String(event.target.value || "").replace(/\D/g, "").slice(0, 2));
                                    return;
                                  }
                                  handleCertificateFieldChange(field, event.target.value);
                                }}
                              />
                              {fieldMeta.modified ? (
                                <div style={{ fontFamily: F, fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                                  Original: {String(originalFormData[field] || "").trim() || "Sin dato"}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                      <div className="admin-pdf-income-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 10, marginBottom: 12 }}>
                        {CERTIFICATE_INCOME_LABELS.map(([field, label]) => {
                          const fieldMeta = getModifiedFieldMeta(field);
                          return (
                            <div
                              key={field}
                              style={{
                                padding: 12,
                                borderRadius: 16,
                                border: fieldMeta.modified ? "1px solid rgba(245,158,11,.24)" : "1px solid rgba(37,99,235,.10)",
                                background: fieldMeta.modified ? "rgba(245,158,11,.08)" : "#F8FBFF"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.1px", fontWeight: 800, color: "#64748B" }}>{label}</div>
                                {fieldMeta.modified ? (
                                  <span style={{ padding: "4px 8px", borderRadius: 999, background: "rgba(245,158,11,.16)", color: "#B45309", fontFamily: F, fontSize: 11, fontWeight: 800 }}>
                                    Modificado
                                  </span>
                                ) : null}
                              </div>
                              <input
                                disabled={!pdfEditMode || editLocked}
                                style={{ ...inputStyle, background: !pdfEditMode || editLocked ? "#EFF6FF" : "#fff", marginBottom: fieldMeta.modified ? 8 : 0 }}
                                placeholder={label}
                                value={certificateDraft[field]}
                                onChange={(event) => handleCertificateFieldChange(field, event.target.value)}
                              />
                              {fieldMeta.modified ? (
                                <div style={{ fontFamily: F, fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                                  Original: {String(originalFormData[field] || "").trim() || "Sin dato"}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        {PDF_NOTE_FIELDS.map(([field, label]) => {
                          const fieldMeta = getModifiedFieldMeta(field);
                          return (
                            <div
                              key={field}
                              style={{
                                padding: 12,
                                borderRadius: 16,
                                border: fieldMeta.modified ? "1px solid rgba(245,158,11,.24)" : "1px solid rgba(37,99,235,.10)",
                                background: fieldMeta.modified ? "rgba(245,158,11,.08)" : "#F8FBFF",
                                gridColumn: "1 / -1"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                                <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.1px", fontWeight: 800, color: "#64748B" }}>{label}</div>
                                {fieldMeta.modified ? (
                                  <span style={{ padding: "4px 8px", borderRadius: 999, background: "rgba(245,158,11,.16)", color: "#B45309", fontFamily: F, fontSize: 11, fontWeight: 800 }}>
                                    Modificado
                                  </span>
                                ) : null}
                              </div>
                              <textarea
                                disabled={!pdfEditMode || editLocked}
                                style={{ ...inputStyle, minHeight: 88, resize: "vertical", background: !pdfEditMode || editLocked ? "#EFF6FF" : "#fff", marginBottom: fieldMeta.modified ? 8 : 0 }}
                                placeholder={label}
                                value={certificateDraft[field]}
                                onChange={(event) => handleCertificateFieldChange(field, event.target.value)}
                              />
                              {fieldMeta.modified ? (
                                <div style={{ fontFamily: F, fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                                  Original: {String(originalFormData[field] || "").trim() || "Sin dato"}
                                </div>
                              ) : null}
                            </div>
                          );
                        })}
                        <div
                          style={{
                            padding: 12,
                            borderRadius: 16,
                            border: "1px solid rgba(37,99,235,.10)",
                            background: "#F8FBFF",
                            gridColumn: "1 / -1"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 10, flexWrap: "wrap" }}>
                            <div>
                              <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.1px", fontWeight: 800, color: "#64748B" }}>Ingresos eventuales del período</div>
                              <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.6, marginTop: 4 }}>
                                Registra hechos económicos no ordinarios, no fijos y no periódicos. El PDF los mostrará separados del ingreso mensual recurrente.
                              </div>
                            </div>
                            <button
                              type="button"
                              disabled={!pdfEditMode || editLocked}
                              onClick={() => {
                                setCertificateDraft((current) =>
                                  recalculateCertificateDerivedFields({
                                    ...current,
                                    ingresos_eventuales_json: serializeEventualIncomeRows([
                                      ...certificateEventualEditorRows,
                                      createEmptyEventualIncome()
                                    ])
                                  })
                                );
                              }}
                              style={{
                                padding: "9px 12px",
                                borderRadius: 12,
                                border: "1px solid rgba(37,99,235,.14)",
                                background: !pdfEditMode || editLocked ? "#E2E8F0" : "#fff",
                                color: !pdfEditMode || editLocked ? "#94A3B8" : "#2563EB",
                                fontFamily: F,
                                fontWeight: 800,
                                cursor: !pdfEditMode || editLocked ? "not-allowed" : "pointer"
                              }}
                            >
                              + Agregar eventual
                            </button>
                          </div>
                          <div style={{ display: "grid", gap: 10 }}>
                            {(certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()]).map((row, index) => (
                              <div key={index} style={{ display: "grid", gap: 10, padding: 12, borderRadius: 14, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 10 }}>
                                  <input
                                    disabled={!pdfEditMode || editLocked}
                                    style={{ ...inputStyle, background: !pdfEditMode || editLocked ? "#EFF6FF" : "#fff" }}
                                    placeholder={`Valor eventual #${index + 1}`}
                                    value={row.value}
                                    onChange={(event) => {
                                      const nextRows = (certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()]).map((currentRow, rowIndex) =>
                                        rowIndex === index
                                          ? { ...currentRow, value: normalizeCurrencyInput(event.target.value) }
                                          : currentRow
                                      );
                                      setCertificateDraft((current) =>
                                        recalculateCertificateDerivedFields({
                                          ...current,
                                          ingresos_eventuales_json: serializeEventualIncomeRows(nextRows)
                                        })
                                      );
                                    }}
                                  />
                                  <input
                                    disabled={!pdfEditMode || editLocked}
                                    style={{ ...inputStyle, background: !pdfEditMode || editLocked ? "#EFF6FF" : "#fff" }}
                                    placeholder={`Concepto eventual #${index + 1}`}
                                    value={row.concept}
                                    onChange={(event) => {
                                      const nextRows = (certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()]).map((currentRow, rowIndex) =>
                                        rowIndex === index
                                          ? { ...currentRow, concept: event.target.value }
                                          : currentRow
                                      );
                                      setCertificateDraft((current) =>
                                        recalculateCertificateDerivedFields({
                                          ...current,
                                          ingresos_eventuales_json: serializeEventualIncomeRows(nextRows)
                                        })
                                      );
                                    }}
                                  />
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                                  <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
                                    Este ingreso se sumará al total del período, pero no al total mensual recurrente.
                                  </div>
                                  <button
                                    type="button"
                                    disabled={!pdfEditMode || editLocked || (certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()]).length === 1}
                                    onClick={() => {
                                      const currentRows = certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()];
                                      const nextRows = currentRows.filter((_, rowIndex) => rowIndex !== index);
                                      setCertificateDraft((current) =>
                                        recalculateCertificateDerivedFields({
                                          ...current,
                                          ingresos_eventuales_json: serializeEventualIncomeRows(nextRows)
                                        })
                                      );
                                    }}
                                    style={{
                                      padding: "9px 12px",
                                      borderRadius: 12,
                                      border: "1px solid rgba(220,38,38,.14)",
                                      background: !pdfEditMode || editLocked || (certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()]).length === 1 ? "#E2E8F0" : "rgba(220,38,38,.06)",
                                      color: !pdfEditMode || editLocked || (certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()]).length === 1 ? "#94A3B8" : "#DC2626",
                                      fontFamily: F,
                                      fontWeight: 800,
                                      cursor: !pdfEditMode || editLocked || (certificateEventualEditorRows.length ? certificateEventualEditorRows : [createEmptyEventualIncome()]).length === 1 ? "not-allowed" : "pointer"
                                    }}
                                  >
                                    Quitar
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {(() => {
                        const field = CERTIFICATE_CLARIFICATION_FIELD;
                        const fieldMeta = getModifiedFieldMeta(field);
                        return (
                          <div
                            style={{
                              marginBottom: 12,
                              padding: 14,
                              borderRadius: 18,
                              border: fieldMeta.modified ? "1px solid rgba(245,158,11,.24)" : "1px solid rgba(37,99,235,.10)",
                              background: fieldMeta.modified ? "rgba(245,158,11,.08)" : "#F8FBFF"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center", marginBottom: 8 }}>
                              <div>
                                <div style={{ fontSize: 12, letterSpacing: "1.2px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>
                                  PÁRRAFO ACLARATORIO OPCIONAL
                                </div>
                                <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.6 }}>
                                  Se imprimirá antes de “La presente certificación...”. Déjalo vacío si no aplica.
                                </div>
                              </div>
                              {fieldMeta.modified ? (
                                <span style={{ padding: "4px 8px", borderRadius: 999, background: "rgba(245,158,11,.16)", color: "#B45309", fontFamily: F, fontSize: 11, fontWeight: 800 }}>
                                  Modificado
                                </span>
                              ) : null}
                            </div>
                            <textarea
                              disabled={!pdfEditMode || editLocked}
                              style={{ ...inputStyle, minHeight: 96, resize: "vertical", background: !pdfEditMode || editLocked ? "#EFF6FF" : "#fff", marginBottom: fieldMeta.modified ? 8 : 0 }}
                              value={certificateDraft[field]}
                              onChange={(event) => handleCertificateFieldChange(field, event.target.value)}
                              placeholder="Escribe aquí únicamente el texto que debe aparecer en la certificación, sin título."
                            />
                            {fieldMeta.modified ? (
                              <div style={{ fontFamily: F, fontSize: 12, color: "#92400E", lineHeight: 1.6 }}>
                                Este párrafo se incluirá en el PDF solo con el texto escrito aquí.
                              </div>
                            ) : null}
                          </div>
                        );
                      })()}
                      <div style={{ marginBottom: 12, padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                        <div style={{ fontSize: 12, letterSpacing: "1.2px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 10 }}>ANOTACIÓN DEL AJUSTE</div>
                        <textarea
                          disabled={!pdfEditMode || editLocked}
                          style={{ ...inputStyle, minHeight: 92, resize: "vertical", background: !pdfEditMode || editLocked ? "#EFF6FF" : "#fff" }}
                          value={draft.certificateAdjustmentNote}
                          onChange={(event) => setDraft((current) => ({ ...current, certificateAdjustmentNote: event.target.value }))}
                          placeholder="Uso interno. Ejemplo: se corrigió el correo de entrega y se agregó ingreso por arriendos con soporte bancario."
                        />
                        <div style={{ marginTop: 8, fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                          Esta nota es interna y nunca saldrá en la certificación.
                        </div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                          <div style={{ fontSize: 12, letterSpacing: "1.2px", fontWeight: 800, color: "#1D4ED8", fontFamily: F }}>ASÍ SALDRÁ EN LA CERTIFICACIÓN</div>
                          <div style={{ fontFamily: F, fontSize: 12, color: "#52647F" }}>Vista de los conceptos que realmente se emitirán.</div>
                        </div>
                        {certificateIncomePreview.length || certificateEventualPreview.length ? (
                          <div style={{ display: "grid", gap: 10 }}>
                            {certificateIncomePreview.length ? (
                              <>
                                {certificateIncomePreview.map((item) => (
                                  <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: "1px solid rgba(37,99,235,.08)" }}>
                                    <div style={{ fontFamily: F, color: "#334155", fontSize: 14 }}>{item.label}</div>
                                    <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 700, textAlign: "right" }}>{item.value}</div>
                                  </div>
                                ))}
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 2 }}>
                                  <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800 }}>Total mensual recurrente</div>
                                  <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800, textAlign: "right" }}>
                                    {certificateDraft.total_ingresos || "Sin total definido"}
                                  </div>
                                </div>
                              </>
                            ) : null}
                            {certificateEventualPreview.length ? (
                              <>
                                <div style={{ fontFamily: F, color: "#1D4ED8", fontSize: 12, fontWeight: 800, letterSpacing: "1.2px", marginTop: certificateIncomePreview.length ? 8 : 0 }}>
                                  INGRESOS EVENTUALES
                                </div>
                                {certificateEventualPreview.map((item, index) => (
                                  <div key={`${item.concept}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingBottom: 10, borderBottom: "1px solid rgba(37,99,235,.08)" }}>
                                    <div style={{ fontFamily: F, color: "#334155", fontSize: 14 }}>{item.concept}</div>
                                    <div style={{ fontFamily: F, color: "#0F172A", fontSize: 14, fontWeight: 700, textAlign: "right" }}>{item.value}</div>
                                  </div>
                                ))}
                              </>
                            ) : null}
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 2 }}>
                              <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800 }}>Total recurrente del período</div>
                              <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800, textAlign: "right" }}>
                                {certificateDraft.total_ingresos_periodo || "Sin total definido"}
                              </div>
                            </div>
                            {certificateEventualPreview.length ? (
                              <>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 2 }}>
                                  <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800 }}>Total eventuales del período</div>
                                  <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800, textAlign: "right" }}>
                                    {certificateDraft.total_ingresos_eventuales || "$ 0"}
                                  </div>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, paddingTop: 2 }}>
                                  <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800 }}>Total global del período</div>
                                  <div style={{ fontFamily: F, color: "#0B1D3A", fontSize: 14, fontWeight: 800, textAlign: "right" }}>
                                    {certificateDraft.total_ingresos_global_periodo || "Sin total definido"}
                                  </div>
                                </div>
                              </>
                            ) : null}
                          </div>
                        ) : (
                          <div style={{ fontFamily: F, color: "#64748B", fontSize: 14, lineHeight: 1.8 }}>
                            Aún no hay conceptos para emitir. Si agregas un ingreso aquí, aparecerá en esta vista y en el PDF.
                          </div>
                        )}
                      </div>
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F }}>SOPORTES ADJUNTOS</div>
                        <div style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{detail.supportFiles?.length || 0} archivo(s)</div>
                      </div>
                      <div style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px dashed rgba(37,99,235,.16)", marginBottom: 14 }}>
                        <div style={{ fontFamily: F, fontSize: 13, color: "#334155", lineHeight: 1.7, marginBottom: 10 }}>
                          Si el cliente te envía soportes por WhatsApp o por otro canal, puedes agregarlos aquí para que queden dentro del expediente de la solicitud.
                        </div>
                        <input
                          type="file"
                          multiple
                          accept=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx"
                          onChange={handlePendingSupportSelection}
                          disabled={editLocked}
                          style={{ ...inputStyle, padding: "10px 12px", cursor: "pointer", marginBottom: pendingSupportFiles.length ? 10 : 0 }}
                        />
                        {pendingSupportFiles.length ? (
                          <div style={{ display: "grid", gap: 8, marginBottom: 10 }}>
                            {pendingSupportFiles.map((file, index) => (
                              <div
                                key={`${file.name}-${file.lastModified}-${index}`}
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: "minmax(0,1fr) auto",
                                  gap: 10,
                                  alignItems: "center",
                                  padding: "10px 12px",
                                  borderRadius: 14,
                                  background: "#fff",
                                  border: "1px solid rgba(37,99,235,.10)"
                                }}
                              >
                                <div>
                                  <div style={{ fontFamily: F, fontSize: 13, fontWeight: 700, color: "#0F172A" }}>{file.name}</div>
                                  <div style={{ fontFamily: F, fontSize: 12, color: "#64748B" }}>{formatBytes(file.size)}</div>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemovePendingSupport(index)}
                                  style={{
                                    padding: "8px 10px",
                                    borderRadius: 12,
                                    border: "1px solid rgba(220,38,38,.14)",
                                    background: "rgba(220,38,38,.06)",
                                    color: "#DC2626",
                                    fontFamily: F,
                                    fontWeight: 800,
                                    cursor: "pointer"
                                  }}
                                >
                                  Quitar
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <button
                          type="button"
                          onClick={handleUploadSupports}
                          disabled={editLocked || !pendingSupportFiles.length || uploadingSupports}
                          style={{
                            padding: "11px 14px",
                            borderRadius: 14,
                            border: "none",
                            background: editLocked || !pendingSupportFiles.length || uploadingSupports ? "#CBD5E1" : "linear-gradient(135deg,#0B1D3A,#2563EB)",
                            color: "#fff",
                            fontFamily: F,
                            fontWeight: 800,
                            cursor: editLocked || !pendingSupportFiles.length || uploadingSupports ? "not-allowed" : "pointer"
                          }}
                        >
                          {uploadingSupports ? "Cargando soportes..." : "Cargar soportes al expediente"}
                        </button>
                      </div>
                      {detail.supportFiles?.length ? (
                        <div style={{ display: "grid", gap: 10 }}>
                          {detail.supportFiles.map((file) => (
                            <div
                              key={file.id || file.blobKey}
                              style={{
                                display: "grid",
                                gridTemplateColumns: "minmax(0,1fr) auto",
                                gap: 12,
                                alignItems: "center",
                                padding: "14px 16px",
                                borderRadius: 18,
                                background: "#F8FBFF",
                                border: "1px solid rgba(37,99,235,.10)"
                              }}
                            >
                              <div>
                                <div style={{ fontFamily: F, fontSize: 14, fontWeight: 800, color: "#0F172A", lineHeight: 1.5 }}>
                                  {file.originalName || "Soporte adjunto"}
                                </div>
                                <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                                  {formatBytes(file.size)} · {file.contentType || "Archivo"} · {formatDate(file.uploadedAt)}
                                </div>
                              </div>
                              <a
                                href={file.downloadPath}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{
                                  padding: "11px 14px",
                                  borderRadius: 14,
                                  background: "rgba(37,99,235,.08)",
                                  color: "#1D4ED8",
                                  fontFamily: F,
                                  fontWeight: 800,
                                  fontSize: 13,
                                  textDecoration: "none",
                                  whiteSpace: "nowrap"
                                }}
                              >
                                Ver soporte
                              </a>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontFamily: F, color: "#64748B", fontSize: 14, lineHeight: 1.8 }}>
                          Esta solicitud no tiene soportes cargados en el formulario. El cliente puede enviarlos después por WhatsApp o correo.
                        </div>
                      )}
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>OBSERVACIONES INTERNAS</div>
                      <textarea
                        disabled={editLocked}
                        style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                        value={draft.adminNotes}
                        onChange={(event) => setDraft((current) => ({ ...current, adminNotes: event.target.value }))}
                        placeholder="Aqui puedes dejar hallazgos, validaciones pendientes, notas de revision o instrucciones internas."
                      />
                      <div style={{ marginTop: 8, fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>
                        Estas observaciones son internas y no se incluyen en la certificación.
                      </div>
                    </section>
                  </div>

                  <div style={{ display: "grid", gap: 18 }}>
                    <div style={{ padding: "0 2px" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.6px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 4 }}>CONTROL DEL EXPEDIENTE</div>
                      <div style={{ fontFamily: F, fontSize: 13, color: "#64748B", lineHeight: 1.7 }}>
                        Estado, borrador, envío y documentos profesionales.
                      </div>
                    </div>
                    <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>ESTADO DE LA CERTIFICACION</div>
                      <div style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 14 }}>
                        <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", letterSpacing: "1.2px", fontWeight: 800, marginBottom: 8 }}>ESTADO ACTUAL</div>
                        <Badge meta={getStatusMeta(detail.summary.certificationStatus)}>
                          {getStatusMeta(detail.summary.certificationStatus).label}
                        </Badge>
                        <div style={{ marginTop: 10, fontFamily: F, fontSize: 13, color: "#52647F", lineHeight: 1.8 }}>
                          Se actualiza con el pago, la solicitud de documentos, el envío final o el rechazo del expediente.
                        </div>
                      </div>

                      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                        <button type="button" onClick={handleSave} disabled={editLocked} style={{ padding: "13px 16px", borderRadius: 16, border: "none", background: editLocked ? "#CBD5E1" : "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 800, cursor: editLocked ? "not-allowed" : "pointer" }}>
                          Guardar cambios
                        </button>
                        <button type="button" onClick={() => handleQuickStatus("rechazada")} disabled={editLocked || detail.summary.certificationStatus === "rechazada"} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(220,38,38,.18)", background: editLocked || detail.summary.certificationStatus === "rechazada" ? "#E2E8F0" : "rgba(220,38,38,.08)", color: "#B91C1C", fontFamily: F, fontWeight: 800, cursor: editLocked || detail.summary.certificationStatus === "rechazada" ? "not-allowed" : "pointer", opacity: editLocked || detail.summary.certificationStatus === "rechazada" ? 0.7 : 1 }}>
                          Marcar como rechazada
                        </button>
                      </div>
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>BORRADOR Y ENVÍO FINAL</div>
                      <div style={{ fontFamily: F, fontSize: 14, color: "#334155", lineHeight: 1.8, marginBottom: 14 }}>
                        Revisa el borrador actualizado y, cuando esté listo, envía el PDF definitivo al cliente.
                      </div>
                      <div style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", marginBottom: 14 }}>
                        <div style={{ fontSize: 12, letterSpacing: "1.2px", fontWeight: 800, color: "#64748B", fontFamily: F, marginBottom: 6 }}>FIRMA PROFESIONAL</div>
                        <div style={{ fontFamily: F, fontSize: 14, color: "#0F172A", fontWeight: 700 }}>
                          {professionalConfig?.profile?.accountantName || "Diego Ramirez"}
                        </div>
                        <div style={{ fontFamily: F, fontSize: 13, color: "#52647F", marginTop: 4 }}>
                          {professionalConfig?.profile?.title || "Contador Público"} · T.P. No. {professionalConfig?.profile?.professionalCardNumber || "POR CONFIGURAR"}
                        </div>
                        <div style={{ fontFamily: F, fontSize: 13, color: "#52647F", marginTop: 4 }}>
                          C.C. No. {professionalConfig?.profile?.accountantDocumentNumber || "POR CONFIGURAR"}
                        </div>
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <button type="button" onClick={handleOpenPreviewPdf} disabled={preparingOutput === "preview" || sendBusy} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, cursor: preparingOutput === "preview" || sendBusy ? "not-allowed" : "pointer", opacity: preparingOutput === "preview" || sendBusy ? 0.7 : 1 }}>
                          {preparingOutput === "preview" ? "Guardando y preparando PDF..." : "Ver borrador PDF"}
                        </button>
                        <button type="button" onClick={openSendDialog} disabled={isLockedStatus || preparingOutput === "send" || sendBusy} style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: isLockedStatus || preparingOutput === "send" || sendBusy ? "#86EFAC" : "linear-gradient(135deg,#15803D,#22C55E)", color: "#fff", fontFamily: F, fontWeight: 800, cursor: isLockedStatus || preparingOutput === "send" || sendBusy ? "not-allowed" : "pointer", opacity: isLockedStatus || preparingOutput === "send" || sendBusy ? 0.8 : 1 }}>
                          {isLockedStatus ? `Expediente ${getStatusMeta(detail.summary.certificationStatus).label.toLowerCase()}` : preparingOutput === "send" ? "Guardando antes de enviar..." : "Enviar certificación al cliente"}
                        </button>
                        {detail.summary.certificationStatus === "enviada" && buildDeliveryWhatsappLink(detail) ? (
                          <a
                            href={buildDeliveryWhatsappLink(detail)}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: "#25D366", color: "#fff", fontFamily: F, fontWeight: 800, textDecoration: "none", textAlign: "center" }}
                          >
                            Notificar entrega por WhatsApp
                          </a>
                        ) : null}
                      </div>
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>ADJUNTOS PROFESIONALES OPCIONALES</div>
                      <div style={{ fontFamily: F, fontSize: 13, color: "#52647F", lineHeight: 1.8, marginBottom: 12 }}>
                        Cuando una entidad lo solicite, puedes adjuntar junto con la certificación la copia de la tarjeta profesional y los antecedentes ante la Junta Central de Contadores.
                      </div>
                      {["professional_card", "jcc_background"].map((type) => {
                        const document = professionalConfig?.documents?.[type];
                        const label = document?.label || type;
                        const busy = uploadingProfessionalType === type;
                        return (
                          <div key={type} style={{ padding: 14, borderRadius: 18, background: "#fff", border: "1px solid rgba(37,99,235,.10)", marginBottom: 10 }}>
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 8 }}>
                              <div style={{ fontFamily: F, fontSize: 14, fontWeight: 800, color: "#0F172A" }}>{label}</div>
                              <Badge meta={document?.available ? { tone: "#15803D", bg: "rgba(34,197,94,.12)" } : { tone: "#B45309", bg: "rgba(245,158,11,.14)" }}>
                                {document?.available ? "Disponible" : "No cargado"}
                              </Badge>
                            </div>
                            <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7, marginBottom: 10 }}>
                              {document?.available ? `${document.fileName} · ${document.sizeLabel || ""}` : "Aún no hay un archivo cargado para este adjunto."}
                            </div>
                            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                              <label style={{ padding: "10px 12px", borderRadius: 14, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, cursor: busy ? "not-allowed" : "pointer" }}>
                                {busy ? "Cargando..." : "Actualizar documento"}
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png" disabled={busy} onChange={(event) => handleProfessionalDocumentUpload(type, event)} style={{ display: "none" }} />
                              </label>
                              {document?.downloadPath ? (
                                <a href={document.downloadPath} target="_blank" rel="noopener noreferrer" style={{ padding: "10px 12px", borderRadius: 14, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 800, textDecoration: "none" }}>
                                  Ver documento
                                </a>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>SOLICITAR DOCUMENTOS ADICIONALES</div>
                      <textarea
                        disabled={editLocked}
                        style={{ ...inputStyle, minHeight: 140, resize: "vertical", marginBottom: 12 }}
                        value={draft.requestedDocumentsMessage}
                        onChange={(event) => setDraft((current) => ({ ...current, requestedDocumentsMessage: event.target.value }))}
                        placeholder="Escribe aqui el mensaje personalizado. Ejemplo: El extracto bancario adjunto no es legible y necesitamos una version mas clara del mes de febrero."
                      />
                      <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>
                        El texto se registrara en la solicitud y se usara como base para el mensaje de WhatsApp o el correo al cliente.
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <button type="button" disabled={editLocked} onClick={() => handleRegisterAndOpen("whatsapp")} style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: editLocked ? "#A7F3D0" : "#25D366", color: "#fff", fontFamily: F, fontWeight: 800, cursor: editLocked ? "not-allowed" : "pointer", opacity: editLocked ? 0.8 : 1 }}>
                          Registrar y abrir WhatsApp
                        </button>
                        <button type="button" disabled={editLocked} onClick={() => handleRegisterAndOpen("email")} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, cursor: editLocked ? "not-allowed" : "pointer", opacity: editLocked ? 0.55 : 1 }}>
                          Registrar y abrir correo
                        </button>
                      </div>
                    </section>
                  </div>
                </div>
              </>
            )}
          </main>
          </div>,
          document.body
          ) : null}
        </div>
        ) : null}
      </div>
      <ClientDetailDialog
        detail={clientDetailDialog}
        records={serviceRecords}
        onClose={() => setClientDetailDialog(null)}
        onOpenRequest={(reference) => {
          setClientDetailDialog(null);
          handleSelectServiceRequest(reference);
        }}
        onCreateRequest={handleCreateRequestFromClient}
        onDeleteLead={handleRequestLeadDelete}
        onDeleteServiceRequest={handleRequestServiceDelete}
      />
      <ProtectedDeleteDialog
        dialog={deleteDialog}
        credentials={deleteCredentials}
        busy={deleteBusy}
        error={deleteError}
        onChange={handleDeleteCredentialChange}
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
      {sendDialogOpen && createPortal(
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.62)", zIndex: 15000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => !sendBusy && setSendDialogOpen(false)}>
          <div className="admin-modal-card" style={{ width: "min(720px, 100%)", background: "#fff", borderRadius: 28, padding: 28, border: "1px solid rgba(37,99,235,.12)", boxShadow: "0 28px 72px rgba(15,23,42,.20)" }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#1D4ED8", fontWeight: 800, fontFamily: F, marginBottom: 10 }}>DOBLE CONFIRMACIÓN DE ENVÍO</div>
            <h3 style={{ margin: 0, fontFamily: FH, fontSize: 34, lineHeight: 1.08, color: "#0B1D3A" }}>Enviar certificación al cliente</h3>
            <p style={{ margin: "12px 0 18px", fontFamily: F, fontSize: 14, color: "#52647F", lineHeight: 1.8 }}>
              Antes de enviar, confirma si esta solicitud requiere adjuntar copia de la tarjeta profesional y/o antecedentes ante la Junta Central de Contadores.
            </p>

            <div style={{ display: "grid", gap: 10, marginBottom: 18 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", cursor: "pointer" }}>
                <input type="checkbox" checked={sendDraft.includeProfessionalCard} onChange={(event) => setSendDraft((current) => ({ ...current, includeProfessionalCard: event.target.checked }))} style={{ marginTop: 4 }} />
                <div>
                  <div style={{ fontFamily: F, fontWeight: 800, color: "#0F172A" }}>Adjuntar copia de la tarjeta profesional</div>
                  <div style={{ fontFamily: F, fontSize: 12, color: professionalConfig?.documents?.professional_card?.available ? "#15803D" : "#B45309", marginTop: 4 }}>
                    {professionalConfig?.documents?.professional_card?.available ? `Disponible: ${professionalConfig.documents.professional_card.fileName}` : "No hay un archivo cargado actualmente."}
                  </div>
                  {professionalConfig?.documents?.professional_card?.available ? (
                    <div style={{ fontFamily: F, fontSize: 12, color: "#52647F", marginTop: 6, lineHeight: 1.6 }}>
                      Se enviará como PDF protegido con marca de agua: uso exclusivo para esta certificación, nombre del cliente y referencia del expediente.
                    </div>
                  ) : null}
                </div>
              </label>
              <label style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", cursor: "pointer" }}>
                <input type="checkbox" checked={sendDraft.includeJccBackground} onChange={(event) => setSendDraft((current) => ({ ...current, includeJccBackground: event.target.checked }))} style={{ marginTop: 4 }} />
                <div>
                  <div style={{ fontFamily: F, fontWeight: 800, color: "#0F172A" }}>Adjuntar antecedentes Junta Central de Contadores</div>
                  <div style={{ fontFamily: F, fontSize: 12, color: professionalConfig?.documents?.jcc_background?.available ? "#15803D" : "#B45309", marginTop: 4 }}>
                    {professionalConfig?.documents?.jcc_background?.available ? `Disponible: ${professionalConfig.documents.jcc_background.fileName}` : "No hay un archivo cargado actualmente."}
                  </div>
                </div>
              </label>
            </div>

            <label style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 16, cursor: "pointer" }}>
              <input type="checkbox" checked={sendDraft.confirmedReview} onChange={(event) => setSendDraft((current) => ({ ...current, confirmedReview: event.target.checked }))} style={{ marginTop: 4 }} />
              <span style={{ fontFamily: F, fontSize: 14, color: "#334155", lineHeight: 1.7 }}>
                Confirmo que revisé la documentación soporte, el borrador PDF y autorizo el envío definitivo al cliente.
              </span>
            </label>

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setSendDialogOpen(false)} disabled={sendBusy} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, cursor: sendBusy ? "not-allowed" : "pointer" }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSendCertification}
                disabled={!sendDraft.confirmedReview || sendBusy || (sendDraft.includeProfessionalCard && !professionalConfig?.documents?.professional_card?.available) || (sendDraft.includeJccBackground && !professionalConfig?.documents?.jcc_background?.available)}
                style={{
                  padding: "12px 18px",
                  borderRadius: 16,
                  border: "none",
                  background: !sendDraft.confirmedReview || sendBusy || (sendDraft.includeProfessionalCard && !professionalConfig?.documents?.professional_card?.available) || (sendDraft.includeJccBackground && !professionalConfig?.documents?.jcc_background?.available) ? "#CBD5E1" : "linear-gradient(135deg,#15803D,#22C55E)",
                  color: "#fff",
                  fontFamily: F,
                  fontWeight: 800,
                  cursor: !sendDraft.confirmedReview || sendBusy ? "not-allowed" : "pointer"
                }}
              >
                {sendBusy ? "Enviando..." : "Confirmar envío definitivo"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {sendSuccessDialog.open && createPortal(
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.62)", zIndex: 15100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => setSendSuccessDialog((current) => ({ ...current, open: false }))}>
          <div className="admin-modal-card" style={{ width: "min(560px, 100%)", background: "#fff", borderRadius: 28, padding: 28, border: "1px solid rgba(37,99,235,.12)", boxShadow: "0 28px 72px rgba(15,23,42,.20)" }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#15803D", fontWeight: 800, fontFamily: F, marginBottom: 10 }}>ENVÍO CONFIRMADO</div>
            <h3 style={{ margin: 0, fontFamily: FH, fontSize: 32, lineHeight: 1.08, color: "#0B1D3A" }}>{sendSuccessDialog.title}</h3>
            <p style={{ margin: "14px 0 0", fontFamily: F, fontSize: 14, color: "#52647F", lineHeight: 1.8 }}>
              {sendSuccessDialog.message}
            </p>
            {sendSuccessDialog.customerEmail ? (
              <div style={{ marginTop: 16, padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F, fontSize: 13, color: "#334155", lineHeight: 1.7 }}>
                Correo registrado del cliente: <strong>{sendSuccessDialog.customerEmail}</strong>
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 20 }}>
              {sendSuccessDialog.whatsappLink ? (
                <a
                  href={sendSuccessDialog.whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: "#25D366", color: "#fff", fontFamily: F, fontWeight: 800, textDecoration: "none" }}
                >
                  Notificar por WhatsApp
                </a>
              ) : null}
              <button
                type="button"
                onClick={() => setSendSuccessDialog((current) => ({ ...current, open: false }))}
                style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, cursor: "pointer" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
      {unlockDialogOpen && createPortal(
        <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.62)", zIndex: 15000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => !unlockBusy && setUnlockDialogOpen(false)}>
          <div className="admin-modal-card" style={{ width: "min(520px, 100%)", background: "#fff", borderRadius: 28, padding: 28, border: "1px solid rgba(37,99,235,.12)", boxShadow: "0 28px 72px rgba(15,23,42,.20)" }} onClick={(event) => event.stopPropagation()}>
            <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#B45309", fontWeight: 800, fontFamily: F, marginBottom: 10 }}>EXPEDIENTE PROTEGIDO</div>
            <h3 style={{ margin: 0, fontFamily: FH, fontSize: 32, lineHeight: 1.08, color: "#0B1D3A" }}>Habilitar edición posterior al envío</h3>
            <p style={{ margin: "12px 0 18px", fontFamily: F, fontSize: 14, color: "#52647F", lineHeight: 1.8 }}>
              Esta certificación ya fue enviada al cliente. Para volver a modificar datos, estado o soportes del expediente debes confirmar nuevamente la contraseña del usuario.
            </p>
            <input
              type="password"
              style={inputStyle}
              value={unlockPassword}
              onChange={(event) => setUnlockPassword(event.target.value)}
              placeholder="Contraseña del panel"
            />
            {unlockError ? (
              <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 600 }}>
                {unlockError}
              </div>
            ) : null}
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap", marginTop: 18 }}>
              <button type="button" onClick={() => setUnlockDialogOpen(false)} disabled={unlockBusy} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, cursor: unlockBusy ? "not-allowed" : "pointer" }}>
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUnlockEditing}
                disabled={!unlockPassword.trim() || unlockBusy}
                style={{
                  padding: "12px 18px",
                  borderRadius: 16,
                  border: "none",
                  background: !unlockPassword.trim() || unlockBusy ? "#CBD5E1" : "linear-gradient(135deg,#B45309,#F59E0B)",
                  color: "#fff",
                  fontFamily: F,
                  fontWeight: 800,
                  cursor: !unlockPassword.trim() || unlockBusy ? "not-allowed" : "pointer"
                }}
              >
                {unlockBusy ? "Verificando..." : "Habilitar edición"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
