import {
  authenticateAdminCredentials,
  buildAdminHeaders,
  getAdminSessionFromRequest
} from "./utils/admin-auth.js";
import { getCertificationByReference, mergeCertificationRecordUpdates } from "./utils/certification-admin.js";
import { generateCertificationPdf } from "./utils/certification-pdf.js";
import { buildIssuedCertificateBlobKey } from "./utils/certification-supports.js";
import {
  getProfessionalDocumentBlob,
  getProfessionalDocumentsStatus,
  getProfessionalProfile
} from "./utils/professional-documents.js";
import { buildWatermarkedProfessionalCardAttachment } from "./utils/professional-watermark.js";
import { sendResendEmail } from "./utils/resend-email.js";
import {
  buildCertificateVerificationCode,
  buildCertificateVerificationPath,
  buildCertificateVerificationUrl,
  computeCertificateSha256
} from "./utils/certificate-verification.js";

function normalizeIssuedCertificates(record = {}) {
  const issuedCertificates = Array.isArray(record.issuedCertificates)
    ? record.issuedCertificates
    : [];
  const legacyVersion =
    Number(record.certificateVersion || 0) ||
    (record.sentToClientAt || record.certificateHash || record.certificationStatus === "enviada" ? 1 : 0);

  if (issuedCertificates.length || !legacyVersion) {
    return issuedCertificates.filter((certificate) => certificate && typeof certificate === "object");
  }

  return [
    {
      id: `legacy-v${legacyVersion}`,
      version: legacyVersion,
      status: "vigente",
      issuedAt: record.certificateIssuedAt || record.sentToClientAt || "",
      sentAt: record.sentToClientAt || record.certificateIssuedAt || "",
      sentBy: record.sentToClientBy || "",
      emailId: record.sentCertificationEmailId || "",
      fileName: record.certificateFileName || `certificacion-ingresos-v${legacyVersion}.pdf`,
      verificationCode: record.certificateVerificationCode || buildCertificateVerificationCode(record),
      verificationPath: record.certificateVerificationPath || buildCertificateVerificationPath(record),
      verificationUrl: record.certificateVerificationUrl || buildCertificateVerificationUrl(record),
      hash: record.certificateHash || "",
      unavailable: true,
      note: "Versión emitida antes de activar el historial de certificados. El archivo no quedó almacenado en el expediente."
    }
  ];
}

