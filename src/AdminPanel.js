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

const EMPTY_MANUAL_PAYMENT_DRAFT = { amount: "", method: "Nequi", note: "" };

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
  return `mailto:?bcc=${encodeURIComponent(emails.join(","))}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(mailBody)}`;
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
  const headers = ["referencia", "cliente", "tipo_documento", "documento", "whatsapp", "correo", "servicio", "tipo", "estado", "estado_pago", "costo_pactado", "valor_pagado", "saldo", "vencimiento", "documentos", "comentarios", "creado", "actualizado"];
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
    comentarios: record.comments || "",
    creado: record.createdAt,
    actualizado: record.updatedAt
  })));
}

function buildPaymentsCsv(payments = [], certificationRecords = []) {
  const headers = ["tipo", "referencia_pago", "referencia_solicitud", "cliente", "concepto", "estado", "valor", "metodo", "fecha", "link"];
  const serviceRows = payments.map((payment) => ({
    tipo: payment.kind === "payment" ? "Pago solicitud" : "Link solicitud",
    referencia_pago: payment.reference,
    referencia_solicitud: payment.request?.reference || payment.serviceReference || "",
    cliente: formatProperName(payment.request?.clientName),
    concepto: payment.request?.title || getServiceTypeLabel(payment.request?.serviceType),
    estado: payment.status || "",
    valor: payment.amountLabel || formatMoney(payment.amount),
    metodo: payment.method || payment.source || "",
    fecha: payment.paidAt || payment.createdAt,
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
    fecha: record.approvedAt || record.createdAt || record.updatedAt,
    link: ""
  }));
  return buildCsv(headers, [...serviceRows, ...certificationRows]);
}

