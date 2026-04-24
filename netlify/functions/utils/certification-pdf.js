import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { getProfessionalProfile } from "./professional-documents.js";
import { buildCertificateData } from "./certification-admin.js";
import {
  buildCertificateVerificationCode,
  buildCertificateVerificationDisplayUrl,
  buildCertificateVerificationUrl
} from "./certificate-verification.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 48;
const BODY_X = 56;
const TOP_MARGIN = 58;
const BOTTOM_MARGIN = 58;
const ACCENT = rgb(0.12, 0.24, 0.45);
const ACCENT_SOFT = rgb(0.9, 0.95, 1);
const TEXT = rgb(0.16, 0.2, 0.28);
const TEXT_SOFT = rgb(0.38, 0.44, 0.54);
const BORDER = rgb(0.82, 0.88, 0.95);

async function createQrPngBytes(value) {
  const dataUrl = await QRCode.toDataURL(String(value || ""), {
    errorCorrectionLevel: "M",
    margin: 0,
    width: 320,
    color: {
      dark: "#0F264A",
      light: "#FFFFFF"
    }
  });

  const base64 = dataUrl.split(",")[1] || "";
  return Buffer.from(base64, "base64");
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

function wrapText(text, font, fontSize, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const tentative = currentLine ? `${currentLine} ${word}` : word;
    if (font.widthOfTextAtSize(tentative, fontSize) <= maxWidth || !currentLine) {
      currentLine = tentative;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [""];
}

function drawJustifiedLine(page, line, x, y, width, font, fontSize, color) {
  const words = String(line || "").split(/\s+/).filter(Boolean);
  if (words.length <= 1) {
    page.drawText(line, { x, y, size: fontSize, font, color });
    return;
  }

  const totalWordsWidth = words.reduce((sum, word) => sum + font.widthOfTextAtSize(word, fontSize), 0);
  const gaps = words.length - 1;
  const spaceWidth = (width - totalWordsWidth) / gaps;
  let cursor = x;

  words.forEach((word, index) => {
    page.drawText(word, { x: cursor, y, size: fontSize, font, color });
    cursor += font.widthOfTextAtSize(word, fontSize);
    if (index < gaps) cursor += spaceWidth;
  });
}

function formatLongDate(value = new Date()) {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "long",
      day: "numeric"
    }).format(new Date(value));
  } catch {
    return String(value);
  }
}

