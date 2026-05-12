import { getStore } from "@netlify/blobs";
import { getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { normalizeReference, sanitizeFileName } from "./utils/certification-supports.js";

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

    if (!reference || !key) {
      return new Response("Faltan parámetros para descargar el certificado.", {
        status: 400,
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }

    if (!key.startsWith(`issued/${reference}/`)) {
      return new Response("Ruta de certificado inválida.", {
        status: 400,
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }

    const store = getStore("certification-requests");
    const blob = await store.getWithMetadata(key, { type: "arrayBuffer" });

    if (!blob) {
      return new Response("Certificado no encontrado.", {
        status: 404,
        headers: {
          "Cache-Control": "no-store"
        }
      });
    }

    const contentType = String(blob.metadata?.contentType || "application/pdf");
    const fileName = sanitizeFileName(String(blob.metadata?.originalName || key.split("/").pop() || "certificado.pdf"));

    return new Response(blob.data, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${fileName}"`
      }
    });
  } catch (error) {
    return new Response(`No fue posible descargar el certificado. ${error.message}`, {
      status: 500,
      headers: {
        "Cache-Control": "no-store"
      }
    });
  }
};
