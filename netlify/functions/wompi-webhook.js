import crypto from "crypto";
import { getStore } from "@netlify/blobs";
import { processServicePaymentEvent } from "./utils/service-requests.js";
import promoUtils from "./utils/promo-codes.cjs";

const {
  parseMoneyValue
} = promoUtils;

function getValueByPath(obj, path) {
  return path.split(".").reduce((acc, key) => acc?.[key], obj);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function joinValues(values) {
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(" - ");
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
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

function safeJsonParse(value, fallback = {}) {
  try {
    return JSON.parse(String(value || "")) || fallback;
  } catch {
    return fallback;
  }
}

function hashReference(value = "") {
  return crypto
    .createHash("sha256")
    .update(String(value || "contarae"))
    .digest("hex")
    .slice(0, 16);
}

function getMarketingAttributionFromFormData(formData = {}) {
  const parsed = safeJsonParse(formData.marketing_attribution_json, {});
  const fields = [
    "landing_page",
    "initial_referrer",
    "latest_page",
    "latest_referrer",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_term",
    "utm_content",
    "utm_id",
    "gclid",
    "gbraid",
    "wbraid",
    "ga_client_id",
    "attribution_captured_at",
    "attribution_updated_at",
    "campaign_landing_page",
    "campaign_captured_at"
  ];

  return fields.reduce((acc, field) => {
    const value = String(formData[field] || parsed[field] || "").trim();
    if (value) acc[field] = value.slice(0, 500);
    return acc;
  }, {});
}

function buildGa4PaymentApprovedPayload(paidRecord = {}, reference = "") {
  const formData = paidRecord.formData || {};
  const attribution = getMarketingAttributionFromFormData(formData);
  const clientId = attribution.ga_client_id || `server.${hashReference(reference)}`;
  const amount =
    Number(paidRecord.pricing?.finalAmount || 0) ||
    parseCurrency(formData.tarifa_pagada || 0) ||
    Number(paidRecord.wompiTransaction?.amount_in_cents || 0) / 100 ||
    0;

  const attributionParams = Object.entries(attribution).reduce((acc, [key, value]) => {
    if (key === "ga_client_id") return acc;
    acc[key] = value;
    return acc;
  }, {});

  return {
    client_id: clientId,
    events: [
      {
        name: "cert_payment_approved",
        params: {
          currency: "COP",
          value: amount,
          transaction_id: paidRecord.wompiTransaction?.id || reference,
          certification_reference: reference,
          service_name: "certificacion_ingresos",
          payment_method_type: paidRecord.wompiTransaction?.payment_method_type || "",
          event_source: "wompi_webhook",
          engagement_time_msec: 1,
          ...attributionParams
        }
      }
    ]
  };
}

async function sendGa4PaymentApprovedEvent(paidRecord = {}, reference = "") {
  const apiSecret = process.env.GA4_API_SECRET;
  const measurementId = process.env.GA4_MEASUREMENT_ID || "G-HW3DMDT11N";

  if (!apiSecret) {
    return {
      skipped: true,
      reason: "GA4_API_SECRET no configurado"
    };
  }

  const response = await fetch(
    `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(measurementId)}&api_secret=${encodeURIComponent(apiSecret)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(buildGa4PaymentApprovedPayload(paidRecord, reference))
    }
  );

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(responseText || `GA4 Measurement Protocol respondió ${response.status}`);
  }

  return {
    sentAt: new Date().toISOString(),
    measurementId
  };
}

async function syncGa4PaymentApprovedEvent(paidRecord = {}, reference = "") {
  if (paidRecord.ga4PaymentApprovedSentAt) return paidRecord;

  try {
    const result = await sendGa4PaymentApprovedEvent(paidRecord, reference);
    if (result.skipped) return paidRecord;

    return {
      ...paidRecord,
      ga4PaymentApprovedSentAt: result.sentAt,
      ga4PaymentApprovedEventName: "cert_payment_approved",
      ga4MeasurementId: result.measurementId,
      lastGa4PaymentApprovedError: "",
      lastGa4PaymentApprovedErrorAt: ""
    };
  } catch (error) {
    return {
      ...paidRecord,
      lastGa4PaymentApprovedError: error.message,
      lastGa4PaymentApprovedErrorAt: new Date().toISOString()
    };
  }
}

function hasMeaningfulCurrencyValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return parseCurrency(raw) > 0;
}

function buildIncomeRows(formData = {}) {
  const rows = [
    ["Ingresos laborales", formData.ingresos_laborales],
    ["Pensiones", formData.pensiones],
    ["Dividendos", formData.dividendos],
    ["Inversiones", formData.inversiones],
    ["Arriendos", formData.arriendos],
    ["Remesas", formData.remesas],
    ["Otros ingresos mensuales recurrentes", formData.otros_ingresos]
  ];

  const filtered = rows.filter(([, value]) => hasMeaningfulCurrencyValue(value));

  if (hasMeaningfulCurrencyValue(formData.otros_ingresos) && String(formData.otros_descripcion || "").trim()) {
    filtered.push(["Detalle otros ingresos mensuales recurrentes", String(formData.otros_descripcion || "").trim()]);
  }

  try {
    const eventualRows = JSON.parse(String(formData.ingresos_eventuales_json || "[]"));
    if (Array.isArray(eventualRows)) {
      eventualRows
        .filter((row) => hasMeaningfulCurrencyValue(row?.value || row?.amount) && String(row?.concept || "").trim())
        .forEach((row, index) => {
          filtered.push([
            `Ingreso eventual ${index + 1}`,
            `${String(row.value || row.amount || "").trim()} — ${String(row.concept || "").trim()}`
          ]);
        });
    }
  } catch {
    // Ignore malformed eventual income rows in email summaries.
  }

  return filtered;
}

function buildSupportItems(paidRecord = {}) {
  const supportFiles = Array.isArray(paidRecord.supportFiles) ? paidRecord.supportFiles : [];
  return supportFiles
    .map((file) => [
      file.originalName || "Soporte adjunto",
      `${file.contentType || "archivo"} · ${file.size || 0} bytes`
    ]);
}

function buildBusinessSummaryRows(paidRecord, reference) {
  const formData = paidRecord.formData || {};
  const supportFiles = Array.isArray(paidRecord.supportFiles) ? paidRecord.supportFiles : [];

  return [
    ["Estado", "APROBADO"],
    ["Solicitud", paidRecord.consecutive ? `N° ${paidRecord.consecutive}` : "Sin consecutivo"],
    ["Referencia Wompi", reference],
    ["Transacción Wompi", paidRecord.wompiTransaction?.id || ""],
    ["Nombre", formData.nombre],
    ["Correo", formData.correo || formData.email || paidRecord.wompiTransaction?.customer_email || ""],
    ["Teléfono", formData.telefono],
    [
      "Documento",
      joinValues([formData.tipo_documento, formData.numero_documento])
    ],
    ["Lugar de expedición", formData.lugar_expedicion],
    ["Destino / entidad", joinValues([formData.destino, formData.entidad])],
    ["Período", formData.periodo],
    ["Total mensual recurrente", formData.total_ingresos],
    ["Total recurrente del período", formData.total_ingresos_periodo],
    ["Total eventuales del período", formData.total_ingresos_eventuales],
    ["Total global del período", formData.total_ingresos_global_periodo],
    ["Tarifa base", formData.tarifa_base],
    ["Código promocional", formData.codigo_promocional],
    ["Aliado estratégico", formData.aliado_estrategico],
    ["Descuento promocional", formData.descuento_promocional],
    ["Tarifa pagada", formData.tarifa_pagada],
    ["Comisión aliado estimada", formData.comision_aliado_estimada],
    ["Soportes adjuntos", supportFiles.length ? `${supportFiles.length} archivo(s)` : "Sin adjuntos"],
    ["Comentarios", formData.comentarios],
    ["Declaración juramentada", formData.declaracion_juramentada]
  ].filter(([, value]) => String(value || "").trim());
}

function buildRowsHtml(rows) {
  return rows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:10px 12px;border:1px solid #dbe5f1;background:#f8fbff;font-weight:700;color:#1b3a5c;">${escapeHtml(label)}</td>
          <td style="padding:10px 12px;border:1px solid #dbe5f1;color:#334155;">${escapeHtml(value)}</td>
        </tr>
      `
    )
    .join("");
}

function buildRowsText(rows) {
  return rows.map(([label, value]) => `${label}: ${value}`).join("\n");
}

function buildBusinessEmailHtml(paidRecord, reference, supportEmail) {
  const formData = paidRecord.formData || {};
  const summaryRows = buildBusinessSummaryRows(paidRecord, reference);
  const incomeRows = buildIncomeRows(formData);
  const supportRows = buildSupportItems(paidRecord);

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:18px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0b1d3a,#2563eb);padding:24px 28px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.82;">CONTARAE</div>
          <h1 style="margin:10px 0 4px;font-size:24px;">Nueva solicitud aprobada</h1>
          <p style="margin:0;font-size:14px;opacity:0.88;">El pago fue confirmado y el formulario ya se envió correctamente a Netlify Forms.</p>
        </div>
        <div style="padding:24px 28px;">
          <h2 style="margin:0 0 14px;font-size:18px;color:#0b1d3a;">Resumen de la solicitud</h2>
          <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
            ${buildRowsHtml(summaryRows)}
          </table>
          ${
            incomeRows.length
              ? `
                <h2 style="margin:0 0 14px;font-size:18px;color:#0b1d3a;">Detalle de ingresos reportados</h2>
                <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
                  ${buildRowsHtml(incomeRows)}
                </table>
              `
              : ""
          }
          ${
            supportRows.length
              ? `
                <h2 style="margin:0 0 14px;font-size:18px;color:#0b1d3a;">Soportes cargados en el formulario</h2>
                <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
                  ${buildRowsHtml(supportRows)}
                </table>
              `
              : ""
          }
          <div style="padding:16px 18px;border-radius:14px;background:#f8fbff;border:1px solid #dbe5f1;color:#334155;line-height:1.7;">
            Recuerde solicitar al cliente los soportes documentales que acrediten la realidad económica reportada. Puede responder directamente a este correo para continuar el seguimiento.
            ${
              supportEmail
                ? `<br/><br/>Correo de soporte: <strong>${escapeHtml(supportEmail)}</strong>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildBusinessEmailText(paidRecord, reference, supportEmail) {
  const formData = paidRecord.formData || {};
  const summaryRows = buildBusinessSummaryRows(paidRecord, reference);
  const incomeRows = buildIncomeRows(formData);
  const supportRows = buildSupportItems(paidRecord);

  return [
    "CONTARAE",
    "Nueva solicitud aprobada",
    "",
    buildRowsText(summaryRows),
    incomeRows.length ? `\nDetalle de ingresos:\n${buildRowsText(incomeRows)}` : "",
    supportRows.length ? `\nSoportes cargados:\n${buildRowsText(supportRows)}` : "",
    supportEmail ? `\nCorreo de soporte: ${supportEmail}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCustomerEmailHtml(paidRecord, reference, supportEmail, whatsappLink) {
  const formData = paidRecord.formData || {};
  const supportFiles = Array.isArray(paidRecord.supportFiles) ? paidRecord.supportFiles : [];
  const summaryRows = [
    ["Estado del pago", "APROBADO"],
    ["Solicitud", paidRecord.consecutive ? `N° ${paidRecord.consecutive}` : "En validación"],
    ["Referencia Wompi", reference],
    ["Ingreso mensual recurrente", formData.total_ingresos],
    ["Total recurrente del período", formData.total_ingresos_periodo],
    ["Total eventuales del período", formData.total_ingresos_eventuales],
    ["Total global del período", formData.total_ingresos_global_periodo],
    ["Valor normal", formData.tarifa_base],
    ["Código promocional", formData.codigo_promocional],
    ["Descuento promocional", formData.descuento_promocional],
    ["Valor pagado", formData.tarifa_pagada],
    ["Destino", joinValues([formData.destino, formData.entidad])],
    ["Período", formData.periodo]
  ].filter(([, value]) => String(value || "").trim());

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:18px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0b1d3a,#2563eb);padding:24px 28px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.82;">CONTARAE</div>
          <h1 style="margin:10px 0 4px;font-size:24px;">Pago confirmado</h1>
          <p style="margin:0;font-size:14px;opacity:0.88;">Su solicitud de certificación de ingresos quedó registrada correctamente.</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;color:#334155;line-height:1.8;">
            Hola ${escapeHtml(formData.nombre || "")}, su pago fue confirmado y ya iniciamos la revisión de su solicitud. A continuación encontrará los datos principales del trámite:
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
            ${buildRowsHtml(summaryRows)}
          </table>
          <div style="padding:16px 18px;border-radius:14px;background:#f8fbff;border:1px solid #dbe5f1;color:#334155;line-height:1.8;">
            <strong>Siguientes pasos:</strong><br/>
            1. ${
              supportFiles.length
                ? `Ya recibimos ${supportFiles.length} soporte(s) adjunto(s) en el formulario. Si falta alguno, puede enviarlo por WhatsApp o correo electrónico.`
                : "Envíe por WhatsApp o correo electrónico los soportes que acrediten la realidad económica de los ingresos reportados."
            }<br/>
            2. Puede remitir contratos, extractos bancarios, desprendibles de nómina, facturas, certificaciones y demás documentos de respaldo.<br/>
            3. Un profesional de CONTARAE revisará la documentación completa y se pondrá en contacto si requiere información adicional.
          </div>
          <div style="margin-top:18px;padding:16px 18px;border-radius:14px;background:#eef6ff;border:1px solid #cfe2ff;color:#1e3a5f;line-height:1.8;">
            ${
              supportEmail
                ? `Correo de contacto: <strong>${escapeHtml(supportEmail)}</strong><br/>`
                : ""
            }
            ${
              whatsappLink
                ? `WhatsApp: <a href="${escapeHtml(whatsappLink)}" style="color:#2563eb;text-decoration:none;font-weight:700;">Abrir conversación</a>`
                : ""
            }
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildCustomerEmailText(paidRecord, reference, supportEmail, whatsappLink) {
  const formData = paidRecord.formData || {};
  const supportFiles = Array.isArray(paidRecord.supportFiles) ? paidRecord.supportFiles : [];
  const rows = [
    ["Estado del pago", "APROBADO"],
    ["Solicitud", paidRecord.consecutive ? `N° ${paidRecord.consecutive}` : "En validación"],
    ["Referencia Wompi", reference],
    ["Ingreso mensual recurrente", formData.total_ingresos],
    ["Total recurrente del período", formData.total_ingresos_periodo],
    ["Total eventuales del período", formData.total_ingresos_eventuales],
    ["Total global del período", formData.total_ingresos_global_periodo],
    ["Valor normal", formData.tarifa_base],
    ["Código promocional", formData.codigo_promocional],
    ["Descuento promocional", formData.descuento_promocional],
    ["Valor pagado", formData.tarifa_pagada],
    ["Destino", joinValues([formData.destino, formData.entidad])],
    ["Período", formData.periodo]
  ].filter(([, value]) => String(value || "").trim());

  return [
    `Hola ${formData.nombre || ""},`,
    "",
    "Su pago fue confirmado y su solicitud de certificación de ingresos quedó registrada correctamente.",
    "",
    buildRowsText(rows),
    "",
    "Siguientes pasos:",
    supportFiles.length
      ? `1. Ya recibimos ${supportFiles.length} soporte(s) adjunto(s) en el formulario. Si falta alguno, puede enviarlo por WhatsApp o correo electrónico.`
      : "1. Envíe por WhatsApp o correo electrónico los soportes que acrediten la realidad económica de los ingresos reportados.",
    "2. Puede remitir contratos, extractos bancarios, desprendibles de nómina, facturas, certificaciones y demás documentos de respaldo.",
    "3. Un profesional de CONTARAE revisará la documentación completa y se pondrá en contacto si requiere información adicional.",
    supportEmail ? `Correo de contacto: ${supportEmail}` : "",
    whatsappLink ? `WhatsApp: ${whatsappLink}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function getPromoReferral(paidRecord = {}) {
  const formData = paidRecord.formData || {};
  const referral = paidRecord.promoReferral || {};
  const code = String(referral.code || formData.codigo_promocional || "").trim();
  const allyEmail = normalizeEmail(referral.allyEmail || "");
  const allyName = String(referral.allyName || formData.aliado_estrategico || "").trim();

  if (!code || !allyEmail || !allyName) return null;

  return {
    code,
    allyName,
    allyEmail,
    baseAmountLabel: referral.baseAmountLabel || formData.tarifa_base || "",
    discountAmountLabel: referral.discountAmountLabel || formData.descuento_promocional || "",
    finalAmountLabel: referral.finalAmountLabel || formData.tarifa_pagada || "",
    commissionRateLabel: referral.commissionRateLabel || formData.porcentaje_comision_aliado || "",
    commissionAmountLabel: referral.commissionAmountLabel || formData.comision_aliado_estimada || ""
  };
}

function buildAllyEmailHtml(paidRecord, reference) {
  const formData = paidRecord.formData || {};
  const referral = getPromoReferral(paidRecord);
  const rows = [
    ["Cliente referido", formData.nombre],
    ["Servicio adquirido", "Certificación de ingresos"],
    ["Referencia Wompi", reference],
    ["Código usado", referral?.code],
    ["Valor normal del servicio", referral?.baseAmountLabel],
    ["Descuento aplicado al cliente", referral?.discountAmountLabel],
    ["Valor pagado por el cliente", referral?.finalAmountLabel],
    ["Comisión pactada", referral?.commissionRateLabel],
    ["Valor estimado de comisión", referral?.commissionAmountLabel]
  ].filter(([, value]) => String(value || "").trim());

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;">
      <div style="max-width:720px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:18px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0b1d3a,#2563eb);padding:24px 28px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.82;">CONTARAE aliados</div>
          <h1 style="margin:10px 0 4px;font-size:24px;">Nueva venta referida</h1>
          <p style="margin:0;font-size:14px;opacity:0.88;">Un cliente usó tu código promocional en una certificación de ingresos.</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 16px;color:#334155;line-height:1.8;">
            Hola ${escapeHtml(referral?.allyName || "aliado")}, te informamos que se registró una nueva venta referida con tu código.
          </p>
          <table style="width:100%;border-collapse:collapse;margin-bottom:18px;">
            ${buildRowsHtml(rows)}
          </table>
          <div style="padding:16px 18px;border-radius:14px;background:#f8fbff;border:1px solid #dbe5f1;color:#334155;line-height:1.8;">
            Este valor corresponde a una <strong>comisión estimada</strong>. La liquidación definitiva se realizará conforme a los acuerdos comerciales establecidos con CONTARAE y podrá ajustarse ante reversos, devoluciones, contracargos o novedades administrativas.
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildAllyEmailText(paidRecord, reference) {
  const formData = paidRecord.formData || {};
  const referral = getPromoReferral(paidRecord);
  const rows = [
    ["Cliente referido", formData.nombre],
    ["Servicio adquirido", "Certificación de ingresos"],
    ["Referencia Wompi", reference],
    ["Código usado", referral?.code],
    ["Valor normal del servicio", referral?.baseAmountLabel],
    ["Descuento aplicado al cliente", referral?.discountAmountLabel],
    ["Valor pagado por el cliente", referral?.finalAmountLabel],
    ["Comisión pactada", referral?.commissionRateLabel],
    ["Valor estimado de comisión", referral?.commissionAmountLabel]
  ].filter(([, value]) => String(value || "").trim());

  return [
    `Hola ${referral?.allyName || "aliado"},`,
    "",
    "Se registró una nueva venta referida con tu código promocional.",
    "",
    buildRowsText(rows),
    "",
    "Este valor corresponde a una comisión estimada. La liquidación definitiva se realizará conforme a los acuerdos comerciales establecidos con CONTARAE y podrá ajustarse ante reversos, devoluciones, contracargos o novedades administrativas."
  ].join("\n");
}

async function sendResendEmail({
  apiKey,
  from,
  to,
  subject,
  html,
  text,
  replyTo,
  idempotencyKey
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
      reply_to: replyTo
    })
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || "Resend no aceptó el envío");
  }

  return payload;
}

function buildNetlifyFormPayload(formName, paidRecord, reference) {
  const params = new URLSearchParams();
  params.append("form-name", formName);

  const formData = paidRecord.formData || {};

  Object.entries(formData).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (["estado_pago", "consecutivo", "referencia_wompi"].includes(key)) return;
    params.append(key, String(value));
  });

  params.append("referencia_wompi", reference);
  params.append("consecutivo", String(paidRecord.consecutive || ""));
  params.append("estado_pago", "APROBADO");
  params.append(
    "email",
    String(formData.email || formData.correo || paidRecord.wompiTransaction?.customer_email || "")
  );
  params.append(
    "wompi_transaction_id",
    String(paidRecord.wompiTransaction?.id || "")
  );

  return params;
}

export default async (req, context) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Event-Checksum",
    "Content-Type": "application/json"
  };

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      { status: 405, headers }
    );
  }

  try {
    const body = await req.json();

    console.log("Webhook body recibido:", JSON.stringify(body));

    const eventName = body?.event || body?.name || "";
    const signature = body?.signature || {};
    const transaction =
      body?.data?.transaction ||
      body?.transaction ||
      body?.data ||
      null;

    if (!transaction) {
      console.log("Webhook sin transaction válida");
      return new Response(
        JSON.stringify({ error: "Evento sin transacción válida" }),
        { status: 400, headers }
      );
    }

    const reference =
      transaction?.reference ||
      body?.data?.reference ||
      "";

    const rawStatus = transaction?.status || "";
    const status = String(rawStatus).toUpperCase().trim();

    console.log("Webhook eventName:", eventName);
    console.log("Webhook reference:", reference);
    console.log("Webhook status:", status);

    if (!eventName) {
      return new Response(
        JSON.stringify({ error: "Evento sin nombre" }),
        { status: 400, headers }
      );
    }

    if (!reference) {
      return new Response(
        JSON.stringify({ error: "El evento no trae referencia" }),
        { status: 400, headers }
      );
    }

    const eventSecret = process.env.WOMPI_EVENTS_SECRET;

    if (!eventSecret) {
      return new Response(
        JSON.stringify({ error: "Falta WOMPI_EVENTS_SECRET en variables de entorno" }),
        { status: 500, headers }
      );
    }

    const properties = signature.properties || [];
    const timestamp = String(body?.timestamp || "");
    const wompiChecksum = String(signature.checksum || "").toUpperCase();

    const concatenatedValues = properties
      .map((path) => String(getValueByPath(body.data || body, path) ?? ""))
      .join("");

    const localChecksum = crypto
      .createHash("sha256")
      .update(`${concatenatedValues}${timestamp}${eventSecret}`)
      .digest("hex")
      .toUpperCase();

    console.log("Checksum local:", localChecksum);
    console.log("Checksum wompi:", wompiChecksum);

    if (localChecksum !== wompiChecksum) {
      console.log("Firma inválida");
      return new Response(
        JSON.stringify({ error: "Firma del evento inválida" }),
        { status: 401, headers }
      );
    }

    if (!["transaction.updated", "TRANSACTION.UPDATED"].includes(eventName)) {
      console.log("Evento ignorado:", eventName);
      return new Response(
        JSON.stringify({ ok: true, message: "Evento ignorado", event: eventName }),
        { status: 200, headers }
      );
    }

    if (String(reference).startsWith("CONTARAE-PAY-")) {
      const servicePaymentResult = await processServicePaymentEvent(reference, transaction);

      if (!servicePaymentResult) {
        return new Response(
          JSON.stringify({ error: "Pago de solicitud general no encontrado", reference }),
          { status: 404, headers }
        );
      }

      return new Response(
        JSON.stringify({
          ok: true,
          message: "Pago de solicitud general procesado",
          reference,
          status: servicePaymentResult.status,
          approved: servicePaymentResult.approved,
          failed: servicePaymentResult.failed
        }),
        { status: 200, headers }
      );
    }

    const store = getStore("certification-requests");
    const finalFailedStatuses = new Set([
      "DECLINED",
      "ERROR",
      "VOIDED",
      "FAILED",
      "REJECTED",
      "CANCELED",
      "CANCELLED"
    ]);

    if (status !== "APPROVED") {
      const pendingRecord = await store.get(`pending:${reference}`, { type: "json" });

      if (pendingRecord) {
        const isFinalFailure = finalFailedStatuses.has(status);

        await store.setJSON(`pending:${reference}`, {
          ...pendingRecord,
          status: isFinalFailure ? status.toLowerCase() : pendingRecord.status || "pending",
          lastEventStatus: status || pendingRecord.lastEventStatus || "",
          lastEventAt: new Date().toISOString(),
          wompiTransaction: {
            id: transaction.id,
            status: transaction.status,
            amount_in_cents: transaction.amount_in_cents,
            currency: transaction.currency,
            payment_method_type: transaction.payment_method_type,
            customer_email: transaction.customer_email
          }
        });
      }

      console.log("Transacción no aprobada todavía:", status);
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Evento recibido, pero no aprobado",
          reference,
          status
        }),
        { status: 200, headers }
      );
    }

    console.log("Transacción aprobada, continúa procesamiento");

    const formName = process.env.NETLIFY_FORM_NAME || "certificacion";

    let paidRecord = await store.get(`paid:${reference}`, { type: "json" });

    if (!paidRecord) {
      const pendingRecord = await store.get(`pending:${reference}`, { type: "json" });

      if (!pendingRecord) {
        return new Response(
          JSON.stringify({ error: "Solicitud pendiente no encontrada" }),
          { status: 404, headers }
        );
      }

      const expectedAmountInCents = Math.round(
        Number(pendingRecord.pricing?.finalAmount || parseMoneyValue(pendingRecord.formData?.tarifa_pagada || 0)) * 100
      );
      const receivedAmountInCents = Number(transaction.amount_in_cents || 0);

      if (expectedAmountInCents > 0 && receivedAmountInCents !== expectedAmountInCents) {
        await store.setJSON(`pending:${reference}`, {
          ...pendingRecord,
          status: "amount_mismatch",
          lastEventStatus: status,
          lastEventAt: new Date().toISOString(),
          amountMismatch: {
            expectedAmountInCents,
            receivedAmountInCents,
            transactionId: transaction.id || ""
          }
        });

        return new Response(
          JSON.stringify({
            error: "El valor pagado no coincide con la tarifa calculada para esta solicitud.",
            reference,
            expectedAmountInCents,
            receivedAmountInCents
          }),
          { status: 409, headers }
        );
      }

      const seqRecord = await store.get("meta:last-sequence", { type: "json" });
      const lastSequence = seqRecord?.lastSequence || 999;
      const newSequence = lastSequence + 1;

      paidRecord = {
        ...pendingRecord,
        status: "approved",
        approvedAt: new Date().toISOString(),
        consecutive: newSequence,
        wompiTransaction: {
          id: transaction.id,
          status: transaction.status,
          amount_in_cents: transaction.amount_in_cents,
          currency: transaction.currency,
          payment_method_type: transaction.payment_method_type,
          customer_email: transaction.customer_email
        }
      };

      await store.setJSON(`paid:${reference}`, paidRecord);
      await store.setJSON(`pending:${reference}`, {
        ...pendingRecord,
        status: "approved",
        consecutive: newSequence,
        approvedAt: paidRecord.approvedAt
      });
      await store.setJSON("meta:last-sequence", {
        lastSequence: newSequence
      });
    }

    const customerEmail = normalizeEmail(
      paidRecord.formData?.correo ||
        paidRecord.formData?.email ||
        paidRecord.wompiTransaction?.customer_email ||
        transaction.customer_email
    );
    const promoReferralForCompletion = getPromoReferral(paidRecord);
    const allNotificationsCompleted =
      Boolean(paidRecord.businessNotificationSentAt) &&
      (customerEmail ? Boolean(paidRecord.customerNotificationSentAt) : true) &&
      (promoReferralForCompletion ? Boolean(paidRecord.allyNotificationSentAt) : true);
    let updatedPaidRecord = await syncGa4PaymentApprovedEvent(paidRecord, reference);

    if (updatedPaidRecord.netlifySubmittedAt && allNotificationsCompleted) {
      if (updatedPaidRecord !== paidRecord) {
        await store.setJSON(`paid:${reference}`, updatedPaidRecord);
      }
      return new Response(
        JSON.stringify({
          ok: true,
          message: "Solicitud ya aprobada y enviada a Netlify Forms",
          reference,
          consecutivo: updatedPaidRecord.consecutive,
          submittedAt: updatedPaidRecord.netlifySubmittedAt,
          businessNotificationSentAt: updatedPaidRecord.businessNotificationSentAt || null,
          customerNotificationSentAt: updatedPaidRecord.customerNotificationSentAt || null,
          allyNotificationSentAt: updatedPaidRecord.allyNotificationSentAt || null,
          ga4PaymentApprovedSentAt: updatedPaidRecord.ga4PaymentApprovedSentAt || null,
          ga4PaymentApprovedWarning: updatedPaidRecord.lastGa4PaymentApprovedError || null
        }),
        { status: 200, headers }
      );
    }

    if (!updatedPaidRecord.netlifySubmittedAt) {
      const origin = new URL(req.url).origin;
      const params = buildNetlifyFormPayload(formName, updatedPaidRecord, reference);

      const submitResponse = await fetch(`${origin}/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params.toString()
      });

      if (!submitResponse.ok) {
        const responseText = await submitResponse.text();
        return new Response(
          JSON.stringify({
            error: "Netlify Forms no aceptó el envío",
            detail: responseText
          }),
          { status: 500, headers }
        );
      }

      updatedPaidRecord = {
        ...updatedPaidRecord,
        netlifySubmittedAt: new Date().toISOString(),
        netlifyFormName: formName
      };
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL || "CONTARAE <notificaciones@send.contarae.com>";
    const replyToBusinessEmail = process.env.RESEND_REPLY_TO || "info@contarae.com";
    const businessNotificationEmail =
      process.env.BUSINESS_NOTIFICATION_EMAIL || replyToBusinessEmail;
    const whatsappLink = `https://wa.me/573001432008?text=${encodeURIComponent(
      `Hola CONTARAE, envío los soportes de mi solicitud ${updatedPaidRecord.consecutive ? `N° ${updatedPaidRecord.consecutive}` : ""} con referencia ${reference}.`
    )}`;
    const notificationErrors = {};

    if (resendApiKey) {
      if (!updatedPaidRecord.businessNotificationSentAt && businessNotificationEmail) {
        try {
          const businessEmailResult = await sendResendEmail({
            apiKey: resendApiKey,
            from: resendFromEmail,
            to: businessNotificationEmail,
            subject: `CONTARAE | Solicitud aprobada ${updatedPaidRecord.consecutive ? `N° ${updatedPaidRecord.consecutive}` : reference}`,
            html: buildBusinessEmailHtml(updatedPaidRecord, reference, replyToBusinessEmail),
            text: buildBusinessEmailText(updatedPaidRecord, reference, replyToBusinessEmail),
            replyTo: customerEmail || replyToBusinessEmail,
            idempotencyKey: `${reference}:business`
          });

          updatedPaidRecord = {
            ...updatedPaidRecord,
            businessNotificationSentAt: new Date().toISOString(),
            businessNotificationId: businessEmailResult.id || ""
          };
        } catch (error) {
          notificationErrors.business = error.message;
        }
      }

      if (customerEmail && !updatedPaidRecord.customerNotificationSentAt) {
        try {
          const customerEmailResult = await sendResendEmail({
            apiKey: resendApiKey,
            from: resendFromEmail,
            to: customerEmail,
            subject: `CONTARAE | Confirmación de pago de su certificación de ingresos`,
            html: buildCustomerEmailHtml(
              updatedPaidRecord,
              reference,
              replyToBusinessEmail,
              whatsappLink
            ),
            text: buildCustomerEmailText(
              updatedPaidRecord,
              reference,
              replyToBusinessEmail,
              whatsappLink
            ),
            replyTo: replyToBusinessEmail,
            idempotencyKey: `${reference}:customer`
          });

          updatedPaidRecord = {
            ...updatedPaidRecord,
            customerNotificationSentAt: new Date().toISOString(),
            customerNotificationId: customerEmailResult.id || ""
          };
        } catch (error) {
          notificationErrors.customer = error.message;
        }
      }

      const promoReferral = getPromoReferral(updatedPaidRecord);
      if (promoReferral && !updatedPaidRecord.allyNotificationSentAt) {
        try {
          const allyEmailResult = await sendResendEmail({
            apiKey: resendApiKey,
            from: resendFromEmail,
            to: promoReferral.allyEmail,
            subject: `CONTARAE | Nueva venta referida con código ${promoReferral.code}`,
            html: buildAllyEmailHtml(updatedPaidRecord, reference),
            text: buildAllyEmailText(updatedPaidRecord, reference),
            replyTo: replyToBusinessEmail,
            idempotencyKey: `${reference}:ally:${promoReferral.code}`
          });

          updatedPaidRecord = {
            ...updatedPaidRecord,
            allyNotificationSentAt: new Date().toISOString(),
            allyNotificationId: allyEmailResult.id || ""
          };
        } catch (error) {
          notificationErrors.ally = error.message;
        }
      }
    } else {
      notificationErrors.resend = "RESEND_API_KEY no configurada";
    }

    if (Object.keys(notificationErrors).length) {
      updatedPaidRecord = {
        ...updatedPaidRecord,
        lastNotificationError: notificationErrors,
        lastNotificationErrorAt: new Date().toISOString()
      };
    }

    await store.setJSON(`paid:${reference}`, updatedPaidRecord);

    return new Response(
      JSON.stringify({
        ok: true,
        message: "Webhook procesado y formulario enviado correctamente",
        reference,
        consecutivo: updatedPaidRecord.consecutive,
        submittedAt: updatedPaidRecord.netlifySubmittedAt,
        businessNotificationSentAt: updatedPaidRecord.businessNotificationSentAt || null,
        customerNotificationSentAt: updatedPaidRecord.customerNotificationSentAt || null,
        allyNotificationSentAt: updatedPaidRecord.allyNotificationSentAt || null,
        ga4PaymentApprovedSentAt: updatedPaidRecord.ga4PaymentApprovedSentAt || null,
        ga4PaymentApprovedWarning: updatedPaidRecord.lastGa4PaymentApprovedError || null,
        notificationWarnings: Object.keys(notificationErrors).length
          ? notificationErrors
          : null
      }),
      { status: 200, headers }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Error procesando webhook de Wompi",
        detail: error.message
      }),
      { status: 500, headers }
    );
  }
};
