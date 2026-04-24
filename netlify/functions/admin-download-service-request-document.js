import { getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { getServiceRequestDocument } from "./utils/service-requests.js";
import { normalizeReference } from "./utils/certification-supports.js";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  if (req.method !== "GET") {
    return new Response("Método no permitido", {
      status: 405,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  const session = getAdminSessionFromRequest(req);

  if (!session.configured) {
    return new Response("El panel no está configurado.", {
      status: 500,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  if (!session.authenticated) {
    return new Response("No autorizado", {
      status: 401,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }

  try {
    const url = new URL(req.url);
    const reference = normalizeReference(url.searchParams.get("reference"));
    const key = String(url.searchParams.get("key") || "");
    const document = await getServiceRequestDocument(reference, key);

    if (!document) {
      return new Response("Documento no encontrado.", {
        status: 404,
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }

    return new Response(document.data, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": document.metadata.contentType,
        "Content-Disposition": `inline; filename="${document.metadata.originalName}"`
      }
    });
  } catch (error) {
    return new Response(`No fue posible descargar el documento. ${error.message}`, {
      status: 500,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }
};
