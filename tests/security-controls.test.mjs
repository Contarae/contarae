import assert from "node:assert/strict";
import test from "node:test";
import {
  hasExpectedFileSignature,
  isAllowedSupportContentType,
  sanitizeFileName
} from "../netlify/functions/utils/certification-supports.js";
import requestSecurity from "../netlify/functions/utils/request-security.cjs";
import { createAdminSession, verifyAdminSession } from "../netlify/functions/utils/admin-auth.js";

const { assertContentLength, assertNoHoneypot } = requestSecurity;

test("honeypot rejects automated public form payloads", () => {
  assert.throws(
    () => assertNoHoneypot({ name: "Cliente", website: "https://spam.example" }),
    /No fue posible procesar/
  );
});

test("content length guard rejects oversized public payloads", () => {
  const req = new Request("https://contarae.com/api/submit-client-lead", {
    headers: { "content-length": "40000" }
  });
  assert.throws(
    () => assertContentLength(req, 32 * 1024),
    (error) => error.status === 413
  );
});

test("support files require allowed types and matching signatures", () => {
  assert.equal(isAllowedSupportContentType("application/pdf", "soporte.pdf"), true);
  assert.equal(hasExpectedFileSignature(new Uint8Array([0x25, 0x50, 0x44, 0x46]), "application/pdf", "soporte.pdf"), true);
  assert.equal(hasExpectedFileSignature(new Uint8Array([0x4d, 0x5a, 0x90, 0x00]), "application/pdf", "soporte.pdf"), false);
  assert.equal(sanitizeFileName("soporte<script>.pdf"), "soportescript.pdf");
});

test("admin sessions remain signed and expire", () => {
  const token = createAdminSession("admin", "secret", 1);
  const payload = verifyAdminSession(token, "secret");
  assert.equal(payload.u, "admin");
  assert.equal(verifyAdminSession(token, "other-secret"), null);
});
