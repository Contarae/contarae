const SITE_URL = "https://contarae.com";
const LOGO_PATH = "/logo512.png";
const SAME_AS = [
  "https://www.facebook.com/share/1ENSxjgYCH/?mibextid=wwXIfr",
  "https://www.instagram.com/oficial.contarae?igsh=OWJmd250d3ljMmR2&utm_source=qr",
  "https://www.tiktok.com/@contarae.oficial?_r=1&_t=ZS-95xXx2QEhHQ",
  "https://www.youtube.com/@CONTARAE_Servicios_contables",
];

const route = (path, title, description, canonicalPath = path, extra = {}) => [
  path,
  { title, description, canonicalPath, ...extra },
];

const ROUTE_META = new Map([
  route(
    "/",
    "CONTARAE | Servicios contables, tributarios y financieros",
    "Certificación de ingresos por Contador Público. Servicios contables, tributarios y financieros para personas, emprendedores y pymes en Colombia.",
    "/"
  ),
  route(
    "/certificacion",
    "Certificación de ingresos por Contador Público | CONTARAE",
    "Solicite su certificación de ingresos firmada por Contador Público en Colombia. Pago en línea, seguimiento de referencia y atención por WhatsApp o correo.",
    "/certificacion"
  ),
  route(
    "/certificacion-de-ingresos",
    "Certificación de ingresos por Contador Público | CONTARAE",
    "Solicite su certificación de ingresos firmada por Contador Público en Colombia. Pago en línea, seguimiento de referencia y atención por WhatsApp o correo.",
    "/certificacion"
  ),
  route(
    "/certificado-de-ingresos-contador-publico",
    "Certificado de ingresos por Contador Público | CONTARAE",
    "Conozca cuándo se requiere un certificado de ingresos firmado por Contador Público, qué soportes se revisan y cómo solicitarlo en línea con CONTARAE."
  ),
  route(
    "/certificado-de-ingresos-para-independientes",
    "Certificado de ingresos para independientes | CONTARAE",
    "Solicite una certificación de ingresos para independientes, contratistas o freelancers con revisión de soportes, período certificado y firma de Contador Público."
  ),
  route(
    "/certificado-de-ingresos-para-banco",
    "Certificado de ingresos para banco o crédito | CONTARAE",
    "Prepare una certificación de ingresos para banco, crédito, estudio financiero o entidad financiera con valores claros, soportes y firma profesional."
  ),
  route(
    "/certificado-de-ingresos-para-arrendamiento",
    "Certificado de ingresos para arrendamiento | CONTARAE",
    "Obtenga una certificación de ingresos para arrendar vivienda, inmobiliaria, aseguradora o arrendador, con revisión de soportes y firma de Contador Público."
  ),
  route(
    "/comprar-certificado-de-ingresos",
    "Comprar certificado de ingresos en línea | CONTARAE",
    "Compre y solicite en línea su certificación de ingresos con pago seguro, revisión profesional, soportes verificables y entrega en PDF firmado."
  ),
  route(
    "/debo-declarar-renta",
    "¿Debo declarar renta? | CONTARAE",
    "Revise si podría estar obligado a declarar renta en Colombia con una herramienta orientativa basada en ingresos, patrimonio, consumos y consignaciones."
  ),
  route(
    "/declarar-renta",
    "¿Debo declarar renta? | CONTARAE",
    "Revise si podría estar obligado a declarar renta en Colombia con una herramienta orientativa basada en ingresos, patrimonio, consumos y consignaciones.",
    "/debo-declarar-renta"
  ),
  route(
    "/retencion-en-la-fuente",
    "Retención en la fuente | CONTARAE",
    "Calcule la retención en la fuente estimada con deducciones, rentas exentas y comparativo 2025 y 2026. Resultado claro y rápido."
  ),
  route(
    "/calculadora-retencion",
    "Retención en la fuente | CONTARAE",
    "Calcule la retención en la fuente estimada con deducciones, rentas exentas y comparativo 2025 y 2026. Resultado claro y rápido.",
    "/retencion-en-la-fuente"
  ),
  route(
    "/planilla-independientes",
    "Planilla independientes | CONTARAE",
    "Liquide salud, pensión y ARL para independientes y contratistas. Simule el IBC y el valor total de la planilla mensual en segundos."
  ),
  route(
    "/seguridad-social-independientes",
    "Planilla independientes | CONTARAE",
    "Liquide salud, pensión y ARL para independientes y contratistas. Simule el IBC y el valor total de la planilla mensual en segundos.",
    "/planilla-independientes"
  ),
  route(
    "/liquidador-de-nomina",
    "Liquidador de nómina | CONTARAE",
    "Calcule salario neto, prestaciones, seguridad social, parafiscales y costo empresa en una sola herramienta de nómina."
  ),
  route(
    "/nomina",
    "Liquidador de nómina | CONTARAE",
    "Calcule salario neto, prestaciones, seguridad social, parafiscales y costo empresa en una sola herramienta de nómina.",
    "/liquidador-de-nomina"
  ),
  route(
    "/liquidador-de-iva",
    "Liquidador de IVA | CONTARAE",
    "Obtenga subtotal, IVA y total de una operación en segundos. Ideal para cotizaciones, ventas y validaciones rápidas."
  ),
  route(
    "/iva",
    "Liquidador de IVA | CONTARAE",
    "Obtenga subtotal, IVA y total de una operación en segundos. Ideal para cotizaciones, ventas y validaciones rápidas.",
    "/liquidador-de-iva"
  ),
  route(
    "/precio-antes-de-iva",
    "Precio antes de IVA | CONTARAE",
    "Descubra el valor base a partir del precio final con IVA incluido. Útil para márgenes, análisis de precios y cotizaciones."
  ),
  route(
    "/precio-sin-iva",
    "Precio antes de IVA | CONTARAE",
    "Descubra el valor base a partir del precio final con IVA incluido. Útil para márgenes, análisis de precios y cotizaciones.",
    "/precio-antes-de-iva"
  ),
]);

