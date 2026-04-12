import {
  authenticateAdminCredentials,
  buildAdminHeaders,
  buildAdminSessionCookie,
  createAdminSession
} from "./utils/admin-auth.js";

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

  try {
    const body = await req.json();
    const username = String(body?.username || "").trim();
    const password = String(body?.password || "");
    const auth = authenticateAdminCredentials(username, password);

    if (auth.reason === "missing_config") {
      return new Response(
        JSON.stringify({
          error: "El panel no está configurado. Defina ADMIN_PANEL_USERNAME, ADMIN_PANEL_PASSWORD y ADMIN_PANEL_SECRET."
        }),
        {
          status: 500,
          headers
        }
      );
    }

    if (!auth.ok) {
      return new Response(
        JSON.stringify({ error: "Usuario o contraseña inválidos" }),
        {
          status: 401,
          headers
        }
      );
    }

    const token = createAdminSession(auth.config.username, auth.config.secret);

    return new Response(
      JSON.stringify({
        ok: true,
        username: auth.config.username
      }),
      {
        status: 200,
        headers: {
          ...headers,
          "Set-Cookie": buildAdminSessionCookie(req, token)
        }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible iniciar sesión",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
