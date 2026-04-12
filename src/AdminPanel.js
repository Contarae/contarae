import { startTransition, useDeferredValue, useEffect, useMemo, useState } from "react";

const F = "'Outfit',sans-serif";
const FH = "'Libre Baskerville',serif";

const STATUS_META = {
  pendiente_pago: { label: "Pendiente de pago", tone: "#7C8CA3", bg: "rgba(100,116,139,.10)" },
  pendiente_revision: { label: "Pendiente de revision", tone: "#1D4ED8", bg: "rgba(37,99,235,.10)" },
  en_revision: { label: "En revision", tone: "#0F766E", bg: "rgba(13,148,136,.10)" },
  documentos_solicitados: { label: "Documentos solicitados", tone: "#B45309", bg: "rgba(245,158,11,.14)" },
  lista_para_envio: { label: "Lista para envio", tone: "#7C3AED", bg: "rgba(124,58,237,.12)" },
  enviada: { label: "Enviada", tone: "#15803D", bg: "rgba(34,197,94,.12)" },
  pago_no_confirmado: { label: "Pago no confirmado", tone: "#DC2626", bg: "rgba(220,38,38,.10)" }
};

const PAYMENT_META = {
  approved: { label: "Pago aprobado", tone: "#15803D", bg: "rgba(34,197,94,.12)" },
  pending: { label: "Pago pendiente", tone: "#64748B", bg: "rgba(100,116,139,.10)" },
  declined: { label: "Declinado", tone: "#DC2626", bg: "rgba(220,38,38,.10)" },
  error: { label: "Error", tone: "#DC2626", bg: "rgba(220,38,38,.10)" },
  voided: { label: "Anulado", tone: "#B45309", bg: "rgba(245,158,11,.12)" }
};

