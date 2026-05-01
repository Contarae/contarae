const SITE_URL = "https://contarae.com";
const LOGO_PATH = "/logo512.png";
const SAME_AS = [
  "https://www.facebook.com/share/1ENSxjgYCH/?mibextid=wwXIfr",
  "https://www.instagram.com/oficial.contarae?igsh=OWJmd250d3ljMmR2&utm_source=qr",
  "https://www.tiktok.com/@contarae.oficial?_r=1&_t=ZS-95xXx2QEhHQ",
  "https://www.youtube.com/@CONTARAE_Servicios_contables",
];

const CERTIFICATION_FAQS = [
  {
    q: "¿Cuánto cuesta la certificación de ingresos?",
    a: "La tarifa depende del rango de ingresos acreditados y del nivel de soporte requerido. Siempre informamos el valor antes del pago, para que el cliente sepa exactamente qué incluye el servicio y en qué plazo se entrega el documento firmado por contador público.",
  },
  {
    q: "¿Cuánto tarda la entrega del certificado?",
    a: "Con documentación completa y pago confirmado, normalmente se entrega en pocas horas. Si la información requiere validaciones adicionales o documentos complementarios, el tiempo puede extenderse, pero siempre le informamos el estado del proceso.",
  },
  {
    q: "¿Qué soportes necesito para la certificación?",
    a: "Depende del tipo de ingreso. Para ingresos laborales suelen usarse desprendibles o certificados; para independientes, facturas, contratos, extractos y reportes; para arriendos o inversiones, los soportes que evidencien el flujo real.",
  },
  {
    q: "¿La certificación tiene vigencia?",
    a: "Usualmente las entidades receptoras aceptan documentos recientes, por lo que recomendamos usarla dentro de los 30 a 60 días posteriores a su expedición, salvo que la entidad indique algo distinto.",
  },
  {
    q: "¿Puedo solicitar si soy independiente?",
    a: "Sí. La certificación aplica para trabajadores independientes, contratistas, freelancers, comerciantes, rentistas y otras personas naturales con ingresos demostrables.",
  },
  {
    q: "¿Qué pasa si mis soportes están incompletos?",
    a: "Podemos orientar sobre qué documentos faltan y qué alternativas existen para complementar la solicitud. La emisión depende de contar con soportes suficientes para certificar responsablemente.",
  },
];

const SUPPORT_FAQS = new Map([
  [
    "/certificado-de-ingresos-contador-publico",
    [
      {
        q: "¿Certificado de ingresos y certificación de ingresos son lo mismo?",
        a: "En la práctica suelen usarse como equivalentes. Lo importante es que el documento esté firmado por Contador Público y que los ingresos certificados tengan soporte verificable.",
      },
      {
        q: "¿Sirve si soy empleado?",
        a: "Sí. Puede soportarse con desprendibles de nómina, certificaciones laborales, certificados de ingresos y retenciones u otros documentos emitidos por el empleador.",
      },
      {
        q: "¿Sirve si soy independiente?",
        a: "Sí. En ese caso se revisan soportes como contratos, facturas, extractos bancarios, comprobantes de pago y evidencia de la actividad económica.",
      },
    ],
  ],
  [
    "/certificado-de-ingresos-para-independientes",
    [
      {
        q: "¿Puedo certificar ingresos si me pagan por transferencia?",
        a: "Sí, siempre que los movimientos puedan relacionarse razonablemente con la actividad económica o el servicio prestado.",
      },
      {
        q: "¿Puedo incluir ventas ocasionales?",
        a: "Sí, pero deben presentarse como ingresos eventuales si no son fijos ni periódicos.",
      },
      {
        q: "¿Se puede certificar un promedio mensual?",
        a: "Sí, siempre que el período y los soportes permitan explicar técnicamente ese promedio.",
      },
    ],
  ],
  [
    "/certificado-de-ingresos-para-banco",
    [
      {
        q: "¿El banco está obligado a aceptar el certificado?",
        a: "La aceptación depende de la política interna de cada entidad, pero una certificación clara y soportada reduce observaciones.",
      },
      {
        q: "¿Sirve para crédito hipotecario?",
        a: "Puede servir como soporte dentro del estudio, siempre que cumpla los requisitos solicitados por la entidad financiera.",
      },
      {
        q: "¿Puede incluir varios tipos de ingresos?",
        a: "Sí. Pueden presentarse varias fuentes recurrentes y, si aplica, ingresos eventuales separados.",
      },
    ],
  ],
  [
    "/certificado-de-ingresos-para-arrendamiento",
    [
      {
        q: "¿Sirve para aseguradora de arrendamiento?",
        a: "Sí, puede usarse como soporte, aunque la aprobación final depende de la aseguradora.",
      },
      {
        q: "¿Puedo solicitarla si soy codeudor?",
        a: "Sí, si necesita acreditar ingresos propios dentro del estudio del arrendamiento.",
      },
      {
        q: "¿Qué pasa si tengo varios ingresos pequeños?",
        a: "Se pueden presentar por separado o en lista, según la cantidad y naturaleza de las fuentes.",
      },
    ],
  ],
  [
    "/comprar-certificado-de-ingresos",
    [
      {
        q: "¿Puedo pagar en línea?",
        a: "Sí. La página permite pagar por Wompi con los medios habilitados en la pasarela.",
      },
      {
        q: "¿Qué pasa después del pago?",
        a: "La solicitud entra a revisión profesional y el equipo puede pedir soportes o aclaraciones si son necesarios.",
      },
      {
        q: "¿Puedo iniciar si todavía no tengo todos los soportes?",
        a: "Sí, pero la emisión depende de que finalmente existan soportes suficientes para certificar responsablemente.",
      },
    ],
  ],
]);

