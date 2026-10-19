import requestSecurity from "./request-security.cjs";
import corsUtils from "./cors.cjs";

// Preserve the payment handlers' event contract while exposing Netlify's v2 config.
export function boundedEventHandler(handler, maxBytes) {
  return async req => {
    const event = { httpMethod: req.method, headers: Object.fromEntries(req.headers) };
    try {
      if (req.method === "POST") {
        event.body = JSON.stringify(await requestSecurity.readJsonBody(req, maxBytes));
      }
      const result = await handler(event);
      return new Response(result.body, { status: result.statusCode, headers: result.headers });
    } catch (error) {
      return new Response(JSON.stringify({ error: error.status ? error.message : "No fue posible procesar la solicitud." }), {
        status: error.status || 500,
        headers: corsUtils.buildCorsHeaders(event, { "Content-Type": "application/json", "Cache-Control": "no-store" })
      });
    }
  };
}
