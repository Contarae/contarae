import crypto from "crypto";

const VERIFY_ROUTE = "/verificar-certificado";

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getPublicSiteBaseUrl() {
  return (
    normalizeBaseUrl(process.env.PUBLIC_SITE_URL) ||
    normalizeBaseUrl(process.env.URL) ||
    normalizeBaseUrl(process.env.DEPLOY_URL) ||
    "https://contarae.com"
  );
}

export function getCertificateVerifyRoute() {
  return VERIFY_ROUTE;
}

export function buildCertificateVerificationCode(record = {}) {
  const reference = String(record.reference || "").trim().toUpperCase();
  const referenceToken = reference.split("-").pop() || reference.slice(-5) || "CONT";
  const consecutiveToken = String(record.consecutive || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(-6);

  return consecutiveToken
    ? `CTR-${consecutiveToken}-${referenceToken.slice(-5)}`
    : `CTR-${referenceToken.slice(-5)}`;
}

export function buildCertificateVerificationPath(record = {}) {
  const reference = String(record.reference || "").trim();
  const code = buildCertificateVerificationCode(record);
  const query = new URLSearchParams();
  if (reference) query.set("reference", reference);
  if (code) query.set("code", code);
  return `${VERIFY_ROUTE}?${query.toString()}`;
}

export function buildCertificateVerificationUrl(record = {}) {
  return new URL(buildCertificateVerificationPath(record), `${getPublicSiteBaseUrl()}/`).toString();
}

export function buildCertificateVerificationDisplayUrl() {
  return `${getPublicSiteBaseUrl().replace(/^https?:\/\//i, "")}${VERIFY_ROUTE}`;
}

export function computeCertificateSha256(bytes) {
  return crypto.createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

export function formatCertificateHash(hash = "") {
  const raw = String(hash || "").trim().toUpperCase();
  if (!raw) return "";
  return raw.match(/.{1,4}/g)?.join(" ") || raw;
}

export function matchesCertificateVerificationCode(record = {}, code = "") {
  return buildCertificateVerificationCode(record) === String(code || "").trim().toUpperCase();
}
