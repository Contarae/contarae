import { useEffect, useMemo, useState } from "react";

const F = "'Outfit',sans-serif";
const FH = "'Libre Baskerville',serif";

const MODULES = [
  ["dashboard", "Dashboard"],
  ["clientes", "Clientes"],
  ["facturas", "Facturas"],
  ["abonos", "Abonos"],
  ["cartera", "Cartera"],
  ["inventario", "Inventario"],
  ["ordenes", "Ordenes"],
  ["cargues", "Cargues masivos"],
  ["configuracion", "Configuracion"]
];

const PAYMENT_METHODS = ["Transferencia bancaria", "Nequi", "Daviplata", "Efectivo", "PSE", "Tarjeta", "Otro"];
const IVA_RATES = [0, 5, 19];

const input = {
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

const button = {
  padding: "12px 15px",
  borderRadius: 14,
  border: "none",
  background: "linear-gradient(135deg,#0B1D3A,#2563EB)",
  color: "#fff",
  fontFamily: F,
  fontWeight: 900,
  cursor: "pointer"
};

const card = {
  padding: 20,
  borderRadius: 24,
  background: "rgba(255,255,255,.94)",
  border: "1px solid rgba(37,99,235,.10)",
  boxShadow: "0 18px 42px rgba(15,23,42,.07)"
};

const onlyDigits = (value) => String(value || "").replace(/\D/g, "");
const moneyValue = (value) => Number(onlyDigits(value)) || 0;
const money = (value) => `$ ${new Intl.NumberFormat("es-CO").format(Math.round(Number(value || 0)))}`;
const clean = (value) => String(value || "").trim();
const today = () => new Date().toISOString().slice(0, 10);

function formatCurrencyInput(value) {
  const amount = moneyValue(value);
  return amount ? money(amount) : "";
}

function titleCaseName(value) {
  return clean(value)
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.split("-").map((part) => part ? `${part.charAt(0).toLocaleUpperCase("es-CO")}${part.slice(1)}` : "").join("-"))
    .join(" ");
}

