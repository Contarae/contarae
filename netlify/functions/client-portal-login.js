import {
  authenticateClientPortalCredentials,
  buildClientPortalHeaders,
  buildClientPortalSessionCookie,
  createClientPortalSession
} from "./utils/client-portal-auth.js";

export default async (req) => {
  const headers = buildClientPortalHeaders();

  if (req.method === "OPTIONS") return new Response("", { status: 200, headers });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Metodo no permitido" }), { status: 405, headers });
  }

  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const auth = await authenticateClientPortalCredentials(username, password);

    if (auth.reason === "missing_config") {
      return new Response(
        JSON.stringify({
          error: "El portal para clientes no esta configurado. Define CLIENT_PORTAL_SECRET y crea usuarios desde el panel interno, o usa CLIENT_PORTAL_USERS_JSON como respaldo."
        }),
        { status: 500, headers }
      );
    }

    if (!auth.ok) {
      return new Response(
        JSON.stringify({
          error: auth.reason === "suspended" ? "Este usuario esta suspendido." : "Usuario o contrasena invalidos"
        }),
        { status: 401, headers }
      );
    }

    const token = createClientPortalSession(auth.user, auth.config.secret);
    return new Response(
      JSON.stringify({
        ok: true,
        username: auth.user.username,
        companyId: auth.user.companyId,
        companyName: auth.user.companyName,
        mustChangePassword: Boolean(auth.user.mustChangePassword)
      }),
      {
        status: 200,
        headers: {
          ...headers,
          "Set-Cookie": buildClientPortalSessionCookie(req, token)
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: "No fue posible iniciar sesion en el portal", detail: error.message }),
      { status: 500, headers }
    );
  }
};
