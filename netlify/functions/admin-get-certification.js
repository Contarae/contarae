import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { getCertificationByReference } from "./utils/certification-admin.js";
import { getProfessionalDocumentsStatus } from "./utils/professional-documents.js";

export default async (req) => {
  const headers = buildAdminHeaders();

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "GET") {
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
    const url = new URL(req.url);
    const reference = String(url.searchParams.get("reference") || "").trim();

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia" }), {
        status: 400,
        headers
      });
    }

    const result = await getCertificationByReference(reference);

    if (!result.record) {
      return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
        status: 404,
        headers
      });
    }

    const professionalConfig = await getProfessionalDocumentsStatus();

    return new Response(
      JSON.stringify({
        ok: true,
        detail: result.detail,
        professionalConfig
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible consultar la solicitud",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
