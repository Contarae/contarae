import { useEffect, useMemo, useRef, useState } from "react";

const F = "'Outfit',sans-serif";
const FH = "'Libre Baskerville',serif";

const MODULE_GROUPS = [
  { title: "Panel", items: [["dashboard", "Dashboard"]] },
  { title: "Operacion", items: [["actividad", "Actividad"], ["clientes", "Clientes"], ["facturas", "Facturas"], ["abonos", "Abonos"], ["cartera", "Cartera"]] },
  { title: "Inventario", items: [["inventario", "Inventario"], ["movimientos", "Movimientos"], ["ordenes", "Ordenes"]] },
  { title: "Administracion", items: [["cargues", "Cargues masivos"], ["cargues-historial", "Historial de cargues"], ["configuracion", "Configuracion"]] }
];

const MODULE_ICONS = {
  dashboard: "dashboard",
  actividad: "activity",
  clientes: "users",
  facturas: "invoice",
  abonos: "wallet",
  cartera: "portfolio",
  inventario: "boxes",
  movimientos: "transfer",
  ordenes: "clipboard",
  cargues: "upload",
  "cargues-historial": "history",
  configuracion: "gear"
};

const PAYMENT_METHODS = ["Transferencia bancaria", "Nequi", "Daviplata", "Efectivo", "PSE", "Tarjeta", "Otro"];
const IVA_RATES = [0, 5, 19];
const DISCOUNT_PERCENTS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
const CLIENT_PORTAL_ACTIVE_SESSION_KEY = "contarae_client_portal_active_session";
const SORT_OPTIONS = [
  ["recent", "Mas reciente primero"],
  ["oldest", "Mas antiguo primero"],
  ["amountDesc", "Mayor valor primero"],
  ["amountAsc", "Menor valor primero"],
  ["clientAsc", "Cliente A-Z"],
  ["clientDesc", "Cliente Z-A"]
];
const RECORD_SORT_OPTIONS = [
  ["idDesc", "Ultimos registros primero"],
  ["idAsc", "Primeros registros primero"],
  ["recent", "Fecha mas reciente"],
  ["oldest", "Fecha mas antigua"],
  ["amountDesc", "Mayor valor primero"],
  ["amountAsc", "Menor valor primero"],
  ["clientAsc", "Cliente A-Z"],
  ["clientDesc", "Cliente Z-A"]
];
const DISCOUNT_CONCEPTS = ["Comercial", "Pronto pago", "Acuerdo comercial", "Ajuste por diferencia", "Otro"];
const AGING_BUCKETS = [
  ["current", "No vencida"],
  ["dueToday", "Vence hoy"],
  ["upcoming7", "Vence 1 a 7 dias"],
  ["upcoming15", "Vence 8 a 15 dias"],
  ["upcoming30", "Vence 16 a 30 dias"],
  ["overdue0To30", "Vencida 1 a 30 dias"],
  ["overdue31To60", "Vencida 31 a 60 dias"],
  ["overdue61To90", "Vencida 61 a 90 dias"],
  ["overdueOver90", "Vencida mas de 90 dias"]
];
const CUSTOMER_SEARCH_TYPES = [
  ["id", "ID cliente"],
  ["name", "Nombre principal"],
  ["alternateName", "Nombre alterno"],
  ["documentNumber", "Documento"]
];

function markActivePortalSession() {
  try {
    window.sessionStorage.setItem(CLIENT_PORTAL_ACTIVE_SESSION_KEY, "1");
  } catch {
    // If sessionStorage is unavailable, the HttpOnly cookie still protects the session.
  }
}

function clearActivePortalSession() {
  try {
    window.sessionStorage.removeItem(CLIENT_PORTAL_ACTIVE_SESSION_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

function hasActivePortalSession() {
  try {
    return window.sessionStorage.getItem(CLIENT_PORTAL_ACTIVE_SESSION_KEY) === "1";
  } catch {
    return true;
  }
}

const CITY_DEPARTMENT_MAP = {
  armenia: ["Armenia", "Quindio"],
  barranquilla: ["Barranquilla", "Atlantico"],
  bogota: ["Bogota D.C.", "Bogota D.C."],
  "bogota dc": ["Bogota D.C.", "Bogota D.C."],
  "bogota d c": ["Bogota D.C.", "Bogota D.C."],
  bucaramanga: ["Bucaramanga", "Santander"],
  cali: ["Cali", "Valle del Cauca"],
  cartagena: ["Cartagena", "Bolivar"],
  cucuta: ["Cucuta", "Norte de Santander"],
  ibague: ["Ibague", "Tolima"],
  manizales: ["Manizales", "Caldas"],
  medellin: ["Medellin", "Antioquia"],
  monteria: ["Monteria", "Cordoba"],
  neiva: ["Neiva", "Huila"],
  pasto: ["Pasto", "Narino"],
  pereira: ["Pereira", "Risaralda"],
  popayan: ["Popayan", "Cauca"],
  riohacha: ["Riohacha", "La Guajira"],
  "santa marta": ["Santa Marta", "Magdalena"],
  sincelejo: ["Sincelejo", "Sucre"],
  tunja: ["Tunja", "Boyaca"],
  valledupar: ["Valledupar", "Cesar"],
  villavicencio: ["Villavicencio", "Meta"],
  yopal: ["Yopal", "Casanare"],
  chia: ["Chia", "Cundinamarca"],
  soacha: ["Soacha", "Cundinamarca"],
  zipaquira: ["Zipaquira", "Cundinamarca"],
  facatativa: ["Facatativa", "Cundinamarca"],
  mosquera: ["Mosquera", "Cundinamarca"],
  funza: ["Funza", "Cundinamarca"],
  cajica: ["Cajica", "Cundinamarca"],
  cota: ["Cota", "Cundinamarca"],
  madrid: ["Madrid", "Cundinamarca"],
  girardot: ["Girardot", "Cundinamarca"],
  bello: ["Bello", "Antioquia"],
  envigado: ["Envigado", "Antioquia"],
  itagui: ["Itagui", "Antioquia"],
  sabaneta: ["Sabaneta", "Antioquia"],
  rionegro: ["Rionegro", "Antioquia"],
  palmira: ["Palmira", "Valle del Cauca"],
  buenaventura: ["Buenaventura", "Valle del Cauca"],
  tulua: ["Tulua", "Valle del Cauca"],
  jamundi: ["Jamundi", "Valle del Cauca"],
  floridablanca: ["Floridablanca", "Santander"],
  giron: ["Giron", "Santander"],
  piedecuesta: ["Piedecuesta", "Santander"],
  dosquebradas: ["Dosquebradas", "Risaralda"],
  duitama: ["Duitama", "Boyaca"],
  sogamoso: ["Sogamoso", "Boyaca"],
  fusagasuga: ["Fusagasuga", "Cundinamarca"]
};

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
const normalizeText = (value) => clean(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const invalidDocumentTokens = new Set(["", "por asignar", "sin documento", "pendiente", "pendiente por asignar", "n/a", "na", "0"]);

function normalizeLookup(value = "") {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function formatCurrencyInput(value) {
  const amount = moneyValue(value);
  return amount ? money(amount) : "";
}

function isValidDocumentSearch(value = "") {
  const normalized = normalizeText(value);
  return !invalidDocumentTokens.has(normalized) && onlyDigits(value).length >= 4;
}

function titleCaseName(value) {
  return clean(value)
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.split("-").map((part) => part ? `${part.charAt(0).toLocaleUpperCase("es-CO")}${part.slice(1)}` : "").join("-"))
    .join(" ");
}

function resolveCityDepartment(cityValue = "", fallbackDepartment = "") {
  const rawCity = clean(cityValue);
  const rawDepartment = clean(fallbackDepartment);
  if (!rawCity) return { city: "", department: rawDepartment ? titleCaseName(rawDepartment) : "", geographyStatus: "" };
  const match = CITY_DEPARTMENT_MAP[normalizeLookup(rawCity)];
  if (match) return { city: match[0], department: match[1], geographyStatus: "validado" };
  return {
    city: titleCaseName(rawCity),
    department: rawDepartment ? titleCaseName(rawDepartment) : "Por validar",
    geographyStatus: "pendiente_validacion"
  };
}

function csvEscape(value) {
  const raw = String(value ?? "");
  return /[",\n;]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;
}

function xmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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

function downloadExcelWorkbook(filename, sheets = []) {
  const workbook = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header"><Font ss:Bold="1" ss:Color="#FFFFFF"/><Interior ss:Color="#1D4ED8" ss:Pattern="Solid"/></Style>
  <Style ss:ID="Money"><NumberFormat ss:Format="$ #,##0"/></Style>
 </Styles>
 ${sheets.map((sheet) => {
    const rows = sheet.rows || [];
    return `<Worksheet ss:Name="${xmlEscape((sheet.name || "Hoja").slice(0, 31))}"><Table>${rows.map((row, rowIndex) => `<Row>${row.map((cell) => {
      const numeric = typeof cell === "number" && Number.isFinite(cell);
      return `<Cell${rowIndex === 0 ? ' ss:StyleID="Header"' : numeric ? ' ss:StyleID="Money"' : ""}><Data ss:Type="${numeric ? "Number" : "String"}">${xmlEscape(cell)}</Data></Cell>`;
    }).join("")}</Row>`).join("")}</Table></Worksheet>`;
  }).join("")}
</Workbook>`;
  const blob = new Blob([workbook], { type: "application/vnd.ms-excel;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`;
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

function customerSearchMatches(customers = [], type = "name", query = "") {
  const q = normalizeText(query);
  if (!q) return [];
  return customers
    .filter((customer) => {
      if (type === "id") return normalizeText(customer.id).includes(q);
      if (type === "documentNumber") return isValidDocumentSearch(customer.documentNumber) && onlyDigits(customer.documentNumber) === onlyDigits(query);
      const field = type === "alternateName" ? customer.alternateName : customer.name;
      return normalizeText(field).includes(q);
    })
    .slice(0, 25);
}

function customerBalanceView(customer = {}) {
  const balance = Number(customer.balance || 0);
  const credit = Number(customer.unappliedCredit || 0);
  if (credit > 0 || balance < 0) {
    const value = credit > 0 ? credit : Math.abs(balance);
    return {
      label: "Saldo a favor",
      value: credit > 0 ? (customer.unappliedCreditLabel || money(value)) : money(value),
      tone: "#6D28D9",
      statusStyle: {
        color: "#6D28D9",
        background: "rgba(109,40,217,.10)",
        border: "1px solid rgba(109,40,217,.16)"
      }
    };
  }
  if (balance === 0) {
    return {
      label: "Al dia",
      value: "$ 0",
      tone: "#15803D",
      statusStyle: {
        color: "#15803D",
        background: "rgba(34,197,94,.10)",
        border: "1px solid rgba(34,197,94,.16)"
      }
    };
  }
  return {
    label: "Saldo pendiente",
    value: customer.balanceLabel || money(balance),
    tone: "#C2410C",
    statusStyle: {
      color: "#B91C1C",
      background: "rgba(239,68,68,.10)",
      border: "1px solid rgba(239,68,68,.16)"
    }
  };
}

function emptyAging() {
  return AGING_BUCKETS.reduce((totals, [key]) => ({ ...totals, [key]: 0 }), {});
}

function mergeRecordsByKey(current = [], incoming = [], key = "id") {
  if (!incoming.length) return current || [];
  const merged = new Map((current || []).map((item) => [clean(item?.[key]), item]));
  incoming.forEach((item) => {
    const recordKey = clean(item?.[key]);
    if (recordKey) merged.set(recordKey, item);
  });
  return [...merged.values()];
}

function rebuildDashboardFromData(data = {}) {
  const previous = data.dashboard || {};
  const summaries = data.customerSummary || [];
  const invoices = (data.invoices || []).filter((invoice) => invoice.status !== "anulada");
  const payments = (data.payments || []).filter((payment) => payment.status !== "anulado");
  const orders = (data.orders || []).filter((order) => order.status !== "anulada");
  const pending = summaries.reduce((sum, customer) => sum + Math.max(0, Number(customer.balance || 0)), 0);
  const credit = summaries.reduce((sum, customer) => sum + Math.max(0, Number(customer.unappliedCredit || 0), Number(customer.balance || 0) < 0 ? Math.abs(Number(customer.balance || 0)) : 0), 0);
  const overdueInvoicesCount = summaries.reduce((sum, customer) => sum + Number(customer.overdueInvoicesCount || 0), 0);
  const dueSoonInvoicesCount = summaries.reduce((sum, customer) => sum + Number(customer.dueSoonInvoicesCount || 0), 0);
  const billed = summaries.length
    ? summaries.reduce((sum, customer) => sum + Number(customer.billed || 0), 0)
    : invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const paid = summaries.length
    ? summaries.reduce((sum, customer) => sum + Number(customer.paid || 0), 0)
    : payments.reduce((sum, payment) => sum + Number(payment.totalApplied || payment.netReceived || payment.grossAmount || 0), 0);
  const aging = summaries.reduce((totals, customer) => {
    Object.entries(customer.aging || {}).forEach(([key, value]) => {
      totals[key] = Number(totals[key] || 0) + Number(value || 0);
    });
    return totals;
  }, emptyAging());
  const topDebtors = [...summaries]
    .filter((customer) => Number(customer.balance || 0) > 0)
    .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0))
    .slice(0, 20);
  const creditsToReview = [...summaries]
    .filter((customer) => Number(customer.unappliedCredit || 0) > 0 || Number(customer.balance || 0) < 0)
    .sort((a, b) => {
      const left = Number(a.unappliedCredit || 0) || Math.abs(Math.min(0, Number(a.balance || 0)));
      const right = Number(b.unappliedCredit || 0) || Math.abs(Math.min(0, Number(b.balance || 0)));
      return right - left;
    });
  const overdue = Number(aging.overdue0To30 || 0) + Number(aging.overdue31To60 || 0) + Number(aging.overdue61To90 || 0) + Number(aging.overdueOver90 || 0);
  const upcoming = Number(aging.dueToday || 0) + Number(aging.upcoming7 || 0) + Number(aging.upcoming15 || 0) + Number(aging.upcoming30 || 0);

  return {
    ...previous,
    customersCount: (data.customers || []).length || previous.customersCount || summaries.length,
    invoicesCount: invoices.length || previous.invoicesCount || 0,
    paymentsCount: payments.length || previous.paymentsCount || 0,
    ordersCount: orders.length || previous.ordersCount || 0,
    inventoryCount: (data.inventory || []).length || previous.inventoryCount || 0,
    importsCount: (data.imports || []).length || previous.importsCount || 0,
    totalBilled: billed,
    totalBilledLabel: money(billed),
    totalPaid: paid,
    totalPaidLabel: money(paid),
    pending,
    pendingLabel: money(pending),
    aging,
    agingLabels: Object.fromEntries(Object.entries(aging).map(([key, value]) => [key, money(value)])),
    overdue,
    overdueLabel: money(overdue),
    upcoming,
    upcomingLabel: money(upcoming),
    currentLabel: money(aging.current || 0),
    dueTodayLabel: money(aging.dueToday || 0),
    overdueInvoicesCount,
    dueSoonInvoicesCount,
    unappliedCredit: credit,
    unappliedCreditLabel: money(credit),
    outdatedCustomersCount: summaries.filter((customer) => (customer.missingFields || []).length).length,
    negativeInventoryCount: (data.inventory || []).filter((item) => Number(item.stock || 0) < 0).length,
    topDebtors,
    creditsToReview
  };
}

function applyPortalPatch(current = {}, patch = {}) {
  if (!patch || typeof patch !== "object") return current;
  const records = patch.records || {};
  const next = {
    ...current,
    companyId: patch.companyId || current.companyId,
    company: patch.company || current.company,
    currency: patch.currency || current.currency,
    updatedAt: patch.updatedAt || current.updatedAt,
    nextCustomerId: patch.nextCustomerId || current.nextCustomerId,
    nextInvoiceId: patch.nextInvoiceId || current.nextInvoiceId,
    nextPaymentId: patch.nextPaymentId || current.nextPaymentId,
    nextOrderId: patch.nextOrderId || current.nextOrderId,
    nextMovementId: patch.nextMovementId || current.nextMovementId,
    templates: patch.templates || current.templates,
    customers: mergeRecordsByKey(current.customers || [], records.customers || []),
    invoices: mergeRecordsByKey(current.invoices || [], records.invoices || []),
    payments: mergeRecordsByKey(current.payments || [], records.payments || []),
    inventory: mergeRecordsByKey(current.inventory || [], records.inventory || [], "sku"),
    inventoryMovements: mergeRecordsByKey(current.inventoryMovements || [], records.inventoryMovements || []),
    orders: mergeRecordsByKey(current.orders || [], records.orders || []),
    imports: mergeRecordsByKey(current.imports || [], records.imports || []),
    customerSummary: mergeRecordsByKey(current.customerSummary || [], patch.customerSummary || []),
    isCompact: current.isCompact
  };
  next.dashboard = rebuildDashboardFromData(next);
  return next;
}

function customerCollectionMessage(customer = {}) {
  return `Hola ${customer.name || "cliente"}, cordial saludo. Te contactamos para compartir el estado de cartera registrado a la fecha. Actualmente figura un saldo pendiente por valor de ${customer.balanceLabel || money(customer.balance)}. Agradecemos confirmar la fecha estimada de pago o enviarnos el soporte si ya fue cancelado.`;
}

function customerContactMessage(customer = {}) {
  return `Hola ${customer.name || "cliente"}, cordial saludo. Te contactamos para actualizar y confirmar informacion de tu cuenta. Quedamos atentos para ayudarte.`;
}

function customerWhatsappMessage(customer = {}) {
  return Number(customer.balance || 0) > 0 ? customerCollectionMessage(customer) : customerContactMessage(customer);
}

function customerWhatsappUrl(customer = {}) {
  const phone = onlyDigits(customer.phone).slice(-10);
  if (!phone || phone.length < 10) return "";
  return `https://wa.me/57${phone}?text=${encodeURIComponent(customerWhatsappMessage(customer))}`;
}

function openExternalUrl(url) {
  const win = window.open(url, "_blank", "noopener,noreferrer");
  if (win) win.opener = null;
}

function scopedExportData(data = {}, context = {}) {
  if (!context?.customerId && !context?.filters) return data;
  const filters = context.filters || {};
  const customerId = context.customerId || "";
  const matchesCustomerId = (record) => !customerId || record.customerId === customerId || record.id === customerId;
  const customerSummary = customerId
    ? (data.customerSummary || []).filter((customer) => customer.id === customerId)
    : (context.filters ? getScopedCustomers(data, filters) : (data.customerSummary || []));
  const customerIds = new Set(customerSummary.map((customer) => customer.id));
  const matchesScopedCustomer = (record) => {
    if (customerId) return matchesCustomerId(record);
    if (!context.filters) return true;
    return customerIds.has(record.customerId || record.id);
  };
  const filterRecord = (records = [], options = {}) => {
    if (customerId) return records.filter(matchesScopedCustomer);
    if (context.filters) return sortRecords(filterRecordsByQuery(records, data, filters, options), data, filters.sort || "recent");
    return records;
  };
  const filterInventoryMovements = (records = []) => {
    if (!context.filters) return records;
    const q = normalizeText(filters.sku || filters.customerQuery || "");
    const range = periodRange(filters.period || "all", filters.from, filters.to);
    return records
      .filter((movement) => {
        if (q && !normalizeText(`${movement.sku} ${movement.productNameSnapshot} ${movement.type} ${movement.reference} ${movement.sourceId}`).includes(q)) return false;
        if ((filters.period || "all") !== "all" && !dateInRange(movement.date, range)) return false;
        return true;
      })
      .sort((left, right) => clean(right.date || right.createdAt).localeCompare(clean(left.date || left.createdAt)) || clean(right.id).localeCompare(clean(left.id), "es"));
  };
  return {
    ...data,
    customerSummary,
    invoices: filterRecord(data.invoices || []),
    payments: filterRecord(data.payments || []),
    orders: filterRecord(data.orders || []),
    inventoryMovements: filterInventoryMovements(data.inventoryMovements || []),
    customers: customerId ? (data.customers || []).filter((customer) => customer.id === customerId) : (data.customers || [])
  };
}

function getScopedCustomers(data = {}, filters = {}) {
  const rows = data.customerSummary || [];
  const q = normalizeText(filters.customerQuery);
  return rows.filter((customer) => {
    const matchesText = !q
      || (filters.customerSearchType === "id" && normalizeText(customer.id).includes(q))
      || (filters.customerSearchType === "documentNumber" && isValidDocumentSearch(customer.documentNumber) && onlyDigits(customer.documentNumber) === onlyDigits(filters.customerQuery))
      || (filters.customerSearchType === "alternateName" && normalizeText(customer.alternateName).includes(q))
      || ((!filters.customerSearchType || filters.customerSearchType === "name") && normalizeText(customer.name).includes(q));
    if (!matchesText) return false;
    const range = periodRange(filters.period || "all", filters.from, filters.to);
    if ((filters.period || "all") === "all") return true;
    const hasInvoice = (customer.receivableInvoices || []).some((invoice) => dateInRange(invoice.date, range) || dateInRange(invoice.dueDate, range));
    const hasPayment = (data.payments || []).some((payment) => payment.customerId === customer.id && dateInRange(payment.date, range));
    return hasInvoice || hasPayment;
  });
}

function buildRowsForExport(data, type, context = {}) {
  data = scopedExportData(data, context);
  if (type === "clientes") {
    return [
      ["id_cliente", "nombre_cliente", "nombre_alterno", "documento", "telefono", "correo", "direccion", "ciudad", "departamento", "zona", "estado_datos", "facturado", "pagado", "saldo", "cartera_vencida"],
      ...(data.customerSummary || []).map((customer) => [customer.id, customer.name, customer.alternateName, customer.documentNumber, customer.phone, customer.email, customer.address, customer.city, customer.department, customer.zone, customer.dataStatus, customer.billed, customer.paid, customer.balance, customer.overdue || 0])
    ];
  }
  if (type === "facturas") {
    return [
      ["id_factura", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "orden_compra", "consecutivo_interno", "condicion_pago", "subtotal_sin_iva", "subtotal_exento_0", "subtotal_iva_5", "subtotal_iva_19", "iva_5", "iva_19", "anticipos_saldos_favor", "observacion_anticipo", "subtotal", "iva", "descuentos", "total", "estado", "fuente"],
      ...(data.invoices || []).map((invoice) => [
        invoice.id,
        invoice.customerId,
        invoice.customerNameSnapshot,
        invoice.date,
        invoice.dueDate,
        invoice.orderNumber || "",
        invoice.internalConsecutive || "",
        invoice.paymentCondition || "credito",
        invoice.summaryBreakdown?.subtotalNoTax || "",
        invoice.summaryBreakdown?.subtotalExempt || "",
        invoice.summaryBreakdown?.subtotalTax5 || "",
        invoice.summaryBreakdown?.subtotalTax19 || "",
        invoice.summaryBreakdown?.iva5 || "",
        invoice.summaryBreakdown?.iva19 || "",
        invoice.summaryBreakdown?.advanceCredit || "",
        invoice.summaryBreakdown?.advanceCreditNote || "",
        invoice.subtotal,
        invoice.taxTotal,
        invoice.discountTotal,
        invoice.total,
        invoice.status,
        invoice.source
      ])
    ];
  }
  if (type === "detalle_facturas") {
    return [
      ["id_factura", "id_cliente", "nombre_cliente", "fecha", "orden_compra", "consecutivo_interno", "condicion_pago", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "subtotal", "iva", "total"],
      ...(data.invoices || []).flatMap((invoice) => (invoice.lines || []).length
        ? (invoice.lines || []).map((line) => [invoice.id, invoice.customerId, invoice.customerNameSnapshot, invoice.date, invoice.orderNumber || "", invoice.internalConsecutive || "", invoice.paymentCondition || "credito", line.sku, line.concept, line.quantity, line.unitPrice, line.discount, line.taxable ? "SI" : "NO", line.taxRate, line.subtotal, line.tax, line.total])
        : [[invoice.id, invoice.customerId, invoice.customerNameSnapshot, invoice.date, invoice.orderNumber || "", invoice.internalConsecutive || "", invoice.paymentCondition || "credito", "", "Factura resumida / cargue inicial", 1, invoice.total, 0, "NO", 0, invoice.total, 0, invoice.total]]
      )
    ];
  }
  if (type === "ordenes") {
    return [
      ["id_orden", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "subtotal", "iva", "descuentos", "total", "estado"],
      ...(data.orders || []).map((order) => [order.id, order.customerId, order.customerNameSnapshot, order.date, order.dueDate, order.subtotal, order.taxTotal, order.discountTotal, order.total, order.status])
    ];
  }
  if (type === "inventario") {
    return [
      ["sku", "nombre_producto", "precio_venta", "costo", "stock_actual", "aplica_iva", "tarifa_iva", "estado", "notas"],
      ...(data.inventory || []).map((item) => [item.sku, item.name, item.salePrice, item.cost, item.stock, item.taxable ? "SI" : "NO", item.taxRate, item.status, item.notes])
    ];
  }
  if (type === "movimientos") {
    return [
      ["id_movimiento", "fecha", "sku", "producto", "tipo", "cantidad", "efecto", "stock_antes", "stock_despues", "costo_unitario", "referencia", "origen", "notas"],
      ...(data.inventoryMovements || []).map((movement) => [movement.id, movement.date, movement.sku, movement.productNameSnapshot, movement.type, movement.quantity, movement.effect, movement.stockBefore, movement.stockAfter, movement.unitCost, movement.reference, movement.sourceType, movement.notes])
    ];
  }
  if (type === "cargues_historial") {
    return [
      ["id_cargue", "modulo", "filas", "estado", "advertencias", "importado_por", "fecha_importacion", "revertido_por", "fecha_reversion", "clientes", "facturas", "abonos", "inventario", "movimientos", "ordenes"],
      ...(data.imports || []).map((item) => [
        item.id,
        item.module,
        item.rows,
        item.status || "activo",
        item.warningsCount || 0,
        item.importedBy || "",
        item.importedAt || "",
        item.revertedBy || "",
        item.revertedAt || "",
        (item.affected?.customers || []).join(", "),
        (item.affected?.invoices || []).join(", "),
        (item.affected?.payments || []).join(", "),
        (item.affected?.inventory || []).join(", "),
        (item.affected?.inventoryMovements || []).join(", "),
        (item.affected?.orders || []).join(", ")
      ])
    ];
  }
  if (type === "abonos") {
    return [
      ["id_abono", "id_cliente", "nombre_cliente", "id_factura", "fecha", "valor_bruto", "retefuente", "reteica", "reteiva", "otras_retenciones", "descuento", "concepto_descuento", "saldo_favor_devolucion", "nota_devolucion", "valor_neto", "medio_pago", "referencia", "estado"],
      ...(data.payments || []).map((payment) => [payment.id, payment.customerId, payment.customerNameSnapshot, payment.invoiceId, payment.date, payment.grossAmount, payment.retentions?.retefuente, payment.retentions?.reteica, payment.retentions?.reteiva, payment.retentions?.other, payment.discounts?.amount || 0, payment.discounts?.concept || "", payment.returnCredit?.amount || 0, payment.returnCredit?.note || "", payment.netReceived, payment.method, payment.reference, payment.status])
    ];
  }
  return [
    ["id_cliente", "nombre_cliente", "facturado", "pagado", "saldo", "cartera_vencida", "proxima_a_vencer", "credito_sin_aplicar", ...AGING_BUCKETS.map(([, label]) => label.toLowerCase().replace(/\s+/g, "_"))],
    ...(data.customerSummary || []).map((customer) => [
      customer.id,
      customer.name,
      customer.billed,
      customer.paid,
      customer.balance,
      customer.overdue || 0,
      customer.upcoming || 0,
      customer.unappliedCredit || 0,
      ...AGING_BUCKETS.map(([key]) => customer.aging?.[key] || 0)
    ])
  ];
}

function buildWorkbookForExport(data, type, context = {}) {
  if (type === "actividad") {
    return buildActivityWorkbook(data, context.activity?.filters || {}, context.activity?.section || "all");
  }
  data = scopedExportData(data, context);
  const labels = {
    actividad: "Actividad del periodo",
    clientes: "Clientes",
    facturas: "Facturas",
    abonos: "Abonos",
    cartera: "Cartera",
    cartera_detallada: "Cartera detallada",
    detalle_facturas: "Detalle productos por factura",
    cargues_historial: "Historial de cargues",
    inventario: "Inventario",
    movimientos: "Movimientos",
    ordenes: "Ordenes"
  };
  const sheets = [{ name: labels[type] || "Reporte", rows: buildRowsForExport(data, type) }];
  if (type === "facturas") {
    sheets.push({
      name: "Detalle facturas",
      rows: [
        ["id_factura", "id_cliente", "nombre_cliente", "fecha", "orden_compra", "consecutivo_interno", "condicion_pago", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "subtotal", "iva", "total"],
        ...(data.invoices || []).flatMap((invoice) => (invoice.lines || []).length
          ? (invoice.lines || []).map((line) => [invoice.id, invoice.customerId, invoice.customerNameSnapshot, invoice.date, invoice.orderNumber || "", invoice.internalConsecutive || "", invoice.paymentCondition || "credito", line.sku, line.concept, line.quantity, line.unitPrice, line.discount, line.taxable ? "SI" : "NO", line.taxRate, line.subtotal, line.tax, line.total])
          : [[invoice.id, invoice.customerId, invoice.customerNameSnapshot, invoice.date, invoice.orderNumber || "", invoice.internalConsecutive || "", invoice.paymentCondition || "credito", "", "Factura resumida / cargue inicial", 1, invoice.total, 0, "NO", 0, invoice.total, 0, invoice.total]]
        )
      ]
    });
  }
  if (type === "ordenes") {
    sheets.push({
      name: "Detalle ordenes",
      rows: [
        ["id_orden", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "subtotal", "iva", "total"],
        ...(data.orders || []).flatMap((order) => (order.lines || []).map((line) => [order.id, line.sku, line.concept, line.quantity, line.unitPrice, line.discount, line.taxable ? "SI" : "NO", line.taxRate, line.subtotal, line.tax, line.total]))
      ]
    });
  }
  if (type === "cartera" || type === "cartera_detallada") {
    sheets.push({
      name: "Detalle facturas",
      rows: [
        ["id_cliente", "nombre_cliente", "id_factura", "fecha", "fecha_vencimiento", "total", "aplicado", "saldo", "edad", "dias_mora"],
        ...(data.customerSummary || []).flatMap((customer) => (customer.receivableInvoices || []).map((invoice) => [
          customer.id,
          customer.name,
          invoice.id,
          invoice.date,
          invoice.dueDate,
          invoice.total,
          invoice.paid,
          invoice.balance,
          invoice.ageLabel,
          invoice.daysOverdue || 0
        ]))
      ]
    });
    sheets.push({
      name: "Abonos registrados",
      rows: [
        ["id_cliente", "nombre_cliente", "id_abono", "id_factura", "fecha", "valor_bruto", "retenciones", "descuento", "concepto_descuento", "saldo_favor_devolucion", "neto_recibido", "metodo", "referencia", "estado"],
        ...(data.payments || []).map((payment) => [payment.customerId, payment.customerNameSnapshot, payment.id, payment.invoiceId || "Global FIFO", payment.date, payment.grossAmount, payment.retentionTotal, payment.discounts?.amount || 0, payment.discounts?.concept || "", payment.returnCredit?.amount || 0, payment.netReceived, payment.method, payment.reference, payment.status])
      ]
    });
  }
  sheets.push({
    name: "Generado",
    rows: [["reporte", labels[type] || type], ["fecha_generacion", new Date().toISOString()]]
  });
  return sheets;
}

function blankLine() {
  return {
    id: `LINE-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sku: "",
    concept: "",
    quantity: 1,
    unitPrice: "",
    discountMode: "value",
    discountPercent: 0,
    discount: "",
    taxable: false,
    taxRate: 0
  };
}

function lineDiscountAmount(line = {}) {
  const base = Number(line.quantity || 0) * moneyValue(line.unitPrice);
  if (line.discountMode === "percent") return Math.round(base * (Number(line.discountPercent || 0) / 100));
  return moneyValue(line.discount);
}

function uiLineTotals(lines = []) {
  return lines.reduce((totals, line) => {
    const quantity = Number(line.quantity || 0) || 0;
    const unitPrice = moneyValue(line.unitPrice);
    const discount = lineDiscountAmount(line);
    const subtotal = Math.max(quantity * unitPrice - discount, 0);
    const tax = line.taxable ? Math.round(subtotal * (Number(line.taxRate || 0) / 100)) : 0;
    return {
      subtotal: totals.subtotal + subtotal,
      discount: totals.discount + discount,
      tax: totals.tax + tax,
      total: totals.total + subtotal + tax
    };
  }, { subtotal: 0, discount: 0, tax: 0, total: 0 });
}

function linesForPayload(lines = []) {
  return lines
    .filter((line) => clean(line.concept) || clean(line.sku) || moneyValue(line.unitPrice) > 0)
    .map((line) => ({
      id: line.id,
      sku: line.sku,
      concept: line.concept,
      quantity: Number(line.quantity || 0) || 1,
      unitPrice: moneyValue(line.unitPrice),
      discount: lineDiscountAmount(line),
      taxable: Boolean(line.taxable),
      taxRate: Number(line.taxRate || 0) || 0
    }));
}

function lineToDraft(line = {}) {
  const base = blankLine();
  return {
    ...base,
    id: line.id || base.id,
    sku: line.sku || "",
    concept: line.concept || "",
    quantity: line.quantity || 1,
    unitPrice: formatCurrencyInput(line.unitPrice),
    discountMode: "value",
    discountPercent: 0,
    discount: formatCurrencyInput(line.discount),
    taxable: Boolean(line.taxable),
    taxRate: Number(line.taxRate || 0) || 0
  };
}

function exportTypeForModule(module) {
  if (module === "abonos") return "abonos";
  if (module === "movimientos_inventario" || module === "movimientos") return "movimientos";
  if (module === "inventario") return "inventario";
  if (module === "actualizacion_productos") return "inventario";
  if (module === "ordenes_detalladas" || module === "ordenes") return "ordenes";
  if (module === "facturas_historicas" || module === "facturas_detalladas" || module === "facturas") return "facturas";
  return "clientes";
}

const DEFAULT_PAGE_SIZE = 25;
const PERIOD_OPTIONS = [
  ["today", "Hoy"],
  ["yesterday", "Ayer"],
  ["week", "Ultima semana"],
  ["month", "Ultimo mes"],
  ["custom", "Personalizado"],
  ["all", "Todo"]
];

function addDays(date, amount) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

function periodRange(period = "month", customFrom = "", customTo = "") {
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "today") return { from: isoDate(current), to: isoDate(current) };
  if (period === "yesterday") {
    const yesterday = addDays(current, -1);
    return { from: isoDate(yesterday), to: isoDate(yesterday) };
  }
  if (period === "week") return { from: isoDate(addDays(current, -7)), to: isoDate(current) };
  if (period === "month") return { from: isoDate(addDays(current, -30)), to: isoDate(current) };
  if (period === "custom") return { from: customFrom || "", to: customTo || "" };
  return { from: "", to: "" };
}

function dateInRange(value = "", range = {}) {
  const date = clean(value);
  if (!date) return false;
  if (range.from && date < range.from) return false;
  if (range.to && date > range.to) return false;
  return true;
}

function parseLocalDate(value = "") {
  const text = clean(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  const [year, month, day] = text.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatShortDate(value = "") {
  const date = parseLocalDate(value);
  if (!date) return "";
  return new Intl.DateTimeFormat("es-CO", { day: "numeric", month: "short" }).format(date);
}

function daysBetween(from = "", to = "") {
  const start = parseLocalDate(from);
  const end = parseLocalDate(to);
  if (!start || !end) return 0;
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
}

function previousComparableRange(period = "month", range = {}) {
  if (period === "all" || !range.from || !range.to) return null;
  const start = parseLocalDate(range.from);
  if (!start) return null;
  const length = daysBetween(range.from, range.to);
  const previousTo = addDays(start, -1);
  const previousFrom = addDays(previousTo, -(length - 1));
  return { from: isoDate(previousFrom), to: isoDate(previousTo) };
}

function periodTitle(period = "month") {
  return PERIOD_OPTIONS.find(([id]) => id === period)?.[1] || "Periodo";
}

function periodSummary(period = "month", range = {}) {
  if (period === "all") return "Todo el historico";
  if (!range.from || !range.to) return "Sin rango definido";
  if (range.from === range.to) return formatShortDate(range.from);
  return `${formatShortDate(range.from)} - ${formatShortDate(range.to)}`;
}

function plusDaysIso(value = "", amount = 15) {
  const date = parseLocalDate(value) || parseLocalDate(today()) || new Date();
  return isoDate(addDays(date, amount));
}

function recordsTotal(records = [], valueGetter = () => 0) {
  return records.reduce((sum, record) => sum + Number(valueGetter(record) || 0), 0);
}

function metricVariation(current = 0, previous = 0) {
  const now = Number(current || 0);
  const before = Number(previous || 0);
  if (!before && !now) return { label: "0%", caption: "sin variacion", tone: "#64748B" };
  if (!before && now) return { label: "+100%", caption: "sin base previa", tone: "#15803D" };
  const pct = ((now - before) / Math.abs(before)) * 100;
  const rounded = Math.round(pct);
  return {
    label: `${rounded > 0 ? "+" : ""}${rounded}%`,
    caption: "vs periodo anterior",
    tone: rounded > 0 ? "#15803D" : rounded < 0 ? "#B91C1C" : "#64748B"
  };
}

function metricShare(value = 0, total = 0, caption = "del total") {
  const base = Math.abs(Number(total || 0));
  const pct = base > 0 ? Math.round((Math.abs(Number(value || 0)) / base) * 100) : 0;
  return { label: `${pct}%`, caption, tone: "#64748B" };
}

function periodSeries(records = [], range = {}, dateField = "date", valueGetter = () => 0, bucketCount = 6) {
  if (!records.length) return Array.from({ length: bucketCount }, () => 0);
  const end = parseLocalDate(range.to) || new Date();
  const start = parseLocalDate(range.from) || addDays(end, -(bucketCount - 1));
  const totalDays = Math.max(daysBetween(isoDate(start), isoDate(end)), bucketCount);
  const bucketSize = Math.max(1, Math.ceil(totalDays / bucketCount));
  const first = addDays(end, -((bucketSize * bucketCount) - 1));
  const values = Array.from({ length: bucketCount }, () => 0);
  records.forEach((record) => {
    const date = parseLocalDate(record[dateField]);
    if (!date || date < first || date > end) return;
    const diff = Math.floor((date.getTime() - first.getTime()) / 86400000);
    const index = Math.min(bucketCount - 1, Math.max(0, Math.floor(diff / bucketSize)));
    values[index] += Number(valueGetter(record) || 0);
  });
  return values;
}

function customerLabelForRecord(record = {}, data = {}) {
  return customerById(data, record.customerId)?.name || record.customerNameSnapshot || record.customerId || "";
}

function recordMatchesCustomer(record = {}, data = {}, type = "name", query = "") {
  const q = normalizeText(query);
  if (!q) return true;
  const customer = customerById(data, record.customerId) || {};
  if (type === "id") return normalizeText(record.customerId || customer.id).includes(q);
  if (type === "documentNumber") return isValidDocumentSearch(customer.documentNumber) && onlyDigits(customer.documentNumber) === onlyDigits(query);
  if (type === "alternateName") return normalizeText(customer.alternateName).includes(q);
  return normalizeText(customer.name || record.customerNameSnapshot).includes(q);
}

function filterRecordsByQuery(records = [], data = {}, filters = {}, options = {}) {
  const range = periodRange(filters.period || "all", filters.from, filters.to);
  const dateField = options.dateField || "date";
  return records.filter((record) => {
    if (filters.status && clean(record.status) !== filters.status) return false;
    if (filters.sku && normalizeText(record.sku).includes(normalizeText(filters.sku)) === false) return false;
    if ((filters.period || "all") !== "all" && !dateInRange(record[dateField], range)) return false;
    return recordMatchesCustomer(record, data, filters.customerSearchType || "name", filters.customerQuery || "");
  });
}

function recordAmount(record = {}) {
  return Number(record.total || record.netReceived || record.grossAmount || record.totalApplied || record.balance || 0) || 0;
}

function recordSequenceValue(record = {}) {
  const id = clean(record.id);
  const match = id.match(/(\d+)(?!.*\d)/);
  return match ? Number(match[1]) : 0;
}

function compareRecordId(left = {}, right = {}) {
  const numberCompare = recordSequenceValue(right) - recordSequenceValue(left);
  if (numberCompare) return numberCompare;
  return clean(right.id).localeCompare(clean(left.id), "es", { numeric: true });
}

function sortRecords(records = [], data = {}, sort = "recent") {
  const list = [...records];
  return list.sort((left, right) => {
    if (sort === "idDesc") return compareRecordId(left, right);
    if (sort === "idAsc") return compareRecordId(right, left);
    if (sort === "oldest") return clean(left.date || left.createdAt).localeCompare(clean(right.date || right.createdAt));
    if (sort === "amountDesc") return recordAmount(right) - recordAmount(left);
    if (sort === "amountAsc") return recordAmount(left) - recordAmount(right);
    if (sort === "clientAsc") return customerLabelForRecord(left, data).localeCompare(customerLabelForRecord(right, data), "es");
    if (sort === "clientDesc") return customerLabelForRecord(right, data).localeCompare(customerLabelForRecord(left, data), "es");
    const dateCompare = clean(right.date || right.createdAt).localeCompare(clean(left.date || left.createdAt));
    return dateCompare || clean(right.id).localeCompare(clean(left.id), "es");
  });
}

function activityDateOnly(record = {}, filters = {}) {
  const createdDate = clean(record.createdAt).slice(0, 10) || clean(record.updatedAt).slice(0, 10);
  const operationDate = clean(record.date).slice(0, 10) || createdDate;
  return (filters.dateMode || "createdAt") === "operation" ? operationDate : (createdDate || operationDate);
}

function activityRange(filters = {}) {
  return periodRange(filters.period || "today", filters.from, filters.to);
}

function activityDateInRange(record = {}, filters = {}) {
  const period = filters.period || "today";
  if (period === "all") return true;
  return dateInRange(activityDateOnly(record, filters), activityRange(filters));
}

function activityDataset(data = {}, filters = {}) {
  const customers = (data.customerSummary || data.customers || []).filter((customer) => activityDateInRange(customer, { ...filters, dateMode: "createdAt" }));
  const invoices = (data.invoices || []).filter((invoice) => activityDateInRange(invoice, filters));
  const payments = (data.payments || []).filter((payment) => activityDateInRange(payment, filters));
  const orders = (data.orders || []).filter((order) => activityDateInRange(order, filters));
  const movements = (data.inventoryMovements || []).filter((movement) => activityDateInRange(movement, filters));
  return {
    customers: sortRecords(customers, data, "idDesc"),
    invoices: sortRecords(invoices, data, "idDesc"),
    payments: sortRecords(payments, data, "idDesc"),
    orders: sortRecords(orders, data, "idDesc"),
    movements: sortRecords(movements, data, "idDesc")
  };
}

function activityRowsForExport(data = {}, filters = {}, section = "all") {
  const activity = activityDataset(data, filters);
  const allSections = {
    customers: {
      name: "Clientes",
      rows: [
        ["id_cliente", "nombre_cliente", "nombre_alterno", "documento", "telefono", "correo", "fecha_registro", "estado_datos"],
        ...activity.customers.map((customer) => [customer.id, customer.name, customer.alternateName, customer.documentNumber, customer.phone, customer.email, clean(customer.createdAt).slice(0, 10), customer.dataStatus || ""])
      ]
    },
    invoices: {
      name: "Facturas",
      rows: [
        ["id_factura", "id_cliente", "cliente", "fecha_registro", "fecha_factura", "fecha_vencimiento", "total", "estado", "condicion_pago"],
        ...activity.invoices.map((invoice) => [invoice.id, invoice.customerId, invoice.customerNameSnapshot, clean(invoice.createdAt).slice(0, 10), invoice.date, invoice.dueDate, invoice.total, invoice.status, invoice.paymentCondition || ""])
      ]
    },
    payments: {
      name: "Abonos",
      rows: [
        ["id_abono", "id_cliente", "cliente", "fecha_registro", "fecha_abono", "valor_bruto", "neto_recibido", "medio_pago", "referencia", "estado"],
        ...activity.payments.map((payment) => [payment.id, payment.customerId, payment.customerNameSnapshot, clean(payment.createdAt).slice(0, 10), payment.date, payment.grossAmount, payment.netReceived, payment.method, payment.reference, payment.status])
      ]
    },
    orders: {
      name: "Ordenes",
      rows: [
        ["id_orden", "id_cliente", "cliente", "fecha_registro", "fecha_orden", "fecha_vencimiento", "total", "estado"],
        ...activity.orders.map((order) => [order.id, order.customerId, order.customerNameSnapshot, clean(order.createdAt).slice(0, 10), order.date, order.dueDate, order.total, order.status])
      ]
    },
    movements: {
      name: "Movimientos",
      rows: [
        ["id_movimiento", "fecha_registro", "fecha_movimiento", "sku", "producto", "tipo", "cantidad", "efecto", "stock_final", "referencia"],
        ...activity.movements.map((movement) => [movement.id, clean(movement.createdAt).slice(0, 10), movement.date, movement.sku, movement.productNameSnapshot, movement.type, movement.quantity, movement.effect, movement.stockAfter, movement.reference])
      ]
    }
  };
  if (section !== "all" && allSections[section]) return [allSections[section]];
  return Object.values(allSections);
}

function buildActivityWorkbook(data = {}, filters = {}, section = "all") {
  const range = activityRange(filters);
  const activity = activityDataset(data, filters);
  const periodLabel = periodSummary(filters.period || "today", range);
  const activeInvoices = activity.invoices.filter((invoice) => invoice.status !== "anulada");
  const activePayments = activity.payments.filter((payment) => payment.status !== "anulado");
  const invoiceTotal = recordsTotal(activeInvoices, (invoice) => invoice.total);
  const paymentGrossTotal = recordsTotal(activePayments, (payment) => payment.grossAmount);
  const paymentNetTotal = recordsTotal(activePayments, (payment) => payment.netReceived);
  const voidInvoiceTotal = recordsTotal(activity.invoices.filter((invoice) => invoice.status === "anulada"), (invoice) => invoice.total);
  const voidPaymentGrossTotal = recordsTotal(activity.payments.filter((payment) => payment.status === "anulado"), (payment) => payment.grossAmount);
  const customerActivityIds = new Set([
    ...activity.invoices.map((invoice) => invoice.customerId),
    ...activity.payments.map((payment) => payment.customerId),
    ...activity.orders.map((order) => order.customerId)
  ].map(clean).filter(Boolean));
  const ticketAverage = activeInvoices.length ? Math.round(invoiceTotal / activeInvoices.length) : 0;
  const sheets = [
    {
      name: "Resumen",
      rows: [
        ["concepto", "valor"],
        ["periodo", periodLabel],
        ["tipo_fecha", (filters.dateMode || "createdAt") === "operation" ? "Fecha de documento u operacion" : "Fecha de registro"],
        ["clientes_creados", activity.customers.length],
        ["facturas_registradas", activity.invoices.length],
        ["total_facturado", invoiceTotal],
        ["abonos_registrados", activity.payments.length],
        ["total_abonado_bruto", paymentGrossTotal],
        ["total_abonado_neto", paymentNetTotal],
        ["retenciones_descuentos_y_favor", Math.max(paymentGrossTotal - paymentNetTotal, 0)],
        ["clientes_con_actividad", customerActivityIds.size],
        ["ticket_promedio_factura", ticketAverage],
        ["cartera_generada_periodo", invoiceTotal - paymentGrossTotal],
        ["facturas_anuladas", activity.invoices.filter((invoice) => invoice.status === "anulada").length],
        ["valor_facturas_anuladas", voidInvoiceTotal],
        ["abonos_anulados", activity.payments.filter((payment) => payment.status === "anulado").length],
        ["valor_abonos_anulados_bruto", voidPaymentGrossTotal],
        ["ultima_factura", activeInvoices[0]?.id || ""],
        ["ultimo_abono", activePayments[0]?.id || ""],
        ["ordenes_creadas", activity.orders.length],
        ["movimientos_inventario", activity.movements.length]
      ]
    },
    ...activityRowsForExport(data, filters, section)
  ];
  sheets.push({ name: "Generado", rows: [["reporte", "Actividad del periodo"], ["fecha_generacion", new Date().toISOString()]] });
  return sheets;
}

function blankPaymentSplit(date = today(), amount = "") {
  return {
    id: `PAY-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount,
    method: "Transferencia bancaria",
    date,
    reference: ""
  };
}

function paymentSplitsTotal(splits = []) {
  return splits.reduce((sum, split) => sum + moneyValue(split.amount), 0);
}

function normalizePaymentSplits(splits = []) {
  return splits
    .map((split) => ({
      amount: moneyValue(split.amount),
      method: clean(split.method) || "Transferencia bancaria",
      date: split.date || today(),
      reference: clean(split.reference)
    }))
    .filter((split) => split.amount > 0);
}

function blankTotalizedBreakdown() {
  return {
    subtotalNoTax: "",
    subtotalExempt: "",
    subtotalTax5: "",
    subtotalTax19: "",
    advanceCredit: "",
    advanceCreditNote: ""
  };
}

function totalizedInvoiceTotals(breakdown = {}) {
  const subtotalNoTax = moneyValue(breakdown.subtotalNoTax);
  const subtotalExempt = moneyValue(breakdown.subtotalExempt);
  const subtotalTax5 = moneyValue(breakdown.subtotalTax5);
  const subtotalTax19 = moneyValue(breakdown.subtotalTax19);
  const advanceCredit = moneyValue(breakdown.advanceCredit);
  const iva5 = Math.round(subtotalTax5 * 0.05);
  const iva19 = Math.round(subtotalTax19 * 0.19);
  const subtotal = subtotalNoTax + subtotalExempt + subtotalTax5 + subtotalTax19;
  const tax = iva5 + iva19;
  return {
    subtotalNoTax,
    subtotalExempt,
    subtotalTax5,
    subtotalTax19,
    iva5,
    iva19,
    subtotal,
    tax,
    advanceCredit,
    total: Math.max(subtotal + tax - advanceCredit, 0)
  };
}

function PeriodControls({ filters, setFilters, compact = false }) {
  return (
    <div className="client-period-controls" style={{ display: "grid", gridTemplateColumns: compact ? "minmax(160px,220px) repeat(2,minmax(130px,1fr))" : "minmax(160px,220px) repeat(2,minmax(130px,1fr))", gap: 10 }}>
      <Field label="Periodo">
        <select style={input} value={filters.period || "all"} onChange={(event) => setFilters((current) => ({ ...current, period: event.target.value }))}>
          {PERIOD_OPTIONS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
      </Field>
      {(filters.period || "all") === "custom" ? (
        <>
          <Field label="Desde"><input style={input} type="date" value={filters.from || ""} onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))} /></Field>
          <Field label="Hasta"><input style={input} type="date" value={filters.to || ""} onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))} /></Field>
        </>
      ) : null}
    </div>
  );
}

