import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getProfessionalProfile } from "./professional-documents.js";
import { buildCertificateData } from "./certification-admin.js";

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

function buildIncomeConceptSentence(row, otherIncomeDetail) {
  if (!row) return "";
  const amountText = formatCurrencyCOP(row.numericValue);
  if (row.label === "Otros ingresos" && otherIncomeDetail?.value) {
    return `${amountText} por concepto de otros ingresos correspondientes a ${otherIncomeDetail.value}`;
  }
  return `${amountText} por concepto de ${row.label.toLowerCase()}`;
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

function buildCertifiedPeriodInMonths(rawPeriod) {
  const normalized = removeAccents(rawPeriod).toLowerCase();
  if (!normalized) return "el período certificado indicado por el solicitante";

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

  if (!months) {
    return String(rawPeriod || "").trim() || "el período certificado indicado por el solicitante";
  }

  return `${numberToSpanishWords(months).toLowerCase()} (${months}) ${months === 1 ? "mes" : "meses"}`;
}

function buildIncomeRows(formData = {}) {
  const rows = [
    ["Ingresos laborales", formData.ingresos_laborales],
    ["Pensiones", formData.pensiones],
    ["Dividendos", formData.dividendos],
    ["Inversiones", formData.inversiones],
    ["Arriendos", formData.arriendos],
    ["Remesas", formData.remesas],
    ["Otros ingresos", formData.otros_ingresos]
  ]
    .filter(([, value]) => hasMeaningfulCurrencyValue(value))
    .map(([label, value]) => ({
      label,
      value: String(value || "").trim(),
      numericValue: parseCurrency(value),
      kind: "amount"
    }));

  if (hasMeaningfulCurrencyValue(formData.otros_ingresos) && String(formData.otros_descripcion || "").trim()) {
    rows.push({
      label: "Detalle otros ingresos",
      value: String(formData.otros_descripcion || "").trim(),
      numericValue: 0,
      kind: "detail"
    });
  }

  return rows;
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
  const incomeRows = buildIncomeRows(formData);
  const amountRows = incomeRows.filter((row) => row.kind === "amount");
  const otherIncomeDetail = incomeRows.find((row) => row.kind === "detail");
  const singleIncomeRow = amountRows.length === 1 ? amountRows[0] : null;
  const dualIncomeRows = amountRows.length === 2 ? amountRows : [];
  const totalNumeric = parseCurrency(formData.total_ingresos) || amountRows.reduce((sum, row) => sum + row.numericValue, 0);
  const totalInLetters = buildAmountInLetters(totalNumeric);
  const periodInMonths = buildCertifiedPeriodInMonths(formData.periodo);
  const formattedCustomerDocument = buildDocumentLabel(formData.tipo_documento, formData.numero_documento) || "documento no informado";
  const formattedAccountantDocument = formatDocumentNumber(profile.accountantDocumentNumber) || "POR CONFIGURAR";
  const formattedProfessionalCard = formatProfessionalCardNumber(profile.professionalCardNumber) || "POR CONFIGURAR";

  return {
    amountRows,
    detailedRows: incomeRows,
    showIncomeList: amountRows.length > 1,
    formattedAccountantDocument,
    formattedCustomerDocument,
    formattedProfessionalCard,
    paragraphs: [
      `Yo, ${profile.accountantName}, ${profile.title}, identificado con la cédula de ciudadanía No. ${formattedAccountantDocument}, titular de la Tarjeta Profesional No. ${formattedProfessionalCard}, certifico que revisé la información suministrada y los documentos soporte aportados por ${formData.nombre || "el solicitante"}, identificado(a) con ${formattedCustomerDocument}, con el fin de verificar la razonabilidad de los ingresos reportados durante el período certificado de ${periodInMonths}.`,
      singleIncomeRow
        ? `Con fundamento en la documentación examinada, se verifica que el(la) solicitante percibe ingresos mensuales por valor de ${buildIncomeConceptSentence(singleIncomeRow, otherIncomeDetail)}.`
        : dualIncomeRows.length === 2
          ? `Con fundamento en la documentación examinada, se verifica que el(la) solicitante percibe ingresos mensuales por valor de ${buildIncomeConceptSentence(dualIncomeRows[0], otherIncomeDetail)} y ${buildIncomeConceptSentence(dualIncomeRows[1], otherIncomeDetail)}.`
        : amountRows.length > 1
          ? "Con fundamento en la documentación examinada, se verifica que el(la) solicitante percibe ingresos provenientes de los conceptos que se relacionan a continuación, de acuerdo con la información económica acreditada y verificada en los soportes aportados."
          : "Con fundamento en la documentación examinada, se verificó la información económica acreditada por el(la) solicitante para el período certificado.",
      `En consecuencia, certifico que el total de ingresos mensuales asciende a ${totalInLetters}.`,
      destination
        ? `La presente certificación se expide a solicitud del interesado para ser presentada ante ${destination}, y se emite exclusivamente con base en los documentos y soportes puestos a disposición para su análisis. En consecuencia, este documento no constituye auditoría integral, revisoría fiscal ni dictamen sobre estados financieros, sino una constancia profesional emitida dentro del alcance propio de la revisión efectuada.`
        : "La presente certificación se expide a solicitud del interesado y se emite exclusivamente con base en los documentos y soportes puestos a disposición para su análisis. En consecuencia, este documento no constituye auditoría integral, revisoría fiscal ni dictamen sobre estados financieros, sino una constancia profesional emitida dentro del alcance propio de la revisión efectuada.",
      `Se expide en ${profile.city}, el ${formatLongDate(new Date())}, dejando constancia de que cualquier modificación posterior en la situación económica del solicitante requerirá nueva validación documental para efectos de emitir una certificación actualizada.`
    ],
    totalInLetters,
    totalNumeric
  };
}

export async function generateCertificationPdf(record = {}) {
  const formData = buildCertificateData(record);
  const profile = getProfessionalProfile();
  const certificationContent = buildCertificationNarrative(record);
  const incomes = certificationContent.detailedRows || [];
  const pdf = await PDFDocument.create();
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sectionFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const bodyBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await pdf.embedPng(await readAssetBytes("contarae-logo-completo.png"));
  const signatureImage = await pdf.embedPng(await readAssetBytes("contarae-firma.png"));
  const baseLogoDims = logoImage.scale(Math.min(0.42, 164 / logoImage.width));
  const baseSignatureDims = signatureImage.scale(Math.min(0.28, 156 / signatureImage.width));
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
  let scale = 1;
  const fitSafetyPadding = 22;

  const estimateBodyHeight = (currentScale) => {
    const contentWidth = PAGE_WIDTH - BODY_X * 2;
    let height = 0;

    height += baseLogoDims.height * currentScale + 18 * currentScale;
    height += 22 * currentScale + 18 * currentScale;
    height += 10.5 * currentScale + 16 * currentScale + 16 * currentScale;
    height += 12 * currentScale;
    certificationContent.paragraphs.forEach((paragraph, index) => {
      const isTotalParagraph = index === 2;
      const lines = wrapText(paragraph, isTotalParagraph ? bodyBold : bodyFont, isTotalParagraph ? 10.8 * currentScale : 10.7 * currentScale, contentWidth);
      height += lines.length * (isTotalParagraph ? 14.8 : 14.4) * currentScale + (isTotalParagraph ? 10 : 7) * currentScale;
    });

    if (certificationContent.showIncomeList && incomes.length) {
      height += 16 * currentScale;
      incomes.forEach(({ label, value }) => {
        const valueLines = wrapText(String(value || ""), bodyFont, 10.2 * currentScale, 162 * currentScale);
        const labelLines = wrapText(label, bodyBold, 10.4 * currentScale, 232 * currentScale);
        height += Math.max(valueLines.length, labelLines.length) * 11.8 * currentScale + 2;
      });
    }

    return height;
  };

  const estimateSignatureBlockHeight = (currentScale) => {
    return baseSignatureDims.height * currentScale + 108 * currentScale;
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
  const signatureBlockTopY = BOTTOM_MARGIN + estimateSignatureBlockHeight(scale);
  const compactIncomeMode = !certificationContent.showIncomeList && certificationContent.amountRows.length <= 2;

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
      size: 10.4 * scale,
      font: sectionFont,
      color: ACCENT
    });
    const lineWidth = Math.min(contentWidth, Math.max(180 * scale, sectionFont.widthOfTextAtSize(label.toUpperCase(), 10.4 * scale) + 12 * scale));
    page.drawLine({
      start: { x: BODY_X, y: y - 3 * scale },
      end: { x: BODY_X + lineWidth, y: y - 3 * scale },
      thickness: 0.65,
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

  page.drawImage(logoImage, {
    x: (PAGE_WIDTH - logoDims.width) / 2,
    y: y - logoDims.height,
    width: logoDims.width,
    height: logoDims.height
  });
  y -= logoDims.height + 14 * scale;

  drawCentered("CERTIFICACIÓN DE INGRESOS", titleFont, 21.5 * scale, ACCENT);
  y -= 16 * scale;
  drawCentered(`${profile.city}, ${formatLongDate(new Date())}`, bodyFont, 10 * scale, TEXT_SOFT);
  y -= 14 * scale;

  page.drawLine({
    start: { x: BODY_X, y },
    end: { x: PAGE_WIDTH - BODY_X, y },
    thickness: 0.65,
    color: BORDER
  });
  y -= 16 * scale;
  certificationContent.paragraphs.slice(0, 2).forEach((paragraph) => {
    drawParagraph(paragraph, {
      font: bodyFont,
      fontSize: (compactIncomeMode ? 11 : 10.7) * scale,
      lineHeight: (compactIncomeMode ? 15 : 14.2) * scale,
      color: TEXT,
      justify: true,
      marginAfter: (compactIncomeMode ? 9 : 6) * scale
    });
  });

  if (certificationContent.showIncomeList && incomes.length) {
    drawSectionHeading("Conceptos de ingresos certificados");
    incomes.forEach(({ label, value }) => {
      const valueColumnWidth = 170 * scale;
      const labelColumnWidth = contentWidth - valueColumnWidth - 22 * scale;
      const labelLines = wrapText(label, bodyBold, 10.4 * scale, labelColumnWidth);
      const valueLines = wrapText(String(value || ""), bodyFont, 10.2 * scale, valueColumnWidth);
      const rowLines = Math.max(labelLines.length, valueLines.length);
      const valueColumnRight = PAGE_WIDTH - MARGIN_X;

      page.drawText("•", {
        x: BODY_X,
        y,
        size: 11.2 * scale,
        font: bodyBold,
        color: ACCENT
      });

      labelLines.forEach((line, index) => {
        page.drawText(line, {
          x: BODY_X + 12 * scale,
          y: y - index * 11.8 * scale,
          size: 10.4 * scale,
          font: bodyBold,
          color: ACCENT
        });
      });

      valueLines.forEach((line, index) => {
        const lineWidth = bodyFont.widthOfTextAtSize(line, 10.2 * scale);
        page.drawText(line, {
          x: (PAGE_WIDTH - BODY_X) - lineWidth,
          y: y - index * 11.8 * scale,
          size: 10.2 * scale,
          font: bodyFont,
          color: TEXT
        });
      });

      y -= rowLines * 11.8 * scale + 2;
    });
    y -= 6 * scale;
  }

  certificationContent.paragraphs.slice(2).forEach((paragraph, index) => {
    if (index === 0) {
      drawParagraph(paragraph, {
        font: bodyBold,
        fontSize: (compactIncomeMode ? 11.1 : 10.8) * scale,
        lineHeight: (compactIncomeMode ? 15.2 : 14.8) * scale,
        color: TEXT,
        justify: false,
        marginAfter: (compactIncomeMode ? 11 : 8) * scale
      });
      return;
    }

    drawParagraph(paragraph, {
      font: bodyFont,
      fontSize: (compactIncomeMode ? 11 : 10.7) * scale,
      lineHeight: (compactIncomeMode ? 15 : 14.2) * scale,
      color: TEXT,
      justify: true,
      marginAfter: (compactIncomeMode ? 9 : 6) * scale
    });
  });

  y = Math.max(y - (compactIncomeMode ? 4 : 10) * scale, signatureBlockTopY + (compactIncomeMode ? 20 : 14) * scale);
  const signatureLineY = BOTTOM_MARGIN + (compactIncomeMode ? 76 : 68) * scale;

  page.drawImage(signatureImage, {
    x: MARGIN_X,
    y: signatureLineY + 12 * scale,
    width: signatureDims.width,
    height: signatureDims.height
  });

  page.drawLine({
    start: { x: MARGIN_X, y: signatureLineY },
    end: { x: MARGIN_X + (compactIncomeMode ? 264 : 248) * scale, y: signatureLineY },
    thickness: 0.7,
    color: BORDER
  });

  page.drawText(profile.accountantName, {
    x: MARGIN_X,
    y: signatureLineY - 22 * scale,
    size: (compactIncomeMode ? 11.2 : 11) * scale,
    font: bodyBold,
    color: ACCENT
  });
  page.drawText(profile.title, {
    x: MARGIN_X,
    y: signatureLineY - 38 * scale,
    size: (compactIncomeMode ? 10.2 : 10) * scale,
    font: bodyFont,
    color: TEXT
  });
  page.drawText(`C.C. No. ${certificationContent.formattedAccountantDocument}`, {
    x: MARGIN_X,
    y: signatureLineY - 54 * scale,
    size: (compactIncomeMode ? 10 : 9.8) * scale,
    font: bodyFont,
    color: TEXT
  });
  page.drawText(`Tarjeta Profesional No. ${certificationContent.formattedProfessionalCard}`, {
    x: MARGIN_X,
    y: signatureLineY - 70 * scale,
    size: (compactIncomeMode ? 10 : 9.8) * scale,
    font: bodyFont,
    color: TEXT
  });

  const pdfBytes = await pdf.save();

  return {
    bytes: pdfBytes,
    fileName: `certificacion-${record.consecutive || record.reference || "contarae"}.pdf`,
    contentType: "application/pdf"
  };
}
