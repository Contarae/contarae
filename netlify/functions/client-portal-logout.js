import { buildClientPortalHeaders, buildClientPortalLogoutCookie } from "./utils/client-portal-auth.js";

export default async (req) => {
  const headers = buildClientPortalHeaders();

  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo no permitido" }), { status: 405, headers });
  }

  return new Response(
    JSON.stringify({ ok: true }),
    {
      status: 200,
      headers: {
        ...headers,
        "Set-Cookie": buildClientPortalLogoutCookie(req)
      }
    }
  );
};
