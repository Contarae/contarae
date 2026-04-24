import { getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { getCertificationByReference } from "./utils/certification-admin.js";
import { generateCertificationPdf } from "./utils/certification-pdf.js";

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  }

  if (req.method !== "GET") {
    return new Response("Método no permitido", {
      status: 405,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  }

  const session = getAdminSessionFromRequest(req);

  if (!session.configured) {
    return new Response("El panel no está configurado.", {
      status: 500,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  }

  if (!session.authenticated) {
    return new Response("No autorizado", {
      status: 401,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  }

  try {
    const url = new URL(req.url);
    const reference = String(url.searchParams.get("reference") || "").trim();

    if (!reference) {
      return new Response("Falta la referencia.", {
        status: 400,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0"
        }
      });
    }

    const result = await getCertificationByReference(reference);
    if (!result.record) {
      return new Response("Solicitud no encontrada.", {
        status: 404,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0"
        }
      });
    }

    const pdf = await generateCertificationPdf(result.record);

    return new Response(pdf.bytes, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0",
        "Content-Type": pdf.contentType,
        "Content-Disposition": `inline; filename="${pdf.fileName}"`
      }
    });
  } catch (error) {
    return new Response(`No fue posible generar el PDF. ${error.message}`, {
      status: 500,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, private",
        Pragma: "no-cache",
        Expires: "0"
      }
    });
  }
};