function csvEscape(value) {
  const raw = String(value ?? "");
  return /[",\n;]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function downloadCsv(filename, rows) {
  const csv = rows.map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([`\ufeff${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === ";") && !inQuotes) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some((item) => item !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  row.push(cell.trim());
  if (row.some((item) => item !== "")) rows.push(row);
  if (!rows.length) return [];
  const headers = rows[0].map((header) => clean(header));
  return rows.slice(1).map((values) => headers.reduce((acc, header, index) => {
    acc[header] = values[index] || "";
    return acc;
  }, {}));
}

function buildRowsForExport(data, type) {
  if (type === "clientes") {
    return [
      ["id_cliente", "nombre_cliente", "nombre_alterno", "documento", "telefono", "correo", "direccion", "saldo"],
      ...(data.customerSummary || []).map((customer) => [customer.id, customer.name, customer.alternateName, customer.documentNumber, customer.phone, customer.email, customer.address, customer.balance])
    ];
  }
  if (type === "facturas") {
    return [
      ["id_factura", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "subtotal", "iva", "descuentos", "total", "fuente"],
      ...(data.invoices || []).map((invoice) => [invoice.id, invoice.customerId, invoice.customerNameSnapshot, invoice.date, invoice.dueDate, invoice.subtotal, invoice.taxTotal, invoice.discountTotal, invoice.total, invoice.source])
    ];
  }
  if (type === "abonos") {
    return [
      ["id_abono", "id_cliente", "nombre_cliente", "id_factura", "fecha", "valor_bruto", "retefuente", "reteica", "reteiva", "otras_retenciones", "valor_neto", "medio_pago"],
      ...(data.payments || []).map((payment) => [payment.id, payment.customerId, payment.customerNameSnapshot, payment.invoiceId, payment.date, payment.grossAmount, payment.retentions?.retefuente, payment.retentions?.reteica, payment.retentions?.reteiva, payment.retentions?.other, payment.netReceived, payment.method])
    ];
  }
  return [
    ["id_cliente", "nombre_cliente", "facturado", "pagado", "saldo"],
    ...(data.customerSummary || []).map((customer) => [customer.id, customer.name, customer.billed, customer.paid, customer.balance])
  ];
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: "1.2px", color: "#64748B", fontWeight: 900, fontFamily: F }}>{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value, note, tone = "#1D4ED8" }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#64748B", fontWeight: 900, fontFamily: F }}>{label}</div>
      <div style={{ fontFamily: FH, fontSize: 38, lineHeight: 1.15, color: tone, marginTop: 8 }}>{value}</div>
      <div style={{ fontFamily: F, fontSize: 13, color: "#52647F", lineHeight: 1.7, marginTop: 8 }}>{note}</div>
    </div>
  );
}

function Login({ configured, onLogin }) {
  const [draft, setDraft] = useState({ username: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/client-portal-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "No fue posible iniciar sesion.");
      onLogin(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "44px 20px", display: "grid", placeItems: "center", background: "radial-gradient(circle at top left, rgba(37,99,235,.14), transparent 28%), linear-gradient(180deg,#EFF6FF,#F8FBFF)" }}>
      <form onSubmit={submit} style={{ ...card, width: "min(460px,100%)", padding: 28 }}>
        <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#1D4ED8", fontWeight: 900, fontFamily: F, marginBottom: 10 }}>PORTAL PARA CLIENTES</div>
        <h1 style={{ fontFamily: FH, fontSize: 38, lineHeight: 1.05, color: "#0B1D3A", margin: 0 }}>Control de cartera</h1>
        <p style={{ fontFamily: F, color: "#52647F", lineHeight: 1.8, margin: "12px 0 20px" }}>
          Ingrese con el usuario asignado para gestionar clientes, facturas, abonos, inventario y reportes de cartera.
        </p>
        {!configured ? (
          <div style={{ padding: 14, borderRadius: 16, background: "rgba(245,158,11,.12)", color: "#92400E", fontFamily: F, lineHeight: 1.7, marginBottom: 14 }}>
            El portal aun no esta configurado. Debe existir CLIENT_PORTAL_SECRET y al menos un usuario creado desde el panel interno.
          </div>
        ) : null}
        <div style={{ display: "grid", gap: 10 }}>
          <input style={input} placeholder="Usuario" value={draft.username} onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))} />
          <input style={input} type="password" placeholder="Contrasena" value={draft.password} onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))} />
        </div>
        {error ? <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 800 }}>{error}</div> : null}
        <button type="submit" disabled={busy} style={{ ...button, width: "100%", marginTop: 16, opacity: busy ? .65 : 1 }}>{busy ? "Ingresando..." : "Ingresar"}</button>
      </form>
    </main>
  );
}

function ChangePasswordRequired({ username, companyName, onChanged, onLogout }) {
  const [draft, setDraft] = useState({ currentPassword: "", nextPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (draft.nextPassword.length < 8) {
      setError("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }
    if (draft.nextPassword !== draft.confirmPassword) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/client-portal-change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: draft.currentPassword,
          nextPassword: draft.nextPassword
        })
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || payload.error || "No fue posible cambiar la contraseña.");
      onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ minHeight: "100vh", padding: "44px 20px", display: "grid", placeItems: "center", background: "radial-gradient(circle at top left, rgba(37,99,235,.14), transparent 28%), linear-gradient(180deg,#EFF6FF,#F8FBFF)" }}>
      <form onSubmit={submit} style={{ ...card, width: "min(520px,100%)", padding: 28 }}>
        <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#1D4ED8", fontWeight: 900, fontFamily: F, marginBottom: 10 }}>SEGURIDAD DEL PORTAL</div>
        <h1 style={{ fontFamily: FH, fontSize: 36, lineHeight: 1.08, color: "#0B1D3A", margin: 0 }}>Cambia tu clave temporal</h1>
        <p style={{ fontFamily: F, color: "#52647F", lineHeight: 1.8, margin: "12px 0 20px" }}>
          {companyName || username}, por seguridad debes crear una contraseña privada antes de usar el portal.
        </p>
        <div style={{ display: "grid", gap: 10 }}>
          <input style={input} type="password" placeholder="Clave temporal actual" value={draft.currentPassword} onChange={(event) => setDraft((current) => ({ ...current, currentPassword: event.target.value }))} />
          <input style={input} type="password" placeholder="Nueva contraseña" value={draft.nextPassword} onChange={(event) => setDraft((current) => ({ ...current, nextPassword: event.target.value }))} />
          <input style={input} type="password" placeholder="Confirmar nueva contraseña" value={draft.confirmPassword} onChange={(event) => setDraft((current) => ({ ...current, confirmPassword: event.target.value }))} />
        </div>
        {error ? <div style={{ marginTop: 12, padding: 12, borderRadius: 14, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 800 }}>{error}</div> : null}
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
          <button type="submit" disabled={busy} style={{ ...button, flex: "1 1 220px", opacity: busy ? .65 : 1 }}>{busy ? "Guardando..." : "Cambiar contraseña"}</button>
          <button type="button" onClick={onLogout} style={{ ...button, background: "#fff", color: "#B91C1C", border: "1px solid rgba(220,38,38,.14)" }}>Salir</button>
        </div>
      </form>
    </main>
  );
}

function Dashboard({ data, setModule }) {
  const dashboard = data.dashboard || {};
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
        <Stat label="CARTERA TOTAL" value={dashboard.pendingLabel || "$ 0"} note="Saldo pendiente por cobrar." tone="#C2410C" />
        <Stat label="FACTURADO" value={dashboard.totalBilledLabel || "$ 0"} note={`${dashboard.invoicesCount || 0} factura(s) registradas.`} />
        <Stat label="RECAUDADO" value={dashboard.totalPaidLabel || "$ 0"} note={`${dashboard.paymentsCount || 0} abono(s) registrados.`} tone="#15803D" />
        <Stat label="ALERTAS" value={(dashboard.outdatedCustomersCount || 0) + (dashboard.negativeInventoryCount || 0)} note={`${dashboard.outdatedCustomersCount || 0} cliente(s) por actualizar · ${dashboard.negativeInventoryCount || 0} inventario(s) negativo(s).`} tone="#B45309" />
      </div>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>TOP 20 CARTERA</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 32, color: "#0B1D3A" }}>Clientes con mayor saldo</h2>
          </div>
          <button type="button" onClick={() => setModule("cartera")} style={button}>Ver cartera</button>
        </div>
        <div style={{ display: "grid", gap: 8 }}>
          {(dashboard.topDebtors || []).length ? dashboard.topDebtors.map((customer, index) => (
            <div key={customer.id} className="client-portal-row" style={{ display: "grid", gridTemplateColumns: "40px minmax(0,1fr) auto", gap: 12, alignItems: "center", padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.10)", background: "#F8FBFF" }}>
              <strong style={{ fontFamily: FH, color: "#1D4ED8" }}>{index + 1}</strong>
              <div>
                <div style={{ fontFamily: F, fontWeight: 900, color: "#0F172A" }}>{customer.name}</div>
                <div style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{customer.invoicesCount} factura(s) · {customer.paymentsCount} abono(s)</div>
              </div>
              <strong style={{ fontFamily: F, color: "#C2410C" }}>{customer.balanceLabel}</strong>
            </div>
          )) : <p style={{ fontFamily: F, color: "#64748B" }}>Aun no hay cartera pendiente.</p>}
        </div>
      </section>
    </div>
  );
}

function Customers({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ id: "", name: "", alternateName: "", documentNumber: "", phone: "", email: "", address: "", notes: "" });
  const customers = data.customerSummary || [];

  function edit(customer) {
    setDraft({
      id: customer.id || "",
      name: customer.name || "",
      alternateName: customer.alternateName || "",
      documentNumber: customer.documentNumber || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      notes: customer.notes || ""
    });
  }

  async function submit(event) {
    event.preventDefault();
    if (!window.confirm("Deseas guardar la informacion del cliente?")) return;
    await onSave("customer", { ...draft, name: titleCaseName(draft.name), updateConfirmed: true });
    setDraft({ id: "", name: "", alternateName: "", documentNumber: "", phone: "", email: "", address: "", notes: "" });
  }

  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>MAESTRO DE CLIENTES</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 32, color: "#0B1D3A" }}>{customers.length} cliente(s)</h2>
            <p style={{ margin: "8px 0 0", fontFamily: F, color: "#64748B" }}>Siguiente consecutivo sugerido: <strong>{data.nextCustomerId}</strong></p>
          </div>
          <button type="button" onClick={() => onExport("clientes")} style={button}>Descargar Excel</button>
        </div>
        <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
          <Field label="ID cliente"><input style={input} placeholder={data.nextCustomerId} value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value.toUpperCase() }))} /></Field>
          <Field label="Nombre"><input style={input} required value={draft.name} onBlur={() => setDraft((current) => ({ ...current, name: titleCaseName(current.name) }))} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Nombre alterno"><input style={input} value={draft.alternateName} onChange={(event) => setDraft((current) => ({ ...current, alternateName: event.target.value }))} /></Field>
          <Field label="Documento"><input style={input} value={draft.documentNumber} onChange={(event) => setDraft((current) => ({ ...current, documentNumber: event.target.value }))} /></Field>
          <Field label="Telefono"><input style={input} value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: event.target.value }))} /></Field>
          <Field label="Correo"><input style={input} type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value.toLowerCase() }))} /></Field>
          <Field label="Direccion"><input style={input} value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} /></Field>
          <button type="submit" style={{ ...button, alignSelf: "end" }}>{draft.id ? "Guardar cliente" : "Crear cliente"}</button>
        </form>
      </section>
      <section style={card}>
        <div style={{ display: "grid", gap: 8 }}>
          {customers.map((customer) => (
            <div key={customer.id} className="client-portal-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3, minmax(90px,.4fr)) auto", gap: 10, alignItems: "center", padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.10)", background: "#fff" }}>
              <div>
                <strong style={{ fontFamily: F }}>{customer.name || "Cliente sin nombre"}</strong>
                <div style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{customer.id} · {customer.documentNumber || "Documento por asignar"} · {customer.phone || "Celular pendiente"}</div>
              </div>
              <span style={{ fontFamily: F }}>{customer.billedLabel}</span>
              <span style={{ fontFamily: F }}>{customer.paidLabel}</span>
              <strong style={{ fontFamily: F, color: customer.balance > 0 ? "#C2410C" : "#15803D" }}>{customer.balanceLabel}</strong>
              <button type="button" onClick={() => edit(customer)} style={{ ...button, padding: "9px 12px" }}>Editar</button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Invoices({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ id: "", customerId: "", date: today(), dueDate: "", total: "", notes: "" });
  async function submit(event) {
    event.preventDefault();
    if (!window.confirm("Confirmas el registro o modificacion de esta factura?")) return;
    await onSave("invoice", draft);
    setDraft({ id: "", customerId: "", date: today(), dueDate: "", total: "", notes: "" });
  }
  return (
    <ModuleWithForm title="Facturas" count={(data.invoices || []).length} onExport={() => onExport("facturas")}>
      <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10 }}>
        <Field label="Cliente"><select required style={input} value={draft.customerId} onChange={(event) => setDraft((current) => ({ ...current, customerId: event.target.value }))}><option value="">Seleccionar</option>{(data.customers || []).map((customer) => <option key={customer.id} value={customer.id}>{customer.id} - {customer.name}</option>)}</select></Field>
        <Field label="ID factura"><input style={input} value={draft.id} onChange={(event) => setDraft((current) => ({ ...current, id: event.target.value.toUpperCase() }))} /></Field>
        <Field label="Fecha"><input required style={input} type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
        <Field label="Vencimiento"><input style={input} type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
        <Field label="Valor total"><input required style={input} value={draft.total} onChange={(event) => setDraft((current) => ({ ...current, total: formatCurrencyInput(event.target.value) }))} /></Field>
        <textarea className="client-portal-form-wide" style={{ ...input, minHeight: 82, gridColumn: "1/-2" }} placeholder="Notas internas, cargue inicial o detalle resumido" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
        <button type="submit" style={{ ...button, alignSelf: "stretch" }}>Guardar factura</button>
      </form>
      <RecordList rows={(data.invoices || []).map((invoice) => [invoice.id, invoice.customerNameSnapshot, invoice.date, invoice.totalLabel || money(invoice.total), invoice.source])} headers={["ID", "Cliente", "Fecha", "Total", "Fuente"]} />
    </ModuleWithForm>
  );
}

function Payments({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ id: "", customerId: "", invoiceId: "", date: today(), grossAmount: "", retefuente: "", reteica: "", reteiva: "", otherRetentions: "", netReceived: "", method: "Transferencia bancaria", reference: "", notes: "" });
  const customerInvoices = (data.invoices || []).filter((invoice) => !draft.customerId || invoice.customerId === draft.customerId);

  async function submit(event) {
    event.preventDefault();
    if (!window.confirm("Confirmas el registro o modificacion de este abono?")) return;
    await onSave("payment", draft);
    setDraft({ id: "", customerId: "", invoiceId: "", date: today(), grossAmount: "", retefuente: "", reteica: "", reteiva: "", otherRetentions: "", netReceived: "", method: "Transferencia bancaria", reference: "", notes: "" });
  }

  return (
    <ModuleWithForm title="Abonos" count={(data.payments || []).length} onExport={() => onExport("abonos")}>
      <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        <Field label="Cliente"><select required style={input} value={draft.customerId} onChange={(event) => setDraft((current) => ({ ...current, customerId: event.target.value, invoiceId: "" }))}><option value="">Seleccionar</option>{(data.customers || []).map((customer) => <option key={customer.id} value={customer.id}>{customer.id} - {customer.name}</option>)}</select></Field>
        <Field label="Factura"><select style={input} value={draft.invoiceId} onChange={(event) => setDraft((current) => ({ ...current, invoiceId: event.target.value }))}><option value="">Sin aplicar a factura</option>{customerInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.id} - {invoice.totalLabel || money(invoice.total)}</option>)}</select></Field>
        <Field label="Fecha"><input required type="date" style={input} value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
        <Field label="Medio"><select style={input} value={draft.method} onChange={(event) => setDraft((current) => ({ ...current, method: event.target.value }))}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></Field>
        {["grossAmount", "retefuente", "reteica", "reteiva", "otherRetentions", "netReceived"].map((field) => (
          <Field key={field} label={{ grossAmount: "Valor bruto", retefuente: "ReteFuente", reteica: "ReteICA", reteiva: "ReteIVA", otherRetentions: "Otras retenciones", netReceived: "Neto recibido" }[field]}>
            <input required={field === "grossAmount"} style={input} value={draft[field]} onChange={(event) => setDraft((current) => ({ ...current, [field]: formatCurrencyInput(event.target.value) }))} />
          </Field>
        ))}
        <Field label="Referencia"><input style={input} value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} /></Field>
        <button type="submit" style={{ ...button, alignSelf: "end" }}>Guardar abono</button>
      </form>
      <RecordList rows={(data.payments || []).map((payment) => [payment.id, payment.customerNameSnapshot, payment.date, money(payment.grossAmount), money(payment.retentionTotal), payment.method])} headers={["ID", "Cliente", "Fecha", "Bruto", "Retenciones", "Medio"]} />
    </ModuleWithForm>
  );
}

function Portfolio({ data, onExport }) {
  const rows = data.customerSummary || [];
  return (
    <ModuleWithForm title="Cartera por cliente" count={rows.length} onExport={() => onExport("cartera")}>
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((customer) => {
          const message = `Hola ${customer.name}, te saludamos cordialmente. A la fecha registramos un saldo pendiente de ${customer.balanceLabel}. Agradecemos revisar el estado de cuenta y confirmar la fecha estimada de pago.`;
          const wa = customer.phone ? `https://wa.me/57${onlyDigits(customer.phone).slice(-10)}?text=${encodeURIComponent(message)}` : "";
          return (
            <div key={customer.id} className="client-portal-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) repeat(3,130px) auto", gap: 10, alignItems: "center", padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.10)", background: "#fff" }}>
              <div><strong style={{ fontFamily: F }}>{customer.name}</strong><div style={{ fontFamily: F, fontSize: 12, color: "#64748B" }}>{customer.id} · {customer.invoicesCount} factura(s)</div></div>
              <span>{customer.billedLabel}</span>
              <span>{customer.paidLabel}</span>
              <strong style={{ color: customer.balance > 0 ? "#C2410C" : "#15803D" }}>{customer.balanceLabel}</strong>
              {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...button, textDecoration: "none", background: "#25D366" }}>Cobrar</a> : <span style={{ fontFamily: F, color: "#B45309", fontSize: 12 }}>Sin WhatsApp</span>}
            </div>
          );
        })}
      </div>
    </ModuleWithForm>
  );
}

