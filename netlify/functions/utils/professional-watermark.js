import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import { sanitizeFileName } from "./certification-supports.js";

const A4_PORTRAIT = [595.28, 841.89];
const A4_LANDSCAPE = [841.89, 595.28];
const WATERMARK_COLOR = rgb(0.07, 0.16, 0.31);
const TEXT_SOFT = rgb(0.24, 0.3, 0.4);

function compactText(value, fallback = "") {
  return String(value || fallback).replace(/\s+/g, " ").trim();
}

function normalizeWatermarkText(value, fallback = "") {
  return compactText(value, fallback)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function truncateToWidth(text, font, size, maxWidth) {
  const value = String(text || "");
  if (font.widthOfTextAtSize(value, size) <= maxWidth) return value;

  let next = value;
  while (next.length > 8 && font.widthOfTextAtSize(`${next}...`, size) > maxWidth) {
    next = next.slice(0, -1);
  }
  return `${next.trim()}...`;
}

function buildWatermarkData({ customerName, reference, consecutive }) {
  const client = normalizeWatermarkText(customerName, "CLIENTE");
  const certificateId = normalizeWatermarkText(
    consecutive ? `CERTIFICACION ${consecutive}` : `REF. ${reference || ""}`,
    "CERTIFICACION CONTARAE"
  );

  return {
    primary: "USO EXCLUSIVO CERTIFICACION DE INGRESOS",
    secondary: `${client} - ${certificateId}`,
    footer:
      "Documento adjunto exclusivamente como soporte de la certificacion de ingresos indicada. Su uso independiente no esta autorizado."
  };
}

function drawWatermarkOnPage(page, font, boldFont, watermark) {
  const { width, height } = page.getSize();
  const primarySize = Math.max(13, Math.min(20, width / 30));
  const secondarySize = Math.max(9, Math.min(13, width / 45));
  const maxTextWidth = width * 0.86;
  const primary = truncateToWidth(watermark.primary, boldFont, primarySize, maxTextWidth);
  const secondary = truncateToWidth(watermark.secondary, font, secondarySize, maxTextWidth);
  const angle = degrees(34);

  [0.24, 0.52, 0.8].forEach((ratio, index) => {
    const y = height * ratio;
    const x = width * 0.08 - index * 18;
    page.drawText(primary, {
      x,
      y,
      size: primarySize,
      font: boldFont,
      color: WATERMARK_COLOR,
      opacity: 0.075,
      rotate: angle
    });
    page.drawText(secondary, {
      x: x + 8,
      y: y - primarySize - 7,
      size: secondarySize,
      font,
      color: WATERMARK_COLOR,
      opacity: 0.085,
      rotate: angle
    });
  });

  page.drawText(truncateToWidth(watermark.footer, font, 7.2, width - 76), {
    x: 38,
    y: 18,
    size: 7.2,
    font,
    color: TEXT_SOFT,
    opacity: 0.58
  });
}

async function buildWatermarkedPdfFromImage(documentBytes, contentType, watermark) {
  const pdf = await PDFDocument.create();
  const normalizedType = String(contentType || "").toLowerCase();
  let image;

  if (normalizedType.includes("png")) {
    image = await pdf.embedPng(documentBytes);
  } else if (normalizedType.includes("jpeg") || normalizedType.includes("jpg")) {
    image = await pdf.embedJpg(documentBytes);
  } else {
    throw new Error("La tarjeta profesional debe estar en PDF, JPG o PNG para poder aplicar la marca de agua.");
  }

  const [pageWidth, pageHeight] = image.width > image.height ? A4_LANDSCAPE : A4_PORTRAIT;
  const page = pdf.addPage([pageWidth, pageHeight]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);
  const margin = 42;
  const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height);
  const imageWidth = image.width * scale;
  const imageHeight = image.height * scale;

  page.drawRectangle({
    x: 0,
    y: 0,
    width: pageWidth,
    height: pageHeight,
    color: rgb(1, 1, 1)
  });
  page.drawImage(image, {
    x: (pageWidth - imageWidth) / 2,
    y: (pageHeight - imageHeight) / 2,
    width: imageWidth,
    height: imageHeight
  });
  drawWatermarkOnPage(page, font, boldFont, watermark);

  return pdf.save();
}

async function buildWatermarkedPdfFromPdf(documentBytes, watermark) {
  const pdf = await PDFDocument.load(documentBytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdf.embedFont(StandardFonts.HelveticaBold);

  pdf.getPages().forEach((page) => {
    drawWatermarkOnPage(page, font, boldFont, watermark);
  });

  return pdf.save();
}

export async function buildWatermarkedProfessionalCardAttachment({
  professionalCard,
  customerName,
  reference,
  consecutive
}) {
  if (!professionalCard?.data) {
    throw new Error("No se recibio la tarjeta profesional para marcar.");
  }

  const contentType = String(professionalCard.meta?.contentType || "").toLowerCase();
  const fileName = String(professionalCard.meta?.fileName || "");
  const documentBytes = Buffer.from(professionalCard.data);
  const watermark = buildWatermarkData({ customerName, reference, consecutive });
  const isPdf = contentType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
  const bytes = isPdf
    ? await buildWatermarkedPdfFromPdf(documentBytes, watermark)
    : await buildWatermarkedPdfFromImage(documentBytes, contentType || fileName, watermark);
  const suffix = sanitizeFileName(reference || consecutive || "contarae");

  return {
    filename: `tarjeta-profesional-uso-exclusivo-${suffix}.pdf`,
    content: bytes,
    type: "application/pdf"
  };
}
