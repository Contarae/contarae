import fs from "fs/promises";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getProfessionalProfile } from "./professional-documents.js";
import { buildCertificateData } from "./certification-admin.js";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 54;
const TOP_MARGIN = 58;
const BOTTOM_MARGIN = 58;
const ACCENT = rgb(0.12, 0.24, 0.45);
const ACCENT_SOFT = rgb(0.9, 0.95, 1);
const TEXT = rgb(0.16, 0.2, 0.28);
const TEXT_SOFT = rgb(0.38, 0.44, 0.54);
const BORDER = rgb(0.82, 0.88, 0.95);

function parseCurrency(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
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
  const totalNumeric = parseCurrency(formData.total_ingresos) || amountRows.reduce((sum, row) => sum + row.numericValue, 0);
  const totalInLetters = buildAmountInLetters(totalNumeric);
  const periodInMonths = buildCertifiedPeriodInMonths(formData.periodo);

  return {
    amountRows,
    detailedRows: incomeRows,
    showIncomeList: amountRows.length > 1,
    paragraphs: [
      `Yo, ${profile.accountantName}, ${profile.title}, identificado con la cédula de ciudadanía No. ${profile.accountantDocumentNumber || "POR CONFIGURAR"}, titular de la Tarjeta Profesional No. ${profile.professionalCardNumber || "POR CONFIGURAR"}, certifico que revisé la información suministrada y los documentos soporte aportados por ${formData.nombre || "el solicitante"}, identificado(a) con ${[formData.tipo_documento, formData.numero_documento].filter(Boolean).join(" ") || "documento no informado"}, con el fin de verificar la razonabilidad de los ingresos reportados durante el período certificado de ${periodInMonths}.`,
      singleIncomeRow
        ? `Con fundamento en la documentación examinada, se evidencia que el(la) solicitante percibe ingresos mensuales por concepto de ${singleIncomeRow.label.toLowerCase()}${singleIncomeRow.label === "Otros ingresos" && otherIncomeDetail ? `, correspondientes a ${otherIncomeDetail.value}` : ""}.`
        : amountRows.length > 1
          ? "Con fundamento en la documentación examinada, se evidencia que el(la) solicitante percibe ingresos provenientes de los conceptos que se relacionan a continuación, de acuerdo con la información económica acreditada y verificada en los soportes aportados."
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
  const baseLogoDims = logoImage.scale(Math.min(0.46, 178 / logoImage.width));
  const baseSignatureDims = signatureImage.scale(Math.min(0.22, 114 / signatureImage.width));
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN;
  let scale = 1;
  const fitSafetyPadding = 22;

  const estimateBodyHeight = (currentScale) => {
    const contentWidth = PAGE_WIDTH - MARGIN_X * 2;
    const labelWidth = 126 * currentScale;
    const gap = 12;
    const valueWidth = contentWidth - labelWidth - gap;
    let height = 0;

    height += baseLogoDims.height * currentScale + 18 * currentScale;
    height += 22 * currentScale + 18 * currentScale;
    height += 10.5 * currentScale + 16 * currentScale + 16 * currentScale;
    height += 26 * currentScale;

    const introRows = [
      ["Solicitante", formData.nombre || "No informado"],
      ["Documento", [formData.tipo_documento, formData.numero_documento].filter(Boolean).join(" ") || "No informado"],
      ["Lugar de expedición", formData.lugar_expedicion || "No informado"],
      ["Destino", getRequestedPurpose(formData) || "No informado"],
      ["Período certificado", formData.periodo || "No informado"]
    ];

    height += 22 * currentScale;
    introRows.forEach(([, value]) => {
      const lines = wrapText(String(value || ""), bodyFont, 9.8 * currentScale, valueWidth);
      height += Math.max(14 * currentScale, lines.length * 11.4 * currentScale + 1);
    });

    height += 8 * currentScale;
    height += 22 * currentScale;
    certificationContent.paragraphs.forEach((paragraph, index) => {
      const lines = wrapText(paragraph, bodyFont, 10.1 * currentScale, contentWidth);
      height += lines.length * 13.2 * currentScale + (index === 2 ? 8 : 5) * currentScale;
    });

    if (certificationContent.showIncomeList && incomes.length) {
      height += 6 * currentScale;
      height += 22 * currentScale;
      incomes.forEach(({ label, value }) => {
        const valueLines = wrapText(String(value || ""), bodyFont, 9.6 * currentScale, 172 * currentScale);
        const labelLines = wrapText(label, bodyBold, 9.9 * currentScale, 210 * currentScale);
        height += Math.max(valueLines.length, labelLines.length) * 11.1 * currentScale + 1;
      });
    }

    return height;
  };

  const estimateSignatureBlockHeight = (currentScale) => {
    return baseSignatureDims.height * currentScale + 86 * currentScale;
  };

  while (estimateBodyHeight(scale) + estimateSignatureBlockHeight(scale) + fitSafetyPadding > availableHeight && scale > 0.42) {
    scale -= scale > 0.68 ? 0.04 : 0.02;
  }

  const page = pdf.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - TOP_MARGIN;
  const contentWidth = PAGE_WIDTH - MARGIN_X * 2;
  const logoDims = {
    width: baseLogoDims.width * scale,
    height: baseLogoDims.height * scale
  };
  const signatureDims = {
    width: baseSignatureDims.width * scale,
    height: baseSignatureDims.height * scale
  };
  const labelWidth = 126 * scale;
  const gap = 12;
  const valueWidth = contentWidth - labelWidth - gap;
  const signatureBlockTopY = BOTTOM_MARGIN + estimateSignatureBlockHeight(scale);

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
    page.drawRectangle({
      x: MARGIN_X,
      y: y - 14 * scale,
      width: 172 * scale,
      height: 16 * scale,
      color: ACCENT_SOFT,
      borderColor: BORDER,
      borderWidth: 0.5
    });
    page.drawText(label.toUpperCase(), {
      x: MARGIN_X + 7 * scale,
      y: y - 10.5 * scale,
      size: 8.9 * scale,
      font: sectionFont,
      color: ACCENT
    });
    y -= 24 * scale;
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

  const drawParagraph = (text, { font, fontSize, lineHeight, color = TEXT, justify = true }) => {
    const lines = wrapText(text, font, fontSize, contentWidth);
    lines.forEach((line, index) => {
      const isLastLine = index === lines.length - 1;
      if (justify && !isLastLine && line.includes(" ")) {
        drawJustifiedLine(page, line, MARGIN_X, y, contentWidth, font, fontSize, color);
      } else {
        page.drawText(line, {
          x: MARGIN_X,
          y,
          size: fontSize,
          font,
          color
        });
      }
      y -= lineHeight;
    });
    y -= 4 * scale;
  };

  page.drawImage(logoImage, {
    x: (PAGE_WIDTH - logoDims.width) / 2,
    y: y - logoDims.height,
    width: logoDims.width,
    height: logoDims.height
  });
  y -= logoDims.height + 18 * scale;

  drawCentered("CERTIFICACIÓN DE INGRESOS", titleFont, 22 * scale, ACCENT);
  y -= 18 * scale;
  drawCentered(`${profile.city}, ${formatLongDate(new Date())}`, bodyFont, 10.3 * scale, TEXT_SOFT);
  y -= 16 * scale;

  page.drawLine({
    start: { x: MARGIN_X + 8, y },
    end: { x: PAGE_WIDTH - MARGIN_X - 8, y },
    thickness: 1,
    color: BORDER
  });
  y -= 18 * scale;

  drawSectionHeading("Datos del solicitante");
  [
    ["Solicitante", formData.nombre || "No informado"],
    ["Documento", [formData.tipo_documento, formData.numero_documento].filter(Boolean).join(" ") || "No informado"],
    ["Lugar de expedición", formData.lugar_expedicion || "No informado"],
    ["Destino", getRequestedPurpose(formData) || "No informado"],
    ["Período certificado", formData.periodo || "No informado"]
  ].forEach(([label, value]) => {
    const lines = wrapText(String(value || ""), bodyFont, 9.8 * scale, valueWidth);
    page.drawText(`${label}:`, {
      x: MARGIN_X,
      y,
      size: 9.8 * scale,
      font: bodyBold,
      color: ACCENT
    });

    lines.forEach((line, lineIndex) => {
      page.drawText(line, {
        x: MARGIN_X + labelWidth + gap,
        y: y - lineIndex * 11.4 * scale,
        size: 9.8 * scale,
        font: bodyFont,
        color: TEXT
      });
    });

    y -= Math.max(14 * scale, lines.length * 11.4 * scale + 1);
  });

  y -= 6 * scale;
  drawSectionHeading("Certificación");
  certificationContent.paragraphs.slice(0, 2).forEach((paragraph) => {
    drawParagraph(paragraph, {
      font: bodyFont,
      fontSize: 10.1 * scale,
      lineHeight: 13.2 * scale,
      color: TEXT,
      justify: true
    });
  });

  if (certificationContent.showIncomeList && incomes.length) {
    drawSectionHeading("Conceptos de ingresos certificados");
    incomes.forEach(({ label, value }) => {
      const labelLines = wrapText(label, bodyBold, 9.9 * scale, 210 * scale);
      const valueLines = wrapText(String(value || ""), bodyFont, 9.6 * scale, 172 * scale);
      const rowLines = Math.max(labelLines.length, valueLines.length);

      page.drawText("•", {
        x: MARGIN_X,
        y,
        size: 11 * scale,
        font: bodyBold,
        color: ACCENT
      });

      labelLines.forEach((line, index) => {
        page.drawText(line, {
          x: MARGIN_X + 12 * scale,
          y: y - index * 11.5 * scale,
          size: 9.9 * scale,
          font: bodyBold,
          color: ACCENT
        });
      });

      valueLines.forEach((line, index) => {
        page.drawText(line, {
          x: PAGE_WIDTH - MARGIN_X - 172 * scale,
          y: y - index * 11.1 * scale,
          size: 9.6 * scale,
          font: bodyFont,
          color: TEXT
        });
      });

      y -= rowLines * 11.1 * scale + 1;
    });
  }

  certificationContent.paragraphs.slice(2).forEach((paragraph, index) => {
    if (index === 0) {
      page.drawRectangle({
        x: MARGIN_X,
        y: y - 20 * scale,
        width: contentWidth,
        height: 34 * scale,
        color: ACCENT_SOFT,
        borderColor: BORDER,
        borderWidth: 0.8
      });
      page.drawText("INGRESOS MENSUALES CERTIFICADOS", {
        x: MARGIN_X + 10 * scale,
        y: y + 4.5 * scale,
        size: 8.8 * scale,
        font: sectionFont,
        color: ACCENT
      });
      const totalLines = wrapText(paragraph, bodyBold, 10 * scale, contentWidth - 20 * scale);
      totalLines.forEach((line, lineIndex) => {
        page.drawText(line, {
          x: MARGIN_X + 10 * scale,
          y: y - 8.5 * scale - lineIndex * 12 * scale,
          size: 10 * scale,
          font: bodyBold,
          color: TEXT
        });
      });
      y -= 38 * scale + Math.max(0, (totalLines.length - 1) * 12 * scale);
      return;
    }

    drawParagraph(paragraph, {
      font: bodyFont,
      fontSize: 10 * scale,
      lineHeight: 13.2 * scale,
      color: TEXT,
      justify: true
    });
  });

  y = Math.max(y - 8 * scale, signatureBlockTopY + 10 * scale);
  const signatureLineY = BOTTOM_MARGIN + 58 * scale;

  page.drawImage(signatureImage, {
    x: MARGIN_X,
    y: signatureLineY + 8 * scale,
    width: signatureDims.width,
    height: signatureDims.height
  });

  page.drawLine({
    start: { x: MARGIN_X, y: signatureLineY },
    end: { x: MARGIN_X + 200 * scale, y: signatureLineY },
    thickness: 1,
    color: BORDER
  });

  page.drawText(profile.accountantName, {
    x: MARGIN_X,
    y: signatureLineY - 18 * scale,
    size: 10.4 * scale,
    font: bodyBold,
    color: ACCENT
  });
  page.drawText(profile.title, {
    x: MARGIN_X,
    y: signatureLineY - 31 * scale,
    size: 9.6 * scale,
    font: bodyFont,
    color: TEXT
  });
  page.drawText(`C.C. No. ${profile.accountantDocumentNumber || "POR CONFIGURAR"}`, {
    x: MARGIN_X,
    y: signatureLineY - 44 * scale,
    size: 9.4 * scale,
    font: bodyFont,
    color: TEXT
  });
  page.drawText(`Tarjeta Profesional No. ${profile.professionalCardNumber || "POR CONFIGURAR"}`, {
    x: MARGIN_X,
    y: signatureLineY - 57 * scale,
    size: 9.4 * scale,
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