function removeAccents(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const NUMBER_WORDS = {
  0: "CERO",
  1: "UNO",
  2: "DOS",
  3: "TRES",
  4: "CUATRO",
  5: "CINCO",
  6: "SEIS",
  7: "SIETE",
  8: "OCHO",
  9: "NUEVE",
  10: "DIEZ",
  11: "ONCE",
  12: "DOCE",
  13: "TRECE",
  14: "CATORCE",
  15: "QUINCE",
  16: "DIECISEIS",
  17: "DIECISIETE",
  18: "DIECIOCHO",
  19: "DIECINUEVE",
  20: "VEINTE",
  21: "VEINTIUNO",
  22: "VEINTIDOS",
  23: "VEINTITRES",
  24: "VEINTICUATRO",
  25: "VEINTICINCO",
  26: "VEINTISEIS",
  27: "VEINTISIETE",
  28: "VEINTIOCHO",
  29: "VEINTINUEVE"
};

const TENS_WORDS = {
  3: "TREINTA",
  4: "CUARENTA",
  5: "CINCUENTA",
  6: "SESENTA",
  7: "SETENTA",
  8: "OCHENTA",
  9: "NOVENTA"
};

const HUNDREDS_WORDS = {
  1: "CIENTO",
  2: "DOSCIENTOS",
  3: "TRESCIENTOS",
  4: "CUATROCIENTOS",
  5: "QUINIENTOS",
  6: "SEISCIENTOS",
  7: "SETECIENTOS",
  8: "OCHOCIENTOS",
  9: "NOVECIENTOS"
};

const PERIOD_WORD_MAP = {
  un: 1,
  uno: 1,
  una: 1,
  dos: 2,
  tres: 3,
  cuatro: 4,
  cinco: 5,
  seis: 6,
  siete: 7,
  ocho: 8,
  nueve: 9,
  diez: 10,
  once: 11,
  doce: 12
};

function apocopateSpanishNumber(value) {
  return String(value || "")
    .replace(/VEINTIUNO$/g, "VEINTIUN")
    .replace(/ Y UNO$/g, " Y UN")
    .replace(/UNO$/g, "UN");
}

function convertTripletToWords(value) {
  const number = Number(value || 0);
  if (!number) return "";
  if (number <= 29) return NUMBER_WORDS[number];
  if (number === 100) return "CIEN";

  const hundreds = Math.floor(number / 100);
  const remainder = number % 100;
  const parts = [];

  if (hundreds > 0) {
    parts.push(HUNDREDS_WORDS[hundreds]);
  }

  if (remainder > 0) {
    if (remainder <= 29) {
      parts.push(NUMBER_WORDS[remainder]);
    } else {
      const tens = Math.floor(remainder / 10);
      const units = remainder % 10;
      parts.push(`${TENS_WORDS[tens]}${units ? ` Y ${NUMBER_WORDS[units]}` : ""}`);
    }
  }

  return parts.join(" ");
}

function numberToSpanishWords(value) {
  const number = Math.floor(Number(value || 0));
  if (!number) return "CERO";
  if (number < 1000) return convertTripletToWords(number);

  const millions = Math.floor(number / 1000000);
  const thousands = Math.floor((number % 1000000) / 1000);
  const remainder = number % 1000;
  const parts = [];

  if (millions > 0) {
    if (millions === 1) {
      parts.push("UN MILLON");
    } else {
      parts.push(`${apocopateSpanishNumber(convertTripletToWords(millions))} MILLONES`);
    }
  }

  if (thousands > 0) {
    if (thousands === 1) {
      parts.push("MIL");
    } else {
      parts.push(`${apocopateSpanishNumber(convertTripletToWords(thousands))} MIL`);
    }
  }

  if (remainder > 0) {
    parts.push(convertTripletToWords(remainder));
  }

  return parts.join(" ");
}

function buildAmountInLetters(value) {
  const amount = parseCurrency(value);
  const integerAmount = Math.max(0, Math.floor(amount));
  const amountWords = apocopateSpanishNumber(numberToSpanishWords(integerAmount));
  const formattedAmount = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(integerAmount);

  return `${amountWords} PESOS M/CTE ($${formattedAmount})`;
}

function formatCurrencyCOP(value, { minimumFractionDigits = 0, maximumFractionDigits = 0 } = {}) {
  const amount = parseCurrency(value);
  return `$${new Intl.NumberFormat("es-CO", {
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount)}`;
}

function formatDigitGroups(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return String(value || "").trim();
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0
  }).format(Number(digits));
}

function formatDocumentNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return /\d/.test(raw) ? formatDigitGroups(raw) : raw;
}

function formatProfessionalCardNumber(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const match = raw.match(/^(\d+)([\s.-]*[A-Za-z].*)?$/);
  if (!match) return raw;

  const formattedDigits = formatDigitGroups(match[1]);
  const suffix = String(match[2] || "")
    .trim()
    .replace(/^[.\s-]+/, "");

  return suffix ? `${formattedDigits}-${suffix.toUpperCase()}` : formattedDigits;
}

function buildDocumentLabel(documentType, documentNumber) {
  const type = String(documentType || "").trim();
  const number = formatDocumentNumber(documentNumber);
  return [type, number].filter(Boolean).join(" ");
}

function buildCustomerIdentificationLabel(formData = {}) {
  const documentLabel = buildDocumentLabel(formData.tipo_documento, formData.numero_documento) || "documento no informado";
  const expeditionPlace = String(formData.lugar_expedicion || "").trim();
  return expeditionPlace ? `${documentLabel}, documento expedido en ${expeditionPlace}` : documentLabel;
}

function buildIncomeSourceLabel(row, otherIncomeDetail) {
  if (!row) return "";
  if (row.label === "Otros ingresos mensuales recurrentes" && otherIncomeDetail?.value) {
    return `otros ingresos mensuales recurrentes correspondientes a ${otherIncomeDetail.value}`;
  }
  return row.label.toLowerCase();
}

