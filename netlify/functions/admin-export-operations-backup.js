import { buildAdminHeaders, getAdminSessionFromRequest } from "./utils/admin-auth.js";
import { listAllCertifications } from "./utils/certification-admin.js";
import { listClientLeads } from "./utils/client-leads.js";
import { getServiceRequestByReference, listAllServiceRequests, listServicePayments } from "./utils/service-requests.js";
import promoUtils from "./utils/promo-codes.cjs";

const { listPromoCodes } = promoUtils;

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
    const serviceSummaries = await listAllServiceRequests();
    const [serviceRequests, servicePayments, clientLeads, certifications, promoCodes] = await Promise.all([
      Promise.all(serviceSummaries.map((record) => getServiceRequestByReference(record.reference))),
      listServicePayments(),
      listClientLeads(),
      listAllCertifications(),
      listPromoCodes()
    ]);

    const generatedAt = new Date().toISOString();
    const payload = {
      generatedAt,
      generatedBy: session.username,
      source: "CONTARAE admin panel",
      serviceRequests: serviceRequests.filter(Boolean),
      servicePayments,
      clientLeads,
      certifications,
      promoCodes
    };

    return new Response(JSON.stringify(payload, null, 2), {
      status: 200,
      headers: {
        ...headers,
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="backup-contarae-${generatedAt.slice(0, 10)}.json"`
      }
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "No fue posible generar el backup operativo.",
        detail: error.message
      }),
      {
        status: 500,
        headers
      }
    );
  }
};
