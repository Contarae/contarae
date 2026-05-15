import { buildClientPortalHeaders, getClientPortalSessionFromRequest } from "./utils/client-portal-auth.js";

export default async (req) => {
  const headers = buildClientPortalHeaders();

  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ error: "Metodo no permitido" }), { status: 405, headers });
  }

  const session = getClientPortalSessionFromRequest(req);
  return new Response(
    JSON.stringify({
      ok: true,
      configured: session.configured,
      authenticated: session.authenticated,
      username: session.username,
      companyId: session.companyId,
      companyName: session.companyName,
      mustChangePassword: Boolean(session.mustChangePassword),
      impersonatedBy: session.impersonatedBy || "",
      role: session.role || "client",
      expiresAt: session.expiresAt
    }),
    { status: 200, headers }
  );
};