function buildCertificationsCsv(records = []) {
  const headers = ["referencia", "consecutivo", "cliente", "documento", "correo", "telefono", "destino", "entidad", "estado_certificacion", "estado_pago", "tarifa", "soportes", "creado", "actualizado"];
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
    tarifa: record.fee,
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
  return `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(buildSupportMessage(detail, customMessage))}`;
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

function StatCard({ label, value, note, tone = "#1D4ED8" }) {
  return (
    <section style={{ padding: 18, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 16px 34px rgba(15,23,42,.05)" }}>
      <div style={{ fontFamily: F, fontSize: 11, letterSpacing: "1.2px", fontWeight: 900, color: "#64748B", marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: FH, color: tone, fontSize: 30, lineHeight: 1.1, fontWeight: 700 }}>{value}</div>
      {note ? <div style={{ marginTop: 8, fontFamily: F, color: "#52647F", fontSize: 13, lineHeight: 1.6 }}>{note}</div> : null}
    </section>
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
  onOpenModule
}) {
  const today = getTodayDateString();
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(today);
  const calendar = useMemo(() => buildMonthlyDueCalendar(serviceRecords, today), [serviceRecords, today]);
  const selectedDayRequests = serviceRecords.filter((record) => String(record.dueDate || "").slice(0, 10) === selectedCalendarDate);
  const certificationPending = certificationRecords.filter((record) => ["en_revision", "documentos_solicitados"].includes(record.certificationStatus)).length;
  const currentMonth = today.slice(0, 7);
  const monthPayments = payments.filter((payment) => payment.kind === "payment" && String(payment.paidAt || payment.createdAt || "").startsWith(currentMonth));
  const monthPaidAmount = monthPayments.reduce((sum, payment) => sum + parseCurrency(payment.amount), 0);
  const monthLeads = clientLeads.filter((lead) => String(lead.createdAt || "").startsWith(currentMonth)).length;
  const monthSalesAmount = serviceRecords
    .filter((record) => String(record.createdAt || record.updatedAt || "").startsWith(currentMonth))
    .reduce((sum, record) => sum + parseCurrency(record.agreedPrice), 0);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {error ? (
        <div style={{ padding: 14, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 700 }}>
          {error}
        </div>
      ) : null}
      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
        <StatCard label="SOLICITUDES ACTIVAS" value={loading ? "..." : summary.activeCount} note="Servicios generales, no certificaciones." />
        <StatCard label="VENCIDAS" value={loading ? "..." : summary.overdueCount} tone="#DC2626" note="Requieren atención prioritaria." />
        <StatCard label="PRÓXIMAS A VENCER" value={loading ? "..." : summary.dueSoonCount} tone="#B45309" note="Vencen hoy o en máximo 3 días." />
        <StatCard label="CUENTAS POR COBRAR" value={loading ? "..." : summary.receivables} tone="#0F766E" note={`${summary.pendingPaymentCount} solicitud(es) con pago pendiente o parcial.`} />
        <StatCard label="VENTAS DEL MES" value={loading ? "..." : formatMoney(monthSalesAmount)} tone="#1D4ED8" note="Servicios generales creados este mes." />
        <StatCard label="RECAUDO DEL MES" value={loading ? "..." : formatMoney(monthPaidAmount)} tone="#15803D" note={`${monthPayments.length} pago(s) registrados.`} />
        <StatCard label="CLIENTES NUEVOS" value={loading ? "..." : monthLeads} tone="#7C3AED" note="Leads captados desde la web este mes." />
        <StatCard label="CERTIFICACIONES" value={loading ? "..." : certificationPending} tone="#C2410C" note="Pendientes o con documentos solicitados." />
      </div>

      <div className="admin-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "1.35fr .65fr", gap: 18, alignItems: "start" }}>
        <section style={{ padding: 22, borderRadius: 26, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 5 }}>CALENDARIO Y ALERTAS</div>
              <h2 style={{ margin: 0, fontFamily: FH, fontSize: 28, color: "#0B1D3A" }}>{calendar.label}</h2>
            </div>
            <button type="button" onClick={() => onOpenModule("solicitudes")} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
              Ver solicitudes
            </button>
          </div>

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
        </section>

        <section style={{ padding: 22, borderRadius: 26, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
          <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>RESUMEN FINANCIERO</div>
          <div style={{ display: "grid", gap: 12 }}>
            <InfoTile label="Ventas pactadas" value={summary.totalSales} />
            <InfoTile label="Ingresos recibidos" value={summary.totalPaid} />
            <InfoTile label="Servicios registrados" value={serviceRecords.length} />
          </div>
          <div style={{ marginTop: 18, fontSize: 12, letterSpacing: "1.5px", fontWeight: 900, color: "#1D4ED8", fontFamily: F, marginBottom: 10 }}>POR TIPO DE SERVICIO</div>
          {summary.byType.length ? (
            <div style={{ display: "grid", gap: 8 }}>
              {summary.byType.map((item) => (
                <div key={item.type} style={{ display: "flex", justifyContent: "space-between", gap: 10, paddingBottom: 8, borderBottom: "1px solid rgba(37,99,235,.08)", fontFamily: F, fontSize: 13, color: "#334155" }}>
                  <span>{item.label}</span>
                  <strong>{item.count}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontFamily: F, color: "#64748B", fontSize: 13, lineHeight: 1.7 }}>Sin servicios activos clasificados.</div>
          )}
          <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
            <button type="button" onClick={() => onOpenModule("solicitudes")} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "none", background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
              Gestionar solicitudes
            </button>
            <button type="button" onClick={() => onOpenModule("pagos")} style={{ width: "100%", padding: "12px 14px", borderRadius: 14, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>
              Revisar cartera
            </button>
          </div>
        </section>
      </div>
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
  onRegisterManualPayment,
  onCopyPaymentLink,
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
              <input style={inputStyle} placeholder="Valor pagado" value={draft.amountPaid} onChange={(event) => onCurrencyChange("amountPaid", event.target.value)} />
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
                  <option value="Otro medio">Otro medio</option>
                </select>
                <textarea style={{ ...inputStyle, minHeight: 78, resize: "vertical" }} placeholder="Nota interna del pago" value={manualPaymentDraft.note} onChange={(event) => onManualPaymentChange("note", event.target.value)} />
                <button type="button" onClick={onRegisterManualPayment} disabled={!draft.reference || manualPaymentBusy || parseCurrency(manualPaymentDraft.amount) <= 0} style={{ padding: "11px 14px", borderRadius: 14, border: "none", background: !draft.reference || manualPaymentBusy || parseCurrency(manualPaymentDraft.amount) <= 0 ? "#CBD5E1" : "linear-gradient(135deg,#15803D,#22C55E)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: !draft.reference || manualPaymentBusy || parseCurrency(manualPaymentDraft.amount) <= 0 ? "not-allowed" : "pointer" }}>
                  {manualPaymentBusy ? "Registrando..." : "Registrar pago manual"}
                </button>
              </div>
            </div>

            {detail?.payments?.length ? (
              <div style={{ display: "grid", gap: 8 }}>
                {detail.payments.slice(0, 5).map((payment) => (
                  <div key={payment.id || payment.reference} style={{ padding: 12, borderRadius: 14, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 4 }}>
                      <strong style={{ fontFamily: F, color: "#0F172A", fontSize: 13 }}>{payment.amountLabel || formatMoney(payment.amount)}</strong>
                      <span style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{payment.method || payment.source}</span>
                    </div>
                    <div style={{ fontFamily: F, color: "#64748B", fontSize: 12, lineHeight: 1.6 }}>{formatDate(payment.paidAt || payment.createdAt)} · {payment.reference}</div>
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

  const clientDocumentKey = normalizeDocumentIdentity(client.documentNumber);
  const clientRecords = isLead ? [] : records.filter((record) => {
    return normalizeDocumentIdentity(record.clientDocumentNumber) === clientDocumentKey && Boolean(clientDocumentKey);
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
            {email ? <a href={`mailto:${email}`} style={{ padding: "11px 14px", borderRadius: 14, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 900, textDecoration: "none" }}>Correo</a> : null}
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

  return createPortal(
    <div className="admin-modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(8,15,29,.68)", zIndex: 16000, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }} onClick={() => !busy && onCancel()}>
      <div className="admin-modal-card" style={{ width: "min(540px, 100%)", background: "#fff", borderRadius: 28, padding: 28, border: "1px solid rgba(220,38,38,.18)", boxShadow: "0 28px 72px rgba(15,23,42,.24)" }} onClick={(event) => event.stopPropagation()}>
        <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#B91C1C", fontWeight: 900, fontFamily: F, marginBottom: 10 }}>ELIMINACIÓN PROTEGIDA</div>
        <h3 style={{ margin: 0, fontFamily: FH, fontSize: 30, lineHeight: 1.1, color: "#0B1D3A" }}>{dialog.title || "Eliminar registro"}</h3>
        <p style={{ margin: "12px 0 18px", fontFamily: F, color: "#52647F", lineHeight: 1.8 }}>
          {dialog.description || "Esta acción eliminará el registro seleccionado. Confirma el usuario y la contraseña del panel para continuar."}
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <input style={inputStyle} placeholder="Usuario del panel" value={credentials.username} onChange={(event) => onChange("username", event.target.value)} disabled={busy} />
          <input style={inputStyle} type="password" placeholder="Contraseña del panel" value={credentials.password} onChange={(event) => onChange("password", event.target.value)} disabled={busy} />
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
          <button type="button" onClick={onConfirm} disabled={busy || !credentials.username.trim() || !credentials.password.trim()} style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: busy || !credentials.username.trim() || !credentials.password.trim() ? "#CBD5E1" : "linear-gradient(135deg,#991B1B,#DC2626)", color: "#fff", fontFamily: F, fontWeight: 900, cursor: busy || !credentials.username.trim() || !credentials.password.trim() ? "not-allowed" : "pointer" }}>
            {busy ? "Eliminando..." : "Confirmar eliminación"}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function PaymentsModule({ payments, certificationRecords = [], loading, error, onOpenRequest, onOpenCertification, onCopyPaymentLink, onExportPayments }) {
  const [paymentView, setPaymentView] = useState("servicios");
  const pendingLinks = payments.filter((payment) => payment.kind === "link" && payment.status === "pending");
  const approvedPayments = payments.filter((payment) => payment.kind === "payment");
  const pendingAmount = pendingLinks.reduce((sum, payment) => sum + parseCurrency(payment.amount), 0);
  const paidAmount = approvedPayments.reduce((sum, payment) => sum + parseCurrency(payment.amount), 0);
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
        <StatCard label="PAGOS SOLICITUDES" value={loading ? "..." : approvedPayments.length} note={`Recaudado: ${formatMoney(paidAmount)}`} tone="#15803D" />
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
              const paymentBadge = isPayment
                ? { label: "Pago aplicado", meta: getServicePaymentMeta("pagado_manual") }
                : payment.status === "approved"
                  ? { label: "Link aprobado", meta: getServicePaymentMeta("pagado") }
                  : payment.status === "failed"
                    ? { label: "Link fallido", meta: { tone: "#991B1B", bg: "rgba(220,38,38,.10)" } }
                    : payment.status === "superseded"
                      ? { label: "Link reemplazado", meta: { tone: "#64748B", bg: "rgba(100,116,139,.10)" } }
                      : { label: "Link pendiente", meta: getServicePaymentMeta("pendiente") };
              return (
                <div className="admin-payment-movement-card" key={`${payment.kind}-${payment.reference}-${payment.createdAt || payment.paidAt}`} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center", padding: 16, borderRadius: 18, border: "1px solid rgba(37,99,235,.10)", background: "#fff" }}>
                  <div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 6 }}>
                      <Badge meta={paymentBadge.meta}>{paymentBadge.label}</Badge>
                      <span style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{formatDate(payment.paidAt || payment.createdAt)}</span>
                    </div>
                    <div style={{ fontFamily: F, fontSize: 15, color: "#0F172A", fontWeight: 900, lineHeight: 1.4 }}>{formatProperName(request.clientName) || "Cliente sin nombre"} · {payment.amountLabel || formatMoney(payment.amount)}</div>
                    <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7 }}>{request.title || getServiceTypeLabel(request.serviceType)} · {payment.reference}</div>
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
      .admin-dashboard-grid {
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
      .admin-module-nav,
      .admin-module-nav label {
        width: 100% !important;
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
  const [deleteCredentials, setDeleteCredentials] = useState({ username: "", password: "" });
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [paymentLinkBusy, setPaymentLinkBusy] = useState(false);
  const [manualPaymentBusy, setManualPaymentBusy] = useState(false);
  const [manualPaymentDraft, setManualPaymentDraft] = useState(EMPTY_MANUAL_PAYMENT_DRAFT);
  const draftRef = useRef(draft);
  const certificateDraftRef = useRef(certificateDraft);

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

    setDetailLoading(true);
    setDetailError("");

    try {
      const response = await fetch(`/api/admin-get-certification?reference=${encodeURIComponent(reference)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "No fue posible cargar el detalle.");
      }

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
      setDetailError(error.message);
      return null;
    } finally {
      setDetailLoading(false);
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
    if (session.authenticated && selectedReference) {
      loadDetail(selectedReference);
    }
  }, [session.authenticated, selectedReference]);

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
    setRecords([]);
    setSelectedReference("");
    setDetail(null);
    setDraft(buildReviewDraft());
    setCertificateDraft(buildCertificateDraftState());
    setServiceRecords([]);
    setServicePayments([]);
    setClientLeads([]);
    setSelectedLeadIds(new Set());
    setClientDetailDialog(null);
    setDeleteDialog(null);
    setDeleteCredentials({ username: "", password: "" });
    setDeleteError("");
    setSelectedServiceReference("");
    setServiceDialogOpen(false);
    setServiceDetail(null);
    setServiceDetailLoading(false);
    setServiceDraft(buildEmptyServiceDraft());
    setServiceDocFiles([]);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
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
    setServiceError("");
    setActiveModule("solicitudes");
    setServiceDialogOpen(true);
  };

  const handleCloseServiceDialog = () => {
    if (serviceSaving || serviceUploadingDocs || paymentLinkBusy || manualPaymentBusy) return;
    setServiceDialogOpen(false);
    setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
  };

  const handleOpenCertificationRecord = (reference) => {
    setSelectedReference(reference);
    setDetail(null);
    setDetailError("");
    setActiveModule("certificaciones");
  };

  const handleCloseCertificationDialog = () => {
    if (preparingOutput || sendBusy || uploadingSupports) return;
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
  };

  const handleModuleChange = (moduleId) => {
    setActiveModule(moduleId);
    if (moduleId !== "solicitudes") {
      setServiceDialogOpen(false);
      setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
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

  const handleRegisterManualServicePayment = async () => {
    if (!serviceDraft.reference) return;

    setManualPaymentBusy(true);
    setServiceError("");

    try {
      const response = await fetch("/api/admin-register-service-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: serviceDraft.reference,
          amount: manualPaymentDraft.amount,
          method: manualPaymentDraft.method,
          note: manualPaymentDraft.note
        })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || data.error || "No fue posible registrar el pago manual.");
      }

      setServiceDetail(data.detail);
      setServiceDraft(buildServiceDraftFromDetail(data.detail));
      setManualPaymentDraft(EMPTY_MANUAL_PAYMENT_DRAFT);
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
    setServiceError("");
    setActiveModule("solicitudes");
    setServiceDialogOpen(true);
    setNotice("Solicitud nueva preparada con los datos del cliente.");
    scrollAdminMainIntoViewOnMobile();
  };

  const openDeleteDialog = (dialog) => {
    setDeleteDialog({ open: true, ...dialog });
    setDeleteCredentials({ username: session.username || "", password: "" });
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

  const handleDeleteCredentialChange = (field, value) => {
    setDeleteCredentials((current) => ({
      ...current,
      [field]: value
    }));
  };

  const handleCancelDelete = () => {
    if (deleteBusy) return;
    setDeleteDialog(null);
    setDeleteCredentials({ username: "", password: "" });
    setDeleteError("");
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialog?.type) return;

    setDeleteBusy(true);
    setDeleteError("");

    try {
      const endpoint = deleteDialog.type === "lead"
        ? "/api/admin-delete-client-lead"
        : "/api/admin-delete-service-request";
      const payload = deleteDialog.type === "lead"
        ? { id: deleteDialog.id }
        : { reference: deleteDialog.reference };
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

      setClientDetailDialog(null);
      setDeleteDialog(null);
      setDeleteCredentials({ username: "", password: "" });
      setNotice(deleteDialog.type === "lead" ? "Cliente captado eliminado." : "Solicitud eliminada.");
      await Promise.all([loadClientLeads(), loadServiceRecords(), loadServicePayments()]);
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
            onRegisterManualPayment={handleRegisterManualServicePayment}
            onCopyPaymentLink={handleCopyPaymentLink}
            onRetryDetail={() => loadServiceDetail(selectedServiceReference)}
            onRequestDelete={handleRequestServiceDelete}
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
            </div>
          </aside>

          {selectedReference && typeof document !== "undefined" ? createPortal(
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
                  <InfoTile label="Tarifa pagada" value={detail.summary.fee} />
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
                                <input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" disabled={busy} onChange={(event) => handleProfessionalDocumentUpload(type, event)} style={{ display: "none" }} />
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
