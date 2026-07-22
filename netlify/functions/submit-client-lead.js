import { saveClientLead } from "./utils/client-leads.js";
import corsUtils from "./utils/cors.cjs";

const { buildCorsHeaders } = corsUtils;

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
    const body = await req.json();
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
        error: "No fue posible registrar tus datos",
        detail: error.message
      }),
      {
        status: 400,
        headers
      }
    );
  }
};
