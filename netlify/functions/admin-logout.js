import { buildAdminHeaders, buildAdminLogoutCookie } from "./utils/admin-auth.js";

export default async (req) => {
  const headers = buildAdminHeaders();

  if (req.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405,
      headers
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      ...headers,
      "Set-Cookie": buildAdminLogoutCookie(req)
    }
  });
};
