import crypto from "crypto";
import { getStore as getBlobStore } from "@netlify/blobs";

const PORTAL_STORE_NAME = "client-portal";
const COMPANY_PREFIX = "company:";
const DEFAULT_CURRENCY = "COP";

const IMPORT_TEMPLATES = {
  clientes: {
    label: "Clientes",
    headers: ["id_cliente", "nombre_cliente", "nombre_alterno", "documento", "telefono", "correo", "direccion", "ciudad", "zona", "notas"]
  },
  facturas_historicas: {
    label: "Facturas historicas",
    headers: ["referencia_origen", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "valor_total", "notas"]
  },
  facturas_detalladas: {
    label: "Facturas detalladas",
    headers: ["referencia_origen", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "notas"]
  },
  abonos: {
    label: "Abonos",
    headers: ["id_cliente", "nombre_cliente", "id_factura", "fecha", "valor_bruto", "retefuente", "reteica", "reteiva", "otras_retenciones", "valor_neto", "medio_pago", "referencia", "notas"]
  },
  inventario: {
    label: "Inventario maestro",
    headers: ["sku", "nombre_producto", "precio_venta", "costo", "aplica_iva", "tarifa_iva", "estado", "notas"]
  },
  actualizacion_productos: {
    label: "Actualizacion de productos",
    headers: ["sku", "nombre_producto", "precio_venta", "costo", "aplica_iva", "tarifa_iva", "estado", "notas"]
  },
  movimientos_inventario: {
    label: "Movimientos de inventario",
    headers: ["fecha", "sku", "tipo_movimiento", "cantidad", "costo_unitario", "referencia", "notas"]
  },
  ordenes_detalladas: {
    label: "Ordenes detalladas",
    headers: ["referencia_origen", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "mostrar_descuento_pdf", "notas"]
  }
};

const INVENTORY_MOVEMENT_TYPES = new Set(["entrada", "salida", "ajuste_positivo", "ajuste_negativo"]);
const INVALID_DOCUMENT_TOKENS = new Set(["", "por asignar", "sin documento", "pendiente", "pendiente por asignar", "n/a", "na", "0"]);

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

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function onlyDigits(value = "") {
  return String(value || "").replace(/\D/g, "");
}

function normalizeDocument(value = "") {
  const digits = onlyDigits(value);
  if (digits) return INVALID_DOCUMENT_TOKENS.has(digits) ? "" : digits;
  const normalized = cleanText(value).toLowerCase();
  return INVALID_DOCUMENT_TOKENS.has(normalized) ? "" : "";
}

function hasRealDocument(value = "") {
  return Boolean(normalizeDocument(value));
}

function normalizeLookup(value = "") {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function titleCaseText(value = "") {
  return cleanText(value)
    .toLocaleLowerCase("es-CO")
    .replace(/\s+/g, " ")
    .split(" ")
    .map((word) => word.split("-").map((part) => part ? `${part.charAt(0).toLocaleUpperCase("es-CO")}${part.slice(1)}` : "").join("-"))
    .join(" ");
}

function resolveCityDepartment(cityValue = "", fallbackDepartment = "") {
  const rawCity = cleanText(cityValue);
  const rawDepartment = cleanText(fallbackDepartment);
  if (!rawCity) {
    return {
      city: "",
      department: rawDepartment ? titleCaseText(rawDepartment) : "",
      geographyStatus: ""
    };
  }
  const match = CITY_DEPARTMENT_MAP[normalizeLookup(rawCity)];
  if (match) {
    return {
      city: match[0],
      department: match[1],
      geographyStatus: "validado"
    };
  }
  return {
    city: titleCaseText(rawCity),
    department: rawDepartment ? titleCaseText(rawDepartment) : "Por validar",
    geographyStatus: "pendiente_validacion"
  };
}

function randomId(prefix = "ID") {
  const value = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}-${value.replace(/-/g, "").slice(0, 10).toUpperCase()}`;
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
    const parts = normalized.split(",");
    if (parts.length === 2 && parts[1].length <= 2) return Number(normalized.replace(/\./g, "").replace(",", ".")) || 0;
    return Number(normalized.replace(/,/g, "")) || 0;
  }
  if (normalized.includes(".")) {
    const parts = normalized.split(".");
    if (parts.length > 2) return Number(parts.join("")) || 0;
    if (parts.length === 2 && parts[1].length === 3) return Number(parts.join("")) || 0;
  }
  return Number(normalized) || 0;
}

function formatMoney(value) {
  const amount = Math.round(Number(value || 0));
  return `$ ${new Intl.NumberFormat("es-CO").format(amount)}`;
}

function normalizeDate(value = "") {
  const raw = cleanText(value);
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function normalizeBoolean(value) {
  const normalized = cleanText(value).toLowerCase();
  return ["si", "sí", "s", "yes", "true", "1", "x"].includes(normalized);
}

function normalizeCustomerId(value = "") {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function normalizeSku(value = "") {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9-_.]/g, "");
}

function normalizeRecordId(value = "", prefix = "REG") {
  return cleanText(value).toUpperCase().replace(/[^A-Z0-9-_.]/g, "") || randomId(prefix);
}

function nextSequentialId(records = [], prefix = "REG", width = 6) {
  const escapedPrefix = String(prefix).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^${escapedPrefix}-(\\d+)$`, "i");
  const max = records.reduce((currentMax, record) => {
    const match = String(record.id || "").match(pattern);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);
  return `${prefix}-${String(max + 1).padStart(width, "0")}`;
}

function compareExactName(left = "", right = "") {
  return cleanText(left) === cleanText(right);
}

function nextCustomerId(customers = []) {
  const max = customers.reduce((currentMax, customer) => {
    const match = String(customer.id || "").match(/^C(\d+)$/i);
    return match ? Math.max(currentMax, Number(match[1])) : currentMax;
  }, 0);
  return `C${String(max + 1).padStart(4, "0")}`;
}

function nextInvoiceId(data = {}) {
  return nextSequentialId(data.invoices || [], "FAC");
}

function nextPaymentId(data = {}) {
  return nextSequentialId(data.payments || [], "ABO");
}

function nextOrderId(data = {}) {
  return nextSequentialId(data.orders || [], "ORD");
}

function nextMovementId(data = {}) {
  return nextSequentialId(data.inventoryMovements || [], "MOV");
}

function createAudit(action, actor = "portal", details = {}) {
  return {
    id: randomId("AUD"),
    action,
    at: new Date().toISOString(),
    by: cleanText(actor) || "portal",
    ...details
  };
}

function normalizeLine(line = {}, inventory = []) {
  const sku = normalizeSku(line.sku);
  const inventoryItem = sku ? inventory.find((item) => item.sku === sku) : null;
  const quantity = Math.max(Number(line.quantity || line.cantidad || 1) || 1, 0);
  const unitPrice = parseCurrency(line.unitPrice ?? line.precio_unitario ?? inventoryItem?.salePrice ?? 0);
  const discount = parseCurrency(line.discount ?? line.descuento ?? 0);
  const taxable = line.taxable !== undefined ? Boolean(line.taxable) : line.aplica_iva !== undefined ? normalizeBoolean(line.aplica_iva) : Boolean(inventoryItem?.taxable);
  const taxRate = Number(line.taxRate ?? line.tarifa_iva ?? inventoryItem?.taxRate ?? 0) || 0;
  const subtotal = Math.max(quantity * unitPrice - discount, 0);
  const tax = taxable ? Math.round(subtotal * taxRate / 100) : 0;
  return {
    id: line.id || randomId("LIN"),
    sku,
    concept: cleanText(line.concept || line.concepto || inventoryItem?.name || "Concepto"),
    quantity,
    unitPrice,
    discount,
    taxable,
    taxRate,
    subtotal,
    tax,
    total: subtotal + tax
  };
}

function calculateInvoiceTotals(lines = [], totalOverride = 0) {
  const lineTotals = lines.reduce((totals, line) => ({
    subtotal: totals.subtotal + Number(line.subtotal || 0),
    discount: totals.discount + Number(line.discount || 0),
    tax: totals.tax + Number(line.tax || 0),
    total: totals.total + Number(line.total || 0)
  }), { subtotal: 0, discount: 0, tax: 0, total: 0 });

  if (!lines.length && totalOverride > 0) {
    return {
      subtotal: totalOverride,
      discount: 0,
      tax: 0,
      total: totalOverride
    };
  }

  return lineTotals;
}

function movementEffect(type = "", quantity = 0) {
  const amount = Number(quantity || 0) || 0;
  return ["entrada", "ajuste_positivo", "reversion_venta"].includes(type) ? amount : -amount;
}

function createInventoryMovement(data, payload = {}, actor = "portal") {
  const sku = normalizeSku(payload.sku);
  const index = data.inventory.findIndex((item) => item.sku === sku);
  if (!sku || index < 0) return null;
  const quantity = Math.abs(Number(payload.quantity || payload.cantidad || 0) || 0);
  if (quantity <= 0) return null;
  const now = new Date().toISOString();
  const type = cleanText(payload.type || payload.tipo_movimiento || "entrada").toLowerCase();
  const effect = movementEffect(type, quantity);
  const current = data.inventory[index];
  const nextStock = Number(current.stock || 0) + effect;
  const movement = {
    id: payload.id ? normalizeRecordId(payload.id, "MOV") : nextMovementId(data),
    date: normalizeDate(payload.date || payload.fecha) || now.slice(0, 10),
    sku,
    productNameSnapshot: current.name,
    type,
    quantity,
    effect,
    stockBefore: Number(current.stock || 0),
    stockAfter: nextStock,
    unitCost: parseCurrency(payload.unitCost ?? payload.costo_unitario ?? current.cost ?? 0),
    reference: cleanText(payload.reference || payload.referencia),
    sourceType: cleanText(payload.sourceType || payload.source_type || "manual"),
    sourceId: cleanText(payload.sourceId || payload.source_id),
    sourceImportId: cleanText(payload.sourceImportId || payload.source_import_id),
    status: cleanText(payload.status) || "activo",
    notes: cleanText(payload.notes || payload.notas),
    createdAt: now,
    createdBy: actor,
    auditTrail: [createAudit("inventory_movement_created", actor)]
  };
  data.inventory[index] = {
    ...current,
    stock: nextStock,
    updatedAt: now,
    updatedBy: actor,
    lastMovement: {
      type,
      quantity,
      effect,
      sourceId: movement.sourceId,
      at: now,
      warning: nextStock < 0 ? "Inventario negativo permitido para no bloquear la venta." : ""
    }
  };
  data.inventoryMovements.push(movement);
  return movement;
}

