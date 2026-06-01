import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import promoUtils from "./utils/promo-codes.cjs";
import { buildPromoCodeSalesIndex } from "./utils/promo-code-reports.js";

const { listPromoCodes, normalizePromoCode } = promoUtils;

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
    const [promoCodeResult, salesIndex] = await Promise.all([
      listPromoCodes(),
      buildPromoCodeSalesIndex()
    ]);
    const promoCodes = Array.isArray(promoCodeResult) ? promoCodeResult : promoCodeResult.records || [];
    const enrichedPromoCodes = promoCodes.map((promoCode) => ({
      ...promoCode,
      wompiSummary: salesIndex[normalizePromoCode(promoCode.code)] || {
        salesCount: 0,
        baseAmount: 0,
        baseAmountLabel: "$ 0",
        discountAmount: 0,
        discountAmountLabel: "$ 0",
        finalAmount: 0,
        finalAmountLabel: "$ 0",
        commissionAmount: 0,
        commissionAmountLabel: "$ 0"
      }
    }));

    return new Response(
      JSON.stringify({
        ok: true,
        promoCodes: enrichedPromoCodes,
        storageAvailable: promoCodeResult.storageAvailable !== false,
        warning: promoCodeResult.storageAvailable === false
          ? "El almacenamiento administrable de códigos no está disponible. Solo se muestran códigos heredados."
          : ""
      }),
      {
        status: 200,
        headers
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible listar los códigos promocionales.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
