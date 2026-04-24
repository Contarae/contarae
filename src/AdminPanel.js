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

function hasMeaningfulCurrencyValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return parseCurrency(raw) > 0;
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

export default function AdminPanel() {
  const responsiveCss = `
    @media (max-width: 1024px) {
      .admin-shell-grid,
      .admin-detail-grid {
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
        flex-direction: column !important;
        align-items: stretch !important;
      }

      .admin-shell-grid,
      .admin-detail-grid,
      .admin-info-grid,
      .admin-original-grid,
      .admin-pdf-primary-grid,
      .admin-pdf-income-grid {
        grid-template-columns: 1fr !important;
      }

      .admin-login-card,
      .admin-sidebar,
      .admin-main {
        padding: 16px !important;
        border-radius: 20px !important;
      }

      .admin-sidebar-list {
        max-height: none !important;
        overflow: visible !important;
        padding-right: 0 !important;
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
  const draftRef = useRef(draft);
  const certificateDraftRef = useRef(certificateDraft);

  const deferredSearch = useDeferredValue(search);
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
        if (!selectedReference && data.records?.length) {
          setSelectedReference(data.records[0].reference);
        }
      });
    } catch (error) {
      setListError(error.message);
    } finally {
      setListLoading(false);
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
    }
  }, [session.authenticated]);

  useEffect(() => {
    if (session.authenticated && selectedReference) {
      loadDetail(selectedReference);
    }
  }, [session.authenticated, selectedReference]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 5200);
    return () => window.clearTimeout(timer);
  }, [notice]);

  useEffect(() => {
    if (!session.authenticated) return undefined;

    const handlePageHide = () => {
      try {
        if (navigator.sendBeacon) {
          navigator.sendBeacon("/api/admin-logout");
          return;
        }
      } catch {
        // Fall back to fetch keepalive below.
      }

      fetch("/api/admin-logout", { method: "POST", keepalive: true }).catch(() => {});
    };

    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [session.authenticated]);

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
          <h1 style={{ fontFamily: FH, fontSize: 38, lineHeight: 1.08, margin: "0 0 12px", color: "#0B1D3A" }}>Revision de certificaciones</h1>
          <p style={{ fontFamily: F, fontSize: 15, color: "#4B5D79", lineHeight: 1.8, marginBottom: 22 }}>
            Acceso privado para revisar solicitudes pagadas, registrar observaciones y gestionar el estado de cada certificacion antes del envio final al cliente.
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
              placeholder="Contrasena"
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
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "30px 20px 40px" }}>
        <div className="admin-topbar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#2563EB", fontWeight: 800, fontFamily: F, marginBottom: 10 }}>PANEL INTERNO</div>
            <h1 style={{ fontFamily: FH, fontSize: "clamp(30px,4vw,48px)", margin: 0, lineHeight: 1.05, color: "#0B1D3A" }}>Solicitudes de certificacion</h1>
            <p style={{ margin: "10px 0 0", fontFamily: F, fontSize: 15, color: "#52647F", lineHeight: 1.8 }}>
              Revisa pagos aprobados, registra notas internas y solicita documentacion adicional antes del envio final.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ padding: "10px 14px", borderRadius: 999, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 700 }}>
              Sesion: {session.username}
            </div>
            <button onClick={loadRecords} style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 700, cursor: "pointer" }}>
              Actualizar
            </button>
            <button onClick={handleLogout} style={{ padding: "10px 16px", borderRadius: 999, border: "1px solid rgba(220,38,38,.16)", background: "#fff", color: "#DC2626", fontFamily: F, fontWeight: 700, cursor: "pointer" }}>
              Cerrar sesion
            </button>
          </div>
        </div>

        {notice && (
          <div style={{ marginBottom: 16, padding: 14, borderRadius: 16, background: "rgba(37,99,235,.08)", color: "#1D4ED8", fontFamily: F, fontWeight: 700 }}>
            {notice}
          </div>
        )}

        <div className="admin-shell-grid" style={{ display: "grid", gridTemplateColumns: "minmax(320px, 360px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
          <aside className="admin-sidebar" style={{ padding: 18, borderRadius: 26, background: "rgba(255,255,255,.92)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)", position: "sticky", top: 20 }}>
            <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Buscar por cliente, referencia o entidad" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select style={inputStyle} value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">Todas las solicitudes</option>
                {["pago_no_confirmado", "en_revision", "documentos_solicitados", "enviada", "rechazada"].map((status) => (
                  <option key={status} value={status}>
                    {getStatusMeta(status).label}
                  </option>
                ))}
              </select>
              <div style={{ padding: "11px 14px", borderRadius: 14, border: "1px solid rgba(37,99,235,.14)", background: "#F8FBFF", fontFamily: F, fontSize: 12, color: "#52647F", lineHeight: 1.6 }}>
                Orden: fecha de registro, de la más antigua a la más reciente.
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", letterSpacing: "1.2px", fontFamily: F }}>SOLICITUDES</div>
              <div style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{filteredRecords.length}</div>
            </div>

            {listLoading && <div style={{ fontFamily: F, color: "#64748B", fontSize: 14 }}>Cargando solicitudes...</div>}
            {listError && <div style={{ fontFamily: F, color: "#991B1B", fontSize: 14 }}>{listError}</div>}

            <div className="admin-sidebar-list" style={{ display: "grid", gap: 10, maxHeight: "calc(100vh - 260px)", overflowY: "auto", paddingRight: 4 }}>
              {filteredRecords.map((record) => {
                const selected = selectedReference === record.reference;
                const statusMeta = getStatusMeta(record.certificationStatus);
                return (
                  <button
                    key={record.reference}
                    type="button"
                    onClick={() => setSelectedReference(record.reference)}
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
                      <div style={{ fontFamily: F, fontSize: 15, fontWeight: 800, color: "#0F172A", lineHeight: 1.4 }}>{record.customerName || "Solicitud sin nombre"}</div>
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

          <main className="admin-main" style={{ padding: 22, borderRadius: 28, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
            {!selectedReference && <div style={{ fontFamily: F, color: "#64748B" }}>Selecciona una solicitud para verla.</div>}
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
                      {detail.summary.customerName || "Solicitud sin nombre"}
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
        </div>
      </div>
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