function applyInventorySale(data, lines = [], actor = "portal", sourceId = "", sourceImportId = "") {
  lines.forEach((line) => {
    if (!line.sku) return;
    createInventoryMovement(data, {
      sku: line.sku,
      type: "venta",
      quantity: line.quantity,
      sourceType: "factura",
      sourceId,
      sourceImportId,
      reference: sourceId,
      notes: `Salida automatica por factura ${sourceId}.`
    }, actor);
  });
}

function reverseInventorySale(data, lines = [], actor = "portal", sourceId = "", reason = "Reversion de factura.") {
  lines.forEach((line) => {
    if (!line.sku) return;
    createInventoryMovement(data, {
      sku: line.sku,
      type: "reversion_venta",
      quantity: line.quantity,
      sourceType: "factura",
      sourceId,
      reference: sourceId,
      notes: reason
    }, actor);
  });
}

function defaultData(companyId, companyName = "") {
  return {
    companyId,
    company: {
      name: companyName || "Mi empresa",
      nit: "",
      phone: "",
      email: "",
      address: "",
      logoDataUrl: "",
      color: "#1D4ED8"
    },
    customers: [],
    invoices: [],
    payments: [],
    inventory: [],
    inventoryMovements: [],
    orders: [],
    imports: [],
    auditTrail: [createAudit("company_initialized", "system", { note: "Empresa inicializada en el portal de clientes." })],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

function normalizeData(data = {}, companyId, companyName = "") {
  const base = defaultData(companyId, companyName);
  return {
    ...base,
    ...data,
    companyId,
    company: {
      ...base.company,
      ...(data.company || {}),
      name: cleanText(data.company?.name) || companyName || base.company.name
    },
    customers: Array.isArray(data.customers) ? data.customers : [],
    invoices: Array.isArray(data.invoices) ? data.invoices : [],
    payments: Array.isArray(data.payments) ? data.payments : [],
    inventory: Array.isArray(data.inventory) ? data.inventory.map((item) => ({
      status: "activo",
      notes: "",
      ...item,
      stock: Number(item.stock || 0) || 0
    })) : [],
    inventoryMovements: Array.isArray(data.inventoryMovements) ? data.inventoryMovements : [],
    orders: Array.isArray(data.orders) ? data.orders : [],
    imports: Array.isArray(data.imports) ? data.imports : [],
    auditTrail: Array.isArray(data.auditTrail) ? data.auditTrail : base.auditTrail
  };
}

function getPortalStore() {
  return getBlobStore(PORTAL_STORE_NAME);
}

export async function loadCompanyData(companyId, companyName = "") {
  const normalizedCompanyId = cleanText(companyId);
  if (!normalizedCompanyId) throw new Error("No se pudo identificar la empresa del portal.");
  const store = getPortalStore();
  const record = await store.get(`${COMPANY_PREFIX}${normalizedCompanyId}`, { type: "json" });
  if (!record) {
    const initial = defaultData(normalizedCompanyId, companyName);
    await store.setJSON(`${COMPANY_PREFIX}${normalizedCompanyId}`, initial);
    return withComputedFields(initial);
  }
  return withComputedFields(normalizeData(record, normalizedCompanyId, companyName));
}

export async function saveCompanyData(companyId, data, actor = "portal") {
  const normalizedCompanyId = cleanText(companyId);
  if (!normalizedCompanyId) throw new Error("No se pudo identificar la empresa del portal.");
  const {
    nextCustomerId: _nextCustomerId,
    nextInvoiceId: _nextInvoiceId,
    nextPaymentId: _nextPaymentId,
    nextOrderId: _nextOrderId,
    nextMovementId: _nextMovementId,
    templates: _templates,
    customerSummary: _customerSummary,
    dashboard: _dashboard,
    ...persistableData
  } = data || {};
  const nextData = normalizeData({
    ...persistableData,
    updatedAt: new Date().toISOString(),
    auditTrail: [
      ...(Array.isArray(persistableData.auditTrail) ? persistableData.auditTrail : []),
      createAudit("company_saved", actor)
    ]
  }, normalizedCompanyId, persistableData?.company?.name);
  await getPortalStore().setJSON(`${COMPANY_PREFIX}${normalizedCompanyId}`, nextData);
  return withComputedFields(nextData);
}

function findCustomer(data, customerId) {
  const normalizedId = normalizeCustomerId(customerId);
  return data.customers.find((customer) => customer.id === normalizedId) || null;
}

function ensureHistoricalCustomer(data, customerId, customerName, actor = "portal", warnings = []) {
  const id = normalizeCustomerId(customerId);
  const name = cleanText(customerName);
  if (!id) throw new Error("Falta el ID del cliente.");
  if (!name) throw new Error("Falta el nombre del cliente.");

  const existing = findCustomer(data, id);
  if (existing?.name && !compareExactName(existing.name, name)) {
    throw new Error(`El ID ${id} existe, pero el nombre no coincide exactamente con el maestro de clientes.`);
  }

  if (existing) {
    if (!existing.name) {
      existing.name = name;
      existing.updatedAt = new Date().toISOString();
      existing.updatedBy = actor;
      existing.auditTrail = [...(existing.auditTrail || []), createAudit("customer_name_assigned", actor, { source: "import" })];
      warnings.push({ row: "", field: "nombre_cliente", value: name, message: `El ID ${id} estaba reservado sin nombre y se asignara al cliente indicado.` });
    }
    return existing;
  }

  const now = new Date().toISOString();
  const customer = {
    id,
    name,
    alternateName: "",
    documentNumber: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    department: "",
    zone: "",
    geographyStatus: "",
    notes: "Creado desde cargue historico.",
    dataStatus: "pendiente_actualizacion",
    updateAlertShownAt: "",
    updateConfirmedAt: "",
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
    auditTrail: [createAudit("customer_created_from_initial_import", actor)]
  };
  data.customers.push(customer);
  warnings.push({ row: "", field: "id_cliente", value: id, message: `El ID ${id} no existia y se creara como cliente historico pendiente de actualizacion.` });
  return customer;
}

function paymentAmount(payment = {}) {
  return Number(payment.totalApplied || payment.netReceived || payment.grossAmount || 0) || 0;
}

function parseDateOnly(value = "") {
  const normalized = normalizeDate(value);
  if (!normalized) return null;
  const [year, month, day] = normalized.split("-").map(Number);
  if (!year || !month || !day) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function daysBetweenDates(left, right) {
  if (!left || !right) return 0;
  return Math.round((left.getTime() - right.getTime()) / 86400000);
}

function cutoffDateOnly(value = new Date()) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getFullYear(), value.getMonth(), value.getDate()));
  }
  return parseDateOnly(value) || cutoffDateOnly(new Date());
}

function emptyAgingBuckets() {
  return {
    current: 0,
    dueToday: 0,
    upcoming7: 0,
    upcoming15: 0,
    upcoming30: 0,
    overdue0To30: 0,
    overdue31To60: 0,
    overdue61To90: 0,
    overdueOver90: 0
  };
}

function agingBucketForInvoice(invoice = {}, cutoff = cutoffDateOnly()) {
  const dueDate = parseDateOnly(invoice.dueDate);
  if (!dueDate) {
    return { bucket: "current", label: "Sin vencimiento", daysOverdue: 0, daysToDue: null };
  }
  const daysToDue = daysBetweenDates(dueDate, cutoff);
  if (daysToDue > 30) return { bucket: "current", label: "No vencida", daysOverdue: 0, daysToDue };
  if (daysToDue > 15) return { bucket: "upcoming30", label: "Vence en 16 a 30 dias", daysOverdue: 0, daysToDue };
  if (daysToDue > 7) return { bucket: "upcoming15", label: "Vence en 8 a 15 dias", daysOverdue: 0, daysToDue };
  if (daysToDue > 0) return { bucket: "upcoming7", label: "Vence en 1 a 7 dias", daysOverdue: 0, daysToDue };
  if (daysToDue === 0) return { bucket: "dueToday", label: "Vence hoy", daysOverdue: 0, daysToDue: 0 };

  const daysOverdue = Math.abs(daysToDue);
  if (daysOverdue <= 30) return { bucket: "overdue0To30", label: "Vencida 1 a 30 dias", daysOverdue, daysToDue };
  if (daysOverdue <= 60) return { bucket: "overdue31To60", label: "Vencida 31 a 60 dias", daysOverdue, daysToDue };
  if (daysOverdue <= 90) return { bucket: "overdue61To90", label: "Vencida 61 a 90 dias", daysOverdue, daysToDue };
  return { bucket: "overdueOver90", label: "Vencida mas de 90 dias", daysOverdue, daysToDue };
}

function sortByPortfolioDate(left = {}, right = {}) {
  const leftDate = normalizeDate(left.dueDate || left.date) || "9999-12-31";
  const rightDate = normalizeDate(right.dueDate || right.date) || "9999-12-31";
  if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
  return String(left.id || "").localeCompare(String(right.id || ""), "es");
}

function findReceivableInvoice(invoiceMap, invoiceId = "") {
  const id = cleanText(invoiceId);
  if (!id) return null;
  const normalized = normalizeRecordId(id, "FAC");
  return invoiceMap.get(id)
    || invoiceMap.get(normalized)
    || Array.from(invoiceMap.values()).find((entry) => cleanText(entry.invoice.externalReference) === id || cleanText(entry.invoice.externalReference) === normalized)
    || null;
}

