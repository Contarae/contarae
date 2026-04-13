import fs from "fs/promises";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getProfessionalProfile } from "./professional-documents.js";
import { buildCertificateData } from "./certification-admin.js";

const logoPath = new URL("../assets/contarae-logo-completo.png", import.meta.url);
const signaturePath = new URL("../assets/contarae-firma.png", import.meta.url);

const numberFormatter = new Intl.NumberFormat("es-CO");

function parseCurrency(value) {
  return Number(String(value || "").replace(/[^\d.-]/g, "")) || 0;
}

function hasMeaningfulCurrencyValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return false;
  return parseCurrency(raw) > 0;
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

function wrapText(text, font, fontSize, maxWidth) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let currentLine = "";

  words.forEach((word) => {
    const tentative = currentLine ? `${currentLine} ${word}` : word;
    const width = font.widthOfTextAtSize(tentative, fontSize);
    if (width <= maxWidth || !currentLine) {
      currentLine = tentative;
      return;
    }

    lines.push(currentLine);
    currentLine = word;
  });

  if (currentLine) lines.push(currentLine);
  return lines.length ? lines : [""];
}

export function buildCertificationNarrative(record = {}) {
  const formData = buildCertificateData(record);
  const profile = getProfessionalProfile();
  const destination = getRequestedPurpose(formData);
  const period = String(formData.periodo || "").trim();
  const totalIncome = String(formData.total_ingresos || "").trim();

  return [
    `Yo, ${profile.accountantName}, ${profile.title}, identificado con C.C. No. ${profile.accountantDocumentNumber || "POR CONFIGURAR"}, actuando bajo la firma de ${profile.companyName} y en ejercicio de mi profesión con Tarjeta Profesional No. ${profile.professionalCardNumber || "POR CONFIGURAR"}, certifico que revisé la información y los documentos soporte aportados por ${formData.nombre || "el solicitante"}, identificado(a) con ${[formData.tipo_documento, formData.numero_documento].filter(Boolean).join(" ") || "documento no informado"}.`,
    `Con fundamento en los soportes exhibidos y en la información económica reportada para el ${period || "periodo indicado por el solicitante"}, se evidencian ingresos por los conceptos que se describen en esta certificación, con un total reportado de ${totalIncome || "valor no informado"} mensuales.`,
    destination
      ? `La presente certificación se expide a solicitud del interesado para ser presentada ante ${destination}, sin que ello implique auditoría integral, revisoría fiscal ni dictamen sobre estados financieros; su alcance se limita a la documentación examinada y a la razonabilidad de la información suministrada.`
      : `La presente certificación se expide a solicitud del interesado para los fines que estime convenientes, sin que ello implique auditoría integral, revisoría fiscal ni dictamen sobre estados financieros; su alcance se limita a la documentación examinada y a la razonabilidad de la información suministrada.`,
    `Se emite en ${profile.city}, el ${formatLongDate(new Date())}, dejando constancia de que cualquier cambio posterior en la realidad económica del solicitante deberá ser validado con nueva documentación soporte.`
  ];
}

