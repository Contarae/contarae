import {
  authenticateAdminCredentials,
  buildAdminHeaders,
  getAdminSessionFromRequest
} from "./utils/admin-auth.js";
import {
  buildClientPortalSessionCookie,
  createClientPortalSession,
  getClientPortalConfig
} from "./utils/client-portal-auth.js";
import { getClientPortalUser, recordClientPortalImpersonation } from "./utils/client-portal-users.js";

export default async (req) => {
  const headers = buildAdminHeaders();
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Método no permitido" }), { status: 405, headers });

  const session = getAdminSessionFromRequest(req);
  if (!session.configured) return new Response(JSON.stringify({ error: "El panel no está configurado." }), { status: 500, headers });
  if (!session.authenticated) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers });

  try {
    const body = await req.json();
    const adminPassword = String(body?.adminPassword || "");
    const reason = String(body?.reason || "").trim();
    const auth = authenticateAdminCredentials(session.username, adminPassword);
    if (!auth.ok) return new Response(JSON.stringify({ error: "Contraseña de funcionario inválida." }), { status: 401, headers });
    if (!reason) return new Response(JSON.stringify({ error: "Registra el motivo del acceso asistido." }), { status: 400, headers });

    const config = getClientPortalConfig();
    if (!config.configured) {
      return new Response(JSON.stringify({ error: "El portal no tiene CLIENT_PORTAL_SECRET configurado." }), { status: 500, headers });
    }

    const user = await getClientPortalUser(body?.userId);
    if (!user) return new Response(JSON.stringify({ error: "Usuario del portal no encontrado." }), { status: 404, headers });
    if (user.status === "suspended") return new Response(JSON.stringify({ error: "El usuario está suspendido." }), { status: 409, headers });

    const auditedUser = await recordClientPortalImpersonation(user.id, session.username, reason);
    const token = createClientPortalSession(
      {
        username: auditedUser.username,
        companyId: auditedUser.companyId,
        companyName: auditedUser.companyName,
        mustChangePassword: false
      },
      config.secret,
      60 * 60,
      { impersonatedBy: session.username, role: "support" }
    );

    return new Response(
      JSON.stringify({
        ok: true,
        user: auditedUser,
        portalUrl: "/portal-clientes",
        expiresInSeconds: 60 * 60
      }),
      {
        status: 200,
        headers: {
          ...headers,
          "Set-Cookie": buildClientPortalSessionCookie(req, token, 60 * 60)
        }
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "No fue posible iniciar el acceso asistido.", detail: error.message }), { status: 500, headers });
  }
};
