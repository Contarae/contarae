import {
  buildCertificateData,
  getCertificationByReference,
  listAllCertifications
} from "./utils/certification-admin.js";
import {
  buildCertificateVerificationCode,
  buildCertificateVerificationUrl,
  formatCertificateHash,
  matchesCertificateVerificationCode
} from "./utils/certificate-verification.js";

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8"
    }
  });
}

function normalizeLookup(value = "") {
  return String(value || "").trim();
}

function formatDigitGroups(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (!digits) return String(value || "").trim();
  return new Intl.NumberFormat("es-CO", {
    maximumFractionDigits: 0
  }).format(Number(digits));
}

function formatDocumentLabel(certificateData = {}) {
  const type = String(certificateData.tipo_documento || "").trim();
  const number = formatDigitGroups(certificateData.numero_documento || "");
  const expeditionPlace = String(certificateData.lugar_expedicion || "").trim();
  const doc = [type, number].filter(Boolean).join(" ");
  return expeditionPlace ? `${doc} · Expedida en ${expeditionPlace}` : doc;
}

function formatCertificateStatus(status = "") {
  const normalized = String(status || "").trim();
  if (normalized === "enviada") {
    return {
      code: normalized,
      label: "Vigente",
      tone: "success",
      description: "El certificado fue emitido y se encuentra vigente en el sistema de CONTARAE."
    };
  }

  if (normalized === "documentos_solicitados") {
    return {
      code: normalized,
      label: "Pendiente de documentos",
      tone: "warning",
      description: "La solicitud sigue activa, pero está a la espera de documentación adicional para completar la revisión."
    };
  }

  if (normalized === "rechazada") {
    return {
      code: normalized,
      label: "Rechazada",
      tone: "danger",
      description: "La solicitud fue cerrada sin emisión de certificado válido."
    };
  }

  if (normalized === "pago_no_confirmado") {
    return {
      code: normalized,
      label: "Pago no confirmado",
      tone: "danger",
      description: "No existe un certificado válido emitido para esta solicitud porque el pago no fue confirmado."
    };
  }

  return {
    code: normalized || "en_revision",
    label: "En revisión",
    tone: "info",
    description: "La solicitud existe, pero el certificado aún no ha sido emitido al cliente."
  };
}

function buildPublicPayload(detail) {
  const summary = detail.summary || {};
  const certificateData = buildCertificateData(detail.record || {});
  const verificationCode = buildCertificateVerificationCode(detail.record || {});
  const status = formatCertificateStatus(summary.certificationStatus);

  return {
    found: true,
    valid: status.code === "enviada",
    status,
    certificate: {
      reference: summary.reference || "",
      consecutive: summary.consecutive || "",
      version: Number(detail.record?.certificateVersion || 0) || null,
      verificationCode,
      verificationUrl: buildCertificateVerificationUrl(detail.record || {}),
      issuedAt:
        detail.record?.certificateIssuedAt ||
        detail.record?.sentToClientAt ||
        summary.customerNotificationSentAt ||
        "",
      holderName: certificateData.nombre || summary.customerName || "",
      holderDocument: formatDocumentLabel(certificateData),
      destination: [certificateData.destino, certificateData.entidad].filter(Boolean).join(" - "),
      period: certificateData.periodo || summary.period || "",
      totalMonthlyIncome: certificateData.total_ingresos || summary.totalIncome || "",
      hashSha256: detail.record?.certificateHash || "",
      hashDisplay: formatCertificateHash(detail.record?.certificateHash || "")
    }
  };
}

async function getCertificationByCode(code) {
  const certifications = await listAllCertifications();
  const match = certifications.find((item) =>
    matchesCertificateVerificationCode(item, code)
  );

  if (!match?.reference) return null;
  return getCertificationByReference(match.reference);
}

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers: { "Cache-Control": "no-store" } });
  }

  if (req.method !== "GET") {
    return jsonResponse({ error: "Método no permitido" }, 405);
  }

  try {
    const url = new URL(req.url);
    const reference = normalizeLookup(url.searchParams.get("reference"));
    const code = normalizeLookup(url.searchParams.get("code"));
    const q = normalizeLookup(url.searchParams.get("q"));

    const normalizedQuery = q.toUpperCase();
    const lookupReference = reference || (!normalizedQuery.startsWith("CTR-") ? q : "");
    const lookupCode = code || (normalizedQuery.startsWith("CTR-") ? normalizedQuery : "");

    if (!lookupReference && !lookupCode) {
      return jsonResponse({
        found: false,
        valid: false,
        status: {
          code: "sin_consulta",
          label: "Sin consulta",
          tone: "neutral",
          description: "Ingresa una referencia o un código de validación para consultar este certificado."
        }
      });
    }

    const result = lookupReference
      ? await getCertificationByReference(lookupReference)
      : await getCertificationByCode(lookupCode);

    if (!result?.record || !result?.detail) {
      return jsonResponse({
        found: false,
        valid: false,
        status: {
          code: "no_encontrado",
          label: "No encontrado",
          tone: "danger",
          description: "No se encontró un certificado asociado a los datos suministrados."
        }
      });
    }

    if (lookupCode && !matchesCertificateVerificationCode(result.record, lookupCode)) {
      return jsonResponse({
        ...buildPublicPayload(result.detail),
        valid: false,
        lookupMismatch: true,
        status: {
          code: "codigo_no_coincide",
          label: "Código no coincide",
          tone: "danger",
          description: "La referencia existe, pero el código de validación no coincide con el certificado oficial emitido."
        }
      });
    }

    return jsonResponse(buildPublicPayload(result.detail));
  } catch (error) {
    return jsonResponse(
      {
        error: "No fue posible validar el certificado.",
        detail: error.message
      },
      500
    );
  }
};
