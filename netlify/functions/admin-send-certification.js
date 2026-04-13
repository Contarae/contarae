import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { getCertificationByReference, mergeCertificationRecordUpdates } from "./utils/certification-admin.js";
import { generateCertificationPdf } from "./utils/certification-pdf.js";
import {
  getProfessionalDocumentBlob,
  getProfessionalDocumentsStatus,
  getProfessionalProfile
} from "./utils/professional-documents.js";
import { sendResendEmail } from "./utils/resend-email.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function buildSendPhrase(detail) {
  return `ENVIAR ${detail?.summary?.reference || ""}`.trim();
}

function buildCustomerCertificationEmailHtml(detail, includeProfessionalCard, includeJccBackground) {
  const summary = detail.summary || {};
  const profile = getProfessionalProfile();

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
            Hola ${escapeHtml(summary.customerName || "")}, adjuntamos la certificación de ingresos correspondiente a su solicitud ${summary.consecutive ? `N° ${escapeHtml(summary.consecutive)}` : escapeHtml(summary.reference || "")}.
          </p>
          <div style="padding:16px 18px;border-radius:14px;background:#f8fbff;border:1px solid #dbe5f1;color:#334155;line-height:1.8;">
            <strong>Documento principal adjunto:</strong> Certificación de ingresos firmada por ${escapeHtml(profile.accountantName)}${profile.professionalCardNumber ? `, T.P. No. ${escapeHtml(profile.professionalCardNumber)}` : ""}.<br/>
            ${includeProfessionalCard ? "Incluye copia de la tarjeta profesional.<br/>" : ""}
            ${includeJccBackground ? "Incluye antecedentes vigentes ante la Junta Central de Contadores.<br/>" : ""}
            Si la entidad receptora requiere un formato o vigencia específica, puede responder este mismo correo para validarlo.
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildCustomerCertificationEmailText(detail, includeProfessionalCard, includeJccBackground) {
  const summary = detail.summary || {};
  const profile = getProfessionalProfile();

  return [
    `Hola ${summary.customerName || ""},`,
    "",
    `Adjuntamos la certificación de ingresos correspondiente a su solicitud ${summary.consecutive ? `N° ${summary.consecutive}` : summary.reference || ""}.`,
    "",
    `Documento principal: Certificación de ingresos firmada por ${profile.accountantName}${profile.professionalCardNumber ? `, T.P. No. ${profile.professionalCardNumber}` : ""}.`,
    includeProfessionalCard ? "Incluye copia de la tarjeta profesional." : "",
    includeJccBackground ? "Incluye antecedentes vigentes ante la Junta Central de Contadores." : "",
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
    const includeProfessionalCard = Boolean(body?.includeProfessionalCard);
    const includeJccBackground = Boolean(body?.includeJccBackground);
    const confirmedPhrase = String(body?.confirmedPhrase || "").trim().toUpperCase();
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

    const expectedPhrase = buildSendPhrase(result.detail).toUpperCase();
    if (confirmedPhrase !== expectedPhrase) {
      return new Response(
        JSON.stringify({
          error: `Debes confirmar escribiendo exactamente: ${expectedPhrase}`
        }),
        {
          status: 400,
          headers
        }
      );
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

    const pdf = await generateCertificationPdf(result.record);
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
        attachments.push({
          filename: professionalCard.meta.fileName,
          content: professionalCard.data,
          type: professionalCard.meta.contentType
        });
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

    const emailResult = await sendResendEmail({
      apiKey: resendApiKey,
      from: resendFromEmail,
      to: customerEmail,
      subject: `CONTARAE | Certificación de ingresos ${result.detail.summary.consecutive ? `N° ${result.detail.summary.consecutive}` : reference}`,
      html: buildCustomerCertificationEmailHtml(result.detail, includeProfessionalCard, includeJccBackground),
      text: buildCustomerCertificationEmailText(result.detail, includeProfessionalCard, includeJccBackground),
      replyTo: replyToBusinessEmail,
      idempotencyKey: `${reference}:final-certificate`,
      attachments
    });

    const updated = await mergeCertificationRecordUpdates(reference, {
      certificationStatus: "enviada",
      sentToClientAt: new Date().toISOString(),
      sentToClientBy: session.username,
      sentCertificationEmailId: emailResult.id || "",
      sentCertificationAttachments: {
        professionalCard: includeProfessionalCard,
        jccBackground: includeJccBackground
      },
      updatedAt: new Date().toISOString(),
      lastReviewedAt: new Date().toISOString(),
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
