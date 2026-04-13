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

function buildIncomeRows(formData = {}) {
  const rows = [
    ["Ingresos laborales", formData.ingresos_laborales],
    ["Pensiones", formData.pensiones],
    ["Dividendos", formData.dividendos],
    ["Inversiones", formData.inversiones],
    ["Arriendos", formData.arriendos],
    ["Remesas", formData.remesas],
    ["Otros ingresos", formData.otros_ingresos]
  ].filter(([, value]) => hasMeaningfulCurrencyValue(value));

  if (hasMeaningfulCurrencyValue(formData.otros_ingresos) && String(formData.otros_descripcion || "").trim()) {
    rows.push(["Detalle otros ingresos", String(formData.otros_descripcion || "").trim()]);
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
  const period = String(formData.periodo || "").trim();
  const totalIncome = String(formData.total_ingresos || "").trim();

  return [
    `Yo, ${profile.accountantName}, ${profile.title}, identificado con C.C. No. ${profile.accountantDocumentNumber || "POR CONFIGURAR"} y portador de la Tarjeta Profesional No. ${profile.professionalCardNumber || "POR CONFIGURAR"}, certifico que revisé la información y los documentos soporte aportados por ${formData.nombre || "el solicitante"}, identificado(a) con ${[formData.tipo_documento, formData.numero_documento].filter(Boolean).join(" ") || "documento no informado"}.`,
    `Con fundamento en los soportes exhibidos y en la información económica reportada para el ${period || "periodo indicado por el solicitante"}, se evidencian ingresos por los conceptos que se describen en esta certificación, con un total reportado de ${totalIncome || "valor no informado"} mensuales.`,
    destination
      ? `La presente certificación se expide a solicitud del interesado para ser presentada ante ${destination}, sin que ello implique auditoría integral, revisoría fiscal ni dictamen sobre estados financieros. Su alcance se limita a la documentación examinada y a la razonabilidad de la información suministrada.`
      : "La presente certificación se expide a solicitud del interesado para los fines que estime convenientes, sin que ello implique auditoría integral, revisoría fiscal ni dictamen sobre estados financieros. Su alcance se limita a la documentación examinada y a la razonabilidad de la información suministrada.",
    `Se emite en ${profile.city}, el ${formatLongDate(new Date())}, dejando constancia de que cualquier cambio posterior en la realidad económica del solicitante deberá ser validado con nueva documentación soporte.`
  ];
}

export async function generateCertificationPdf(record = {}) {
  const formData = buildCertificateData(record);
  const profile = getProfessionalProfile();
  const incomes = buildIncomeRows(formData);
  const pdf = await PDFDocument.create();
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const sectionFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const bodyBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoImage = await pdf.embedPng(await readAssetBytes("contarae-logo-completo.png"));
  const signatureImage = await pdf.embedPng(await readAssetBytes("contarae-firma.png"));
  const baseLogoDims = logoImage.scale(Math.min(0.46, 178 / logoImage.width));
  const baseSignatureDims = signatureImage.scale(Math.min(0.28, 128 / signatureImage.width));
  const availableHeight = PAGE_HEIGHT - TOP_MARGIN - BOTTOM_MARGIN - 12;
  const narrativeParagraphs = buildCertificationNarrative(record);
  let scale = 1;
  const fitSafetyPadding = 22;

  const estimateHeight = (currentScale) => {
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
      ["Período certificado", formData.periodo || "No informado"],
      ["Total ingresos reportados", formData.total_ingresos || "No informado"]
    ];

    height += 22 * currentScale;
    introRows.forEach(([, value]) => {
      const lines = wrapText(String(value || ""), bodyFont, 9.8 * currentScale, valueWidth);
      height += Math.max(14 * currentScale, lines.length * 11.4 * currentScale + 1);
    });

    height += 8 * currentScale;
    height += 22 * currentScale;
    narrativeParagraphs.forEach((paragraph) => {
      const lines = wrapText(paragraph, bodyFont, 10.1 * currentScale, contentWidth);
      height += lines.length * 13.4 * currentScale + 5 * currentScale;
    });

    height += 6 * currentScale;
    height += 22 * currentScale;
    if (incomes.length) {
      incomes.forEach(([label, value]) => {
        const valueLines = wrapText(String(value || ""), bodyFont, 9.7 * currentScale, 176 * currentScale);
        const labelLines = wrapText(label, bodyBold, 9.9 * currentScale, 210 * currentScale);
        height += Math.max(valueLines.length, labelLines.length) * 11.5 * currentScale + 1;
      });
    } else {
      const lines = wrapText("No se reportaron conceptos con valor para incluir en esta certificación.", bodyFont, 9.9 * currentScale, contentWidth);
      height += lines.length * 13 * currentScale;
    }

    height += 13 * currentScale;
    height += 11.2 * currentScale + 16 * currentScale;
    height += baseSignatureDims.height * currentScale + 60 * currentScale;
    height += 46 * currentScale;

    return height;
  };

  while (estimateHeight(scale) + fitSafetyPadding > availableHeight && scale > 0.42) {
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
    ["Período certificado", formData.periodo || "No informado"],
    ["Total ingresos reportados", formData.total_ingresos || "No informado"]
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
  narrativeParagraphs.forEach((paragraph) => {
    drawParagraph(paragraph, {
      font: bodyFont,
      fontSize: 10.1 * scale,
      lineHeight: 13.4 * scale,
      color: TEXT,
      justify: true
    });
  });

  drawSectionHeading("Conceptos de ingresos reportados");
  if (incomes.length) {
    incomes.forEach(([label, value]) => {
      const labelLines = wrapText(label, bodyBold, 9.9 * scale, 210 * scale);
      const valueLines = wrapText(String(value || ""), bodyFont, 9.7 * scale, 176 * scale);
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
          x: PAGE_WIDTH - MARGIN_X - 176 * scale,
          y: y - index * 11.5 * scale,
          size: 9.7 * scale,
          font: bodyFont,
          color: TEXT
        });
      });

      y -= rowLines * 11.5 * scale + 1;
    });
  } else {
    drawParagraph("No se reportaron conceptos con valor para incluir en esta certificación.", {
      font: bodyFont,
      fontSize: 9.9 * scale,
      lineHeight: 13 * scale,
      color: TEXT,
      justify: false
    });
  }

  y -= 6 * scale;
  page.drawText(`Total mensual certificado: ${formData.total_ingresos || "No informado"}`, {
    x: MARGIN_X,
    y,
    size: 10.5 * scale,
    font: bodyBold,
    color: ACCENT
  });

  y -= 24 * scale;
  const signatureLineY = y;

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
    y: signatureLineY - 16 * scale,
    size: 10.4 * scale,
    font: bodyBold,
    color: ACCENT
  });
  page.drawText(profile.title, {
    x: MARGIN_X,
    y: signatureLineY - 29 * scale,
    size: 9.6 * scale,
    font: bodyFont,
    color: TEXT
  });
  page.drawText(`C.C. No. ${profile.accountantDocumentNumber || "POR CONFIGURAR"}`, {
    x: MARGIN_X,
    y: signatureLineY - 42 * scale,
    size: 9.4 * scale,
    font: bodyFont,
    color: TEXT
  });
  page.drawText(`Tarjeta Profesional No. ${profile.professionalCardNumber || "POR CONFIGURAR"}`, {
    x: MARGIN_X,
    y: signatureLineY - 55 * scale,
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