function Inventory({ data, onSave }) {
  const [draft, setDraft] = useState({ sku: "", name: "", salePrice: "", cost: "", stock: "", taxable: true, taxRate: 19 });
  async function submit(event) {
    event.preventDefault();
    if (!window.confirm("Confirmas guardar este producto o servicio?")) return;
    await onSave("inventory", draft);
    setDraft({ sku: "", name: "", salePrice: "", cost: "", stock: "", taxable: true, taxRate: 19 });
  }
  return (
    <ModuleWithForm title="Inventario" count={(data.inventory || []).length}>
      <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 10 }}>
        <Field label="SKU"><input style={input} value={draft.sku} onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value.toUpperCase() }))} /></Field>
        <Field label="Producto / servicio"><input required style={input} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></Field>
        <Field label="Precio venta"><input style={input} value={draft.salePrice} onChange={(event) => setDraft((current) => ({ ...current, salePrice: formatCurrencyInput(event.target.value) }))} /></Field>
        <Field label="Costo"><input style={input} value={draft.cost} onChange={(event) => setDraft((current) => ({ ...current, cost: formatCurrencyInput(event.target.value) }))} /></Field>
        <Field label="Stock"><input style={input} value={draft.stock} onChange={(event) => setDraft((current) => ({ ...current, stock: event.target.value.replace(/[^\d.-]/g, "") }))} /></Field>
        <Field label="IVA"><select style={input} value={draft.taxable ? draft.taxRate : "no"} onChange={(event) => setDraft((current) => ({ ...current, taxable: event.target.value !== "no", taxRate: event.target.value === "no" ? 0 : Number(event.target.value) }))}><option value="no">No aplica</option>{IVA_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}</select></Field>
        <button type="submit" className="client-portal-form-wide" style={{ ...button, gridColumn: "1/-1" }}>Guardar inventario</button>
      </form>
      <RecordList rows={(data.inventory || []).map((item) => [item.sku, item.name, money(item.salePrice), item.stock, item.stock < 0 ? "Inventario negativo" : "OK"])} headers={["SKU", "Nombre", "Precio", "Stock", "Alerta"]} />
    </ModuleWithForm>
  );
}

