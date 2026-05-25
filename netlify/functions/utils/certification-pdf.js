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

function normalizeRichSegments(segments = []) {
  const normalized = [];
  const queue = Array.isArray(segments) ? segments : [segments];

  queue.flat(Infinity).forEach((segment) => {
    if (segment == null) return;
    const payload =
      typeof segment === "string"
        ? { text: segment, bold: false }
        : {
            text: String(segment.text || ""),
            bold: Boolean(segment.bold)
          };

    if (!payload.text) return;

    const previous = normalized[normalized.length - 1];
    if (previous && previous.bold === payload.bold) {
      previous.text += payload.text;
      return;
    }

    normalized.push(payload);
  });

  return normalized;
}

function tokenizeRichSegments(segments = []) {
  const tokens = [];

  normalizeRichSegments(segments).forEach((segment) => {
    const parts = String(segment.text || "").match(/\S+|\s+/g) || [];
    parts.forEach((part) => {
      const isSpace = /\s+/.test(part);
      if (isSpace) {
        if (!tokens.length || tokens[tokens.length - 1].isSpace) return;
        tokens.push({ text: " ", bold: segment.bold, isSpace: true });
        return;
      }

      tokens.push({ text: part, bold: segment.bold, isSpace: false });
    });
  });

  while (tokens[0]?.isSpace) tokens.shift();
  while (tokens[tokens.length - 1]?.isSpace) tokens.pop();

  return tokens;
}

function wrapRichTextSegments(segments, regularFont, boldFont, fontSize, maxWidth) {
  const tokens = tokenizeRichSegments(segments);
  if (!tokens.length) return [[{ text: "", bold: false, isSpace: false, width: 0, font: regularFont }]];

  const lines = [];
  let currentLine = [];
  let currentWidth = 0;

  const pushCurrentLine = () => {
    while (currentLine[currentLine.length - 1]?.isSpace) {
      currentWidth -= currentLine[currentLine.length - 1].width;
      currentLine.pop();
    }
    if (currentLine.length) {
      lines.push(currentLine);
    }
    currentLine = [];
    currentWidth = 0;
  };

  tokens.forEach((token) => {
    const font = token.bold ? boldFont : regularFont;
    const width = font.widthOfTextAtSize(token.text, fontSize);
    const enrichedToken = { ...token, width, font };

    if (token.isSpace) {
      if (!currentLine.length || currentLine[currentLine.length - 1]?.isSpace) return;
      currentLine.push(enrichedToken);
      currentWidth += width;
      return;
    }

    if (currentLine.length && currentWidth + width > maxWidth) {
      pushCurrentLine();
    }

    currentLine.push(enrichedToken);
    currentWidth += width;
  });

  pushCurrentLine();

  return lines.length ? lines : [[{ text: "", bold: false, isSpace: false, width: 0, font: regularFont }]];
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
  16: "DIECISÉIS",
  17: "DIECISIETE",
  18: "DIECIOCHO",
  19: "DIECINUEVE",
  20: "VEINTE",
  21: "VEINTIUNO",
  22: "VEINTIDÓS",
  23: "VEINTITRÉS",
  24: "VEINTICUATRO",
  25: "VEINTICINCO",
  26: "VEINTISÉIS",
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
    .replace(/VEINTIUNO$/g, "VEINTIÚN")
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

  if (number < 1000000) {
    const thousands = Math.floor(number / 1000);
    const remainder = number % 1000;
    const parts = [];

    if (thousands === 1) {
      parts.push("MIL");
    } else {
      parts.push(`${apocopateSpanishNumber(convertTripletToWords(thousands))} MIL`);
    }

    if (remainder > 0) {
      parts.push(convertTripletToWords(remainder));
    }

    return parts.join(" ");
  }

  const millions = Math.floor(number / 1000000);
  const remainder = number % 1000000;
  const parts = [];

  if (millions > 0) {
    if (millions === 1) {
      parts.push("UN MILLÓN");
    } else {
      parts.push(`${apocopateSpanishNumber(numberToSpanishWords(millions))} MILLONES`);
    }
  }

  if (remainder > 0) {
    parts.push(numberToSpanishWords(remainder));
  }

  return parts.join(" ");
}

function needsDeBeforePesos(amountWords = "") {
  const normalized = removeAccents(amountWords)
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();

  return /\bMILLON(?:ES)?$/.test(normalized);
}

