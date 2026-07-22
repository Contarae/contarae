import corsUtils from "./utils/cors.cjs";

const { buildCorsHeaders } = corsUtils;

export default async (req) => {
  const headers = buildCorsHeaders(req, {
    "Content-Type": "application/json"
  });

  if (req.method === "OPTIONS") {
    return new Response("", {
      status: 200,
      headers
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Método no permitido" }),
      {
        status: 405,
        headers
      }
    );
  }

  return new Response(
    JSON.stringify({
      ok: false,
      disabled: true,
      error: "La aprobación manual está desactivada. Las certificaciones solo se aprueban mediante webhook firmado de Wompi."
    }),
    {
      status: 403,
      headers
    }
  );
};