function capitalizeText(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function extractNumericToken(rawValue) {
  const digits = String(rawValue || "").match(/\d+/)?.[0];
  if (digits) return Number(digits);

  const normalized = removeAccents(rawValue).toLowerCase();
  const textToken = normalized
    .split(/\s+/)
    .map((part) => part.trim())
    .find((part) => PERIOD_WORD_MAP[part]);

  return PERIOD_WORD_MAP[textToken] || null;
}

function resolveCertifiedPeriodMonths(formData = {}) {
  const explicitMonths = Number(String(formData.periodo_meses || "").replace(/\D/g, "")) || 0;
  if (explicitMonths > 0) return explicitMonths;

  const rawPeriod = formData.periodo;
  const normalized = removeAccents(rawPeriod).toLowerCase();
  if (!normalized) return 0;

  let months = null;
  const baseCount = extractNumericToken(rawPeriod) || (/ultimo|actual/.test(normalized) ? 1 : null);

  if (normalized.includes("semestre")) {
    months = (baseCount || 1) * 6;
  } else if (normalized.includes("trimestre")) {
    months = (baseCount || 1) * 3;
  } else if (normalized.includes("bimestre")) {
    months = (baseCount || 1) * 2;
  } else if (normalized.includes("ano") || normalized.includes("año")) {
    months = (baseCount || 1) * 12;
  } else if (normalized.includes("mes")) {
    months = baseCount || 1;
  }

  return months || 0;
}

function buildCertifiedPeriodInMonths(formData = {}) {
  const months = resolveCertifiedPeriodMonths(formData);
  if (!months) {
    return String(formData.periodo || "").trim() || "el período certificado indicado por el solicitante";
  }
  return `${numberToSpanishWords(months).toLowerCase()} (${months}) ${months === 1 ? "mes" : "meses"}`;
}

function buildRecurringIncomeRows(formData = {}) {
  const otherIncomeDetail = String(formData.otros_descripcion || "").trim();

  return [
    ["Ingresos laborales", formData.ingresos_laborales],
    ["Pensiones", formData.pensiones],
    ["Dividendos", formData.dividendos],
    ["Inversiones", formData.inversiones],
    ["Arriendos", formData.arriendos],
    ["Remesas", formData.remesas],
    ["Otros ingresos mensuales recurrentes", formData.otros_ingresos]
  ]
    .filter(([, value]) => hasMeaningfulCurrencyValue(value))
    .map(([label, value]) => ({
      label,
      displayLabel: buildIncomeSourceLabel({ label }, { value: otherIncomeDetail }),
      listLabel:
        label === "Otros ingresos mensuales recurrentes" && otherIncomeDetail
          ? `Otros ingresos mensuales recurrentes (${otherIncomeDetail})`
          : label,
      value: String(value || "").trim(),
      numericValue: parseCurrency(value)
    }));
}

function buildEventualIncomeRows(formData = {}) {
  try {
    const parsed = JSON.parse(String(formData.ingresos_eventuales_json || "[]"));
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((row) => ({
        concept: String(row?.concept || "").trim(),
        value: String(row?.value || row?.amount || "").trim()
      }))
      .filter((row) => hasMeaningfulCurrencyValue(row.value) && row.concept)
      .map((row) => ({
        ...row,
        listLabel: row.concept,
        numericValue: parseCurrency(row.value)
      }));
  } catch {
    return [];
  }
}

function getRequestedPurpose(formData = {}) {
  return [formData.destino, formData.entidad].filter(Boolean).join(" - ");
}

async function readAssetBytes(fileName) {
  const candidatePaths = [
    path.resolve(process.cwd(), "netlify/functions/assets", fileName),
    path.resolve(process.cwd(), "functions/assets", fileName),
    path.resolve(process.cwd(), "assets", fileName)
  ];

  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      candidatePaths.unshift(new URL(`../assets/${fileName}`, import.meta.url));
    }
  } catch {
    // Continue with filesystem paths.
  }

  let lastError = null;

  for (const candidate of candidatePaths) {
    try {
      return await fs.readFile(candidate);
    } catch (error) {
      lastError = error;
    }
  }

  throw new Error(`No fue posible cargar el recurso ${fileName}. ${lastError?.message || ""}`.trim());
}