const STATUS_OPTIONS = [
  "pendiente_revision",
  "en_revision",
  "documentos_solicitados",
  "lista_para_envio",
  "enviada",
  "pago_no_confirmado"
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

function getStatusMeta(status) {
  return STATUS_META[status] || STATUS_META.pendiente_revision;
}

function getPaymentMeta(status) {
  return PAYMENT_META[status] || PAYMENT_META.pending;
}

function buildSupportMessage(detail, customMessage) {
  const summary = detail?.summary || {};
  const base = [
    `Hola ${summary.customerName || ""},`,
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
  const [draft, setDraft] = useState({
    certificationStatus: "pendiente_revision",
    adminNotes: "",
    requestedDocumentsMessage: ""
  });
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notice, setNotice] = useState("");

  const deferredSearch = useDeferredValue(search);

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
      setDraft({
        certificationStatus:
          data.detail?.summary?.certificationStatus || "pendiente_revision",
        adminNotes: data.detail?.record?.adminNotes || "",
        requestedDocumentsMessage: data.detail?.record?.requestedDocumentsMessage || ""
      });
    } catch (error) {
      setDetailError(error.message);
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
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const filteredRecords = useMemo(() => {
    const term = deferredSearch.trim().toLowerCase();

    return records.filter((record) => {
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
    setDraft({
      certificationStatus: "pendiente_revision",
      adminNotes: "",
      requestedDocumentsMessage: ""
    });
    loadSession();
  };

  const persistDraft = async (action = "save", extra = {}) => {
    if (!detail?.summary?.reference) return null;

    const response = await fetch("/api/admin-update-certification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reference: detail.summary.reference,
        certificationStatus: draft.certificationStatus,
        adminNotes: draft.adminNotes,
        requestedDocumentsMessage: draft.requestedDocumentsMessage,
        action,
        ...extra
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "No fue posible guardar los cambios.");
    }

    setDetail(data.detail);
    setDraft({
      certificationStatus: data.detail?.summary?.certificationStatus || draft.certificationStatus,
      adminNotes: data.detail?.record?.adminNotes || "",
      requestedDocumentsMessage: data.detail?.record?.requestedDocumentsMessage || ""
    });
    await loadRecords();
    return data.detail;
  };

  const handleSave = async () => {
    try {
      await persistDraft("save");
      setNotice("Cambios guardados.");
    } catch (error) {
      setDetailError(error.message);
    }
  };

  const handleQuickStatus = async (nextStatus) => {
    try {
      setDraft((current) => ({ ...current, certificationStatus: nextStatus }));
      await fetch("/api/admin-update-certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reference: detail.summary.reference,
          certificationStatus: nextStatus,
          adminNotes: draft.adminNotes,
          requestedDocumentsMessage: draft.requestedDocumentsMessage,
          action: "save"
        })
      }).then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "No fue posible actualizar el estado.");
        setDetail(data.detail);
        setDraft({
          certificationStatus: data.detail?.summary?.certificationStatus || nextStatus,
          adminNotes: data.detail?.record?.adminNotes || "",
          requestedDocumentsMessage: data.detail?.record?.requestedDocumentsMessage || ""
        });
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

  if (session.loading) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ fontFamily: F, color: "#1D4ED8", fontWeight: 700 }}>Cargando panel interno...</div>
      </div>
    );
  }

  if (!session.authenticated) {
    return (
      <div style={{ ...shell, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "min(460px, 100%)", padding: 32, borderRadius: 28, background: "rgba(255,255,255,.92)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 24px 54px rgba(15,23,42,.10)" }}>
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
      <div style={{ maxWidth: 1380, margin: "0 auto", padding: "30px 20px 40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap", marginBottom: 22 }}>
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

        <div style={{ display: "grid", gridTemplateColumns: "minmax(320px, 360px) minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
          <aside style={{ padding: 18, borderRadius: 26, background: "rgba(255,255,255,.92)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)", position: "sticky", top: 20 }}>
            <div style={{ display: "grid", gap: 10, marginBottom: 16 }}>
              <input style={inputStyle} placeholder="Buscar por cliente, referencia o entidad" value={search} onChange={(event) => setSearch(event.target.value)} />
              <select style={inputStyle} value={filter} onChange={(event) => setFilter(event.target.value)}>
                <option value="all">Todas las solicitudes</option>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {getStatusMeta(status).label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#1D4ED8", letterSpacing: "1.2px", fontFamily: F }}>SOLICITUDES</div>
              <div style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{filteredRecords.length}</div>
            </div>

            {listLoading && <div style={{ fontFamily: F, color: "#64748B", fontSize: 14 }}>Cargando solicitudes...</div>}
            {listError && <div style={{ fontFamily: F, color: "#991B1B", fontSize: 14 }}>{listError}</div>}

            <div style={{ display: "grid", gap: 10, maxHeight: "calc(100vh - 260px)", overflowY: "auto", paddingRight: 4 }}>
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

          <main style={{ padding: 22, borderRadius: 28, background: "rgba(255,255,255,.94)", border: "1px solid rgba(37,99,235,.10)", boxShadow: "0 20px 48px rgba(15,23,42,.07)" }}>
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

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginBottom: 18 }}>
                  <InfoTile label="Correo" value={detail.contact.email} />
                  <InfoTile label="Telefono" value={detail.contact.rawPhone} />
                  <InfoTile label="Periodo" value={detail.summary.period} />
                  <InfoTile label="Total ingresos" value={detail.summary.totalIncome} />
                  <InfoTile label="Tarifa pagada" value={detail.summary.fee} />
                  <InfoTile label="Registrada" value={formatDate(detail.summary.createdAt)} />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(320px, 420px)", gap: 18, alignItems: "start" }}>
                  <div style={{ display: "grid", gap: 18 }}>
                    <section style={{ padding: 20, borderRadius: 22, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>INGRESOS REPORTADOS</div>
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
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 12, flexWrap: "wrap" }}>
                        <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F }}>SOPORTES ADJUNTOS</div>
                        <div style={{ fontSize: 12, color: "#64748B", fontFamily: F }}>{detail.supportFiles?.length || 0} archivo(s)</div>
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
                        style={{ ...inputStyle, minHeight: 120, resize: "vertical" }}
                        value={draft.adminNotes}
                        onChange={(event) => setDraft((current) => ({ ...current, adminNotes: event.target.value }))}
                        placeholder="Aqui puedes dejar hallazgos, validaciones pendientes, notas de revision o instrucciones internas."
                      />
                    </section>
                  </div>

                  <div style={{ display: "grid", gap: 18 }}>
                    <section style={{ padding: 20, borderRadius: 22, background: "#fff", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>ESTADO DE LA CERTIFICACION</div>
                      <select
                        style={inputStyle}
                        value={draft.certificationStatus}
                        onChange={(event) => setDraft((current) => ({ ...current, certificationStatus: event.target.value }))}
                      >
                        {STATUS_OPTIONS.map((status) => (
                          <option key={status} value={status}>
                            {getStatusMeta(status).label}
                          </option>
                        ))}
                      </select>

                      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
                        <button type="button" onClick={handleSave} style={{ padding: "13px 16px", borderRadius: 16, border: "none", background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>
                          Guardar cambios
                        </button>
                        <button type="button" onClick={() => handleQuickStatus("en_revision")} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(13,148,136,.18)", background: "rgba(13,148,136,.08)", color: "#0F766E", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>
                          Marcar en revision
                        </button>
                        <button type="button" onClick={() => handleQuickStatus("lista_para_envio")} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(124,58,237,.18)", background: "rgba(124,58,237,.08)", color: "#7C3AED", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>
                          Marcar lista para envio
                        </button>
                      </div>
                    </section>

                    <section style={{ padding: 20, borderRadius: 22, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
                      <div style={{ fontSize: 12, letterSpacing: "1.5px", fontWeight: 800, color: "#1D4ED8", fontFamily: F, marginBottom: 12 }}>SOLICITAR DOCUMENTOS ADICIONALES</div>
                      <textarea
                        style={{ ...inputStyle, minHeight: 140, resize: "vertical", marginBottom: 12 }}
                        value={draft.requestedDocumentsMessage}
                        onChange={(event) => setDraft((current) => ({ ...current, requestedDocumentsMessage: event.target.value }))}
                        placeholder="Escribe aqui el mensaje personalizado. Ejemplo: El extracto bancario adjunto no es legible y necesitamos una version mas clara del mes de febrero."
                      />
                      <div style={{ fontFamily: F, fontSize: 12, color: "#64748B", lineHeight: 1.7, marginBottom: 12 }}>
                        El texto se registrara en la solicitud y se usara como base para el mensaje de WhatsApp o el correo al cliente.
                      </div>
                      <div style={{ display: "grid", gap: 10 }}>
                        <button type="button" onClick={() => handleRegisterAndOpen("whatsapp")} style={{ padding: "12px 16px", borderRadius: 16, border: "none", background: "#25D366", color: "#fff", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>
                          Registrar y abrir WhatsApp
                        </button>
                        <button type="button" onClick={() => handleRegisterAndOpen("email")} style={{ padding: "12px 16px", borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#1D4ED8", fontFamily: F, fontWeight: 800, cursor: "pointer" }}>
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
    </div>
  );
}