function Orders({ data }) {
  return (
    <ModuleWithForm title="Ordenes de compra / pedido" count={(data.orders || []).length}>
      <div style={{ padding: 16, borderRadius: 18, background: "rgba(37,99,235,.06)", color: "#1D4ED8", fontFamily: F, lineHeight: 1.8 }}>
        La base de ordenes ya queda lista para cargues masivos detallados. En la siguiente iteracion podemos agregar el constructor visual para seleccionar productos, aplicar descuentos, IVA y convertir la orden en factura.
      </div>
      <RecordList rows={(data.orders || []).map((order) => [order.id, order.customerNameSnapshot, order.date, money(order.total), order.status])} headers={["ID", "Cliente", "Fecha", "Total", "Estado"]} />
    </ModuleWithForm>
  );
}

function ModuleWithForm({ title, count, onExport, children }) {
  return (
    <section style={card}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>MODULO</div>
          <h2 style={{ margin: 0, fontFamily: FH, fontSize: 34, color: "#0B1D3A" }}>{title}</h2>
          <p style={{ fontFamily: F, color: "#64748B", margin: "6px 0 0" }}>{count} registro(s)</p>
        </div>
        {onExport ? <button type="button" onClick={onExport} style={button}>Descargar Excel</button> : null}
      </div>
      <div style={{ display: "grid", gap: 18 }}>{children}</div>
    </section>
  );
}

