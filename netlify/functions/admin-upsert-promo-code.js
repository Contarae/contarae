import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import promoUtils from "./utils/promo-codes.cjs";

const { upsertPromoCode } = promoUtils;

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

  const session = getAdminSessionFromRequest(req);

  if (!session.configured) {
    return new Response(JSON.stringify({ error: "El panel no está configurado." }), {
      status: 500,
      headers
    });
  }

  if (!session.authenticated) {
    return new Response(JSON.stringify({ error: "No autorizado" }), {
      status: 401,
      headers
    });
  }

  try {
    const payload = await req.json();
    const promoCode = await upsertPromoCode(payload, session.username || "admin");

    return new Response(
      JSON.stringify({
        ok: true,
        promoCode
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible guardar el código promocional.",
        detail: error.message
      }),
      {
        status: 400,
        headers
      }
    );
  }
};
