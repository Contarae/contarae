import assert from "node:assert/strict";
import test from "node:test";
import {
  hasExpectedFileSignature,
  isAllowedSupportContentType,
  sanitizeFileName
} from "../netlify/functions/utils/certification-supports.js";
import requestSecurity from "../netlify/functions/utils/request-security.cjs";
import { createAdminSession, verifyAdminSession } from "../netlify/functions/utils/admin-auth.js";

const { assertContentLength, assertNoHoneypot, readJsonBody, readEventJsonBody } = requestSecurity;

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
  assert.equal(verifyAdminSession(createAdminSession("admin", "secret", -1), "secret"), null);
});

test("actual bytes are limited without Content-Length and with a misleading header", async () => {
  for (const headers of [{}, { 'content-length': '1' }]) {
    const req = new Request('https://example.test', { method: 'POST', headers, body: JSON.stringify({ nombre: 'á'.repeat(50) }) });
    await assert.rejects(readJsonBody(req, 80), error => error.status === 413);
  }
});

test("streaming requests stop reading at the byte limit", async () => {
  let cancelled = false;
  const body = new ReadableStream({ pull(controller) { controller.enqueue(new Uint8Array(50)); }, cancel() { cancelled = true; } });
  const req = new Request('https://example.test', { method: 'POST', body, duplex: 'half' });
  await assert.rejects(readJsonBody(req, 60), error => error.status === 413);
  assert.equal(cancelled, true);
});

test("JSON readers accept UTF-8 and base64 and reject malformed inputs", async () => {
  const text = JSON.stringify({ nombre: 'María', company_website: '' });
  assert.deepEqual(await readJsonBody(new Request('https://example.test', { method: 'POST', body: text })), JSON.parse(text));
  assert.deepEqual(readEventJsonBody({ body: Buffer.from(text).toString('base64'), isBase64Encoded: true }), JSON.parse(text));
  assert.throws(() => readEventJsonBody({ body: text }, 2), error => error.status === 413);
  for (const body of ['null', '[]', '{invalid']) assert.throws(() => readEventJsonBody({ body }), error => error.status === 400);
});
