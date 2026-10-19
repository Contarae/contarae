import { saveClientLead } from "./utils/client-leads.js";
import corsUtils from "./utils/cors.cjs";
import requestSecurity from "./utils/request-security.cjs";

const { buildCorsHeaders } = corsUtils;
const { readJsonBody, assertNoHoneypot } = requestSecurity;
const MAX_LEAD_PAYLOAD_BYTES = 32 * 1024;

export default async (req) => {
  const headers = buildCorsHeaders(req, {
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
    "Cache-Control": "no-store"
  });

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  try {
    const body = await readJsonBody(req, MAX_LEAD_PAYLOAD_BYTES);
    assertNoHoneypot(body);
    const url = new URL(req.url);
    const lead = await saveClientLead(body, {
      sourcePath: body?.sourcePath || url.pathname,
      sourceLabel: "Formulario web",
      userAgent: req.headers.get("user-agent") || "",
      ip:
        req.headers.get("x-nf-client-connection-ip") ||
        req.headers.get("client-ip") ||
        req.headers.get("x-forwarded-for") ||
        ""
    });

    return new Response(
      JSON.stringify({
        ok: true,
        lead: {
          id: lead.id,
          createdAt: lead.createdAt
        }
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.status === 400 ? error.message : "No fue posible registrar tus datos"
      }),
      { status: error.status || 400, headers }
    );
  }
};

export const config = {
  path: ["/api/submit-client-lead", "/.netlify/functions/submit-client-lead"],
  rateLimit: {
    windowLimit: 30,
    windowSize: 60,
    aggregateBy: ["ip", "domain"]
  }
};