function buildReceivableLedger(data = {}, customerId = "", cutoffValue = new Date()) {
  const id = normalizeCustomerId(customerId);
  const cutoff = cutoffDateOnly(cutoffValue);
  const invoices = (data.invoices || [])
    .filter((invoice) => invoice.customerId === id && invoice.status !== "anulada")
    .sort(sortByPortfolioDate);
  const payments = (data.payments || [])
    .filter((payment) => payment.customerId === id && payment.status !== "anulado")
    .sort((left, right) => {
      const leftDate = normalizeDate(left.date) || "9999-12-31";
      const rightDate = normalizeDate(right.date) || "9999-12-31";
      if (leftDate !== rightDate) return leftDate.localeCompare(rightDate);
      return String(left.id || "").localeCompare(String(right.id || ""), "es");
    });

  const receivables = invoices.map((invoice) => ({
    invoice,
    id: invoice.id,
    total: Number(invoice.total || 0) || 0,
    paidDirect: 0,
    paidFifo: 0,
    balance: Number(invoice.total || 0) || 0,
    directPayments: [],
    fifoPayments: []
  }));
  const invoiceMap = new Map();
  receivables.forEach((entry) => {
    invoiceMap.set(entry.invoice.id, entry);
    if (entry.invoice.externalReference) invoiceMap.set(cleanText(entry.invoice.externalReference), entry);
  });

  const globalPool = [];
  payments.forEach((payment) => {
    let amount = paymentAmount(payment);
    if (amount <= 0) return;
    const directInvoice = findReceivableInvoice(invoiceMap, payment.invoiceId);
    if (directInvoice && directInvoice.balance > 0) {
      const applied = Math.min(directInvoice.balance, amount);
      directInvoice.paidDirect += applied;
      directInvoice.balance -= applied;
      directInvoice.directPayments.push({ id: payment.id, amount: applied });
      amount -= applied;
    }
    if (amount > 0) globalPool.push({ payment, amount });
  });

  let unappliedCredit = 0;
  globalPool.forEach((item) => {
    let amount = item.amount;
    receivables.forEach((entry) => {
      if (amount <= 0 || entry.balance <= 0) return;
      const applied = Math.min(entry.balance, amount);
      entry.paidFifo += applied;
      entry.balance -= applied;
      entry.fifoPayments.push({ id: item.payment.id, amount: applied });
      amount -= applied;
    });
    unappliedCredit += Math.max(amount, 0);
  });

  const aging = emptyAgingBuckets();
  const enrichedInvoices = receivables.map((entry) => {
    const classification = agingBucketForInvoice(entry.invoice, cutoff);
    const balance = Math.max(Math.round(entry.balance), 0);
    if (balance > 0) aging[classification.bucket] += balance;
    const paid = Math.round(entry.paidDirect + entry.paidFifo);
    return {
      ...entry.invoice,
      total: Math.round(entry.total),
      totalLabel: formatMoney(entry.total),
      paid,
      paidDirect: Math.round(entry.paidDirect),
      paidFifo: Math.round(entry.paidFifo),
      paidLabel: formatMoney(paid),
      balance,
      balanceLabel: formatMoney(balance),
      ageBucket: classification.bucket,
      ageLabel: balance > 0 ? classification.label : "Pagada",
      daysOverdue: classification.daysOverdue,
      daysToDue: classification.daysToDue,
      directPaymentIds: entry.directPayments.map((payment) => payment.id),
      fifoPaymentIds: entry.fifoPayments.map((payment) => payment.id)
    };
  });

  const billed = invoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const paid = payments.reduce((sum, payment) => sum + paymentAmount(payment), 0);
  const balance = enrichedInvoices.reduce((sum, invoice) => sum + Number(invoice.balance || 0), 0);
  const overdue = aging.overdue0To30 + aging.overdue31To60 + aging.overdue61To90 + aging.overdueOver90;
  const upcoming = aging.dueToday + aging.upcoming7 + aging.upcoming15 + aging.upcoming30;

  return {
    invoices: enrichedInvoices,
    payments,
    billed: Math.round(billed),
    paid: Math.round(paid),
    balance: Math.round(balance),
    unappliedCredit: Math.round(unappliedCredit),
    overdue: Math.round(overdue),
    upcoming: Math.round(upcoming),
    aging,
    agingLabels: Object.fromEntries(Object.entries(aging).map(([key, value]) => [key, formatMoney(value)])),
    billedLabel: formatMoney(billed),
    paidLabel: formatMoney(paid),
    balanceLabel: formatMoney(balance),
    overdueLabel: formatMoney(overdue),
    upcomingLabel: formatMoney(upcoming),
    unappliedCreditLabel: formatMoney(unappliedCredit),
    overdueInvoicesCount: enrichedInvoices.filter((invoice) => invoice.balance > 0 && String(invoice.ageBucket).startsWith("overdue")).length,
    dueSoonInvoicesCount: enrichedInvoices.filter((invoice) => invoice.balance > 0 && ["dueToday", "upcoming7"].includes(invoice.ageBucket)).length
  };
}

function customerBalances(data = {}) {
  return (data.customers || []).map((customer) => {
    const ledger = buildReceivableLedger(data, customer.id);
    return {
      ...customer,
      invoicesCount: ledger.invoices.length,
      paymentsCount: ledger.payments.length,
      receivableInvoices: ledger.invoices,
      aging: ledger.aging,
      agingLabels: ledger.agingLabels,
      billed: ledger.billed,
      paid: ledger.paid,
      balance: ledger.balance,
      overdue: ledger.overdue,
      upcoming: ledger.upcoming,
      unappliedCredit: ledger.unappliedCredit,
      billedLabel: ledger.billedLabel,
      paidLabel: ledger.paidLabel,
      balanceLabel: ledger.balanceLabel,
      overdueLabel: ledger.overdueLabel,
      upcomingLabel: ledger.upcomingLabel,
      unappliedCreditLabel: ledger.unappliedCreditLabel,
      overdueInvoicesCount: ledger.overdueInvoicesCount,
      dueSoonInvoicesCount: ledger.dueSoonInvoicesCount,
      missingFields: ["documentNumber", "phone"].filter((field) => !cleanText(customer[field]))
    };
  });
}

function customerFinancialSnapshot(data, customerId) {
  const id = normalizeCustomerId(customerId);
  const ledger = buildReceivableLedger(data, id);
  const orders = (data.orders || []).filter((order) => order.customerId === id);
  return {
    invoicesCount: ledger.invoices.length,
    paymentsCount: ledger.payments.length,
    ordersCount: orders.length,
    billed: ledger.billed,
    paid: ledger.paid,
    balance: ledger.balance,
    balanceLabel: ledger.balanceLabel
  };
}

function customerDuplicateCandidateFromCustomer(data, customer) {
  return {
    source: "sistema",
    id: customer.id,
    name: customer.name || "Cliente reservado",
    documentNumber: customer.documentNumber || "",
    phone: customer.phone || "",
    email: customer.email || "",
    city: customer.city || "",
    department: customer.department || "",
    ...customerFinancialSnapshot(data, customer.id)
  };
}

function customerDuplicateCandidateFromRow(row, rowNumber) {
  return {
    source: "archivo",
    row: rowNumber,
    id: normalizeCustomerId(row.id_cliente),
    name: cleanText(row.nombre_cliente) || "Cliente reservado",
    documentNumber: cleanText(row.documento),
    phone: cleanText(row.telefono),
    email: cleanText(row.correo).toLowerCase(),
    city: cleanText(row.ciudad),
    department: "",
    invoicesCount: 0,
    paymentsCount: 0,
    ordersCount: 0,
    billed: 0,
    paid: 0,
    balance: 0,
    balanceLabel: formatMoney(0)
  };
}

function documentDuplicateError(data, incomingCustomer, duplicates) {
  const documentNumber = normalizeDocument(incomingCustomer.documentNumber);
  const error = new Error(`El documento ${documentNumber} ya esta asociado a otro cliente.`);
  error.status = 409;
  error.code = "DUPLICATE_CUSTOMER_DOCUMENT";
  error.duplicate = {
    documentNumber,
    current: {
      source: "formulario",
      id: normalizeCustomerId(incomingCustomer.id),
      name: cleanText(incomingCustomer.name),
      documentNumber,
      phone: cleanText(incomingCustomer.phone),
      email: cleanText(incomingCustomer.email).toLowerCase()
    },
    candidates: duplicates.map((customer) => customerDuplicateCandidateFromCustomer(data, customer))
  };
  return error;
}

function buildCustomerDuplicateGroups(data, rows = []) {
  const byDocument = new Map();
  const add = (documentNumber, candidate) => {
    const key = normalizeDocument(documentNumber);
    if (!key) return;
    const group = byDocument.get(key) || { documentNumber: key, candidates: [] };
    group.candidates.push(candidate);
    byDocument.set(key, group);
  };

  (data.customers || []).forEach((customer) => {
    if (hasRealDocument(customer.documentNumber)) add(customer.documentNumber, customerDuplicateCandidateFromCustomer(data, customer));
  });
  rows.forEach((row, index) => {
    if (hasRealDocument(row.documento)) add(row.documento, customerDuplicateCandidateFromRow(row, index + 2));
  });

  return Array.from(byDocument.values())
    .map((group) => {
      const fileCandidates = group.candidates.filter((candidate) => candidate.source === "archivo");
      const systemCandidates = group.candidates.filter((candidate) => candidate.source === "sistema");
      const distinctIds = new Set(group.candidates.map((candidate) => candidate.id).filter(Boolean));
      const repeatedFileRows = fileCandidates.length > 1;
      const crossesSystem = systemCandidates.length > 0 && fileCandidates.some((candidate) => !candidate.id || !systemCandidates.some((current) => current.id === candidate.id));
      const duplicatedInSystem = systemCandidates.length > 1;
      const duplicatedById = distinctIds.size > 1;
      const shouldReview = repeatedFileRows || crossesSystem || duplicatedInSystem || duplicatedById;
      if (!shouldReview) return null;
      const recommended = systemCandidates[0]?.id || fileCandidates.find((candidate) => candidate.id)?.id || "__AUTO__";
      return {
        ...group,
        recommendedPrimaryId: recommended,
        candidates: group.candidates,
        reason: duplicatedInSystem
          ? "El documento ya existe en varios clientes del sistema."
          : crossesSystem
            ? "El documento del archivo ya existe en el sistema."
            : "El documento aparece mas de una vez dentro del archivo."
      };
    })
    .filter(Boolean);
}

function pickText(...values) {
  return values.map((value) => cleanText(value)).find(Boolean) || "";
}

function pickLowerEmail(...values) {
  return pickText(...values).toLowerCase();
}

