import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { updateCertificationRecord } from "./utils/certification-admin.js";

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
    return new Response(
      JSON.stringify({ error: "El panel no está configurado." }),
      {
        status: 500,
        headers
      }
    );
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

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia" }), {
        status: 400,
        headers
      });
    }

    const updated = await updateCertificationRecord(
      reference,
      {
        certificationStatus: body?.certificationStatus,
        adminNotes: body?.adminNotes,
        requestedDocumentsMessage: body?.requestedDocumentsMessage,
        certificateOverrides: body?.certificateOverrides,
        overridePassword: body?.overridePassword,
        action: body?.action,
        contactChannel: body?.contactChannel
      },
      session.username
    );

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
        error: "No fue posible actualizar la solicitud",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