const NOINDEX_PATHS = [
  /^\/admin(?:\/|$)/,
  /^\/pago-solicitud(?:\/|$)/,
  /^\/pagar-solicitud(?:\/|$)/,
  /^\/portal-pagos(?:\/|$)/,
  /^\/pagos(?:\/|$)/,
  /^\/portal-de-pagos(?:\/|$)/,
  /^\/verificar-certificado(?:\/|$)/,
  /^\/verificar-certificacion(?:\/|$)/,
];

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const escapeRegex = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const replaceMetaTag = (html, attrName, attrValue, content) => {
  const escapedAttrValue = escapeRegex(attrValue);
  const patterns = [
    new RegExp(`<meta[^>]*${attrName}="${escapedAttrValue}"[^>]*content="[^"]*"[^>]*\\/?>`, "i"),
    new RegExp(`<meta[^>]*${attrName}='${escapedAttrValue}'[^>]*content='[^']*'[^>]*\\/?>`, "i"),
    new RegExp(`<meta[^>]*content="[^"]*"[^>]*${attrName}="${escapedAttrValue}"[^>]*\\/?>`, "i"),
    new RegExp(`<meta[^>]*content='[^']*'[^>]*${attrName}='${escapedAttrValue}'[^>]*\\/?>`, "i"),
  ];
  const replacement = `<meta ${attrName}="${attrValue}" content="${content}" />`;
  const pattern = patterns.find((item) => item.test(html));
  if (pattern) return html.replace(pattern, replacement);
  return html.replace("</head>", `  ${replacement}\n  </head>`);
};