function buildPesosLabel(amountWords = "") {
  return needsDeBeforePesos(amountWords) ? "DE PESOS M/CTE" : "PESOS M/CTE";
}

function buildAmountInLetters(value) {
  const amount = parseCurrency(value);
  const integerAmount = Math.max(0, Math.floor(amount));
  const amountWords = apocopateSpanishNumber(numberToSpanishWords(integerAmount));
  const formattedAmount = new Intl.NumberFormat("es-CO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(integerAmount);

  return `${amountWords} ${buildPesosLabel(amountWords)} ($${formattedAmount})`;
}

function buildAmountWordsOnly(value) {
  const amount = parseCurrency(value);
  const integerAmount = Math.max(0, Math.floor(amount));
  const amountWords = apocopateSpanishNumber(numberToSpanishWords(integerAmount));
  return `${amountWords} ${buildPesosLabel(amountWords)}`;
}

function buildAmountDisplay(value) {
  return `${formatCurrencyCOP(value)} (${buildAmountWordsOnly(value)})`;
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

function isIndependentConcept(value = "") {
  const normalized = removeAccents(value).toLowerCase();
  return /\bindependient/.test(normalized) || /\bfreelance\b/.test(normalized);
}

function buildIndependentSourceText(value = "") {
  const normalized = removeAccents(value).toLowerCase();
  if (normalized.includes("trabajadora independiente")) return "su actividad como trabajadora independiente";
  if (normalized.includes("trabajador independiente")) return "su actividad como trabajador independiente";
  if (normalized.includes("persona independiente")) return "su actividad como persona independiente";
  return "su actividad independiente";
}

function resolveIncomeSource(label, otherIncomeDetail = "") {
  const detail = String(otherIncomeDetail || "").replace(/\s+/g, " ").trim();

  if (label === "Ingresos por actividad independiente") {
    return {
      sourceType: "independent",
      displayLabel: buildIndependentSourceText(),
      listLabel: "Actividad independiente"
    };
  }

  if (label === "Otros ingresos mensuales recurrentes" && detail) {
    if (isIndependentConcept(detail)) {
      return {
        sourceType: "independent",
        displayLabel: buildIndependentSourceText(detail),
        listLabel: "Actividad independiente"
      };
    }

    return {
      sourceType: "other",
      displayLabel: detail,
      listLabel: `Otros ingresos (${detail})`
    };
  }

  return {
    sourceType: "standard",
    displayLabel: label.toLowerCase(),
    listLabel: label
  };
}

function buildSingleIncomePhrase(row = {}) {
  if (row.sourceType === "independent") {
    return `derivados de ${row.displayLabel}`;
  }
  return `por concepto de ${row.displayLabel}`;
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
  const monthWords = months === 1 ? "un" : numberToSpanishWords(months).toLowerCase();
  return `${monthWords} (${months}) ${months === 1 ? "mes" : "meses"}`;
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
    ["Ingresos por actividad independiente", formData.ingresos_independiente],
    ["Otros ingresos mensuales recurrentes", formData.otros_ingresos]
  ]
    .filter(([, value]) => hasMeaningfulCurrencyValue(value))
    .map(([label, value]) => ({
      ...resolveIncomeSource(label, otherIncomeDetail),
      label,
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
  const entity = String(formData.entidad || "").trim();
  if (entity) return entity;
  return String(formData.destino || "").trim();
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
  const certifiedMonths = resolveCertifiedPeriodMonths(formData);
  const totalMonthlyRecurring =
    parseCurrency(formData.total_ingresos) ||
    recurringRows.reduce((sum, row) => sum + row.numericValue, 0);
  const totalRecurringPeriod =
    parseCurrency(formData.total_ingresos_periodo) ||
    totalMonthlyRecurring * certifiedMonths;
  const totalEventualPeriod =
    parseCurrency(formData.total_ingresos_eventuales) ||
    eventualRows.reduce((sum, row) => sum + row.numericValue, 0);
  const totalGlobalPeriod =
    parseCurrency(formData.total_ingresos_global_periodo) ||
    totalRecurringPeriod + totalEventualPeriod;
  const periodInMonths = buildCertifiedPeriodInMonths(formData);
  const isSingleMonthPeriod = certifiedMonths === 1;
  const formattedCustomerDocument = buildCustomerIdentificationLabel(formData);
  const formattedAccountantDocument = formatDocumentNumber(profile.accountantDocumentNumber) || "POR CONFIGURAR";
  const formattedProfessionalCard = formatProfessionalCardNumber(profile.professionalCardNumber) || "POR CONFIGURAR";
  const customerReference = String(formData.nombre || "").trim() || "la parte interesada";
  const clarificationNote = String(formData.nota_aclaratoria_certificacion || "")
    .replace(/\s+/g, " ")
    .trim();
  const highlightedAmount = (value) => ({ text: buildAmountDisplay(value), bold: true });
  const paragraph = (segments, extra = {}) => ({
    type: "paragraph",
    emphasis: "normal",
    segments: normalizeRichSegments(segments),
    ...extra
  });
  const buildInlineEventualSummarySegments = (rows = []) => {
    const normalizedRows = Array.isArray(rows) ? rows : [];
    const segments = [];

    normalizedRows.forEach((row, index) => {
      if (index === 0) {
        segments.push(
          `De manera adicional, durante el período objeto de certificación se identificaron ingresos eventuales correspondientes a ${row.concept} por valor de `,
          highlightedAmount(row.numericValue)
        );
        return;
      }

      if (index === normalizedRows.length - 1) {
        segments.push(
          normalizedRows.length === 2 ? " y a " : ", y a ",
          row.concept,
          " por valor de ",
          highlightedAmount(row.numericValue)
        );
        return;
      }

      segments.push(", a ", row.concept, " por valor de ", highlightedAmount(row.numericValue));
    });

    return segments;
  };
  const blocks = [
    paragraph(
      `Yo, ${profile.accountantName}, ${profile.title}, identificado con la cédula de ciudadanía No. ${formattedAccountantDocument} y titular de la Tarjeta Profesional No. ${formattedProfessionalCard}, certifico que, con fundamento en la información suministrada y en los documentos soporte puestos a mi disposición por ${customerReference}, quien se identifica con ${formattedCustomerDocument}, se realizó la validación documental de los ingresos reportados para el período correspondiente a ${periodInMonths}.`
    )
  ];

  if (recurringRows.length === 1) {
    blocks.push(
      paragraph(
        isSingleMonthPeriod
          ? [
              `Como resultado de dicha validación, se estableció que ${customerReference} percibe ingresos mensuales ${buildSingleIncomePhrase(recurringRows[0])}, por valor de `,
              highlightedAmount(recurringRows[0].numericValue),
              "."
            ]
          : [
              `Como resultado de dicha validación, se estableció que ${customerReference} percibe ingresos mensuales ${buildSingleIncomePhrase(recurringRows[0])}, por valor de `,
              highlightedAmount(recurringRows[0].numericValue),
              `; en consecuencia, para el período certificado de ${periodInMonths}, el total correspondiente a dicho lapso asciende a `,
              highlightedAmount(totalRecurringPeriod),
              "."
            ]
      )
    );
  } else if (recurringRows.length === 2) {
    blocks.push(
      paragraph([
        `Como resultado de dicha validación, se estableció que ${customerReference} percibe ingresos mensuales provenientes de ${recurringRows[0].displayLabel} por valor de `,
        highlightedAmount(recurringRows[0].numericValue),
        " y de ",
        recurringRows[1].displayLabel,
        " por valor de ",
        highlightedAmount(recurringRows[1].numericValue),
        "; en conjunto, dichos ingresos representan un total mensual de ",
        highlightedAmount(totalMonthlyRecurring),
        ...(isSingleMonthPeriod
          ? ["."]
          : [
              ` y, para el período certificado de ${periodInMonths}, un total de `,
              highlightedAmount(totalRecurringPeriod),
              "."
            ])
      ])
    );
  } else if (recurringRows.length > 2) {
    blocks.push(
      paragraph(
        `Como resultado de dicha validación, se estableció que ${customerReference} percibe ingresos mensuales derivados de los siguientes conceptos:`
      )
    );
    blocks.push({
      type: "list",
      variant: "recurring",
      marginAfter: 12,
      items: recurringRows.map((row) => ({
        label: capitalizeText(row.listLabel),
        value: formatCurrencyCOP(row.numericValue)
      }))
    });
    blocks.push(
      paragraph([
        "En conjunto, los ingresos mensuales antes relacionados representan un total mensual de ",
        highlightedAmount(totalMonthlyRecurring),
        ...(isSingleMonthPeriod
          ? ["."]
          : [
              ` y, para el período certificado de ${periodInMonths}, un total de `,
              highlightedAmount(totalRecurringPeriod),
              "."
            ])
      ])
    );
  } else {
    blocks.push(
      paragraph(
        isSingleMonthPeriod
          ? `Como resultado de dicha validación, no se identificaron ingresos mensuales para ${customerReference} durante el período certificado.`
          : [
              `Como resultado de dicha validación, no se identificaron ingresos mensuales para ${customerReference}; en consecuencia, el total correspondiente al período certificado asciende a `,
              highlightedAmount(totalRecurringPeriod),
              "."
            ]
      )
    );
  }

  if (eventualRows.length) {
    if (eventualRows.length === 1) {
      blocks.push(
        paragraph([
          `De manera adicional, durante el período objeto de certificación se identificó un ingreso eventual por concepto de ${eventualRows[0].concept}, por valor de `,
          highlightedAmount(eventualRows[0].numericValue),
          ". Dicho ingreso corresponde a un hecho económico de carácter no ordinario, no fijo y no periódico; en consecuencia, no integra el ingreso mensual descrito, aunque sí se considera dentro del análisis del período por encontrarse soportado documentalmente."
        ])
      );
    } else if (eventualRows.length === 2) {
      blocks.push(
        paragraph([
          ...buildInlineEventualSummarySegments(eventualRows),
          ". En conjunto, la sumatoria de dichos ingresos asciende a ",
          highlightedAmount(totalEventualPeriod),
          ". Tales ingresos corresponden a hechos económicos de carácter no ordinario, no fijo y no periódico; en consecuencia, no integran el ingreso mensual descrito, aunque sí se consideran dentro del análisis del período por encontrarse soportados documentalmente."
        ])
      );
    } else {
      blocks.push(
        paragraph("De manera adicional, durante el período objeto de certificación se identificaron los siguientes ingresos eventuales:")
      );
      blocks.push({
        type: "list",
        variant: "eventual",
        marginAfter: 12,
        items: eventualRows.map((row) => ({
          label: capitalizeText(row.listLabel),
          value: formatCurrencyCOP(row.numericValue)
        }))
      });
      blocks.push(
        paragraph([
          "La sumatoria de los ingresos eventuales antes relacionados asciende a ",
          highlightedAmount(totalEventualPeriod),
          ". Tales ingresos corresponden a hechos económicos de carácter no ordinario, no fijo y no periódico; en consecuencia, no integran el ingreso mensual descrito, aunque sí se consideran dentro del análisis del período por encontrarse soportados documentalmente."
        ])
      );
    }

    blocks.push(
      paragraph([
        isSingleMonthPeriod
          ? "En consecuencia, una vez incorporado al análisis el ingreso mensual certificado, por valor de "
          : "En consecuencia, una vez incorporado al análisis el total de ingresos mensuales certificado para el período, por valor de ",
        highlightedAmount(totalRecurringPeriod),
        ", junto con ",
        eventualRows.length === 1 ? "el ingreso eventual identificado durante dicho lapso" : "los ingresos eventuales identificados durante dicho lapso",
        eventualRows.length === 1 ? ", por valor de " : ", cuya sumatoria asciende a ",
        highlightedAmount(totalEventualPeriod),
        ", el total global de ingresos observado para el período objeto de certificación asciende a ",
        highlightedAmount(totalGlobalPeriod),
        "."
      ])
    );
  }

  if (clarificationNote) {
    blocks.push(paragraph(clarificationNote));
  }

  blocks.push(
    paragraph(
      destination
        ? `La presente certificación se expide a solicitud de la parte interesada para ser presentada ante ${destination}, con base exclusiva en los documentos y soportes suministrados para su análisis. En tal sentido, no constituye auditoría integral, aseguramiento, revisoría fiscal ni dictamen sobre estados financieros, sino una certificación profesional emitida dentro del alcance documental de la validación efectuada.`
        : "La presente certificación se expide a solicitud de la parte interesada, con base exclusiva en los documentos y soportes suministrados para su análisis. En tal sentido, no constituye auditoría integral, aseguramiento, revisoría fiscal ni dictamen sobre estados financieros, sino una certificación profesional emitida dentro del alcance documental de la validación efectuada."
    )
  );
  blocks.push(
    paragraph(
      "Esta certificación se emite en ejercicio de las facultades que la Ley 43 de 1990 reconoce al Contador Público para dar fe pública en los actos propios de su profesión, con observancia de los principios de veracidad, claridad, precisión y buena fe que rigen la expedición de certificaciones profesionales."
    )
  );
  blocks.push(
    paragraph(`Se expide en ${profile.city}, el ${formatLongDate(new Date())}.`, {
      marginAfter: 8
    })
  );

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
  const verificationCode = record.certificateVerificationCode || buildCertificateVerificationCode(record);
  const verificationUrl = record.certificateVerificationUrl || buildCertificateVerificationUrl(record);
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
  const desiredFooterGap = (currentScale) => 30 * currentScale;
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
      const labelLines = wrapText(String(label || ""), bodyFont, 10.25 * currentScale, labelColumnWidth);
      const valueLines = wrapText(String(value || ""), bodyBold, 10.15 * currentScale, valueColumnWidth);
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
      const lines = wrapRichTextSegments(
        block.segments || block.text || "",
        style.font,
        bodyBold,
        style.fontSize,
        blockWidth
      );
      height += lines.length * style.lineHeight + ((block.marginAfter ?? style.marginAfter));
    });

    return height;
  };

  while (
    estimateBodyHeight(scale) + estimateSignatureBlockHeight(scale) + desiredFooterGap(scale) + fitSafetyPadding > availableHeight &&
    scale > 0.42
  ) {
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
  const minimumFooterTopY = footerBottomY + estimateSignatureBlockHeight(scale) - 12 * scale;
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

  const drawRichLine = (tokens, x, yPos, fontSize, color) => {
    let cursor = x;
    tokens.forEach((token) => {
      if (token.isSpace) {
        cursor += token.width;
        return;
      }

      page.drawText(token.text, {
        x: cursor,
        y: yPos,
        size: fontSize,
        font: token.font,
        color
      });
      cursor += token.width;
    });
  };

  const drawJustifiedRichLine = (tokens, x, yPos, width, fontSize, color) => {
    const wordsWidth = tokens.reduce((sum, token) => sum + (token.isSpace ? 0 : token.width), 0);
    const gapCount = tokens.filter((token) => token.isSpace).length;

    if (!gapCount) {
      drawRichLine(tokens, x, yPos, fontSize, color);
      return;
    }

    const distributedSpace = (width - wordsWidth) / gapCount;
    let cursor = x;

    tokens.forEach((token) => {
      if (token.isSpace) {
        cursor += distributedSpace;
        return;
      }

      page.drawText(token.text, {
        x: cursor,
        y: yPos,
        size: fontSize,
        font: token.font,
        color
      });
      cursor += token.width;
    });
  };

  const drawParagraph = (segments, { font, fontSize, lineHeight, color = TEXT, justify = true, marginAfter = 6 * scale }) => {
    const lines = wrapRichTextSegments(segments, font, bodyBold, fontSize, contentWidth);
    lines.forEach((lineTokens, index) => {
      const isLastLine = index === lines.length - 1;
      if (justify && !isLastLine && lineTokens.some((token) => token.isSpace)) {
        drawJustifiedRichLine(lineTokens, BODY_X, y, contentWidth, fontSize, color);
      } else {
        drawRichLine(lineTokens, BODY_X, y, fontSize, color);
      }
      y -= lineHeight;
    });
    y -= marginAfter;
  };

  const drawList = (items = [], marginAfter = 10 * scale) => {
    const valueColumnWidth = 170 * scale;
    const labelColumnWidth = contentWidth - valueColumnWidth - 22 * scale;

    items.forEach(({ label, value }) => {
      const labelLines = wrapText(String(label || ""), bodyFont, 10.25 * scale, labelColumnWidth);
      const valueLines = wrapText(String(value || ""), bodyBold, 10.15 * scale, valueColumnWidth);
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
          size: 10.25 * scale,
          font: bodyFont,
          color: TEXT
        });
      });

      valueLines.forEach((line, index) => {
        const lineWidth = bodyBold.widthOfTextAtSize(line, 10.15 * scale);
        page.drawText(line, {
          x: PAGE_WIDTH - BODY_X - lineWidth,
          y: y - index * 11.7 * scale,
          size: 10.15 * scale,
          font: bodyBold,
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
    drawParagraph(block.segments || block.text || "", {
      font: style.font,
      fontSize: style.fontSize,
      lineHeight: style.lineHeight,
      color: TEXT,
      justify: block.justify !== false,
      marginAfter: block.marginAfter ?? style.marginAfter
    });
  });

  const footerTopY = Math.max(minimumFooterTopY, y - 8 * scale);
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