function QueryControls({ filters, setFilters, onSearch, onClear, statusOptions = [], placeholder = "Ej: JOSE", sortOptions = SORT_OPTIONS }) {
  return (
    <form onSubmit={(event) => { event.preventDefault(); onSearch?.(); }} style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 10 }}>
      <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "minmax(170px,220px) minmax(0,1fr) minmax(160px,220px) minmax(170px,220px)", gap: 10, alignItems: "end" }}>
        <Field label="Buscar por">
          <select style={input} value={filters.customerSearchType || "name"} onChange={(event) => setFilters((current) => ({ ...current, customerSearchType: event.target.value }))}>
            {CUSTOMER_SEARCH_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </Field>
        <Field label="Criterio"><input style={input} value={filters.customerQuery || ""} placeholder={placeholder} onChange={(event) => setFilters((current) => ({ ...current, customerQuery: event.target.value }))} /></Field>
        {statusOptions.length ? (
          <Field label="Estado">
            <select style={input} value={filters.status || ""} onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value }))}>
              <option value="">Todos</option>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
        ) : <div />}
        {sortOptions?.length ? (
          <Field label="Ordenar">
            <select style={input} value={filters.sort || "recent"} onChange={(event) => setFilters((current) => ({ ...current, sort: event.target.value }))}>
              {sortOptions.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </select>
          </Field>
        ) : <div />}
      </div>
      <PeriodControls filters={filters} setFilters={setFilters} />
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
        <button type="button" onClick={onClear} style={ghostButton}>Limpiar</button>
        <button type="submit" style={button}>Buscar</button>
      </div>
    </form>
  );
}

const smallButton = {
  ...button,
  padding: "8px 11px",
  borderRadius: 12,
  fontSize: 13
};

const ghostButton = {
  ...smallButton,
  background: "#fff",
  color: "#1D4ED8",
  border: "1px solid rgba(37,99,235,.14)"
};

const dangerGhostButton = {
  ...smallButton,
  background: "#fff",
  color: "#B91C1C",
  border: "1px solid rgba(220,38,38,.16)"
};

function StatusPill({ children, tone = "#1D4ED8" }) {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      width: "fit-content",
      padding: "5px 9px",
      borderRadius: 999,
      color: tone,
      background: `${tone}14`,
      border: `1px solid ${tone}22`,
      fontSize: 11,
      fontWeight: 900,
      lineHeight: 1.1,
      whiteSpace: "nowrap"
    }}>
      {children}
    </span>
  );
}

