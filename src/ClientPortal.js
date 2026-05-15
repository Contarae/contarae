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
  ["movimientos", "Movimientos"],
  ["ordenes", "Ordenes"],
  ["cargues", "Cargues masivos"],
  ["configuracion", "Configuracion"]
];

const PAYMENT_METHODS = ["Transferencia bancaria", "Nequi", "Daviplata", "Efectivo", "PSE", "Tarjeta", "Otro"];
const IVA_RATES = [0, 5, 19];
const DISCOUNT_PERCENTS = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90];
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

function buildRowsForExport(data, type) {
  if (type === "clientes") {
    return [
      ["id_cliente", "nombre_cliente", "nombre_alterno", "documento", "telefono", "correo", "direccion", "ciudad", "departamento", "zona", "estado_datos", "facturado", "pagado", "saldo", "cartera_vencida"],
      ...(data.customerSummary || []).map((customer) => [customer.id, customer.name, customer.alternateName, customer.documentNumber, customer.phone, customer.email, customer.address, customer.city, customer.department, customer.zone, customer.dataStatus, customer.billed, customer.paid, customer.balance, customer.overdue || 0])
    ];
  }
  if (type === "facturas") {
    return [
      ["id_factura", "id_cliente", "nombre_cliente", "fecha", "fecha_vencimiento", "subtotal", "iva", "descuentos", "total", "estado", "fuente"],
      ...(data.invoices || []).map((invoice) => [invoice.id, invoice.customerId, invoice.customerNameSnapshot, invoice.date, invoice.dueDate, invoice.subtotal, invoice.taxTotal, invoice.discountTotal, invoice.total, invoice.status, invoice.source])
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
  if (type === "abonos") {
    return [
      ["id_abono", "id_cliente", "nombre_cliente", "id_factura", "fecha", "valor_bruto", "retefuente", "reteica", "reteiva", "otras_retenciones", "valor_neto", "medio_pago"],
      ...(data.payments || []).map((payment) => [payment.id, payment.customerId, payment.customerNameSnapshot, payment.invoiceId, payment.date, payment.grossAmount, payment.retentions?.retefuente, payment.retentions?.reteica, payment.retentions?.reteiva, payment.retentions?.other, payment.netReceived, payment.method])
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

function buildWorkbookForExport(data, type) {
  const labels = {
    clientes: "Clientes",
    facturas: "Facturas",
    abonos: "Abonos",
    cartera: "Cartera",
    inventario: "Inventario",
    movimientos: "Movimientos",
    ordenes: "Ordenes"
  };
  const sheets = [{ name: labels[type] || "Reporte", rows: buildRowsForExport(data, type) }];
  if (type === "facturas") {
    sheets.push({
      name: "Detalle facturas",
      rows: [
        ["id_factura", "sku", "concepto", "cantidad", "precio_unitario", "descuento", "aplica_iva", "tarifa_iva", "subtotal", "iva", "total"],
        ...(data.invoices || []).flatMap((invoice) => (invoice.lines || []).map((line) => [invoice.id, line.sku, line.concept, line.quantity, line.unitPrice, line.discount, line.taxable ? "SI" : "NO", line.taxRate, line.subtotal, line.tax, line.total]))
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
  if (type === "cartera") {
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

function customerById(data, id) {
  return (data.customerSummary || data.customers || []).find((customer) => customer.id === id);
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
    : `<tr><td>1</td><td>Cargue inicial / factura resumida</td><td>1</td><td>${money(record.total)}</td><td>$ 0</td><td>No</td><td>${money(record.total)}</td></tr>`;
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
    <div>${logo}<h1>${title}</h1><div class="muted">${xmlEscape(record.id || "")} · Fecha: ${xmlEscape(record.date || "")} · Vence: ${xmlEscape(record.dueDate || "Sin vencimiento")}</div></div>
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

function Stat({ label, value, note, tone = "#1D4ED8" }) {
  return (
    <div style={card}>
      <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#64748B", fontWeight: 900, fontFamily: F }}>{label}</div>
      <div style={{ fontFamily: FH, fontSize: 38, lineHeight: 1.15, color: tone, marginTop: 8 }}>{value}</div>
      <div style={{ fontFamily: F, fontSize: 13, color: "#52647F", lineHeight: 1.7, marginTop: 8 }}>{note}</div>
    </div>
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
            <h2 style={{ margin: "2px 0 0", fontFamily: FH, color: "#0B1D3A", fontSize: "clamp(28px,4vw,44px)", lineHeight: 1.05 }}>{title}</h2>
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

function CustomerSearch({ customers = [], selectedId = "", onSelect, title = "Buscar cliente", compact = false }) {
  const [type, setType] = useState("name");
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const selected = customers.find((customer) => customer.id === selectedId);
  const results = useMemo(() => customerSearchMatches(customers, type, query), [customers, type, query]);

  function search(event) {
    event?.preventDefault();
    setSearched(true);
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
      {searched ? (
        <div style={{ display: "grid", gap: 8 }}>
          {results.length ? results.map((customer) => (
            <button
              key={customer.id}
              type="button"
              onClick={() => onSelect(customer)}
              style={{ textAlign: "left", padding: 12, borderRadius: 14, border: "1px solid rgba(37,99,235,.12)", background: "#fff", cursor: "pointer", fontFamily: F }}
            >
              <strong>{customer.id} - {customer.name || "Cliente sin nombre"}</strong>
              <div style={{ marginTop: 4, color: "#64748B", fontSize: 12 }}>
                Alterno: {customer.alternateName || "sin alterno"} · Documento: {customer.documentNumber || "por asignar"} · Saldo: {customer.balanceLabel || money(customer.balance)}
              </div>
            </button>
          )) : (
            <div style={{ padding: 12, borderRadius: 14, background: "rgba(245,158,11,.10)", color: "#92400E", fontFamily: F, lineHeight: 1.6 }}>
              No se encontraron coincidencias. Revisa el criterio o crea el cliente antes de continuar.
            </div>
          )}
        </div>
      ) : null}
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
  const agingTotal = AGING_BUCKETS.reduce((sum, [key]) => sum + Number(dashboard.aging?.[key] || 0), 0);
  return (
    <div style={{ display: "grid", gap: 18 }}>
      <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
        <Stat label="CARTERA TOTAL" value={dashboard.pendingLabel || "$ 0"} note="Saldo pendiente por cobrar." tone="#C2410C" />
        <Stat label="CARTERA VENCIDA" value={dashboard.overdueLabel || "$ 0"} note={`${dashboard.overdueInvoicesCount || 0} factura(s) con saldo vencido.`} tone="#B91C1C" />
        <Stat label="PROXIMA A VENCER" value={dashboard.upcomingLabel || "$ 0"} note={`${dashboard.dueSoonInvoicesCount || 0} factura(s) vencen hoy o en 7 dias.`} tone="#B45309" />
        <Stat label="RECAUDADO" value={dashboard.totalPaidLabel || "$ 0"} note={`${dashboard.paymentsCount || 0} abono(s) registrados.`} tone="#15803D" />
      </div>
      <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 14 }}>
        <Stat label="FACTURADO" value={dashboard.totalBilledLabel || "$ 0"} note={`${dashboard.invoicesCount || 0} factura(s) registradas.`} />
        <Stat label="NO VENCIDA" value={dashboard.currentLabel || "$ 0"} note="Saldo con vencimiento futuro o sin vencimiento." tone="#1D4ED8" />
        <Stat label="CREDITOS SIN APLICAR" value={dashboard.unappliedCreditLabel || "$ 0"} note="Pagos que superan la cartera vigente." tone="#15803D" />
        <Stat label="ALERTAS" value={(dashboard.outdatedCustomersCount || 0) + (dashboard.negativeInventoryCount || 0)} note={`${dashboard.outdatedCustomersCount || 0} cliente(s) por actualizar · ${dashboard.negativeInventoryCount || 0} inventario(s) negativo(s).`} tone="#B45309" />
      </div>
      <section style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 12, letterSpacing: "1.4px", color: "#1D4ED8", fontWeight: 900, fontFamily: F }}>EDADES DE CARTERA</div>
            <h2 style={{ margin: 0, fontFamily: FH, fontSize: 30, color: "#0B1D3A" }}>Distribucion del saldo pendiente</h2>
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
  const [draft, setDraft] = useState({ id: "", name: "", alternateName: "", documentNumber: "", phone: "", email: "", address: "", city: "", department: "", zone: "", notes: "" });
  const [selectedId, setSelectedId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmSave, setConfirmSave] = useState(null);
  const [duplicateMerge, setDuplicateMerge] = useState(null);
  const [busy, setBusy] = useState(false);
  const customers = data.customerSummary || [];

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
          <Field label="Documento"><input style={input} value={draft.documentNumber} onChange={(event) => setDraft((current) => ({ ...current, documentNumber: onlyDigits(event.target.value) }))} /></Field>
          <Field label="Telefono"><input style={input} value={draft.phone} onChange={(event) => setDraft((current) => ({ ...current, phone: onlyDigits(event.target.value).slice(0, 10) }))} /></Field>
          <Field label="Correo"><input style={input} type="email" value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value.toLowerCase() }))} /></Field>
          <Field label="Direccion"><input style={input} value={draft.address} onChange={(event) => setDraft((current) => ({ ...current, address: event.target.value }))} /></Field>
          <Field label="Ciudad"><input style={input} list="client-city-list" value={draft.city} onBlur={() => setDraft((current) => ({ ...current, ...resolveCityDepartment(current.city, current.department) }))} onChange={(event) => {
            const location = resolveCityDepartment(event.target.value, draft.department);
            setDraft((current) => ({ ...current, city: event.target.value, department: location.geographyStatus === "validado" ? location.department : current.department }));
          }} /></Field>
          <Field label="Departamento automatico"><input style={{ ...input, background: "#F8FBFF" }} readOnly value={draft.department || (draft.city ? "Por validar" : "")} /></Field>
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
        <div style={{ display: "grid", gap: 8 }}>
          {customers.map((customer) => (
            <div key={customer.id} className="client-portal-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.4fr) repeat(3, minmax(90px,.4fr)) auto", gap: 10, alignItems: "center", padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.10)", background: "#fff" }}>
              <div>
                <strong style={{ fontFamily: F }}>{customer.name || "Cliente reservado pendiente por asignar"}</strong>
                <div style={{ fontFamily: F, color: "#64748B", fontSize: 12 }}>{customer.id} · {customer.documentNumber || "Documento por asignar"} · {customer.phone || "Celular pendiente"} · {customer.city || "Ciudad pendiente"}{customer.department ? `, ${customer.department}` : ""}</div>
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
  const customers = data.customerSummary || data.customers || [];
  const [mode, setMode] = useState("detallada");
  const [draft, setDraft] = useState({ id: "", customerId: "", date: today(), dueDate: "", total: "", status: "emitida", notes: "" });
  const [lines, setLines] = useState([blankLine()]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const totals = uiLineTotals(lines);

  const reset = () => {
    setDraft({ id: "", customerId: "", date: today(), dueDate: "", total: "", status: "emitida", notes: "" });
    setLines([blankLine()]);
    setMode("detallada");
  };

  const openNew = () => {
    reset();
    setModalOpen(true);
  };

  const edit = (invoice) => {
    setDraft({
      id: invoice.id || "",
      customerId: invoice.customerId || "",
      date: invoice.date || today(),
      dueDate: invoice.dueDate || "",
      total: invoice.lines?.length ? "" : formatCurrencyInput(invoice.total),
      status: invoice.status || "emitida",
      notes: invoice.notes || ""
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
    if (mode === "resumida" && moneyValue(draft.total) <= 0) {
      window.alert("Ingresa el valor total de la factura resumida.");
      return;
    }
    const payload = {
      ...draft,
      total: mode === "resumida" ? draft.total : "",
      lines: payloadLines
    };
    setConfirmAction({
      type: "save",
      payload,
      title: draft.id ? "Guardar cambios de factura" : "Crear factura",
      body: "Confirma que la factura esta correcta antes de guardarla. Si el backend rechaza la operacion, el formulario conservara lo digitado.",
      details: [
        { label: "Cliente", value: customerById(data, draft.customerId)?.name || draft.customerId },
        { label: "Total", value: mode === "detallada" ? money(totals.total) : formatCurrencyInput(draft.total) },
        { label: "Estado", value: draft.status }
      ]
    });
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

  return (
    <ModuleWithForm title="Facturas" count={(data.invoices || []).length} onExport={() => onExport("facturas")}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748B", fontFamily: F }}>Registra facturas detalladas o cargues iniciales resumidos.</p>
        <button type="button" onClick={openNew} style={button}>Nueva factura</button>
      </div>
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
            <Field label="Fecha"><input required style={input} type="date" value={draft.date} onChange={(event) => setDraft((current) => ({ ...current, date: event.target.value }))} /></Field>
            <Field label="Vencimiento"><input style={input} type="date" value={draft.dueDate} onChange={(event) => setDraft((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
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
            <div className="client-portal-form-grid" style={{ display: "grid", gridTemplateColumns: "minmax(180px,320px) 1fr", gap: 10 }}>
              <Field label="Valor total"><input required style={input} value={draft.total} onChange={(event) => setDraft((current) => ({ ...current, total: formatCurrencyInput(event.target.value) }))} /></Field>
              <div style={{ padding: 13, borderRadius: 16, background: "rgba(37,99,235,.06)", color: "#1D4ED8", fontFamily: F, lineHeight: 1.7 }}>
                Usa esta opcion para cargar facturas historicas sin detalle producto por producto.
              </div>
            </div>
          )}
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
      <PortalModal open={Boolean(viewRecord)} title={`Factura ${viewRecord?.id || ""}`} eyebrow="DETALLE" onClose={() => setViewRecord(null)} wide={false}>
        {viewRecord ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <Stat label="TOTAL" value={viewRecord.totalLabel || money(viewRecord.total)} note={`${viewRecord.customerNameSnapshot} · ${viewRecord.status}`} />
            <RecordList headers={["#", "Concepto", "Cant.", "Unitario", "IVA"]} rows={(viewRecord.lines || []).map((line, index) => [index + 1, line.concept || line.sku, line.quantity, money(line.unitPrice), line.taxable ? `${line.taxRate}%` : "No"])} />
            <div className="client-action-group">
              <button type="button" onClick={() => printableDocument("invoice", viewRecord, data)} style={button}>Imprimir / PDF</button>
              <button type="button" onClick={() => { setViewRecord(null); edit(viewRecord); }} style={ghostButton}>Editar</button>
            </div>
          </div>
        ) : null}
      </PortalModal>
      <RecordList rows={(data.invoices || []).map((invoice) => [invoice.id, invoice.customerNameSnapshot, invoice.date, money(invoice.subtotal), money(invoice.taxTotal), invoice.totalLabel || money(invoice.total), invoice.status, <div className="client-action-group">
        <button type="button" onClick={() => setViewRecord(invoice)} style={ghostButton}>Ver</button>
        <button type="button" onClick={() => edit(invoice)} style={ghostButton}>Editar</button>
        <button type="button" onClick={() => duplicate(invoice)} style={ghostButton}>Duplicar</button>
        <button type="button" onClick={() => printableDocument("invoice", invoice, data)} style={ghostButton}>PDF</button>
        {invoice.status !== "anulada" ? <button type="button" onClick={() => voidInvoice(invoice)} style={dangerGhostButton}>Anular</button> : null}
      </div>])} headers={["ID", "Cliente", "Fecha", "Subtotal", "IVA", "Total", "Estado", "Acciones"]} />
    </ModuleWithForm>
  );
}

function Payments({ data, onSave, onExport }) {
  const customers = data.customerSummary || data.customers || [];
  const blank = () => ({ id: "", customerId: "", invoiceId: "", date: today(), grossAmount: "", retefuente: "", reteica: "", reteiva: "", otherRetentions: "", netReceived: "", method: "Transferencia bancaria", reference: "", notes: "", status: "aplicado" });
  const [draft, setDraft] = useState(blank());
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const customerInvoices = (data.invoices || []).filter((invoice) => !draft.customerId || invoice.customerId === draft.customerId);
  const retentionTotal = moneyValue(draft.retefuente) + moneyValue(draft.reteica) + moneyValue(draft.reteiva) + moneyValue(draft.otherRetentions);
  const calculatedNet = Math.max(moneyValue(draft.grossAmount) - retentionTotal, 0);

  const openNew = () => {
    setDraft(blank());
    setModalOpen(true);
  };

  const edit = (payment) => {
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
      netReceived: formatCurrencyInput(payment.netReceived),
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
    setConfirmAction({
      type: "save",
      title: draft.id ? "Guardar cambios del abono" : "Registrar abono",
      body: "Confirma el abono antes de guardarlo. Las retenciones y el neto recibido quedaran trazados en cartera.",
      payload: draft,
      details: [
        { label: "Cliente", value: customerById(data, draft.customerId)?.name || draft.customerId },
        { label: "Valor bruto", value: formatCurrencyInput(draft.grossAmount) },
        { label: "Medio", value: draft.method }
      ]
    });
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
        netReceived: payment.netReceived,
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
    <ModuleWithForm title="Abonos" count={(data.payments || []).length} onExport={() => onExport("abonos")}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748B", fontFamily: F }}>Registra pagos, retenciones y medios de recaudo.</p>
        <button type="button" onClick={openNew} style={button}>Nuevo abono</button>
      </div>
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
          {["grossAmount", "retefuente", "reteica", "reteiva", "otherRetentions", "netReceived"].map((field) => (
            <Field key={field} label={{ grossAmount: "Valor bruto", retefuente: "ReteFuente", reteica: "ReteICA", reteiva: "ReteIVA", otherRetentions: "Otras retenciones", netReceived: "Neto recibido" }[field]}>
              <input required={field === "grossAmount"} style={input} value={field === "netReceived" && !draft.netReceived ? money(calculatedNet) : draft[field]} onChange={(event) => setDraft((current) => ({ ...current, [field]: formatCurrencyInput(event.target.value) }))} />
            </Field>
          ))}
          <Field label="Referencia"><input style={input} value={draft.reference} onChange={(event) => setDraft((current) => ({ ...current, reference: event.target.value }))} /></Field>
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
      <PortalModal open={Boolean(viewRecord)} title={`Abono ${viewRecord?.id || ""}`} eyebrow="DETALLE" onClose={() => setViewRecord(null)} wide={false}>
        {viewRecord ? (
          <div style={{ display: "grid", gap: 12, fontFamily: F }}>
            <Stat label="NETO RECIBIDO" value={money(viewRecord.netReceived)} note={`${viewRecord.customerNameSnapshot} · ${viewRecord.method}`} tone="#15803D" />
            <RecordList headers={["Bruto", "Retenciones", "Neto", "Estado"]} rows={[[money(viewRecord.grossAmount), money(viewRecord.retentionTotal), money(viewRecord.netReceived), viewRecord.status]]} />
            <div className="client-action-group">
              <button type="button" onClick={() => { setViewRecord(null); edit(viewRecord); }} style={ghostButton}>Editar</button>
              {viewRecord.status !== "anulado" ? <button type="button" onClick={() => { setViewRecord(null); voidPayment(viewRecord); }} style={dangerGhostButton}>Anular</button> : null}
            </div>
          </div>
        ) : null}
      </PortalModal>
      <RecordList rows={(data.payments || []).map((payment) => [payment.id, payment.customerNameSnapshot, payment.invoiceId || "Sin factura", payment.date, money(payment.grossAmount), money(payment.retentionTotal), money(payment.netReceived), payment.method, <div className="client-action-group">
        <button type="button" onClick={() => setViewRecord(payment)} style={ghostButton}>Ver</button>
        <button type="button" onClick={() => edit(payment)} style={ghostButton}>Editar</button>
        <button type="button" onClick={() => duplicate(payment)} style={ghostButton}>Duplicar</button>
        {payment.status !== "anulado" ? <button type="button" onClick={() => voidPayment(payment)} style={dangerGhostButton}>Anular</button> : null}
      </div>])} headers={["ID", "Cliente", "Factura", "Fecha", "Bruto", "Retenciones", "Neto", "Medio", "Acciones"]} />
    </ModuleWithForm>
  );
}

function Portfolio({ data, onExport }) {
  const [selectedId, setSelectedId] = useState("");
  const rows = data.customerSummary || [];
  const selected = rows.find((customer) => customer.id === selectedId);
  const selectedInvoices = selected?.receivableInvoices || [];
  const selectedPayments = (data.payments || []).filter((payment) => payment.customerId === selectedId && payment.status !== "anulado");

  return (
    <ModuleWithForm title="Cartera por cliente" count={rows.length} onExport={() => onExport("cartera")}>
      <CustomerSearch customers={rows} selectedId={selectedId} onSelect={(customer) => setSelectedId(customer?.id || "")} title="Consultar cartera de cliente" />
      {selected ? (
        <section style={{ padding: 16, borderRadius: 20, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 12 }}>
          <div className="client-portal-stats" style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 10 }}>
            <Stat label="FACTURADO" value={selected.billedLabel} note={`${selectedInvoices.length} factura(s).`} />
            <Stat label="PAGADO" value={selected.paidLabel} note={`${selectedPayments.length} abono(s).`} tone="#15803D" />
            <Stat label="SALDO" value={selected.balanceLabel} note="Pendiente a la fecha de corte." tone={selected.balance > 0 ? "#C2410C" : "#15803D"} />
            <Stat label="VENCIDO" value={selected.overdueLabel || "$ 0"} note={`${selected.overdueInvoicesCount || 0} factura(s) vencida(s).`} tone="#B91C1C" />
          </div>
          <div style={{ display: "grid", gap: 8 }}>
            {AGING_BUCKETS.filter(([key]) => Number(selected.aging?.[key] || 0) > 0).map(([key, label]) => (
              <div key={key} className="client-aging-row" style={{ display: "grid", gridTemplateColumns: "170px minmax(0,1fr) 110px", gap: 10, alignItems: "center", fontFamily: F, fontSize: 13 }}>
                <strong style={{ color: key.startsWith("overdue") ? "#B91C1C" : "#334155" }}>{label}</strong>
                <div style={{ height: 10, borderRadius: 999, background: "#EAF1FF", overflow: "hidden" }}>
                  <div style={{ width: `${Math.min(100, Math.max(8, (Number(selected.aging?.[key] || 0) / Math.max(Number(selected.balance || 1), 1)) * 100))}%`, height: "100%", background: key.startsWith("overdue") ? "#DC2626" : "#2563EB" }} />
                </div>
                <strong style={{ textAlign: "right" }}>{money(selected.aging?.[key] || 0)}</strong>
              </div>
            ))}
          </div>
          <RecordList rows={selectedInvoices.map((invoice) => [invoice.id, invoice.date, invoice.dueDate || "Sin vencimiento", invoice.totalLabel || money(invoice.total), invoice.paidLabel || money(invoice.paid), invoice.balanceLabel || money(invoice.balance), invoice.ageLabel || invoice.status])} headers={["Factura", "Fecha", "Vence", "Total", "Aplicado", "Saldo", "Edad"]} />
          <RecordList rows={selectedPayments.map((payment) => [payment.id, payment.date, payment.invoiceId || "Global FIFO", money(payment.grossAmount), money(payment.retentionTotal), money(payment.netReceived), payment.method])} headers={["Abono", "Fecha", "Aplicacion", "Bruto", "Retenciones", "Neto", "Medio"]} />
        </section>
      ) : null}
      <div style={{ display: "grid", gap: 8 }}>
        {rows.map((customer) => {
          const message = `Hola ${customer.name}, te saludamos cordialmente. A la fecha registramos un saldo pendiente de ${customer.balanceLabel}. Agradecemos revisar el estado de cuenta y confirmar la fecha estimada de pago.`;
          const wa = customer.phone ? `https://wa.me/57${onlyDigits(customer.phone).slice(-10)}?text=${encodeURIComponent(message)}` : "";
          return (
            <div key={customer.id} className="client-portal-row" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) repeat(4,130px) auto", gap: 10, alignItems: "center", padding: 12, borderRadius: 16, border: "1px solid rgba(37,99,235,.10)", background: "#fff" }}>
              <div><strong style={{ fontFamily: F }}>{customer.name}</strong><div style={{ fontFamily: F, fontSize: 12, color: "#64748B" }}>{customer.id} · {customer.invoicesCount} factura(s)</div></div>
              <span>{customer.billedLabel}</span>
              <span>{customer.paidLabel}</span>
              <strong style={{ color: customer.balance > 0 ? "#C2410C" : "#15803D" }}>{customer.balanceLabel}</strong>
              <span style={{ color: customer.overdue > 0 ? "#B91C1C" : "#64748B", fontWeight: 900 }}>{customer.overdueLabel || "$ 0"}</span>
              {wa ? <a href={wa} target="_blank" rel="noopener noreferrer" style={{ ...button, textDecoration: "none", background: "#25D366" }}>Cobrar</a> : <span style={{ fontFamily: F, color: "#B45309", fontSize: 12 }}>Sin WhatsApp</span>}
            </div>
          );
        })}
      </div>
    </ModuleWithForm>
  );
}

function Inventory({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ sku: "", name: "", salePrice: "", cost: "", taxable: true, taxRate: 19, status: "activo", notes: "" });
  const [editingSku, setEditingSku] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [confirmSave, setConfirmSave] = useState(null);
  const [busy, setBusy] = useState(false);
  const reset = () => setDraft({ sku: "", name: "", salePrice: "", cost: "", taxable: true, taxRate: 19, status: "activo", notes: "" });
  const openNew = () => {
    reset();
    setEditingSku(false);
    setModalOpen(true);
  };
  const edit = (item) => {
    setEditingSku(true);
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
      <RecordList rows={(data.inventory || []).map((item) => [item.sku, item.name, money(item.salePrice), money(item.cost), item.stock, item.stock < 0 ? "Inventario negativo" : item.status || "activo", <button type="button" onClick={() => edit(item)} style={ghostButton}>Editar</button>])} headers={["SKU", "Nombre", "Precio", "Costo", "Stock", "Estado", "Accion"]} />
    </ModuleWithForm>
  );
}

function InventoryMovements({ data, onSave, onExport }) {
  const [draft, setDraft] = useState({ sku: "", type: "entrada", quantity: "", date: today(), unitCost: "", reference: "", notes: "" });
  const [confirmSave, setConfirmSave] = useState(null);
  const [busy, setBusy] = useState(false);
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
    <ModuleWithForm title="Movimientos de inventario" count={(data.inventoryMovements || []).length} onExport={() => onExport("movimientos")}>
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
      <RecordList rows={(data.inventoryMovements || []).map((movement) => [movement.id, movement.date, movement.sku, movement.type, movement.quantity, movement.effect, movement.stockAfter, movement.reference || movement.sourceId || ""]) } headers={["ID", "Fecha", "SKU", "Tipo", "Cantidad", "Efecto", "Stock final", "Referencia"]} />
    </ModuleWithForm>
  );
}

function Orders({ data, onSave, onExport }) {
  const customers = data.customerSummary || data.customers || [];
  const [draft, setDraft] = useState({ id: "", customerId: "", date: today(), dueDate: "", status: "borrador", showDiscountOnPdf: true, notes: "" });
  const [lines, setLines] = useState([blankLine()]);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewRecord, setViewRecord] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);
  const [busy, setBusy] = useState(false);
  const totals = uiLineTotals(lines);
  const reset = () => {
    setDraft({ id: "", customerId: "", date: today(), dueDate: "", status: "borrador", showDiscountOnPdf: true, notes: "" });
    setLines([blankLine()]);
  };

  const openNew = () => {
    reset();
    setModalOpen(true);
  };

  const edit = (order) => {
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
    setConfirmAction({
      type: "save",
      title: draft.id ? "Guardar cambios de orden" : "Crear orden / cotizacion",
      body: "Confirma la orden antes de guardarla. Podras convertirla en factura cuando sea aprobada.",
      payload: { ...draft, lines: payloadLines },
      details: [
        { label: "Cliente", value: customerById(data, draft.customerId)?.name || draft.customerId },
        { label: "Total", value: money(totals.total) },
        { label: "Estado", value: draft.status }
      ]
    });
  }

  async function convert(order) {
    setConfirmAction({
      type: "convert",
      title: "Convertir orden en factura",
      body: `La orden ${order.id} se convertira en factura. Si hay productos asociados, se descontara inventario y se conservara alerta si queda negativo.`,
      payload: { orderId: order.id },
      details: [
        { label: "Orden", value: order.id },
        { label: "Cliente", value: order.customerNameSnapshot },
        { label: "Total", value: order.totalLabel || money(order.total) }
      ]
    });
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
    <ModuleWithForm title="Ordenes / cotizaciones" count={(data.orders || []).length} onExport={() => onExport("ordenes")}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <p style={{ margin: 0, color: "#64748B", fontFamily: F }}>Crea cotizaciones tipo factura y conviertelas cuando el cliente apruebe.</p>
        <button type="button" onClick={openNew} style={button}>Nueva orden</button>
      </div>
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
      <RecordList rows={(data.orders || []).map((order) => [
        order.id,
        order.customerNameSnapshot,
        order.date,
        money(order.subtotal),
        money(order.taxTotal),
        order.totalLabel || money(order.total),
        order.status,
        <div className="client-action-group">
          <button type="button" onClick={() => setViewRecord(order)} style={ghostButton}>Ver</button>
          <button type="button" onClick={() => edit(order)} style={ghostButton}>Editar</button>
          <button type="button" onClick={() => duplicate(order)} style={ghostButton}>Duplicar</button>
          <button type="button" onClick={() => printableDocument("order", order, data)} style={ghostButton}>PDF</button>
          {order.status !== "facturada" && order.status !== "anulada" ? <button type="button" onClick={() => convert(order)} style={{ ...smallButton, background: "linear-gradient(135deg,#15803D,#22C55E)" }}>Convertir</button> : null}
          {order.status !== "anulada" && order.status !== "facturada" ? <button type="button" onClick={() => voidOrder(order)} style={dangerGhostButton}>Anular</button> : null}
        </div>
      ])} headers={["ID", "Cliente", "Fecha", "Subtotal", "IVA", "Total", "Estado", "Acciones"]} />
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
    <>
      <div className="client-record-table" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px", fontFamily: F, minWidth: 680 }}>
          <thead><tr>{headers.map((header) => <th key={header} style={{ textAlign: "left", fontSize: 11, letterSpacing: "1px", color: "#64748B", padding: "0 10px" }}>{header}</th>)}</tr></thead>
          <tbody>
            {rows.length ? rows.map((row, index) => (
              <tr key={index} style={{ background: "#F8FBFF" }}>{row.map((cell, cellIndex) => <td key={cellIndex} style={{ padding: 12, borderTop: "1px solid rgba(37,99,235,.10)", borderBottom: "1px solid rgba(37,99,235,.10)", verticalAlign: "middle" }}>{cell}</td>)}</tr>
            )) : <tr><td colSpan={headers.length} style={{ padding: 16, color: "#64748B" }}>No hay registros.</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="client-record-cards">
        {rows.length ? rows.map((row, rowIndex) => (
          <div key={rowIndex} style={{ padding: 14, borderRadius: 18, background: "#F8FBFF", border: "1px solid rgba(37,99,235,.10)", display: "grid", gap: 8, fontFamily: F }}>
            {row.map((cell, cellIndex) => (
              <div key={cellIndex} style={{ display: "grid", gap: 2 }}>
                <span style={{ fontSize: 10, letterSpacing: "1px", color: "#64748B", fontWeight: 900 }}>{headers[cellIndex]}</span>
                <div style={{ color: "#0F172A", overflowWrap: "anywhere" }}>{cell}</div>
              </div>
            ))}
          </div>
        )) : <div style={{ padding: 16, borderRadius: 18, background: "#F8FBFF", color: "#64748B", fontFamily: F }}>No hay registros.</div>}
      </div>
    </>
  );
}

function Imports({ data, onData }) {
  const [module, setModule] = useState("clientes");
  const [rows, setRows] = useState([]);
  const [result, setResult] = useState(null);
  const [mergeChoices, setMergeChoices] = useState({});
  const [busy, setBusy] = useState(false);
  const templates = data.templates || {};
  const template = templates[module];

  function downloadTemplate() {
    const examples = {
      clientes: ["", "Cliente Ejemplo SAS", "Cliente Alterno", "900123456", "3001234567", "cliente@correo.com", "Carrera 1 # 2-3", "Bogota", "Norte", "Cliente cargado por plantilla"],
      facturas_historicas: ["FAC-EXT-001", "C0001", "Cliente Ejemplo SAS", today(), today(), 1000000, "Cargue inicial sin detalle"],
      facturas_detalladas: ["FAC-EXT-002", "C0001", "Cliente Ejemplo SAS", today(), today(), "SKU-001", "Producto o servicio", 1, 100000, 0, "SI", 19, "Factura detallada"],
      abonos: ["C0001", "Cliente Ejemplo SAS", "FAC-000001", today(), 500000, 0, 0, 0, 0, 500000, "Transferencia bancaria", "REF123", "Abono ejemplo"],
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
      if (payload.committed && payload.data) onData(payload.data);
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
    </section>
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
    try {
      const response = await fetch("/api/client-portal-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, payload })
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
      setData(result.data);
      setNotice("Informacion guardada correctamente.");
      return result;
    } catch (err) {
      const message = err.message || "No fue posible guardar.";
      setError(message);
      throw err;
    }
  }

  async function logout() {
    await fetch("/api/client-portal-logout", { method: "POST" });
    setSession({ configured: true, authenticated: false });
    setData(null);
  }

  function exportData(type) {
    downloadExcelWorkbook(`${type}-${new Date().toISOString().slice(0, 10)}.xls`, buildWorkbookForExport(data, type));
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
        @media(max-width:980px){
          .client-portal-stats,.client-portal-form-grid,.client-portal-line-grid,.client-portal-totals{grid-template-columns:1fr!important}
          .client-portal-row{grid-template-columns:1fr!important}
          .client-aging-row{grid-template-columns:1fr!important}
          .client-aging-row span,.client-aging-row strong{text-align:left!important}
          .client-portal-shell{padding:16px!important}
          .client-portal-header{grid-template-columns:1fr!important}
          .client-portal-actions{justify-content:stretch!important}
          .client-portal-actions button,.client-portal-actions select{width:100%!important}
          .client-portal-modal-backdrop{align-items:end;padding:10px}
          .client-portal-modal{border-radius:24px 24px 16px 16px;max-height:94vh}
          .client-portal-modal-head{padding:20px}
          .client-portal-modal-body{padding:18px}
          .client-record-table{display:none}
          .client-record-cards{display:grid;gap:10px}
          .client-action-group button{width:100%}
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
        {activeModule === "inventario" ? <Inventory data={data} onSave={save} onExport={exportData} /> : null}
        {activeModule === "movimientos" ? <InventoryMovements data={data} onSave={save} onExport={exportData} /> : null}
        {activeModule === "ordenes" ? <Orders data={data} onSave={save} onExport={exportData} /> : null}
        {activeModule === "cargues" ? <Imports data={data} onData={setData} /> : null}
        {activeModule === "configuracion" ? <Config data={data} onSave={save} /> : null}
      </div>
    </main>
  );
}
