import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";

export default async (req) => {
  const headers = buildAdminHeaders();

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  const session = getAdminSessionFromRequest(req);

  return new Response(
    JSON.stringify({
      ok: true,
      configured: session.configured,
      authenticated: session.authenticated,
      username: session.username,
      expiresAt: session.expiresAt
    }),
    {
      status: 200,
      headers
    }
  );
};