function buildCustomerFromImportRow(row, id, actor, now, imported = true) {
  const location = resolveCityDepartment(row.ciudad, row.departamento);
  const name = cleanText(row.nombre_cliente);
  const hasCoreContactData = cleanText(row.documento) || cleanText(row.telefono) || cleanText(row.correo);
  return {
    id,
    name,
    alternateName: cleanText(row.nombre_alterno),
    documentNumber: normalizeDocument(row.documento) || cleanText(row.documento),
    phone: cleanText(row.telefono),
    email: cleanText(row.correo).toLowerCase(),
    address: cleanText(row.direccion),
    city: location.city,
    department: location.department,
    zone: cleanText(row.zona),
    geographyStatus: location.geographyStatus,
    notes: cleanText(row.notas) || (!name ? "Cliente reservado pendiente por asignar." : ""),
    dataStatus: !name ? "pendiente_asignacion" : hasCoreContactData && cleanText(row.documento) && cleanText(row.telefono) ? "actualizado" : "pendiente_actualizacion",
    updateAlertShownAt: "",
    updateConfirmedAt: "",
    createdAt: now,
    createdBy: actor,
    updatedAt: now,
    updatedBy: actor,
    auditTrail: [createAudit(imported ? "customer_imported" : "customer_created", actor)]
  };
}

function mergeCustomerRecords(data, primaryId, secondaryIds = [], incomingCustomer = {}, actor = "portal") {
  const now = new Date().toISOString();
  const normalizedPrimaryId = normalizeCustomerId(primaryId) || nextCustomerId(data.customers);
  const uniqueSecondaryIds = [...new Set((secondaryIds || []).map(normalizeCustomerId).filter((id) => id && id !== normalizedPrimaryId))];
  const primaryExisting = data.customers.find((customer) => customer.id === normalizedPrimaryId) || {};
  const secondaryCustomers = data.customers.filter((customer) => uniqueSecondaryIds.includes(customer.id));
  const incoming = incomingCustomer || {};
  const location = resolveCityDepartment(incoming.city || primaryExisting.city, incoming.department || primaryExisting.department);
  const mergedIds = [
    ...(Array.isArray(primaryExisting.mergedCustomerIds) ? primaryExisting.mergedCustomerIds : []),
    ...secondaryCustomers.flatMap((customer) => [customer.id, ...(Array.isArray(customer.mergedCustomerIds) ? customer.mergedCustomerIds : [])])
  ].filter(Boolean);
  const merged = {
    ...primaryExisting,
    id: normalizedPrimaryId,
    name: pickText(incoming.name, primaryExisting.name, ...secondaryCustomers.map((customer) => customer.name)),
    alternateName: pickText(incoming.alternateName, primaryExisting.alternateName, ...secondaryCustomers.map((customer) => customer.alternateName)),
    documentNumber: normalizeDocument(incoming.documentNumber) || normalizeDocument(primaryExisting.documentNumber) || secondaryCustomers.map((customer) => normalizeDocument(customer.documentNumber)).find(Boolean) || cleanText(incoming.documentNumber || primaryExisting.documentNumber),
    phone: pickText(incoming.phone, primaryExisting.phone, ...secondaryCustomers.map((customer) => customer.phone)),
    email: pickLowerEmail(incoming.email, primaryExisting.email, ...secondaryCustomers.map((customer) => customer.email)),
    address: pickText(incoming.address, primaryExisting.address, ...secondaryCustomers.map((customer) => customer.address)),
    city: location.city || pickText(primaryExisting.city, ...secondaryCustomers.map((customer) => customer.city)),
    department: location.department || pickText(primaryExisting.department, ...secondaryCustomers.map((customer) => customer.department)),
    zone: pickText(incoming.zone, primaryExisting.zone, ...secondaryCustomers.map((customer) => customer.zone)),
    geographyStatus: location.geographyStatus || primaryExisting.geographyStatus || secondaryCustomers.find((customer) => customer.geographyStatus)?.geographyStatus || "",
    notes: [
      pickText(incoming.notes, primaryExisting.notes),
      ...secondaryCustomers.map((customer) => cleanText(customer.notes)).filter(Boolean),
      uniqueSecondaryIds.length ? `Unificado con ${uniqueSecondaryIds.join(", ")}.` : ""
    ].filter(Boolean).join(" | "),
    dataStatus: "actualizado",
    updateConfirmedAt: now,
    updatedAt: now,
    updatedBy: actor,
    createdAt: primaryExisting.createdAt || now,
    createdBy: primaryExisting.createdBy || actor,
    mergedCustomerIds: [...new Set(mergedIds)],
    auditTrail: [
      ...(primaryExisting.auditTrail || []),
      createAudit("customer_merged", actor, { primaryId: normalizedPrimaryId, secondaryIds: uniqueSecondaryIds })
    ]
  };
  if (!merged.name) throw new Error("No fue posible unificar: el cliente principal no tiene nombre.");

  const rewrite = (record) => uniqueSecondaryIds.includes(record.customerId)
    ? { ...record, customerId: normalizedPrimaryId, customerNameSnapshot: merged.name, updatedAt: now, updatedBy: actor }
    : record;
  data.invoices = (data.invoices || []).map(rewrite);
  data.payments = (data.payments || []).map(rewrite);
  data.orders = (data.orders || []).map(rewrite);
  data.customers = [
    ...data.customers.filter((customer) => !uniqueSecondaryIds.includes(customer.id) && customer.id !== normalizedPrimaryId),
    merged
  ].sort((left, right) => String(left.id).localeCompare(String(right.id), "es"));
  data.auditTrail = [
    ...(data.auditTrail || []),
    createAudit("customer_ids_released_after_merge", actor, { primaryId: normalizedPrimaryId, releasedIds: uniqueSecondaryIds })
  ];
  return merged;
}

function topDebtors(data = {}) {
  return customerBalances(data)
    .filter((customer) => customer.balance > 0)
    .sort((left, right) => right.balance - left.balance)
    .slice(0, 20);
}

function buildDashboard(data = {}) {
  const invoices = data.invoices || [];
  const payments = data.payments || [];
  const balances = customerBalances(data);
  const totalBilled = balances.reduce((sum, customer) => sum + Number(customer.billed || 0), 0);
  const totalPaid = balances.reduce((sum, customer) => sum + Number(customer.paid || 0), 0);
  const pending = balances.reduce((sum, customer) => sum + Number(customer.balance || 0), 0);
  const aging = balances.reduce((totals, customer) => {
    Object.entries(customer.aging || {}).forEach(([key, value]) => {
      totals[key] = (totals[key] || 0) + Number(value || 0);
    });
    return totals;
  }, emptyAgingBuckets());
  const overdue = aging.overdue0To30 + aging.overdue31To60 + aging.overdue61To90 + aging.overdueOver90;
  const upcoming = aging.dueToday + aging.upcoming7 + aging.upcoming15 + aging.upcoming30;
  return {
    customersCount: data.customers.length,
    invoicesCount: invoices.filter((invoice) => invoice.status !== "anulada").length,
    paymentsCount: payments.filter((payment) => payment.status !== "anulado").length,
    inventoryCount: data.inventory.length,
    inventoryMovementsCount: data.inventoryMovements.length,
    ordersCount: data.orders.length,
    totalBilled,
    totalPaid,
    pending,
    totalBilledLabel: formatMoney(totalBilled),
    totalPaidLabel: formatMoney(totalPaid),
    pendingLabel: formatMoney(pending),
    aging,
    agingLabels: Object.fromEntries(Object.entries(aging).map(([key, value]) => [key, formatMoney(value)])),
    overdue,
    overdueLabel: formatMoney(overdue),
    upcoming,
    upcomingLabel: formatMoney(upcoming),
    currentLabel: formatMoney(aging.current),
    dueTodayLabel: formatMoney(aging.dueToday),
    overdueInvoicesCount: balances.reduce((sum, customer) => sum + Number(customer.overdueInvoicesCount || 0), 0),
    dueSoonInvoicesCount: balances.reduce((sum, customer) => sum + Number(customer.dueSoonInvoicesCount || 0), 0),
    unappliedCredit: balances.reduce((sum, customer) => sum + Number(customer.unappliedCredit || 0), 0),
    unappliedCreditLabel: formatMoney(balances.reduce((sum, customer) => sum + Number(customer.unappliedCredit || 0), 0)),
    outdatedCustomersCount: balances.filter((customer) => customer.missingFields.length).length,
    negativeInventoryCount: data.inventory.filter((item) => Number(item.stock || 0) < 0).length,
    topDebtors: balances
      .filter((customer) => customer.balance > 0)
      .sort((left, right) => right.balance - left.balance)
      .slice(0, 20)
  };
}

function withComputedFields(data = {}) {
  const normalized = normalizeData(data, data.companyId, data.company?.name);
  return {
    ...normalized,
    nextCustomerId: nextCustomerId(normalized.customers),
    nextInvoiceId: nextInvoiceId(normalized),
    nextPaymentId: nextPaymentId(normalized),
    nextOrderId: nextOrderId(normalized),
    nextMovementId: nextMovementId(normalized),
    templates: IMPORT_TEMPLATES,
    customerSummary: customerBalances(normalized),
    dashboard: buildDashboard(normalized)
  };
}

