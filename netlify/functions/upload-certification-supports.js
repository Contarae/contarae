import { getStore } from "@netlify/blobs";
import {
  MAX_SUPPORT_FILES,
  MAX_SUPPORT_FILE_SIZE,
  buildSupportBlobKey,
  buildSupportRecord,
  formatBytes,
  isAllowedSupportContentType,
  normalizeReference
} from "./utils/certification-supports.js";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Content-Type": "application/json"
};

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  try {
    const formData = await req.formData();
    const reference = normalizeReference(formData.get("reference"));
    const files = formData.getAll("files").filter((file) => typeof file?.arrayBuffer === "function");

    if (!reference) {
      return new Response(JSON.stringify({ error: "Falta la referencia de la solicitud." }), {
        status: 400,
        headers
      });
    }

    if (!files.length) {
      return new Response(
        JSON.stringify({
          ok: true,
          reference,
          supportFiles: []
        }),
        {
          status: 200,
          headers
        }
      );
    }

    if (files.length > MAX_SUPPORT_FILES) {
      return new Response(
        JSON.stringify({
          error: `Solo puedes adjuntar hasta ${MAX_SUPPORT_FILES} archivos por solicitud.`
        }),
        {
          status: 400,
          headers
        }
      );
    }

    const store = getStore("certification-requests");
    const supportFiles = [];

    for (const file of files) {
      const contentType = String(file.type || "").trim().toLowerCase();

      if (!isAllowedSupportContentType(contentType, file.name)) {
        return new Response(
          JSON.stringify({
            error: `El archivo "${file.name}" no tiene un formato permitido. Usa PDF, JPG, PNG, WEBP, HEIC, DOC o DOCX.`
          }),
          {
            status: 400,
            headers
          }
        );
      }

      if (Number(file.size || 0) > MAX_SUPPORT_FILE_SIZE) {
        return new Response(
          JSON.stringify({
            error: `El archivo "${file.name}" supera el límite de ${formatBytes(MAX_SUPPORT_FILE_SIZE)}.`
          }),
          {
            status: 400,
            headers
          }
        );
      }

      const blobKey = buildSupportBlobKey(reference, file.name);
      const uploadedAt = new Date().toISOString();

      await store.set(blobKey, await file.arrayBuffer(), {
        metadata: {
          reference,
          originalName: file.name,
          contentType,
          size: Number(file.size || 0),
          uploadedAt
        }
      });

      supportFiles.push(
        buildSupportRecord({
          reference,
          blobKey,
          originalName: file.name,
          contentType,
          size: file.size,
          uploadedAt
        })
      );
    }

    return new Response(
      JSON.stringify({
        ok: true,
        reference,
        supportFiles
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible cargar los soportes.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