export async function generateCertificationPdf(record = {}) {
  const formData = buildCertificateData(record);
  const profile = getProfessionalProfile();
  const incomes = buildIncomeRows(formData);
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595.28, 841.89]);
  const pageWidth = page.getWidth();
  const pageHeight = page.getHeight();
  const marginX = 52;
  const contentWidth = pageWidth - marginX * 2;
  const titleFont = await pdf.embedFont(StandardFonts.TimesRomanBold);
  const bodyFont = await pdf.embedFont(StandardFonts.Helvetica);
  const bodyBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const logoBytes = await fs.readFile(logoPath);
  const signatureBytes = await fs.readFile(signaturePath);
  const logoImage = await pdf.embedPng(logoBytes);
  const signatureImage = await pdf.embedPng(signatureBytes);
  const logoScale = Math.min(0.42, 210 / logoImage.width);
  const logoDims = logoImage.scale(logoScale);
  const signatureScale = Math.min(0.38, 170 / signatureImage.width);
  const signatureDims = signatureImage.scale(signatureScale);
  let y = pageHeight - 70;

  page.drawImage(logoImage, {
    x: marginX,
    y: y - logoDims.height,
    width: logoDims.width,
    height: logoDims.height
  });
  y -= logoDims.height + 26;

  page.drawText("CERTIFICACIÓN DE INGRESOS", {
    x: marginX,
    y,
    size: 22,
    font: titleFont,
    color: rgb(0.05, 0.12, 0.25)
  });
  y -= 18;

  page.drawText(`${profile.city}, ${formatLongDate(new Date())}`, {
    x: marginX,
    y,
    size: 10.5,
    font: bodyFont,
    color: rgb(0.33, 0.4, 0.5)
  });
  y -= 28;

  const introRows = [
    ["Solicitante", formData.nombre || "No informado"],
    ["Documento", [formData.tipo_documento, formData.numero_documento].filter(Boolean).join(" ") || "No informado"],
    ["Lugar de expedición", formData.lugar_expedicion || "No informado"],
    ["Destino", getRequestedPurpose(formData) || "No informado"],
    ["Período certificado", formData.periodo || "No informado"],
    ["Total ingresos reportados", formData.total_ingresos || "No informado"]
  ];

  introRows.forEach(([label, value]) => {
    page.drawText(`${label}:`, {
      x: marginX,
      y,
      size: 10.5,
      font: bodyBold,
      color: rgb(0.05, 0.12, 0.25)
    });
    page.drawText(String(value || ""), {
      x: marginX + 118,
      y,
      size: 10.5,
      font: bodyFont,
      color: rgb(0.2, 0.24, 0.3)
    });
    y -= 16;
  });

  y -= 8;

  buildCertificationNarrative(record).forEach((paragraph) => {
    const lines = wrapText(paragraph, bodyFont, 11, contentWidth);
    lines.forEach((line) => {
      page.drawText(line, {
        x: marginX,
        y,
        size: 11,
        font: bodyFont,
        color: rgb(0.18, 0.22, 0.3)
      });
      y -= 15;
    });
    y -= 8;
  });

  y -= 6;
  page.drawText("Conceptos de ingresos reportados", {
    x: marginX,
    y,
    size: 12.5,
    font: bodyBold,
    color: rgb(0.05, 0.12, 0.25)
  });
  y -= 18;

  incomes.forEach(([label, value]) => {
    page.drawText("•", {
      x: marginX,
      y,
      size: 12,
      font: bodyBold,
      color: rgb(0.12, 0.24, 0.45)
    });
    page.drawText(label, {
      x: marginX + 14,
      y,
      size: 10.8,
      font: bodyBold,
      color: rgb(0.12, 0.24, 0.45)
    });
    page.drawText(String(value || ""), {
      x: marginX + 220,
      y,
      size: 10.8,
      font: bodyFont,
      color: rgb(0.2, 0.24, 0.3)
    });
    y -= 15;
  });

  y -= 6;
  page.drawText(`Total mensual certificado: ${formData.total_ingresos || "No informado"}`, {
    x: marginX,
    y,
    size: 11.2,
    font: bodyBold,
    color: rgb(0.05, 0.12, 0.25)
  });

  y -= 70;

  page.drawImage(signatureImage, {
    x: marginX,
    y: y - signatureDims.height + 8,
    width: signatureDims.width,
    height: signatureDims.height
  });
  page.drawLine({
    start: { x: marginX, y: y - 12 },
    end: { x: marginX + 205, y: y - 12 },
    thickness: 1,
    color: rgb(0.7, 0.75, 0.82)
  });

  page.drawText(profile.accountantName, {
    x: marginX,
    y: y - 28,
    size: 11.5,
    font: bodyBold,
    color: rgb(0.05, 0.12, 0.25)
  });
  page.drawText(`${profile.title}`, {
    x: marginX,
    y: y - 43,
    size: 10.5,
    font: bodyFont,
    color: rgb(0.2, 0.24, 0.3)
  });
  page.drawText(`C.C. No. ${profile.accountantDocumentNumber || "POR CONFIGURAR"}`, {
    x: marginX,
    y: y - 58,
    size: 10.5,
    font: bodyFont,
    color: rgb(0.2, 0.24, 0.3)
  });
  page.drawText(`Tarjeta Profesional No. ${profile.professionalCardNumber || "POR CONFIGURAR"}`, {
    x: marginX,
    y: y - 73,
    size: 10.5,
    font: bodyFont,
    color: rgb(0.2, 0.24, 0.3)
  });
  page.drawText(`${profile.companyName}`, {
    x: marginX,
    y: y - 88,
    size: 10.5,
    font: bodyFont,
    color: rgb(0.2, 0.24, 0.3)
  });

  const pdfBytes = await pdf.save();

  return {
    bytes: pdfBytes,
    fileName: `certificacion-${record.consecutive || record.reference || "contarae"}.pdf`,
    contentType: "application/pdf"
  };
}
