import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { getProfessionalDocumentsStatus, uploadProfessionalDocument } from "./utils/professional-documents.js";

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
    const formData = await req.formData();
    const type = String(formData.get("type") || "").trim();
    const file = formData.get("file");

    await uploadProfessionalDocument({
      type,
      file,
      actor: session.username
    });

    const status = await getProfessionalDocumentsStatus();

    return new Response(
      JSON.stringify({
        ok: true,
        professionalConfig: status
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible actualizar el documento profesional.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
