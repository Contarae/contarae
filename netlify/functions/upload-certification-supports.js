import { getStore } from "@netlify/blobs";
import {
  normalizeReference,
  uploadIncomingSupportFiles
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

    const store = getStore("certification-requests");
    const supportFiles = await uploadIncomingSupportFiles(store, reference, files);

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