export async function upsertPortalEntity(companyId, type, payload = {}, actor = "portal") {
  const data = await loadCompanyData(companyId);
  const now = new Date().toISOString();

  if (type === "company") {
    data.company = {
      ...data.company,
      name: cleanText(payload.name) || data.company.name,
      nit: cleanText(payload.nit),
      phone: cleanText(payload.phone),
      email: cleanText(payload.email).toLowerCase(),
      address: cleanText(payload.address),
      logoDataUrl: Object.prototype.hasOwnProperty.call(payload, "logoDataUrl") ? String(payload.logoDataUrl || "") : String(data.company.logoDataUrl || ""),
      color: cleanText(payload.color) || data.company.color
    };
  } else if (type === "customer") {
    const id = normalizeCustomerId(payload.id) || nextCustomerId(data.customers);
    const existingIndex = data.customers.findIndex((customer) => customer.id === id);
    const existing = existingIndex >= 0 ? data.customers[existingIndex] : {};
    const documentKey = normalizeDocument(payload.documentNumber);
    if (documentKey && !payload.skipDocumentDuplicateCheck) {
      const duplicates = data.customers.filter((customer) => customer.id !== id && normalizeDocument(customer.documentNumber) === documentKey);
      if (duplicates.length) throw documentDuplicateError(data, { ...payload, id, documentNumber: documentKey }, duplicates);
    }
    const customer = {
      ...existing,
      id,
      name: cleanText(payload.name),
      alternateName: cleanText(payload.alternateName),
      documentNumber: documentKey || cleanText(payload.documentNumber),
      phone: cleanText(payload.phone),
      email: cleanText(payload.email).toLowerCase(),
      address: cleanText(payload.address),
      ...resolveCityDepartment(payload.city, payload.department),
      zone: cleanText(payload.zone),
      notes: cleanText(payload.notes),
      dataStatus: payload.updateConfirmed ? "actualizado" : existing.dataStatus || "pendiente_actualizacion",
      updateAlertShownAt: existing.updateAlertShownAt || (payload.alertShown ? now : ""),
      updateConfirmedAt: payload.updateConfirmed ? now : existing.updateConfirmedAt || "",
      createdAt: existing.createdAt || now,
      createdBy: existing.createdBy || actor,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(existing.auditTrail || []), createAudit(existingIndex >= 0 ? "customer_updated" : "customer_created", actor)]
    };
    if (!customer.name) throw new Error("Ingresa el nombre del cliente.");
    data.customers = existingIndex >= 0
      ? data.customers.map((item, index) => index === existingIndex ? customer : item)
      : [...data.customers, customer];
  } else if (type === "mergeCustomers") {
    const incoming = payload.incomingCustomer || {};
    const documentKey = normalizeDocument(payload.documentNumber || incoming.documentNumber);
    const primaryId = normalizeCustomerId(payload.primaryId || incoming.id) || nextCustomerId(data.customers);
    const explicitSecondaryIds = Array.isArray(payload.secondaryIds) ? payload.secondaryIds.map(normalizeCustomerId) : [];
    const documentSecondaryIds = documentKey
      ? data.customers.filter((customer) => customer.id !== primaryId && normalizeDocument(customer.documentNumber) === documentKey).map((customer) => customer.id)
      : [];
    mergeCustomerRecords(data, primaryId, [...explicitSecondaryIds, ...documentSecondaryIds], {
      ...incoming,
      id: primaryId,
      documentNumber: documentKey || incoming.documentNumber
    }, actor);
  } else if (type === "invoice") {
    const id = cleanText(payload.id) ? normalizeRecordId(payload.id, "FAC") : nextInvoiceId(data);
    const existingIndex = data.invoices.findIndex((invoice) => invoice.id === id);
    const existing = existingIndex >= 0 ? data.invoices[existingIndex] : {};
    const customer = findCustomer(data, payload.customerId);
    if (!customer) throw new Error("Selecciona un cliente valido para la factura.");
    const lines = (Array.isArray(payload.lines) ? payload.lines : []).map((line) => normalizeLine(line, data.inventory));
    const totalOverride = parseCurrency(payload.total);
    const totals = calculateInvoiceTotals(lines, totalOverride);
    const nextStatus = cleanText(payload.status) || "emitida";
    if (existingIndex >= 0 && (existing.lines || []).length && existing.status !== "anulada") {
      reverseInventorySale(data, existing.lines, actor, id, `Reversion automatica por actualizacion o anulacion de factura ${id}.`);
    }
    if (lines.length && nextStatus !== "anulada") applyInventorySale(data, lines, actor, id);
    const invoice = {
      ...existing,
      id,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      date: normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
      dueDate: normalizeDate(payload.dueDate),
      status: nextStatus,
      source: lines.length ? "manual_detallada" : "manual_resumida",
      notes: cleanText(payload.notes),
      externalReference: cleanText(payload.externalReference || existing.externalReference),
      lines,
      subtotal: totals.subtotal,
      discountTotal: totals.discount,
      taxTotal: totals.tax,
      total: totals.total,
      totalLabel: formatMoney(totals.total),
      createdAt: existing.createdAt || now,
      createdBy: existing.createdBy || actor,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(existing.auditTrail || []), createAudit(existingIndex >= 0 ? "invoice_updated" : "invoice_created", actor)]
    };
    if (invoice.total <= 0) throw new Error("Ingresa un valor total valido para la factura.");
    data.invoices = existingIndex >= 0
      ? data.invoices.map((item, index) => index === existingIndex ? invoice : item)
      : [...data.invoices, invoice];
  } else if (type === "order") {
    const id = cleanText(payload.id) ? normalizeRecordId(payload.id, "ORD") : nextOrderId(data);
    const existingIndex = data.orders.findIndex((order) => order.id === id);
    const existing = existingIndex >= 0 ? data.orders[existingIndex] : {};
    const customer = findCustomer(data, payload.customerId);
    if (!customer) throw new Error("Selecciona un cliente valido para la orden.");
    const lines = (Array.isArray(payload.lines) ? payload.lines : []).map((line) => normalizeLine(line, data.inventory));
    const totals = calculateInvoiceTotals(lines, 0);
    const order = {
      ...existing,
      id,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      date: normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
      dueDate: normalizeDate(payload.dueDate),
      status: cleanText(payload.status) || "borrador",
      source: "manual_detallada",
      notes: cleanText(payload.notes),
      externalReference: cleanText(payload.externalReference || existing.externalReference),
      showDiscountOnPdf: payload.showDiscountOnPdf !== false,
      showDiscountsOnPdf: payload.showDiscountOnPdf !== false,
      lines,
      subtotal: totals.subtotal,
      discountTotal: totals.discount,
      taxTotal: totals.tax,
      total: totals.total,
      totalLabel: formatMoney(totals.total),
      createdAt: existing.createdAt || now,
      createdBy: existing.createdBy || actor,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(existing.auditTrail || []), createAudit(existingIndex >= 0 ? "order_updated" : "order_created", actor)]
    };
    if (!lines.length || order.total <= 0) throw new Error("Agrega al menos una linea valida a la orden.");
    data.orders = existingIndex >= 0
      ? data.orders.map((item, index) => index === existingIndex ? order : item)
      : [...data.orders, order];
  } else if (type === "invoiceFromOrder") {
    const orderId = normalizeRecordId(payload.orderId, "ORD");
    const orderIndex = data.orders.findIndex((order) => order.id === orderId);
    if (orderIndex < 0) throw new Error("No se encontro la orden indicada.");
    const order = data.orders[orderIndex];
    if (order.status === "facturada" && order.convertedInvoiceId) {
      throw new Error(`La orden ya fue convertida en la factura ${order.convertedInvoiceId}.`);
    }
    const customer = findCustomer(data, order.customerId);
    if (!customer) throw new Error("La orden no tiene un cliente valido asociado.");
    const id = cleanText(payload.invoiceId || payload.id) ? normalizeRecordId(payload.invoiceId || payload.id, "FAC") : nextInvoiceId(data);
    if (data.invoices.some((invoice) => invoice.id === id)) throw new Error(`Ya existe una factura con el ID ${id}.`);
    const lines = (order.lines || []).map((line) => normalizeLine(line, data.inventory));
    const totals = calculateInvoiceTotals(lines, 0);
    if (!lines.length || totals.total <= 0) throw new Error("La orden no tiene lineas validas para facturar.");
    applyInventorySale(data, lines, actor, id);
    data.invoices = [
      ...data.invoices,
      {
        id,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        date: normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
        dueDate: normalizeDate(order.dueDate),
        status: "emitida",
        source: "orden_convertida",
        orderId: order.id,
        notes: cleanText(payload.notes) || `Factura generada desde la orden ${order.id}.`,
        externalReference: cleanText(payload.externalReference),
        lines,
        subtotal: totals.subtotal,
        discountTotal: totals.discount,
        taxTotal: totals.tax,
        total: totals.total,
        totalLabel: formatMoney(totals.total),
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
        auditTrail: [createAudit("invoice_created_from_order", actor, { orderId: order.id })]
      }
    ];
    data.orders[orderIndex] = {
      ...order,
      status: "facturada",
      convertedInvoiceId: id,
      convertedAt: now,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(order.auditTrail || []), createAudit("order_converted_to_invoice", actor, { invoiceId: id })]
    };
  } else if (type === "payment") {
    const id = cleanText(payload.id) ? normalizeRecordId(payload.id, "ABO") : nextPaymentId(data);
    const existingIndex = data.payments.findIndex((payment) => payment.id === id);
    const existing = existingIndex >= 0 ? data.payments[existingIndex] : {};
    const customer = findCustomer(data, payload.customerId);
    if (!customer) throw new Error("Selecciona un cliente valido para el abono.");
    const grossAmount = parseCurrency(payload.grossAmount);
    const retentions = {
      retefuente: parseCurrency(payload.retefuente),
      reteica: parseCurrency(payload.reteica),
      reteiva: parseCurrency(payload.reteiva),
      other: parseCurrency(payload.otherRetentions)
    };
    const retentionTotal = retentions.retefuente + retentions.reteica + retentions.reteiva + retentions.other;
    const netReceived = payload.netReceived !== undefined && String(payload.netReceived).trim()
      ? parseCurrency(payload.netReceived)
      : Math.max(grossAmount - retentionTotal, 0);
    const payment = {
      ...existing,
      id,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      invoiceId: cleanText(payload.invoiceId),
      date: normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
      grossAmount,
      retentions,
      retentionTotal,
      netReceived,
      totalApplied: grossAmount,
      method: cleanText(payload.method) || "No especificado",
      reference: cleanText(payload.reference),
      notes: cleanText(payload.notes),
      status: cleanText(payload.status) || "aplicado",
      createdAt: existing.createdAt || now,
      createdBy: existing.createdBy || actor,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(existing.auditTrail || []), createAudit(existingIndex >= 0 ? "payment_updated" : "payment_created", actor)]
    };
    if (grossAmount <= 0) throw new Error("Ingresa un valor bruto valido para el abono.");
    data.payments = existingIndex >= 0
      ? data.payments.map((item, index) => index === existingIndex ? payment : item)
      : [...data.payments, payment];
  } else if (type === "inventory") {
    const sku = normalizeSku(payload.sku);
    if (!sku) throw new Error("Ingresa el SKU del producto.");
    const existingIndex = data.inventory.findIndex((item) => item.sku === sku);
    const existing = existingIndex >= 0 ? data.inventory[existingIndex] : {};
    const item = {
      ...existing,
      sku,
      name: cleanText(payload.name),
      salePrice: parseCurrency(payload.salePrice),
      cost: parseCurrency(payload.cost),
      stock: Number(existing.stock || 0) || 0,
      taxable: Boolean(payload.taxable),
      taxRate: Number(payload.taxRate || 0) || 0,
      status: cleanText(payload.status) || existing.status || "activo",
      notes: cleanText(payload.notes),
      updatedAt: now,
      updatedBy: actor,
      createdAt: existing.createdAt || now,
      createdBy: existing.createdBy || actor
    };
    if (!item.name) throw new Error("Ingresa el nombre del producto.");
    data.inventory = existingIndex >= 0
      ? data.inventory.map((current, index) => index === existingIndex ? item : current)
      : [...data.inventory, item];
  } else if (type === "inventoryMovement") {
    const movementType = cleanText(payload.type || payload.tipo_movimiento).toLowerCase();
    if (!INVENTORY_MOVEMENT_TYPES.has(movementType)) throw new Error("Selecciona un tipo de movimiento valido.");
    const sku = normalizeSku(payload.sku);
    if (!sku || !data.inventory.some((item) => item.sku === sku)) throw new Error("Selecciona un SKU existente.");
    const quantity = Math.abs(Number(payload.quantity || payload.cantidad || 0) || 0);
    if (quantity <= 0) throw new Error("Ingresa una cantidad valida para el movimiento.");
    createInventoryMovement(data, {
      id: cleanText(payload.id),
      date: payload.date,
      sku,
      type: movementType,
      quantity,
      unitCost: payload.unitCost,
      reference: payload.reference,
      sourceType: "manual",
      notes: payload.notes
    }, actor);
  } else if (type === "revertImport") {
    revertImportRows(data, payload.importId, actor);
  } else {
    throw new Error(`Tipo de operacion no soportado: ${cleanText(type) || "sin tipo"}.`);
  }

  return saveCompanyData(companyId, data, actor);
}

