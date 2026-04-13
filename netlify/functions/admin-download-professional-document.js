import { getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { getProfessionalDocumentBlob } from "./utils/professional-documents.js";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers: { "Cache-Control": "no-store" }
    });
  }

  if (req.method !== "GET") {
    return new Response("Método no permitido", {
      status: 405,
      headers: { "Cache-Control": "no-store" }
    });
  }

  const session = getAdminSessionFromRequest(req);

  if (!session.configured) {
    return new Response("El panel no está configurado.", {
      status: 500,
      headers: { "Cache-Control": "no-store" }
    });
  }

  if (!session.authenticated) {
    return new Response("No autorizado", {
      status: 401,
      headers: { "Cache-Control": "no-store" }
    });
  }

  try {
    const url = new URL(req.url);
    const type = String(url.searchParams.get("type") || "").trim();
    const blob = await getProfessionalDocumentBlob(type);

    if (!blob) {
      return new Response("Documento profesional no encontrado.", {
        status: 404,
        headers: { "Cache-Control": "no-store" }
      });
    }

    return new Response(blob.data, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store",
        "Content-Type": String(blob.meta.contentType || "application/octet-stream"),
        "Content-Disposition": `inline; filename="${blob.meta.fileName || "documento-profesional"}"`
      }
    });
  } catch (error) {
    return new Response(`No fue posible descargar el documento profesional. ${error.message}`, {
      status: 500,
      headers: { "Cache-Control": "no-store" }
    });
  }
};
