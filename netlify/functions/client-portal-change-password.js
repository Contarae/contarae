import {
  buildClientPortalHeaders,
  buildClientPortalSessionCookie,
  createClientPortalSession,
  getClientPortalConfig,
  getClientPortalSessionFromRequest
} from "./utils/client-portal-auth.js";
import { changeClientPortalPassword } from "./utils/client-portal-users.js";

export default async (req) => {
  const headers = buildClientPortalHeaders();
  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "POST") return new Response(JSON.stringify({ error: "Metodo no permitido" }), { status: 405, headers });

  const session = getClientPortalSessionFromRequest(req);
  if (!session.configured) return new Response(JSON.stringify({ error: "El portal no esta configurado." }), { status: 500, headers });
  if (!session.authenticated) return new Response(JSON.stringify({ error: "No autorizado" }), { status: 401, headers });
  if (session.role === "support" || session.impersonatedBy) {
    return new Response(JSON.stringify({ error: "El acceso asistido no puede cambiar contrasenas del cliente." }), { status: 403, headers });
  }

  try {
    const body = await req.json();
    const user = await changeClientPortalPassword(session.username, body?.currentPassword, body?.nextPassword);
    const config = getClientPortalConfig();
    const token = createClientPortalSession(
      {
        username: user.username,
        companyId: user.companyId,
        companyName: user.companyName,
        mustChangePassword: false
      },
      config.secret
    );
    return new Response(
      JSON.stringify({ ok: true, user }),
      {
        status: 200,
        headers: {
          ...headers,
          "Set-Cookie": buildClientPortalSessionCookie(req, token)
        }
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: "No fue posible cambiar la contrasena.", detail: error.message }), { status: 400, headers });
  }
};
