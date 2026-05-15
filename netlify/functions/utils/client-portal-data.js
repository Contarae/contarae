import crypto from "crypto";
import { getStore as getBlobStore } from "@netlify/blobs";

const PORTAL_STORE_NAME = "client-portal";
const COMPANY_PREFIX = "company:";
const DEFAULT_CURRENCY = "COP";

const IMPORT_TEMPLATES = {
  clientes: {
    label: "Clientes",
    headers: ["id_cliente", "nombre_cliente", "nombre_alterno", "documento", "telefono", "correo", "direccion", "notas"]
  },
  facturas_historicas: {
    label: "Facturas historicas",
    headers: ["id_factura", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "valor_total", "notas"]
  },
  facturas_detalladas: {
    label: "Facturas detalladas",
    headers: ["id_factura", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "notas"]
  },
  abonos: {
    label: "Abonos",
    headers: ["id_abono", "id_cliente", "nombre_cliente", "id_factura", "fecha", "valor_bruto", "retefuente", "reteica", "reteiva", "otras_retenciones", "valor_neto", "medio_pago", "referencia", "notas"]
  },
  inventario: {
    label: "Inventario",
    headers: ["sku", "nombre_producto", "precio_venta", "costo", "stock", "aplica_iva", "tarifa_iva"]
  },
  ordenes_detalladas: {
    label: "Ordenes detalladas",
    headers: ["id_orden", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "mostrar_descuento_pdf", "notas"]
  }
};