function getNextCertificateVersion(record = {}) {
  const issuedCertificates = normalizeIssuedCertificates(record);
  const versions = issuedCertificates
    .map((certificate) => Number(certificate?.version || 0))
    .filter((version) => Number.isFinite(version) && version > 0);
  versions.push(Number(record.certificateVersion || 0) || 0);
  return Math.max(0, ...versions) + 1;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildCustomerCertificationEmailHtml(detail, includeProfessionalCard, includeJccBackground) {
  const summary = detail.summary || {};
  const certificateData = detail.certificateData || {};
  const profile = getProfessionalProfile();
  const customerName = certificateData.nombre || summary.customerName || "";
  const version = Number(detail.record?.certificateVersion || 0) || 1;
  const verificationCode =
    detail.record?.certificateVerificationCode || buildCertificateVerificationCode(detail.record || {});
  const verificationUrl =
    detail.record?.certificateVerificationUrl || buildCertificateVerificationUrl(detail.record || {});

  return `
    <div style="font-family:Arial,sans-serif;background:#f4f7fb;padding:24px;color:#0f172a;">
      <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dbe5f1;border-radius:18px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#0b1d3a,#2563eb);padding:24px 28px;color:#ffffff;">
          <div style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;opacity:0.82;">CONTARAE</div>
          <h1 style="margin:10px 0 4px;font-size:24px;">Su certificación está lista</h1>
          <p style="margin:0;font-size:14px;opacity:0.88;">Adjuntamos el documento emitido y firmado profesionalmente para su presentación.</p>
        </div>
        <div style="padding:24px 28px;">
          <p style="margin:0 0 14px;color:#334155;line-height:1.8;">
            Hola ${escapeHtml(customerName)}, adjuntamos la certificación de ingresos correspondiente a su solicitud ${summary.consecutive ? `N° ${escapeHtml(summary.consecutive)}` : escapeHtml(summary.reference || "")}.
          </p>
          ${version > 1 ? `
            <div style="margin:0 0 14px;padding:14px 16px;border-radius:14px;background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;line-height:1.7;">
              <strong>Versión corregida ${escapeHtml(version)}.</strong> Esta emisión reemplaza las versiones anteriores del expediente.
            </div>
          ` : ""}
          <div style="padding:16px 18px;border-radius:14px;background:#f8fbff;border:1px solid #dbe5f1;color:#334155;line-height:1.8;">
            <strong>Documento principal adjunto:</strong> Certificación de ingresos firmada por ${escapeHtml(profile.accountantName)}${profile.professionalCardNumber ? `, T.P. No. ${escapeHtml(profile.professionalCardNumber)}` : ""}.<br/>
            ${includeProfessionalCard ? "Incluye copia de la tarjeta profesional con marca de agua de uso exclusivo.<br/>" : ""}
            ${includeJccBackground ? "Incluye antecedentes vigentes ante la Junta Central de Contadores.<br/>" : ""}
            <strong>Validación:</strong> puede verificar la validez escaneando el código QR del PDF o consultando el código ${escapeHtml(verificationCode)} en <a href="${escapeHtml(verificationUrl)}" style="color:#2563eb;text-decoration:none;">${escapeHtml(verificationUrl)}</a>.<br/>
            Si la entidad receptora requiere un formato o vigencia específica, puede responder este mismo correo para validarlo.
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildCustomerCertificationEmailText(detail, includeProfessionalCard, includeJccBackground) {
  const summary = detail.summary || {};
  const certificateData = detail.certificateData || {};
  const profile = getProfessionalProfile();
  const customerName = certificateData.nombre || summary.customerName || "";
  const version = Number(detail.record?.certificateVersion || 0) || 1;
  const verificationCode =
    detail.record?.certificateVerificationCode || buildCertificateVerificationCode(detail.record || {});
  const verificationUrl =
    detail.record?.certificateVerificationUrl || buildCertificateVerificationUrl(detail.record || {});

  return [
    `Hola ${customerName},`,
    "",
    `Adjuntamos la certificación de ingresos correspondiente a su solicitud ${summary.consecutive ? `N° ${summary.consecutive}` : summary.reference || ""}.`,
    version > 1
      ? `Versión corregida ${version}. Esta emisión reemplaza las versiones anteriores del expediente.`
      : "",
    "",
    `Documento principal: Certificación de ingresos firmada por ${profile.accountantName}${profile.professionalCardNumber ? `, T.P. No. ${profile.professionalCardNumber}` : ""}.`,
    includeProfessionalCard ? "Incluye copia de la tarjeta profesional con marca de agua de uso exclusivo." : "",
    includeJccBackground ? "Incluye antecedentes vigentes ante la Junta Central de Contadores." : "",
    `Validación: puede verificar la validez escaneando el código QR del PDF o consultando el código ${verificationCode} en ${verificationUrl}.`,
    "",
    "Si la entidad receptora requiere un formato o vigencia específica, puede responder este mismo correo para validarlo."
  ]
    .filter(Boolean)
    .join("\n");
}

export default async (req) => {
  const headers = buildAdminHeaders();

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  const session = getAdminSessionFromRequest(req);

  if (!session.configured) {
    return new Response(JSON.stringify({ error: "El panel no está configurado." }), {
      status: 500,
      headers
    });
  }

  if (!session.authenticated) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers
    });
  }

  try {
    const body = await req.json();
    const reference = String(body?.reference || "").trim();
    const certificateOverrides =
      body?.certificateOverrides && typeof body.certificateOverrides === "object"
        ? { ...body.certificateOverrides }
        : null;
    const includeProfessionalCard = Boolean(body?.includeProfessionalCard);
    const includeJccBackground = Boolean(body?.includeJccBackground);
    const confirmedReview = Boolean(body?.confirmedReview);
    const correctionReason = String(body?.correctionReason || "").trim();
    const overridePassword = String(body?.overridePassword || "");
    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail =
      process.env.RESEND_FROM_EMAIL || "CONTARAE <notificaciones@send.contarae.com>";
    const replyToBusinessEmail = process.env.RESEND_REPLY_TO || "info@contarae.com";

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia" }), {
        status: 400,
        headers
      });
    }

    if (!resendApiKey) {
      return new Response(JSON.stringify({ error: "RESEND_API_KEY no está configurada." }), {
        status: 500,
        headers
      });
    }

    const result = await getCertificationByReference(reference);
    if (!result.record || !result.detail) {
      return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
        status: 404,
        headers
      });
    }

    if (!confirmedReview) {
      return new Response(JSON.stringify({ error: "Debes confirmar que revisaste el borrador y la documentación soporte." }), {
        status: 400,
        headers
      });
    }

    const currentCertificationStatus = result.detail.summary?.certificationStatus || "";
    const isCorrection = currentCertificationStatus === "enviada";

    if (["rechazada", "pago_no_confirmado"].includes(currentCertificationStatus)) {
      return new Response(JSON.stringify({ error: "Este expediente está cerrado y no permite envío de certificado desde el panel." }), {
        status: 400,
        headers
      });
    }

    if (isCorrection) {
      if (!correctionReason) {
        return new Response(JSON.stringify({ error: "Para emitir una nueva versión corregida debes registrar el motivo del ajuste." }), {
          status: 400,
          headers
        });
      }

      const auth = authenticateAdminCredentials(session.username, overridePassword);
      if (!auth.ok) {
        return new Response(JSON.stringify({ error: "Para emitir una corrección debes desbloquear el expediente con la contraseña del usuario." }), {
          status: 401,
          headers
        });
      }
    }

    const customerEmail = result.detail.contact?.email;
    if (!customerEmail) {
      return new Response(JSON.stringify({ error: "La solicitud no tiene correo electrónico válido." }), {
        status: 400,
        headers
      });
    }

    const professionalConfig = await getProfessionalDocumentsStatus();
    if (includeProfessionalCard && !professionalConfig.documents.professional_card?.available) {
      return new Response(JSON.stringify({ error: "No hay copia de tarjeta profesional cargada en el panel." }), {
        status: 400,
        headers
      });
    }
    if (includeJccBackground && !professionalConfig.documents.jcc_background?.available) {
      return new Response(JSON.stringify({ error: "No hay antecedentes JCC cargados en el panel." }), {
        status: 400,
        headers
      });
    }

    const certificateVersion = getNextCertificateVersion(result.record || {});
    const certificateVerificationCode = buildCertificateVerificationCode({
      ...(result.record || {}),
      certificateVersion,
      certificateVerificationCode: ""
    });
    const certificateVerificationPath = buildCertificateVerificationPath({
      ...(result.record || {}),
      certificateVersion,
      certificateVerificationCode
    });
    const certificateVerificationUrl = buildCertificateVerificationUrl({
      ...(result.record || {}),
      certificateVersion,
      certificateVerificationCode
    });

    const previewRecord = certificateOverrides
      ? {
          ...result.record,
          certificateVersion,
          certificateVerificationCode,
          certificateVerificationPath,
          certificateVerificationUrl,
          certificateCorrectionReason: isCorrection ? correctionReason : "",
          certificateOverrides: {
            ...(result.record?.certificateOverrides || {}),
            ...certificateOverrides
          }
        }
      : {
          ...result.record,
          certificateVersion,
          certificateVerificationCode,
          certificateVerificationPath,
          certificateVerificationUrl,
          certificateCorrectionReason: isCorrection ? correctionReason : ""
        };

    const pdf = await generateCertificationPdf(previewRecord);
    const now = new Date().toISOString();
    const certificateHash = computeCertificateSha256(pdf.bytes);
    const certificateBlobKey = buildIssuedCertificateBlobKey(reference, certificateVersion, pdf.fileName);
    const pdfBuffer = Buffer.from(pdf.bytes);

    await result.store.set(certificateBlobKey, pdfBuffer, {
      metadata: {
        reference,
        version: certificateVersion,
        originalName: pdf.fileName,
        contentType: pdf.contentType,
        size: pdfBuffer.byteLength,
        issuedAt: now,
        hash: certificateHash,
        verificationCode: certificateVerificationCode
      }
    });

    const attachments = [
      {
        filename: pdf.fileName,
        content: pdf.bytes,
        type: pdf.contentType
      }
    ];

    if (includeProfessionalCard) {
      const professionalCard = await getProfessionalDocumentBlob("professional_card");
      if (professionalCard) {
        attachments.push(await buildWatermarkedProfessionalCardAttachment({
          professionalCard,
          customerName:
            result.detail.certificateData?.nombre ||
            result.detail.summary?.customerName ||
            "",
          reference,
          consecutive: result.detail.summary?.consecutive || result.record?.consecutive || "",
          verificationUrl: certificateVerificationUrl,
          verificationCode: certificateVerificationCode
        }));
      }
    }

    if (includeJccBackground) {
      const jccBackground = await getProfessionalDocumentBlob("jcc_background");
      if (jccBackground) {
        attachments.push({
          filename: jccBackground.meta.fileName,
          content: jccBackground.data,
          type: jccBackground.meta.contentType
        });
      }
    }

    const detailForEmail = {
      ...result.detail,
      record: {
        ...(result.record || {}),
        certificateVersion,
        certificateHash,
        certificateVerificationCode,
        certificateVerificationPath,
        certificateVerificationUrl
      }
    };

    const emailSubject = `${isCorrection ? "CONTARAE | Certificación de ingresos corregida" : "CONTARAE | Certificación de ingresos"} ${result.detail.summary.consecutive ? `N° ${result.detail.summary.consecutive}` : reference}${certificateVersion > 1 ? ` · Versión ${certificateVersion}` : ""}`;
    const emailResult = await sendResendEmail({
      apiKey: resendApiKey,
      from: resendFromEmail,
      to: customerEmail,
      subject: emailSubject,
      html: buildCustomerCertificationEmailHtml(detailForEmail, includeProfessionalCard, includeJccBackground),
      text: buildCustomerCertificationEmailText(detailForEmail, includeProfessionalCard, includeJccBackground),
      replyTo: replyToBusinessEmail,
      idempotencyKey: `${reference}:certificate-v${certificateVersion}`,
      attachments
    });

    const previousIssuedCertificates = normalizeIssuedCertificates(result.record || {}).map((certificate) => ({
      ...certificate,
      status: certificate.status === "vigente" || !certificate.status ? "reemplazada" : certificate.status,
      replacedAt: certificate.status === "vigente" || !certificate.status ? now : certificate.replacedAt || "",
      replacedBy: certificate.status === "vigente" || !certificate.status ? session.username : certificate.replacedBy || "",
      replacementReason: certificate.status === "vigente" || !certificate.status ? correctionReason : certificate.replacementReason || ""
    }));
    const issuedCertificates = [
      ...previousIssuedCertificates,
      {
        id: `v${certificateVersion}-${Date.now()}`,
        version: certificateVersion,
        status: "vigente",
        issuedAt: now,
        sentAt: now,
        sentBy: session.username,
        emailId: emailResult.id || "",
        fileName: pdf.fileName,
        blobKey: certificateBlobKey,
        contentType: pdf.contentType,
        size: pdfBuffer.byteLength,
        hash: certificateHash,
        verificationCode: certificateVerificationCode,
        verificationPath: certificateVerificationPath,
        verificationUrl: certificateVerificationUrl,
        includeProfessionalCard,
        includeJccBackground,
        correctionReason: isCorrection ? correctionReason : ""
      }
    ];

    const updated = await mergeCertificationRecordUpdates(reference, {
      ...(certificateOverrides ? { certificateOverrides } : {}),
      certificationStatus: "enviada",
      sentToClientAt: now,
      sentToClientBy: session.username,
      sentCertificationEmailId: emailResult.id || "",
      sentCertificationAttachments: {
        professionalCard: includeProfessionalCard,
        jccBackground: includeJccBackground
      },
      issuedCertificates,
      certificateVersion,
      certificateHash,
      certificateVerificationCode,
      certificateVerificationPath,
      certificateVerificationUrl,
      certificateCorrectionReason: isCorrection ? correctionReason : "",
      certificateIssuedAt: now,
      certificateFileName: pdf.fileName,
      updatedAt: now,
      lastReviewedAt: now,
      lastReviewedBy: session.username
    });

    return new Response(
      JSON.stringify({
        ok: true,
        detail: updated.detail
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible enviar la certificación al cliente.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
