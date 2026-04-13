import { getStore } from "@netlify/blobs";
import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { appendSupportFilesToCertification, getCertificationByReference } from "./utils/certification-admin.js";
import { normalizeReference, uploadIncomingSupportFiles } from "./utils/certification-supports.js";

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
    const body = await req.formData();
    const reference = normalizeReference(body.get("reference"));
    const files = body.getAll("files").filter((file) => typeof file?.arrayBuffer === "function");

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia" }), {
        status: 400,
        headers
      });
    }

    const existing = await getCertificationByReference(reference);
    if (!existing.record) {
      return new Response(JSON.stringify({ error: "Solicitud no encontrada" }), {
        status: 404,
        headers
      });
    }

    if (!files.length) {
      return new Response(JSON.stringify({ error: "No seleccionaste archivos para cargar." }), {
        status: 400,
        headers
      });
    }

    const store = getStore("certification-requests");
    const supportFiles = await uploadIncomingSupportFiles(store, reference, files);
    const updated = await appendSupportFilesToCertification(reference, supportFiles, session.username);

    return new Response(
      JSON.stringify({
        ok: true,
        detail: updated.detail,
        uploadedCount: supportFiles.length
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible cargar los soportes desde el panel.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
