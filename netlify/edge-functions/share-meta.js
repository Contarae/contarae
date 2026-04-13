const ROUTE_META = new Map([
  [
    "/certificacion",
    {
      title:
        "CONTARAE | Certificación de ingresos por Contador Público | Bogotá",
      description:
        "Solicite su certificación de ingresos firmada por Contador Público. Pago en línea, seguimiento de referencia y atención por WhatsApp o correo.",
    },
  ],
  [
    "/certificacion-de-ingresos",
    {
      title:
        "CONTARAE | Certificación de ingresos por Contador Público | Bogotá",
      description:
        "Solicite su certificación de ingresos firmada por Contador Público. Pago en línea, seguimiento de referencia y atención por WhatsApp o correo.",
    },
  ],
  [
    "/debo-declarar-renta",
    {
      title: "CONTARAE | ¿Debo declarar renta? | Verifíquelo en minutos",
      description:
        "Revise si podría estar obligado a declarar renta en Colombia con una herramienta orientativa basada en ingresos, patrimonio, consumos y consignaciones.",
    },
  ],
  [
    "/declarar-renta",
    {
      title: "CONTARAE | ¿Debo declarar renta? | Verifíquelo en minutos",
      description:
        "Revise si podría estar obligado a declarar renta en Colombia con una herramienta orientativa basada en ingresos, patrimonio, consumos y consignaciones.",
    },
  ],
  [
    "/retencion-en-la-fuente",
    {
      title:
        "CONTARAE | Retención en la fuente | Estime su valor mensual",
      description:
        "Calcule la retención en la fuente estimada con deducciones, rentas exentas y comparativo 2025 y 2026. Resultado claro y rápido.",
    },
  ],
  [
    "/calculadora-retencion",
    {
      title:
        "CONTARAE | Retención en la fuente | Estime su valor mensual",
      description:
        "Calcule la retención en la fuente estimada con deducciones, rentas exentas y comparativo 2025 y 2026. Resultado claro y rápido.",
    },
  ],
  [
    "/planilla-independientes",
    {
      title:
        "CONTARAE | Planilla independientes | Simule salud, pensión y ARL",
      description:
        "Liquide salud, pensión y ARL para independientes y contratistas. Simule el IBC y el valor total de la planilla mensual en segundos.",
    },
  ],
  [
    "/seguridad-social-independientes",
    {
      title:
        "CONTARAE | Planilla independientes | Simule salud, pensión y ARL",
      description:
        "Liquide salud, pensión y ARL para independientes y contratistas. Simule el IBC y el valor total de la planilla mensual en segundos.",
    },
  ],
  [
    "/liquidador-de-nomina",
    {
      title:
        "CONTARAE | Liquidador de nómina | Salario, prestaciones y costo",
      description:
        "Calcule salario neto, prestaciones, seguridad social, parafiscales y costo empresa en una sola herramienta de nómina.",
    },
  ],
  [
    "/nomina",
    {
      title:
        "CONTARAE | Liquidador de nómina | Salario, prestaciones y costo",
      description:
        "Calcule salario neto, prestaciones, seguridad social, parafiscales y costo empresa en una sola herramienta de nómina.",
    },
  ],
  [
    "/liquidador-de-iva",
    {
      title: "CONTARAE | Liquidador de IVA | Subtotal, IVA y total",
      description:
        "Obtenga subtotal, IVA y total de una operación en segundos. Ideal para cotizaciones, ventas y validaciones rápidas.",
    },
  ],
  [
    "/iva",
    {
      title: "CONTARAE | Liquidador de IVA | Subtotal, IVA y total",
      description:
        "Obtenga subtotal, IVA y total de una operación en segundos. Ideal para cotizaciones, ventas y validaciones rápidas.",
    },
  ],
  [
    "/precio-antes-de-iva",
    {
      title: "CONTARAE | Precio antes de IVA | Conozca la base gravable",
      description:
        "Descubra el valor base a partir del precio final con IVA incluido. Útil para márgenes, análisis de precios y cotizaciones.",
    },
  ],
  [
    "/precio-sin-iva",
    {
      title: "CONTARAE | Precio antes de IVA | Conozca la base gravable",
      description:
        "Descubra el valor base a partir del precio final con IVA incluido. Útil para márgenes, análisis de precios y cotizaciones.",
    },
  ],
]);

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
  const doubleQuoted = new RegExp(
    `<meta[^>]*${attrName}="${escapedAttrValue}"[^>]*content="[^"]*"[^>]*\\/?>`,
    "i"
  );
  const singleQuoted = new RegExp(
    `<meta[^>]*${attrName}='${escapedAttrValue}'[^>]*content='[^']*'[^>]*\\/?>`,
    "i"
  );
  const reverseDoubleQuoted = new RegExp(
    `<meta[^>]*content="[^"]*"[^>]*${attrName}="${escapedAttrValue}"[^>]*\\/?>`,
    "i"
  );
  const reverseSingleQuoted = new RegExp(
    `<meta[^>]*content='[^']*'[^>]*${attrName}='${escapedAttrValue}'[^>]*\\/?>`,
    "i"
  );
  const replacement = `<meta ${attrName}="${attrValue}" content="${content}" />`;

  if (doubleQuoted.test(html)) return html.replace(doubleQuoted, replacement);
  if (singleQuoted.test(html)) return html.replace(singleQuoted, replacement);
  if (reverseDoubleQuoted.test(html))
    return html.replace(reverseDoubleQuoted, replacement);
  if (reverseSingleQuoted.test(html))
    return html.replace(reverseSingleQuoted, replacement);

  return html.replace("</head>", `  ${replacement}\n  </head>`);
};

const injectMeta = (html, requestUrl, meta) => {
  const title = escapeHtml(meta.title);
  const description = escapeHtml(meta.description);
  const url = escapeHtml(requestUrl);
  const image = escapeHtml(new URL("/logo512.png", requestUrl).href);

  let nextHtml = html.replace(
    /<title>.*?<\/title>/is,
    `<title>${title}</title>`
  );

  nextHtml = nextHtml.replace(
    /<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i,
    `<meta name="description" content="${description}" />`
  );
  nextHtml = replaceMetaTag(nextHtml, "property", "og:type", "website");
  nextHtml = replaceMetaTag(nextHtml, "property", "og:site_name", "CONTARAE");
  nextHtml = replaceMetaTag(nextHtml, "property", "og:title", title);
  nextHtml = replaceMetaTag(
    nextHtml,
    "property",
    "og:description",
    description
  );
  nextHtml = replaceMetaTag(nextHtml, "property", "og:url", url);
  nextHtml = replaceMetaTag(nextHtml, "property", "og:image", image);
  nextHtml = replaceMetaTag(nextHtml, "property", "og:image:alt", title);
  nextHtml = replaceMetaTag(nextHtml, "name", "twitter:card", "summary_large_image");
  nextHtml = replaceMetaTag(nextHtml, "name", "twitter:title", title);
  nextHtml = replaceMetaTag(
    nextHtml,
    "name",
    "twitter:description",
    description
  );
  nextHtml = replaceMetaTag(nextHtml, "name", "twitter:image", image);

  return nextHtml;
};

export default async (request, context) => {
  const pathname = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
  const meta = ROUTE_META.get(pathname);
  const response = await context.next();

  if (!meta) {
    return response;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("text/html")) {
    return response;
  }

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