function addImportError(errors, row, field, value, message, fix = "") {
  errors.push({ row, field, value: String(value || ""), message, fix });
}

function addImportWarning(warnings, row, field, value, message) {
  warnings.push({ row, field, value: String(value || ""), message });
}

function validateCustomerMatch(data, row, rowNumber, errors, warnings) {
  const id = normalizeCustomerId(row.id_cliente);
  const name = cleanText(row.nombre_cliente);
  if (!id) addImportError(errors, rowNumber, "id_cliente", row.id_cliente, "Falta el ID del cliente.", "Diligencia el ID cliente.");
  if (!name) addImportError(errors, rowNumber, "nombre_cliente", row.nombre_cliente, "Falta el nombre del cliente.", "Diligencia el nombre exactamente como aparece en el maestro.");
  if (!id || !name) return null;
  const customer = findCustomer(data, id);
  if (customer?.name && !compareExactName(customer.name, name)) {
    addImportError(errors, rowNumber, "nombre_cliente", name, `El ID ${id} existe, pero el nombre no coincide exactamente.`, `Usa el nombre registrado: ${customer.name}`);
  } else if (customer && !customer.name) {
    addImportWarning(warnings, rowNumber, "nombre_cliente", name, `El ID ${id} esta reservado sin nombre y se asignara al cliente indicado si confirmas el cargue.`);
  } else if (!customer) {
    addImportWarning(warnings, rowNumber, "id_cliente", id, `El ID ${id} no existe y se creara como cliente historico pendiente de actualizacion.`);
  }
  return { id, name, customer };
}

function validateCustomerImportLocation(row, rowNumber, warnings) {
  const city = cleanText(row.ciudad);
  if (!city) return resolveCityDepartment("", "");
  const location = resolveCityDepartment(city, row.departamento);
  if (location.geographyStatus === "pendiente_validacion") {
    addImportWarning(warnings, rowNumber, "ciudad", city, `No se reconocio la ciudad "${city}" en el catalogo. Se cargara con departamento "Por validar" para revision posterior.`);
  }
  return location;
}

export function validateImportRows(data, module, rows = [], options = {}) {
  const errors = [];
  const warnings = [];
  const normalizedModule = cleanText(module);
  const template = IMPORT_TEMPLATES[normalizedModule];
  if (!template) {
    return {
      ok: false,
      errors: [{ row: 0, field: "modulo", value: normalizedModule, message: "Tipo de cargue no soportado.", fix: "Selecciona una plantilla valida." }],
      warnings,
      summary: {}
    };
  }

  const headers = new Set(Object.keys(rows[0] || {}));
  template.headers.forEach((header) => {
    if (!headers.has(header)) addImportError(errors, 1, header, "", `Falta la columna obligatoria ${header}.`, "Descarga la plantilla oficial y conserva los encabezados.");
  });

  const mergeChoices = options.mergeChoices || {};
  const duplicateCustomerDocuments = normalizedModule === "clientes" ? buildCustomerDuplicateGroups(data, rows) : [];
  const duplicateDocumentsWithChoice = new Set(
    duplicateCustomerDocuments
      .filter((group) => mergeChoices[group.documentNumber])
      .map((group) => group.documentNumber)
  );

  const seenCustomers = new Set();
  const seenInventory = new Set();
  const seenInventoryUpdates = new Set();
  const seenHistoricalInvoices = new Set();
  const detailedDocuments = new Map();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (normalizedModule === "clientes") {
      const id = normalizeCustomerId(row.id_cliente);
      const name = cleanText(row.nombre_cliente);
      const documentKey = normalizeDocument(row.documento);
      const coveredByDocumentMerge = documentKey && duplicateDocumentsWithChoice.has(documentKey);
      if (!id && !name) addImportError(errors, rowNumber, "nombre_cliente", row.nombre_cliente, "Falta el nombre del cliente o un ID reservado.", "Diligencia el nombre para crear el cliente automaticamente o un ID para reservarlo.");
      if (!name) addImportWarning(warnings, rowNumber, "nombre_cliente", row.nombre_cliente, `El ID ${id || "sin ID"} se cargara como reservado pendiente por asignar.`);
      if (id && findCustomer(data, id) && !coveredByDocumentMerge) addImportError(errors, rowNumber, "id_cliente", id, `El ID ${id} ya existe y no puede usarse para crear otro cliente.`, "Usa el siguiente consecutivo disponible o actualiza el cliente existente desde el formulario.");
      if (id && seenCustomers.has(id)) addImportError(errors, rowNumber, "id_cliente", id, `El ID ${id} esta repetido dentro del archivo.`, "Cada cliente nuevo debe tener un ID unico.");
      if (id) seenCustomers.add(id);
      validateCustomerImportLocation(row, rowNumber, warnings);
    }

    if (normalizedModule === "facturas_historicas" || normalizedModule === "facturas_detalladas" || normalizedModule === "ordenes_detalladas") {
      validateCustomerMatch(data, row, rowNumber, errors, warnings);
      const recordId = cleanText(row.referencia_origen || row.id_factura || row.id_orden);
      const target = normalizedModule === "ordenes_detalladas" ? data.orders : data.invoices;
      if (recordId && target.some((item) => cleanText(item.externalReference) === recordId)) {
        addImportError(errors, rowNumber, "referencia_origen", recordId, `Ya existe un documento con la referencia de origen ${recordId}.`, "Usa una referencia nueva o edita el documento existente.");
      }
      if (normalizedModule === "facturas_historicas" && recordId) {
        if (seenHistoricalInvoices.has(recordId)) addImportError(errors, rowNumber, "referencia_origen", recordId, `La referencia ${recordId} esta repetida dentro del archivo.`, "Cada factura historica resumida debe tener una sola fila por referencia.");
        seenHistoricalInvoices.add(recordId);
      }
      if (normalizedModule === "facturas_detalladas" || normalizedModule === "ordenes_detalladas") {
        const documentKey = recordId || `fila-${rowNumber}`;
        const signature = [
          normalizeCustomerId(row.id_cliente),
          cleanText(row.nombre_cliente),
          normalizeDate(row.fecha),
          normalizeDate(row.fecha_vencimiento)
        ].join("|");
        const previous = detailedDocuments.get(`${normalizedModule}:${documentKey}`);
        if (previous && previous !== signature) {
          addImportError(errors, rowNumber, "referencia_origen", documentKey, `El documento ${documentKey} tiene datos generales inconsistentes entre lineas.`, "Todas las lineas del mismo documento deben conservar cliente, nombre y fechas.");
        }
        if (!previous) detailedDocuments.set(`${normalizedModule}:${documentKey}`, signature);
      }
      const total = normalizedModule === "facturas_historicas" ? parseCurrency(row.valor_total) : parseCurrency(row.precio_unitario) * (Number(row.cantidad || 0) || 0);
      if (total <= 0) addImportError(errors, rowNumber, normalizedModule === "facturas_historicas" ? "valor_total" : "precio_unitario", row.valor_total || row.precio_unitario, "El valor del documento debe ser mayor a cero.", "Revisa que el valor sea numerico.");
      if (!normalizeDate(row.fecha)) addImportError(errors, rowNumber, "fecha", row.fecha, "Fecha invalida.", "Usa formato AAAA-MM-DD.");
    }

    if (normalizedModule === "abonos") {
      validateCustomerMatch(data, row, rowNumber, errors, warnings);
      const amount = parseCurrency(row.valor_bruto);
      if (amount <= 0) addImportError(errors, rowNumber, "valor_bruto", row.valor_bruto, "El valor bruto del abono debe ser mayor a cero.", "Revisa que el valor sea numerico.");
      if (!normalizeDate(row.fecha)) addImportError(errors, rowNumber, "fecha", row.fecha, "Fecha invalida.", "Usa formato AAAA-MM-DD.");
      const invoiceId = cleanText(row.id_factura);
      const normalizedInvoiceId = invoiceId ? normalizeRecordId(invoiceId, "FAC") : "";
      if (normalizedInvoiceId && !data.invoices.some((invoice) => invoice.id === normalizedInvoiceId)) {
        addImportWarning(warnings, rowNumber, "id_factura", normalizedInvoiceId, "La factura indicada aun no existe. El abono se cargara al cliente, pero quedara pendiente de conciliacion con factura.");
      }
    }

    if (normalizedModule === "inventario") {
      const sku = normalizeSku(row.sku);
      const name = cleanText(row.nombre_producto);
      if (!sku) addImportError(errors, rowNumber, "sku", row.sku, "Falta el SKU o codigo del producto.", "Diligencia un SKU unico.");
      if (!name) addImportError(errors, rowNumber, "nombre_producto", row.nombre_producto, "Falta el nombre del producto.", "Diligencia el nombre.");
      if (sku && data.inventory.some((item) => item.sku === sku)) addImportError(errors, rowNumber, "sku", sku, `El SKU ${sku} ya existe.`, "Modifica el producto desde inventario o usa un SKU nuevo.");
      if (sku && seenInventory.has(sku)) addImportError(errors, rowNumber, "sku", sku, `El SKU ${sku} esta repetido dentro del archivo.`, "Cada producto debe tener un SKU unico.");
      if (sku) seenInventory.add(sku);
    }

    if (normalizedModule === "actualizacion_productos") {
      const sku = normalizeSku(row.sku);
      if (!sku) addImportError(errors, rowNumber, "sku", row.sku, "Falta el SKU o codigo del producto.", "Diligencia un SKU existente.");
      if (sku && !data.inventory.some((item) => item.sku === sku)) addImportError(errors, rowNumber, "sku", sku, `El SKU ${sku} no existe.`, "Crea primero el producto en inventario maestro.");
      if (sku && seenInventoryUpdates.has(sku)) addImportError(errors, rowNumber, "sku", sku, `El SKU ${sku} esta repetido dentro del archivo.`, "Cada producto debe actualizarse una sola vez por archivo.");
      if (sku) seenInventoryUpdates.add(sku);
    }

    if (normalizedModule === "movimientos_inventario") {
      const sku = normalizeSku(row.sku);
      const type = cleanText(row.tipo_movimiento).toLowerCase();
      const quantity = Math.abs(Number(row.cantidad || 0) || 0);
      if (!normalizeDate(row.fecha)) addImportError(errors, rowNumber, "fecha", row.fecha, "Fecha invalida.", "Usa formato AAAA-MM-DD.");
      if (!sku) addImportError(errors, rowNumber, "sku", row.sku, "Falta el SKU.", "Diligencia un SKU existente.");
      if (sku && !data.inventory.some((item) => item.sku === sku)) addImportError(errors, rowNumber, "sku", sku, `El SKU ${sku} no existe.`, "Crea primero el producto en inventario maestro.");
      if (!INVENTORY_MOVEMENT_TYPES.has(type)) addImportError(errors, rowNumber, "tipo_movimiento", row.tipo_movimiento, "Tipo de movimiento no valido.", "Usa entrada, salida, ajuste_positivo o ajuste_negativo.");
      if (quantity <= 0) addImportError(errors, rowNumber, "cantidad", row.cantidad, "La cantidad debe ser mayor a cero.", "Diligencia una cantidad positiva.");
    }
  });

  if (normalizedModule === "clientes" && duplicateCustomerDocuments.length) {
    duplicateCustomerDocuments.forEach((group) => {
      const choice = cleanText(mergeChoices[group.documentNumber]);
      const candidateIds = new Set(group.candidates.map((candidate) => candidate.id).filter(Boolean));
      const hasSystemCandidate = group.candidates.some((candidate) => candidate.source === "sistema");
      if (!choice) {
        addImportError(errors, 0, "documento", group.documentNumber, `El documento ${group.documentNumber} tiene posibles duplicados.`, "Selecciona un ID principal para unificar antes de importar.");
        return;
      }
      if (choice === "__AUTO__" && hasSystemCandidate) {
        addImportError(errors, 0, "documento", group.documentNumber, `El documento ${group.documentNumber} ya existe en el sistema.`, "Selecciona como principal uno de los IDs existentes.");
        return;
      }
      if (choice !== "__AUTO__" && !candidateIds.has(choice) && !findCustomer(data, choice)) {
        addImportError(errors, 0, "documento", group.documentNumber, `El ID principal ${choice} no esta dentro de los candidatos del documento ${group.documentNumber}.`, "Escoge uno de los IDs listados.");
      }
    });
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    duplicateCustomerDocuments,
    requiresCustomerMerge: duplicateCustomerDocuments.length > 0 && duplicateCustomerDocuments.some((group) => !mergeChoices[group.documentNumber]),
    summary: {
      module: normalizedModule,
      label: template.label,
      rows: rows.length,
      errors: errors.length,
      warnings: warnings.length
    }
  };
}

