import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import QRCode from "qrcode";
import { sanitizeFileName } from "./certification-supports.js";

const A4_PORTRAIT = [595.28, 841.89];
const A4_LANDSCAPE = [841.89, 595.28];
const WATERMARK_COLOR = rgb(0.05, 0.13, 0.28);
const TEXT_SOFT = rgb(0.24, 0.3, 0.4);
const ACCENT = rgb(0.12, 0.24, 0.45);
const BORDER = rgb(0.82, 0.88, 0.95);

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

async function createQrPngBytes(value) {
  const dataUrl = await QRCode.toDataURL(String(value || ""), {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 180,
    color: {
      dark: "#0B1D3A",
      light: "#FFFFFF"
    }
  });
  return Buffer.from(dataUrl.split(",")[1] || "", "base64");
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

function drawWatermarkOnPage(page, font, boldFont, watermark, options = {}) {
  const { width, height } = page.getSize();
  const primarySize = Math.max(13, Math.min(20, width / 30));
  const secondarySize = Math.max(9, Math.min(13, width / 45));
  const maxTextWidth = width * 0.86;
  const primary = truncateToWidth(watermark.primary, boldFont, primarySize, maxTextWidth);
  const secondary = truncateToWidth(watermark.secondary, font, secondarySize, maxTextWidth);
  const angle = degrees(34);

  [0.16, 0.38, 0.6, 0.82].forEach((ratio, index) => {
    const y = height * ratio;
    const x = width * 0.06 - index * 16;
    page.drawText(primary, {
      x,
      y,
      size: primarySize,
      font: boldFont,
      color: WATERMARK_COLOR,
      opacity: 0.095,
      rotate: angle
    });
    page.drawText(secondary, {
      x: x + 8,
      y: y - primarySize - 7,
      size: secondarySize,
      font,
      color: WATERMARK_COLOR,
      opacity: 0.105,
      rotate: angle
    });
  });

  if (!options.hideFooter) {
    page.drawText(truncateToWidth(watermark.footer, font, 7.2, width - 76), {
      x: 38,
      y: 18,
      size: 7.2,
      font,
      color: TEXT_SOFT,
      opacity: 0.58
    });
  }
}

function drawCenteredText(page, text, centerX, y, size, font, color, maxWidth = Infinity) {
  const value = Number.isFinite(maxWidth) ? truncateToWidth(text, font, size, maxWidth) : String(text || "");
  const width = font.widthOfTextAtSize(value, size);
  page.drawText(value, {
    x: centerX - width / 2,
    y,
    size,
    font,
    color
  });
}

function drawValidationFooter(page, font, boldFont, qrImage, verification = {}) {
  if (!qrImage || !verification.url) return;

  const { width } = page.getSize();
  const footerHeight = 96;
  const footerY = 0;
  const qrSize = 52;
  const centerX = width / 2;
  const qrX = centerX - qrSize / 2;
  const qrY = footerY + 25;
  const code = compactText(verification.code, "");

  page.drawRectangle({
    x: 32,
    y: footerY + 10,
    width: width - 64,
    height: footerHeight - 18,
    borderColor: BORDER,
    borderWidth: 0.7,
    color: rgb(1, 1, 1),
    opacity: 0.92
  });
  page.drawText("VALIDAR CERTIFICACIÓN", {
    x: 46,
    y: footerY + 67,
    size: 8.2,
    font: boldFont,
    color: ACCENT
  });
  page.drawText("Uso exclusivo de esta certificación de ingresos", {
    x: 46,
    y: footerY + 52,
    size: 7.1,
    font,
    color: TEXT_SOFT
  });
  page.drawImage(qrImage, {
    x: qrX,
    y: qrY,
    width: qrSize,
    height: qrSize
  });
  drawCenteredText(page, code ? `Código: ${code}` : "Escanee el código QR", centerX, footerY + 15, 7.2, boldFont, ACCENT, 210);
  page.drawText("El QR consulta el certificado emitido por CONTARAE.", {
    x: width - 250,
    y: footerY + 52,
    size: 7.1,
    font,
    color: TEXT_SOFT
  });
  page.drawText("La tarjeta no está autorizada para uso independiente.", {
    x: width - 250,
    y: footerY + 38,
    size: 7.1,
    font,
    color: TEXT_SOFT
  });
}

async function buildWatermarkedPdfFromImage(documentBytes, contentType, watermark, verification) {
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
  const qrImage = verification?.url ? await pdf.embedPng(await createQrPngBytes(verification.url)) : null;
  const margin = 42;
  const footerReserve = qrImage ? 108 : 0;
  const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2 - footerReserve) / image.height);
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
    y: footerReserve + (pageHeight - footerReserve - imageHeight) / 2,
    width: imageWidth,
    height: imageHeight
  });
  drawWatermarkOnPage(page, font, boldFont, watermark, { hideFooter: Boolean(qrImage) });
  drawValidationFooter(page, font, boldFont, qrImage, verification);

  return pdf.save();
}