const replaceCanonical = (html, canonicalUrl) => {
  const replacement = `<link rel="canonical" href="${canonicalUrl}" />`;
  const pattern = /<link[^>]*rel=["']canonical["'][^>]*>/i;
  if (pattern.test(html)) return html.replace(pattern, replacement);
  return html.replace("</head>", `  ${replacement}\n  </head>`);
};

const injectSchema = (html, meta, canonicalUrl) => {
  if (meta.noindex) return html;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "ProfessionalService",
        "@id": `${SITE_URL}/#negocio`,
        name: "CONTARAE",
        description:
          "Servicios contables, tributarios y financieros en Colombia, con certificación de ingresos por Contador Público y herramientas de cálculo tributario y laboral.",
        url: SITE_URL,
        telephone: "+573001432008",
        email: "info@contarae.com",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Bogotá D.C.",
          addressCountry: "CO",
        },
        areaServed: "CO",
        priceRange: "$$",
        openingHours: "Mo-Fr 08:00-18:00",
        sameAs: SAME_AS,
      },
      {
        "@type": "WebPage",
        "@id": `${canonicalUrl}#webpage`,
        name: meta.title,
        description: meta.description,
        url: canonicalUrl,
        inLanguage: "es-CO",
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: "CONTARAE",
          url: SITE_URL,
        },
      },
    ],
  };
  const json = JSON.stringify(schema).replace(/</g, "\\u003c");
  return html.replace(
    "</head>",
    `  <script type="application/ld+json" data-contarae-schema="edge">${json}</script>\n  </head>`
  );
};

const getMetaForPath = (pathname) => {
  const meta = ROUTE_META.get(pathname);
  if (meta) return meta;
  if (NOINDEX_PATHS.some((pattern) => pattern.test(pathname))) {
    return {
      title: "CONTARAE",
      description: "Página interna de CONTARAE.",
      canonicalPath: pathname,
      noindex: true,
    };
  }
  return null;
};

const injectMeta = (html, requestUrl, meta) => {
  const request = new URL(requestUrl);
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const canonicalUrl = escapeHtml(new URL(meta.canonicalPath || request.pathname, SITE_URL).href);
  const image = escapeHtml(new URL(LOGO_PATH, SITE_URL).href);
  const robots = meta.noindex ? "noindex, nofollow" : "index, follow";

  let nextHtml = html.replace(/<title>.*?<\/title>/is, `<title>${title}</title>`);
  nextHtml = replaceMetaTag(nextHtml, "name", "description", description);
  nextHtml = replaceMetaTag(nextHtml, "name", "robots", robots);
  nextHtml = replaceCanonical(nextHtml, canonicalUrl);
  nextHtml = replaceMetaTag(nextHtml, "property", "og:type", "website");
  nextHtml = replaceMetaTag(nextHtml, "property", "og:site_name", "CONTARAE");
  nextHtml = replaceMetaTag(nextHtml, "property", "og:title", title);
  nextHtml = replaceMetaTag(nextHtml, "property", "og:description", description);
  nextHtml = replaceMetaTag(nextHtml, "property", "og:url", canonicalUrl);
  nextHtml = replaceMetaTag(nextHtml, "property", "og:image", image);
  nextHtml = replaceMetaTag(nextHtml, "property", "og:image:alt", title);
  nextHtml = replaceMetaTag(nextHtml, "name", "twitter:card", "summary_large_image");
  nextHtml = replaceMetaTag(nextHtml, "name", "twitter:title", title);
  nextHtml = replaceMetaTag(nextHtml, "name", "twitter:description", description);
  nextHtml = replaceMetaTag(nextHtml, "name", "twitter:image", image);
  nextHtml = injectSchema(nextHtml, meta, canonicalUrl);

  return nextHtml;
};

export default async (request, context) => {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  const meta = getMetaForPath(pathname);
  const response = await context.next();

  if (!meta) return response;

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) return response;

  const html = await response.text();
  const body = injectMeta(html, request.url, meta);
  const headers = new Headers(response.headers);
  headers.delete("content-length");

  return new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};