function commitRows(data, module, rows = [], actor = "portal", warnings = [], options = {}) {
  const now = new Date().toISOString();
  const importId = randomId("IMP");
  const affected = {
    customers: [],
    invoices: [],
    payments: [],
    inventory: [],
    inventoryMovements: [],
    orders: []
  };
  const track = (key, value) => {
    const cleanValue = cleanText(value);
    if (cleanValue && affected[key] && !affected[key].includes(cleanValue)) affected[key].push(cleanValue);
  };

  if (module === "clientes") {
    const mergeChoices = options.mergeChoices || {};
    const handledDocuments = new Set();
    rows.forEach((row) => {
      const documentKey = normalizeDocument(row.documento);
      const mergeChoice = documentKey ? cleanText(mergeChoices[documentKey]) : "";
      if (documentKey && mergeChoice) {
        if (handledDocuments.has(documentKey)) return;
        handledDocuments.add(documentKey);
        const groupRows = rows.filter((candidate) => normalizeDocument(candidate.documento) === documentKey);
        const preferredRow = mergeChoice === "__AUTO__"
          ? groupRows.find((candidate) => normalizeCustomerId(candidate.id_cliente)) || groupRows[0]
          : groupRows.find((candidate) => normalizeCustomerId(candidate.id_cliente) === mergeChoice) || groupRows[0];
        const primaryId = mergeChoice === "__AUTO__" ? normalizeCustomerId(preferredRow.id_cliente) || nextCustomerId(data.customers) : mergeChoice;
        const incoming = {
          ...buildCustomerFromImportRow(preferredRow, primaryId, actor, now, true),
          sourceImportId: importId,
          importModule: module
        };
        const secondaryRows = groupRows.filter((candidate) => normalizeCustomerId(candidate.id_cliente) !== primaryId);
        secondaryRows.forEach((candidate) => {
          incoming.name = pickText(incoming.name, candidate.nombre_cliente);
          incoming.alternateName = pickText(incoming.alternateName, candidate.nombre_alterno);
          incoming.phone = pickText(incoming.phone, candidate.telefono);
          incoming.email = pickLowerEmail(incoming.email, candidate.correo);
          incoming.address = pickText(incoming.address, candidate.direccion);
          incoming.zone = pickText(incoming.zone, candidate.zona);
          incoming.notes = [incoming.notes, cleanText(candidate.notas)].filter(Boolean).join(" | ");
        });
        const existingDuplicateIds = data.customers
          .filter((customer) => customer.id !== primaryId && normalizeDocument(customer.documentNumber) === documentKey)
          .map((customer) => customer.id);
        const rowDuplicateIds = secondaryRows.map((candidate) => normalizeCustomerId(candidate.id_cliente)).filter(Boolean);
        const merged = mergeCustomerRecords(data, primaryId, [...existingDuplicateIds, ...rowDuplicateIds], incoming, actor);
        track("customers", merged.id);
        warnings.push({ row: "", field: "documento", value: documentKey, message: `Documento ${documentKey} unificado en el ID ${primaryId}. IDs no usados quedan disponibles para asignacion posterior.` });
        return;
      }
      const id = normalizeCustomerId(row.id_cliente) || nextCustomerId(data.customers);
      data.customers.push({
        ...buildCustomerFromImportRow(row, id, actor, now, true),
        sourceImportId: importId,
        importModule: module
      });
      track("customers", id);
    });
  }

  if (module === "facturas_historicas") {
    rows.forEach((row) => {
      const customer = ensureHistoricalCustomer(data, row.id_cliente, row.nombre_cliente, actor, warnings);
      const total = parseCurrency(row.valor_total);
      const id = nextInvoiceId(data);
      data.invoices.push({
        id,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        date: normalizeDate(row.fecha),
        dueDate: normalizeDate(row.fecha_vencimiento),
        status: "emitida",
        source: "cargue_inicial_resumido",
        notes: cleanText(row.notas),
        externalReference: cleanText(row.referencia_origen || row.id_factura),
        lines: [],
        subtotal: total,
        discountTotal: 0,
        taxTotal: 0,
        total,
        totalLabel: formatMoney(total),
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
        sourceImportId: importId,
        importModule: module,
        auditTrail: [createAudit("invoice_imported_initial", actor)]
      });
      track("invoices", id);
      track("customers", customer.id);
    });
  }

  if (module === "facturas_detalladas" || module === "ordenes_detalladas") {
    const grouped = rows.reduce((acc, row) => {
      const key = cleanText(row.referencia_origen || row.id_factura || row.id_orden) || `fila-${Object.keys(acc).length + 1}`;
      acc[key] = acc[key] || [];
      acc[key].push(row);
      return acc;
    }, {});
    Object.entries(grouped).forEach(([id, group]) => {
      const first = group[0];
      const customer = ensureHistoricalCustomer(data, first.id_cliente, first.nombre_cliente, actor, warnings);
      const lines = group.map((row) => normalizeLine({
        sku: row.sku,
        concept: row.concepto,
        quantity: row.cantidad,
        unitPrice: row.precio_unitario,
        discount: row.descuento,
        taxable: normalizeBoolean(row.aplica_iva),
        taxRate: row.tarifa_iva
      }, data.inventory));
      const totals = calculateInvoiceTotals(lines, 0);
      const target = module === "ordenes_detalladas" ? data.orders : data.invoices;
      const recordId = module === "ordenes_detalladas" ? nextOrderId(data) : nextInvoiceId(data);
      if (module === "facturas_detalladas") applyInventorySale(data, lines, actor, recordId, importId);
      target.push({
        id: recordId,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        date: normalizeDate(first.fecha),
        dueDate: normalizeDate(first.fecha_vencimiento),
        status: module === "ordenes_detalladas" ? "borrador" : "emitida",
        source: "cargue_detallado",
        notes: cleanText(first.notas),
        externalReference: id,
        showDiscountsOnPdf: normalizeBoolean(first.mostrar_descuento_pdf),
        lines,
        subtotal: totals.subtotal,
        discountTotal: totals.discount,
        taxTotal: totals.tax,
        total: totals.total,
        totalLabel: formatMoney(totals.total),
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
        sourceImportId: importId,
        importModule: module,
        auditTrail: [createAudit(`${module}_imported`, actor)]
      });
      track(module === "ordenes_detalladas" ? "orders" : "invoices", recordId);
      track("customers", customer.id);
    });
  }

  if (module === "abonos") {
    rows.forEach((row) => {
      const customer = ensureHistoricalCustomer(data, row.id_cliente, row.nombre_cliente, actor, warnings);
      const grossAmount = parseCurrency(row.valor_bruto);
      const retentions = {
        retefuente: parseCurrency(row.retefuente),
        reteica: parseCurrency(row.reteica),
        reteiva: parseCurrency(row.reteiva),
        other: parseCurrency(row.otras_retenciones)
      };
      const retentionTotal = retentions.retefuente + retentions.reteica + retentions.reteiva + retentions.other;
      const netReceived = parseCurrency(row.valor_neto) || Math.max(grossAmount - retentionTotal, 0);
      const paymentId = nextPaymentId(data);
      data.payments.push({
        id: paymentId,
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        invoiceId: cleanText(row.id_factura),
        date: normalizeDate(row.fecha),
        grossAmount,
        retentions,
        retentionTotal,
        netReceived,
        totalApplied: grossAmount,
        method: cleanText(row.medio_pago) || "No especificado",
        reference: cleanText(row.referencia),
        notes: cleanText(row.notas),
        status: "aplicado",
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
        sourceImportId: importId,
        importModule: module,
        auditTrail: [createAudit("payment_imported", actor)]
      });
      track("payments", paymentId);
      track("customers", customer.id);
    });
  }

  if (module === "inventario") {
    rows.forEach((row) => {
      const sku = normalizeSku(row.sku);
      data.inventory.push({
        sku,
        name: cleanText(row.nombre_producto),
        salePrice: parseCurrency(row.precio_venta),
        cost: parseCurrency(row.costo),
        stock: 0,
        taxable: normalizeBoolean(row.aplica_iva),
        taxRate: Number(row.tarifa_iva || 0) || 0,
        status: cleanText(row.estado) || "activo",
        notes: cleanText(row.notas),
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
        sourceImportId: importId,
        importModule: module
      });
      track("inventory", sku);
    });
  }

  if (module === "actualizacion_productos") {
    rows.forEach((row) => {
      const sku = normalizeSku(row.sku);
      const index = data.inventory.findIndex((item) => item.sku === sku);
      if (index < 0) return;
      const current = data.inventory[index];
      const patch = {
        updatedAt: now,
        updatedBy: actor,
        auditTrail: [...(current.auditTrail || []), createAudit("inventory_item_updated_by_import", actor)]
      };
      if (cleanText(row.nombre_producto)) patch.name = cleanText(row.nombre_producto);
      if (cleanText(row.precio_venta)) patch.salePrice = parseCurrency(row.precio_venta);
      if (cleanText(row.costo)) patch.cost = parseCurrency(row.costo);
      if (cleanText(row.aplica_iva)) patch.taxable = normalizeBoolean(row.aplica_iva);
      if (cleanText(row.tarifa_iva)) patch.taxRate = Number(row.tarifa_iva || 0) || 0;
      if (cleanText(row.estado)) patch.status = cleanText(row.estado);
      if (cleanText(row.notas)) patch.notes = cleanText(row.notas);
      data.inventory[index] = { ...current, ...patch, sourceImportId: importId, importModule: module };
      track("inventory", sku);
    });
  }

  if (module === "movimientos_inventario") {
    rows.forEach((row) => {
      const movement = createInventoryMovement(data, {
        date: row.fecha,
        sku: row.sku,
        type: cleanText(row.tipo_movimiento).toLowerCase(),
        quantity: row.cantidad,
        unitCost: row.costo_unitario,
        reference: row.referencia,
        sourceType: "cargue_masivo",
        sourceImportId: importId,
        notes: row.notas
      }, actor);
      if (movement) {
        track("inventoryMovements", movement.id);
        track("inventory", movement.sku);
      }
    });
  }

  data.imports.unshift({
    id: importId,
    module,
    rows: rows.length,
    warningsCount: warnings.length,
    affected,
    status: "activo",
    importedAt: now,
    importedBy: actor
  });

  return data;
}

