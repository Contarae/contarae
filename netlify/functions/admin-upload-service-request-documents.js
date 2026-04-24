import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { uploadServiceRequestDocuments } from "./utils/service-requests.js";
import { normalizeReference } from "./utils/certification-supports.js";

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
    const body = await req.formData();
    const reference = normalizeReference(body.get("reference"));
    const files = body.getAll("files").filter((file) => typeof file?.arrayBuffer === "function");

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia" }), {
        status: 400,
        headers
      });
    }

    const result = await uploadServiceRequestDocuments(reference, files, session.username);

    return new Response(
      JSON.stringify({
        ok: true,
        ...result
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible cargar los documentos de la solicitud.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