function RecordList({ headers, rows }) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", fontFamily: F, minWidth: 680 }}>
        <thead><tr>{headers.map((header) => <th key={header} style={{ textAlign: "left", fontSize: 11, letterSpacing: "1px", color: "#64748B", padding: "0 10px" }}>{header}</th>)}</tr></thead>
        <tbody>
          {rows.length ? rows.map((row, index) => (
            <tr key={index} style={{ background: "#F8FBFF" }}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: 12, borderTop: "1px solid rgba(37,99,235,.10)", borderBottom: "1px solid rgba(37,99,235,.10)" }}>{cell}</td>)}</tr>
          )) : <tr><td colSpan={headers.length} style={{ padding: 16, color: "#64748B" }}>No hay registros.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function Imports({ data, onData }) {
  const [module, setModule] = useState("clientes");
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const templates = data.templates || {};
  const template = templates[module];

  function downloadTemplate() {
    downloadCsv(`plantilla-${module}.csv`, [template.headers, template.headers.map(() => "")]);
  }

  async function readFile(file) {
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    setResult(null);
  }

  async function validate(commit = false) {
    if (!rows.length) {
      setResult({ ok: false, errors: [{ row: 0, field: "archivo", message: "Primero carga un archivo CSV." }], warnings: [] });
      return;
    }
    if (commit && !window.confirm("El archivo esta validado. Deseas importar definitivamente la informacion?")) return;
    setBusy(true);
    try {
      const response = await fetch("/api/client-portal-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ module, rows, commit })
      });
      const payload = await response.json();
      setResult(payload);
      if (payload.committed && payload.data) onData(payload.data);
    } catch (error) {
      setResult({ ok: false, errors: [{ row: 0, field: "sistema", message: error.message }], warnings: [] });
    } finally {
      setBusy(false);
    }
  }

  function downloadErrors() {
    const errorRows = [["fila", "campo", "valor", "error", "como_corregir"], ...((result?.errors || []).map((error) => [error.row, error.field, error.value, error.message, error.fix]))];
    downloadCsv(`errores-cargue-${module}.csv`, errorRows);
  }

  return (
    <section style={card}>
      <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>CARGUES MASIVOS</div>
      <h2 style={{ margin: "4px 0 8px", fontFamily: FH, fontSize: 34, color: "#0B1D3A" }}>Validacion previa obligatoria</h2>
      <p style={{ fontFamily: F, color: "#64748B", lineHeight: 1.8, marginBottom: 16 }}>
        Si una fila tiene error bloqueante, no se importa nada. Descarga el informe, corrige el archivo y vuelve a cargarlo.
      </p>
      <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "minmax(220px,320px) auto auto minmax(0,1fr)", gap: 10, alignItems: "end" }}>
        <Field label="Plantilla"><select style={input} value={module} onChange={(event) => { setModule(event.target.value); setRows([]); setResult(null); }}>{Object.entries(templates).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></Field>
        <button type="button" onClick={downloadTemplate} style={{ ...button, background: "#fff", color: "#1D4ED8", border: "1px solid rgba(37,99,235,.14)" }}>Descargar plantilla</button>
        <button type="button" onClick={() => downloadCsv(`export-${module}.csv`, buildRowsForExport(data, module === "abonos" ? "abonos" : module.includes("facturas") ? "facturas" : "clientes"))} style={{ ...button, background: "#fff", color: "#1D4ED8", border: "1px solid rgba(37,99,235,.14)" }}>Exportar base</button>
        <input style={input} type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} />
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <button type="button" disabled={busy || !rows.length} onClick={() => validate(false)} style={{ ...button, opacity: busy || !rows.length ? .55 : 1 }}>Validar archivo</button>
        <button type="button" disabled={busy || !result?.ok} onClick={() => validate(true)} style={{ ...button, background: result?.ok ? "linear-gradient(135deg,#15803D,#22C55E)" : "#CBD5E1" }}>Importar validado</button>
        {result?.errors?.length ? <button type="button" onClick={downloadErrors} style={{ ...button, background: "#B91C1C" }}>Descargar errores</button> : null}
      </div>
      {rows.length ? <p style={{ fontFamily: F, color: "#64748B", marginTop: 12 }}>{rows.length} fila(s) leida(s).</p> : null}
      {result ? (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 16, background: result.ok ? "rgba(34,197,94,.10)" : "rgba(220,38,38,.08)", color: result.ok ? "#15803D" : "#991B1B", fontFamily: F, fontWeight: 900 }}>
            {result.ok ? `Archivo validado: ${result.summary?.rows || 0} fila(s), ${result.summary?.warnings || 0} advertencia(s).` : `Archivo rechazado: ${result.errors?.length || 0} error(es). No se importo ninguna fila.`}
          </div>
          {(result.errors || []).slice(0, 8).map((error, index) => <div key={index} style={{ padding: 12, borderRadius: 14, background: "#fff", border: "1px solid rgba(220,38,38,.14)", fontFamily: F, color: "#7F1D1D" }}>Fila {error.row} · {error.field}: {error.message} {error.fix ? `(${error.fix})` : ""}</div>)}
          {(result.warnings || []).slice(0, 6).map((warning, index) => <div key={index} style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,.10)", fontFamily: F, color: "#92400E" }}>Fila {warning.row} · {warning.field}: {warning.message}</div>)}
        </div>
      ) : null}
    </section>
  );
}

