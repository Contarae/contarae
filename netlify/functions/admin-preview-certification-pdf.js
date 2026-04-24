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

  if (!["GET", "POST"].includes(req.method)) {
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
    const body = req.method === "POST" ? await req.json() : null;
    const reference = String(
      req.method === "POST" ? body?.reference || "" : url.searchParams.get("reference") || ""
    ).trim();
    const certificateOverrides =
      req.method === "POST" && body?.certificateOverrides && typeof body.certificateOverrides === "object"
        ? { ...body.certificateOverrides }
        : null;

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

    const previewRecord = certificateOverrides
      ? {
          ...result.record,
          certificateOverrides: {
            ...(result.record?.certificateOverrides || {}),
            ...certificateOverrides
          }
        }
      : result.record;

    const pdf = await generateCertificationPdf(previewRecord);

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