export function buildCertificationNarrative(record = {}) {
  const formData = buildCertificateData(record);
  const profile = getProfessionalProfile();
  const destination = getRequestedPurpose(formData);
  const recurringRows = buildRecurringIncomeRows(formData);
  const eventualRows = buildEventualIncomeRows(formData);
  const totalMonthlyRecurring =
    parseCurrency(formData.total_ingresos) ||
    recurringRows.reduce((sum, row) => sum + row.numericValue, 0);
  const totalRecurringPeriod =
    parseCurrency(formData.total_ingresos_periodo) ||
    totalMonthlyRecurring * resolveCertifiedPeriodMonths(formData);
  const totalEventualPeriod =
    parseCurrency(formData.total_ingresos_eventuales) ||
    eventualRows.reduce((sum, row) => sum + row.numericValue, 0);
  const totalGlobalPeriod =
    parseCurrency(formData.total_ingresos_global_periodo) ||
    totalRecurringPeriod + totalEventualPeriod;
  const periodInMonths = buildCertifiedPeriodInMonths(formData);
  const formattedCustomerDocument = buildCustomerIdentificationLabel(formData);
  const formattedAccountantDocument = formatDocumentNumber(profile.accountantDocumentNumber) || "POR CONFIGURAR";
  const formattedProfessionalCard = formatProfessionalCardNumber(profile.professionalCardNumber) || "POR CONFIGURAR";
  const customerReference = String(formData.nombre || "").trim() || "la parte interesada";
  const blocks = [
    {
      type: "paragraph",
      emphasis: "normal",
      text: `Yo, ${profile.accountantName}, ${profile.title}, identificado con la cédula de ciudadanía No. ${formattedAccountantDocument}, titular de la Tarjeta Profesional No. ${formattedProfessionalCard}, certifico que revisé la información suministrada y los documentos soporte aportados por ${customerReference}, identificado(a) con ${formattedCustomerDocument}, con el propósito de evaluar la razonabilidad de los ingresos reportados durante el período certificado de ${periodInMonths}.`
    }
  ];

  if (recurringRows.length === 1) {
    blocks.push({
      type: "paragraph",
      emphasis: "normal",
      text: `Con fundamento en la documentación examinada, se establece que ${customerReference} acredita ingresos mensuales recurrentes por concepto de ${recurringRows[0].displayLabel}.`
    });
  } else if (recurringRows.length === 2) {
    blocks.push({
      type: "paragraph",
      emphasis: "normal",
      text: `Con fundamento en la documentación examinada, se establece que ${customerReference} acredita ingresos mensuales recurrentes derivados de ${recurringRows[0].displayLabel} por valor de ${formatCurrencyCOP(recurringRows[0].numericValue)} y de ${recurringRows[1].displayLabel} por valor de ${formatCurrencyCOP(recurringRows[1].numericValue)}.`
    });
  } else if (recurringRows.length > 2) {
    blocks.push({
      type: "paragraph",
      emphasis: "normal",
      text: `Con fundamento en la documentación examinada, se establece que ${customerReference} acredita ingresos mensuales recurrentes derivados de los conceptos que se relacionan a continuación:`
    });
    blocks.push({
      type: "list",
      variant: "recurring",
      marginAfter: 12,
      items: recurringRows.map((row) => ({
        label: capitalizeText(row.listLabel),
        value: formatCurrencyCOP(row.numericValue)
      }))
    });
  }

  blocks.push({
    type: "paragraph",
    emphasis: "highlight",
    text: `En consecuencia, el valor mensual recurrente certificado asciende a la suma de ${buildAmountInLetters(totalMonthlyRecurring)}.`
  });
  blocks.push({
    type: "paragraph",
    emphasis: "highlight",
    text: `En ese sentido, para el período objeto de certificación correspondiente a ${periodInMonths}, el total de los ingresos recurrentes certificados asciende a la suma de ${buildAmountInLetters(totalRecurringPeriod)}.`
  });

  if (eventualRows.length) {
    blocks.push({
      type: "heading",
      text: "Ingresos eventuales del período certificado"
    });

    if (eventualRows.length === 1) {
      blocks.push({
        type: "paragraph",
        emphasis: "normal",
        text: `Adicionalmente, durante el período objeto de certificación se identificó un ingreso eventual por valor de ${formatCurrencyCOP(eventualRows[0].numericValue)}, por concepto de ${eventualRows[0].concept}.`
      });
    } else if (eventualRows.length === 2) {
      blocks.push({
        type: "paragraph",
        emphasis: "normal",
        text: `Adicionalmente, durante el período objeto de certificación se identificaron ingresos eventuales correspondientes a ${eventualRows[0].concept} por valor de ${formatCurrencyCOP(eventualRows[0].numericValue)} y a ${eventualRows[1].concept} por valor de ${formatCurrencyCOP(eventualRows[1].numericValue)}.`
      });
    } else {
      blocks.push({
        type: "paragraph",
        emphasis: "normal",
        text: "Adicionalmente, durante el período objeto de certificación se identificaron los siguientes ingresos eventuales:"
      });
      blocks.push({
        type: "list",
        variant: "eventual",
        marginAfter: 12,
        items: eventualRows.map((row) => ({
          label: capitalizeText(row.listLabel),
          value: formatCurrencyCOP(row.numericValue)
        }))
      });
    }

    blocks.push({
      type: "paragraph",
      emphasis: "normal",
      text:
        eventualRows.length === 1
          ? "Se deja expresa constancia de que este valor corresponde a un hecho económico no ordinario, no fijo y no periódico, razón por la cual no hace parte del ingreso mensual recurrente certificado. No obstante, se incluye dentro del análisis del período por encontrarse soportado documentalmente y haber sido percibido dentro del lapso objeto de certificación."
          : `Se deja expresa constancia de que ${eventualRows.length === 2 ? "dichos valores" : "los anteriores valores"} corresponden a hechos económicos no ordinarios, no fijos y no periódicos, razón por la cual no hacen parte del ingreso mensual recurrente certificado. No obstante, dichos ingresos se incluyen dentro del análisis del período por encontrarse soportados documentalmente y haber sido percibidos dentro del lapso objeto de certificación.`
    });
    blocks.push({
      type: "paragraph",
      emphasis: "highlight",
      text: `Por lo anterior, el total de los ingresos eventuales acreditados durante el período certificado asciende a la suma de ${buildAmountInLetters(totalEventualPeriod)}.`
    });
    blocks.push({
      type: "paragraph",
      emphasis: "highlight",
      text: `En consecuencia, el total global de ingresos acreditados durante el período certificado, sumando ingresos recurrentes e ingresos eventuales, asciende a la suma de ${buildAmountInLetters(totalGlobalPeriod)}.`
    });
  }

  blocks.push({
    type: "paragraph",
    emphasis: "normal",
    text: destination
      ? `La presente certificación se expide a solicitud de la parte interesada para ser presentada ante ${destination}, con base exclusiva en los documentos y soportes puestos a disposición para su análisis. En tal sentido, no constituye auditoría integral, revisoría fiscal ni dictamen sobre estados financieros, sino una constancia profesional emitida dentro del alcance propio de la revisión efectuada.`
      : "La presente certificación se expide a solicitud de la parte interesada, con base exclusiva en los documentos y soportes puestos a disposición para su análisis. En tal sentido, no constituye auditoría integral, revisoría fiscal ni dictamen sobre estados financieros, sino una constancia profesional emitida dentro del alcance propio de la revisión efectuada."
  });
  blocks.push({
    type: "paragraph",
    emphasis: "normal",
    text: `Se expide en ${profile.city}, el ${formatLongDate(new Date())}.`,
    justify: false
  });

  return {
    blocks,
    recurringRows,
    eventualRows,
    compactNarrative: recurringRows.length <= 2 && eventualRows.length <= 2,
    formattedAccountantDocument,
    formattedCustomerDocument,
    formattedProfessionalCard,
    totals: {
      totalMonthlyRecurring,
      totalRecurringPeriod,
      totalEventualPeriod,
      totalGlobalPeriod
    }
  };
}