function cleanText(value = "") {
  return String(value || "").trim().replace(/\s+/g, " ");
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

function applyInventorySale(data, lines = [], actor = "portal", sourceId = "") {
  lines.forEach((line) => {
    if (!line.sku) return;
    const index = data.inventory.findIndex((item) => item.sku === line.sku);
    if (index < 0) return;
    const current = data.inventory[index];
    const nextStock = Number(current.stock || 0) - Number(line.quantity || 0);
    data.inventory[index] = {
      ...current,
      stock: nextStock,
      updatedAt: new Date().toISOString(),
      updatedBy: actor,
      lastMovement: {
        type: "sale",
        quantity: Number(line.quantity || 0),
        sourceId,
        at: new Date().toISOString(),
        warning: nextStock < 0 ? "Inventario negativo permitido para no bloquear la venta." : ""
      }
    };
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
    inventory: Array.isArray(data.inventory) ? data.inventory : [],
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
  const { nextCustomerId: _nextCustomerId, templates: _templates, customerSummary: _customerSummary, dashboard: _dashboard, ...persistableData } = data || {};
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

function customerBalances(data = {}) {
  const invoices = Array.isArray(data.invoices) ? data.invoices : [];
  const payments = Array.isArray(data.payments) ? data.payments : [];
  return (data.customers || []).map((customer) => {
    const customerInvoices = invoices.filter((invoice) => invoice.customerId === customer.id && invoice.status !== "anulada");
    const customerPayments = payments.filter((payment) => payment.customerId === customer.id && payment.status !== "anulado");
    const billed = customerInvoices.reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
    const paid = customerPayments.reduce((sum, payment) => sum + Number(payment.totalApplied || payment.netReceived || payment.grossAmount || 0), 0);
    const balance = Math.max(billed - paid, 0);
    return {
      ...customer,
      invoicesCount: customerInvoices.length,
      paymentsCount: customerPayments.length,
      billed,
      paid,
      balance,
      billedLabel: formatMoney(billed),
      paidLabel: formatMoney(paid),
      balanceLabel: formatMoney(balance),
      missingFields: ["documentNumber", "phone"].filter((field) => !cleanText(customer[field]))
    };
  });
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
  const totalBilled = invoices.filter((invoice) => invoice.status !== "anulada").reduce((sum, invoice) => sum + Number(invoice.total || 0), 0);
  const totalPaid = payments.filter((payment) => payment.status !== "anulado").reduce((sum, payment) => sum + Number(payment.totalApplied || payment.netReceived || payment.grossAmount || 0), 0);
  const pending = Math.max(totalBilled - totalPaid, 0);
  return {
    customersCount: data.customers.length,
    invoicesCount: invoices.length,
    paymentsCount: payments.length,
    inventoryCount: data.inventory.length,
    ordersCount: data.orders.length,
    totalBilled,
    totalPaid,
    pending,
    totalBilledLabel: formatMoney(totalBilled),
    totalPaidLabel: formatMoney(totalPaid),
    pendingLabel: formatMoney(pending),
    outdatedCustomersCount: balances.filter((customer) => customer.missingFields.length).length,
    negativeInventoryCount: data.inventory.filter((item) => Number(item.stock || 0) < 0).length,
    topDebtors: topDebtors(data)
  };
}

function withComputedFields(data = {}) {
  const normalized = normalizeData(data, data.companyId, data.company?.name);
  return {
    ...normalized,
    nextCustomerId: nextCustomerId(normalized.customers),
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
    const customer = {
      ...existing,
      id,
      name: cleanText(payload.name),
      alternateName: cleanText(payload.alternateName),
      documentNumber: cleanText(payload.documentNumber),
      phone: cleanText(payload.phone),
      email: cleanText(payload.email).toLowerCase(),
      address: cleanText(payload.address),
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
  } else if (type === "invoice") {
    const id = normalizeRecordId(payload.id, "FAC");
    const existingIndex = data.invoices.findIndex((invoice) => invoice.id === id);
    const existing = existingIndex >= 0 ? data.invoices[existingIndex] : {};
    const customer = findCustomer(data, payload.customerId);
    if (!customer) throw new Error("Selecciona un cliente valido para la factura.");
    const lines = (Array.isArray(payload.lines) ? payload.lines : []).map((line) => normalizeLine(line, data.inventory));
    const totalOverride = parseCurrency(payload.total);
    const totals = calculateInvoiceTotals(lines, totalOverride);
    if (lines.length && existingIndex < 0) applyInventorySale(data, lines, actor, id);
    const invoice = {
      ...existing,
      id,
      customerId: customer.id,
      customerNameSnapshot: customer.name,
      date: normalizeDate(payload.date) || new Date().toISOString().slice(0, 10),
      dueDate: normalizeDate(payload.dueDate),
      status: cleanText(payload.status) || "emitida",
      source: lines.length ? "manual_detallada" : "manual_resumida",
      notes: cleanText(payload.notes),
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
    const id = normalizeRecordId(payload.id, "ORD");
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
    const id = normalizeRecordId(payload.invoiceId || payload.id, "FAC");
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
    const id = normalizeRecordId(payload.id, "ABO");
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
    const sku = normalizeSku(payload.sku) || randomId("SKU");
    const existingIndex = data.inventory.findIndex((item) => item.sku === sku);
    const existing = existingIndex >= 0 ? data.inventory[existingIndex] : {};
    const item = {
      ...existing,
      sku,
      name: cleanText(payload.name),
      salePrice: parseCurrency(payload.salePrice),
      cost: parseCurrency(payload.cost),
      stock: Number(payload.stock || 0) || 0,
      taxable: Boolean(payload.taxable),
      taxRate: Number(payload.taxRate || 0) || 0,
      updatedAt: now,
      updatedBy: actor,
      createdAt: existing.createdAt || now,
      createdBy: existing.createdBy || actor
    };
    if (!item.name) throw new Error("Ingresa el nombre del producto.");
    data.inventory = existingIndex >= 0
      ? data.inventory.map((current, index) => index === existingIndex ? item : current)
      : [...data.inventory, item];
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

export function validateImportRows(data, module, rows = []) {
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

  const seenCustomers = new Set();
  const seenInventory = new Set();
  const seenHistoricalInvoices = new Set();
  const seenPayments = new Set();
  const detailedDocuments = new Map();
  rows.forEach((row, index) => {
    const rowNumber = index + 2;
    if (normalizedModule === "clientes") {
      const id = normalizeCustomerId(row.id_cliente);
      const name = cleanText(row.nombre_cliente);
      if (!id) addImportError(errors, rowNumber, "id_cliente", row.id_cliente, "Falta el ID del cliente.", "Usa el consecutivo indicado por el sistema o deja que se genere manualmente.");
      if (!name) addImportError(errors, rowNumber, "nombre_cliente", row.nombre_cliente, "Falta el nombre del cliente.", "Diligencia el nombre del cliente.");
      if (id && findCustomer(data, id)) addImportError(errors, rowNumber, "id_cliente", id, `El ID ${id} ya existe y no puede usarse para crear otro cliente.`, "Usa el siguiente consecutivo disponible o actualiza el cliente existente desde el formulario.");
      if (id && seenCustomers.has(id)) addImportError(errors, rowNumber, "id_cliente", id, `El ID ${id} esta repetido dentro del archivo.`, "Cada cliente nuevo debe tener un ID unico.");
      if (id) seenCustomers.add(id);
    }

    if (normalizedModule === "facturas_historicas" || normalizedModule === "facturas_detalladas" || normalizedModule === "ordenes_detalladas") {
      validateCustomerMatch(data, row, rowNumber, errors, warnings);
      const recordId = cleanText(row.id_factura || row.id_orden);
      if (!recordId) addImportError(errors, rowNumber, normalizedModule === "ordenes_detalladas" ? "id_orden" : "id_factura", recordId, "Falta el identificador del documento.", "Diligencia un ID de factura u orden.");
      const prefix = normalizedModule === "ordenes_detalladas" ? "ORD" : "FAC";
      const normalizedRecordId = recordId ? normalizeRecordId(recordId, prefix) : "";
      const target = normalizedModule === "ordenes_detalladas" ? data.orders : data.invoices;
      if (normalizedRecordId && target.some((item) => item.id === normalizedRecordId)) {
        addImportError(errors, rowNumber, normalizedModule === "ordenes_detalladas" ? "id_orden" : "id_factura", normalizedRecordId, `Ya existe un documento con el ID ${normalizedRecordId}.`, "Usa un ID nuevo o edita el documento existente desde el modulo correspondiente.");
      }
      if (normalizedModule === "facturas_historicas" && normalizedRecordId) {
        if (seenHistoricalInvoices.has(normalizedRecordId)) addImportError(errors, rowNumber, "id_factura", normalizedRecordId, `La factura ${normalizedRecordId} esta repetida dentro del archivo.`, "Cada factura historica resumida debe tener una sola fila.");
        seenHistoricalInvoices.add(normalizedRecordId);
      }
      if ((normalizedModule === "facturas_detalladas" || normalizedModule === "ordenes_detalladas") && normalizedRecordId) {
        const signature = [
          normalizeCustomerId(row.id_cliente),
          cleanText(row.nombre_cliente),
          normalizeDate(row.fecha),
          normalizeDate(row.fecha_vencimiento)
        ].join("|");
        const previous = detailedDocuments.get(`${normalizedModule}:${normalizedRecordId}`);
        if (previous && previous !== signature) {
          addImportError(errors, rowNumber, normalizedModule === "ordenes_detalladas" ? "id_orden" : "id_factura", normalizedRecordId, `El documento ${normalizedRecordId} tiene datos generales inconsistentes entre lineas.`, "Todas las lineas del mismo documento deben conservar cliente, nombre y fechas.");
        }
        if (!previous) detailedDocuments.set(`${normalizedModule}:${normalizedRecordId}`, signature);
      }
      const total = normalizedModule === "facturas_historicas" ? parseCurrency(row.valor_total) : parseCurrency(row.precio_unitario) * (Number(row.cantidad || 0) || 0);
      if (total <= 0) addImportError(errors, rowNumber, normalizedModule === "facturas_historicas" ? "valor_total" : "precio_unitario", row.valor_total || row.precio_unitario, "El valor del documento debe ser mayor a cero.", "Revisa que el valor sea numerico.");
      if (!normalizeDate(row.fecha)) addImportError(errors, rowNumber, "fecha", row.fecha, "Fecha invalida.", "Usa formato AAAA-MM-DD.");
    }

    if (normalizedModule === "abonos") {
      validateCustomerMatch(data, row, rowNumber, errors, warnings);
      const paymentId = cleanText(row.id_abono);
      const normalizedPaymentId = paymentId ? normalizeRecordId(paymentId, "ABO") : "";
      if (!paymentId) addImportError(errors, rowNumber, "id_abono", row.id_abono, "Falta el ID del abono.", "Diligencia un ID unico para el abono.");
      if (normalizedPaymentId && data.payments.some((payment) => payment.id === normalizedPaymentId)) {
        addImportError(errors, rowNumber, "id_abono", normalizedPaymentId, `Ya existe un abono con el ID ${normalizedPaymentId}.`, "Usa un ID nuevo o edita el abono existente desde el modulo de abonos.");
      }
      if (normalizedPaymentId && seenPayments.has(normalizedPaymentId)) addImportError(errors, rowNumber, "id_abono", normalizedPaymentId, `El abono ${normalizedPaymentId} esta repetido dentro del archivo.`, "Cada abono debe tener un ID unico.");
      if (normalizedPaymentId) seenPayments.add(normalizedPaymentId);
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
  });

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    summary: {
      module: normalizedModule,
      label: template.label,
      rows: rows.length,
      errors: errors.length,
      warnings: warnings.length
    }
  };
}

function commitRows(data, module, rows = [], actor = "portal", warnings = []) {
  const now = new Date().toISOString();

  if (module === "clientes") {
    rows.forEach((row) => {
      data.customers.push({
        id: normalizeCustomerId(row.id_cliente),
        name: cleanText(row.nombre_cliente),
        alternateName: cleanText(row.nombre_alterno),
        documentNumber: cleanText(row.documento),
        phone: cleanText(row.telefono),
        email: cleanText(row.correo).toLowerCase(),
        address: cleanText(row.direccion),
        notes: cleanText(row.notas),
        dataStatus: cleanText(row.documento) && cleanText(row.telefono) ? "actualizado" : "pendiente_actualizacion",
        updateAlertShownAt: "",
        updateConfirmedAt: "",
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor,
        auditTrail: [createAudit("customer_imported", actor)]
      });
    });
  }

  if (module === "facturas_historicas") {
    rows.forEach((row) => {
      const customer = ensureHistoricalCustomer(data, row.id_cliente, row.nombre_cliente, actor, warnings);
      const total = parseCurrency(row.valor_total);
      data.invoices.push({
        id: normalizeRecordId(row.id_factura, "FAC"),
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        date: normalizeDate(row.fecha),
        dueDate: normalizeDate(row.fecha_vencimiento),
        status: "emitida",
        source: "cargue_inicial_resumido",
        notes: cleanText(row.notas),
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
        auditTrail: [createAudit("invoice_imported_initial", actor)]
      });
    });
  }

  if (module === "facturas_detalladas" || module === "ordenes_detalladas") {
    const grouped = rows.reduce((acc, row) => {
      const key = cleanText(row.id_factura || row.id_orden);
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
      if (module === "facturas_detalladas") applyInventorySale(data, lines, actor, id);
      const target = module === "ordenes_detalladas" ? data.orders : data.invoices;
      target.push({
        id: normalizeRecordId(id, module === "ordenes_detalladas" ? "ORD" : "FAC"),
        customerId: customer.id,
        customerNameSnapshot: customer.name,
        date: normalizeDate(first.fecha),
        dueDate: normalizeDate(first.fecha_vencimiento),
        status: module === "ordenes_detalladas" ? "borrador" : "emitida",
        source: "cargue_detallado",
        notes: cleanText(first.notas),
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
        auditTrail: [createAudit(`${module}_imported`, actor)]
      });
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
      data.payments.push({
        id: normalizeRecordId(row.id_abono, "ABO"),
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
        auditTrail: [createAudit("payment_imported", actor)]
      });
    });
  }

  if (module === "inventario") {
    rows.forEach((row) => {
      data.inventory.push({
        sku: normalizeSku(row.sku),
        name: cleanText(row.nombre_producto),
        salePrice: parseCurrency(row.precio_venta),
        cost: parseCurrency(row.costo),
        stock: Number(row.stock || 0) || 0,
        taxable: normalizeBoolean(row.aplica_iva),
        taxRate: Number(row.tarifa_iva || 0) || 0,
        createdAt: now,
        createdBy: actor,
        updatedAt: now,
        updatedBy: actor
      });
    });
  }

  data.imports.unshift({
    id: randomId("IMP"),
    module,
    rows: rows.length,
    warningsCount: warnings.length,
    importedAt: now,
    importedBy: actor
  });

  return data;
}

export async function validateOrCommitImport(companyId, module, rows = [], commit = false, actor = "portal") {
  const data = await loadCompanyData(companyId);
  const validation = validateImportRows(data, module, rows);
  if (!validation.ok) return { ...validation, committed: false, data: withComputedFields(data) };
  if (!commit) return { ...validation, committed: false, data: withComputedFields(data) };

  const warnings = [...validation.warnings];
  const nextData = commitRows(data, cleanText(module), rows, actor, warnings);
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