const CERTIFICATION_SUPPORT_PATHS = new Set([...SUPPORT_FAQS.keys()]);
const TOOL_PATHS = new Set([
  "/debo-declarar-renta",
  "/retencion-en-la-fuente",
  "/planilla-independientes",
  "/liquidador-de-nomina",
  "/liquidador-de-iva",
  "/precio-antes-de-iva",
]);

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

const replaceAlternate = (html, hreflang, href) => {
  const replacement = `<link rel="alternate" hreflang="${hreflang}" href="${href}" />`;
  const escapedHreflang = escapeRegex(hreflang);
  const patterns = [
    new RegExp(`<link[^>]*rel=["']alternate["'][^>]*hreflang=["']${escapedHreflang}["'][^>]*>`, "i"),
    new RegExp(`<link[^>]*hreflang=["']${escapedHreflang}["'][^>]*rel=["']alternate["'][^>]*>`, "i"),
  ];
  const pattern = patterns.find((item) => item.test(html));
  if (pattern) return html.replace(pattern, replacement);
  return html.replace("</head>", `  ${replacement}\n  </head>`);
};

const cleanTitle = (title) => String(title || "").replace(/\s*\|\s*CONTARAE\s*$/i, "");

const buildBreadcrumbSchema = (items) => ({
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: new URL(item.path, SITE_URL).href,
  })),
});

const buildFaqSchema = (faqs = []) => {
  const items = faqs
    .filter((item) => item?.q && item?.a)
    .map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    }));

  if (!items.length) return null;
  return {
    "@type": "FAQPage",
    mainEntity: items,
  };
};

const injectSchema = (html, meta, canonicalUrl) => {
  if (meta.noindex) return html;
  const canonicalPath = new URL(canonicalUrl).pathname.replace(/\/+$/, "") || "/";
  const extraGraph = [];

  if (canonicalPath === "/certificacion") {
    extraGraph.push({
      "@type": "Service",
      name: "Certificación de ingresos por Contador Público",
      description: meta.description,
      provider: { "@id": `${SITE_URL}/#negocio` },
      areaServed: "CO",
      serviceType: "Certificación de ingresos",
      url: canonicalUrl,
    });
    extraGraph.push({
      "@type": "VideoObject",
      name: "Paso a paso certificación de ingresos CONTARAE",
      description: "Video explicativo sobre cómo solicitar una certificación de ingresos firmada por Contador Público en CONTARAE.",
      thumbnailUrl: ["https://i.ytimg.com/vi/yHF1p9T9kgU/hqdefault.jpg"],
      embedUrl: "https://www.youtube.com/embed/yHF1p9T9kgU",
      contentUrl: "https://www.youtube.com/watch?v=yHF1p9T9kgU",
      publisher: { "@id": `${SITE_URL}/#negocio` },
    });
    extraGraph.push(buildBreadcrumbSchema([{ name: "Inicio", path: "/" }, { name: "Certificación de ingresos", path: "/certificacion" }]));
    const faqSchema = buildFaqSchema(CERTIFICATION_FAQS);
    if (faqSchema) extraGraph.push(faqSchema);
  } else if (CERTIFICATION_SUPPORT_PATHS.has(canonicalPath)) {
    extraGraph.push({
      "@type": "Article",
      headline: cleanTitle(meta.title),
      description: meta.description,
      inLanguage: "es-CO",
      author: { "@id": `${SITE_URL}/#negocio` },
      publisher: { "@id": `${SITE_URL}/#negocio` },
      mainEntityOfPage: canonicalUrl,
    });
    extraGraph.push(buildBreadcrumbSchema([
      { name: "Inicio", path: "/" },
      { name: "Certificación de ingresos", path: "/certificacion" },
      { name: cleanTitle(meta.title), path: canonicalPath },
    ]));
    const faqSchema = buildFaqSchema(SUPPORT_FAQS.get(canonicalPath));
    if (faqSchema) extraGraph.push(faqSchema);
  } else if (TOOL_PATHS.has(canonicalPath)) {
    extraGraph.push({
      "@type": "WebApplication",
      name: cleanTitle(meta.title),
      description: meta.description,
      url: canonicalUrl,
      applicationCategory: "FinanceApplication",
      operatingSystem: "Web",
      inLanguage: "es-CO",
      provider: { "@id": `${SITE_URL}/#negocio` },
    });
    extraGraph.push(buildBreadcrumbSchema([
      { name: "Inicio", path: "/" },
      { name: "Herramientas", path: "/#herramientas" },
      { name: cleanTitle(meta.title), path: canonicalPath },
    ]));
  } else if (canonicalPath === "/") {
    extraGraph.push(buildBreadcrumbSchema([{ name: "Inicio", path: "/" }]));
  }

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
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: "CONTARAE",
        url: SITE_URL,
        inLanguage: "es-CO",
        publisher: {
          "@id": `${SITE_URL}/#negocio`,
        },
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
      ...extraGraph,
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
  nextHtml = replaceAlternate(nextHtml, "es-CO", canonicalUrl);
  nextHtml = replaceAlternate(nextHtml, "x-default", canonicalUrl);
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