function revertImportRows(data, importId = "", actor = "portal") {
  const id = cleanText(importId);
  if (!id) throw new Error("Falta el ID del cargue a reversar.");
  const now = new Date().toISOString();
  const importIndex = (data.imports || []).findIndex((item) => cleanText(item.id) === id);
  if (importIndex < 0) throw new Error(`No se encontro el cargue ${id}.`);
  const importRecord = data.imports[importIndex];
  if (importRecord.status === "revertido") throw new Error(`El cargue ${id} ya fue reversado.`);

  const affected = importRecord.affected || {};
  const invoiceIds = new Set((affected.invoices || []).map(cleanText).filter(Boolean));
  const paymentIds = new Set((affected.payments || []).map(cleanText).filter(Boolean));
  const orderIds = new Set((affected.orders || []).map(cleanText).filter(Boolean));
  const inventorySkus = new Set((affected.inventory || []).map(normalizeSku).filter(Boolean));
  const movementIds = new Set((affected.inventoryMovements || []).map(cleanText).filter(Boolean));
  const customerIds = new Set((affected.customers || []).map(normalizeCustomerId).filter(Boolean));
  const summary = { invoices: 0, payments: 0, orders: 0, inventory: 0, movements: 0, customers: 0 };

  data.invoices = (data.invoices || []).map((invoice) => {
    if (!invoiceIds.has(invoice.id)) return invoice;
    if (invoice.status !== "anulada" && (invoice.lines || []).length) {
      reverseInventorySale(data, invoice.lines, actor, invoice.id, `Reversion automatica por anulacion del cargue ${id}.`);
    }
    summary.invoices += 1;
    return {
      ...invoice,
      status: "anulada",
      notes: [invoice.notes, `Anulada por reversion del cargue ${id}.`].filter(Boolean).join(" | "),
      importRevertedAt: now,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(invoice.auditTrail || []), createAudit("invoice_reverted_by_import", actor, { importId: id })]
    };
  });

  data.payments = (data.payments || []).map((payment) => {
    if (!paymentIds.has(payment.id)) return payment;
    summary.payments += 1;
    return {
      ...payment,
      status: "anulado",
      notes: [payment.notes, `Anulado por reversion del cargue ${id}.`].filter(Boolean).join(" | "),
      importRevertedAt: now,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(payment.auditTrail || []), createAudit("payment_reverted_by_import", actor, { importId: id })]
    };
  });

  data.orders = (data.orders || []).map((order) => {
    if (!orderIds.has(order.id)) return order;
    summary.orders += 1;
    return {
      ...order,
      status: "anulada",
      notes: [order.notes, `Anulada por reversion del cargue ${id}.`].filter(Boolean).join(" | "),
      importRevertedAt: now,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(order.auditTrail || []), createAudit("order_reverted_by_import", actor, { importId: id })]
    };
  });

  (data.inventoryMovements || [])
    .filter((movement) => movementIds.has(movement.id) && movement.status !== "revertido")
    .forEach((movement) => {
      createInventoryMovement(data, {
        sku: movement.sku,
        type: Number(movement.effect || 0) >= 0 ? "ajuste_negativo" : "ajuste_positivo",
        quantity: Math.abs(Number(movement.effect || movement.quantity || 0)),
        unitCost: movement.unitCost,
        reference: `REV-${movement.id}`,
        sourceType: "reversion_cargue",
        sourceId: id,
        notes: `Reversion del movimiento ${movement.id} del cargue ${id}.`
      }, actor);
      summary.movements += 1;
      const originalIndex = data.inventoryMovements.findIndex((item) => item.id === movement.id);
      if (originalIndex >= 0) {
        data.inventoryMovements[originalIndex] = {
          ...data.inventoryMovements[originalIndex],
          status: "revertido",
          importRevertedAt: now,
          auditTrail: [...(data.inventoryMovements[originalIndex].auditTrail || []), createAudit("inventory_movement_reverted_by_import", actor, { importId: id })]
        };
      }
    });

  data.inventory = (data.inventory || []).map((item) => {
    if (!inventorySkus.has(item.sku)) return item;
    const importedAsNew = importRecord.module === "inventario" && item.sourceImportId === id;
    summary.inventory += 1;
    return {
      ...item,
      status: importedAsNew ? "inactivo" : item.status,
      notes: [item.notes, importedAsNew ? `Producto inactivado por reversion del cargue ${id}.` : `Producto afectado por reversion del cargue ${id}; revisar datos maestros si el cargue era de actualizacion.`].filter(Boolean).join(" | "),
      importRevertedAt: now,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(item.auditTrail || []), createAudit("inventory_item_reverted_by_import", actor, { importId: id })]
    };
  });

  data.customers = (data.customers || []).map((customer) => {
    if (!customerIds.has(customer.id)) return customer;
    summary.customers += 1;
    return {
      ...customer,
      notes: [customer.notes, `Cliente revisado por reversion del cargue ${id}; no se elimina para conservar trazabilidad.`].filter(Boolean).join(" | "),
      importRevertedAt: now,
      updatedAt: now,
      updatedBy: actor,
      auditTrail: [...(customer.auditTrail || []), createAudit("customer_touched_by_import_reversion", actor, { importId: id })]
    };
  });

  data.imports[importIndex] = {
    ...importRecord,
    status: "revertido",
    revertedAt: now,
    revertedBy: actor,
    reversalSummary: summary
  };
  data.auditTrail = [
    ...(data.auditTrail || []),
    createAudit("import_reverted", actor, { importId: id, summary })
  ];
  return data;
}

export async function validateOrCommitImport(companyId, module, rows = [], commit = false, actor = "portal", options = {}) {
  const data = await loadCompanyData(companyId);
  const validation = validateImportRows(data, module, rows, options);
  if (!validation.ok) return { ...validation, committed: false, data: withComputedFields(data) };
  if (!commit) return { ...validation, committed: false, data: withComputedFields(data) };

  const warnings = [...validation.warnings];
  const nextData = commitRows(data, cleanText(module), rows, actor, warnings, options);
  const saved = await saveCompanyData(companyId, nextData, actor);
  return {
    ok: true,
    errors: [],
    warnings,
    summary: {
      ...validation.summary,
      warnings: warnings.length
    },
    committed: true,
    data: saved
  };
}