export async function generateCertificationPdf(record = {}) {
  const profile = getProfessionalProfile();
  const certificationContent = buildCertificationNarrative(record);
  const pdf = await PDFDocument.create();
  const verificationCode = buildCertificateVerificationCode(record);
  const verificationUrl = buildCertificateVerificationUrl(record);
  const verificationDisplayUrl = buildCertificateVerificationDisplayUrl();
  const verificationConsecutive = String(record.consecutive || record.reference || "").trim() || "POR ASIGNAR";
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sectionFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const bodyBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await pdf.embedPng(await readAssetBytes("contarae-logo-completo.png"));
  const signatureImage = await pdf.embedPng(await readAssetBytes("contarae-firma.png"));
  const qrImage = await pdf.embedPng(await createQrPngBytes(verificationUrl));
  const baseLogoDims = logoImage.scale(Math.min(0.42, 164 / logoImage.width));
  const baseSignatureDims = signatureImage.scale(Math.min(0.46, 200 / signatureImage.width));
  const baseQrDims = qrImage.scale(Math.min(0.22, 66 / qrImage.width));
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
  const footerBottomY = 38;
  let scale = 1;
  const fitSafetyPadding = 16;

  pdf.setTitle(`Certificación de ingresos ${record.consecutive || record.reference || "CONTARAE"}`);
  pdf.setAuthor(profile.accountantName || "CONTARAE");
  pdf.setCreator("CONTARAE");
  pdf.setProducer("CONTARAE");
  pdf.setSubject("Certificación de ingresos con validación por QR");
  pdf.setKeywords(["certificación de ingresos", "CONTARAE", "validación", verificationCode]);

  const paragraphStyleFor = (currentScale, emphasis = "normal", compactMode = false) =>
    emphasis === "highlight"
      ? {
          font: bodyBold,
          fontSize: (compactMode ? 11.1 : 10.85) * currentScale,
          lineHeight: (compactMode ? 15.1 : 14.8) * currentScale,
          marginAfter: (compactMode ? 10 : 8.5) * currentScale
        }
      : {
          font: bodyFont,
          fontSize: (compactMode ? 11 : 10.8) * currentScale,
          lineHeight: (compactMode ? 14.9 : 14.5) * currentScale,
          marginAfter: (compactMode ? 9.5 : 7.5) * currentScale
        };

  const estimateListHeight = (items = [], currentScale, blockWidth) => {
    const valueColumnWidth = 170 * currentScale;
    const labelColumnWidth = blockWidth - valueColumnWidth - 22 * currentScale;
    let height = 0;

    items.forEach(({ label, value }) => {
      const labelLines = wrapText(String(label || ""), bodyBold, 10.35 * currentScale, labelColumnWidth);
      const valueLines = wrapText(String(value || ""), bodyFont, 10.1 * currentScale, valueColumnWidth);
      const rowLines = Math.max(labelLines.length, valueLines.length);
      height += rowLines * 11.7 * currentScale + 2.5 * currentScale;
    });

    return height;
  };

  const estimateSignatureBlockHeight = (currentScale) => {
    const signatureColumnHeight = baseSignatureDims.height * currentScale + 78 * currentScale;
    const qrColumnHeight = baseQrDims.height * currentScale + 86 * currentScale;
    return Math.max(signatureColumnHeight, qrColumnHeight) + 12 * currentScale;
  };

  const estimateBodyHeight = (currentScale) => {
    const blockWidth = PAGE_WIDTH - BODY_X * 2;
    const compactMode = certificationContent.compactNarrative;
    let height = 0;

    height += baseLogoDims.height * currentScale + 18 * currentScale;
    height += 22 * currentScale + 18 * currentScale;
    height += 10.5 * currentScale + 16 * currentScale + 16 * currentScale;
    height += 12 * currentScale;

    certificationContent.blocks.forEach((block) => {
      if (block.type === "heading") {
        height += 20 * currentScale;
        return;
      }

      if (block.type === "list") {
        height += estimateListHeight(block.items, currentScale, blockWidth) + (block.marginAfter || 10) * currentScale;
        return;
      }

      const style = paragraphStyleFor(currentScale, block.emphasis, compactMode);
      const lines = wrapText(block.text, style.font, style.fontSize, blockWidth);
      height += lines.length * style.lineHeight + style.marginAfter;
    });

    return height;
  };

  while (estimateBodyHeight(scale) + estimateSignatureBlockHeight(scale) + fitSafetyPadding > availableHeight && scale > 0.42) {
    scale -= scale > 0.68 ? 0.04 : 0.02;
  }

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - TOP_MARGIN;
  const contentWidth = PAGE_WIDTH - BODY_X * 2;
  const logoDims = {
    width: baseLogoDims.width * scale,
    height: baseLogoDims.height * scale
  };
  const signatureDims = {
    width: baseSignatureDims.width * scale,
    height: baseSignatureDims.height * scale
  };
  const qrDims = {
    width: baseQrDims.width * scale,
    height: baseQrDims.height * scale
  };
  const signatureBlockTopY = footerBottomY + estimateSignatureBlockHeight(scale);
  const compactIncomeMode = certificationContent.compactNarrative;

  page.drawRectangle({
    x: 28,
    y: 28,
    width: PAGE_WIDTH - 56,
    height: PAGE_HEIGHT - 56,
    borderColor: BORDER,
    borderWidth: 1
  });
  page.drawRectangle({
    x: 28,
    y: PAGE_HEIGHT - 38,
    width: PAGE_WIDTH - 56,
    height: 8,
    color: ACCENT
  });
  page.drawRectangle({
    x: 28,
    y: 30,
    width: PAGE_WIDTH - 56,
    height: 5,
    color: ACCENT_SOFT
  });

  const drawSectionHeading = (label) => {
    page.drawText(label.toUpperCase(), {
      x: BODY_X,
      y,
      size: 9.3 * scale,
      font: sectionFont,
      color: ACCENT
    });
    const lineWidth = Math.min(contentWidth, Math.max(144 * scale, sectionFont.widthOfTextAtSize(label.toUpperCase(), 9.3 * scale) + 10 * scale));
    page.drawLine({
      start: { x: BODY_X, y: y - 3 * scale },
      end: { x: BODY_X + lineWidth, y: y - 3 * scale },
      thickness: 0.55,
      color: BORDER
    });
    y -= 18 * scale;
  };

  const drawCentered = (text, font, fontSize, color) => {
    const width = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: (PAGE_WIDTH - width) / 2,
      y,
      size: fontSize,
      font,
      color
    });
  };

  const drawParagraph = (text, { font, fontSize, lineHeight, color = TEXT, justify = true, marginAfter = 6 * scale }) => {
    const lines = wrapText(text, font, fontSize, contentWidth);
    lines.forEach((line, index) => {
      const isLastLine = index === lines.length - 1;
      if (justify && !isLastLine && line.includes(" ")) {
        drawJustifiedLine(page, line, BODY_X, y, contentWidth, font, fontSize, color);
      } else {
        page.drawText(line, {
          x: BODY_X,
          y,
          size: fontSize,
          font,
          color
        });
      }
      y -= lineHeight;
    });
    y -= marginAfter;
  };

  const drawList = (items = [], marginAfter = 10 * scale) => {
    const valueColumnWidth = 170 * scale;
    const labelColumnWidth = contentWidth - valueColumnWidth - 22 * scale;

    items.forEach(({ label, value }) => {
      const labelLines = wrapText(String(label || ""), bodyBold, 10.35 * scale, labelColumnWidth);
      const valueLines = wrapText(String(value || ""), bodyFont, 10.1 * scale, valueColumnWidth);
      const rowLines = Math.max(labelLines.length, valueLines.length);

      page.drawText("•", {
        x: BODY_X,
        y,
        size: 11.1 * scale,
        font: bodyBold,
        color: ACCENT
      });

      labelLines.forEach((line, index) => {
        page.drawText(line, {
          x: BODY_X + 12 * scale,
          y: y - index * 11.7 * scale,
          size: 10.4 * scale,
          font: bodyBold,
          color: ACCENT
        });
      });

      valueLines.forEach((line, index) => {
        const lineWidth = bodyFont.widthOfTextAtSize(line, 10.1 * scale);
        page.drawText(line, {
          x: PAGE_WIDTH - BODY_X - lineWidth,
          y: y - index * 11.7 * scale,
          size: 10.1 * scale,
          font: bodyFont,
          color: TEXT
        });
      });

      y -= rowLines * 11.7 * scale + 2.5 * scale;
    });

    y -= marginAfter;
  };

  page.drawImage(logoImage, {
    x: (PAGE_WIDTH - logoDims.width) / 2,
    y: y - logoDims.height,
    width: logoDims.width,
    height: logoDims.height
  });
  y -= logoDims.height + 20 * scale;

  drawCentered("CERTIFICACIÓN DE INGRESOS", titleFont, 20.7 * scale, ACCENT);
  y -= 20 * scale;
  drawCentered(`${profile.city}, ${formatLongDate(new Date())}`, bodyFont, 10 * scale, TEXT_SOFT);
  y -= 18 * scale;

  page.drawLine({
    start: { x: BODY_X, y },
    end: { x: PAGE_WIDTH - BODY_X, y },
    thickness: 0.65,
    color: BORDER
  });
  y -= 20 * scale;

  certificationContent.blocks.forEach((block) => {
    if (block.type === "heading") {
      y -= 2 * scale;
      drawSectionHeading(block.text);
      return;
    }

    if (block.type === "list") {
      drawList(block.items, (block.marginAfter || 10) * scale);
      return;
    }

    const style = paragraphStyleFor(scale, block.emphasis, compactIncomeMode);
    drawParagraph(block.text, {
      font: style.font,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      color: TEXT,
      justify: block.justify !== false,
      marginAfter: style.marginAfter
    });
  });

  y = Math.max(y - 6 * scale, signatureBlockTopY + 8 * scale);
  const footerTopY = footerBottomY + estimateSignatureBlockHeight(scale) - 12 * scale;
  const footerGap = 28 * scale;
  const leftColumnWidth = (contentWidth - footerGap) * 0.56;
  const rightColumnWidth = contentWidth - footerGap - leftColumnWidth;
  const leftColumnX = BODY_X;
  const rightColumnX = leftColumnX + leftColumnWidth + footerGap;
  const leftCenterX = leftColumnX + leftColumnWidth / 2;
  const rightCenterX = rightColumnX + rightColumnWidth / 2;

  const drawCenteredColumnText = (text, centerX, yPos, size, font, color) => {
    const width = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: centerX - width / 2,
      y: yPos,
      size,
      font,
      color
    });
  };

  const leftSignatureY = footerTopY - signatureDims.height - 4 * scale;
  page.drawImage(signatureImage, {
    x: leftCenterX - signatureDims.width / 2,
    y: leftSignatureY,
    width: signatureDims.width,
    height: signatureDims.height
  });

  const signatureLineY = leftSignatureY - 15 * scale;
  const signatureLineWidth = Math.min(leftColumnWidth * 0.8, 236 * scale);
  page.drawLine({
    start: { x: leftCenterX - signatureLineWidth / 2, y: signatureLineY },
    end: { x: leftCenterX + signatureLineWidth / 2, y: signatureLineY },
    thickness: 0.7,
    color: BORDER
  });

  const accountantInfoStartY = signatureLineY - 18 * scale;
  const accountantInfoStep = 14.5 * scale;
  drawCenteredColumnText(
    profile.accountantName,
    leftCenterX,
    accountantInfoStartY,
    (compactIncomeMode ? 10.9 : 10.7) * scale,
    bodyBold,
    ACCENT
  );
  drawCenteredColumnText(
    profile.title,
    leftCenterX,
    accountantInfoStartY - accountantInfoStep,
    (compactIncomeMode ? 9.9 : 9.7) * scale,
    bodyFont,
    TEXT
  );
  drawCenteredColumnText(
    `C.C. No. ${certificationContent.formattedAccountantDocument}`,
    leftCenterX,
    accountantInfoStartY - accountantInfoStep * 2,
    (compactIncomeMode ? 9.7 : 9.5) * scale,
    bodyFont,
    TEXT
  );
  drawCenteredColumnText(
    `Tarjeta Profesional No. ${certificationContent.formattedProfessionalCard}`,
    leftCenterX,
    accountantInfoStartY - accountantInfoStep * 3,
    (compactIncomeMode ? 9.7 : 9.5) * scale,
    bodyFont,
    TEXT
  );

  const qrX = rightCenterX - qrDims.width / 2;
  const qrY = footerTopY - qrDims.height - 2 * scale;
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrDims.width,
    height: qrDims.height
  });

  const verificationLines = [
    { text: "VALIDAR VALIDEZ", font: sectionFont, size: 7.4 * scale, color: ACCENT },
    { text: "Escanee el código QR", font: bodyFont, size: 6.85 * scale, color: TEXT_SOFT },
    { text: `o ingrese a ${verificationDisplayUrl}`, font: bodyFont, size: 6.85 * scale, color: TEXT_SOFT },
    { text: `Código: ${verificationCode}`, font: bodyBold, size: 6.95 * scale, color: TEXT },
    { text: `Consecutivo: ${verificationConsecutive}`, font: bodyBold, size: 6.95 * scale, color: TEXT },
    { text: "Toda alteración o modificación posterior", font: bodyFont, size: 6.65 * scale, color: TEXT_SOFT },
    { text: "invalida este certificado.", font: bodyFont, size: 6.65 * scale, color: TEXT_SOFT }
  ];

  let verificationCursorY = qrY - 14 * scale;
  verificationLines.forEach(({ text, font, size, color }) => {
    drawCenteredColumnText(text, rightCenterX, verificationCursorY, size, font, color);
    verificationCursorY -= 8.9 * scale;
  });

  const pdfBytes = await pdf.save();

  return {
    bytes: pdfBytes,
    fileName: `certificacion-${record.consecutive || record.reference || "contarae"}.pdf`,
    contentType: "application/pdf"
  };
}