function Config({ data, onSave }) {
  const [draft, setDraft] = useState(data.company || {});
  useEffect(() => setDraft(data.company || {}), [data.company]);
  return (
    <section style={card}>
      <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>CONFIGURACION</div>
      <h2 style={{ margin: "4px 0 16px", fontFamily: FH, fontSize: 34, color: "#0B1D3A" }}>Datos de la empresa</h2>
      <form className="client-portal-form-grid" onSubmit={async (event) => { event.preventDefault(); if (window.confirm("Deseas guardar la configuracion de la empresa?")) await onSave("company", draft); }} style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
        {["name", "nit", "phone", "email", "address"].map((field) => <Field key={field} label={{ name: "Nombre empresa", nit: "NIT / documento", phone: "Telefono", email: "Correo", address: "Direccion" }[field]}><input style={input} value={draft[field] || ""} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} /></Field>)}
        <Field label="Color principal"><input style={input} type="color" value={draft.color || "#1D4ED8"} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} /></Field>
        <button type="submit" className="client-portal-form-wide" style={{ ...button, gridColumn: "1/-1" }}>Guardar configuracion</button>
      </form>
    </section>
  );
}

export default function ClientPortal() {
  const [session, setSession] = useState({ configured: true, authenticated: false });
  const [data, setData] = useState(null);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const sessionResponse = await fetch("/api/client-portal-session");
      const sessionPayload = await sessionResponse.json();
      setSession(sessionPayload);
      if (!sessionPayload.authenticated) {
        setData(null);
        return;
      }
      const dataResponse = await fetch("/api/client-portal-data");
      const dataPayload = await dataResponse.json();
      if (!dataResponse.ok) throw new Error(dataPayload.error || "No fue posible cargar datos.");
      setData(dataPayload.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const moduleLabel = useMemo(() => MODULES.find(([id]) => id === activeModule)?.[1] || "Dashboard", [activeModule]);

  async function save(type, payload) {
    setNotice("");
    setError("");
    const response = await fetch("/api/client-portal-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, payload })
    });
    const result = await response.json();
    if (!response.ok) {
      setError(result.error || "No fue posible guardar.");
      return;
    }
    setData(result.data);
    setNotice("Informacion guardada correctamente.");
  }

  async function logout() {
    await fetch("/api/client-portal-logout", { method: "POST" });
    setSession({ configured: true, authenticated: false });
    setData(null);
  }

  function exportData(type) {
    downloadCsv(`${type}-${new Date().toISOString().slice(0, 10)}.csv`, buildRowsForExport(data, type));
  }

  if (loading) {
    return <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", fontFamily: F, color: "#0B1D3A" }}>Cargando portal...</main>;
  }

  if (!session.authenticated) {
    return <Login configured={session.configured} onLogin={() => loadData()} />;
  }

  if (session.mustChangePassword && session.role !== "support") {
    return (
      <ChangePasswordRequired
        username={session.username}
        companyName={session.companyName}
        onChanged={loadData}
        onLogout={logout}
      />
    );
  }

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(37,99,235,.12), transparent 28%), linear-gradient(180deg,#EFF6FF,#F8FBFF)", padding: "24px" }}>
      <style>{`
        @media(max-width:980px){
          .client-portal-stats,.client-portal-form-grid{grid-template-columns:1fr!important}
          .client-portal-row{grid-template-columns:1fr!important}
          .client-portal-shell{padding:16px!important}
          .client-portal-header{grid-template-columns:1fr!important}
          .client-portal-actions{justify-content:stretch!important}
          .client-portal-actions button,.client-portal-actions select{width:100%!important}
        }
      `}</style>
      <div className="client-portal-shell" style={{ maxWidth: 1240, margin: "0 auto", display: "grid", gap: 18 }}>
        <header className="client-portal-header" style={{ ...card, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 18, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.8px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>PORTAL PARA CLIENTES</div>
            <h1 style={{ margin: "4px 0 6px", fontFamily: FH, fontSize: "clamp(34px,5vw,58px)", color: "#0B1D3A", lineHeight: 1.02 }}>{data?.company?.name || session.companyName}</h1>
            <p style={{ margin: 0, fontFamily: F, color: "#52647F" }}>Cartera, facturas, abonos, inventario, ordenes y cargues masivos.</p>
          </div>
          <div className="client-portal-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
            <select style={{ ...input, minWidth: 220 }} value={activeModule} onChange={(event) => setActiveModule(event.target.value)}>
              {MODULES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
            <button type="button" onClick={loadData} style={{ ...button, background: "#fff", color: "#1D4ED8", border: "1px solid rgba(37,99,235,.14)" }}>Actualizar</button>
            <button type="button" onClick={logout} style={{ ...button, background: "#fff", color: "#B91C1C", border: "1px solid rgba(220,38,38,.14)" }}>Salir</button>
          </div>
        </header>

        {notice ? <div style={{ padding: 13, borderRadius: 16, background: "rgba(34,197,94,.10)", color: "#15803D", fontFamily: F, fontWeight: 900 }}>{notice}</div> : null}
        {session.impersonatedBy ? (
          <div style={{ padding: 13, borderRadius: 16, background: "rgba(245,158,11,.12)", color: "#92400E", fontFamily: F, fontWeight: 900, lineHeight: 1.6 }}>
            Acceso asistido activo: estás viendo este portal como soporte de CONTARAE ({session.impersonatedBy}). Las acciones quedarán auditadas.
          </div>
        ) : null}
        {error ? <div style={{ padding: 13, borderRadius: 16, background: "rgba(220,38,38,.08)", color: "#991B1B", fontFamily: F, fontWeight: 900 }}>{error}</div> : null}

        <nav style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {MODULES.map(([id, label]) => <button key={id} type="button" onClick={() => setActiveModule(id)} style={{ padding: "10px 13px", borderRadius: 999, border: id === activeModule ? "none" : "1px solid rgba(37,99,235,.14)", background: id === activeModule ? "linear-gradient(135deg,#0B1D3A,#2563EB)" : "#fff", color: id === activeModule ? "#fff" : "#1D4ED8", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>{label}</button>)}
        </nav>

        <div style={{ fontFamily: F, color: "#64748B", fontWeight: 900, letterSpacing: "1.2px" }}>Modulo actual: {moduleLabel}</div>
        {activeModule === "dashboard" ? <Dashboard data={data} setModule={setActiveModule} /> : null}
        {activeModule === "clientes" ? <Customers data={data} onSave={save} onExport={exportData} /> : null}
        {activeModule === "facturas" ? <Invoices data={data} onSave={save} onExport={exportData} /> : null}
        {activeModule === "abonos" ? <Payments data={data} onSave={save} onExport={exportData} /> : null}
        {activeModule === "cartera" ? <Portfolio data={data} onExport={exportData} /> : null}
        {activeModule === "inventario" ? <Inventory data={data} onSave={save} /> : null}
        {activeModule === "ordenes" ? <Orders data={data} /> : null}
        {activeModule === "cargues" ? <Imports data={data} onData={setData} /> : null}
        {activeModule === "configuracion" ? <Config data={data} onSave={save} /> : null}
      </div>
    </main>
  );
}