function RecordActions({ primary = [], more = [] }) {
  return (
    <div className="client-action-group client-action-group-compact">
      {primary.map((action) => (
        <button key={action.label} type="button" onClick={action.onClick} style={action.danger ? dangerGhostButton : ghostButton}>{action.label}</button>
      ))}
      {more.length ? (
        <details className="client-row-more">
          <summary>Mas</summary>
          <div>
            {more.map((action) => (
              <button key={action.label} type="button" onClick={action.onClick} className={action.danger ? "danger" : ""}>{action.label}</button>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  );
}

function customerById(data, id) {
  return (data.customerSummary || data.customers || []).find((customer) => customer.id === id);
}

function companyInitials(name = "") {
  const words = clean(name).split(/\s+/).filter(Boolean);
  const letters = words.length > 1 ? [words[0], words[1]] : [words[0] || "C"];
  return letters.map((word) => word.charAt(0).toLocaleUpperCase("es-CO")).join("").slice(0, 2);
}

function Icon({ name = "dashboard", size = 18 }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false"
  };
  const icons = {
    dashboard: (
      <>
        <path d="M4 13a8 8 0 0 1 16 0" />
        <path d="M12 13l4-4" />
        <path d="M6.5 18h11" />
      </>
    ),
    activity: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 14l3-3 3 2 4-6" />
        <path d="M17 7h3v3" />
        <circle cx="7" cy="14" r="1" />
        <circle cx="13" cy="13" r="1" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
        <circle cx="9.5" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
    invoice: (
      <>
        <path d="M7 3h10a2 2 0 0 1 2 2v16l-3-2-3 2-3-2-3 2-2-1.35V5a2 2 0 0 1 2-2z" />
        <path d="M9 8h6" />
        <path d="M9 12h6" />
        <path d="M9 16h3" />
      </>
    ),
    wallet: (
      <>
        <path d="M3 7a2 2 0 0 1 2-2h14v14H5a2 2 0 0 1-2-2z" />
        <path d="M17 11h4v4h-4a2 2 0 0 1 0-4z" />
        <path d="M7 5V3h10v2" />
      </>
    ),
    portfolio: (
      <>
        <path d="M4 19V5" />
        <path d="M4 19h16" />
        <path d="M7 15l3-4 3 2 4-6" />
        <path d="M17 7h3v3" />
      </>
    ),
    boxes: (
      <>
        <path d="M3 7l9-4 9 4-9 4z" />
        <path d="M3 7v10l9 4 9-4V7" />
        <path d="M12 11v10" />
      </>
    ),
    transfer: (
      <>
        <path d="M7 7h13" />
        <path d="M17 4l3 3-3 3" />
        <path d="M17 17H4" />
        <path d="M7 14l-3 3 3 3" />
      </>
    ),
    clipboard: (
      <>
        <path d="M9 4h6l1 2h3v15H5V6h3z" />
        <path d="M9 12h6" />
        <path d="M9 16h4" />
      </>
    ),
    upload: (
      <>
        <path d="M12 16V4" />
        <path d="M8 8l4-4 4 4" />
        <path d="M20 16.5V20H4v-3.5" />
      </>
    ),
    history: (
      <>
        <path d="M3 12a9 9 0 1 0 3-6.7" />
        <path d="M3 4v5h5" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.04.04-2 3.46-.06-.02a1.8 1.8 0 0 0-1.94.22 1.8 1.8 0 0 0-.72 1.42H9a1.8 1.8 0 0 0-.72-1.42 1.8 1.8 0 0 0-1.94-.22l-.06.02-2-3.46.04-.04A1.7 1.7 0 0 0 4.6 15 1.8 1.8 0 0 0 3.1 14H3v-4h.1A1.8 1.8 0 0 0 4.6 9a1.7 1.7 0 0 0-.34-1.88l-.04-.04 2-3.46.06.02a1.8 1.8 0 0 0 1.94-.22A1.8 1.8 0 0 0 9 2h6a1.8 1.8 0 0 0 .72 1.42 1.8 1.8 0 0 0 1.94.22l.06-.02 2 3.46-.04.04A1.7 1.7 0 0 0 19.4 9a1.8 1.8 0 0 0 1.5 1h.1v4h-.1a1.8 1.8 0 0 0-1.5 1z" />
      </>
    ),
    money: (
      <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <circle cx="12" cy="12" r="3" />
        <path d="M6 9h.01" />
        <path d="M18 15h.01" />
      </>
    ),
    alert: (
      <>
        <path d="M12 3l10 18H2z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),
    gift: (
      <>
        <path d="M20 12v8H4v-8" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 7v13" />
        <path d="M12 7H8.5A2.5 2.5 0 1 1 12 3.5z" />
        <path d="M12 7h3.5A2.5 2.5 0 1 0 12 3.5z" />
      </>
    )
  };
  return <svg {...common}>{icons[name] || icons.dashboard}</svg>;
}

function metricSparkline(seed = 0, count = 1) {
  const base = Math.abs(Number(seed) || 0);
  const factor = Math.max(Number(count) || 1, 1);
  return [
    18,
    24 + (base % 17),
    20 + Math.round((base / factor) % 20),
    36 + (base % 23),
    32 + ((base + factor) % 18),
    50 + ((base + factor * 7) % 22)
  ];
}

function MiniSparkline({ values = [], tone = "#1D4ED8" }) {
  const safeValues = values.map((value) => Number(value)).filter((value) => Number.isFinite(value));
  if (safeValues.length < 2) return null;
  const min = Math.min(...safeValues);
  const max = Math.max(...safeValues);
  const range = Math.max(max - min, 1);
  const points = safeValues
    .map((value, index) => {
      const x = (index / (safeValues.length - 1)) * 100;
      const y = 34 - ((value - min) / range) * 25;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg className="client-stat-sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={tone} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity=".72" />
      <path d={`M0 38 L${points.replaceAll(" ", " L")} L100 38 Z`} fill={tone} opacity=".07" />
    </svg>
  );
}

function CompanyBrand({ companyName = "", logoDataUrl = "" }) {
  return (
    <div className="client-company-brand">
      <div className="client-company-logo-frame" aria-hidden="true">
        {logoDataUrl ? (
          <img src={logoDataUrl} alt="" />
        ) : (
          <span>{companyInitials(companyName)}</span>
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, letterSpacing: "1.6px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>PORTAL PARA CLIENTES</div>
        <h1 className="client-company-name">{companyName || "Mi empresa"}</h1>
        <p style={{ margin: 0, fontFamily: F, color: "#52647F", fontSize: 13 }}>Cartera, facturas, abonos, inventario, ordenes y cargues masivos.</p>
      </div>
    </div>
  );
}

function moduleLabel(moduleId = "") {
  for (const group of MODULE_GROUPS) {
    const item = group.items.find(([id]) => id === moduleId);
    if (item) return item[1];
  }
  return "Dashboard";
}

function CompactPortalHeader({ visible, companyName = "", logoDataUrl = "", activeModule, onModuleChange, onRefresh, onLogout }) {
  return (
    <div className={`client-portal-sticky-header${visible ? " visible" : ""}`} aria-hidden={!visible}>
      <div className="client-portal-sticky-brand">
        <div className="client-portal-sticky-logo">
          {logoDataUrl ? <img src={logoDataUrl} alt="" /> : <span>{companyInitials(companyName)}</span>}
        </div>
        <div style={{ minWidth: 0 }}>
          <strong>{companyName || "Mi empresa"}</strong>
          <span>{moduleLabel(activeModule)}</span>
        </div>
      </div>
      <div className="client-portal-sticky-controls">
        <select aria-label="Cambiar modulo" value={activeModule} onChange={(event) => onModuleChange(event.target.value)} tabIndex={visible ? 0 : -1}>
          {MODULE_GROUPS.map((group) => (
            <optgroup key={group.title} label={group.title}>
              {group.items.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
            </optgroup>
          ))}
        </select>
        <button type="button" onClick={onRefresh} tabIndex={visible ? 0 : -1}>Actualizar</button>
        <button type="button" className="danger" onClick={onLogout} tabIndex={visible ? 0 : -1}>Salir</button>
      </div>
    </div>
  );
}

function moduleCounter(data = {}, id = "") {
  data = data || {};
  const dashboard = data.dashboard || {};
  const todayActivity = id === "actividad" ? activityDataset(data, { period: "today", dateMode: "createdAt" }) : null;
  const customers = data.customerSummary || [];
  const countMap = {
    actividad: todayActivity ? todayActivity.customers.length + todayActivity.invoices.length + todayActivity.payments.length + todayActivity.orders.length + todayActivity.movements.length : 0,
    clientes: dashboard.customersCount ?? customers.length,
    facturas: dashboard.invoicesCount ?? (data.invoices || []).length,
    abonos: dashboard.paymentsCount ?? (data.payments || []).length,
    cartera: customers.filter((customer) => Number(customer.balance || 0) > 0).length,
    inventario: dashboard.inventoryCount ?? (data.inventory || []).length,
    movimientos: dashboard.inventoryMovementsCount ?? (data.inventoryMovements || []).length,
    ordenes: dashboard.ordersCount ?? (data.orders || []).length,
    "cargues-historial": dashboard.importsCount ?? (data.imports || []).length
  };
  return Object.prototype.hasOwnProperty.call(countMap, id) ? countMap[id] : null;
}

function ModuleNavigation({ activeModule, onChange, data }) {
  return (
    <aside className="client-portal-sidebar" aria-label="Modulos del portal">
      <div className="client-sidebar-kicker">Modulos</div>
      {MODULE_GROUPS.map((group) => (
        <section key={group.title} className="client-module-group">
          <div className="client-module-group-title">{group.title}</div>
          <div className="client-module-list">
            {group.items.map(([id, label]) => {
              const count = moduleCounter(data, id);
              return (
                <button
                  key={id}
                  type="button"
                  className={`client-module-button${id === activeModule ? " active" : ""}`}
                  onClick={() => onChange(id)}
                >
                  <span className="client-module-badge"><Icon name={MODULE_ICONS[id] || "dashboard"} size={16} /></span>
                  <span className="client-module-label">{label}</span>
                  {count !== null ? <span className="client-module-count">{count}</span> : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </aside>
  );
}

function ContaraeSignature() {
  return (
    <footer className="client-contarae-signature">
      <img src="/logo192.png" alt="CONTARAE" />
      <span>
        Sistema de gestion propiedad de <strong>CONTARAE</strong> ·{" "}
        <a href="https://www.contarae.com" target="_blank" rel="noreferrer">www.contarae.com</a>
      </span>
    </footer>
  );
}

const REQUIRED_CUSTOMER_FIELDS = [
  ["documentNumber", "numero de documento"],
  ["phone", "celular"],
  ["city", "ciudad"],
  ["department", "departamento"]
];

function missingCustomerFields(customer = {}) {
  return REQUIRED_CUSTOMER_FIELDS
    .filter(([field]) => !clean(customer[field]))
    .map(([, label]) => label);
}

function customerNeedsUpdate(customer = {}) {
  if (!customer?.id) return true;
  return clean(customer.dataStatus) !== "actualizado" || missingCustomerFields(customer).length > 0;
}

function isValidCustomerPhone(customer = {}) {
  return onlyDigits(customer.phone).slice(-10).length >= 10;
}

function printableDocument(type, record, data = {}) {
  const company = data.company || {};
  const customer = customerById(data, record.customerId) || {};
  const isOrder = type === "order";
  const title = isOrder ? "ORDEN DE COMPRA / COTIZACION" : "FACTURA";
  const rows = (record.lines || []).length
    ? record.lines.map((line, index) => {
      const quantity = Number(line.quantity || 0) || 1;
      const unitPrice = Number(line.unitPrice || 0);
      const discount = Number(line.discount || 0);
      const taxableBase = Math.max((quantity * unitPrice) - discount, 0);
      const tax = line.taxable ? taxableBase * (Number(line.taxRate || 0) / 100) : 0;
      const total = taxableBase + tax;
      return `<tr>
        <td>${index + 1}</td>
        <td>${xmlEscape(line.concept || line.sku || "Concepto")}</td>
        <td>${quantity}</td>
        <td>${money(unitPrice)}</td>
        <td>${money(discount)}</td>
        <td>${line.taxable ? `${Number(line.taxRate || 0)}%` : "No"}</td>
        <td>${money(total)}</td>
      </tr>`;
    }).join("")
    : [
      ["Subtotal sin IVA", record.summaryBreakdown?.subtotalNoTax || 0, "No"],
      ["Subtotal exento / IVA 0%", record.summaryBreakdown?.subtotalExempt || 0, "0%"],
      ["Subtotal gravado IVA 5%", record.summaryBreakdown?.subtotalTax5 || 0, "5%"],
      ["Subtotal gravado IVA 19%", record.summaryBreakdown?.subtotalTax19 || 0, "19%"],
      ["Anticipos / saldos a favor", record.summaryBreakdown?.advanceCredit || 0, "Resta"]
    ].filter(([, value]) => Number(value || 0) > 0).map(([concept, value, tax], index) => `<tr><td>${index + 1}</td><td>${xmlEscape(concept)}</td><td>1</td><td>${money(value)}</td><td>$ 0</td><td>${tax}</td><td>${tax === "Resta" ? `-${money(value)}` : money(value)}</td></tr>`).join("") || `<tr><td>1</td><td>Cargue inicial / factura resumida</td><td>1</td><td>${money(record.total)}</td><td>$ 0</td><td>No</td><td>${money(record.total)}</td></tr>`;
  const logo = company.logoDataUrl ? `<img src="${company.logoDataUrl}" alt="Logo" class="logo" />` : "";
  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>${xmlEscape(title)} ${xmlEscape(record.id || "")}</title>
<style>
  body{font-family:Arial,sans-serif;color:#0f172a;margin:36px}
  .top{display:flex;justify-content:space-between;gap:24px;align-items:flex-start;border-bottom:3px solid #1D4ED8;padding-bottom:18px}
  .logo{max-height:76px;max-width:220px;object-fit:contain}
  h1{margin:0;color:#0B1D3A;font-size:28px}
  .muted{color:#64748b;font-size:13px;line-height:1.55}
  .box{border:1px solid #dbeafe;border-radius:14px;padding:14px;margin-top:18px}
  table{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
  th{background:#0B1D3A;color:#fff;text-align:left;padding:10px}
  td{border-bottom:1px solid #e2e8f0;padding:10px;vertical-align:top}
  .totals{margin-left:auto;width:310px;margin-top:18px}
  .totals div{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e2e8f0}
  .grand{font-weight:800;color:#1D4ED8;font-size:18px}
  @media print{button{display:none} body{margin:24px}}
</style>
</head>
<body>
  <button onclick="window.print()" style="padding:10px 14px;border:0;border-radius:10px;background:#1D4ED8;color:#fff;font-weight:700;margin-bottom:18px">Imprimir / guardar PDF</button>
  <section class="top">
    <div>${logo}<h1>${title}</h1><div class="muted">${xmlEscape(record.id || "")} · Fecha: ${xmlEscape(record.date || "")} · Vence: ${xmlEscape(record.dueDate || "Sin vencimiento")}${record.orderNumber ? ` · OC: ${xmlEscape(record.orderNumber)}` : ""}${record.internalConsecutive ? ` · Interno: ${xmlEscape(record.internalConsecutive)}` : ""}</div></div>
    <div class="muted"><strong>${xmlEscape(company.name || "Empresa")}</strong><br/>${xmlEscape(company.nit || "")}<br/>${xmlEscape(company.phone || "")}<br/>${xmlEscape(company.email || "")}</div>
  </section>
  <section class="box">
    <strong>Cliente</strong><br/>
    ${xmlEscape(customer.name || record.customerNameSnapshot || "")}<br/>
    <span class="muted">ID: ${xmlEscape(record.customerId || "")} · Documento: ${xmlEscape(customer.documentNumber || "Por asignar")} · Tel: ${xmlEscape(customer.phone || "")}</span>
  </section>
  <table>
    <thead><tr><th>#</th><th>Concepto</th><th>Cant.</th><th>Valor unitario</th><th>Descuento</th><th>IVA</th><th>Total</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <section class="totals">
    <div><span>Subtotal</span><strong>${money(record.subtotal || record.total)}</strong></div>
    <div><span>Descuentos</span><strong>${money(record.discountTotal)}</strong></div>
    <div><span>IVA</span><strong>${money(record.taxTotal)}</strong></div>
    <div class="grand"><span>Total</span><strong>${money(record.total)}</strong></div>
  </section>
  ${record.notes ? `<section class="box"><strong>Notas</strong><p>${xmlEscape(record.notes)}</p></section>` : ""}
</body>
</html>`;
  const win = window.open("", "_blank");
  if (!win) {
    window.alert("El navegador bloqueo la ventana del documento. Permite ventanas emergentes para descargarlo.");
    return;
  }
  win.opener = null;
  win.document.write(html);
  win.document.close();
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 11, letterSpacing: "1.2px", color: "#64748B", fontWeight: 900, fontFamily: F }}>{label}</span>
      {children}
    </label>
  );
}

function MiniBarChart({ values = [], tone = "#1D4ED8" }) {
  const safeValues = values.map((value) => Math.abs(Number(value) || 0));
  const max = Math.max(...safeValues, 1);
  return (
    <div className="client-stat-bars" aria-hidden="true">
      {safeValues.map((value, index) => (
        <span
          key={`${value}-${index}`}
          style={{
            height: `${Math.max(10, Math.round((value / max) * 100))}%`,
            background: `linear-gradient(180deg, ${tone}, rgba(37,99,235,.20))`
          }}
        />
      ))}
    </div>
  );
}

function Stat({ label, value, note, tone = "#1D4ED8", icon = "portfolio", sparkline = [], trend = null }) {
  const hasSparkline = Array.isArray(sparkline) && sparkline.length > 0 && sparkline.some((item) => Number(item || 0) !== 0);
  return (
    <div className="client-stat-card" style={{ ...card, padding: 16, borderRadius: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
        <div style={{ fontSize: 10, letterSpacing: "1.2px", color: "#64748B", fontWeight: 900, fontFamily: F }}>{label}</div>
        <span className="client-stat-icon" style={{ color: tone }}><Icon name={icon} size={18} /></span>
      </div>
      <div style={{ fontFamily: F, fontSize: "clamp(18px,2vw,25px)", fontWeight: 950, lineHeight: 1.15, color: tone, marginTop: 8, overflowWrap: "anywhere" }}>{value}</div>
      {trend ? (
        <div className="client-stat-trend">
          <span style={{ color: trend.tone || tone }}>{trend.label}</span>
          <small>{trend.caption}</small>
        </div>
      ) : null}
      {hasSparkline ? <MiniBarChart values={sparkline} tone={tone} /> : null}
      <div style={{ fontFamily: F, fontSize: 12, color: "#52647F", lineHeight: 1.55, marginTop: 7 }}>{note}</div>
    </div>
  );
}

function PortalLoading({ message = "Cargando portal..." }) {
  return (
    <main className="client-loading-screen">
      <style>{`
        .client-loading-screen{
          min-height:100vh;
          display:grid;
          place-items:center;
          padding:24px;
          background:radial-gradient(circle at top left, rgba(37,99,235,.14), transparent 30%), linear-gradient(180deg,#EFF6FF,#F8FBFF);
          font-family:${F};
          color:#0B1D3A;
        }
        .client-loading-card{
          width:min(520px, 100%);
          display:grid;
          gap:16px;
          padding:24px;
          border-radius:24px;
          background:rgba(255,255,255,.94);
          border:1px solid rgba(37,99,235,.12);
          box-shadow:0 22px 50px rgba(15,23,42,.10);
        }
        .client-loading-mark{
          width:54px;
          height:54px;
          display:grid;
          place-items:center;
          border-radius:18px;
          color:#1D4ED8;
          background:#EEF4FF;
        }
        .client-loading-kicker{
          font-size:11px;
          letter-spacing:1.5px;
          color:#1D4ED8;
          font-weight:950;
        }
        .client-loading-card h1{
          margin:4px 0 0;
          font-family:${F};
          font-size:clamp(24px,4vw,34px);
          line-height:1.05;
        }
        .client-loading-card p{
          margin:8px 0 0;
          color:#52647F;
          line-height:1.7;
        }
        .client-loading-bar{
          height:10px;
          overflow:hidden;
          border-radius:999px;
          background:#EAF1FF;
        }
        .client-loading-bar span{
          display:block;
          width:42%;
          height:100%;
          border-radius:999px;
          background:linear-gradient(135deg,#0B1D3A,#2563EB);
          animation:clientLoad 1.1s ease-in-out infinite alternate;
        }
        @keyframes clientLoad{
          from{transform:translateX(-10%)}
          to{transform:translateX(150%)}
        }
      `}</style>
      <section className="client-loading-card">
        <div className="client-loading-mark"><Icon name="portfolio" size={24} /></div>
        <div>
          <div className="client-loading-kicker">PORTAL PARA CLIENTES</div>
          <h1>Preparando informacion</h1>
          <p>{message}</p>
        </div>
        <div className="client-loading-bar" aria-hidden="true"><span /></div>
      </section>
    </main>
  );
}

function PortalModal({ open, title, eyebrow, onClose, children, wide = true }) {
  if (!open) return null;
  return (
    <div className="client-portal-modal-backdrop" onMouseDown={onClose}>
      <section className="client-portal-modal" onMouseDown={(event) => event.stopPropagation()} style={{ maxWidth: wide ? 1180 : 760 }}>
        <div className="client-portal-modal-head">
          <div>
            {eyebrow ? <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>{eyebrow}</div> : null}
            <h2 style={{ margin: "2px 0 0", fontFamily: F, color: "#0B1D3A", fontSize: "clamp(23px,3.2vw,34px)", fontWeight: 950, lineHeight: 1.08, overflowWrap: "anywhere" }}>{title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 46, height: 46, borderRadius: 999, border: "1px solid rgba(37,99,235,.14)", background: "#fff", color: "#0B1D3A", fontWeight: 900, cursor: "pointer" }}>x</button>
        </div>
        <div className="client-portal-modal-body">{children}</div>
      </section>
    </div>
  );
}

function ConfirmModal({ open, title, body, details = [], onCancel, onConfirm, confirmLabel = "Confirmar", busy = false, danger = false }) {
  if (!open) return null;
  return (
    <PortalModal open={open} title={title} eyebrow="CONFIRMACION" onClose={busy ? undefined : onCancel} wide={false}>
      <div style={{ display: "grid", gap: 14 }}>
        <p style={{ margin: 0, fontFamily: F, color: "#52647F", lineHeight: 1.75 }}>{body}</p>
        {details.length ? (
          <div style={{ display: "grid", gap: 8 }}>
            {details.map((item, index) => (
              <div key={index} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: 12, borderRadius: 14, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F }}>
                <span style={{ color: "#64748B" }}>{item.label}</span>
                <strong style={{ color: "#0B1D3A", textAlign: "right" }}>{item.value}</strong>
              </div>
            ))}
          </div>
        ) : null}
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button type="button" disabled={busy} onClick={onCancel} style={{ ...ghostButton, opacity: busy ? .6 : 1 }}>Cancelar</button>
          <button type="button" disabled={busy} onClick={onConfirm} style={{ ...button, background: danger ? "linear-gradient(135deg,#991B1B,#DC2626)" : button.background, opacity: busy ? .65 : 1 }}>{busy ? "Guardando..." : confirmLabel}</button>
        </div>
      </div>
    </PortalModal>
  );
}

function CustomerUpdateRequiredModal({ open, customer, context = "continuar", onCancel, onSave, onUpdated }) {
  const [draft, setDraft] = useState({ id: "", name: "", alternateName: "", documentNumber: "", phone: "", email: "", address: "", city: "", department: "", zone: "", notes: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open || !customer) return;
    setDraft({
      id: customer.id || "",
      name: customer.name || "",
      alternateName: customer.alternateName || "",
      documentNumber: customer.documentNumber || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      department: customer.department || "",
      zone: customer.zone || "",
      notes: customer.notes || ""
    });
  }, [open, customer]);

  if (!open || !customer) return null;

  const missing = missingCustomerFields({ ...customer, ...draft });

  async function submit(event) {
    event.preventDefault();
    const normalizedGeo = resolveCityDepartment(draft.city, draft.department);
    const payload = {
      ...draft,
      name: titleCaseName(draft.name),
      alternateName: titleCaseName(draft.alternateName),
      documentNumber: onlyDigits(draft.documentNumber),
      phone: onlyDigits(draft.phone).slice(-10),
      city: normalizedGeo.city,
      department: normalizedGeo.department,
      geographyStatus: normalizedGeo.geographyStatus,
      updateConfirmed: true,
      _silentSuccess: true
    };
    const requiredMissing = missingCustomerFields(payload);
    if (requiredMissing.length) {
      window.alert(`Para continuar falta actualizar: ${requiredMissing.join(", ")}.`);
      return;
    }
    setBusy(true);
    try {
      await onSave("customer", payload);
      onUpdated?.();
    } catch (err) {
      // El componente principal muestra el error detallado.
    } finally {
      setBusy(false);
    }
  }

  return (
    <PortalModal open={open} title="Actualizar datos del cliente" eyebrow="VALIDACION REQUERIDA" onClose={busy ? undefined : onCancel} wide={false}>
      <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
        <p style={{ margin: 0, color: "#52647F", fontFamily: F, lineHeight: 1.65 }}>
          Antes de {context}, confirma la informacion basica del cliente. Esta alerta se mostrara una sola vez cuando quede actualizado, y volvera a aparecer si faltan datos obligatorios.
        </p>
        {missing.length ? (
          <div style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,.12)", color: "#92400E", fontFamily: F, lineHeight: 1.55 }}>
            Falta actualizar: <strong>{missing.join(", ")}</strong>.
          </div>
        ) : null}
        <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
          <Field label="Nombre completo"><input required style={input} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} onBlur={(event) => setDraft((current) => ({ ...current, name: titleCaseName(event.target.value) }))} /></Field>
          <Field label="Nombre alterno"><input style={input} value={draft.alternateName} onChange={(event) => setDraft((current) => ({ ...current, alternateName: event.target.value }))} onBlur={(event) => setDraft((current) => ({ ...current, alternateName: titleCaseName(event.target.value) }))} /></Field>
          <Field label="Documento"><input required style={input} value={draft.documentNumber} onChange={(event) => setDraft((current) => ({ ...current, documentNumber: onlyDigits(event.target.value) }))} /></Field>
          <Field label="Celular"><input required style={input} value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: onlyDigits(event.target.value).slice(-10) }))} /></Field>
          <Field label="Correo"><input style={input} type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} /></Field>
          <Field label="Ciudad"><input required style={input} value={draft.city} onChange={(event) => {
            const geo = resolveCityDepartment(event.target.value, draft.department);
            setDraft((current) => ({ ...current, city: event.target.value, department: geo.department }));
          }} onBlur={(event) => {
            const geo = resolveCityDepartment(event.target.value, draft.department);
            setDraft((current) => ({ ...current, city: geo.city, department: geo.department }));
          }} /></Field>
          <Field label="Departamento"><input required readOnly style={{ ...input, background: "#F8FBFF" }} value={draft.department} /></Field>
          <Field label="Zona"><input style={input} value={draft.zone} onChange={(event) => setDraft((current) => ({ ...current, zone: event.target.value }))} /></Field>
          <Field label="Direccion"><input style={input} value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} /></Field>
        </div>
        <textarea style={{ ...input, minHeight: 76 }} placeholder="Notas internas del cliente" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
          <button type="button" disabled={busy} onClick={onCancel} style={{ ...ghostButton, opacity: busy ? .6 : 1 }}>Cancelar</button>
          <button type="submit" disabled={busy} style={{ ...button, opacity: busy ? .65 : 1 }}>{busy ? "Guardando..." : "Guardar y continuar"}</button>
        </div>
      </form>
    </PortalModal>
  );
}

function CustomerSearch({ customers = [], selectedId = "", onSelect, title = "Buscar cliente", compact = false }) {
  const [type, setType] = useState("name");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [resultsOpen, setResultsOpen] = useState(false);
  const [previewId, setPreviewId] = useState("");
  const selected = customers.find((customer) => customer.id === selectedId);
  const results = useMemo(() => customerSearchMatches(customers, type, query), [customers, type, query]);
  const preview = results.find((customer) => customer.id === previewId) || results[0];

  useEffect(() => {
    if (resultsOpen) setPreviewId(results[0]?.id || "");
  }, [resultsOpen, results]);

  function search(event) {
    event?.preventDefault();
    setSearched(true);
    const found = customerSearchMatches(customers, type, query);
    if (found.length === 1) {
      onSelect(found[0]);
      setResultsOpen(false);
      return;
    }
    setResultsOpen(found.length > 1);
  }

  return (
    <section style={{ padding: compact ? 14 : 16, borderRadius: 20, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 12 }}>
      <form onSubmit={search} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "minmax(160px,220px) minmax(0,1fr) auto", gap: 10, alignItems: "end" }}>
        <Field label={title}>
          <select style={input} value={type} onChange={(event) => { setType(event.target.value); setSearched(false); }}>
            {CUSTOMER_SEARCH_TYPES.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
          </select>
        </Field>
        <Field label="Criterio">
          <input
            style={input}
            value={query}
            onChange={(event) => { setQuery(event.target.value); setSearched(false); }}
            placeholder={type === "documentNumber" ? "Documento exacto" : type === "id" ? "Ej: C0001" : "Ej: JOSE"}
          />
        </Field>
        <button type="submit" style={button}>Buscar</button>
      </form>
      {selected ? (
        <div style={{ padding: 12, borderRadius: 16, background: "rgba(34,197,94,.10)", color: "#14532D", fontFamily: F, lineHeight: 1.6 }}>
          Cliente seleccionado: <strong>{selected.id} - {selected.name}</strong>
          <button type="button" onClick={() => onSelect(null)} style={{ marginLeft: 10, padding: "6px 9px", borderRadius: 10, border: "1px solid rgba(21,128,61,.18)", background: "#fff", color: "#15803D", fontFamily: F, fontWeight: 900, cursor: "pointer" }}>Quitar</button>
        </div>
      ) : null}
      {searched && !results.length ? (
        <div style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,.10)", color: "#92400E", fontFamily: F, lineHeight: 1.6 }}>
          No se encontraron coincidencias. Revisa el criterio o crea el cliente antes de continuar.
        </div>
      ) : null}
      {searched && results.length > 1 ? (
        <div style={{ padding: 12, borderRadius: 14, background: "rgba(37,99,235,.08)", color: "#1E3A8A", fontFamily: F, lineHeight: 1.55, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <span>Se encontraron {results.length} coincidencias. Selecciona el cliente correcto en la ventana de resultados.</span>
          <button type="button" onClick={() => setResultsOpen(true)} style={ghostButton}>Ver coincidencias</button>
        </div>
      ) : null}
      <PortalModal open={resultsOpen} title={`Coincidencias para "${query}"`} eyebrow="SELECCIONAR CLIENTE" onClose={() => setResultsOpen(false)}>
        <div className="client-customer-picker">
          <div className="client-customer-picker-results" style={{ display: "grid", gap: 8 }}>
            {results.map((customer) => {
              const view = customerBalanceView(customer);
              return (
                <button
                  key={customer.id}
                  type="button"
                  onClick={() => setPreviewId(customer.id)}
                  style={{ textAlign: "left", padding: 12, borderRadius: 14, border: customer.id === preview?.id ? "1px solid rgba(37,99,235,.46)" : "1px solid rgba(37,99,235,.12)", background: customer.id === preview?.id ? "#F8FBFF" : "#fff", cursor: "pointer", fontFamily: F }}
                >
                  <strong>{customer.id} - {customer.name || "Cliente sin nombre"}</strong>
                  <div style={{ marginTop: 4, color: "#64748B", fontSize: 12, lineHeight: 1.45 }}>
                    Alterno: {customer.alternateName || "sin alterno"} · Documento: {customer.documentNumber || "por asignar"}
                  </div>
                  <span style={{ display: "inline-flex", marginTop: 8, padding: "6px 9px", borderRadius: 999, fontSize: 11, fontWeight: 900, ...view.statusStyle }}>{view.label}: {view.value}</span>
                </button>
              );
            })}
          </div>
          {preview ? (
            <div className="client-customer-picker-preview" style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 12, alignSelf: "start" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "1.2px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>VISTA RAPIDA</div>
                <h3 style={{ margin: "4px 0 0", fontFamily: F, color: "#0B1D3A", fontSize: 22, lineHeight: 1.15 }}>{preview.name || "Cliente sin nombre"}</h3>
                <p style={{ margin: "6px 0 0", color: "#64748B", fontFamily: F, lineHeight: 1.5 }}>ID {preview.id} · Documento {preview.documentNumber || "por asignar"}</p>
              </div>
              <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
                <Stat label="FACTURADO" value={preview.billedLabel || money(preview.billed)} note={`${preview.invoicesCount || 0} factura(s).`} />
                <Stat label="ABONADO" value={preview.paidLabel || money(preview.paid)} note={`${preview.paymentsCount || 0} pago(s).`} tone="#15803D" />
                <Stat label={customerBalanceView(preview).label.toUpperCase()} value={customerBalanceView(preview).value} note={customerBalanceView(preview).label === "Saldo a favor" ? "Revisar o compensar." : "Estado de cartera."} tone={customerBalanceView(preview).tone} />
              </div>
              <button type="button" onClick={() => { onSelect(preview); setResultsOpen(false); }} style={button}>Seleccionar cliente</button>
            </div>
          ) : null}
        </div>
      </PortalModal>
    </section>
  );
}

function TotalsBox({ totals, label = "Total documento" }) {
  return (
    <div className="client-portal-totals" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
      <div style={{ padding: 13, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F }}><strong>Subtotal</strong><div>{money(totals.subtotal)}</div></div>
      <div style={{ padding: 13, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F }}><strong>Descuentos</strong><div>{money(totals.discount)}</div></div>
      <div style={{ padding: 13, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F }}><strong>IVA</strong><div>{money(totals.tax)}</div></div>
      <div style={{ padding: 13, borderRadius: 16, background: "linear-gradient(135deg,#0B1D3A,#2563EB)", color: "#fff", fontFamily: F }}><strong>{label}</strong><div style={{ fontSize: 20, fontWeight: 900 }}>{money(totals.total)}</div></div>
    </div>
  );
}

function LineItemsEditor({ lines, setLines, inventory = [], title = "Detalle de productos y conceptos" }) {
  const updateLine = (id, patch) => setLines((current) => current.map((line) => line.id === id ? { ...line, ...patch } : line));
  const addLine = () => setLines((current) => [...current, blankLine()]);
  const removeLine = (id) => setLines((current) => current.length > 1 ? current.filter((line) => line.id !== id) : [blankLine()]);

  const selectInventory = (line, sku) => {
    const item = inventory.find((product) => product.sku === sku);
    if (!item) {
      updateLine(line.id, { sku });
      return;
    }
    updateLine(line.id, {
      sku,
      concept: item.name || line.concept,
      unitPrice: formatCurrencyInput(item.salePrice),
      taxable: Boolean(item.taxable),
      taxRate: Number(item.taxRate || 0)
    });
  };

  return (
    <section style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12, letterSpacing: "1.3px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>{title}</div>
          <p style={{ margin: "4px 0 0", fontFamily: F, color: "#64748B", fontSize: 13 }}>Puedes usar inventario, servicios o conceptos manuales. El sistema permite stock negativo con alerta.</p>
        </div>
        <button type="button" onClick={addLine} style={button}>Agregar línea</button>
      </div>
      <div style={{ display: "grid", gap: 10 }}>
        {lines.map((line, index) => (
          <div key={line.id} className="client-portal-line-grid" style={{ display: "grid", gridTemplateColumns: "minmax(130px,.8fr) minmax(200px,1.5fr) 80px minmax(120px,.7fr) 130px 110px 100px auto", gap: 8, alignItems: "end", padding: 12, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
            <Field label={`Producto ${index + 1}`}>
              <select style={input} value={line.sku} onChange={(event) => selectInventory(line, event.target.value)}>
                <option value="">Manual / servicio</option>
                {inventory.map((item) => <option key={item.sku} value={item.sku}>{item.sku} - {item.name}</option>)}
              </select>
            </Field>
            <Field label="Concepto">
              <input style={input} value={line.concept} onChange={(event) => updateLine(line.id, { concept: event.target.value })} placeholder="Producto, servicio u otro cobro" />
            </Field>
            <Field label="Cant.">
              <input style={input} value={line.quantity} onChange={(event) => updateLine(line.id, { quantity: event.target.value.replace(/[^\d.]/g, "") })} />
            </Field>
            <Field label="Precio">
              <input style={input} value={line.unitPrice} onChange={(event) => updateLine(line.id, { unitPrice: formatCurrencyInput(event.target.value) })} />
            </Field>
            <Field label="Descuento">
              <select style={input} value={line.discountMode === "percent" ? `p:${line.discountPercent}` : "value"} onChange={(event) => {
                if (event.target.value === "value") updateLine(line.id, { discountMode: "value" });
                else updateLine(line.id, { discountMode: "percent", discountPercent: Number(event.target.value.replace("p:", "")) });
              }}>
                <option value="value">Valor manual</option>
                {DISCOUNT_PERCENTS.map((percent) => <option key={percent} value={`p:${percent}`}>{percent}%</option>)}
              </select>
            </Field>
            <Field label="Valor desc.">
              <input disabled={line.discountMode === "percent"} style={{ ...input, background: line.discountMode === "percent" ? "#EEF2FF" : "#fff" }} value={line.discountMode === "percent" ? money(lineDiscountAmount(line)) : line.discount} onChange={(event) => updateLine(line.id, { discount: formatCurrencyInput(event.target.value) })} />
            </Field>
            <Field label="IVA">
              <select style={input} value={line.taxable ? line.taxRate : "no"} onChange={(event) => updateLine(line.id, { taxable: event.target.value !== "no", taxRate: event.target.value === "no" ? 0 : Number(event.target.value) })}>
                <option value="no">No</option>
                {IVA_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}
              </select>
            </Field>
            <button type="button" onClick={() => removeLine(line.id)} style={{ ...button, background: "#fff", color: "#B91C1C", border: "1px solid rgba(220,38,38,.14)", padding: "11px 12px" }}>Quitar</button>
          </div>
        ))}
      </div>
    </section>
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
  const compactMode = Boolean(data.isCompact);
  const [filters, setFilters] = useState({ period: "month", from: "", to: "" });
  const range = periodRange(filters.period, filters.from, filters.to);
  const periodActive = (filters.period || "month") !== "all";
  const previousRange = useMemo(
    () => previousComparableRange(filters.period || "month", range),
    [filters.period, range.from, range.to]
  );
  const activePeriodTitle = periodTitle(filters.period || "month");
  const activePeriodSummary = periodSummary(filters.period || "month", range);
  const dashboardTitle = compactMode ? "Resumen general" : activePeriodTitle;
  const dashboardSummary = compactMode ? "Historico acumulado" : activePeriodSummary;
  const dashboardIntro = compactMode
    ? "Indicadores acumulados del negocio. Para revisar movimientos por fecha, abre Actividad, Facturas, Abonos o Cartera."
    : "Las dos primeras tarjetas comparan contra el periodo anterior equivalente. La cartera se muestra acumulada.";
  const invoicesInPeriod = useMemo(
    () => (data.invoices || []).filter((invoice) => invoice.status !== "anulada" && (!periodActive || dateInRange(invoice.date, range))),
    [data.invoices, periodActive, range.from, range.to]
  );
  const paymentsInPeriod = useMemo(
    () => (data.payments || []).filter((payment) => payment.status !== "anulado" && (!periodActive || dateInRange(payment.date, range))),
    [data.payments, periodActive, range.from, range.to]
  );
  const previousInvoices = useMemo(
    () => previousRange ? (data.invoices || []).filter((invoice) => invoice.status !== "anulada" && dateInRange(invoice.date, previousRange)) : [],
    [data.invoices, previousRange?.from, previousRange?.to]
  );
  const previousPayments = useMemo(
    () => previousRange ? (data.payments || []).filter((payment) => payment.status !== "anulado" && dateInRange(payment.date, previousRange)) : [],
    [data.payments, previousRange?.from, previousRange?.to]
  );
  const billedInPeriod = useMemo(
    () => recordsTotal(invoicesInPeriod, (invoice) => invoice.total),
    [invoicesInPeriod]
  );
  const paidInPeriod = useMemo(
    () => recordsTotal(paymentsInPeriod, (payment) => payment.totalApplied || payment.grossAmount || payment.netReceived),
    [paymentsInPeriod]
  );
  const previousBilled = useMemo(
    () => recordsTotal(previousInvoices, (invoice) => invoice.total),
    [previousInvoices]
  );
  const previousPaid = useMemo(
    () => recordsTotal(previousPayments, (payment) => payment.totalApplied || payment.grossAmount || payment.netReceived),
    [previousPayments]
  );
  const billedSeries = useMemo(
    () => compactMode ? metricSparkline(dashboard.totalBilled, dashboard.invoicesCount) : periodSeries(invoicesInPeriod, range, "date", (invoice) => invoice.total),
    [compactMode, dashboard.totalBilled, dashboard.invoicesCount, invoicesInPeriod, range.from, range.to]
  );
  const paidSeries = useMemo(
    () => compactMode ? metricSparkline(dashboard.totalPaid, dashboard.paymentsCount) : periodSeries(paymentsInPeriod, range, "date", (payment) => payment.totalApplied || payment.grossAmount || payment.netReceived),
    [compactMode, dashboard.totalPaid, dashboard.paymentsCount, paymentsInPeriod, range.from, range.to]
  );
  const pendingTotal = Number(dashboard.pending || 0);
  const overdueTotal = Number(dashboard.overdue || 0);
  const upcomingTotal = Number(dashboard.upcoming || 0);
  const creditTotal = Number(dashboard.unappliedCredit || 0);
  const reviewCases = useMemo(
    () => [...(data.customerSummary || [])]
      .filter((customer) => Number(customer.unappliedCredit || 0) > 0)
      .sort((a, b) => Number(b.unappliedCredit || 0) - Number(a.unappliedCredit || 0)),
    [data.customerSummary]
  );
  const creditSeries = useMemo(
    () => {
      const values = reviewCases.slice(0, 6).map((customer) => Number(customer.unappliedCredit || 0));
      return values.length ? values : metricSparkline(creditTotal, reviewCases.length);
    },
    [reviewCases, creditTotal]
  );
  const agingTotal = useMemo(
    () => AGING_BUCKETS.reduce((sum, [key]) => sum + Number(dashboard.aging?.[key] || 0), 0),
    [dashboard.aging]
  );
  const agingSeries = AGING_BUCKETS.map(([key]) => Number(dashboard.aging?.[key] || 0));
  const overdueSeries = ["overdue0To30", "overdue31To60", "overdue61To90", "overdueOver90"].map((key) => Number(dashboard.aging?.[key] || 0));
  const upcomingSeries = ["dueToday", "upcoming7", "upcoming15", "upcoming30"].map((key) => Number(dashboard.aging?.[key] || 0));
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <section style={{ ...card, display: "grid", gap: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>{compactMode ? "RESUMEN FINANCIERO" : "RANGO DE ANALISIS"}</div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center", marginTop: 6 }}>
              <strong style={{ fontFamily: F, color: "#0B1D3A", fontSize: 20 }}>{dashboardTitle}</strong>
              <span style={{ display: "inline-flex", alignItems: "center", minHeight: 30, padding: "6px 12px", borderRadius: 999, color: "#1D4ED8", background: "#EEF4FF", border: "1px solid rgba(37,99,235,.14)", fontFamily: F, fontSize: 12, fontWeight: 950 }}>{dashboardSummary}</span>
            </div>
            <p style={{ margin: "6px 0 0", fontFamily: F, color: "#64748B" }}>{dashboardIntro}</p>
          </div>
          {compactMode ? (
            <button type="button" onClick={() => setModule("actividad")} style={{ ...button, background: "#fff", color: "#1D4ED8", border: "1px solid rgba(37,99,235,.14)" }}>Ver actividad por periodo</button>
          ) : (
            <PeriodControls filters={filters} setFilters={setFilters} compact />
          )}
        </div>
      </section>
      <div className="client-portal-stats client-dashboard-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        <Stat label="VALOR FACTURADO" value={compactMode ? (dashboard.totalBilledLabel || "$ 0") : money(billedInPeriod)} note={compactMode ? `${dashboard.invoicesCount || 0} factura(s) registradas.` : `${invoicesInPeriod.length} factura(s) en el rango.`} icon="invoice" sparkline={billedSeries} trend={compactMode ? null : metricVariation(billedInPeriod, previousBilled)} />
        <Stat label="VALOR ABONADO" value={compactMode ? (dashboard.totalPaidLabel || "$ 0") : money(paidInPeriod)} note={compactMode ? `${dashboard.paymentsCount || 0} abono(s) registrados.` : `${paymentsInPeriod.length} abono(s) en el rango.`} tone="#15803D" icon="wallet" sparkline={paidSeries} trend={compactMode ? null : metricVariation(paidInPeriod, previousPaid)} />
        <Stat label="SALDO TOTAL PENDIENTE" value={dashboard.pendingLabel || "$ 0"} note="Cartera acumulada por cobrar." tone="#C2410C" icon="portfolio" sparkline={agingSeries} trend={metricShare(overdueTotal, pendingTotal, "vencido")} />
        <Stat label="CARTERA VENCIDA" value={dashboard.overdueLabel || "$ 0"} note={`${dashboard.overdueInvoicesCount || 0} factura(s) con saldo vencido.`} tone="#B91C1C" icon="alert" sparkline={overdueSeries} trend={metricShare(overdueTotal, pendingTotal, "del saldo")} />
        <Stat label="PROXIMA A VENCER" value={dashboard.upcomingLabel || "$ 0"} note={`${dashboard.dueSoonInvoicesCount || 0} factura(s) vencen hoy o en 7 dias.`} tone="#B45309" icon="history" sparkline={upcomingSeries} trend={metricShare(upcomingTotal, pendingTotal, "del saldo")} />
        <Stat label="SALDOS A FAVOR" value={dashboard.unappliedCreditLabel || "$ 0"} note={`${reviewCases.length} cliente(s) con abonos superiores a cartera.`} tone="#6D28D9" icon="gift" sparkline={creditSeries} trend={metricShare(creditTotal, Number(dashboard.totalPaid || 0), "del recaudo")} />
      </div>
      {reviewCases.length ? (
        <section style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#6D28D9", fontWeight: 900, fontFamily: F }}>CASOS DE REVISION</div>
              <h2 style={{ margin: 0, fontFamily: F, fontSize: 22, color: "#0B1D3A", fontWeight: 950 }}>Clientes con saldo a favor</h2>
            </div>
            <button type="button" onClick={() => setModule("cartera")} style={ghostButton}>Revisar cartera</button>
          </div>
          <PaginatedRecordList
            headers={["Cliente", "ID", "Abonado", "Facturado", "Saldo a favor"]}
            rows={reviewCases.map((customer) => [customer.name, customer.id, customer.paidLabel, customer.billedLabel, customer.unappliedCreditLabel])}
            pageSize={8}
          />
        </section>
      ) : null}
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>EDADES DE CARTERA</div>
            <h2 style={{ margin: 0, fontFamily: F, fontSize: 23, fontWeight: 950, color: "#0B1D3A" }}>Distribucion del saldo pendiente</h2>
          </div>
          <button type="button" onClick={() => setModule("cartera")} style={ghostButton}>Analizar cartera</button>
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {AGING_BUCKETS.map(([key, label]) => {
            const value = Number(dashboard.aging?.[key] || 0);
            const width = agingTotal > 0 ? Math.max(4, Math.round((value / agingTotal) * 100)) : 0;
            const isOverdue = key.startsWith("overdue");
            return (
              <div key={key} className="client-aging-row" style={{ display: "grid", gridTemplateColumns: "170px minmax(0,1fr) 110px", gap: 10, alignItems: "center", fontFamily: F }}>
                <strong style={{ color: isOverdue ? "#B91C1C" : "#334155", fontSize: 13 }}>{label}</strong>
                <div style={{ height: 12, borderRadius: 999, background: "#EAF1FF", overflow: "hidden" }}>
                  <div style={{ width: `${width}%`, height: "100%", borderRadius: 999, background: isOverdue ? "linear-gradient(135deg,#B91C1C,#F97316)" : "linear-gradient(135deg,#0B1D3A,#2563EB)" }} />
                </div>
                <span style={{ color: "#0F172A", fontWeight: 900, textAlign: "right" }}>{money(value)}</span>
              </div>
            );
          })}
        </div>
      </section>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>TOP 20 CARTERA</div>
            <h2 style={{ margin: 0, fontFamily: F, fontSize: 23, fontWeight: 950, color: "#0B1D3A" }}>Clientes con mayor saldo</h2>
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

function Activity({ data, onExport }) {
  const [filters, setFilters] = useState({ period: "today", from: "", to: "", dateMode: "createdAt" });
  const [activeSection, setActiveSection] = useState("");
  const [selectedDetail, setSelectedDetail] = useState(null);
  const activity = useMemo(() => activityDataset(data, filters), [data, filters.period, filters.from, filters.to, filters.dateMode]);
  const range = activityRange(filters);
  const periodLabel = periodSummary(filters.period || "today", range);
  const activeInvoices = activity.invoices.filter((invoice) => invoice.status !== "anulada");
  const voidInvoices = activity.invoices.filter((invoice) => invoice.status === "anulada");
  const activePayments = activity.payments.filter((payment) => payment.status !== "anulado");
  const voidPayments = activity.payments.filter((payment) => payment.status === "anulado");
  const activeOrders = activity.orders.filter((order) => order.status !== "anulada");
  const invoiceTotal = recordsTotal(activeInvoices, (invoice) => invoice.total);
  const paymentGrossTotal = recordsTotal(activePayments, (payment) => payment.grossAmount);
  const paymentNetTotal = recordsTotal(activePayments, (payment) => payment.netReceived);
  const retentionDiscountTotal = Math.max(paymentGrossTotal - paymentNetTotal, 0);
  const voidInvoiceTotal = recordsTotal(voidInvoices, (invoice) => invoice.total);
  const voidPaymentGrossTotal = recordsTotal(voidPayments, (payment) => payment.grossAmount);
  const orderTotal = recordsTotal(activeOrders, (order) => order.total);
  const customerActivityIds = new Set([
    ...activity.invoices.map((invoice) => invoice.customerId),
    ...activity.payments.map((payment) => payment.customerId),
    ...activity.orders.map((order) => order.customerId)
  ].map(clean).filter(Boolean));
  const ticketAverage = activeInvoices.length ? Math.round(invoiceTotal / activeInvoices.length) : 0;
  const generatedReceivable = invoiceTotal - paymentGrossTotal;
  const lastInvoiceId = activeInvoices[0]?.id || "-";
  const lastPaymentId = activePayments[0]?.id || "-";

  const sectionMeta = {
    customers: {
      title: "Clientes creados",
      label: "clientes",
      icon: "users",
      count: activity.customers.length,
      totalLabel: `${activity.customers.length} cliente(s)`,
      headers: ["ID", "Cliente", "Documento", "Fecha registro", "Estado", "Acciones"],
      rows: activity.customers.map((customer) => [
        customer.id,
        customer.name || "Cliente reservado",
        customer.documentNumber || "Por asignar",
        clean(customer.createdAt).slice(0, 10) || "-",
        customer.dataStatus || "pendiente",
        <button type="button" onClick={() => setSelectedDetail({ type: "customer", record: customer })} style={ghostButton}>Ver</button>
      ]),
      keys: activity.customers.map((customer) => customer.id)
    },
    invoices: {
      title: "Facturas registradas",
      label: "facturas",
      icon: "invoice",
      count: activity.invoices.length,
      totalLabel: money(invoiceTotal),
      headers: ["ID", "Cliente", "Registro", "Factura", "Total", "Estado", "Acciones"],
      rows: activity.invoices.map((invoice) => [
        invoice.id,
        invoice.customerNameSnapshot || customerById(data, invoice.customerId)?.name || invoice.customerId,
        clean(invoice.createdAt).slice(0, 10) || "-",
        invoice.date || "-",
        money(invoice.total),
        invoice.status || "emitida",
        <button type="button" onClick={() => setSelectedDetail({ type: "invoice", record: invoice })} style={ghostButton}>Ver</button>
      ]),
      keys: activity.invoices.map((invoice) => invoice.id)
    },
    payments: {
      title: "Abonos registrados",
      label: "abonos",
      icon: "wallet",
      count: activity.payments.length,
      totalLabel: money(paymentGrossTotal),
      headers: ["ID", "Cliente", "Registro", "Abono", "Bruto", "Medio", "Acciones"],
      rows: activity.payments.map((payment) => [
        payment.id,
        payment.customerNameSnapshot || customerById(data, payment.customerId)?.name || payment.customerId,
        clean(payment.createdAt).slice(0, 10) || "-",
        payment.date || "-",
        money(payment.grossAmount),
        payment.method || "-",
        <button type="button" onClick={() => setSelectedDetail({ type: "payment", record: payment })} style={ghostButton}>Ver</button>
      ]),
      keys: activity.payments.map((payment) => payment.id)
    },
    orders: {
      title: "Ordenes creadas",
      label: "ordenes",
      icon: "clipboard",
      count: activity.orders.length,
      totalLabel: money(orderTotal),
      headers: ["ID", "Cliente", "Registro", "Orden", "Total", "Estado", "Acciones"],
      rows: activity.orders.map((order) => [
        order.id,
        order.customerNameSnapshot || customerById(data, order.customerId)?.name || order.customerId,
        clean(order.createdAt).slice(0, 10) || "-",
        order.date || "-",
        money(order.total),
        order.status || "borrador",
        <button type="button" onClick={() => setSelectedDetail({ type: "order", record: order })} style={ghostButton}>Ver</button>
      ]),
      keys: activity.orders.map((order) => order.id)
    },
    movements: {
      title: "Movimientos de inventario",
      label: "movimientos",
      icon: "transfer",
      count: activity.movements.length,
      totalLabel: `${activity.movements.length} movimiento(s)`,
      headers: ["ID", "SKU", "Registro", "Movimiento", "Tipo", "Cantidad", "Acciones"],
      rows: activity.movements.map((movement) => [
        movement.id,
        movement.sku,
        clean(movement.createdAt).slice(0, 10) || "-",
        movement.date || "-",
        movement.type || "-",
        movement.quantity || 0,
        <button type="button" onClick={() => setSelectedDetail({ type: "movement", record: movement })} style={ghostButton}>Ver</button>
      ]),
      keys: activity.movements.map((movement) => movement.id)
    }
  };

  const activeMeta = activeSection ? sectionMeta[activeSection] : null;

  function exportActivity(section = "all") {
    const label = section === "all" ? "Actividad del periodo" : sectionMeta[section]?.title || "Actividad";
    onExport("actividad", {
      activity: { filters, section, label },
      activityLabel: `${label} · ${periodLabel}`
    });
  }

  function detailRows(detail) {
    if (!detail?.record) return [];
    const record = detail.record;
    if (detail.type === "customer") {
      return [
        ["ID", record.id],
        ["Cliente", record.name || "Cliente reservado"],
        ["Nombre alterno", record.alternateName || "-"],
        ["Documento", record.documentNumber || "Por asignar"],
        ["Telefono", record.phone || "-"],
        ["Correo", record.email || "-"],
        ["Fecha registro", clean(record.createdAt).slice(0, 10) || "-"],
        ["Estado datos", record.dataStatus || "pendiente"]
      ];
    }
    if (detail.type === "invoice") {
      return [
        ["Factura", record.id],
        ["Cliente", record.customerNameSnapshot || record.customerId],
        ["Fecha registro", clean(record.createdAt).slice(0, 10) || "-"],
        ["Fecha factura", record.date || "-"],
        ["Vencimiento", record.dueDate || "-"],
        ["Orden compra", record.orderNumber || "-"],
        ["Consecutivo interno", record.internalConsecutive || "-"],
        ["Condicion pago", record.paymentCondition || "-"],
        ["Total", money(record.total)],
        ["Estado", record.status || "-"]
      ];
    }
    if (detail.type === "payment") {
      return [
        ["Abono", record.id],
        ["Cliente", record.customerNameSnapshot || record.customerId],
        ["Factura", record.invoiceId || "Global"],
        ["Fecha registro", clean(record.createdAt).slice(0, 10) || "-"],
        ["Fecha abono", record.date || "-"],
        ["Valor bruto", money(record.grossAmount)],
        ["Neto recibido", money(record.netReceived)],
        ["Medio", record.method || "-"],
        ["Referencia", record.reference || "-"],
        ["Estado", record.status || "-"]
      ];
    }
    if (detail.type === "order") {
      return [
        ["Orden", record.id],
        ["Cliente", record.customerNameSnapshot || record.customerId],
        ["Fecha registro", clean(record.createdAt).slice(0, 10) || "-"],
        ["Fecha orden", record.date || "-"],
        ["Vencimiento", record.dueDate || "-"],
        ["Total", money(record.total)],
        ["Estado", record.status || "-"]
      ];
    }
    return [
      ["Movimiento", record.id],
      ["SKU", record.sku],
      ["Producto", record.productNameSnapshot || "-"],
      ["Fecha registro", clean(record.createdAt).slice(0, 10) || "-"],
      ["Fecha movimiento", record.date || "-"],
      ["Tipo", record.type || "-"],
      ["Cantidad", record.quantity || 0],
      ["Efecto", record.effect || 0],
      ["Stock final", record.stockAfter ?? "-"],
      ["Referencia", record.reference || "-"]
    ];
  }

  return (
    <ModuleWithForm title="Actividad del periodo" count={Object.values(sectionMeta).reduce((sum, item) => sum + item.count, 0)} onExport={() => exportActivity("all")}>
      <section style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "1.3px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>REVISION RAPIDA</div>
            <strong style={{ fontFamily: F, color: "#0B1D3A", fontSize: 19 }}>{periodLabel}</strong>
            <p style={{ margin: "4px 0 0", fontFamily: F, color: "#64748B", lineHeight: 1.55 }}>Consulta lo registrado en el periodo y abre solo el listado que quieras revisar.</p>
          </div>
          <Field label="Tipo de fecha">
            <select style={{ ...input, minWidth: 230 }} value={filters.dateMode || "createdAt"} onChange={(event) => setFilters((current) => ({ ...current, dateMode: event.target.value }))}>
              <option value="createdAt">Fecha de registro</option>
              <option value="operation">Fecha del documento / operacion</option>
            </select>
          </Field>
        </div>
        <PeriodControls filters={filters} setFilters={setFilters} compact />
      </section>

      <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12 }}>
        <Stat label="CLIENTES CREADOS" value={activity.customers.length} note="Registros de clientes creados en el periodo." icon="users" />
        <Stat label="FACTURAS REGISTRADAS" value={activity.invoices.length} note={money(invoiceTotal)} icon="invoice" sparkline={activity.invoices.map((invoice) => invoice.total)} />
        <Stat label="ABONOS REGISTRADOS" value={activity.payments.length} note={money(paymentGrossTotal)} tone="#15803D" icon="wallet" sparkline={activity.payments.map((payment) => payment.grossAmount)} />
        <Stat label="TOTAL FACTURADO" value={money(invoiceTotal)} note="Suma de facturas no anuladas del periodo." tone="#C2410C" icon="money" sparkline={activity.invoices.map((invoice) => invoice.total)} />
        <Stat label="TOTAL ABONADO BRUTO" value={money(paymentGrossTotal)} note="Valor recibido antes de retenciones y descuentos." tone="#15803D" icon="wallet" sparkline={activity.payments.map((payment) => payment.grossAmount)} />
        <Stat label="NETO RECIBIDO" value={money(paymentNetTotal)} note="Abonos netos despues de retenciones, descuentos y saldos a favor." tone="#047857" icon="money" sparkline={activity.payments.map((payment) => payment.netReceived)} />
        <Stat label="RETENCIONES / DESCUENTOS" value={money(retentionDiscountTotal)} note="Diferencia entre abonos brutos y netos del periodo." tone="#B45309" icon="alert" />
        <Stat label="CLIENTES CON ACTIVIDAD" value={customerActivityIds.size} note="Clientes con facturas, abonos u ordenes en el periodo." tone="#6D28D9" icon="users" />
        <Stat label="TICKET PROMEDIO" value={money(ticketAverage)} note="Promedio de facturas no anuladas del periodo." tone="#1D4ED8" icon="portfolio" />
        <Stat label="CARTERA GENERADA" value={money(generatedReceivable)} note="Total facturado menos abonos brutos del periodo." tone={generatedReceivable < 0 ? "#15803D" : "#C2410C"} icon="activity" />
        <Stat label="ORDENES CREADAS" value={activity.orders.length} note={money(orderTotal)} tone="#B45309" icon="clipboard" />
        <Stat label="MOVIMIENTOS INVENTARIO" value={activity.movements.length} note="Entradas, salidas y ajustes registrados." tone="#6D28D9" icon="transfer" />
      </div>

      <section style={{ padding: 14, borderRadius: 18, border: "1px solid rgba(37,99,235,.10)", background: "#fff", display: "grid", gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "1.3px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>AUDITORIA RAPIDA</div>
          <p style={{ margin: "4px 0 0", color: "#64748B", fontFamily: F }}>Indicadores para validar anulaciones, continuidad de consecutivos y novedades del periodo.</p>
        </div>
        <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
          <div style={{ padding: 13, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(220,38,38,.12)", fontFamily: F }}>
            <span style={{ fontSize: 10, letterSpacing: "1.1px", color: "#B91C1C", fontWeight: 900 }}>FACTURAS ANULADAS</span>
            <strong style={{ display: "block", marginTop: 6, color: "#0B1D3A" }}>{voidInvoices.length} · {money(voidInvoiceTotal)}</strong>
          </div>
          <div style={{ padding: 13, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(220,38,38,.12)", fontFamily: F }}>
            <span style={{ fontSize: 10, letterSpacing: "1.1px", color: "#B91C1C", fontWeight: 900 }}>ABONOS ANULADOS</span>
            <strong style={{ display: "block", marginTop: 6, color: "#0B1D3A" }}>{voidPayments.length} · {money(voidPaymentGrossTotal)}</strong>
          </div>
          <div style={{ padding: 13, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F }}>
            <span style={{ fontSize: 10, letterSpacing: "1.1px", color: "#1D4ED8", fontWeight: 900 }}>ULTIMA FACTURA</span>
            <strong style={{ display: "block", marginTop: 6, color: "#0B1D3A" }}>{lastInvoiceId}</strong>
          </div>
          <div style={{ padding: 13, borderRadius: 16, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", fontFamily: F }}>
            <span style={{ fontSize: 10, letterSpacing: "1.1px", color: "#1D4ED8", fontWeight: 900 }}>ULTIMO ABONO</span>
            <strong style={{ display: "block", marginTop: 6, color: "#0B1D3A" }}>{lastPaymentId}</strong>
          </div>
        </div>
      </section>

      <section style={{ padding: 14, borderRadius: 18, border: "1px solid rgba(37,99,235,.10)", background: "#fff", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "1.3px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>LISTADOS</div>
            <p style={{ margin: "4px 0 0", color: "#64748B", fontFamily: F }}>Abre cada listado en ventana emergente para revisar sin cargar visualmente el modulo.</p>
          </div>
          <button type="button" onClick={() => exportActivity("all")} style={ghostButton}>Excel del periodo</button>
        </div>
        <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10 }}>
          {Object.entries(sectionMeta).map(([section, item]) => (
            <button key={section} type="button" onClick={() => setActiveSection(section)} style={{ ...ghostButton, minHeight: 78, display: "grid", gap: 6, justifyItems: "start", alignContent: "center" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Icon name={item.icon} size={16} /> {item.title}</span>
              <strong style={{ color: "#0B1D3A", fontSize: 15 }}>{item.totalLabel}</strong>
            </button>
          ))}
        </div>
      </section>

      <PortalModal open={Boolean(activeMeta)} title={activeMeta?.title || ""} eyebrow="ACTIVIDAD DEL PERIODO" onClose={() => setActiveSection("")}>
        {activeMeta ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", fontFamily: F }}>
              <div style={{ color: "#64748B" }}>{activeMeta.count} registro(s) · {periodLabel}</div>
              <button type="button" onClick={() => exportActivity(activeSection)} style={ghostButton}>Descargar este listado</button>
            </div>
            <PaginatedRecordList
              headers={activeMeta.headers}
              rows={activeMeta.rows}
              rowKeys={activeMeta.keys}
              onRowClick={(key) => {
                const index = activeMeta.keys.indexOf(key);
                const sectionRecords = {
                  customers: activity.customers,
                  invoices: activity.invoices,
                  payments: activity.payments,
                  orders: activity.orders,
                  movements: activity.movements
                };
                const typeMap = { customers: "customer", invoices: "invoice", payments: "payment", orders: "order", movements: "movement" };
                const record = sectionRecords[activeSection]?.[index];
                if (record) setSelectedDetail({ type: typeMap[activeSection], record });
              }}
              pageSize={12}
              emptyMessage="No hay registros en este listado para el periodo seleccionado."
            />
          </div>
        ) : null}
      </PortalModal>

      <PortalModal open={Boolean(selectedDetail)} title="Detalle del registro" eyebrow="REVISION" onClose={() => setSelectedDetail(null)} wide={false}>
        <RecordList headers={["Campo", "Valor"]} rows={detailRows(selectedDetail)} />
      </PortalModal>
    </ModuleWithForm>
  );
}

function Customers({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ id: "", name: "", alternateName: "", documentNumber: "", phone: "", email: "", address: "", city: "", department: "", zone: "", notes: "" });
  const [selectedId, setSelectedId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmSave, setConfirmSave] = useState(null);
  const [duplicateMerge, setDuplicateMerge] = useState(null);
  const [busy, setBusy] = useState(false);
  const [listQuery, setListQuery] = useState("");
  const customers = data.customerSummary || [];
  const visibleCustomers = customers.filter((customer) => {
    const q = normalizeText(listQuery);
    return !q || normalizeText(`${customer.id} ${customer.name} ${customer.alternateName} ${customer.documentNumber} ${customer.phone}`).includes(q);
  });

  const blank = () => ({ id: "", name: "", alternateName: "", documentNumber: "", phone: "", email: "", address: "", city: "", department: "", zone: "", notes: "" });

  function edit(customer) {
    if (!customer) return;
    setSelectedId(customer.id || "");
    setDraft({
      id: customer.id || "",
      name: customer.name || "",
      alternateName: customer.alternateName || "",
      documentNumber: customer.documentNumber || "",
      phone: customer.phone || "",
      email: customer.email || "",
      address: customer.address || "",
      city: customer.city || "",
      department: customer.department || "",
      zone: customer.zone || "",
      notes: customer.notes || ""
    });
    setModalOpen(true);
  }

  function openNew() {
    setSelectedId("");
    setDraft(blank());
    setModalOpen(true);
  }

  async function submit(event) {
    event.preventDefault();
    const payload = {
      ...draft,
      name: titleCaseName(draft.name),
      alternateName: titleCaseName(draft.alternateName),
      documentNumber: onlyDigits(draft.documentNumber),
      phone: onlyDigits(draft.phone),
      email: clean(draft.email).toLowerCase(),
      ...resolveCityDepartment(draft.city, draft.department),
      zone: titleCaseName(draft.zone),
      updateConfirmed: true
    };
    const requiredMissing = missingCustomerFields(payload);
    if (requiredMissing.length) {
      window.alert(`Para guardar el cliente falta actualizar: ${requiredMissing.join(", ")}.`);
      return;
    }
    setConfirmSave({
      payload,
      details: [
        { label: "Cliente", value: payload.name || "Sin nombre" },
        { label: "ID", value: payload.id || data.nextCustomerId },
        { label: "Documento", value: payload.documentNumber || "Por asignar" },
        { label: "Ubicacion", value: payload.city ? `${payload.city} - ${payload.department}` : "Sin ciudad" }
      ]
    });
  }

  async function confirmCustomerSave() {
    if (!confirmSave) return;
    setBusy(true);
    try {
      await onSave("customer", confirmSave.payload);
      setConfirmSave(null);
      setSelectedId("");
      setDraft(blank());
      setModalOpen(false);
    } catch (err) {
      if (err.code === "DUPLICATE_CUSTOMER_DOCUMENT" && err.duplicate) {
        setDuplicateMerge({ ...err.duplicate, incoming: confirmSave.payload });
      }
    } finally {
      setBusy(false);
    }
  }

  async function mergeDuplicateCustomer(primaryId) {
    if (!duplicateMerge?.incoming || !primaryId) return;
    setBusy(true);
    try {
      const incomingId = duplicateMerge.incoming.id || data.nextCustomerId;
      const existingIds = (duplicateMerge.candidates || []).map((candidate) => candidate.id).filter(Boolean);
      const secondaryIds = existingIds.filter((id) => id !== primaryId);
      if (incomingId && incomingId !== primaryId) secondaryIds.push(incomingId);
      await onSave("mergeCustomers", {
        primaryId,
        secondaryIds: [...new Set(secondaryIds)],
        documentNumber: duplicateMerge.documentNumber,
        incomingCustomer: {
          ...duplicateMerge.incoming,
          id: primaryId === incomingId ? incomingId : primaryId
        }
      });
      setDuplicateMerge(null);
      setConfirmSave(null);
      setSelectedId("");
      setDraft(blank());
      setModalOpen(false);
    } catch (err) {
      // El mensaje visible lo establece save() en el componente principal.
    } finally {
      setBusy(false);
    }
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
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={openNew} style={button}>Nuevo cliente</button>
            <button type="button" onClick={() => onExport("clientes")} style={ghostButton}>Descargar Excel</button>
          </div>
        </div>
        <CustomerSearch customers={customers} selectedId={selectedId} onSelect={(customer) => customer ? edit(customer) : setSelectedId("")} title="Buscar cliente por ID, nombre, alterno o documento" />
      </section>
      <PortalModal open={modalOpen} title={draft.id ? "Actualizar cliente" : "Crear cliente"} eyebrow={draft.id || data.nextCustomerId} onClose={() => { if (!busy) setModalOpen(false); }} wide={false}>
        <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
          <Field label="ID cliente"><input style={{ ...input, background: "#F8FBFF" }} readOnly value={draft.id || `Automatico: ${data.nextCustomerId}`} /></Field>
          <Field label="Nombre"><input style={input} required value={draft.name} onBlur={() => setDraft((current) => ({ ...current, name: titleCaseName(current.name) }))} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Nombre alterno"><input style={input} value={draft.alternateName} onBlur={() => setDraft((current) => ({ ...current, alternateName: titleCaseName(current.alternateName) }))} onChange={(event) => setDraft((current) => ({ ...current, alternateName: event.target.value }))} /></Field>
          <Field label="Documento"><input required style={input} value={draft.documentNumber} onChange={(event) => setDraft((current) => ({ ...current, documentNumber: onlyDigits(event.target.value) }))} /></Field>
          <Field label="Telefono"><input required style={input} value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: onlyDigits(event.target.value).slice(0, 10) }))} /></Field>
          <Field label="Correo"><input style={input} type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value.toLowerCase() }))} /></Field>
          <Field label="Direccion"><input style={input} value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} /></Field>
          <Field label="Ciudad"><input required style={input} list="client-city-list" value={draft.city} onBlur={() => setDraft((current) => ({ ...current, ...resolveCityDepartment(current.city, current.department) }))} onChange={(event) => {
            const location = resolveCityDepartment(event.target.value, draft.department);
            setDraft((current) => ({ ...current, city: event.target.value, department: location.geographyStatus === "validado" ? location.department : current.department }));
          }} /></Field>
          <Field label="Departamento automatico"><input required style={{ ...input, background: "#F8FBFF" }} readOnly value={draft.department || (draft.city ? "Por validar" : "")} /></Field>
          <Field label="Zona opcional"><input style={input} value={draft.zone} onBlur={() => setDraft((current) => ({ ...current, zone: titleCaseName(current.zone) }))} onChange={(event) => setDraft((current) => ({ ...current, zone: event.target.value }))} /></Field>
          <datalist id="client-city-list">
            {Object.entries(CITY_DEPARTMENT_MAP).map(([key, [city, department]]) => <option key={key} value={city}>{department}</option>)}
          </datalist>
          <textarea className="client-portal-form-wide" style={{ ...input, minHeight: 78, gridColumn: "1/-1" }} placeholder="Notas internas del cliente" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          <div className="client-portal-form-wide" style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={ghostButton}>Cancelar</button>
            <button type="submit" style={button}>{draft.id ? "Guardar cambios" : "Crear cliente"}</button>
          </div>
        </form>
      </PortalModal>
      <ConfirmModal
        open={Boolean(confirmSave)}
        title="Guardar cliente"
        body="Confirma que la informacion del cliente esta correcta. El registro se usara para facturas, abonos, cartera y ordenes."
        details={confirmSave?.details || []}
        busy={busy}
        onCancel={() => setConfirmSave(null)}
        onConfirm={confirmCustomerSave}
        confirmLabel="Guardar cliente"
      />
      <PortalModal open={Boolean(duplicateMerge)} title="Documento duplicado" eyebrow="CONCILIACION" onClose={() => { if (!busy) setDuplicateMerge(null); }} wide={false}>
        <div style={{ display: "grid", gap: 12, fontFamily: F }}>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.7 }}>
            El documento <strong>{duplicateMerge?.documentNumber}</strong> ya esta asociado a otro cliente. Revisa los registros y elige en que ID debe quedar unificada la informacion.
          </p>
          <div style={{ display: "grid", gap: 8 }}>
            {(duplicateMerge?.candidates || []).map((candidate) => (
              <div key={candidate.id} style={{ padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.14)", background: "#F8FBFF", display: "grid", gap: 4 }}>
                <strong>{candidate.id} · {candidate.name}</strong>
                <span style={{ color: "#64748B", fontSize: 13 }}>{candidate.phone || "Sin telefono"} · {candidate.email || "Sin correo"} · Saldo {candidate.balanceLabel || "$ 0"}</span>
              </div>
            ))}
            <div style={{ padding: 12, borderRadius: 16, border: "1px solid rgba(245,158,11,.22)", background: "rgba(245,158,11,.08)", display: "grid", gap: 4 }}>
              <strong>{duplicateMerge?.incoming?.id || data.nextCustomerId} · {duplicateMerge?.incoming?.name}</strong>
              <span style={{ color: "#92400E", fontSize: 13 }}>Datos que intentas guardar ahora.</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button type="button" disabled={busy} onClick={() => setDuplicateMerge(null)} style={ghostButton}>Cancelar</button>
            {(duplicateMerge?.candidates || []).map((candidate) => (
              <button key={candidate.id} type="button" disabled={busy} onClick={() => mergeDuplicateCustomer(candidate.id)} style={button}>Unificar en {candidate.id}</button>
            ))}
            <button type="button" disabled={busy} onClick={() => mergeDuplicateCustomer(duplicateMerge?.incoming?.id || data.nextCustomerId)} style={{ ...button, background: "linear-gradient(135deg,#15803D,#22C55E)" }}>Unificar en nuevo/actual</button>
          </div>
        </div>
      </PortalModal>
      <section style={card}>
        <div style={{ marginBottom: 12 }}>
          <Field label="Filtrar listado de clientes"><input style={input} value={listQuery} placeholder="ID, nombre, documento o telefono" onChange={(event) => setListQuery(event.target.value)} /></Field>
        </div>
        <PaginatedRecordList
          headers={["Cliente", "Facturado", "Pagado", "Saldo", "Accion"]}
          rowKeys={visibleCustomers.map((customer) => customer.id)}
          selectedKey={selectedId}
          onRowClick={(key) => {
            const customer = visibleCustomers.find((item) => item.id === key);
            if (customer) edit(customer);
          }}
          rows={visibleCustomers.map((customer) => [
            <div>
              <strong style={{ fontFamily: F }}>{customer.name || "Cliente reservado pendiente por asignar"}</strong>
              <div style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{customer.id} · {customer.documentNumber || "Documento por asignar"} · {customer.phone || "Celular pendiente"} · {customer.city || "Ciudad pendiente"}{customer.department ? `, ${customer.department}` : ""}</div>
            </div>,
            customer.billedLabel,
            customer.paidLabel,
            <strong style={{ fontFamily: F, color: customer.balance > 0 ? "#C2410C" : "#15803D" }}>{customer.balanceLabel}</strong>,
            <button type="button" onClick={() => edit(customer)} style={{ ...button, padding: "9px 12px" }}>Editar</button>
          ])}
        />
      </section>
    </div>
  );
}

function Invoices({ data, onSave, onExport }) {
  const customers = data.customerSummary || data.customers || [];
  const [mode, setMode] = useState("detallada");
  const [draft, setDraft] = useState({
    id: "",
    customerId: "",
    date: today(),
    dueDate: plusDaysIso(today(), 15),
    total: "",
    status: "emitida",
    notes: "",
    orderNumber: "",
    internalConsecutive: "",
    paymentCondition: "credito",
    summaryBreakdown: blankTotalizedBreakdown(),
    paymentSplits: [blankPaymentSplit(today())]
  });
  const [lines, setLines] = useState([blankLine()]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [customerUpdateRequest, setCustomerUpdateRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "", status: "", sort: "idDesc" });
  const [searched, setSearched] = useState(false);
  const totals = uiLineTotals(lines);
  const summaryTotals = totalizedInvoiceTotals(draft.summaryBreakdown);
  const documentTotal = mode === "detallada" ? totals.total : summaryTotals.total;
  const splitTotal = paymentSplitsTotal(draft.paymentSplits);
  const invoices = data.invoices || [];
  const visibleInvoices = searched ? sortRecords(filterRecordsByQuery(invoices, data, filters), data, filters.sort || "idDesc") : [];

  const reset = () => {
    setDraft({
      id: "",
      customerId: "",
      date: today(),
      dueDate: plusDaysIso(today(), 15),
      total: "",
      status: "emitida",
      notes: "",
      orderNumber: "",
      internalConsecutive: "",
      paymentCondition: "credito",
      summaryBreakdown: blankTotalizedBreakdown(),
      paymentSplits: [blankPaymentSplit(today())]
    });
    setLines([blankLine()]);
    setMode("detallada");
  };

  const openNew = () => {
    reset();
    setModalOpen(true);
  };

  const edit = (invoice) => {
    setSelectedInvoiceId(invoice.id || "");
    setDraft({
      id: invoice.id || "",
      customerId: invoice.customerId || "",
      date: invoice.date || today(),
      dueDate: invoice.dueDate || plusDaysIso(invoice.date || today(), 15),
      total: invoice.lines?.length ? "" : formatCurrencyInput(invoice.total),
      status: invoice.status || "emitida",
      notes: invoice.notes || "",
      orderNumber: invoice.orderNumber || "",
      internalConsecutive: invoice.internalConsecutive || "",
      paymentCondition: invoice.paymentCondition || "credito",
      summaryBreakdown: {
        ...blankTotalizedBreakdown(),
        ...(invoice.summaryBreakdown || {}),
        subtotalNoTax: formatCurrencyInput(invoice.summaryBreakdown?.subtotalNoTax),
        subtotalExempt: formatCurrencyInput(invoice.summaryBreakdown?.subtotalExempt),
        subtotalTax5: formatCurrencyInput(invoice.summaryBreakdown?.subtotalTax5),
        subtotalTax19: formatCurrencyInput(invoice.summaryBreakdown?.subtotalTax19),
        advanceCredit: formatCurrencyInput(invoice.summaryBreakdown?.advanceCredit),
        advanceCreditNote: invoice.summaryBreakdown?.advanceCreditNote || ""
      },
      paymentSplits: [blankPaymentSplit(invoice.date || today())]
    });
    setLines((invoice.lines || []).length ? invoice.lines.map(lineToDraft) : [blankLine()]);
    setMode((invoice.lines || []).length ? "detallada" : "resumida");
    setModalOpen(true);
  };

  const duplicate = (invoice) => {
    edit(invoice);
    setDraft((current) => ({ ...current, id: "", date: today(), status: "emitida", notes: current.notes ? `${current.notes} / Duplicada desde ${invoice.id}` : `Duplicada desde ${invoice.id}` }));
  };

  async function submit(event) {
    event.preventDefault();
    if (!draft.customerId) {
      window.alert("Primero busca y selecciona un cliente.");
      return;
    }
    const payloadLines = mode === "detallada" ? linesForPayload(lines) : [];
    if (mode === "detallada" && !payloadLines.length) {
      window.alert("Agrega al menos una linea de producto, servicio u otro concepto.");
      return;
    }
    if (mode === "resumida" && summaryTotals.total <= 0) {
      window.alert("Ingresa al menos una base valida para calcular la factura resumida.");
      return;
    }
    const normalizedSplits = normalizePaymentSplits(draft.paymentSplits);
    if (draft.paymentCondition !== "credito") {
      if (!normalizedSplits.length) {
        window.alert("Registra al menos un medio de pago para la factura de contado o con abono parcial.");
        return;
      }
      if (splitTotal > documentTotal) {
        window.alert("Los pagos registrados no pueden superar el total de la factura.");
        return;
      }
      if (draft.paymentCondition === "contado" && splitTotal !== documentTotal) {
        window.alert("Para pago de contado, la suma de los medios de pago debe ser igual al total de la factura.");
        return;
      }
      if (draft.paymentCondition === "parcial" && splitTotal >= documentTotal) {
        window.alert("Para pago parcial, la suma pagada debe ser menor al total. Si ya esta totalmente pagada, usa contado.");
        return;
      }
    }
    const missingOptional = [];
    if (!clean(draft.orderNumber)) missingOptional.push("# orden de compra");
    if (!clean(draft.internalConsecutive)) missingOptional.push("consecutivo interno");
    if (missingOptional.length && !window.confirm(`La factura no tiene ${missingOptional.join(" ni ")}. ¿Deseas continuar con el registro sin esos datos?`)) {
      return;
    }
    const payload = {
      ...draft,
      total: mode === "resumida" ? summaryTotals.total : "",
      summaryBreakdown: mode === "resumida" ? draft.summaryBreakdown : null,
      lines: payloadLines,
      paymentSplits: draft.id || draft.paymentCondition === "credito" ? [] : normalizedSplits,
      paymentCondition: draft.paymentCondition
    };
    const customer = customerById(data, draft.customerId);
    if (!customer) {
      window.alert("No fue posible encontrar el cliente seleccionado. Vuelve a buscarlo antes de guardar.");
      return;
    }
    const nextConfirm = {
      type: "save",
      payload,
      title: draft.id ? "Guardar cambios de factura" : "Crear factura",
      body: "Confirma que la factura esta correcta antes de guardarla. Si el backend rechaza la operacion, el formulario conservara lo digitado.",
      details: [
        { label: "Cliente", value: customer?.name || draft.customerId },
        { label: "Total", value: money(documentTotal) },
        { label: "Estado", value: draft.status },
        { label: "Condicion", value: draft.paymentCondition === "contado" ? "Pago de contado" : draft.paymentCondition === "parcial" ? `Abono parcial ${money(splitTotal)}` : "Credito" }
      ]
    };
    if (customerNeedsUpdate(customer)) {
      setCustomerUpdateRequest({ customer, context: "guardar esta factura", nextConfirm });
      return;
    }
    setConfirmAction(nextConfirm);
  }

  function voidInvoice(invoice) {
    setConfirmAction({
      type: "void",
      title: "Anular factura",
      body: `La factura ${invoice.id} quedara marcada como anulada. Si tenia productos de inventario, el sistema registrara la reversion automatica del stock sin borrar historial.`,
      danger: true,
      payload: {
        id: invoice.id,
        customerId: invoice.customerId,
        date: invoice.date,
        dueDate: invoice.dueDate,
        total: (invoice.lines || []).length ? "" : invoice.total,
        orderNumber: invoice.orderNumber || "",
        internalConsecutive: invoice.internalConsecutive || "",
        paymentCondition: invoice.paymentCondition || "credito",
        summaryBreakdown: invoice.summaryBreakdown || null,
        status: "anulada",
        notes: invoice.notes || "Factura anulada desde el portal.",
        lines: invoice.lines || []
      },
      details: [
        { label: "Factura", value: invoice.id },
        { label: "Cliente", value: invoice.customerNameSnapshot },
        { label: "Total", value: invoice.totalLabel || money(invoice.total) }
      ]
    });
  }

  async function runConfirmAction() {
    if (!confirmAction) return;
    setBusy(true);
    try {
      await onSave("invoice", confirmAction.payload);
      if (confirmAction.type === "save") {
        reset();
        setModalOpen(false);
      }
      setConfirmAction(null);
    } catch (err) {
      // El mensaje visible lo establece save() en el componente principal.
    } finally {
      setBusy(false);
    }
  }

  function updatePaymentSplit(id, patch) {
    setDraft((current) => ({
      ...current,
      paymentSplits: (current.paymentSplits || []).map((split) => split.id === id ? { ...split, ...patch } : split)
    }));
  }

  function addPaymentSplit() {
    setDraft((current) => ({ ...current, paymentSplits: [...(current.paymentSplits || []), blankPaymentSplit(current.date)] }));
  }

  function removePaymentSplit(id) {
    setDraft((current) => ({ ...current, paymentSplits: (current.paymentSplits || []).length > 1 ? current.paymentSplits.filter((split) => split.id !== id) : [blankPaymentSplit(current.date)] }));
  }

  return (
    <ModuleWithForm title="Facturas" count={(data.invoices || []).length} onExport={() => onExport("facturas", searched ? { filters } : {})}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748B", fontFamily: F }}>Registra facturas detalladas o cargues iniciales resumidos.</p>
        <button type="button" onClick={openNew} style={button}>Nueva factura</button>
      </div>
      <QueryControls
        filters={filters}
        setFilters={setFilters}
        statusOptions={["emitida", "pagada", "anulada"]}
        onSearch={() => setSearched(true)}
        onClear={() => { setFilters({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "", status: "", sort: "idDesc" }); setSearched(false); }}
        placeholder="Cliente, ID o documento"
        sortOptions={RECORD_SORT_OPTIONS}
      />
      <PortalModal open={modalOpen} title={draft.id ? "Editar factura" : "Nueva factura"} eyebrow={draft.id || "FACTURA"} onClose={() => { if (!busy) setModalOpen(false); }}>
        <CustomerSearch
          customers={customers}
          selectedId={draft.customerId}
          onSelect={(customer) => setDraft((current) => ({ ...current, customerId: customer?.id || "" }))}
          title="Buscar cliente para facturar"
        />
        <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 14 }}>
          <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10 }}>
            <Field label="Tipo de factura">
              <select style={input} value={mode} onChange={(event) => setMode(event.target.value)}>
                <option value="detallada">Detallada por productos/conceptos</option>
                <option value="resumida">Resumida / cargue inicial</option>
              </select>
            </Field>
            <Field label="Estado">
              <select style={input} value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                <option value="emitida">Emitida</option>
                <option value="pagada">Pagada</option>
                <option value="anulada">Anulada</option>
              </select>
            </Field>
            <Field label="Consecutivo"><input style={{ ...input, background: "#F8FBFF" }} readOnly value={draft.id || `Automatico: ${data.nextInvoiceId || "FAC-000001"}`} /></Field>
            <Field label="Fecha"><input required style={input} type="date" value={draft.date} onChange={(event) => setDraft((current) => {
              const oldDefaultDueDate = plusDaysIso(current.date, 15);
              const shouldRefreshDueDate = !current.dueDate || current.dueDate === oldDefaultDueDate;
              return { ...current, date: event.target.value, dueDate: shouldRefreshDueDate ? plusDaysIso(event.target.value, 15) : current.dueDate, paymentSplits: (current.paymentSplits || []).map((split) => ({ ...split, date: split.date || event.target.value })) };
            })} /></Field>
            <Field label="Vencimiento"><input style={input} type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
            <Field label="# orden de compra"><input style={input} value={draft.orderNumber} onChange={(event) => setDraft((current) => ({ ...current, orderNumber: event.target.value }))} placeholder="Opcional" /></Field>
            <Field label="Consecutivo interno"><input style={input} value={draft.internalConsecutive} onChange={(event) => setDraft((current) => ({ ...current, internalConsecutive: event.target.value }))} placeholder="Opcional" /></Field>
            <Field label="Forma de pago">
              <select style={input} value={draft.paymentCondition} onChange={(event) => {
                const nextCondition = event.target.value;
                setDraft((current) => ({
                  ...current,
                  paymentCondition: nextCondition,
                  status: nextCondition === "contado" ? "pagada" : current.status,
                  paymentSplits: nextCondition === "credito" ? current.paymentSplits : (current.paymentSplits || [blankPaymentSplit(current.date)])
                }));
              }}>
                <option value="credito">Credito</option>
                <option value="contado">Pago de contado</option>
                <option value="parcial">Abono parcial y saldo a credito</option>
              </select>
            </Field>
          </div>
          {mode === "detallada" ? (
            <>
              <LineItemsEditor lines={lines} setLines={setLines} inventory={data.inventory || []} title="Detalle de la factura" />
              <TotalsBox totals={totals} label="Total factura" />
              {(data.inventory || []).some((item) => Number(item.stock || 0) < 0) ? (
                <div style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,.10)", color: "#92400E", fontFamily: F }}>
                  Hay productos con inventario negativo. El sistema no bloquea la venta, pero conserva la alerta para revision.
                </div>
              ) : null}
            </>
          ) : (
            <div style={{ display: "grid", gap: 12 }}>
              <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
                {[
                  ["subtotalNoTax", "Subtotal sin IVA"],
                  ["subtotalExempt", "Subtotal exento / IVA 0%"],
                  ["subtotalTax5", "Subtotal gravado IVA 5%"],
                  ["subtotalTax19", "Subtotal gravado IVA 19%"]
                ].map(([field, label]) => (
                  <Field key={field} label={label}>
                    <input style={input} value={draft.summaryBreakdown[field] || ""} onChange={(event) => setDraft((current) => ({ ...current, summaryBreakdown: { ...current.summaryBreakdown, [field]: formatCurrencyInput(event.target.value) } }))} />
                  </Field>
                ))}
                <Field label="IVA 5% calculado"><input readOnly style={{ ...input, background: "#F8FBFF" }} value={money(summaryTotals.iva5)} /></Field>
                <Field label="IVA 19% calculado"><input readOnly style={{ ...input, background: "#F8FBFF" }} value={money(summaryTotals.iva19)} /></Field>
                <Field label="Anticipos / saldo a favor"><input style={input} value={draft.summaryBreakdown.advanceCredit || ""} onChange={(event) => setDraft((current) => ({ ...current, summaryBreakdown: { ...current.summaryBreakdown, advanceCredit: formatCurrencyInput(event.target.value) } }))} /></Field>
                <Field label="Total automatico"><input readOnly style={{ ...input, background: "#F8FBFF", fontWeight: 900, color: "#1D4ED8" }} value={money(summaryTotals.total)} /></Field>
              </div>
              <textarea style={{ ...input, minHeight: 70 }} placeholder="Observacion del anticipo o saldo a favor por devolucion" value={draft.summaryBreakdown.advanceCreditNote || ""} onChange={(event) => setDraft((current) => ({ ...current, summaryBreakdown: { ...current.summaryBreakdown, advanceCreditNote: event.target.value } }))} />
              <div style={{ padding: 13, borderRadius: 16, background: "rgba(37,99,235,.06)", color: "#1D4ED8", fontFamily: F, lineHeight: 1.7 }}>
                Usa esta opcion para cargar facturas historicas sin detalle producto por producto. Los totales quedan formulados y bloqueados.
              </div>
            </div>
          )}
          {draft.paymentCondition !== "credito" ? (
            <section style={{ display: "grid", gap: 10, padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: "1.2px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>PAGO DE LA FACTURA</div>
                  <p style={{ margin: "4px 0 0", color: "#64748B", fontFamily: F, fontSize: 13 }}>Puedes registrar un pago total o parcial, incluso fraccionado por varios medios.</p>
                </div>
                <button type="button" onClick={addPaymentSplit} style={ghostButton}>Agregar medio</button>
              </div>
              {(draft.paymentSplits || []).map((split) => (
                <div key={split.id} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "minmax(140px,1fr) minmax(140px,1fr) minmax(130px,1fr) minmax(160px,1fr) auto", gap: 8, alignItems: "end" }}>
                  <Field label="Valor pagado"><input style={input} value={split.amount} onChange={(event) => updatePaymentSplit(split.id, { amount: formatCurrencyInput(event.target.value) })} /></Field>
                  <Field label="Metodo"><select style={input} value={split.method} onChange={(event) => updatePaymentSplit(split.id, { method: event.target.value })}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></Field>
                  <Field label="Fecha pago"><input type="date" style={input} value={split.date || draft.date} onChange={(event) => updatePaymentSplit(split.id, { date: event.target.value })} /></Field>
                  <Field label="Referencia"><input style={input} value={split.reference || ""} onChange={(event) => updatePaymentSplit(split.id, { reference: event.target.value })} placeholder="Opcional" /></Field>
                  <button type="button" onClick={() => removePaymentSplit(split.id)} style={dangerGhostButton}>Quitar</button>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", fontFamily: F, color: "#0B1D3A" }}>
                <strong>Total factura: {money(documentTotal)}</strong>
                <strong>Pagado ahora: {money(splitTotal)}</strong>
                <strong>Saldo: {money(Math.max(documentTotal - splitTotal, 0))}</strong>
              </div>
            </section>
          ) : null}
          <textarea style={{ ...input, minHeight: 82 }} placeholder="Notas internas, cargue inicial o detalle adicional" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={ghostButton}>Cancelar</button>
            <button type="submit" style={button}>Guardar factura</button>
          </div>
        </form>
      </PortalModal>
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || "Confirmar"}
        body={confirmAction?.body || ""}
        details={confirmAction?.details || []}
        busy={busy}
        danger={Boolean(confirmAction?.danger)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
        confirmLabel={confirmAction?.type === "void" ? "Anular factura" : "Guardar"}
      />
      <CustomerUpdateRequiredModal
        open={Boolean(customerUpdateRequest)}
        customer={customerUpdateRequest?.customer}
        context={customerUpdateRequest?.context}
        onSave={onSave}
        onCancel={() => setCustomerUpdateRequest(null)}
        onUpdated={() => {
          const nextConfirm = customerUpdateRequest?.nextConfirm;
          setCustomerUpdateRequest(null);
          if (nextConfirm) setConfirmAction(nextConfirm);
        }}
      />
      <PortalModal open={Boolean(viewRecord)} title={`Factura ${viewRecord?.id || ""}`} eyebrow="DETALLE" onClose={() => setViewRecord(null)} wide={false}>
        {viewRecord ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <Stat label="TOTAL" value={viewRecord.totalLabel || money(viewRecord.total)} note={`${viewRecord.customerNameSnapshot} · ${viewRecord.status}`} />
            <RecordList
              headers={["#", "Concepto", "Cant.", "Unitario", "IVA"]}
              rows={(viewRecord.lines || []).length
                ? (viewRecord.lines || []).map((line, index) => [index + 1, line.concept || line.sku, line.quantity, money(line.unitPrice), line.taxable ? `${line.taxRate}%` : "No"])
                : [
                  [1, "Subtotal sin IVA", 1, money(viewRecord.summaryBreakdown?.subtotalNoTax || 0), "No"],
                  [2, "Subtotal exento / IVA 0%", 1, money(viewRecord.summaryBreakdown?.subtotalExempt || 0), "0%"],
                  [3, "Subtotal gravado IVA 5%", 1, money(viewRecord.summaryBreakdown?.subtotalTax5 || 0), "5%"],
                  [4, "Subtotal gravado IVA 19%", 1, money(viewRecord.summaryBreakdown?.subtotalTax19 || 0), "19%"],
                  [5, "Anticipos / saldo a favor", 1, money(viewRecord.summaryBreakdown?.advanceCredit || 0), "Resta"]
                ].filter((row) => row[3] !== "$ 0")}
            />
            <div className="client-action-group">
              <button type="button" onClick={() => printableDocument("invoice", viewRecord, data)} style={button}>Imprimir / PDF</button>
              <button type="button" onClick={() => { setViewRecord(null); edit(viewRecord); }} style={ghostButton}>Editar</button>
            </div>
          </div>
        ) : null}
      </PortalModal>
      <PaginatedRecordList rows={visibleInvoices.map((invoice) => [
        <strong style={{ whiteSpace: "nowrap" }}>{invoice.id}</strong>,
        <div style={{ display: "grid", gap: 3 }}>
          <strong style={{ color: "#0F172A" }}>{invoice.customerNameSnapshot}</strong>
          <span style={{ color: "#64748B", fontSize: 11 }}>
            {invoice.orderNumber ? `OC ${invoice.orderNumber}` : "Sin OC"} · {invoice.internalConsecutive ? `Interno ${invoice.internalConsecutive}` : "Sin consecutivo interno"}
          </span>
        </div>,
        invoice.date,
        <strong>{invoice.totalLabel || money(invoice.total)}</strong>,
        <StatusPill tone={invoice.status === "anulada" ? "#B91C1C" : invoice.status === "pagada" ? "#15803D" : "#1D4ED8"}>{invoice.status || "emitida"}</StatusPill>,
        <RecordActions
          primary={[
            { label: "Ver", onClick: () => { setSelectedInvoiceId(invoice.id); setViewRecord(invoice); } },
            { label: "Editar", onClick: () => edit(invoice) }
          ]}
          more={[
            { label: "Duplicar", onClick: () => duplicate(invoice) },
            { label: "PDF", onClick: () => printableDocument("invoice", invoice, data) },
            ...(invoice.status !== "anulada" ? [{ label: "Anular", danger: true, onClick: () => voidInvoice(invoice) }] : [])
          ]}
        />
      ])}
      rowKeys={visibleInvoices.map((invoice) => invoice.id)}
      selectedKey={selectedInvoiceId}
      onRowClick={(key) => {
        const invoice = visibleInvoices.find((item) => item.id === key);
        if (invoice) {
          setSelectedInvoiceId(invoice.id);
          setViewRecord(invoice);
        }
      }}
      headers={["ID", "Cliente", "Fecha", "Total bruto", "Estado", "Acciones"]} emptyMessage={searched ? "No se encontraron facturas con esos filtros." : "Usa los filtros para consultar facturas sin cargar todo el historial."} />
    </ModuleWithForm>
  );
}

function Payments({ data, onSave, onExport }) {
  const customers = data.customerSummary || data.customers || [];
  const blank = () => ({ id: "", customerId: "", invoiceId: "", date: today(), grossAmount: "", retefuente: "", reteica: "", reteiva: "", otherRetentions: "", discountAmount: "", discountConcept: "Comercial", returnCreditAmount: "", returnCreditNote: "", method: "Transferencia bancaria", reference: "", notes: "", status: "aplicado" });
  const [draft, setDraft] = useState(blank());
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [customerUpdateRequest, setCustomerUpdateRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "", status: "", sort: "idDesc" });
  const [searched, setSearched] = useState(false);
  const customerInvoices = (data.invoices || []).filter((invoice) => !draft.customerId || invoice.customerId === draft.customerId);
  const retentionTotal = moneyValue(draft.retefuente) + moneyValue(draft.reteica) + moneyValue(draft.reteiva) + moneyValue(draft.otherRetentions);
  const discountTotal = moneyValue(draft.discountAmount) + moneyValue(draft.returnCreditAmount);
  const calculatedNet = Math.max(moneyValue(draft.grossAmount) - retentionTotal - discountTotal, 0);
  const visiblePayments = searched ? sortRecords(filterRecordsByQuery(data.payments || [], data, filters), data, filters.sort || "idDesc") : [];

  const openNew = () => {
    setDraft(blank());
    setModalOpen(true);
  };

  const edit = (payment) => {
    setSelectedPaymentId(payment.id || "");
    setDraft({
      id: payment.id || "",
      customerId: payment.customerId || "",
      invoiceId: payment.invoiceId || "",
      date: payment.date || today(),
      grossAmount: formatCurrencyInput(payment.grossAmount),
      retefuente: formatCurrencyInput(payment.retentions?.retefuente),
      reteica: formatCurrencyInput(payment.retentions?.reteica),
      reteiva: formatCurrencyInput(payment.retentions?.reteiva),
      otherRetentions: formatCurrencyInput(payment.retentions?.other),
      discountAmount: formatCurrencyInput(payment.discounts?.amount),
      discountConcept: payment.discounts?.concept || "Comercial",
      returnCreditAmount: formatCurrencyInput(payment.returnCredit?.amount),
      returnCreditNote: payment.returnCredit?.note || "",
      method: payment.method || "Transferencia bancaria",
      reference: payment.reference || "",
      notes: payment.notes || "",
      status: payment.status || "aplicado"
    });
    setModalOpen(true);
  };

  const duplicate = (payment) => {
    edit(payment);
    setDraft((current) => ({ ...current, id: "", date: today(), reference: "", notes: current.notes ? `${current.notes} / Duplicado desde ${payment.id}` : `Duplicado desde ${payment.id}` }));
  };

  async function submit(event) {
    event.preventDefault();
    if (!draft.customerId) {
      window.alert("Primero busca y selecciona un cliente.");
      return;
    }
    const customer = customerById(data, draft.customerId);
    if (!customer) {
      window.alert("No fue posible encontrar el cliente seleccionado. Vuelve a buscarlo antes de guardar.");
      return;
    }
    const nextConfirm = {
      type: "save",
      title: draft.id ? "Guardar cambios del abono" : "Registrar abono",
      body: "Confirma el abono antes de guardarlo. Las retenciones y el neto recibido quedaran trazados en cartera.",
      payload: draft,
      details: [
        { label: "Cliente", value: customer?.name || draft.customerId },
        { label: "Valor bruto", value: formatCurrencyInput(draft.grossAmount) },
        { label: "Retenciones", value: money(retentionTotal) },
        { label: "Descuentos / devoluciones", value: money(discountTotal) },
        { label: "Neto recibido", value: money(calculatedNet) },
        { label: "Medio", value: draft.method }
      ]
    };
    if (customerNeedsUpdate(customer)) {
      setCustomerUpdateRequest({ customer, context: "registrar este abono", nextConfirm });
      return;
    }
    setConfirmAction(nextConfirm);
  }

  function voidPayment(payment) {
    setConfirmAction({
      type: "void",
      title: "Anular abono",
      body: `El abono ${payment.id} quedara marcado como anulado y dejara de contar en cartera.`,
      danger: true,
      payload: {
        id: payment.id,
        customerId: payment.customerId,
        invoiceId: payment.invoiceId,
        date: payment.date,
        grossAmount: payment.grossAmount,
        retefuente: payment.retentions?.retefuente,
        reteica: payment.retentions?.reteica,
        reteiva: payment.retentions?.reteiva,
        otherRetentions: payment.retentions?.other,
        discountAmount: payment.discounts?.amount,
        discountConcept: payment.discounts?.concept,
        returnCreditAmount: payment.returnCredit?.amount,
        returnCreditNote: payment.returnCredit?.note,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes || "Abono anulado desde el portal.",
        status: "anulado"
      },
      details: [
        { label: "Abono", value: payment.id },
        { label: "Cliente", value: payment.customerNameSnapshot },
        { label: "Valor", value: money(payment.grossAmount) }
      ]
    });
  }

  async function runConfirmAction() {
    if (!confirmAction) return;
    setBusy(true);
    try {
      await onSave("payment", confirmAction.payload);
      if (confirmAction.type === "save") {
        setDraft(blank());
        setModalOpen(false);
      }
      setConfirmAction(null);
    } catch (err) {
      // El mensaje visible lo establece save() en el componente principal.
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModuleWithForm title="Abonos" count={(data.payments || []).length} onExport={() => onExport("abonos", searched ? { filters } : {})}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748B", fontFamily: F }}>Registra pagos, retenciones y medios de recaudo.</p>
        <button type="button" onClick={openNew} style={button}>Nuevo abono</button>
      </div>
      <QueryControls
        filters={filters}
        setFilters={setFilters}
        statusOptions={["aplicado", "anulado"]}
        onSearch={() => setSearched(true)}
        onClear={() => { setFilters({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "", status: "", sort: "idDesc" }); setSearched(false); }}
        placeholder="Cliente, ID o documento"
        sortOptions={RECORD_SORT_OPTIONS}
      />
      <PortalModal open={modalOpen} title={draft.id ? "Editar abono" : "Nuevo abono"} eyebrow={draft.id || "ABONO"} onClose={() => { if (!busy) setModalOpen(false); }}>
        <CustomerSearch
          customers={customers}
          selectedId={draft.customerId}
          onSelect={(customer) => setDraft((current) => ({ ...current, customerId: customer?.id || "", invoiceId: "" }))}
          title="Buscar cliente del abono"
        />
        <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10, marginTop: 14 }}>
          <Field label="Factura"><select style={input} value={draft.invoiceId} onChange={(event) => setDraft((current) => ({ ...current, invoiceId: event.target.value }))}><option value="">Sin aplicar a factura</option>{customerInvoices.map((invoice) => <option key={invoice.id} value={invoice.id}>{invoice.id} - {invoice.totalLabel || money(invoice.total)}</option>)}</select></Field>
          <Field label="Consecutivo"><input style={{ ...input, background: "#F8FBFF" }} readOnly value={draft.id || `Automatico: ${data.nextPaymentId || "ABO-000001"}`} /></Field>
          <Field label="Fecha"><input required type="date" style={input} value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
          <Field label="Medio"><select style={input} value={draft.method} onChange={(event) => setDraft((current) => ({ ...current, method: event.target.value }))}>{PAYMENT_METHODS.map((method) => <option key={method}>{method}</option>)}</select></Field>
          <Field label="Estado"><select style={input} value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="aplicado">Aplicado</option><option value="anulado">Anulado</option></select></Field>
          {["grossAmount", "retefuente", "reteica", "reteiva", "otherRetentions"].map((field) => (
            <Field key={field} label={{ grossAmount: "Valor bruto", retefuente: "ReteFuente", reteica: "ReteICA", reteiva: "ReteIVA", otherRetentions: "Otras retenciones", netReceived: "Neto recibido" }[field]}>
              <input required={field === "grossAmount"} style={input} value={draft[field]} onChange={(event) => setDraft((current) => ({ ...current, [field]: formatCurrencyInput(event.target.value) }))} />
            </Field>
          ))}
          <Field label="Descuento"><input style={input} value={draft.discountAmount} onChange={(event) => setDraft((current) => ({ ...current, discountAmount: formatCurrencyInput(event.target.value) }))} /></Field>
          <Field label="Concepto descuento">
            <select style={input} value={draft.discountConcept} onChange={(event) => setDraft((current) => ({ ...current, discountConcept: event.target.value }))}>
              {DISCOUNT_CONCEPTS.map((concept) => <option key={concept}>{concept}</option>)}
            </select>
          </Field>
          <Field label="Saldo a favor por devolucion"><input style={input} value={draft.returnCreditAmount} onChange={(event) => setDraft((current) => ({ ...current, returnCreditAmount: formatCurrencyInput(event.target.value) }))} /></Field>
          <Field label="Neto recibido"><input readOnly style={{ ...input, background: "#F8FBFF", fontWeight: 900, color: "#15803D" }} value={money(calculatedNet)} /></Field>
          <Field label="Referencia"><input style={input} value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} /></Field>
          <textarea className="client-portal-form-wide" style={{ ...input, minHeight: 64, gridColumn: "1/-1" }} placeholder="Observacion del saldo a favor por devolucion, si aplica" value={draft.returnCreditNote} onChange={(event) => setDraft((current) => ({ ...current, returnCreditNote: event.target.value }))} />
          <textarea className="client-portal-form-wide" style={{ ...input, minHeight: 78, gridColumn: "1/-1" }} placeholder="Notas internas del abono" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          <div className="client-portal-form-wide" style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={ghostButton}>Cancelar</button>
            <button type="submit" style={button}>Guardar abono</button>
          </div>
        </form>
      </PortalModal>
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || "Confirmar"}
        body={confirmAction?.body || ""}
        details={confirmAction?.details || []}
        busy={busy}
        danger={Boolean(confirmAction?.danger)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
        confirmLabel={confirmAction?.type === "void" ? "Anular abono" : "Guardar"}
      />
      <CustomerUpdateRequiredModal
        open={Boolean(customerUpdateRequest)}
        customer={customerUpdateRequest?.customer}
        context={customerUpdateRequest?.context}
        onSave={onSave}
        onCancel={() => setCustomerUpdateRequest(null)}
        onUpdated={() => {
          const nextConfirm = customerUpdateRequest?.nextConfirm;
          setCustomerUpdateRequest(null);
          if (nextConfirm) setConfirmAction(nextConfirm);
        }}
      />
      <PortalModal open={Boolean(viewRecord)} title={`Abono ${viewRecord?.id || ""}`} eyebrow="DETALLE" onClose={() => setViewRecord(null)} wide={false}>
        {viewRecord ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <Stat label="NETO RECIBIDO" value={money(viewRecord.netReceived)} note={`${viewRecord.customerNameSnapshot} · ${viewRecord.method}`} tone="#15803D" />
            <RecordList headers={["Bruto", "Retenciones", "Descuentos", "Devolucion", "Neto", "Estado"]} rows={[[money(viewRecord.grossAmount), money(viewRecord.retentionTotal), money(viewRecord.discounts?.amount), money(viewRecord.returnCredit?.amount), money(viewRecord.netReceived), viewRecord.status]]} />
            <div className="client-action-group">
              <button type="button" onClick={() => { setViewRecord(null); edit(viewRecord); }} style={ghostButton}>Editar</button>
              {viewRecord.status !== "anulado" ? <button type="button" onClick={() => { setViewRecord(null); voidPayment(viewRecord); }} style={dangerGhostButton}>Anular</button> : null}
            </div>
          </div>
        ) : null}
      </PortalModal>
      <PaginatedRecordList rows={visiblePayments.map((payment) => [
        <strong style={{ whiteSpace: "nowrap" }}>{payment.id}</strong>,
        <div style={{ display: "grid", gap: 3 }}>
          <strong style={{ color: "#0F172A" }}>{payment.customerNameSnapshot}</strong>
          <span style={{ color: "#64748B", fontSize: 11 }}>{payment.invoiceId || "Sin factura"} · {payment.reference ? `Ref. ${payment.reference}` : "Sin referencia"}</span>
        </div>,
        payment.date,
        <strong>{money(payment.grossAmount)}</strong>,
        <span>{payment.method || "Sin medio"}</span>,
        <RecordActions
          primary={[
            { label: "Ver", onClick: () => { setSelectedPaymentId(payment.id); setViewRecord(payment); } },
            { label: "Editar", onClick: () => edit(payment) }
          ]}
          more={[
            { label: "Duplicar", onClick: () => duplicate(payment) },
            ...(payment.status !== "anulado" ? [{ label: "Anular", danger: true, onClick: () => voidPayment(payment) }] : [])
          ]}
        />
      ])}
      rowKeys={visiblePayments.map((payment) => payment.id)}
      selectedKey={selectedPaymentId}
      onRowClick={(key) => {
        const payment = visiblePayments.find((item) => item.id === key);
        if (payment) {
          setSelectedPaymentId(payment.id);
          setViewRecord(payment);
        }
      }}
      headers={["ID", "Cliente", "Fecha", "Valor bruto", "Medio", "Acciones"]} emptyMessage={searched ? "No se encontraron abonos con esos filtros." : "Usa los filtros para consultar abonos sin cargar todo el historial."} />
    </ModuleWithForm>
  );
}

function Portfolio({ data, onExport, onSave }) {
  const [selectedId, setSelectedId] = useState("");
  const [tab, setTab] = useState("consulta");
  const [filters, setFilters] = useState({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "" });
  const [searched, setSearched] = useState(false);
  const [matchesOpen, setMatchesOpen] = useState(false);
  const [modalPreviewId, setModalPreviewId] = useState("");
  const [customerModalId, setCustomerModalId] = useState("");
  const [customerDetailOpen, setCustomerDetailOpen] = useState(false);
  const [whatsappConfirm, setWhatsappConfirm] = useState(null);
  const [customerUpdateRequest, setCustomerUpdateRequest] = useState(null);
  const [copyNotice, setCopyNotice] = useState("");
  const rows = data.customerSummary || [];
  const paymentsByCustomer = useMemo(() => {
    const grouped = new Map();
    (data.payments || []).forEach((payment) => {
      if (payment.status === "anulado") return;
      const key = clean(payment.customerId);
      if (!key) return;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(payment);
    });
    return grouped;
  }, [data.payments]);
  const selected = rows.find((customer) => customer.id === selectedId);
  const selectedView = selected ? customerBalanceView(selected) : null;
  const selectedInvoices = selected?.receivableInvoices || [];
  const selectedPayments = paymentsByCustomer.get(selectedId) || [];
  const reviewRows = [...rows]
    .filter((customer) => Number(customer.unappliedCredit || 0) > 0)
    .sort((a, b) => Number(b.unappliedCredit || 0) - Number(a.unappliedCredit || 0));
  const pendingRows = [...rows]
    .filter((customer) => Number(customer.balance || 0) > 0)
    .sort((a, b) => Number(b.balance || 0) - Number(a.balance || 0));
  const getFilteredRows = (sourceFilters = filters) => rows.filter((customer) => {
    const localRange = periodRange(sourceFilters.period || "all", sourceFilters.from, sourceFilters.to);
    const localPeriodActive = (sourceFilters.period || "all") !== "all";
    const q = normalizeText(sourceFilters.customerQuery);
    const matchesText = !q
      || (sourceFilters.customerSearchType === "id" && normalizeText(customer.id).includes(q))
      || (sourceFilters.customerSearchType === "documentNumber" && isValidDocumentSearch(customer.documentNumber) && onlyDigits(customer.documentNumber) === onlyDigits(sourceFilters.customerQuery))
      || (sourceFilters.customerSearchType === "alternateName" && normalizeText(customer.alternateName).includes(q))
      || ((!sourceFilters.customerSearchType || sourceFilters.customerSearchType === "name") && normalizeText(customer.name).includes(q));
    if (!matchesText) return false;
    if (!localPeriodActive) return true;
    const hasInvoice = (customer.receivableInvoices || []).some((invoice) => dateInRange(invoice.date, localRange) || dateInRange(invoice.dueDate, localRange));
    const hasPayment = (paymentsByCustomer.get(customer.id) || []).some((payment) => dateInRange(payment.date, localRange));
    return hasInvoice || hasPayment;
  });
  const filteredRows = searched ? getFilteredRows(filters) : [];
  const hasTextQuery = Boolean(normalizeText(filters.customerQuery));
  const multipleNamedMatches = hasTextQuery && filteredRows.length > 1;
  const modalPreview = rows.find((customer) => customer.id === modalPreviewId) || filteredRows[0];
  const activeCustomer = rows.find((customer) => customer.id === customerModalId);
  const activeView = activeCustomer ? customerBalanceView(activeCustomer) : null;
  const activeInvoices = activeCustomer?.receivableInvoices || [];
  const activePayments = activeCustomer ? (paymentsByCustomer.get(activeCustomer.id) || []) : [];

  function handleSearch() {
    const matches = getFilteredRows(filters);
    const hasQuery = Boolean(normalizeText(filters.customerQuery));
    setSearched(true);
    if (hasQuery && matches.length === 1) {
      showCustomerProfile(matches[0]);
      return;
    }
    if (hasQuery && matches.length > 1) {
      setModalPreviewId(matches[0].id);
      setMatchesOpen(true);
    }
  }

  function openCustomer(customer) {
    showCustomerProfile(customer);
    setMatchesOpen(false);
  }

  function showCustomerProfile(customer) {
    if (!customer) return;
    setSelectedId(customer.id);
    setCustomerModalId(customer.id);
    setCustomerDetailOpen(false);
    setMatchesOpen(false);
    setCopyNotice("");
  }

  function requestWhatsapp(customer) {
    if (!isValidCustomerPhone(customer)) {
      setCustomerUpdateRequest({ customer, context: "contactar al cliente por WhatsApp" });
      return;
    }
    const url = customerWhatsappUrl(customer);
    if (!url) return;
    setWhatsappConfirm({ customer, url });
  }

  async function copyCollectionMessage(customer) {
    const message = customerWhatsappMessage(customer);
    try {
      await navigator.clipboard.writeText(message);
      setCopyNotice(Number(customer.balance || 0) > 0 ? "Mensaje de cobro copiado al portapapeles." : "Mensaje de contacto copiado al portapapeles.");
    } catch {
      window.prompt("Copia el mensaje:", message);
    }
  }

  return (
    <ModuleWithForm title="Cartera por cliente" count={rows.length} onExport={() => onExport("cartera")}>
      <div className="client-action-group">
        {[
          ["consulta", "Consulta"],
          ["revision", `Creditos a revisar (${reviewRows.length})`],
          ["pendientes", `Cartera pendiente (${pendingRows.length})`]
        ].map(([id, label]) => (
          <button key={id} type="button" onClick={() => setTab(id)} style={id === tab ? smallButton : ghostButton}>{label}</button>
        ))}
        <button type="button" onClick={() => onExport("cartera_detallada", selected ? { customerId: selected.id, customerName: selected.name } : searched ? { filters } : {})} style={ghostButton}>Reporte cartera detallada</button>
        <button type="button" onClick={() => onExport("detalle_facturas", selected ? { customerId: selected.id, customerName: selected.name } : searched ? { filters } : {})} style={ghostButton}>Detalle productos por factura</button>
      </div>
      {tab === "consulta" ? (
        <>
          <QueryControls
            filters={filters}
            setFilters={setFilters}
            onSearch={handleSearch}
            onClear={() => { setFilters({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "" }); setSearched(false); setMatchesOpen(false); }}
            placeholder="Cliente, ID o documento"
            sortOptions={[]}
          />
          {multipleNamedMatches ? (
            <div style={{ padding: 14, borderRadius: 18, background: "rgba(37,99,235,.08)", color: "#1E3A8A", fontFamily: F, lineHeight: 1.55, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span>Se encontraron {filteredRows.length} coincidencias. Selecciona el cliente correcto para evitar abrir informacion equivocada.</span>
              <button type="button" onClick={() => setMatchesOpen(true)} style={ghostButton}>Ver coincidencias</button>
            </div>
          ) : (
            <PaginatedRecordList
              headers={["Cliente", "Facturado", "Abonado", "Saldo / favor", "Estado", "Accion"]}
              rows={filteredRows.map((customer) => {
                const view = customerBalanceView(customer);
                return [
                  <div><strong>{customer.name}</strong><div style={{ color: "#64748B", fontSize: 12 }}>{customer.id} · {customer.invoicesCount} factura(s)</div></div>,
                  customer.billedLabel,
                  customer.paidLabel,
                  <strong style={{ color: view.tone }}>{view.value}</strong>,
                  <span style={{ display: "inline-flex", padding: "6px 9px", borderRadius: 999, fontSize: 11, fontWeight: 900, ...view.statusStyle }}>{view.label}</span>,
                  <div className="client-action-group">
                    <button type="button" onClick={() => showCustomerProfile(customer)} style={ghostButton}>Ver ficha</button>
                    <button type="button" onClick={() => requestWhatsapp(customer)} style={{ ...smallButton, background: "#25D366" }}>{Number(customer.balance || 0) > 0 ? "Cobrar" : "WhatsApp"}</button>
                  </div>
                ];
              })}
              rowKeys={filteredRows.map((customer) => customer.id)}
              selectedKey={selectedId}
              onRowClick={(key) => {
                const customer = filteredRows.find((item) => item.id === key);
                if (customer) showCustomerProfile(customer);
              }}
              emptyMessage={searched ? "No se encontraron clientes con esos filtros." : "Usa los filtros para consultar cartera sin cargar todos los clientes."}
            />
          )}
        </>
      ) : null}
      {tab === "pendientes" ? (
        <PaginatedRecordList
          headers={["Cliente", "ID", "Facturado", "Abonado", "Saldo pendiente", "Vencido", "Accion"]}
          rows={pendingRows.map((customer) => [
            customer.name,
            customer.id,
            customer.billedLabel,
            customer.paidLabel,
            <strong style={{ color: "#C2410C" }}>{customer.balanceLabel}</strong>,
            customer.overdueLabel || "$ 0",
            <button type="button" onClick={() => showCustomerProfile(customer)} style={ghostButton}>Abrir ficha</button>
          ])}
          rowKeys={pendingRows.map((customer) => customer.id)}
          selectedKey={selectedId}
          onRowClick={(key) => {
            const customer = pendingRows.find((item) => item.id === key);
            if (customer) showCustomerProfile(customer);
          }}
          emptyMessage="No hay clientes con saldo pendiente."
        />
      ) : null}
      {tab === "revision" ? (
        <PaginatedRecordList
          headers={["Cliente", "ID", "Facturado", "Abonado", "Saldo a favor", "Accion"]}
          rows={reviewRows.map((customer) => [
            customer.name,
            customer.id,
            customer.billedLabel,
            customer.paidLabel,
            <strong style={{ color: "#6D28D9" }}>{customer.unappliedCreditLabel}</strong>,
            <button type="button" onClick={() => showCustomerProfile(customer)} style={ghostButton}>Revisar</button>
          ])}
          rowKeys={reviewRows.map((customer) => customer.id)}
          selectedKey={selectedId}
          onRowClick={(key) => {
            const customer = reviewRows.find((item) => item.id === key);
            if (customer) showCustomerProfile(customer);
          }}
          emptyMessage="No hay saldos a favor por revisar."
        />
      ) : null}
      <PortalModal open={matchesOpen} title={`Coincidencias para "${filters.customerQuery}"`} eyebrow="SELECCIONAR CLIENTE" onClose={() => setMatchesOpen(false)}>
        <div className="client-customer-picker">
          <div className="client-customer-picker-results" style={{ display: "grid", gap: 8 }}>
            {filteredRows.map((customer) => {
              const view = customerBalanceView(customer);
              return (
                <button key={customer.id} type="button" onClick={() => showCustomerProfile(customer)} style={{ textAlign: "left", padding: 12, borderRadius: 14, border: "1px solid rgba(37,99,235,.12)", background: "#fff", cursor: "pointer", fontFamily: F }}>
                  <strong>{customer.name || "Cliente sin nombre"}</strong>
                  <div style={{ marginTop: 4, color: "#64748B", fontSize: 12, lineHeight: 1.45 }}>{customer.id} · Documento: {customer.documentNumber || "por asignar"} · {customer.invoicesCount} factura(s)</div>
                  <span style={{ display: "inline-flex", marginTop: 8, padding: "6px 9px", borderRadius: 999, fontSize: 11, fontWeight: 900, ...view.statusStyle }}>{view.label}: {view.value}</span>
                  <div style={{ marginTop: 8, color: "#1D4ED8", fontSize: 12, fontWeight: 900 }}>Abrir ficha del cliente</div>
                </button>
              );
            })}
          </div>
          {modalPreview ? (
            <div className="client-customer-picker-preview" style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 12, alignSelf: "start" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "1.2px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>VISTA RAPIDA</div>
                <h3 style={{ margin: "4px 0 0", fontFamily: F, color: "#0B1D3A", fontSize: 22, lineHeight: 1.15 }}>{modalPreview.name || "Cliente sin nombre"}</h3>
                <p style={{ margin: "6px 0 0", color: "#64748B", fontFamily: F, lineHeight: 1.5 }}>ID {modalPreview.id} · Documento {modalPreview.documentNumber || "por asignar"}</p>
              </div>
              <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 8 }}>
                <Stat label="FACTURADO" value={modalPreview.billedLabel || money(modalPreview.billed)} note={`${modalPreview.invoicesCount || 0} factura(s).`} />
                <Stat label="ABONADO" value={modalPreview.paidLabel || money(modalPreview.paid)} note={`${modalPreview.paymentsCount || 0} pago(s).`} tone="#15803D" />
                <Stat label={customerBalanceView(modalPreview).label.toUpperCase()} value={customerBalanceView(modalPreview).value} note={customerBalanceView(modalPreview).label === "Saldo a favor" ? "Revisar o compensar." : "Estado de cartera."} tone={customerBalanceView(modalPreview).tone} />
              </div>
              <div className="client-action-group">
                <button type="button" onClick={() => showCustomerProfile(modalPreview)} style={button}>Abrir ficha</button>
                <button type="button" onClick={() => requestWhatsapp(modalPreview)} style={{ ...smallButton, background: "#25D366" }}>{Number(modalPreview.balance || 0) > 0 ? "Cobrar por WhatsApp" : "Contactar por WhatsApp"}</button>
              </div>
            </div>
          ) : null}
        </div>
      </PortalModal>
      <PortalModal open={Boolean(activeCustomer)} title={activeCustomer?.name || "Cliente"} eyebrow="FICHA DE CARTERA" onClose={() => { setCustomerModalId(""); setCustomerDetailOpen(false); setCopyNotice(""); }}>
        {activeCustomer && activeView ? (
          <div style={{ display: "grid", gap: 14 }}>
            <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
              <Stat label="FACTURADO" value={activeCustomer.billedLabel || money(activeCustomer.billed)} note={`${activeCustomer.invoicesCount || 0} factura(s) registradas.`} />
              <Stat label="ABONADO" value={activeCustomer.paidLabel || money(activeCustomer.paid)} note={`${activeCustomer.paymentsCount || 0} abono(s) registrados.`} tone="#15803D" />
              <Stat label={activeView.label.toUpperCase()} value={activeView.value} note={activeView.label === "Saldo a favor" ? "Revisar anticipo o compensacion." : "Estado a la fecha."} tone={activeView.tone} />
              <Stat label="VENCIDO" value={activeCustomer.overdueLabel || "$ 0"} note={`${activeCustomer.overdueInvoicesCount || 0} factura(s) vencida(s).`} tone="#B91C1C" />
            </div>
            <section style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 8, fontFamily: F, color: "#52647F", lineHeight: 1.55 }}>
              <strong style={{ color: "#0B1D3A" }}>{activeCustomer.id} · Documento: {activeCustomer.documentNumber || "por asignar"}</strong>
              <span>Telefono: {activeCustomer.phone || "pendiente"} · Correo: {activeCustomer.email || "pendiente"}</span>
              <span>Ciudad: {activeCustomer.city || "pendiente"}{activeCustomer.department ? `, ${activeCustomer.department}` : ""}</span>
            </section>
            {activeView.label === "Saldo a favor" ? (
              <div style={{ padding: 13, borderRadius: 16, background: "rgba(109,40,217,.10)", border: "1px solid rgba(109,40,217,.16)", color: "#4C1D95", fontFamily: F, lineHeight: 1.6 }}>
                Este cliente tiene saldo a favor. Revisa si corresponde a anticipo, pago duplicado, nota credito o compensacion futura antes de hacer un nuevo cobro.
              </div>
            ) : null}
            {copyNotice ? <div style={{ padding: 12, borderRadius: 14, background: "rgba(34,197,94,.10)", color: "#15803D", fontFamily: F, fontWeight: 900 }}>{copyNotice}</div> : null}
            <div className="client-action-group client-sticky-actions">
              <button type="button" onClick={() => requestWhatsapp(activeCustomer)} style={{ ...smallButton, background: "#25D366" }}>{Number(activeCustomer.balance || 0) > 0 ? "Cobrar por WhatsApp" : "Contactar por WhatsApp"}</button>
              <button type="button" onClick={() => copyCollectionMessage(activeCustomer)} style={ghostButton}>{Number(activeCustomer.balance || 0) > 0 ? "Copiar mensaje de cobro" : "Copiar mensaje de contacto"}</button>
              <button type="button" onClick={() => setCustomerDetailOpen((current) => !current)} style={button}>{customerDetailOpen ? "Ocultar detalle" : "Consultar detalles"}</button>
              <button type="button" onClick={() => onExport("cartera_detallada", { customerId: activeCustomer.id, customerName: activeCustomer.name })} style={ghostButton}>Excel cartera detallada</button>
              <button type="button" onClick={() => onExport("detalle_facturas", { customerId: activeCustomer.id, customerName: activeCustomer.name })} style={ghostButton}>Excel productos por factura</button>
            </div>
            {customerDetailOpen ? (
              <section style={{ display: "grid", gap: 12 }}>
                <div style={{ display: "grid", gap: 8 }}>
                  {AGING_BUCKETS.filter(([key]) => Number(activeCustomer.aging?.[key] || 0) > 0).map(([key, label]) => (
                    <div key={key} className="client-aging-row" style={{ display: "grid", gridTemplateColumns: "170px minmax(0,1fr) 110px", gap: 10, alignItems: "center", fontFamily: F, fontSize: 13 }}>
                      <strong style={{ color: key.startsWith("overdue") ? "#B91C1C" : "#334155" }}>{label}</strong>
                      <div style={{ height: 10, borderRadius: 999, background: "#EAF1FF", overflow: "hidden" }}>
                        <div style={{ width: `${Math.min(100, Math.max(8, (Number(activeCustomer.aging?.[key] || 0) / Math.max(Number(activeCustomer.balance || 1), 1)) * 100))}%`, height: "100%", background: key.startsWith("overdue") ? "#DC2626" : "#2563EB" }} />
                      </div>
                      <strong style={{ textAlign: "right" }}>{money(activeCustomer.aging?.[key] || 0)}</strong>
                    </div>
                  ))}
                </div>
                <RecordList rows={activeInvoices.map((invoice) => [invoice.id, invoice.date, invoice.dueDate || "Sin vencimiento", invoice.totalLabel || money(invoice.total), invoice.paidLabel || money(invoice.paid), invoice.balanceLabel || money(invoice.balance), invoice.ageLabel || invoice.status])} headers={["Factura", "Fecha", "Vence", "Total", "Aplicado", "Saldo", "Edad"]} />
                <RecordList rows={activePayments.map((payment) => [payment.id, payment.date, payment.invoiceId || "Global FIFO", money(payment.grossAmount), money(payment.retentionTotal), money(payment.netReceived), payment.method])} headers={["Abono", "Fecha", "Aplicacion", "Bruto", "Retenciones", "Neto", "Medio"]} />
              </section>
            ) : null}
          </div>
        ) : null}
      </PortalModal>
      <ConfirmModal
        open={Boolean(whatsappConfirm)}
        title={Number(whatsappConfirm?.customer?.balance || 0) > 0 ? "Abrir cobro por WhatsApp" : "Abrir WhatsApp"}
        body={Number(whatsappConfirm?.customer?.balance || 0) > 0
          ? "Se abrira WhatsApp con un mensaje formal de cobro para el cliente seleccionado. Revisa el texto antes de enviarlo."
          : "Se abrira WhatsApp con un mensaje formal de contacto para actualizar o confirmar informacion del cliente."}
        details={[
          { label: "Cliente", value: whatsappConfirm?.customer?.name || "" },
          { label: Number(whatsappConfirm?.customer?.balance || 0) > 0 ? "Saldo pendiente" : "Estado", value: Number(whatsappConfirm?.customer?.balance || 0) > 0 ? (whatsappConfirm?.customer?.balanceLabel || money(whatsappConfirm?.customer?.balance)) : customerBalanceView(whatsappConfirm?.customer || {}).label },
          { label: "Telefono", value: whatsappConfirm?.customer?.phone || "" }
        ]}
        onCancel={() => setWhatsappConfirm(null)}
        onConfirm={() => { openExternalUrl(whatsappConfirm?.url || ""); setWhatsappConfirm(null); }}
        confirmLabel="Abrir WhatsApp"
      />
      <CustomerUpdateRequiredModal
        open={Boolean(customerUpdateRequest)}
        customer={customerUpdateRequest?.customer}
        context={customerUpdateRequest?.context}
        onSave={onSave}
        onCancel={() => setCustomerUpdateRequest(null)}
        onUpdated={() => setCustomerUpdateRequest(null)}
      />
    </ModuleWithForm>
  );
}

function Inventory({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ sku: "", name: "", salePrice: "", cost: "", taxable: true, taxRate: 19, status: "activo", notes: "" });
  const [editingSku, setEditingSku] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItem, setViewItem] = useState(null);
  const [selectedSku, setSelectedSku] = useState("");
  const [confirmSave, setConfirmSave] = useState(null);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const visibleItems = (data.inventory || []).filter((item) => {
    const q = normalizeText(query);
    return !q || normalizeText(item.sku).includes(q) || normalizeText(item.name).includes(q) || normalizeText(item.status).includes(q);
  }).sort((left, right) => clean(left.name || left.sku).localeCompare(clean(right.name || right.sku), "es"));
  const reset = () => setDraft({ sku: "", name: "", salePrice: "", cost: "", taxable: true, taxRate: 19, status: "activo", notes: "" });
  const openNew = () => {
    reset();
    setEditingSku(false);
    setModalOpen(true);
  };
  const edit = (item) => {
    setEditingSku(true);
    setSelectedSku(item.sku || "");
    setDraft({
      sku: item.sku || "",
      name: item.name || "",
      salePrice: formatCurrencyInput(item.salePrice),
      cost: formatCurrencyInput(item.cost),
      taxable: Boolean(item.taxable),
      taxRate: Number(item.taxRate || 0),
      status: item.status || "activo",
      notes: item.notes || ""
    });
    setViewItem(null);
    setModalOpen(true);
  };

  async function submit(event) {
    event.preventDefault();
    if (!draft.sku.trim()) {
      window.alert("Ingresa un SKU para identificar el producto o servicio.");
      return;
    }
    setConfirmSave({
      payload: draft,
      details: [
        { label: "Producto", value: draft.name },
        { label: "SKU", value: draft.sku },
        { label: "Precio", value: formatCurrencyInput(draft.salePrice) || "Sin precio" },
        { label: "Costo", value: formatCurrencyInput(draft.cost) || "Sin costo" }
      ]
    });
  }

  async function confirmInventorySave() {
    if (!confirmSave) return;
    setBusy(true);
    try {
      await onSave("inventory", confirmSave.payload);
      setConfirmSave(null);
      reset();
      setModalOpen(false);
    } catch (err) {
      // El mensaje visible lo establece save() en el componente principal.
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModuleWithForm title="Inventario" count={(data.inventory || []).length} onExport={() => onExport("inventario")}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748B", fontFamily: F }}>Administra el maestro de productos y servicios. El stock se controla desde movimientos.</p>
        <button type="button" onClick={openNew} style={button}>Nuevo producto</button>
      </div>
      <section style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)" }}>
        <Field label="Buscar producto por SKU, nombre o estado"><input style={input} value={query} placeholder="Ej: SKU-001" onChange={(event) => setQuery(event.target.value)} /></Field>
      </section>
      <PortalModal open={modalOpen} title={editingSku ? "Editar inventario" : "Nuevo producto o servicio"} eyebrow={editingSku ? draft.sku : "INVENTARIO"} onClose={() => { if (!busy) setModalOpen(false); }} wide={false}>
        <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 10 }}>
          <Field label="SKU"><input required style={{ ...input, background: editingSku ? "#F8FBFF" : "#fff" }} readOnly={editingSku} value={draft.sku} onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value.toUpperCase() }))} /></Field>
          <Field label="Producto / servicio"><input required style={input} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} /></Field>
          <Field label="Precio venta"><input style={input} value={draft.salePrice} onChange={(event) => setDraft((current) => ({ ...current, salePrice: formatCurrencyInput(event.target.value) }))} /></Field>
          <Field label="Costo"><input style={input} value={draft.cost} onChange={(event) => setDraft((current) => ({ ...current, cost: formatCurrencyInput(event.target.value) }))} /></Field>
          <Field label="IVA"><select style={input} value={draft.taxable ? draft.taxRate : "no"} onChange={(event) => setDraft((current) => ({ ...current, taxable: event.target.value !== "no", taxRate: event.target.value === "no" ? 0 : Number(event.target.value) }))}><option value="no">No aplica</option>{IVA_RATES.map((rate) => <option key={rate} value={rate}>{rate}%</option>)}</select></Field>
          <Field label="Estado"><select style={input} value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}><option value="activo">Activo</option><option value="inactivo">Inactivo</option></select></Field>
          <textarea className="client-portal-form-wide" style={{ ...input, minHeight: 74, gridColumn: "1/-1" }} placeholder="Notas del producto o servicio" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          <div className="client-portal-form-wide" style={{ gridColumn: "1/-1", display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={ghostButton}>Cancelar</button>
            <button type="submit" style={button}>Guardar inventario</button>
          </div>
        </form>
      </PortalModal>
      <ConfirmModal
        open={Boolean(confirmSave)}
        title="Guardar inventario"
        body="Confirma la informacion del producto o servicio. Estos valores se usaran al crear ordenes y facturas."
        details={confirmSave?.details || []}
        busy={busy}
        onCancel={() => setConfirmSave(null)}
        onConfirm={confirmInventorySave}
        confirmLabel="Guardar"
      />
      <PortalModal open={Boolean(viewItem)} title={viewItem?.name || "Producto"} eyebrow={viewItem?.sku || "INVENTARIO"} onClose={() => setViewItem(null)} wide={false}>
        {viewItem ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
              <Stat label="STOCK" value={viewItem.stock ?? 0} note={Number(viewItem.stock || 0) < 0 ? "Inventario negativo para revisar." : "Existencia actual."} tone={Number(viewItem.stock || 0) < 0 ? "#B91C1C" : "#15803D"} icon="boxes" />
              <Stat label="PRECIO" value={money(viewItem.salePrice)} note={viewItem.salePrice ? "Precio de venta sugerido." : "Sin precio asignado."} icon="invoice" />
              <Stat label="COSTO" value={money(viewItem.cost)} note={viewItem.cost ? "Costo de referencia." : "Sin costo asignado."} icon="wallet" />
            </div>
            <RecordList
              headers={["Campo", "Valor"]}
              rows={[
                ["SKU", viewItem.sku],
                ["Nombre", viewItem.name],
                ["IVA", viewItem.taxable ? `${viewItem.taxRate || 0}%` : "No aplica"],
                ["Estado", viewItem.status || "activo"],
                ["Notas", viewItem.notes || "Sin notas"]
              ]}
            />
            <div className="client-action-group client-sticky-actions">
              <button type="button" onClick={() => edit(viewItem)} style={button}>Editar producto</button>
              <button type="button" onClick={() => setViewItem(null)} style={ghostButton}>Cerrar</button>
            </div>
          </div>
        ) : null}
      </PortalModal>
      <PaginatedRecordList
        rows={visibleItems.map((item) => [
          item.sku,
          item.name,
          money(item.salePrice),
          money(item.cost),
          item.stock,
          item.stock < 0 ? "Inventario negativo" : item.status || "activo",
          <div className="client-action-group">
            <button type="button" onClick={() => { setSelectedSku(item.sku); setViewItem(item); }} style={ghostButton}>Ver</button>
            <button type="button" onClick={() => edit(item)} style={ghostButton}>Editar</button>
          </div>
        ])}
        rowKeys={visibleItems.map((item) => item.sku)}
        selectedKey={selectedSku}
        onRowClick={(key) => {
          const item = visibleItems.find((candidate) => candidate.sku === key);
          if (item) {
            setSelectedSku(item.sku);
            setViewItem(item);
          }
        }}
        headers={["SKU", "Nombre", "Precio", "Costo", "Stock", "Estado", "Accion"]}
      />
    </ModuleWithForm>
  );
}

function InventoryMovements({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ sku: "", type: "entrada", quantity: "", date: today(), unitCost: "", reference: "", notes: "" });
  const [viewMovement, setViewMovement] = useState(null);
  const [selectedMovementId, setSelectedMovementId] = useState("");
  const [confirmSave, setConfirmSave] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ period: "all", from: "", to: "", sku: "" });
  const range = periodRange(filters.period || "all", filters.from, filters.to);
  const visibleMovements = (data.inventoryMovements || []).filter((movement) => {
    const q = normalizeText(filters.sku);
    if (q && !normalizeText(`${movement.sku} ${movement.productNameSnapshot} ${movement.type} ${movement.reference}`).includes(q)) return false;
    if ((filters.period || "all") !== "all" && !dateInRange(movement.date, range)) return false;
    return true;
  }).sort((left, right) => clean(right.date || right.createdAt).localeCompare(clean(left.date || left.createdAt)) || clean(right.id).localeCompare(clean(left.id), "es"));
  const reset = () => setDraft({ sku: "", type: "entrada", quantity: "", date: today(), unitCost: "", reference: "", notes: "" });
  const product = (data.inventory || []).find((item) => item.sku === draft.sku);

  async function submit(event) {
    event.preventDefault();
    if (!draft.sku) {
      window.alert("Selecciona un SKU.");
      return;
    }
    if ((Number(draft.quantity) || 0) <= 0) {
      window.alert("Ingresa una cantidad mayor a cero.");
      return;
    }
    setConfirmSave({
      payload: draft,
      details: [
        { label: "Producto", value: product ? `${product.sku} - ${product.name}` : draft.sku },
        { label: "Movimiento", value: draft.type },
        { label: "Cantidad", value: draft.quantity },
        { label: "Stock actual", value: product?.stock ?? 0 }
      ]
    });
  }

  async function confirmMovementSave() {
    if (!confirmSave) return;
    setBusy(true);
    try {
      await onSave("inventoryMovement", confirmSave.payload);
      setConfirmSave(null);
      reset();
    } catch (err) {
      // El mensaje visible lo establece save() en el componente principal.
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModuleWithForm title="Movimientos de inventario" count={(data.inventoryMovements || []).length} onExport={() => onExport("movimientos", { filters })}>
      <section style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 10 }}>
        <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(220px,420px)", gap: 10 }}>
          <Field label="Buscar por SKU, producto, tipo o referencia"><input style={input} value={filters.sku} placeholder="Ej: SKU-001" onChange={(event) => setFilters((current) => ({ ...current, sku: event.target.value }))} /></Field>
          <PeriodControls filters={filters} setFilters={setFilters} compact />
        </div>
      </section>
      <form onSubmit={submit} className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
        <Field label="SKU"><select required style={input} value={draft.sku} onChange={(event) => setDraft((current) => ({ ...current, sku: event.target.value }))}><option value="">Seleccionar producto</option>{(data.inventory || []).map((item) => <option key={item.sku} value={item.sku}>{item.sku} - {item.name}</option>)}</select></Field>
        <Field label="Tipo"><select style={input} value={draft.type} onChange={(event) => setDraft((current) => ({ ...current, type: event.target.value }))}><option value="entrada">Entrada</option><option value="salida">Salida</option><option value="ajuste_positivo">Ajuste positivo</option><option value="ajuste_negativo">Ajuste negativo</option></select></Field>
        <Field label="Cantidad"><input required style={input} value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value.replace(/[^\d.]/g, "") }))} /></Field>
        <Field label="Fecha"><input required type="date" style={input} value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
        <Field label="Costo unitario"><input style={input} value={draft.unitCost} onChange={(event) => setDraft((current) => ({ ...current, unitCost: formatCurrencyInput(event.target.value) }))} /></Field>
        <Field label="Referencia"><input style={input} value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} /></Field>
        <textarea className="client-portal-form-wide" style={{ ...input, minHeight: 74, gridColumn: "1/-1" }} placeholder="Notas del movimiento" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
        <div className="client-portal-form-wide" style={{ gridColumn: "1/-1", display: "flex", justifyContent: "flex-end" }}><button type="submit" style={button}>Registrar movimiento</button></div>
      </form>
      <ConfirmModal
        open={Boolean(confirmSave)}
        title="Registrar movimiento"
        body="Confirma el movimiento. El stock del producto se actualizará y quedará trazado en el kardex."
        details={confirmSave?.details || []}
        busy={busy}
        onCancel={() => setConfirmSave(null)}
        onConfirm={confirmMovementSave}
        confirmLabel="Registrar"
      />
      <PortalModal open={Boolean(viewMovement)} title={`Movimiento ${viewMovement?.id || ""}`} eyebrow="KARDEX" onClose={() => setViewMovement(null)} wide={false}>
        {viewMovement ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
              <Stat label="CANTIDAD" value={viewMovement.quantity} note={viewMovement.type || "Movimiento"} icon="transfer" />
              <Stat label="EFECTO" value={viewMovement.effect} note="Impacto en inventario." tone={Number(viewMovement.effect || 0) < 0 ? "#B91C1C" : "#15803D"} icon="boxes" />
              <Stat label="STOCK FINAL" value={viewMovement.stockAfter} note={Number(viewMovement.stockAfter || 0) < 0 ? "Quedo negativo." : "Despues del movimiento."} tone={Number(viewMovement.stockAfter || 0) < 0 ? "#B91C1C" : "#1D4ED8"} icon="portfolio" />
            </div>
            <RecordList
              headers={["Campo", "Valor"]}
              rows={[
                ["Producto", `${viewMovement.sku || ""} · ${viewMovement.productNameSnapshot || ""}`],
                ["Fecha", viewMovement.date || ""],
                ["Referencia", viewMovement.reference || viewMovement.sourceId || "-"],
                ["Costo unitario", money(viewMovement.unitCost)],
                ["Notas", viewMovement.notes || "Sin notas"]
              ]}
            />
          </div>
        ) : null}
      </PortalModal>
      <PaginatedRecordList
        rows={visibleMovements.map((movement) => [
          movement.id,
          movement.date,
          movement.sku,
          movement.type,
          movement.quantity,
          movement.effect,
          movement.stockAfter,
          movement.reference || movement.sourceId || ""
        ])}
        rowKeys={visibleMovements.map((movement) => movement.id)}
        selectedKey={selectedMovementId}
        onRowClick={(key) => {
          const movement = visibleMovements.find((item) => item.id === key);
          if (movement) {
            setSelectedMovementId(movement.id);
            setViewMovement(movement);
          }
        }}
        headers={["ID", "Fecha", "SKU", "Tipo", "Cantidad", "Efecto", "Stock final", "Referencia"]}
      />
    </ModuleWithForm>
  );
}

function Orders({ data, onSave, onExport }) {
  const customers = data.customerSummary || data.customers || [];
  const [draft, setDraft] = useState({ id: "", customerId: "", date: today(), dueDate: "", status: "borrador", showDiscountOnPdf: true, notes: "" });
  const [lines, setLines] = useState([blankLine()]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [customerUpdateRequest, setCustomerUpdateRequest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [filters, setFilters] = useState({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "", status: "", sort: "recent" });
  const [searched, setSearched] = useState(false);
  const totals = uiLineTotals(lines);
  const visibleOrders = searched ? sortRecords(filterRecordsByQuery(data.orders || [], data, filters), data, filters.sort || "recent") : [];
  const reset = () => {
    setDraft({ id: "", customerId: "", date: today(), dueDate: "", status: "borrador", showDiscountOnPdf: true, notes: "" });
    setLines([blankLine()]);
  };

  const openNew = () => {
    reset();
    setModalOpen(true);
  };

  const edit = (order) => {
    setSelectedOrderId(order.id || "");
    setDraft({
      id: order.id || "",
      customerId: order.customerId || "",
      date: order.date || today(),
      dueDate: order.dueDate || "",
      status: order.status || "borrador",
      showDiscountOnPdf: order.showDiscountOnPdf ?? order.showDiscountsOnPdf ?? true,
      notes: order.notes || ""
    });
    setLines((order.lines || []).length ? order.lines.map(lineToDraft) : [blankLine()]);
    setViewRecord(null);
    setModalOpen(true);
  };

  const duplicate = (order) => {
    edit(order);
    setDraft((current) => ({ ...current, id: "", date: today(), status: "borrador", notes: current.notes ? `${current.notes} / Duplicada desde ${order.id}` : `Duplicada desde ${order.id}` }));
  };

  async function submit(event) {
    event.preventDefault();
    if (!draft.customerId) {
      window.alert("Primero busca y selecciona un cliente.");
      return;
    }
    const payloadLines = linesForPayload(lines);
    if (!payloadLines.length) {
      window.alert("Agrega al menos una linea a la orden.");
      return;
    }
    const customer = customerById(data, draft.customerId);
    if (!customer) {
      window.alert("No fue posible encontrar el cliente seleccionado. Vuelve a buscarlo antes de guardar.");
      return;
    }
    const nextConfirm = {
      type: "save",
      title: draft.id ? "Guardar cambios de orden" : "Crear orden / cotizacion",
      body: "Confirma la orden antes de guardarla. Podras convertirla en factura cuando sea aprobada.",
      payload: { ...draft, lines: payloadLines },
      details: [
        { label: "Cliente", value: customer?.name || draft.customerId },
        { label: "Total", value: money(totals.total) },
        { label: "Estado", value: draft.status }
      ]
    };
    if (customerNeedsUpdate(customer)) {
      setCustomerUpdateRequest({ customer, context: "guardar esta orden", nextConfirm });
      return;
    }
    setConfirmAction(nextConfirm);
  }

  async function convert(order) {
    const customer = customerById(data, order.customerId);
    if (!customer) {
      window.alert("No fue posible encontrar el cliente de la orden. Vuelve a cargar los datos antes de convertirla.");
      return;
    }
    const nextConfirm = {
      type: "convert",
      title: "Convertir orden en factura",
      body: `La orden ${order.id} se convertira en factura. Si hay productos asociados, se descontara inventario y se conservara alerta si queda negativo.`,
      payload: { orderId: order.id },
      details: [
        { label: "Orden", value: order.id },
        { label: "Cliente", value: order.customerNameSnapshot },
        { label: "Total", value: order.totalLabel || money(order.total) }
      ]
    };
    if (customerNeedsUpdate(customer)) {
      setCustomerUpdateRequest({ customer, context: "convertir esta orden en factura", nextConfirm });
      return;
    }
    setConfirmAction(nextConfirm);
  }

  function voidOrder(order) {
    setConfirmAction({
      type: "void",
      title: "Anular orden",
      body: `La orden ${order.id} quedara marcada como anulada. No se elimina del historial.`,
      danger: true,
      payload: {
        id: order.id,
        customerId: order.customerId,
        date: order.date,
        dueDate: order.dueDate,
        status: "anulada",
        showDiscountOnPdf: order.showDiscountOnPdf ?? order.showDiscountsOnPdf ?? true,
        notes: order.notes || "Orden anulada desde el portal.",
        lines: order.lines || []
      },
      details: [
        { label: "Orden", value: order.id },
        { label: "Cliente", value: order.customerNameSnapshot },
        { label: "Total", value: order.totalLabel || money(order.total) }
      ]
    });
  }

  async function runConfirmAction() {
    if (!confirmAction) return;
    setBusy(true);
    try {
      if (confirmAction.type === "convert") {
        await onSave("invoiceFromOrder", confirmAction.payload);
      } else {
        await onSave("order", confirmAction.payload);
      }
      if (confirmAction.type === "save") {
        reset();
        setModalOpen(false);
      }
      setConfirmAction(null);
    } catch (err) {
      // El mensaje visible lo establece save() en el componente principal.
    } finally {
      setBusy(false);
    }
  }

  return (
    <ModuleWithForm title="Ordenes / cotizaciones" count={(data.orders || []).length} onExport={() => onExport("ordenes", searched ? { filters } : {})}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748B", fontFamily: F }}>Crea cotizaciones tipo factura y conviertelas cuando el cliente apruebe.</p>
        <button type="button" onClick={openNew} style={button}>Nueva orden</button>
      </div>
      <QueryControls
        filters={filters}
        setFilters={setFilters}
        statusOptions={["borrador", "enviada", "aprobada", "facturada", "anulada"]}
        onSearch={() => setSearched(true)}
        onClear={() => { setFilters({ customerSearchType: "name", customerQuery: "", period: "all", from: "", to: "", status: "", sort: "recent" }); setSearched(false); }}
        placeholder="Cliente, ID o documento"
      />
      <PortalModal open={modalOpen} title={draft.id ? "Editar orden / cotizacion" : "Nueva orden / cotizacion"} eyebrow={draft.id || "ORDEN"} onClose={() => { if (!busy) setModalOpen(false); }}>
        <CustomerSearch
          customers={customers}
          selectedId={draft.customerId}
          onSelect={(customer) => setDraft((current) => ({ ...current, customerId: customer?.id || "" }))}
          title="Buscar cliente para la orden"
        />
        <form onSubmit={submit} style={{ display: "grid", gap: 14, marginTop: 14 }}>
          <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5,minmax(0,1fr))", gap: 10 }}>
            <Field label="Consecutivo"><input style={{ ...input, background: "#F8FBFF" }} readOnly value={draft.id || `Automatico: ${data.nextOrderId || "ORD-000001"}`} /></Field>
            <Field label="Fecha"><input required type="date" style={input} value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
            <Field label="Vencimiento"><input type="date" style={input} value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
            <Field label="Estado">
              <select style={input} value={draft.status} onChange={(event) => setDraft((current) => ({ ...current, status: event.target.value }))}>
                <option value="borrador">Borrador</option>
                <option value="enviada">Enviada</option>
                <option value="aprobada">Aprobada</option>
                <option value="facturada">Facturada</option>
                <option value="anulada">Anulada</option>
              </select>
            </Field>
            <Field label="Descuentos en PDF">
              <select style={input} value={draft.showDiscountOnPdf ? "si" : "no"} onChange={(event) => setDraft((current) => ({ ...current, showDiscountOnPdf: event.target.value === "si" }))}>
                <option value="si">Mostrar descuentos</option>
                <option value="no">No mostrar descuentos</option>
              </select>
            </Field>
          </div>
          <LineItemsEditor lines={lines} setLines={setLines} inventory={data.inventory || []} title="Detalle de la orden o cotizacion" />
          <TotalsBox totals={totals} label="Total orden" />
          <textarea style={{ ...input, minHeight: 82 }} placeholder="Notas, condiciones comerciales o acuerdos" value={draft.notes} onChange={(event) => setDraft((current) => ({ ...current, notes: event.target.value }))} />
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => setModalOpen(false)} style={ghostButton}>Cancelar</button>
            <button type="submit" style={button}>Guardar orden</button>
          </div>
        </form>
      </PortalModal>
      <ConfirmModal
        open={Boolean(confirmAction)}
        title={confirmAction?.title || "Confirmar"}
        body={confirmAction?.body || ""}
        details={confirmAction?.details || []}
        busy={busy}
        danger={Boolean(confirmAction?.danger)}
        onCancel={() => setConfirmAction(null)}
        onConfirm={runConfirmAction}
        confirmLabel={confirmAction?.type === "void" ? "Anular orden" : confirmAction?.type === "convert" ? "Convertir" : "Guardar"}
      />
      <CustomerUpdateRequiredModal
        open={Boolean(customerUpdateRequest)}
        customer={customerUpdateRequest?.customer}
        context={customerUpdateRequest?.context}
        onSave={onSave}
        onCancel={() => setCustomerUpdateRequest(null)}
        onUpdated={() => {
          const nextConfirm = customerUpdateRequest?.nextConfirm;
          setCustomerUpdateRequest(null);
          if (nextConfirm) setConfirmAction(nextConfirm);
        }}
      />
      <PortalModal open={Boolean(viewRecord)} title={`Orden ${viewRecord?.id || ""}`} eyebrow="DETALLE" onClose={() => setViewRecord(null)} wide={false}>
        {viewRecord ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <Stat label="TOTAL" value={viewRecord.totalLabel || money(viewRecord.total)} note={`${viewRecord.customerNameSnapshot} · ${viewRecord.status}`} />
            <RecordList headers={["#", "Concepto", "Cant.", "Unitario", "IVA"]} rows={(viewRecord.lines || []).map((line, index) => [index + 1, line.concept || line.sku, line.quantity, money(line.unitPrice), line.taxable ? `${line.taxRate}%` : "No"])} />
            <div className="client-action-group">
              <button type="button" onClick={() => printableDocument("order", viewRecord, data)} style={button}>Imprimir / PDF</button>
              <button type="button" onClick={() => { setViewRecord(null); edit(viewRecord); }} style={ghostButton}>Editar</button>
            </div>
          </div>
        ) : null}
      </PortalModal>
      <PaginatedRecordList rows={visibleOrders.map((order) => [
        order.id,
        order.customerNameSnapshot,
        order.date,
        money(order.subtotal),
        money(order.taxTotal),
        order.totalLabel || money(order.total),
        order.status,
        <div className="client-action-group">
          <button type="button" onClick={() => { setSelectedOrderId(order.id); setViewRecord(order); }} style={ghostButton}>Ver</button>
          <button type="button" onClick={() => edit(order)} style={ghostButton}>Editar</button>
          <button type="button" onClick={() => duplicate(order)} style={ghostButton}>Duplicar</button>
          <button type="button" onClick={() => printableDocument("order", order, data)} style={ghostButton}>PDF</button>
          {order.status !== "facturada" && order.status !== "anulada" ? <button type="button" onClick={() => convert(order)} style={{ ...smallButton, background: "linear-gradient(135deg,#15803D,#22C55E)" }}>Convertir</button> : null}
          {order.status !== "anulada" && order.status !== "facturada" ? <button type="button" onClick={() => voidOrder(order)} style={dangerGhostButton}>Anular</button> : null}
        </div>
      ])}
      rowKeys={visibleOrders.map((order) => order.id)}
      selectedKey={selectedOrderId}
      onRowClick={(key) => {
        const order = visibleOrders.find((item) => item.id === key);
        if (order) {
          setSelectedOrderId(order.id);
          setViewRecord(order);
        }
      }}
      headers={["ID", "Cliente", "Fecha", "Subtotal", "IVA", "Total", "Estado", "Acciones"]} emptyMessage={searched ? "No se encontraron ordenes con esos filtros." : "Usa los filtros para consultar ordenes sin cargar todo el historial."} />
    </ModuleWithForm>
  );
}

function ModuleWithForm({ title, count, onExport, children }) {
  return (
    <section className="client-module-card" style={{ ...card, borderRadius: 22 }}>
      <div className="client-module-head" style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "1.3px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>MODULO</div>
          <h2 style={{ margin: 0, fontFamily: F, fontSize: "clamp(23px,2.6vw,31px)", fontWeight: 950, color: "#0B1D3A", lineHeight: 1.05 }}>{title}</h2>
          <p style={{ fontFamily: F, color: "#64748B", margin: "5px 0 0", fontSize: 13 }}>{count} registro(s)</p>
        </div>
        {onExport ? <button className="client-module-export" type="button" onClick={onExport} style={button}>Descargar Excel</button> : null}
      </div>
      <div className="client-module-content" style={{ display: "grid", gap: 18 }}>{children}</div>
    </section>
  );
}

function RecordList({ headers, rows, rowKeys = [], selectedKey = "", onRowClick }) {
  return (
    <>
      <div className="client-record-table" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 6px", fontFamily: F, minWidth: 680 }}>
          <thead><tr>{headers.map((header) => <th key={header} style={{ textAlign: "left", fontSize: 10, letterSpacing: ".9px", color: "#64748B", padding: "0 9px 2px" }}>{header}</th>)}</tr></thead>
          <tbody>
            {rows.length ? rows.map((row, index) => {
              const key = rowKeys[index] || index;
              const selected = selectedKey && key === selectedKey;
              return (
                <tr
                  key={key}
                  onClick={onRowClick ? (event) => {
                    if (event.target.closest("button,a,input,select,textarea,details,summary")) return;
                    onRowClick(key, index);
                  } : undefined}
                  className={selected ? "client-record-row selected" : "client-record-row"}
                  style={{ background: selected ? "#EEF4FF" : "#F8FBFF", cursor: onRowClick ? "pointer" : "default" }}
                >
                  {row.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: "9px 10px", borderTop: selected ? "1px solid rgba(37,99,235,.34)" : "1px solid rgba(37,99,235,.10)", borderBottom: selected ? "1px solid rgba(37,99,235,.34)" : "1px solid rgba(37,99,235,.10)", verticalAlign: "middle", fontSize: 13, lineHeight: 1.3 }}>{cell}</td>)}
                </tr>
              );
            }) : <tr><td colSpan={headers.length} style={{ padding: 16, color: "#64748B" }}>No hay registros.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="client-record-cards">
        {rows.length ? rows.map((row, rowIndex) => {
          const key = rowKeys[rowIndex] || rowIndex;
          const selected = selectedKey && key === selectedKey;
          return (
          <div className={`client-record-card${selected ? " selected" : ""}`} key={key} onClick={onRowClick ? (event) => {
            if (event.target.closest("button,a,input,select,textarea,details,summary")) return;
            onRowClick(key, rowIndex);
          } : undefined} style={{ padding: 13, borderRadius: 16, background: selected ? "#EEF4FF" : "#F8FBFF", border: selected ? "1px solid rgba(37,99,235,.34)" : "1px solid rgba(37,99,235,.10)", display: "grid", gap: 7, fontFamily: F, cursor: onRowClick ? "pointer" : "default" }}>
            {row.map((cell, cellIndex) => (
              <div className="client-record-card-field" key={cellIndex} style={{ display: "grid", gap: 2 }}>
                <span className="client-record-card-label" style={{ fontSize: 10, letterSpacing: "1px", color: "#64748B", fontWeight: 900 }}>{headers[cellIndex]}</span>
                <div className="client-record-card-value" style={{ color: "#0F172A", overflowWrap: "anywhere" }}>{cell}</div>
              </div>
            ))}
          </div>
        );}) : <div style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", color: "#64748B", fontFamily: F }}>No hay registros.</div>}
      </div>
    </>
  );
}

function PaginatedRecordList({ headers, rows, rowKeys = [], selectedKey = "", onRowClick, pageSize = DEFAULT_PAGE_SIZE, emptyMessage = "No hay registros para la consulta." }) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil((rows.length || 0) / pageSize));
  const safePage = Math.min(page, totalPages);
  const visibleRows = rows.slice((safePage - 1) * pageSize, safePage * pageSize);
  const visibleKeys = rowKeys.slice((safePage - 1) * pageSize, safePage * pageSize);

  useEffect(() => {
    setPage(1);
  }, [rows.length, pageSize]);

  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.length ? (
        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center", flexWrap: "wrap", fontFamily: F, color: "#64748B", fontSize: 13 }}>
          <span>Mostrando {visibleRows.length} de {rows.length} registro(s).</span>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button type="button" disabled={safePage <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} style={{ ...ghostButton, opacity: safePage <= 1 ? .5 : 1 }}>Anterior</button>
            <strong style={{ color: "#0B1D3A" }}>{safePage} / {totalPages}</strong>
            <button type="button" disabled={safePage >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} style={{ ...ghostButton, opacity: safePage >= totalPages ? .5 : 1 }}>Siguiente</button>
          </div>
        </div>
      ) : <div style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", color: "#64748B", fontFamily: F }}>{emptyMessage}</div>}
      {rows.length ? <RecordList headers={headers} rows={visibleRows} rowKeys={visibleKeys} selectedKey={selectedKey} onRowClick={onRowClick} /> : null}
    </div>
  );
}

function Imports({ data, onData, onGoHistory }) {
  const [module, setModule] = useState("clientes");
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);
  const [mergeChoices, setMergeChoices] = useState({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(null);
  const templates = data.templates || {};
  const template = templates[module];

  function downloadTemplate() {
    const examples = {
      clientes: ["", "Cliente Ejemplo SAS", "Cliente Alterno", "900123456", "3001234567", "cliente@correo.com", "Carrera 1 # 2-3", "Bogota", "Norte", "Cliente cargado por plantilla"],
      facturas_historicas: ["FAC-EXT-001", "C0001", "Cliente Ejemplo SAS", today(), today(), "OC-001", "INT-001", "credito", 1000000, "Cargue inicial sin detalle"],
      facturas_detalladas: ["FAC-EXT-002", "C0001", "Cliente Ejemplo SAS", today(), today(), "OC-002", "INT-002", "credito", "SKU-001", "Producto o servicio", 1, 100000, 0, "SI", 19, "Factura detallada"],
      abonos: ["C0001", "Cliente Ejemplo SAS", "FAC-000001", today(), 500000, 0, 0, 0, 0, 0, "Comercial", 0, "", 500000, "Transferencia bancaria", "REF123", "Abono ejemplo"],
      inventario: ["SKU-001", "Producto ejemplo", "", "", "SI", 19, "activo", "Producto creado sin stock inicial"],
      actualizacion_productos: ["SKU-001", "", 120000, 80000, "SI", 19, "activo", "Actualizacion por SKU"],
      movimientos_inventario: [today(), "SKU-001", "entrada", 10, 80000, "CARGUE-INICIAL", "Saldo inicial"],
      ordenes_detalladas: ["ORD-EXT-001", "C0001", "Cliente Ejemplo SAS", today(), today(), "SKU-001", "Producto o servicio", 1, 100000, 0, "SI", 19, "SI", "Orden ejemplo"]
    };
    downloadExcelWorkbook(`plantilla-${module}.xls`, [
      { name: "Datos", rows: [template.headers, template.headers.map(() => "")] },
      { name: "Ejemplo", rows: [template.headers, examples[module] || template.headers.map(() => "")] },
      {
        name: "Instrucciones",
        rows: [
          ["tema", "detalle"],
          ["Formato", "Guarda el archivo como CSV para cargarlo al portal. Esta plantilla se descarga en Excel para facilitar la edicion."],
          ["Validacion", "Si existe un error bloqueante, no se importa ninguna fila. El portal indicara fila, campo y correccion sugerida."],
          ["Consecutivos", `Clientes, facturas, abonos, ordenes y movimientos se asignan automaticamente. En clientes puedes dejar id_cliente vacio; solo usalo si necesitas reservar un ID puntual. Siguiente cliente sugerido: ${data.nextCustomerId}.`],
          ["Documentos duplicados", "Si varios IDs tienen el mismo documento, el portal mostrara una conciliacion para escoger el ID principal antes de importar."],
          ["Referencias", "En facturas y ordenes usa referencia_origen para conservar el numero del sistema anterior o agrupar varias lineas del mismo documento. El ID interno lo asigna el portal."],
          ["Ubicacion", "En clientes diligencia ciudad y zona si aplica. El departamento se asigna automaticamente cuando la ciudad esta en el catalogo; si no se reconoce, quedara Por validar."],
          ["Inventario", "Inventario maestro crea productos sin stock. Los saldos se cargan por movimientos_inventario. actualizacion_productos modifica datos existentes por SKU sin borrar campos vacios."],
          ["IVA", "Usa SI/NO en aplica_iva y tarifas 0, 5 o 19 segun corresponda."],
          ["Fechas", "Usa formato AAAA-MM-DD."]
        ]
      }
    ]);
  }

  async function readFile(file) {
    const text = await file.text();
    const parsed = parseCsv(text);
    setRows(parsed);
    setResult(null);
    setMergeChoices({});
  }

  async function validate(commit = false, withMergeChoices = false) {
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
        body: JSON.stringify({ module, rows, commit, mergeChoices: withMergeChoices ? mergeChoices : {} })
      });
      const payload = await response.json();
      setResult(payload);
      if (payload.duplicateCustomerDocuments?.length) {
        setMergeChoices((current) => {
          const next = { ...current };
          payload.duplicateCustomerDocuments.forEach((group) => {
            if (!next[group.documentNumber]) next[group.documentNumber] = group.recommendedPrimaryId || "__AUTO__";
          });
          return next;
        });
      }
      if (payload.committed && payload.data) {
        onData(payload.data);
        setSuccess({
          title: "Cargue importado correctamente",
          body: `${payload.summary?.rows || rows.length} fila(s) procesada(s). El cargue quedo registrado en el historial para consulta o reversion controlada.`,
          warnings: payload.summary?.warnings || 0
        });
      }
    } catch (error) {
      setResult({ ok: false, errors: [{ row: 0, field: "sistema", message: error.message }], warnings: [] });
    } finally {
      setBusy(false);
    }
  }

  function downloadErrors() {
    const errorRows = [["fila", "campo", "valor", "error", "como_corregir"], ...((result?.errors || []).map((error) => [error.row, error.field, error.value, error.message, error.fix]))];
    downloadExcelWorkbook(`errores-cargue-${module}.xls`, [{ name: "Errores", rows: errorRows }]);
  }

  return (
    <section style={card}>
      <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>CARGUES MASIVOS</div>
      <h2 style={{ margin: "4px 0 8px", fontFamily: FH, fontSize: 34, color: "#0B1D3A" }}>Validacion previa obligatoria</h2>
      <p style={{ fontFamily: F, color: "#64748B", lineHeight: 1.8, marginBottom: 16 }}>
        Si una fila tiene error bloqueante, no se importa nada. Descarga el informe, corrige el archivo y vuelve a cargarlo.
      </p>
      <div style={{ padding: 14, borderRadius: 18, background: "rgba(37,99,235,.06)", color: "#1D4ED8", fontFamily: F, lineHeight: 1.7, marginBottom: 14 }}>
        La plantilla se descarga en Excel para diligenciarla con facilidad. Para cargarla al portal, guardala como <strong>CSV UTF-8</strong> desde Excel o Google Sheets y sube ese archivo CSV.
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <button type="button" onClick={() => onGoHistory?.()} style={{ ...ghostButton, background: "#F8FBFF" }}>Historial y anulacion de cargues</button>
      </div>
      <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "minmax(220px,320px) auto auto minmax(0,1fr)", gap: 10, alignItems: "end" }}>
        <Field label="Plantilla"><select style={input} value={module} onChange={(event) => { setModule(event.target.value); setRows([]); setResult(null); setMergeChoices({}); }}>{Object.entries(templates).map(([key, item]) => <option key={key} value={key}>{item.label}</option>)}</select></Field>
        <button type="button" onClick={downloadTemplate} style={{ ...button, background: "#fff", color: "#1D4ED8", border: "1px solid rgba(37,99,235,.14)" }}>Descargar plantilla Excel</button>
        <button type="button" onClick={() => downloadExcelWorkbook(`export-${module}.xls`, buildWorkbookForExport(data, exportTypeForModule(module)))} style={{ ...button, background: "#fff", color: "#1D4ED8", border: "1px solid rgba(37,99,235,.14)" }}>Exportar base</button>
        <Field label="Archivo CSV para cargar">
          <input style={input} type="file" accept=".csv,text/csv" onChange={(event) => event.target.files?.[0] && readFile(event.target.files[0])} />
        </Field>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
        <button type="button" disabled={busy || !rows.length} onClick={() => validate(false)} style={{ ...button, opacity: busy || !rows.length ? .55 : 1 }}>Validar archivo</button>
        <button type="button" disabled={busy || !result?.ok} onClick={() => validate(true)} style={{ ...button, background: result?.ok ? "linear-gradient(135deg,#15803D,#22C55E)" : "#CBD5E1" }}>Importar validado</button>
        {result?.requiresCustomerMerge ? <button type="button" disabled={busy} onClick={() => validate(true, true)} style={{ ...button, background: "linear-gradient(135deg,#B45309,#F59E0B)" }}>Importar unificando documentos</button> : null}
        {result?.errors?.length ? <button type="button" onClick={downloadErrors} style={{ ...button, background: "#B91C1C" }}>Descargar errores</button> : null}
      </div>
      {rows.length ? <p style={{ fontFamily: F, color: "#64748B", marginTop: 12 }}>{rows.length} fila(s) leida(s).</p> : null}
      {result ? (
        <div style={{ marginTop: 16, display: "grid", gap: 10 }}>
          <div style={{ padding: 14, borderRadius: 16, background: result.ok ? "rgba(34,197,94,.10)" : "rgba(220,38,38,.08)", color: result.ok ? "#15803D" : "#991B1B", fontFamily: F, fontWeight: 900 }}>
            {result.ok ? `Archivo validado: ${result.summary?.rows || 0} fila(s), ${result.summary?.warnings || 0} advertencia(s).` : `Archivo rechazado: ${result.errors?.length || 0} error(es). No se importo ninguna fila.`}
          </div>
          {(result.duplicateCustomerDocuments || []).length ? (
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 16, background: "rgba(245,158,11,.10)", color: "#92400E", fontFamily: F, lineHeight: 1.7 }}>
                Se detectaron documentos repetidos o ya existentes. Elige el ID principal para cada documento. Al unificar, las facturas, abonos y ordenes pasan al ID principal y los otros IDs quedan libres para asignacion posterior.
              </div>
              {(result.duplicateCustomerDocuments || []).map((group) => (
                <div key={group.documentNumber} style={{ padding: 14, borderRadius: 18, background: "#fff", border: "1px solid rgba(245,158,11,.20)", display: "grid", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                    <div>
                      <strong style={{ fontFamily: F, color: "#0F172A" }}>Documento {group.documentNumber}</strong>
                      <div style={{ fontFamily: F, color: "#64748B", fontSize: 13 }}>{group.reason}</div>
                    </div>
                    <Field label="ID principal">
                      <select style={{ ...input, minWidth: 220 }} value={mergeChoices[group.documentNumber] || group.recommendedPrimaryId || "__AUTO__"} onChange={(event) => setMergeChoices((current) => ({ ...current, [group.documentNumber]: event.target.value }))}>
                        {!group.candidates.some((candidate) => candidate.source === "sistema") ? <option value="__AUTO__">Asignar siguiente ID automatico</option> : null}
                        {group.candidates.filter((candidate) => candidate.id).map((candidate) => <option key={`${group.documentNumber}-${candidate.source}-${candidate.id}-${candidate.row || ""}`} value={candidate.id}>{candidate.id} · {candidate.name}</option>)}
                      </select>
                    </Field>
                  </div>
                  <RecordList
                    headers={["Origen", "Fila", "ID", "Nombre", "Telefono", "Correo", "Saldo"]}
                    rows={group.candidates.map((candidate) => [
                      candidate.source === "sistema" ? "Sistema" : "Archivo",
                      candidate.row || "-",
                      candidate.id || "Automatico",
                      candidate.name,
                      candidate.phone || "-",
                      candidate.email || "-",
                      candidate.balanceLabel || "$ 0"
                    ])}
                  />
                </div>
              ))}
            </div>
          ) : null}
          {(result.errors || []).slice(0, 8).map((error, index) => <div key={index} style={{ padding: 12, borderRadius: 14, background: "#fff", border: "1px solid rgba(220,38,38,.14)", fontFamily: F, color: "#7F1D1D" }}>Fila {error.row} · {error.field}: {error.message} {error.fix ? `(${error.fix})` : ""}</div>)}
          {(result.warnings || []).slice(0, 6).map((warning, index) => <div key={index} style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,.10)", fontFamily: F, color: "#92400E" }}>Fila {warning.row} · {warning.field}: {warning.message}</div>)}
        </div>
      ) : null}
      <PortalModal open={Boolean(success)} title={success?.title || "Operacion exitosa"} eyebrow="CARGUE COMPLETADO" onClose={() => setSuccess(null)} wide={false}>
        <div style={{ display: "grid", gap: 14, fontFamily: F }}>
          <p style={{ margin: 0, color: "#52647F", lineHeight: 1.75 }}>{success?.body}</p>
          {success?.warnings ? <div style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,.10)", color: "#92400E", fontWeight: 800 }}>{success.warnings} advertencia(s) quedaron documentadas.</div> : null}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => { setRows([]); setResult(null); setMergeChoices({}); setSuccess(null); }} style={ghostButton}>Cargar otro</button>
            <button type="button" onClick={() => { setSuccess(null); onGoHistory?.(); }} style={button}>Ver historial / anular</button>
            <button type="button" onClick={() => setSuccess(null)} style={ghostButton}>Cerrar</button>
          </div>
        </div>
      </PortalModal>
    </section>
  );
}

function ImportHistory({ data, onSave, onExport }) {
  const [selected, setSelected] = useState(null);
  const [confirmRevert, setConfirmRevert] = useState(null);
  const [busy, setBusy] = useState(false);
  const imports = useMemo(() => [...(data.imports || [])].sort((a, b) => {
    const dateCompare = clean(b.importedAt).localeCompare(clean(a.importedAt));
    if (dateCompare) return dateCompare;
    return compareRecordId(a, b);
  }), [data.imports]);
  const moduleLabels = Object.fromEntries(Object.entries(data.templates || {}).map(([key, value]) => [key, value.label]));
  const activeImports = imports.filter((item) => item.status !== "revertido").length;
  const revertedImports = imports.length - activeImports;

  async function revert() {
    if (!confirmRevert) return;
    setBusy(true);
    try {
      await onSave("revertImport", { importId: confirmRevert.id });
      setSelected({ ...confirmRevert, status: "revertido", revertedAt: new Date().toISOString() });
      setConfirmRevert(null);
    } catch (err) {
      // El mensaje visible lo establece save() en el componente principal.
    } finally {
      setBusy(false);
    }
  }

  function affectedCount(importRecord = {}) {
    return Object.values(importRecord.affected || {}).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
  }

  return (
    <ModuleWithForm title="Historial de cargues" count={imports.length} onExport={() => onExport("cargues_historial")}>
      <p style={{ margin: 0, color: "#64748B", fontFamily: F, lineHeight: 1.75 }}>
        Consulta los archivos planos importados y anula cargues recientes si fueron duplicados o quedaron mal. La anulacion no borra registros: deja trazabilidad, anula documentos y registra reversos de inventario cuando aplica.
      </p>
      <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
        <Stat label="CARGUES ACTIVOS" value={activeImports} note="Pueden anularse si fueron cargados por error." />
        <Stat label="CARGUES ANULADOS" value={revertedImports} note="Conservan trazabilidad del proceso." tone="#B91C1C" />
        <Stat label="REGISTROS AFECTADOS" value={imports.reduce((sum, item) => sum + affectedCount(item), 0)} note="Documentos o movimientos creados por cargues." tone="#15803D" />
      </div>
      <PaginatedRecordList
        headers={["ID", "Modulo", "Filas", "Estado", "Afectados", "Fecha", "Acciones"]}
        rowKeys={imports.map((item) => item.id)}
        selectedKey={selected?.id || ""}
        onRowClick={(key) => {
          const item = imports.find((candidate) => candidate.id === key);
          if (item) setSelected(item);
        }}
        rows={imports.map((item) => [
          item.id,
          moduleLabels[item.module] || item.module,
          item.rows || 0,
          <StatusPill tone={item.status === "revertido" ? "#B91C1C" : "#15803D"}>{item.status === "revertido" ? "Anulado" : "Activo"}</StatusPill>,
          affectedCount(item),
          item.importedAt ? new Date(item.importedAt).toLocaleString("es-CO") : "",
          <RecordActions
            primary={[
              { label: "Ver detalle", onClick: () => setSelected(item) },
              ...(item.status !== "revertido" && affectedCount(item) ? [{ label: "Anular cargue", danger: true, onClick: () => setConfirmRevert(item) }] : [])
            ]}
          />
        ])}
        emptyMessage="Aun no hay cargues importados."
      />
      <PortalModal open={Boolean(selected)} title={selected?.id || ""} eyebrow="DETALLE DEL CARGUE" onClose={() => setSelected(null)} wide={false}>
        {selected ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <RecordList
              headers={["Campo", "Valor"]}
              rows={[
                ["Modulo", moduleLabels[selected.module] || selected.module],
                ["Estado", selected.status === "revertido" ? "Anulado / revertido" : "Activo"],
                ["Filas", selected.rows || 0],
                ["Advertencias", selected.warningsCount || 0],
                ["Importado por", selected.importedBy || ""],
                ["Fecha", selected.importedAt ? new Date(selected.importedAt).toLocaleString("es-CO") : ""],
                ["Anulado por", selected.revertedBy || "-"],
                ["Fecha anulacion", selected.revertedAt ? new Date(selected.revertedAt).toLocaleString("es-CO") : "-"]
              ]}
            />
            <RecordList
              headers={["Tipo", "Registros"]}
              rows={Object.entries(selected.affected || {}).map(([key, values]) => [key, Array.isArray(values) && values.length ? values.join(", ") : "-"])}
            />
            {selected.status !== "revertido" && affectedCount(selected) ? (
              <button type="button" onClick={() => setConfirmRevert(selected)} style={dangerGhostButton}>Anular cargue masivo</button>
            ) : null}
          </div>
        ) : null}
      </PortalModal>
      <ConfirmModal
        open={Boolean(confirmRevert)}
        title="Anular cargue masivo"
        body="Esta accion anulara los documentos creados por este cargue y registrara reversos de inventario cuando aplique. No elimina historia ni clientes, pero si cambia saldos e informes."
        details={[
          { label: "Cargue", value: confirmRevert?.id || "" },
          { label: "Modulo", value: moduleLabels[confirmRevert?.module] || confirmRevert?.module || "" },
          { label: "Filas importadas", value: confirmRevert?.rows || 0 },
          { label: "Registros afectados", value: affectedCount(confirmRevert || {}) }
        ]}
        busy={busy}
        danger
        onCancel={() => setConfirmRevert(null)}
        onConfirm={revert}
        confirmLabel="Anular cargue"
      />
    </ModuleWithForm>
  );
}

function Config({ data, onSave }) {
  const [draft, setDraft] = useState(data.company || {});
  useEffect(() => setDraft(data.company || {}), [data.company]);

  function selectLogo(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      window.alert("Selecciona una imagen valida para el logo.");
      return;
    }
    if (file.size > 900000) {
      window.alert("El logo debe pesar menos de 900 KB para que el portal cargue rapido.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setDraft((current) => ({ ...current, logoDataUrl: reader.result }));
    reader.readAsDataURL(file);
  }

  return (
    <section style={card}>
      <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>CONFIGURACION</div>
      <h2 style={{ margin: "4px 0 16px", fontFamily: FH, fontSize: 34, color: "#0B1D3A" }}>Datos de la empresa</h2>
      <form className="client-portal-form-grid" onSubmit={async (event) => { event.preventDefault(); if (window.confirm("Deseas guardar la configuracion de la empresa?")) await onSave("company", draft); }} style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 10 }}>
        {["name", "nit", "phone", "email", "address"].map((field) => <Field key={field} label={{ name: "Nombre empresa", nit: "NIT / documento", phone: "Telefono", email: "Correo", address: "Direccion" }[field]}><input style={input} value={draft[field] || ""} onChange={(event) => setDraft((current) => ({ ...current, [field]: event.target.value }))} /></Field>)}
        <Field label="Color principal"><input style={input} type="color" value={draft.color || "#1D4ED8"} onChange={(event) => setDraft((current) => ({ ...current, color: event.target.value }))} /></Field>
        <Field label="Logo de la empresa">
          <input style={input} type="file" accept="image/*" onChange={(event) => selectLogo(event.target.files?.[0])} />
        </Field>
        <div style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 10, alignContent: "center" }}>
          {draft.logoDataUrl ? <img src={draft.logoDataUrl} alt="Logo empresa" style={{ maxHeight: 72, maxWidth: "100%", objectFit: "contain" }} /> : <span style={{ fontFamily: F, color: "#64748B" }}>Sin logo cargado.</span>}
          {draft.logoDataUrl ? <button type="button" onClick={() => setDraft((current) => ({ ...current, logoDataUrl: "" }))} style={{ ...button, background: "#fff", color: "#B91C1C", border: "1px solid rgba(220,38,38,.14)" }}>Quitar logo</button> : null}
        </div>
        <button type="submit" className="client-portal-form-wide" style={{ ...button, gridColumn: "1/-1" }}>Guardar configuracion</button>
      </form>
    </section>
  );
}

export default function ClientPortal() {
  const [session, setSession] = useState({ configured: true, authenticated: false });
  const [data, setData] = useState(null);
  const [activeModule, setActiveModule] = useState("dashboard");
  const [showCompactHeader, setShowCompactHeader] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Validando sesion...");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [operationSuccess, setOperationSuccess] = useState(null);
  const [pendingExport, setPendingExport] = useState(null);
  const [fullDataLoaded, setFullDataLoaded] = useState(false);
  const [backgroundLoading, setBackgroundLoading] = useState(false);
  const loadRequestRef = useRef(0);
  const fullDataModuleRequestRef = useRef("");
  const noticeTimerRef = useRef(null);

  function clearNoticeTimer() {
    if (noticeTimerRef.current) {
      window.clearTimeout(noticeTimerRef.current);
      noticeTimerRef.current = null;
    }
  }

  function showNotice(message = "", timeoutMs = 3500) {
    clearNoticeTimer();
    setNotice(message);
    if (message && timeoutMs > 0) {
      noticeTimerRef.current = window.setTimeout(() => {
        setNotice("");
        noticeTimerRef.current = null;
      }, timeoutMs);
    }
  }

  useEffect(() => {
    function updateCompactHeader() {
      const shouldShow = window.scrollY > 170;
      setShowCompactHeader((current) => (current === shouldShow ? current : shouldShow));
    }
    updateCompactHeader();
    window.addEventListener("scroll", updateCompactHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateCompactHeader);
  }, []);

  useEffect(() => () => clearNoticeTimer(), []);

  async function fetchPortalData(scope = "full") {
    const dataResponse = await fetch(`/api/client-portal-data?scope=${encodeURIComponent(scope)}`);
    const dataPayload = await dataResponse.json();
    if (!dataResponse.ok) throw new Error(dataPayload.error || "No fue posible cargar datos.");
    return dataPayload.data;
  }

  async function loadData(options = {}) {
    const safeOptions = options && typeof options.preventDefault === "function" ? {} : (options || {});
    const hasData = Boolean(data);
    const forceFull = safeOptions.forceFull === true;
    const quietRefresh = safeOptions.quiet === true;
    const defaultScope = forceFull ? "full" : (!hasData || activeModule === "dashboard" ? "summary" : "full");
    const scope = safeOptions.scope || defaultScope;
    const silentRefresh = hasData && safeOptions.silent !== false;
    const requestId = ++loadRequestRef.current;

    if (!silentRefresh) {
      setLoading(true);
      setLoadingMessage("Validando sesion...");
    } else {
      if (!quietRefresh) showNotice("Actualizando informacion...", 0);
      if (scope === "full") setBackgroundLoading(true);
    }
    setError("");
    try {
      const sessionResponse = await fetch("/api/client-portal-session");
      const sessionPayload = await sessionResponse.json();
      if (requestId !== loadRequestRef.current) return;
      setSession(sessionPayload);
      if (!sessionPayload.authenticated) {
        setData(null);
        setFullDataLoaded(false);
        clearActivePortalSession();
        return;
      }
      if (!sessionPayload.impersonatedBy && !hasActivePortalSession()) {
        await fetch("/api/client-portal-logout", { method: "POST" });
        setSession({ configured: true, authenticated: false });
        setData(null);
        setFullDataLoaded(false);
        showNotice("", 0);
        return;
      }
      if (!silentRefresh) setLoadingMessage(scope === "summary" ? "Cargando resumen financiero..." : "Cargando informacion financiera...");
      const nextData = await fetchPortalData(scope);
      if (requestId !== loadRequestRef.current) return;
      setData(nextData);
      setFullDataLoaded(!nextData?.isCompact);
      if (silentRefresh && !quietRefresh) showNotice("Informacion actualizada.", 3000);
    } catch (err) {
      setError(err.message);
      if (silentRefresh) showNotice("", 0);
    } finally {
      if (requestId === loadRequestRef.current) {
        if (!silentRefresh) setLoading(false);
        if (silentRefresh) setBackgroundLoading(false);
      }
    }
  }

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!data?.isCompact) {
      fullDataModuleRequestRef.current = "";
      return;
    }
    const fullDataKey = activeModule || "dashboard";
    if (!backgroundLoading && fullDataModuleRequestRef.current !== fullDataKey) {
      fullDataModuleRequestRef.current = fullDataKey;
      loadData({ forceFull: true, quiet: activeModule === "dashboard" });
    }
  }, [activeModule, data?.isCompact, backgroundLoading]);

  function replacePortalData(nextData) {
    loadRequestRef.current += 1;
    setData(nextData);
    setFullDataLoaded(!nextData?.isCompact);
    setBackgroundLoading(false);
    fullDataModuleRequestRef.current = "";
  }

  async function save(type, payload) {
    showNotice("", 0);
    setError("");
    const { _silentSuccess: silentSuccess, ...payloadToSave } = payload || {};
    try {
      const response = await fetch("/api/client-portal-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload: payloadToSave })
      });
      const result = await response.json();
      if (!response.ok) {
        const message = result.error || "No fue posible guardar.";
        setError(message);
        const saveError = new Error(message);
        saveError.code = result.code || "";
        saveError.duplicate = result.duplicate || null;
        throw saveError;
      }
      if (result.data) {
        setData(result.data);
        setFullDataLoaded(!result.data?.isCompact);
      } else if (result.patch) {
        setData((current) => applyPortalPatch(current || {}, result.patch));
      }
      const labels = {
        company: "Configuracion guardada",
        customer: "Cliente guardado",
        mergeCustomers: "Clientes unificados",
        invoice: "Factura guardada",
        order: "Orden guardada",
        invoiceFromOrder: "Orden convertida en factura",
        payment: "Abono guardado",
        inventory: "Inventario guardado",
        inventoryMovement: "Movimiento registrado",
        revertImport: "Cargue reversado"
      };
      loadRequestRef.current += 1;
      showNotice("Informacion guardada correctamente.", 3500);
      setBackgroundLoading(false);
      if (!silentSuccess) {
        setOperationSuccess({
          title: labels[type] || "Operacion completada",
          body: type === "revertImport"
            ? "El cargue fue reversado con trazabilidad. Revisa el historial y los reportes antes de continuar."
            : "La informacion quedo actualizada en el portal."
        });
      }
      return result;
    } catch (err) {
      const message = err.message || "No fue posible guardar.";
      setError(message);
      throw err;
    }
  }

  async function logout() {
    await fetch("/api/client-portal-logout", { method: "POST" });
    clearActivePortalSession();
    showNotice("", 0);
    setSession({ configured: true, authenticated: false });
    setData(null);
  }

  function exportData(type, context = {}) {
    const labels = {
      actividad: "Actividad del periodo",
      clientes: "Clientes",
      facturas: "Facturas",
      abonos: "Abonos",
      cartera: "Cartera",
      cartera_detallada: "Cartera detallada",
      detalle_facturas: "Detalle productos por factura",
      cargues_historial: "Historial de cargues",
      inventario: "Inventario",
      movimientos: "Movimientos",
      ordenes: "Ordenes"
    };
    setPendingExport({ type, label: labels[type] || "Reporte", context });
  }

  function confirmExport() {
    if (!pendingExport) return;
    downloadExcelWorkbook(`${pendingExport.type}-${new Date().toISOString().slice(0, 10)}.xls`, buildWorkbookForExport(data, pendingExport.type, pendingExport.context || {}));
    setPendingExport(null);
    setOperationSuccess({
      title: "Reporte descargado",
      body: `Se genero el archivo de ${pendingExport.label}. Revisa el archivo descargado antes de compartirlo o usarlo para analisis.`
    });
  }

  if (loading) {
    return <PortalLoading message={loadingMessage} />;
  }

  if (!session.authenticated) {
    return <Login configured={session.configured} onLogin={() => { markActivePortalSession(); loadData({ scope: "summary" }); }} />;
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

  const moduleNeedsFullData = Boolean(data?.isCompact && activeModule !== "dashboard");
  const syncingDetails = Boolean(backgroundLoading);

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top left, rgba(37,99,235,.12), transparent 28%), linear-gradient(180deg,#EFF6FF,#F8FBFF)", padding: "clamp(10px,1.2vw,18px)" }}>
      <style>{`
        .client-portal-sticky-header{
          position:fixed;
          top:10px;
          left:50%;
          width:min(1760px,calc(100vw - 28px));
          min-height:62px;
          transform:translate(-50%,-120%);
          opacity:0;
          pointer-events:none;
          z-index:800;
          display:grid;
          grid-template-columns:minmax(0,1fr) auto;
          gap:12px;
          align-items:center;
          padding:9px 11px;
          border-radius:18px;
          background:rgba(255,255,255,.92);
          border:1px solid rgba(37,99,235,.14);
          box-shadow:0 18px 48px rgba(15,23,42,.16);
          backdrop-filter:blur(16px);
          transition:transform .22s ease,opacity .22s ease;
        }
        .client-portal-sticky-header.visible{
          transform:translate(-50%,0);
          opacity:1;
          pointer-events:auto;
        }
        .client-portal-sticky-brand{
          min-width:0;
          display:grid;
          grid-template-columns:auto minmax(0,1fr);
          gap:10px;
          align-items:center;
        }
        .client-portal-sticky-logo{
          width:42px;
          height:42px;
          border-radius:14px;
          background:linear-gradient(135deg,#FFFFFF,#F3F7FF);
          border:1px solid rgba(37,99,235,.14);
          display:grid;
          place-items:center;
          overflow:hidden;
          padding:6px;
        }
        .client-portal-sticky-logo img{
          max-width:100%;
          max-height:100%;
          object-fit:contain;
          display:block;
        }
        .client-portal-sticky-logo span{
          font-family:${F};
          color:#1D4ED8;
          font-size:16px;
          font-weight:950;
        }
        .client-portal-sticky-brand strong{
          display:block;
          min-width:0;
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          color:#0B1D3A;
          font-family:${F};
          font-size:16px;
          font-weight:950;
          line-height:1.1;
        }
        .client-portal-sticky-brand span{
          display:block;
          margin-top:2px;
          color:#52647F;
          font-family:${F};
          font-size:11px;
          font-weight:850;
          letter-spacing:.25px;
        }
        .client-portal-sticky-controls{
          display:flex;
          align-items:center;
          justify-content:flex-end;
          gap:8px;
        }
        .client-portal-sticky-controls select,
        .client-portal-sticky-controls button{
          min-height:40px;
          border-radius:13px;
          border:1px solid rgba(37,99,235,.14);
          background:#fff;
          color:#1D4ED8;
          font-family:${F};
          font-weight:950;
          font-size:12px;
          padding:0 12px;
          cursor:pointer;
        }
        .client-portal-sticky-controls select{
          min-width:190px;
          color:#0B1D3A;
        }
        .client-portal-sticky-controls button{
          background:#F8FBFF;
        }
        .client-portal-sticky-controls button.danger{
          color:#B91C1C;
          border-color:rgba(220,38,38,.16);
        }
        .client-portal-modal-backdrop{
          position:fixed;
          inset:0;
          background:rgba(15,23,42,.58);
          display:grid;
          place-items:center;
          padding:22px;
          z-index:9999;
        }
        .client-portal-modal{
          width:min(100%,1180px);
          max-height:92vh;
          overflow:auto;
          background:#fff;
          border-radius:28px;
          border:1px solid rgba(37,99,235,.12);
          box-shadow:0 28px 80px rgba(15,23,42,.28);
        }
        .client-portal-modal-head{
          display:flex;
          justify-content:space-between;
          align-items:flex-start;
          gap:18px;
          padding:26px 28px 20px;
          border-bottom:1px solid rgba(37,99,235,.10);
        }
        .client-portal-modal-body{padding:24px 28px 28px}
        .client-record-cards{display:none}
        .client-action-group{display:flex;gap:8px;flex-wrap:wrap}
        .client-action-group button{
          min-height:34px;
          padding:7px 10px!important;
          border-radius:11px!important;
          font-size:12px!important;
        }
        .client-action-group-compact{
          align-items:center;
          flex-wrap:nowrap;
        }
        .client-row-more{
          position:relative;
          display:inline-block;
          font-family:${F};
        }
        .client-row-more summary{
          list-style:none;
          min-height:34px;
          padding:7px 10px;
          border-radius:11px;
          border:1px solid rgba(37,99,235,.14);
          background:#fff;
          color:#1D4ED8;
          font-size:12px;
          font-weight:900;
          cursor:pointer;
          display:grid;
          place-items:center;
        }
        .client-row-more summary::-webkit-details-marker{display:none}
        .client-row-more[open] summary{
          background:#EEF4FF;
          border-color:rgba(37,99,235,.28);
        }
        .client-row-more div{
          position:absolute;
          right:0;
          top:calc(100% + 6px);
          z-index:30;
          min-width:136px;
          display:grid;
          gap:6px;
          padding:8px;
          border-radius:14px;
          background:#fff;
          border:1px solid rgba(37,99,235,.14);
          box-shadow:0 16px 34px rgba(15,23,42,.16);
        }
        .client-row-more button{
          width:100%;
          justify-content:flex-start;
          text-align:left;
          background:#fff!important;
          color:#1D4ED8!important;
          border:0!important;
        }
        .client-row-more button:hover{background:#F1F6FF!important}
        .client-row-more button.danger{color:#B91C1C!important}
        .client-record-row td:first-child{
          border-left:1px solid rgba(37,99,235,.10);
          border-radius:13px 0 0 13px;
        }
        .client-record-row td:last-child{
          border-right:1px solid rgba(37,99,235,.10);
          border-radius:0 13px 13px 0;
        }
        .client-record-row.selected td:first-child{
          border-left-color:rgba(37,99,235,.34);
        }
        .client-record-row.selected td:last-child{
          border-right-color:rgba(37,99,235,.34);
        }
        .client-customer-picker{display:grid;grid-template-columns:minmax(280px,.9fr) minmax(0,1.25fr);gap:14px}
        .client-customer-picker-results{
          max-height:68vh;
          overflow:auto;
          padding-right:4px;
        }
        .client-customer-picker-preview{
          position:sticky;
          top:0;
        }
        .client-sticky-actions{
          position:sticky;
          top:0;
          z-index:5;
          padding:10px;
          border-radius:18px;
          background:rgba(255,255,255,.96);
          border:1px solid rgba(37,99,235,.10);
          box-shadow:0 14px 30px rgba(15,23,42,.08);
          backdrop-filter:blur(10px);
        }
        .client-portal-layout{
          display:grid;
          grid-template-columns:200px minmax(0,1fr);
          gap:12px;
          align-items:start;
        }
        .client-portal-sidebar{
          position:sticky;
          top:16px;
          display:grid;
          gap:12px;
          padding:12px;
          border-radius:22px;
          background:rgba(255,255,255,.95);
          border:1px solid rgba(37,99,235,.10);
          box-shadow:0 18px 42px rgba(15,23,42,.07);
        }
        .client-sidebar-kicker{
          font-family:${F};
          font-size:11px;
          letter-spacing:1.5px;
          color:#1D4ED8;
          font-weight:950;
          text-transform:uppercase;
        }
        .client-module-group{
          display:grid;
          gap:6px;
        }
        .client-module-group-title{
          font-family:${F};
          font-size:10px;
          letter-spacing:1.25px;
          color:#64748B;
          font-weight:950;
          text-transform:uppercase;
        }
        .client-module-list{
          display:grid;
          gap:5px;
        }
        .client-module-button{
          width:100%;
          min-height:36px;
          padding:7px 8px;
          border-radius:13px;
          border:1px solid rgba(37,99,235,.11);
          background:#fff;
          color:#1D4ED8;
          font-family:${F};
          font-size:12px;
          font-weight:950;
          text-align:left;
          cursor:pointer;
          display:grid;
          grid-template-columns:auto minmax(0,1fr) auto;
          gap:8px;
          align-items:center;
          transition:background .18s ease,color .18s ease,transform .18s ease,box-shadow .18s ease;
        }
        .client-module-badge{
          width:28px;
          height:24px;
          border-radius:9px;
          display:grid;
          place-items:center;
          background:rgba(37,99,235,.09);
          color:#1D4ED8;
        }
        .client-module-badge svg{
          display:block;
        }
        .client-module-label{
          min-width:0;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
        }
        .client-module-count{
          min-width:23px;
          padding:3px 6px;
          border-radius:999px;
          background:#EEF4FF;
          color:#52647F;
          font-size:10px;
          text-align:center;
          font-weight:950;
        }
        .client-module-button:hover{
          background:#F8FBFF;
          transform:translateY(-1px);
        }
        .client-module-button.active{
          border-color:transparent;
          background:linear-gradient(135deg,#0B1D3A,#2563EB);
          color:#fff;
          box-shadow:0 10px 24px rgba(37,99,235,.22);
        }
        .client-module-button.active .client-module-badge{
          background:rgba(255,255,255,.18);
          color:#fff;
        }
        .client-module-button.active .client-module-count{
          background:rgba(255,255,255,.18);
          color:#fff;
        }
        .client-portal-workspace{
          min-width:0;
          display:grid;
          gap:14px;
        }
        .client-portal-mobile-module{
          display:none;
        }
        .client-company-brand{
          display:grid;
          grid-template-columns:auto minmax(0,1fr);
          gap:14px;
          align-items:center;
        }
        .client-company-logo-frame{
          width:70px;
          height:58px;
          border-radius:18px;
          background:linear-gradient(135deg,#FFFFFF,#F3F7FF);
          border:1px solid rgba(37,99,235,.14);
          box-shadow:0 12px 28px rgba(15,23,42,.08);
          display:grid;
          place-items:center;
          overflow:hidden;
          padding:8px;
        }
        .client-company-logo-frame img{
          max-width:100%;
          max-height:100%;
          object-fit:contain;
          display:block;
        }
        .client-company-logo-frame span{
          font-family:${F};
          color:#1D4ED8;
          font-size:22px;
          font-weight:950;
          letter-spacing:.5px;
        }
        .client-company-name{
          margin:2px 0 3px;
          font-family:${F};
          font-size:clamp(23px,3vw,34px);
          font-weight:950;
          color:#0B1D3A;
          line-height:1.06;
          overflow-wrap:anywhere;
        }
        .client-contarae-signature{
          display:flex;
          justify-content:center;
          align-items:center;
          gap:10px;
          padding:10px 12px 2px;
          color:#64748B;
          font-family:${F};
          font-size:12px;
          line-height:1.45;
          text-align:center;
        }
        .client-contarae-signature img{
          width:78px;
          max-height:26px;
          object-fit:contain;
          opacity:.78;
          filter:saturate(.85);
        }
        .client-contarae-signature a{
          color:#1D4ED8;
          font-weight:900;
          text-decoration:none;
        }
        .client-stat-card{
          position:relative;
          overflow:hidden;
        }
        .client-stat-card::after{
          content:"";
          position:absolute;
          right:-34px;
          top:-38px;
          width:106px;
          height:106px;
          border-radius:999px;
          background:rgba(37,99,235,.055);
          pointer-events:none;
        }
        .client-stat-icon{
          width:34px;
          height:34px;
          border-radius:13px;
          display:grid;
          place-items:center;
          background:#F2F7FF;
          border:1px solid rgba(37,99,235,.08);
          flex:0 0 auto;
          position:relative;
          z-index:1;
        }
        .client-stat-icon svg{
          display:block;
        }
        .client-stat-sparkline{
          width:100%;
          height:34px;
          display:block;
          margin-top:8px;
        }
        .client-stat-trend{
          display:flex;
          align-items:center;
          gap:7px;
          margin-top:8px;
          min-height:24px;
          font-family:${F};
        }
        .client-stat-trend span{
          display:inline-flex;
          align-items:center;
          padding:4px 8px;
          border-radius:999px;
          background:#F8FBFF;
          border:1px solid rgba(37,99,235,.10);
          font-size:12px;
          font-weight:950;
          line-height:1;
        }
        .client-stat-trend small{
          color:#64748B;
          font-size:11px;
          font-weight:800;
          line-height:1.2;
        }
        .client-stat-bars{
          height:36px;
          display:flex;
          align-items:flex-end;
          gap:5px;
          margin-top:9px;
          padding:7px 7px 5px;
          border-radius:13px;
          background:#F8FBFF;
          border:1px solid rgba(37,99,235,.08);
        }
        .client-stat-bars span{
          flex:1;
          min-width:0;
          border-radius:999px 999px 4px 4px;
          opacity:.82;
        }
        @media(max-width:980px){
          .client-portal-sticky-header{
            top:8px;
            width:calc(100vw - 20px);
            grid-template-columns:1fr;
            min-height:auto;
            gap:9px;
            padding:9px;
            border-radius:17px;
          }
          .client-portal-sticky-logo{
            width:38px;
            height:38px;
            border-radius:13px;
          }
          .client-portal-sticky-brand strong{
            font-size:14px;
          }
          .client-portal-sticky-controls{
            display:grid;
            grid-template-columns:minmax(0,1fr) auto auto;
            gap:7px;
          }
          .client-portal-sticky-controls select{
            min-width:0;
            width:100%;
          }
          .client-portal-sticky-controls button{
            min-height:36px;
            padding:0 10px;
          }
          .client-portal-stats,.client-portal-form-grid,.client-portal-line-grid,.client-portal-totals,.client-period-controls,.client-customer-picker{grid-template-columns:1fr!important}
          .client-portal-row{grid-template-columns:1fr!important}
          .client-aging-row{grid-template-columns:1fr!important}
          .client-aging-row span,.client-aging-row strong{text-align:left!important}
          .client-portal-shell{
            padding:0!important;
            width:100%!important;
            box-sizing:border-box!important;
            gap:10px!important;
          }
          .client-portal-header{
            grid-template-columns:1fr!important;
            padding:12px!important;
            border-radius:18px!important;
          }
          .client-portal-actions{
            display:grid!important;
            grid-template-columns:repeat(2,minmax(0,1fr));
            width:100%;
            gap:8px!important;
          }
          .client-portal-actions button{
            width:100%!important;
            min-height:42px;
          }
          .client-module-card{
            padding:14px!important;
            border-radius:18px!important;
          }
          .client-module-head{
            align-items:stretch!important;
            margin-bottom:12px!important;
          }
          .client-module-head > div{
            min-width:0;
          }
          .client-module-export{
            width:100%!important;
            min-height:42px;
          }
          .client-module-content{
            gap:12px!important;
          }
          .client-portal-form-grid > *,
          .client-portal-form-wide{
            grid-column:auto!important;
          }
          .client-portal-modal-backdrop{
            align-items:end;
            padding:8px;
          }
          .client-portal-modal{
            width:100%!important;
            border-radius:22px 22px 14px 14px;
            max-height:92vh;
            box-sizing:border-box;
          }
          .client-portal-modal-head{
            padding:16px 16px 13px;
            align-items:center;
          }
          .client-portal-modal-head button{
            width:40px!important;
            height:40px!important;
            flex:0 0 auto;
          }
          .client-portal-modal-body{
            padding:14px;
          }
          .client-record-table{display:none}
          .client-record-cards{display:grid;gap:10px}
          .client-record-card{
            padding:11px!important;
            border-radius:14px!important;
            gap:6px!important;
          }
          .client-record-card-field{
            grid-template-columns:minmax(76px,.36fr) minmax(0,1fr);
            gap:8px!important;
            align-items:start;
            padding:2px 0;
          }
          .client-record-card-label{
            font-size:9px!important;
            line-height:1.25;
          }
          .client-record-card-value{
            font-size:13px;
            line-height:1.35;
          }
          .client-action-group{
            display:grid!important;
            grid-template-columns:repeat(2,minmax(0,1fr));
            gap:7px!important;
            width:100%;
          }
          .client-action-group button,
          .client-row-more,
          .client-row-more summary{
            width:100%;
          }
          .client-row-more div{
            left:0;
            right:auto;
            min-width:100%;
          }
          .client-portal-layout{grid-template-columns:1fr;gap:10px!important}
          .client-portal-sidebar{display:none}
          .client-portal-mobile-module{display:block}
          .client-portal-mobile-module{
            padding:12px;
            border-radius:18px;
            background:rgba(255,255,255,.94);
            border:1px solid rgba(37,99,235,.10);
            box-shadow:0 14px 30px rgba(15,23,42,.06);
          }
          .client-customer-picker-results{
            max-height:48vh;
            overflow:auto;
            padding-right:0;
          }
          .client-customer-picker-preview{
            order:-1;
            position:sticky;
            top:0;
            z-index:4;
          }
          .client-sticky-actions{position:static}
          .client-company-brand{
            grid-template-columns:auto minmax(0,1fr);
            gap:11px;
          }
          .client-company-logo-frame{
            width:54px;
            height:48px;
            border-radius:15px;
            padding:7px;
          }
          .client-company-name{
            font-size:clamp(20px,6vw,27px);
            line-height:1.08;
          }
          .client-contarae-signature{
            flex-direction:column;
            gap:5px;
            padding-top:6px;
          }
          .client-contarae-signature img{
            width:70px;
            max-height:23px;
          }
        }
        @media(max-width:640px){
          .client-portal-sticky-controls{
            grid-template-columns:1fr 1fr!important;
          }
          .client-portal-sticky-controls select{
            grid-column:1/-1;
          }
          .client-company-name{
            font-size:20px!important;
            line-height:1.08!important;
          }
          .client-company-brand p{
            font-size:12px!important;
          }
          .client-company-logo-frame{
            width:48px!important;
            height:44px!important;
            border-radius:14px!important;
          }
          .client-portal-stats{
            gap:9px!important;
          }
          .client-stat-card{
            padding:12px!important;
            border-radius:16px!important;
          }
          .client-stat-icon{
            width:30px;
            height:30px;
            border-radius:11px;
          }
          .client-stat-bars{
            height:28px;
            margin-top:7px;
          }
          .client-portal-modal-head h2{
            font-size:21px!important;
          }
          .client-record-card-field{
            grid-template-columns:1fr;
            gap:2px!important;
            padding:4px 0;
            border-bottom:1px solid rgba(37,99,235,.07);
          }
          .client-record-card-field:last-child{
            border-bottom:0;
          }
          .client-action-group{
            grid-template-columns:1fr;
          }
          .client-action-group-compact{
            grid-template-columns:repeat(2,minmax(0,1fr));
          }
          .client-action-group-compact .client-row-more{
            grid-column:1/-1;
          }
        }
      `}</style>
      <CompactPortalHeader
        visible={showCompactHeader}
        companyName={data?.company?.name || session.companyName}
        logoDataUrl={data?.company?.logoDataUrl || ""}
        activeModule={activeModule}
        onModuleChange={setActiveModule}
        onRefresh={loadData}
        onLogout={logout}
      />
      <div className="client-portal-shell" style={{ width: "min(1760px, calc(100vw - 28px))", margin: "0 auto", display: "grid", gap: 12 }}>
        <header className="client-portal-header" style={{ ...card, padding: 14, borderRadius: 20, display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 14, alignItems: "center" }}>
          <CompanyBrand companyName={data?.company?.name || session.companyName} logoDataUrl={data?.company?.logoDataUrl || ""} />
          <div className="client-portal-actions" style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end", alignItems: "center" }}>
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
        {syncingDetails ? (
          <div style={{ padding: "11px 13px", borderRadius: 16, background: "rgba(37,99,235,.08)", color: "#1E3A8A", fontFamily: F, fontWeight: 900, display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <span>Cargando detalle completo del portal en segundo plano.</span>
            <span style={{ color: "#64748B" }}>Puedes seguir trabajando mientras termina.</span>
          </div>
        ) : null}

        <div className="client-portal-mobile-module">
          <Field label="Ir a modulo">
            <select style={input} value={activeModule} onChange={(event) => setActiveModule(event.target.value)}>
              {MODULE_GROUPS.map((group) => (
                <optgroup key={group.title} label={group.title}>
                  {group.items.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
        </div>

        <div className="client-portal-layout">
          <ModuleNavigation activeModule={activeModule} onChange={setActiveModule} data={data} />
          <section className="client-portal-workspace">
            {moduleNeedsFullData ? (
              <section style={{ ...card, display: "grid", gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 16, display: "grid", placeItems: "center", background: "#EEF4FF", color: "#1D4ED8" }}>
                  <Icon name="portfolio" size={22} />
                </div>
                <div>
                  <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>CARGANDO DETALLE</div>
                  <h2 style={{ margin: "4px 0 6px", fontFamily: F, color: "#0B1D3A", fontSize: 24 }}>Preparando modulo completo</h2>
                  <p style={{ margin: 0, fontFamily: F, color: "#52647F", lineHeight: 1.65 }}>El dashboard ya esta disponible. Este modulo necesita facturas, pagos y movimientos completos; lo estamos trayendo sin recargar toda la pagina.</p>
                </div>
              </section>
            ) : (
              <>
                {activeModule === "dashboard" ? <Dashboard data={data} setModule={setActiveModule} /> : null}
                {activeModule === "actividad" ? <Activity data={data} onExport={exportData} /> : null}
                {activeModule === "clientes" ? <Customers data={data} onSave={save} onExport={exportData} /> : null}
                {activeModule === "facturas" ? <Invoices data={data} onSave={save} onExport={exportData} /> : null}
                {activeModule === "abonos" ? <Payments data={data} onSave={save} onExport={exportData} /> : null}
                {activeModule === "cartera" ? <Portfolio data={data} onExport={exportData} onSave={save} /> : null}
                {activeModule === "inventario" ? <Inventory data={data} onSave={save} onExport={exportData} /> : null}
                {activeModule === "movimientos" ? <InventoryMovements data={data} onSave={save} onExport={exportData} /> : null}
                {activeModule === "ordenes" ? <Orders data={data} onSave={save} onExport={exportData} /> : null}
                {activeModule === "cargues" ? <Imports data={data} onData={replacePortalData} onGoHistory={() => setActiveModule("cargues-historial")} /> : null}
                {activeModule === "cargues-historial" ? <ImportHistory data={data} onSave={save} onExport={exportData} /> : null}
                {activeModule === "configuracion" ? <Config data={data} onSave={save} /> : null}
              </>
            )}
          </section>
        </div>
        <ContaraeSignature />
        <PortalModal open={Boolean(operationSuccess)} title={operationSuccess?.title || "Operacion completada"} eyebrow="LISTO" onClose={() => setOperationSuccess(null)} wide={false}>
          <div style={{ display: "grid", gap: 14, fontFamily: F }}>
            <p style={{ margin: 0, color: "#52647F", lineHeight: 1.75 }}>{operationSuccess?.body}</p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
              <button type="button" onClick={() => { setOperationSuccess(null); loadData(); }} style={button}>Actualizar vista</button>
              <button type="button" onClick={() => setOperationSuccess(null)} style={ghostButton}>Cerrar</button>
            </div>
          </div>
        </PortalModal>
        <ConfirmModal
          open={Boolean(pendingExport)}
          title="Descargar reporte Excel"
          body="Vas a generar un archivo de Excel con informacion del portal. Confirma la descarga para evitar reportes accidentales o con filtros equivocados."
          details={[
            { label: "Reporte", value: pendingExport?.label || "" },
            { label: "Alcance", value: pendingExport?.context?.activityLabel || (pendingExport?.context?.customerName ? `Cliente: ${pendingExport.context.customerName}` : pendingExport?.context?.filters ? "Filtros actuales" : "Base completa") },
            { label: "Fecha", value: new Date().toLocaleDateString("es-CO") }
          ]}
          onCancel={() => setPendingExport(null)}
          onConfirm={confirmExport}
          confirmLabel="Descargar Excel"
        />
      </div>
    </main>
  );
}