async function buildWatermarkedPdfFromPdf(documentBytes, watermark, verification) {
  const sourcePdf = await PDFDocument.load(documentBytes);
  const outputPdf = await PDFDocument.create();
  const font = await outputPdf.embedFont(StandardFonts.Helvetica);
  const boldFont = await outputPdf.embedFont(StandardFonts.HelveticaBold);
  const pageCount = sourcePdf.getPageCount();
  const embeddedPages = await outputPdf.embedPdf(documentBytes, Array.from({ length: pageCount }, (_, index) => index));
  const qrImage = verification?.url ? await outputPdf.embedPng(await createQrPngBytes(verification.url)) : null;

  embeddedPages.forEach((embeddedPage) => {
    const originalWidth = embeddedPage.width;
    const originalHeight = embeddedPage.height;
    const [pageWidth, pageHeight] = originalWidth > originalHeight ? A4_LANDSCAPE : A4_PORTRAIT;
    const footerReserve = qrImage ? 108 : 0;
    const marginX = 34;
    const marginTop = 30;
    const availableWidth = pageWidth - marginX * 2;
    const availableHeight = pageHeight - marginTop - footerReserve - 12;
    const scale = Math.min(availableWidth / originalWidth, availableHeight / originalHeight);
    const drawWidth = originalWidth * scale;
    const drawHeight = originalHeight * scale;
    const page = outputPdf.addPage([pageWidth, pageHeight]);

    page.drawRectangle({
      x: 0,
      y: 0,
      width: pageWidth,
      height: pageHeight,
      color: rgb(1, 1, 1)
    });
    page.drawPage(embeddedPage, {
      x: (pageWidth - drawWidth) / 2,
      y: footerReserve + (pageHeight - footerReserve - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight
    });
    drawWatermarkOnPage(page, font, boldFont, watermark, { hideFooter: Boolean(qrImage) });
    drawValidationFooter(page, font, boldFont, qrImage, verification);
  });

  return outputPdf.save();
}

export async function buildWatermarkedProfessionalCardAttachment({
  professionalCard,
  customerName,
  reference,
  consecutive,
  verificationUrl,
  verificationCode
}) {
  if (!professionalCard?.data) {
    throw new Error("No se recibio la tarjeta profesional para marcar.");
  }

  const contentType = String(professionalCard.meta?.contentType || "").toLowerCase();
  const fileName = String(professionalCard.meta?.fileName || "");
  const documentBytes = Buffer.from(professionalCard.data);
  const watermark = buildWatermarkData({ customerName, reference, consecutive });
  const verification = {
    url: compactText(verificationUrl, ""),
    code: compactText(verificationCode, "")
  };
  const isPdf = contentType.includes("pdf") || fileName.toLowerCase().endsWith(".pdf");
  const bytes = isPdf
    ? await buildWatermarkedPdfFromPdf(documentBytes, watermark, verification)
    : await buildWatermarkedPdfFromImage(documentBytes, contentType || fileName, watermark, verification);
  const suffix = sanitizeFileName(reference || consecutive || "contarae");

  return {
    filename: `tarjeta-profesional-uso-exclusivo-${suffix}.pdf`,
    content: bytes,
    type: "application/pdf"
  };
}
