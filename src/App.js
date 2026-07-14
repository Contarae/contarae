import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import AdminPanel from "./AdminPanel";
import ClientPortal from "./ClientPortal";
import CertificateVerificationPage from "./CertificateVerificationPage";

const WA="573001432008",WL=`https://wa.me/${WA}`,EM="info@contarae.com",F="'Outfit',sans-serif",FH="'Libre Baskerville',serif";
const SOCIAL_LINKS=[
  ["Facebook","https://www.facebook.com/share/1ENSxjgYCH/?mibextid=wwXIfr"],
  ["Instagram","https://www.instagram.com/oficial.contarae?igsh=OWJmd250d3ljMmR2&utm_source=qr"],
  ["TikTok","https://www.tiktok.com/@contarae.oficial?_r=1&_t=ZS-95xXx2QEhHQ"],
  ["YouTube","https://www.youtube.com/@CONTARAE_Servicios_contables"]
];
const CERTIFICATION_VIDEO_EMBED="https://www.youtube.com/embed/yHF1p9T9kgU";
const fm=n=>new Intl.NumberFormat("es-CO").format(n);
const wm=m=>`${WL}?text=${encodeURIComponent(m)}`;
const MARKETING_STORAGE_KEY="contarae-marketing-attribution";
const MARKETING_QUERY_KEYS=["utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id","gclid","gbraid","wbraid"];
const MARKETING_FORM_FIELDS=["marketing_attribution_json","landing_page","initial_referrer","latest_page","latest_referrer","utm_source","utm_medium","utm_campaign","utm_term","utm_content","utm_id","gclid","gbraid","wbraid","ga_client_id","attribution_captured_at","attribution_updated_at","campaign_landing_page","campaign_captured_at"];
const cleanMarketingValue=value=>String(value||"").trim().slice(0,500);
const safeJsonParse=(value,fallback={})=>{try{return JSON.parse(String(value||""))||fallback;}catch(e){return fallback;}};
const readStoredMarketingAttribution=()=>{if(typeof window==="undefined")return{};try{return safeJsonParse(window.localStorage.getItem(MARKETING_STORAGE_KEY),{});}catch(e){return{};}};
const writeStoredMarketingAttribution=attribution=>{if(typeof window==="undefined")return attribution;try{window.localStorage.setItem(MARKETING_STORAGE_KEY,JSON.stringify(attribution));}catch(e){}return attribution;};
const getGaClientId=()=>{if(typeof document==="undefined")return"";const match=document.cookie.match(/(?:^|;\s*)_ga=GA\d+\.\d+\.(\d+\.\d+)/);return match?match[1]:"";};
const captureMarketingAttribution=()=>{
  if(typeof window==="undefined")return{};
  const now=new Date().toISOString();
  const url=new URL(window.location.href);
  const existing=readStoredMarketingAttribution();
  const queryValues=MARKETING_QUERY_KEYS.reduce((acc,key)=>{const value=cleanMarketingValue(url.searchParams.get(key));if(value)acc[key]=value;return acc;},{});
  const hasCampaignTouch=Object.keys(queryValues).length>0;
  const attribution={
    ...existing,
    landing_page:existing.landing_page||url.href,
    initial_referrer:existing.initial_referrer||document.referrer||"",
    captured_at:existing.captured_at||now,
    latest_page:url.href,
    latest_referrer:document.referrer||existing.latest_referrer||"",
    updated_at:now,
    ...(hasCampaignTouch?queryValues:{}),
    campaign_landing_page:hasCampaignTouch?url.href:existing.campaign_landing_page||"",
    campaign_captured_at:hasCampaignTouch?now:existing.campaign_captured_at||"",
    ga_client_id:getGaClientId()||existing.ga_client_id||""
  };
  return writeStoredMarketingAttribution(attribution);
};
const getMarketingAttribution=()=>{
  const attribution=readStoredMarketingAttribution();
  const gaClientId=getGaClientId();
  if(gaClientId&&attribution.ga_client_id!==gaClientId)return writeStoredMarketingAttribution({...attribution,ga_client_id:gaClientId,updated_at:new Date().toISOString()});
  return attribution;
};
const getMarketingFormFields=()=>{
  const attribution=getMarketingAttribution();
  return {
    marketing_attribution_json:JSON.stringify(attribution),
    landing_page:attribution.landing_page||"",
    initial_referrer:attribution.initial_referrer||"",
    latest_page:attribution.latest_page||"",
    latest_referrer:attribution.latest_referrer||"",
    utm_source:attribution.utm_source||"",
    utm_medium:attribution.utm_medium||"",
    utm_campaign:attribution.utm_campaign||"",
    utm_term:attribution.utm_term||"",
    utm_content:attribution.utm_content||"",
    utm_id:attribution.utm_id||"",
    gclid:attribution.gclid||"",
    gbraid:attribution.gbraid||"",
    wbraid:attribution.wbraid||"",
    ga_client_id:attribution.ga_client_id||"",
    attribution_captured_at:attribution.captured_at||"",
    attribution_updated_at:attribution.updated_at||"",
    campaign_landing_page:attribution.campaign_landing_page||"",
    campaign_captured_at:attribution.campaign_captured_at||""
  };
};
const getMarketingEventParams=()=>{const fields=getMarketingFormFields();const{marketing_attribution_json,...params}=fields;return params;};
const trackMarketingEvent=(event,params={})=>{if(typeof window==="undefined"||!event)return;window.dataLayer=window.dataLayer||[];window.dataLayer.push({event,page_path:window.location.pathname,page_location:window.location.href,...getMarketingEventParams(),...params});};
const WK="pub_prod_aEMHipEJ29G4pZOiIwgRC1GOvbqIYzP6";
const onlyDigits=value=>String(value||"").replace(/\D/g,"");
const normalizeEmail=value=>String(value||"").trim().toLowerCase();
const isValidEmail=value=>/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(normalizeEmail(value));
const formatProperName=value=>String(value||"").normalize("NFC").replace(/[^\p{L}\p{M}'’ -]/gu,"").replace(/\s+/g," ").trim().split(" ").filter(Boolean).map(word=>word.split("-").map(part=>part?part.charAt(0).toLocaleUpperCase("es-CO")+part.slice(1).toLocaleLowerCase("es-CO"):"").join("-")).join(" ");
const NUMERIC_CONTROL_KEYS=new Set(["Backspace","Delete","Tab","ArrowLeft","ArrowRight","Home","End","Enter"]);
const preventNonNumericInput=event=>{if(event.ctrlKey||event.metaKey||event.altKey||NUMERIC_CONTROL_KEYS.has(event.key))return;if(!/^\d$/.test(event.key))event.preventDefault();};
const numericInputProps={inputMode:"numeric",onKeyDown:preventNonNumericInput};
const currencyInputProps={...numericInputProps,autoComplete:"off"};
const fmtI=v=>{const n=onlyDigits(v);return n?"$ "+fm(parseInt(n,10)):""};
const pN=v=>parseInt(onlyDigits(v),10)||0;
const CERTIFICATION_PROMO_DISCOUNT_RATE=0.15;
const CERTIFICATION_PRICE_TIERS=[
  {max:2000000,range:"$0 a $2.000.000",formRange:"Ingresos desde $0 hasta $2.000.000",value:80000},
  {max:5000000,range:"$2.000.001 a $5.000.000",formRange:"Ingresos desde $2.000.001 hasta $5.000.000",value:95000},
  {max:8000000,range:"$5.000.001 a $8.000.000",formRange:"Ingresos desde $5.000.001 hasta $8.000.000",value:110000},
  {max:12000000,range:"$8.000.001 a $12.000.000",formRange:"Ingresos desde $8.000.001 hasta $12.000.000",value:125000},
  {max:18000000,range:"$12.000.001 a $18.000.000",formRange:"Ingresos desde $12.000.001 hasta $18.000.000",value:140000},
  {max:Infinity,range:"$18.000.001 en adelante",formRange:"Ingresos desde $18.000.001 en adelante",value:155000}
];
const gT=t=>CERTIFICATION_PRICE_TIERS.find(item=>Number(t||0)<=item.max)?.value||155000;
const disc=v=>Math.round(v/.75);
const certReferenceValue=v=>Math.round(Number(v||0)/(1-CERTIFICATION_PROMO_DISCOUNT_RATE));
const promoCodeValue=value=>String(value||"").trim().toUpperCase();
const SUPPORT_MAX_FILES=5;
const SUPPORT_MAX_BYTES=6*1024*1024;
const SUPPORT_ACCEPT=".pdf,.jpg,.jpeg,.png,.webp,.heic,.heif,.doc,.docx";
const SUPPORT_ALLOWED_TYPES=new Set(["application/pdf","image/jpeg","image/png","image/webp","image/heic","image/heif","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const CERT_PERIOD_OPTIONS=[{label:"Último mes",months:1},{label:"Últimos 3 meses",months:3},{label:"Últimos 6 meses",months:6},{label:"Último año",months:12},{label:"Otro período",months:null}];
const fmtB=bytes=>{const n=Number(bytes||0);if(!Number.isFinite(n)||n<=0)return"0 B";if(n<1024)return`${n} B`;if(n<1024*1024)return`${(n/1024).toFixed(1)} KB`;return`${(n/(1024*1024)).toFixed(1)} MB`;};
const createEmptyEventualIncome=()=>({amount:"",concept:""});
const normalizeMonthInput=value=>String(value||"").replace(/\D/g,"").slice(0,2);
const getCertifiedMonths=(period,customMonths)=>{const option=CERT_PERIOD_OPTIONS.find(item=>item.label===period);if(option?.months)return option.months;return Number(normalizeMonthInput(customMonths))||0;};
const buildCertifiedPeriodLabel=(period,months)=>{if(!period)return"";if(period==="Otro período"&&months>0)return`Otro período (${months} ${months===1?"mes":"meses"})`;return period;};
const sanitizeEventualIncomeRows=rows=>(Array.isArray(rows)?rows:[]).map(row=>({amount:String(row?.amount||""),concept:String(row?.concept||"").trim()}));
const getFilledEventualIncomeRows=rows=>sanitizeEventualIncomeRows(rows).filter(row=>pN(row.amount)>0&&row.concept);
const hasIncompleteEventualIncomeRows=rows=>sanitizeEventualIncomeRows(rows).some(row=>(pN(row.amount)>0&&!row.concept)||(!pN(row.amount)&&row.concept));
const normalizeColombianMobileNumber=value=>{const digits=onlyDigits(value);if(!digits)return"";if(digits.startsWith("57")&&digits.length===12)return digits.slice(2);if(digits.startsWith("0057")&&digits.length===14)return digits.slice(4);if(digits.startsWith("0")&&digits.length===11)return digits.slice(1);return digits.length>10?digits.slice(-10):digits;};
const isValidColombianMobileNumber=value=>/^3\d{9}$/.test(normalizeColombianMobileNumber(value));
const CERT_ROUTE="/certificacion";
const CERT_ROUTE_ALIASES=new Set([CERT_ROUTE,"/certificacion-de-ingresos"]);
const ADMIN_ROUTE="/admin/certificaciones";
const ADMIN_ROUTE_ALIASES=new Set([ADMIN_ROUTE,"/admin"]);
const VERIFY_ROUTE="/verificar-certificado";
const VERIFY_ROUTE_ALIASES=new Set([VERIFY_ROUTE,"/verificar-certificacion"]);
const PAYMENT_ROUTE="/pago-solicitud";
const PAYMENT_ROUTE_ALIASES=new Set([PAYMENT_ROUTE,"/pagar-solicitud"]);
const PAYMENTS_PORTAL_ROUTE="/portal-pagos";
const PAYMENTS_PORTAL_ROUTE_ALIASES=new Set([PAYMENTS_PORTAL_ROUTE,"/pagos","/portal-de-pagos"]);
const CLIENT_PORTAL_ROUTE="/portal-clientes";
const CLIENT_PORTAL_ROUTE_ALIASES=new Set([CLIENT_PORTAL_ROUTE,"/sistema-clientes","/clientes-portal"]);
const OPEN_CERT_FORM_EVENT="contarae:open-certification-form";
const SITE_URL="https://contarae.com";
const CERT_DELIVERY_PROMISE="Entrega promedio en unas 2 horas hábiles si cuenta con todos los soportes completos.";
const CERTIFICATION_SUPPORT_ROUTES=[
  {
    path:"/certificado-de-ingresos-contador-publico",
    sectionId:"certificado-contador-publico",
    metaTitle:"Certificado de ingresos firmado por Contador Público | CONTARAE",
    metaDescription:"Certificado de ingresos por contador público en Colombia. Entrega promedio en 2 horas hábiles con soportes completos y pago confirmado.",
    badge:"CERTIFICADO FIRMADO POR CONTADOR",
    title:"Certificado de ingresos firmado por Contador Público",
    intro:"Este documento permite acreditar ingresos ante terceros cuando se requiere una certificación profesional sustentada en soportes verificables. En CONTARAE se emite con revisión previa, firma de Contador Público y entrega digital. Si cuenta con todos los soportes completos, el certificado suele entregarse en promedio en unas 2 horas hábiles.",
    intent:"Ideal para personas naturales que necesitan demostrar ingresos ante bancos, inmobiliarias, embajadas, concesionarios, procesos de contratación o entidades privadas.",
    cards:[
      ["Qué certifica","El nivel de ingresos de una persona durante un período determinado, indicando el origen de los ingresos y los valores certificados con base en documentación soporte."],
      ["Quién lo firma","Un Contador Público con tarjeta profesional, en ejercicio de las facultades reconocidas por la Ley 43 de 1990 para dar fe pública en actos propios de la profesión."],
      ["Qué debe aportar el cliente","Soportes coherentes con los ingresos reportados: desprendibles, contratos, facturas, extractos, certificaciones, comprobantes de pago u otros documentos verificables."],
      ["Cómo se entrega","En PDF, listo para presentar ante la entidad solicitante, con datos del cliente, período certificado, valores en números y letras, firma profesional y datos de validación."],
      ["Tiempo estimado","Cuando el pago está confirmado y los soportes están completos, la entrega promedio es de unas 2 horas dentro de horario hábil o laboral."]
    ],
    checklist:["Defina ante quién presentará el certificado.","Indique el período que le exige la entidad.","Relacione sus ingresos recurrentes y, si aplica, eventuales.","Adjunte soportes claros y legibles para agilizar la revisión."],
    faqs:[
      ["¿Certificado de ingresos y certificación de ingresos son lo mismo?","En la práctica suelen usarse como equivalentes. Lo importante es que el documento esté firmado por Contador Público y que los ingresos certificados tengan soporte verificable."],
      ["¿Cuánto tarda un certificado de ingresos firmado por contador?","Si la solicitud está pagada y cuenta con todos los soportes completos, la entrega promedio es de unas 2 horas dentro de horario hábil o laboral. Si faltan documentos o se requieren aclaraciones, el tiempo puede extenderse."],
      ["¿Cuánto cuesta un certificado de ingresos firmado por contador en Colombia?","El valor depende del rango de ingresos y del alcance de la revisión. En CONTARAE el valor se informa antes del pago para que pueda decidir con claridad."],
      ["¿Sirve si soy empleado?","Sí. Puede soportarse con desprendibles de nómina, certificaciones laborales, certificados de ingresos y retenciones u otros documentos emitidos por el empleador."],
      ["¿Sirve si soy independiente?","Sí. En ese caso se revisan soportes como contratos, facturas, extractos bancarios, comprobantes de pago y evidencia de la actividad económica."]
    ]
  },
  {
    path:"/certificado-de-ingresos-para-independientes",
    sectionId:"certificado-independientes",
    metaTitle:"Certificado de ingresos para independientes en Colombia | CONTARAE",
    metaDescription:"Certificado de ingresos para independientes, contratistas y freelancers. Entrega promedio en 2 horas hábiles con soportes completos.",
    badge:"INDEPENDIENTES Y CONTRATISTAS",
    title:"Certificación de ingresos para independientes",
    intro:"Cuando una persona trabaja por cuenta propia, no siempre cuenta con desprendibles de nómina. Por eso la certificación debe construirse a partir de soportes que demuestren la realidad económica de sus ingresos. Si los documentos están completos, el certificado puede recibirse en promedio en unas 2 horas hábiles.",
    intent:"Pensada para contratistas, freelancers, comerciantes, profesionales independientes, rentistas y personas con ingresos variables que necesitan acreditar capacidad económica.",
    cards:[
      ["Soportes frecuentes","Contratos de prestación de servicios, facturas, cuentas de cobro, extractos bancarios, certificados de retención, comprobantes de pago o evidencia de la actividad económica."],
      ["Ingreso mensual recurrente","Se identifica el ingreso que se repite de manera habitual y se expresa como valor mensual certificado para el período solicitado."],
      ["Ingresos eventuales","Si existieron ingresos no fijos o extraordinarios, pueden incluirse de forma separada, dejando claro que no hacen parte del ingreso mensual recurrente."],
      ["Revisión profesional","Antes de emitir, se valida que la información reportada sea coherente con los soportes y con el destino del trámite."],
      ["Entrega rápida","Con soportes completos y pago confirmado, la entrega promedio es de unas 2 horas hábiles, ideal si el trámite es urgente."]
    ],
    checklist:["Tenga claro el período que quiere certificar.","Organice extractos o comprobantes por mes.","Separe ingresos habituales de ingresos eventuales.","Indique si la entidad exige algún texto o formato especial."],
    faqs:[
      ["¿Cómo comprobar ingresos si soy independiente?","Puede hacerlo con una certificación de ingresos firmada por Contador Público, soportada con extractos, contratos, facturas, cuentas de cobro, comprobantes de pago u otros documentos que demuestren su actividad."],
      ["¿Cuánto tarda la certificación para independientes?","Con soportes completos y pago confirmado, la entrega promedio es de unas 2 horas dentro de horario hábil o laboral. Si falta información, primero se solicitan aclaraciones."],
      ["¿Puedo certificar ingresos si me pagan por transferencia?","Sí, siempre que los movimientos puedan relacionarse razonablemente con la actividad económica o el servicio prestado."],
      ["¿Puedo incluir ventas ocasionales?","Sí, pero deben presentarse como ingresos eventuales si no son fijos ni periódicos."],
      ["¿Se puede certificar un promedio mensual?","Sí, siempre que el período y los soportes permitan explicar técnicamente ese promedio."]
    ]
  },
  {
    path:"/certificado-de-ingresos-para-banco",
    sectionId:"certificado-banco",
    metaTitle:"Certificado de ingresos para banco, crédito o préstamo | CONTARAE",
    metaDescription:"Certificado de ingresos para banco, crédito o préstamo. Entrega promedio en 2 horas hábiles con soportes completos y pago confirmado.",
    badge:"BANCOS Y ENTIDADES FINANCIERAS",
    title:"Certificado de ingresos para banco o crédito",
    intro:"Los bancos suelen solicitar un documento claro para evaluar capacidad de pago. La certificación debe mostrar ingresos verificables, período certificado y destino de presentación. Cuando los soportes están completos, puede recibir el documento en promedio en unas 2 horas hábiles.",
    intent:"Útil para créditos de libre inversión, tarjetas, estudios financieros, compra de vehículo, crédito hipotecario o solicitudes de productos bancarios.",
    cards:[
      ["Capacidad de pago","El documento ayuda a presentar de forma ordenada los ingresos acreditados para que la entidad pueda analizarlos dentro de su propio proceso."],
      ["Período certificado","Se debe indicar si la entidad pide último mes, tres meses, seis meses, año completo u otro período específico."],
      ["Claridad de valores","Los valores se expresan en números y letras, separando ingresos recurrentes e ingresos eventuales cuando existan."],
      ["Alcance profesional","La certificación no reemplaza el análisis de crédito del banco; sirve como soporte profesional de la información suministrada."],
      ["Trámites urgentes","Si el banco le pidió el certificado con urgencia, la revisión puede avanzar en promedio en unas 2 horas hábiles cuando ya están todos los soportes."]
    ],
    checklist:["Confirme el requisito exacto del banco.","Defina el producto financiero para el que se presenta.","Adjunte soportes del período solicitado.","Revise que sus datos personales coincidan con los documentos."],
    faqs:[
      ["¿Sirve como justificante de ingresos para banco?","Sí. Puede servir como justificante o soporte de ingresos para banco, crédito, préstamo, tarjeta o estudio financiero, sujeto a las políticas internas de la entidad."],
      ["¿Cuánto tarda si lo necesito para un crédito urgente?","Con pago confirmado y soportes completos, la entrega promedio es de unas 2 horas dentro de horario hábil o laboral."],
      ["¿El banco está obligado a aceptar el certificado?","La aceptación depende de la política interna de cada entidad, pero una certificación clara y soportada reduce observaciones."],
      ["¿Sirve para crédito hipotecario?","Puede servir como soporte dentro del estudio, siempre que cumpla los requisitos solicitados por la entidad financiera."],
      ["¿Puede incluir varios tipos de ingresos?","Sí. Pueden presentarse varias fuentes recurrentes y, si aplica, ingresos eventuales separados."]
    ]
  },
  {
    path:"/certificado-de-ingresos-para-arrendamiento",
    sectionId:"certificado-arrendamiento",
    metaTitle:"Certificado de ingresos para arriendo o inmobiliaria | CONTARAE",
    metaDescription:"Certificado de ingresos para arriendo, inmobiliaria o aseguradora. Entrega promedio en 2 horas hábiles con soportes completos.",
    badge:"ARRIENDOS E INMOBILIARIAS",
    title:"Certificado de ingresos para arrendamiento",
    intro:"En procesos de arriendo, inmobiliarias y aseguradoras suelen pedir soporte de ingresos para evaluar capacidad de pago del canon. La certificación debe ser precisa, verificable y fácil de presentar. Si cuenta con soportes completos, puede recibirla en promedio en unas 2 horas hábiles.",
    intent:"Aplica para solicitudes ante inmobiliarias, aseguradoras de arrendamiento, propietarios directos, administraciones o estudios de arrendatario.",
    cards:[
      ["Destino del trámite","Conviene indicar si será presentado ante inmobiliaria, aseguradora, propietario o administración para ajustar el texto del documento."],
      ["Ingresos requeridos","Se certifican los ingresos demostrables del solicitante según el período exigido por quien evalúa el arriendo."],
      ["Soportes útiles","Desprendibles, contratos, extractos, certificaciones, facturas o comprobantes que evidencien ingresos estables o demostrables."],
      ["Presentación formal","El PDF queda preparado para entregar digitalmente, con datos del solicitante, valores certificados y firma profesional."],
      ["Respuesta ágil","Para trámites de arriendo urgentes, la entrega promedio es de unas 2 horas hábiles si el pago y los soportes están completos."]
    ],
    checklist:["Confirme el canon o trámite para el que aplica.","Identifique el período que pide la inmobiliaria.","Adjunte soportes recientes.","Informe si la entidad exige formato propio."],
    faqs:[
      ["¿Sirve para arrendar vivienda?","Sí. Puede usarse como soporte de ingresos para procesos de arriendo ante inmobiliarias, aseguradoras o propietarios directos."],
      ["¿Cuánto tarda si la inmobiliaria me lo pidió hoy?","Con soportes completos y pago confirmado, la entrega promedio es de unas 2 horas dentro de horario hábil o laboral."],
      ["¿Sirve para aseguradora de arrendamiento?","Sí, puede usarse como soporte, aunque la aprobación final depende de la aseguradora."],
      ["¿Puedo solicitarla si soy codeudor?","Sí, si necesita acreditar ingresos propios dentro del estudio del arrendamiento."],
      ["¿Qué pasa si tengo varios ingresos pequeños?","Se pueden presentar por separado o en lista, según la cantidad y naturaleza de las fuentes."]
    ]
  },
  {
    path:"/comprar-certificado-de-ingresos",
    sectionId:"comprar-certificado-ingresos",
    metaTitle:"Solicitar certificado de ingresos en línea | CONTARAE",
    metaDescription:"Solicite su certificado de ingresos en línea. Pago seguro y entrega promedio en 2 horas hábiles con soportes completos.",
    badge:"SOLICITUD EN LÍNEA",
    title:"Solicitar certificado de ingresos en línea",
    intro:"En CONTARAE puede iniciar la solicitud en línea, pagar de forma segura y recibir seguimiento por referencia mientras se revisan los soportes y se prepara la certificación. Si la documentación está completa, la entrega promedio es de unas 2 horas hábiles.",
    intent:"Ruta pensada para quien ya sabe que necesita una certificación de ingresos y quiere iniciar el proceso sin desplazamientos.",
    cards:[
      ["Formulario guiado","El sistema solicita datos personales, destino, período, ingresos recurrentes, ingresos eventuales y soportes disponibles."],
      ["Pago seguro","El pago se procesa mediante Wompi y la solicitud queda registrada para revisión profesional una vez se confirma la transacción."],
      ["Revisión antes de emitir","El equipo revisa que los ingresos reportados cuenten con soportes suficientes y coherentes antes de generar el PDF."],
      ["Entrega digital","La certificación se entrega por medios digitales y puede validarse con los datos incorporados en el documento."],
      ["Tiempo promedio","Con soportes completos y pago confirmado, la entrega suele tomar unas 2 horas dentro de horario hábil o laboral."]
    ],
    checklist:["Complete el formulario con datos reales.","Use un celular colombiano válido para el pago si elige Nequi.","Adjunte soportes si ya los tiene disponibles.","Revise el resumen antes de pagar."],
    faqs:[
      ["¿Puedo pagar en línea?","Sí. La página permite pagar por Wompi con los medios habilitados en la pasarela."],
      ["¿Cuánto tarda después de pagar?","Si el pago queda confirmado y los soportes están completos, la entrega promedio es de unas 2 horas dentro de horario hábil o laboral."],
      ["¿Qué pasa después del pago?","La solicitud entra a revisión profesional y el equipo puede pedir soportes o aclaraciones si son necesarios."],
      ["¿Puedo iniciar si todavía no tengo todos los soportes?","Sí, pero la emisión depende de que finalmente existan soportes suficientes para certificar responsablemente."]
    ]
  }
];
const normPath=p=>{if(!p)return"/";const c=p.replace(/\/+$/,"");return c||"/";};
const RENTA_CAMPAIGN_ID="renta-2026";
const RENTA_TAX_YEAR="2025";
const RENTA_FILING_YEAR="2026";
const RENTA_DUE_WINDOWS=[
  [[1,2],"2026-08-12","12 de agosto de 2026"],
  [[3,4],"2026-08-13","13 de agosto de 2026"],
  [[5,6],"2026-08-14","14 de agosto de 2026"],
  [[7,8],"2026-08-18","18 de agosto de 2026"],
  [[9,10],"2026-08-19","19 de agosto de 2026"],
  [[11,12],"2026-08-20","20 de agosto de 2026"],
  [[13,14],"2026-08-21","21 de agosto de 2026"],
  [[15,16],"2026-08-24","24 de agosto de 2026"],
  [[17,18],"2026-08-25","25 de agosto de 2026"],
  [[19,20],"2026-08-26","26 de agosto de 2026"],
  [[21,22],"2026-08-27","27 de agosto de 2026"],
  [[23,24],"2026-08-28","28 de agosto de 2026"],
  [[25,26],"2026-08-31","31 de agosto de 2026"],
  [[27,28],"2026-09-01","1 de septiembre de 2026"],
  [[29,30],"2026-09-02","2 de septiembre de 2026"],
  [[31,32],"2026-09-03","3 de septiembre de 2026"],
  [[33,34],"2026-09-04","4 de septiembre de 2026"],
  [[35,36],"2026-09-07","7 de septiembre de 2026"],
  [[37,38],"2026-09-08","8 de septiembre de 2026"],
  [[39,40],"2026-09-09","9 de septiembre de 2026"],
  [[41,42],"2026-09-10","10 de septiembre de 2026"],
  [[43,44],"2026-09-11","11 de septiembre de 2026"],
  [[45,46],"2026-09-14","14 de septiembre de 2026"],
  [[47,48],"2026-09-15","15 de septiembre de 2026"],
  [[49,50],"2026-09-16","16 de septiembre de 2026"],
  [[51,52],"2026-09-17","17 de septiembre de 2026"],
  [[53,54],"2026-09-18","18 de septiembre de 2026"],
  [[55,56],"2026-09-21","21 de septiembre de 2026"],
  [[57,58],"2026-09-22","22 de septiembre de 2026"],
  [[59,60],"2026-09-23","23 de septiembre de 2026"],
  [[61,62],"2026-09-24","24 de septiembre de 2026"],
  [[63,64],"2026-09-25","25 de septiembre de 2026"],
  [[65,66],"2026-09-28","28 de septiembre de 2026"],
  [[67,68],"2026-10-01","1 de octubre de 2026"],
  [[69,70],"2026-10-02","2 de octubre de 2026"],
  [[71,72],"2026-10-05","5 de octubre de 2026"],
  [[73,74],"2026-10-06","6 de octubre de 2026"],
  [[75,76],"2026-10-07","7 de octubre de 2026"],
  [[77,78],"2026-10-08","8 de octubre de 2026"],
  [[79,80],"2026-10-09","9 de octubre de 2026"],
  [[81,82],"2026-10-13","13 de octubre de 2026"],
  [[83,84],"2026-10-14","14 de octubre de 2026"],
  [[85,86],"2026-10-15","15 de octubre de 2026"],
  [[87,88],"2026-10-16","16 de octubre de 2026"],
  [[89,90],"2026-10-19","19 de octubre de 2026"],
  [[91,92],"2026-10-20","20 de octubre de 2026"],
  [[93,94],"2026-10-21","21 de octubre de 2026"],
  [[95,96],"2026-10-22","22 de octubre de 2026"],
  [[97,98],"2026-10-23","23 de octubre de 2026"],
  [[99,0],"2026-10-26","26 de octubre de 2026"]
];
const getRentaDueInfo=value=>{
  const digits=onlyDigits(value).slice(-2);
  if(digits.length!==2)return null;
  const num=parseInt(digits,10);
  const found=RENTA_DUE_WINDOWS.find(([[start,end]])=>start===99?digits==="99"||digits==="00":num>=start&&num<=end);
  return found?{lastTwoDigits:digits,estimatedDueDate:found[1],label:found[2]}:null;
};
const TOOL_ROUTES=[
  {
    path:"/debo-declarar-renta",
    aliases:["/debo-declarar-renta","/declarar-renta"],
    toolId:"tool-renta",
    sectionId:"tool-renta",
    metaTitle:"Consulta fecha y condiciones para declarar renta | CONTARAE",
    metaDescription:"Revise topes en UVT y pesos, consulte su fecha estimada de vencimiento y solicite orientación inicial para declaración de renta personas naturales.",
    heroBadge:"ANÁLISIS TRIBUTARIO",
    heroKicker:"TOPES, CONDICIONES Y FECHA DE VENCIMIENTO",
    heroTitle:"Consulta las condiciones para declarar renta y tu fecha estimada",
    heroDesc:"Guía interactiva para revisar topes tributarios en UVT y pesos colombianos, entender cada condición y ubicar la fecha estimada de presentación según los últimos dígitos del documento.",
    proof:["Topes en UVT y COP","Fecha estimada","Orientación inicial","Enfoque año gravable 2025"],
    highlights:[["Incluye","Condiciones por ingresos, patrimonio, compras, tarjetas, movimientos e IVA"],["Ideal para","Personas naturales que quieren revisar con calma antes del vencimiento"],["Resultado","Una guía para saber si conviene confirmar el caso con acompañamiento profesional"]], 
    audiences:["Asalariados","Independientes","Rentistas","Declarantes potenciales"],
    steps:["Revise las condiciones y topes vigentes","Marque las situaciones que podrían aplicar","Consulte su fecha estimada y solicite confirmación inicial"],
    infoTitle:"¿Qué orienta esta guía?",
    infoSub:"USO ORIENTATIVO",
    infoCards:[["Topes tributarios frecuentes","Presenta las condiciones principales en UVT y pesos colombianos para el año gravable 2025."],["Fecha estimada","Permite ubicar el vencimiento aproximado según los dos últimos dígitos del documento o NIT."],["Importante","Declarar renta no siempre significa pagar impuesto. La obligación real depende de soportes, residencia fiscal, responsabilidades y normativa aplicable."]],
    stageKicker:"ANÁLISIS TRIBUTARIO",
    stageTitle:"Guía para revisar condiciones y vencimiento de renta",
    stageDesc:"Revise los topes en UVT y pesos, entienda qué puede sumar en cada condición y consulte su fecha estimada de presentación.",
    supportText:"Si identifica una condición o no está seguro, CONTARAE puede confirmar su caso con soportes, topes y contexto tributario real."
  },
  {
    path:"/retencion-en-la-fuente",
    aliases:["/retencion-en-la-fuente","/calculadora-retencion"],
    toolId:"tool-retencion",
    sectionId:"tool-retencion",
    metaTitle:"Retención en la fuente | CONTARAE",
    metaDescription:"Estime la retención en la fuente aplicable con deducciones y rentas exentas, comparando escenarios 2025 y 2026.",
    heroBadge:"CÁLCULO MENSUAL",
    heroKicker:"PROYECCIÓN DE RETENCIÓN PARA PERSONAS NATURALES",
    heroTitle:"Calcule la retención en la fuente con una lectura clara y útil",
    heroDesc:"Herramienta para estimar la retención mensual sobre ingresos laborales, considerando deducciones, rentas exentas y diferencia de UVT entre 2025 y 2026.",
    proof:["Comparativo 2025-2026","Cálculo inmediato","Deducciones aplicables","Lectura clara"],
    highlights:[["Incluye","Deducciones, dependientes, salud prepagada y rentas exentas"],["Útil para","Trabajadores, empleadores y responsables de nómina"],["Resultado","Una estimación rápida para validar cuánto podría retenerse cada mes"]],
    audiences:["Empleados","Áreas de nómina","Empresas","Profesionales independientes"],
    steps:["Ingrese su salario e información base","Ajuste deducciones y rentas exentas","Compare el resultado estimado entre 2025 y 2026"],
    infoTitle:"¿Cuándo conviene usarla?",
    infoSub:"RETENCIÓN MENSUAL",
    infoCards:[["Planeación laboral","Sirve para anticipar el efecto de la retención en el ingreso neto mensual del trabajador."],["Control de nómina","Ayuda a validar escenarios de cálculo antes de cerrar nómina o revisar liquidaciones internas."],["Importante","El resultado es una aproximación técnica. La aplicación real depende de la depuración final y de la situación particular del contribuyente."]],
    stageKicker:"CÁLCULO MENSUAL",
    stageTitle:"Estimador de retención en la fuente",
    stageDesc:"Obtenga una estimación rápida y compare años gravables para tomar decisiones de planeación o validación mensual.",
    supportText:"Si quiere validar el cálculo definitivo o revisar un caso especial, CONTARAE puede apoyarle con una revisión técnica."
  },
  {
    path:"/planilla-independientes",
    aliases:["/planilla-independientes","/seguridad-social-independientes"],
    toolId:"tool-planilla",
    sectionId:"tool-planilla",
    metaTitle:"Planilla independientes | CONTARAE",
    metaDescription:"Calcule salud, pensión y ARL para trabajadores independientes y contratistas con una simulación clara del IBC y el total mensual.",
    heroBadge:"SEGURIDAD SOCIAL",
    heroKicker:"SIMULADOR PARA INDEPENDIENTES Y CONTRATISTAS",
    heroTitle:"Liquide su planilla de independientes con una vista clara del IBC y del total a pagar",
    heroDesc:"Herramienta orientativa para estimar aportes a salud, pensión y ARL según su ingreso mensual y clase de riesgo, con una lectura simple del valor aproximado a pagar.",
    proof:["IBC visible","ARL por nivel de riesgo","Total mensual","Lectura simple"],
    highlights:[["Calcula","Salud, pensión y ARL sobre el IBC correspondiente"],["Ideal para","Contratistas, independientes y quienes necesitan una referencia antes de pagar"],["Resultado","Un valor estimado para planear caja y validar aportes mensuales"]],
    audiences:["Contratistas","Prestadores de servicios","Independientes","Consultores"],
    steps:["Ingrese ingreso y clase de riesgo","Revise el IBC calculado","Consulte el total estimado de aportes mensuales"],
    infoTitle:"¿Qué le aporta esta herramienta?",
    infoSub:"APORTES MENSUALES",
    infoCards:[["Planeación","Le permite anticipar el valor de la planilla antes de ingresar al operador de pago."],["Validación","Sirve para revisar si el aporte mensual luce consistente con el ingreso reportado."],["Importante","El pago definitivo puede variar según reglas vigentes, novedad laboral y validaciones del operador PILA."]],
    stageKicker:"SEGURIDAD SOCIAL",
    stageTitle:"Liquidador de planilla para independientes",
    stageDesc:"Simule el valor aproximado de salud, pensión y ARL con una vista clara del IBC y del total estimado a pagar cada mes.",
    supportText:"Si necesita apoyo con seguridad social o revisión de bases de cotización, podemos acompañarle caso por caso."
  },
  {
    path:"/liquidador-de-nomina",
    aliases:["/liquidador-de-nomina","/nomina"],
    toolId:"tool-nomina",
    sectionId:"tool-nomina",
    metaTitle:"Liquidador de nómina | CONTARAE",
    metaDescription:"Calcule devengado, deducciones, prestaciones, parafiscales y costo total del trabajador en una sola herramienta.",
    heroBadge:"GESTIÓN LABORAL",
    heroKicker:"DEVENGADO, DEDUCCIONES Y COSTO EMPRESA",
    heroTitle:"Calcule la nómina y visualice el costo laboral completo de cada trabajador",
    heroDesc:"Herramienta diseñada para estimar salario, deducciones, prestaciones, aportes y costo total del empleado con una lectura clara para gestión laboral y administrativa.",
    proof:["Devengado y neto","Prestaciones","Parafiscales","Costo empresa"],
    highlights:[["Incluye","Deducciones, prestaciones sociales, seguridad social y costo total"],["Útil para","Empresas, empleadores y responsables de talento humano"],["Resultado","Una lectura práctica para validar liquidaciones y proyección de costos"]],
    audiences:["Empresas","Empleadores","Talento humano","Emprendedores con personal"],
    steps:["Ingrese salario y variables básicas","Revise deducciones y prestaciones","Analice el costo total del trabajador"],
    infoTitle:"¿Para qué sirve?",
    infoSub:"GESTIÓN DE NÓMINA",
    infoCards:[["Control interno","Sirve para validar nóminas, revisar costos y anticipar obligaciones laborales."],["Planeación","Ayuda a estimar cuánto le cuesta realmente un colaborador a la empresa."],["Importante","La liquidación definitiva puede depender de novedades, días trabajados y condiciones particulares del vínculo laboral."]],
    stageKicker:"GESTIÓN LABORAL",
    stageTitle:"Liquidador integral de nómina",
    stageDesc:"Calcule de forma rápida el neto del trabajador y el costo completo para la empresa con un esquema claro y profesional.",
    supportText:"Si quiere validar nómina real, prestaciones o liquidaciones especiales, CONTARAE puede revisarlo con criterio técnico."
  },
  {
    path:"/liquidador-de-iva",
    aliases:["/liquidador-de-iva","/iva"],
    toolId:"tool-iva",
    sectionId:"tool-iva",
    metaTitle:"Liquidador de IVA | CONTARAE",
    metaDescription:"Obtenga el IVA correspondiente sobre un valor base y visualice subtotal y total de la operación para ventas, facturación y cotizaciones.",
    heroBadge:"FACTURACIÓN Y VENTAS",
    heroKicker:"CÁLCULO RÁPIDO DE IVA",
    heroTitle:"Calcule IVA, subtotal y total de una operación en segundos",
    heroDesc:"Herramienta práctica para ventas, cotizaciones y facturación. Ingrese el valor base y obtenga el cálculo del IVA con una presentación simple y clara.",
    proof:["Subtotal y total","Uso comercial","Respuesta inmediata","Formato claro"],
    highlights:[["Calcula","IVA sobre el valor base de la operación"],["Útil para","Ventas, cotizaciones, facturación y validaciones rápidas"],["Resultado","Subtotal, IVA y total con lectura inmediata"]],
    audiences:["Comercios","Prestadores de servicios","Áreas comerciales","Facturación"],
    steps:["Ingrese el valor base","Revise el IVA calculado","Use el resultado para cotizar o validar una operación"],
    infoTitle:"¿Cuándo conviene usarlo?",
    infoSub:"IVA Y FACTURACIÓN",
    infoCards:[["Cotizaciones","Útil para presentar valores netos y totales con claridad ante clientes o proveedores."],["Validación comercial","Permite revisar rápidamente si un total facturado es consistente con la base gravable."],["Importante","Es una herramienta operativa. La aplicación tributaria real depende del régimen, tarifa y naturaleza de la operación."]],
    stageKicker:"FACTURACIÓN Y VENTAS",
    stageTitle:"Herramienta para liquidar IVA",
    stageDesc:"Obtenga el IVA correspondiente sobre el valor base de una operación y visualice el total de manera clara para uso comercial y contable.",
    supportText:"Si necesita validar IVA, facturación o estructura de precios, podemos revisar su caso con enfoque tributario."
  },
  {
    path:"/precio-antes-de-iva",
    aliases:["/precio-antes-de-iva","/precio-sin-iva"],
    toolId:"tool-precio",
    sectionId:"tool-precio",
    metaTitle:"Precio antes de IVA | CONTARAE",
    metaDescription:"Conozca el valor base de un producto o servicio a partir del precio final con IVA incluido.",
    heroBadge:"CONVERSIÓN DE VALORES",
    heroKicker:"PRECIO FINAL A BASE GRAVABLE",
    heroTitle:"Obtenga el precio antes de IVA a partir del valor final cobrado",
    heroDesc:"Herramienta útil para descomponer precios con IVA incluido y conocer la base gravable real de un producto o servicio antes de impuestos.",
    proof:["Base gravable","Uso comercial","Conversión inmediata","Apoyo en márgenes"],
    highlights:[["Calcula","El valor base antes de IVA a partir del precio final"],["Útil para","Análisis de precios, márgenes, cotizaciones y validaciones comerciales"],["Resultado","Separación rápida entre base gravable e impuesto"]],
    audiences:["Empresas","Comercios","Áreas comerciales","Emprendedores"],
    steps:["Ingrese el valor final con IVA","Obtenga la base antes del impuesto","Use el dato para análisis de precio o margen"],
    infoTitle:"¿Por qué es útil?",
    infoSub:"PRECIO BASE",
    infoCards:[["Análisis de margen","Ayuda a entender el precio real antes del impuesto para evaluar rentabilidad."],["Validación comercial","Útil cuando recibe un precio final y necesita identificar rápidamente la base gravable."],["Importante","La lectura es operativa y asume una tarifa general; revise particularidades tributarias cuando el producto o servicio tenga tratamiento especial."]],
    stageKicker:"CONVERSIÓN DE VALORES",
    stageTitle:"Precio antes de IVA",
    stageDesc:"Obtenga la base gravable a partir del valor final con IVA incluido y úselo como apoyo para cotizaciones, análisis comercial o control interno.",
    supportText:"Si quiere revisar estructura de precios o impacto tributario en sus ventas, CONTARAE puede acompañarle."
  }
];
const SERVICE_SEO_ROUTES=[
  {
    path:"/servicios-contables",
    sectionId:"servicios-contables",
    metaTitle:"Servicios contables en Colombia | CONTARAE",
    metaDescription:"Servicios contables, tributarios y financieros para personas naturales, independientes, emprendedores y pymes en Colombia, con atención virtual y soporte personalizado.",
    badge:"SERVICIOS CONTABLES",
    title:"Servicios contables, tributarios y financieros para personas y empresas",
    intro:"CONTARAE acompaña a personas naturales, independientes, emprendedores y pymes con soluciones contables claras, digitales y orientadas al cumplimiento.",
    intent:"Esta ruta reúne los servicios principales: contabilidad mensual, asesoría tributaria, nómina, certificaciones contables, facturación electrónica, creación de empresa y gestión financiera.",
    serviceType:"Servicios contables",
    ctaLabel:"Solicitar asesoría contable",
    whatsapp:"Hola CONTARAE, quiero recibir asesoría sobre sus servicios contables.",
    highlights:[["Atención","Virtual para Colombia, con foco en Bogotá y procesos digitales"],["Enfoque","Cumplimiento contable, tributario, laboral y financiero"],["Ideal para","Personas naturales, independientes, emprendedores y pymes"]],
    cards:[
      ["Contabilidad integral","Registro y organización de operaciones, conciliaciones, estados financieros y acompañamiento para mantener la información contable al día."],
      ["Gestión tributaria","Revisión de obligaciones ante la DIAN, declaraciones, retenciones, IVA, renta, información exógena y planeación tributaria."],
      ["Soporte operativo","Acompañamiento por WhatsApp y correo para resolver inquietudes, recibir documentos y hacer seguimiento a solicitudes."]
    ],
    checklist:["Defina el tipo de servicio que necesita.","Reúna documentos básicos de identificación, RUT, soportes o información financiera.","Cuéntenos si necesita atención puntual o acompañamiento mensual.","Reciba una propuesta según alcance, volumen de operaciones y urgencia."],
    faqs:[
      ["¿Puedo contratar un servicio puntual?","Sí. Puede contratar certificaciones, declaraciones, trámites, revisiones o asesorías sin tomar un plan mensual."],
      ["¿Atienden fuera de Bogotá?","Sí. La atención es virtual para Colombia y permite gestionar documentos, pagos y seguimiento por canales digitales."],
      ["¿El costo es fijo para todos los servicios?","No. En servicios personalizados el valor depende del alcance, complejidad, urgencia y volumen de información."]
    ]
  },
  {
    path:"/planes-contables",
    sectionId:"planes-contables",
    metaTitle:"Planes contables mensuales para empresas | CONTARAE",
    metaDescription:"Planes contables mensuales para independientes, microempresas y pymes: contabilidad, impuestos, nómina, estados financieros y soporte permanente.",
    badge:"PLANES MENSUALES",
    title:"Planes contables mensuales para organizar y controlar su empresa",
    intro:"Los planes contables de CONTARAE están pensados para negocios que necesitan acompañamiento permanente, información ordenada y control sobre sus obligaciones.",
    intent:"Los valores son de referencia y pueden ajustarse según volumen de documentos, número de empleados, obligaciones tributarias, periodicidad de reportes y nivel de acompañamiento requerido.",
    serviceType:"Planes contables",
    ctaLabel:"Consultar plan contable",
    whatsapp:"Hola CONTARAE, quiero recibir información sobre los planes contables mensuales.",
    highlights:[["Desde","Plan Emprendedor desde $500.000/mes"],["Escalable","Emprendedor, Empresarial y Premium"],["Incluye","Contabilidad, impuestos, reportes y soporte según alcance"]],
    cards:[
      ["Plan Emprendedor","Pensado para independientes y microempresas que requieren declaraciones básicas, conciliación bancaria, estados financieros trimestrales y soporte permanente."],
      ["Plan Empresarial","Diseñado para pymes que necesitan registro contable mensual, nómina, seguridad social, información exógena, KPIs y planeación tributaria."],
      ["Plan Premium","Orientado a empresas en crecimiento que requieren control de gestión, dashboard financiero, análisis de costos y reuniones gerenciales periódicas."]
    ],
    checklist:["Comparta el tipo de empresa y actividad económica.","Indique número aproximado de documentos mensuales.","Informe si tiene empleados, IVA, retención o información exógena.","Reciba una propuesta ajustada al alcance real del negocio."],
    faqs:[
      ["¿Los precios son definitivos?","Son valores de referencia. El valor final se define después de conocer el volumen de información y las obligaciones de la empresa."],
      ["¿Puedo cambiar de plan después?","Sí. El plan puede ajustarse si crece la operación, aumentan documentos o cambian las obligaciones."],
      ["¿Incluye declaraciones tributarias?","Depende del plan y del alcance pactado. En la propuesta se deja claro qué declaraciones y reportes quedan incluidos."]
    ]
  },
  {
    path:"/contabilidad-para-pymes",
    sectionId:"contabilidad-pymes",
    metaTitle:"Contabilidad para pymes en Colombia | CONTARAE",
    metaDescription:"Contabilidad para pymes y microempresas en Colombia: registros, conciliaciones, impuestos, estados financieros, nómina y acompañamiento gerencial.",
    badge:"PYMES Y MICROEMPRESAS",
    title:"Contabilidad para pymes que necesitan claridad, control y cumplimiento",
    intro:"Una pyme necesita información contable útil, no solo registros para cumplir. CONTARAE estructura la contabilidad para que el negocio pueda tomar mejores decisiones.",
    intent:"Acompañamos empresas pequeñas y en crecimiento con registro contable, conciliaciones, impuestos, nómina, reportes e indicadores que permitan entender la operación.",
    serviceType:"Contabilidad para pymes",
    ctaLabel:"Solicitar contabilidad para mi pyme",
    whatsapp:"Hola CONTARAE, quiero organizar la contabilidad de mi pyme.",
    highlights:[["Control","Conciliaciones y registros mensuales"],["Decisión","Estados financieros e indicadores claros"],["Cumplimiento","Soporte tributario, laboral y contable"]],
    cards:[
      ["Información al día","Organización de documentos, registros contables, conciliaciones bancarias y revisión de soportes para evitar atrasos."],
      ["Cumplimiento tributario","Acompañamiento en IVA, retención en la fuente, renta, ICA e información exógena según las obligaciones del negocio."],
      ["Lectura gerencial","Reportes financieros, indicadores, análisis de costos y recomendaciones para mejorar control y rentabilidad."]
    ],
    checklist:["Indique la actividad económica y tamaño de la empresa.","Comparta RUT, Cámara de Comercio y obligaciones actuales.","Informe volumen de facturas, bancos, empleados y documentos mensuales.","Definamos una propuesta mensual según la operación real."],
    faqs:[
      ["¿Pueden recibir documentos digitales?","Sí. El proceso puede manejarse virtualmente mediante archivos digitales y canales de seguimiento."],
      ["¿Sirve para empresas recién creadas?","Sí. Es ideal iniciar ordenado desde el comienzo para evitar reprocesos tributarios y contables."],
      ["¿Incluye estados financieros?","Sí, según el alcance contratado pueden prepararse estados financieros periódicos y reportes gerenciales."]
    ]
  },
  {
    path:"/asesoria-tributaria",
    sectionId:"asesoria-tributaria",
    metaTitle:"Asesoría tributaria en Colombia | CONTARAE",
    metaDescription:"Asesoría tributaria para personas naturales, independientes y empresas: DIAN, renta, IVA, retención en la fuente, ICA, información exógena y planeación.",
    badge:"ASESORÍA TRIBUTARIA",
    title:"Asesoría tributaria para cumplir mejor y tomar decisiones con criterio",
    intro:"La asesoría tributaria ayuda a entender obligaciones, riesgos, plazos y alternativas antes de presentar declaraciones o tomar decisiones que impacten impuestos.",
    intent:"Revisamos casos de personas naturales, independientes, emprendedores y empresas frente a DIAN, renta, IVA, retenciones, ICA, información exógena y planeación tributaria.",
    serviceType:"Asesoría tributaria",
    ctaLabel:"Solicitar asesoría tributaria",
    whatsapp:"Hola CONTARAE, necesito asesoría tributaria.",
    highlights:[["Temas","Renta, IVA, retefuente, ICA e información exógena"],["Uso","Revisión preventiva o solución de casos puntuales"],["Resultado","Recomendaciones claras según soportes y normatividad"]],
    cards:[
      ["Diagnóstico tributario","Revisión de obligaciones, topes, declaraciones, soportes y posibles inconsistencias antes de presentar o corregir."],
      ["Planeación y prevención","Orientación para anticipar efectos tributarios, organizar soportes y reducir riesgos por errores u omisiones."],
      ["Acompañamiento DIAN","Apoyo en requerimientos, correcciones, consultas y revisión de información reportada o por reportar."]
    ],
    checklist:["Describa el caso tributario que desea revisar.","Comparta RUT, declaraciones, certificados o soportes relevantes.","Indique fechas, vencimientos o comunicaciones recibidas.","Reciba una orientación técnica y un plan de acción."],
    faqs:[
      ["¿Atienden personas naturales?","Sí. Revisamos declaración de renta, topes, patrimonio, soportes, deducciones y obligaciones ante la DIAN."],
      ["¿Pueden revisar una declaración ya presentada?","Sí. Podemos revisar consistencia, riesgos y posibles correcciones dentro de los términos legales."],
      ["¿La asesoría reemplaza una declaración?","No necesariamente. La asesoría puede ser una revisión puntual o derivar en la preparación formal de una declaración."]
    ]
  },
  {
    path:"/declaracion-de-renta-personas-naturales",
    sectionId:"declaracion-renta-personas-naturales",
    metaTitle:"Declaración de renta personas naturales | CONTARAE",
    metaDescription:"Preparación y revisión de declaración de renta para personas naturales en Colombia, con análisis de soportes, topes, deducciones y presentación ante la DIAN.",
    badge:"RENTA PERSONAS NATURALES",
    title:"Declaración de renta para personas naturales con confirmación inicial sin costo",
    intro:"Antes de avanzar con una declaración, CONTARAE le ayuda a confirmar sin costo si podría estar obligado a declarar renta y cuál sería su fecha estimada de vencimiento.",
    intent:"Déjenos sus datos principales o escríbanos por WhatsApp. La revisión inicial se gestiona de forma sencilla y, si aplica, luego orientamos documentos, alcance y preparación ante la DIAN.",
    serviceType:"Declaración de renta personas naturales",
    ctaLabel:"Confirmar si debo declarar",
    whatsapp:"Hola CONTARAE, quiero confirmar sin costo si estoy obligado a declarar renta.",
    highlights:[["Sin costo inicial","Confirmación orientativa de obligación y vencimiento"],["Gestión","Atención por WhatsApp con datos principales"],["Siguiente paso","Si aplica, revisión de soportes y preparación profesional"]],
    cards:[
      ["Análisis previo","Validación de obligación de declarar, documentos necesarios, topes y situación fiscal del contribuyente."],
      ["Preparación de declaración","Depuración de información, revisión de soportes, cálculo del impuesto o saldo y preparación para presentación."],
      ["Acompañamiento","Explicación del resultado, soporte sobre pagos, vencimientos y conservación de documentos."]
    ],
    checklist:["Reúna certificados laborales, extractos, inversiones, deudas y soportes de deducciones.","Indique si tuvo ingresos como independiente, arriendos, dividendos o ventas de activos.","Comparta información de patrimonio y movimientos relevantes.","Revise el resultado antes de presentar."],
    faqs:[
      ["¿Cómo sé si debo declarar renta?","Puede usar la herramienta orientativa y luego solicitar revisión profesional si supera topes o tiene dudas."],
      ["¿Qué pasa si declaro tarde?","Puede generarse sanción por extemporaneidad e intereses según el caso."],
      ["¿Puedo corregir una declaración?","Sí, en muchos casos es posible corregir dentro de los términos legales, evaluando el efecto tributario."]
    ]
  },
  {
    path:"/nomina-y-seguridad-social",
    sectionId:"nomina-seguridad-social",
    metaTitle:"Nómina y seguridad social para empresas | CONTARAE",
    metaDescription:"Servicio de nómina y seguridad social para empresas: liquidación de salarios, prestaciones, aportes, planilla PILA, contratos y reportes laborales.",
    badge:"NÓMINA Y SEGURIDAD SOCIAL",
    title:"Nómina y seguridad social para empresas que necesitan control laboral",
    intro:"La nómina no es solo pagar salarios. También exige controlar prestaciones, aportes, novedades, planilla PILA, contratos y reportes laborales.",
    intent:"CONTARAE apoya a empresas y empleadores con liquidaciones periódicas, seguridad social, prestaciones sociales y revisión de obligaciones laborales.",
    serviceType:"Nómina y seguridad social",
    ctaLabel:"Solicitar apoyo en nómina",
    whatsapp:"Hola CONTARAE, necesito apoyo con nómina y seguridad social.",
    highlights:[["Incluye","Salarios, prestaciones, deducciones y aportes"],["Apoya","Planilla PILA, novedades y reportes laborales"],["Útil para","Empresas con empleados o contratistas"]],
    cards:[
      ["Liquidación de nómina","Cálculo de devengados, deducciones, auxilios, prestaciones, aportes y costo total del trabajador."],
      ["Seguridad social","Revisión de salud, pensión, ARL, cajas de compensación, parafiscales y planilla PILA según cada caso."],
      ["Control documental","Apoyo en contratos, certificados laborales, formulario 220, liquidaciones y soportes relacionados."]
    ],
    checklist:["Indique número de trabajadores y tipo de vinculación.","Comparta salario, novedades, incapacidades, licencias o variables del mes.","Informe operador PILA y fechas de pago.","Reciba liquidación y soporte según el alcance contratado."],
    faqs:[
      ["¿También revisan contratistas?","Sí. Podemos revisar seguridad social de independientes y bases de cotización según el caso."],
      ["¿La herramienta de nómina reemplaza el servicio?","No. La herramienta orienta cálculos; el servicio revisa datos reales, novedades y obligaciones."],
      ["¿Pueden emitir certificados laborales?","Sí, si se cuenta con la información laboral necesaria y el alcance queda pactado."]
    ]
  },
  {
    path:"/facturacion-electronica",
    sectionId:"facturacion-electronica",
    metaTitle:"Facturación electrónica DIAN | CONTARAE",
    metaDescription:"Acompañamiento en facturación electrónica: habilitación DIAN, numeración, proveedor tecnológico, notas crédito, soporte operativo y revisión contable.",
    badge:"FACTURACIÓN ELECTRÓNICA",
    title:"Facturación electrónica DIAN con implementación y soporte contable",
    intro:"La facturación electrónica impacta ventas, impuestos, cartera y trazabilidad contable. Una configuración correcta evita rechazos, errores y reprocesos.",
    intent:"Acompañamos habilitación, numeración, proveedor tecnológico, emisión, notas crédito, revisión de inconsistencias y organización del proceso de facturación.",
    serviceType:"Facturación electrónica",
    ctaLabel:"Solicitar apoyo en facturación",
    whatsapp:"Hola CONTARAE, necesito implementar o revisar facturación electrónica.",
    highlights:[["Incluye","Habilitación, numeración y proveedor tecnológico"],["Control","Facturas, notas crédito y consistencia contable"],["Ideal para","Emprendedores, comercios, pymes y prestadores de servicios"]],
    cards:[
      ["Implementación","Apoyo en pasos de habilitación ante DIAN, resolución de numeración y configuración operativa del sistema."],
      ["Revisión de proceso","Validación de emisión, notas crédito, conceptos, impuestos, datos de clientes y consistencia con la contabilidad."],
      ["Soporte posterior","Orientación para manejar errores frecuentes, cambios de numeración y dudas operativas."]
    ],
    checklist:["Informe si ya tiene RUT y obligación de facturar.","Indique proveedor tecnológico actual o si necesita elegir uno.","Comparta errores o mensajes de rechazo si existen.","Definamos si requiere implementación o revisión puntual."],
    faqs:[
      ["¿Todos deben facturar electrónicamente?","Depende de la actividad, régimen y obligaciones. Conviene revisar el RUT y la situación tributaria."],
      ["¿Pueden ayudarme si ya tengo proveedor?","Sí. Podemos revisar configuración, numeración, errores y consistencia del proceso."],
      ["¿Incluye manejo mensual?","Puede incluirse dentro de un plan contable o contratarse como apoyo puntual."]
    ]
  },
  {
    path:"/creacion-de-empresa",
    sectionId:"creacion-empresa",
    metaTitle:"Creación de empresa en Colombia | CONTARAE",
    metaDescription:"Acompañamiento para crear empresa en Colombia: elección de tipo societario, Cámara de Comercio, RUT, obligaciones tributarias y puesta en marcha contable.",
    badge:"CREACIÓN DE EMPRESA",
    title:"Creación de empresa en Colombia con acompañamiento contable y tributario",
    intro:"Crear empresa implica tomar decisiones sobre tipo societario, actividad económica, responsabilidades tributarias, capital, socios, RUT y operación inicial.",
    intent:"CONTARAE orienta a emprendedores en la formalización de negocios y en los pasos posteriores para iniciar con obligaciones claras y contabilidad organizada.",
    serviceType:"Creación de empresa",
    ctaLabel:"Solicitar creación de empresa",
    whatsapp:"Hola CONTARAE, quiero crear mi empresa en Colombia.",
    highlights:[["Incluye","Orientación societaria, Cámara de Comercio y RUT"],["Después","Obligaciones, facturación y contabilidad inicial"],["Ideal para","Emprendedores que quieren formalizar su negocio"]],
    cards:[
      ["Planeación inicial","Definición de actividad económica, tipo societario, capital, socios, responsabilidades y necesidades tributarias."],
      ["Formalización","Acompañamiento en documentos, Cámara de Comercio, RUT y primeros pasos para operar formalmente."],
      ["Puesta en marcha","Orientación sobre facturación electrónica, cuenta bancaria, obligaciones fiscales y plan contable inicial."]
    ],
    checklist:["Defina nombre, socios, actividad y ciudad de operación.","Comparta documentos de identificación y datos básicos.","Revise si requiere facturación electrónica o inscripción de responsabilidades.","Inicie con un esquema contable ordenado desde el primer mes."],
    faqs:[
      ["¿Qué tipo de empresa conviene crear?","Depende del número de socios, riesgo, actividad, tamaño proyectado y necesidades tributarias."],
      ["¿Después de crearla debo llevar contabilidad?","Sí, una empresa formal debe mantener información contable y cumplir obligaciones según su actividad."],
      ["¿Pueden acompañar después de creada?","Sí. Puede continuar con un plan contable mensual o asesorías puntuales."]
    ]
  },
  {
    path:"/contador-publico-bogota",
    sectionId:"contador-publico-bogota",
    metaTitle:"Contador público en Bogotá | CONTARAE",
    metaDescription:"Contador público en Bogotá para certificaciones, contabilidad, impuestos, nómina, declaración de renta y asesoría tributaria con atención virtual.",
    badge:"CONTADOR PÚBLICO EN BOGOTÁ",
    title:"Contador Público en Bogotá con atención virtual y procesos claros",
    intro:"Si necesita un contador público en Bogotá para certificaciones, impuestos, contabilidad o trámites, CONTARAE ofrece atención digital con enfoque profesional.",
    intent:"Servicio dirigido a personas naturales, independientes, emprendedores y empresas ubicadas en Bogotá o que requieren soporte contable desde la ciudad.",
    serviceType:"Contador público Bogotá",
    ctaLabel:"Contactar contador público",
    whatsapp:"Hola CONTARAE, necesito hablar con un contador público en Bogotá.",
    highlights:[["Ubicación","Bogotá D.C. con atención virtual"],["Servicios","Certificaciones, renta, contabilidad, nómina e impuestos"],["Canales","WhatsApp, correo y formularios digitales"]],
    cards:[
      ["Certificaciones y trámites","Emisión de certificaciones contables, certificación de ingresos y documentos firmados por Contador Público cuando aplique."],
      ["Impuestos y contabilidad","Acompañamiento en declaración de renta, IVA, retención, información exógena y contabilidad mensual."],
      ["Atención flexible","Recepción de documentos digitales, seguimiento por canales remotos y orientación según necesidad."]
    ],
    checklist:["Indique si requiere servicio personal o empresarial.","Cuéntenos el trámite o problema contable que necesita resolver.","Comparta documentos o soportes relevantes.","Reciba una ruta de atención y cotización según alcance."],
    faqs:[
      ["¿Atienden presencialmente?","La operación principal es virtual, lo que permite atender con agilidad y trazabilidad documental."],
      ["¿Sirve para trámites en entidades de Bogotá?","Sí. Se preparan documentos y soportes según el trámite y requisitos de la entidad receptora."],
      ["¿Puedo contratar solo una certificación?","Sí. La certificación de ingresos y otros documentos pueden contratarse de forma puntual."]
    ]
  },
  {
    path:"/contador-publico-online",
    sectionId:"contador-publico-online",
    metaTitle:"Contador público online en Colombia | CONTARAE",
    metaDescription:"Contador público online en Colombia para certificaciones, declaración de renta, asesoría tributaria, contabilidad mensual, nómina y trámites digitales.",
    badge:"CONTADOR ONLINE",
    title:"Contador Público online para gestionar trámites contables desde cualquier lugar",
    intro:"La atención contable online permite enviar información, resolver dudas, pagar servicios y recibir documentos sin desplazamientos, manteniendo orden y trazabilidad.",
    intent:"CONTARAE atiende personas y empresas en Colombia con procesos digitales para certificaciones, impuestos, contabilidad, nómina, facturación y asesoría.",
    serviceType:"Contador público online",
    ctaLabel:"Solicitar atención online",
    whatsapp:"Hola CONTARAE, necesito atención de contador público online.",
    highlights:[["Modalidad","100% digital para Colombia"],["Entrega","Documentos y seguimiento por canales electrónicos"],["Servicios","Certificaciones, impuestos, contabilidad y trámites"]],
    cards:[
      ["Proceso digital","Formulario, WhatsApp, correo, pagos en línea y seguimiento permiten gestionar solicitudes con claridad."],
      ["Soportes organizados","Se reciben documentos digitales legibles y se revisan según el alcance del servicio solicitado."],
      ["Acompañamiento humano","Aunque el proceso sea online, la atención mantiene revisión profesional y comunicación directa."]
    ],
    checklist:["Explique el servicio que necesita.","Envíe datos y soportes por los canales indicados.","Reciba cotización o enlace de pago cuando aplique.","Haga seguimiento hasta la entrega o cierre del servicio."],
    faqs:[
      ["¿Es válido un servicio contable online?","Sí, siempre que el servicio se preste con soporte documental, responsabilidad profesional y canales verificables."],
      ["¿Cómo envío documentos?","Puede enviarlos por formulario, WhatsApp o correo según el tipo de solicitud."],
      ["¿Puedo pagar en línea?","Sí. Los servicios que lo requieran pueden gestionarse mediante enlaces de pago o alternativas acordadas."]
    ]
  }
];
const TOOL_ROUTE_BY_PATH=new Map();
const TOOL_ROUTE_BY_ID=new Map();
TOOL_ROUTES.forEach(cfg=>{
  TOOL_ROUTE_BY_ID.set(cfg.toolId,cfg);
  cfg.aliases.forEach(alias=>TOOL_ROUTE_BY_PATH.set(normPath(alias),cfg));
});
const CERTIFICATION_SUPPORT_ROUTE_BY_PATH=new Map(CERTIFICATION_SUPPORT_ROUTES.map(cfg=>[normPath(cfg.path),cfg]));
const SERVICE_SEO_ROUTE_BY_PATH=new Map(SERVICE_SEO_ROUTES.map(cfg=>[normPath(cfg.path),cfg]));
const isCertificationPath=p=>CERT_ROUTE_ALIASES.has(normPath(p));
const isAdminPath=p=>ADMIN_ROUTE_ALIASES.has(normPath(p));
const isVerifyPath=p=>VERIFY_ROUTE_ALIASES.has(normPath(p));
const isPaymentPath=p=>PAYMENT_ROUTE_ALIASES.has(normPath(p));
const isPaymentsPortalPath=p=>PAYMENTS_PORTAL_ROUTE_ALIASES.has(normPath(p));
const isClientPortalPath=p=>CLIENT_PORTAL_ROUTE_ALIASES.has(normPath(p));
const getToolRouteConfig=p=>TOOL_ROUTE_BY_PATH.get(normPath(p))||null;
const getCertificationSupportRouteConfig=p=>CERTIFICATION_SUPPORT_ROUTE_BY_PATH.get(normPath(p))||null;
const getServiceSeoRouteConfig=p=>SERVICE_SEO_ROUTE_BY_PATH.get(normPath(p))||null;
const isToolPath=p=>!!getToolRouteConfig(p);
const getCurrentPath=()=>typeof window==="undefined"?"/":normPath(window.location.pathname);
const getStandaloneLocalSectionId=path=>isCertificationPath(path)?"certificacion":getToolRouteConfig(path)?.sectionId||getCertificationSupportRouteConfig(path)?.sectionId||getServiceSeoRouteConfig(path)?.sectionId||null;
const getSectionHref=(id,path)=>{
  const currentTool=getToolRouteConfig(path);
  const currentSupport=getCertificationSupportRouteConfig(path);
  const currentService=getServiceSeoRouteConfig(path);
  const targetTool=TOOL_ROUTE_BY_ID.get(id);
  if(targetTool){
    if(currentTool?.toolId===id)return `#${id}`;
    if(currentTool||isCertificationPath(path)||currentSupport||currentService)return targetTool.path;
  }
  if(id==="certificacion"&&(currentSupport||currentService))return CERT_ROUTE;
  const localId=getStandaloneLocalSectionId(path);
  return localId&&id!==localId?`/#${id}`:`#${id}`;
};
const scrollToId=(id,behavior="smooth")=>{if(typeof window==="undefined")return false;const el=document.getElementById(id);if(!el)return false;const top=el.getBoundingClientRect().top+window.pageYOffset-156;window.scrollTo({top,behavior});return true;};
const openCertificationForm=()=>{if(typeof window==="undefined")return;window.dispatchEvent(new CustomEvent(OPEN_CERT_FORM_EVENT));};
const canonicalUrlForPath=path=>{
  const normalized=normPath(path);
  const tool=getToolRouteConfig(normalized);
  const support=getCertificationSupportRouteConfig(normalized);
  const service=getServiceSeoRouteConfig(normalized);
  const canonicalPath=isCertificationPath(normalized)?CERT_ROUTE:tool?.path||support?.path||service?.path||normalized;
  return new URL(canonicalPath, SITE_URL).href;
};
const upsertMeta=(selector,attrs)=>{
  if(typeof document==="undefined")return;
  let el=document.querySelector(selector);
  if(!el){
    el=document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([key,value])=>el.setAttribute(key,value));
};
const upsertLink=(rel,href)=>{
  if(typeof document==="undefined")return;
  let el=document.querySelector(`link[rel="${rel}"]`);
  if(!el){
    el=document.createElement("link");
    el.setAttribute("rel",rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href",href);
};
const upsertAlternateLink=(hreflang,href)=>{
  if(typeof document==="undefined")return;
  let el=document.querySelector(`link[rel="alternate"][hreflang="${hreflang}"]`);
  if(!el){
    el=document.createElement("link");
    el.setAttribute("rel","alternate");
    el.setAttribute("hreflang",hreflang);
    document.head.appendChild(el);
  }
  el.setAttribute("href",href);
};
const syncAlternateSeoLinks=canonical=>{
  upsertAlternateLink("es-CO",canonical);
  upsertAlternateLink("x-default",canonical);
};
const getClientSeoMeta=({path,adminRoute,verifyRoute,paymentRoute,paymentsPortalRoute,clientPortalRoute,toolRoute,toolConfig,certRoute,certSupportConfig,serviceSeoConfig})=>{
  if(adminRoute)return{title:"Panel interno | CONTARAE",description:"Panel interno de revisión de CONTARAE.",canonical:canonicalUrlForPath("/admin"),noindex:true};
  if(verifyRoute)return{title:"Validación de certificados | CONTARAE",description:"Verifique la validez de un certificado emitido por CONTARAE mediante referencia, código o QR.",canonical:canonicalUrlForPath(VERIFY_ROUTE),noindex:true};
  if(paymentRoute)return{title:"Pago de solicitud | CONTARAE",description:"Portal de pago seguro para solicitudes de servicios CONTARAE.",canonical:canonicalUrlForPath(PAYMENT_ROUTE),noindex:true};
  if(paymentsPortalRoute)return{title:"Portal de pagos | CONTARAE",description:"Consulte y pague saldos pendientes de solicitudes CONTARAE con su número de documento.",canonical:canonicalUrlForPath(PAYMENTS_PORTAL_ROUTE),noindex:true};
  if(clientPortalRoute)return{title:"Portal para clientes | CONTARAE",description:"Sistema privado para clientes CONTARAE con control de cartera, facturas, abonos, inventario, órdenes y cargues masivos.",canonical:canonicalUrlForPath(CLIENT_PORTAL_ROUTE),noindex:true};
  if(toolRoute)return{title:toolConfig.metaTitle,description:toolConfig.metaDescription,canonical:canonicalUrlForPath(path),noindex:false};
  if(certSupportConfig)return{title:certSupportConfig.metaTitle,description:certSupportConfig.metaDescription,canonical:canonicalUrlForPath(path),noindex:false};
  if(serviceSeoConfig)return{title:serviceSeoConfig.metaTitle,description:serviceSeoConfig.metaDescription,canonical:canonicalUrlForPath(path),noindex:false};
  if(certRoute)return{title:"Certificación de ingresos por Contador Público en Colombia | CONTARAE",description:"Solicite en línea su certificación de ingresos firmada por Contador Público. Entrega promedio en 2 horas hábiles con soportes completos.",canonical:canonicalUrlForPath(CERT_ROUTE),noindex:false};
  return{title:"CONTARAE | Servicios contables, tributarios y financieros",description:"Certificación de ingresos por Contador Público. Servicios contables, tributarios y financieros para personas, emprendedores y pymes en Colombia.",canonical:canonicalUrlForPath("/"),noindex:false};
};
const buildBreadcrumbSchema=(items)=>({"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":items.map((item,index)=>({"@type":"ListItem","position":index+1,"name":item.name,"item":new URL(item.path,SITE_URL).href}))});
const buildFaqSchema=faqs=>{
  const items=(faqs||[]).filter(item=>item?.q&&item?.a).map(item=>({"@type":"Question","name":item.q,"acceptedAnswer":{"@type":"Answer","text":item.a}}));
  if(!items.length)return null;
  return{"@context":"https://schema.org","@type":"FAQPage","mainEntity":items};
};
const buildStructuredData=(path,meta,toolConfig,certSupportConfig,serviceSeoConfig)=>{
  const normalized=normPath(path);
  const base=[
    {"@context":"https://schema.org","@type":"ProfessionalService","@id":`${SITE_URL}/#negocio`,"name":"CONTARAE","description":"Servicios contables, tributarios y financieros en Colombia, con certificación de ingresos por Contador Público y herramientas de cálculo tributario y laboral.","url":SITE_URL,"logo":new URL("/logo512.png",SITE_URL).href,"telephone":"+573001432008","email":EM,"address":{"@type":"PostalAddress","addressLocality":"Bogotá D.C.","addressCountry":"CO"},"areaServed":"CO","priceRange":"$$","openingHours":"Mo-Fr 08:00-18:00","sameAs":SOCIAL_LINKS.map(([,url])=>url)},
    {"@context":"https://schema.org","@type":"WebSite","@id":`${SITE_URL}/#website`,"name":"CONTARAE","url":SITE_URL,"inLanguage":"es-CO"}
  ];
  if(isCertificationPath(normalized)){
    base.push({"@context":"https://schema.org","@type":"Service","name":"Certificación de ingresos por Contador Público","description":meta.description,"provider":{"@id":`${SITE_URL}/#negocio`},"areaServed":"CO","serviceType":"Certificación de ingresos","url":meta.canonical,"offers":{"@type":"AggregateOffer","priceCurrency":"COP","lowPrice":80000,"highPrice":155000}});
    base.push({"@context":"https://schema.org","@type":"VideoObject","name":"Paso a paso certificación de ingresos CONTARAE","description":"Video explicativo sobre cómo solicitar una certificación de ingresos firmada por Contador Público en CONTARAE.","thumbnailUrl":["https://i.ytimg.com/vi/yHF1p9T9kgU/hqdefault.jpg"],"embedUrl":CERTIFICATION_VIDEO_EMBED,"contentUrl":"https://www.youtube.com/watch?v=yHF1p9T9kgU","uploadDate":"2026-04-30T09:00:00-05:00","inLanguage":"es-CO","publisher":{"@id":`${SITE_URL}/#negocio`}});
    base.push(buildBreadcrumbSchema([{name:"Inicio",path:"/"},{name:"Certificación de ingresos",path:CERT_ROUTE}]));
    const faqSchema=buildFaqSchema((typeof FQ!=="undefined"?FQ:[]).slice(0,6));
    if(faqSchema)base.push(faqSchema);
  }else if(certSupportConfig){
    base.push({"@context":"https://schema.org","@type":"Article","headline":certSupportConfig.title,"description":certSupportConfig.metaDescription,"inLanguage":"es-CO","author":{"@id":`${SITE_URL}/#negocio`},"publisher":{"@id":`${SITE_URL}/#negocio`},"mainEntityOfPage":meta.canonical});
    base.push(buildBreadcrumbSchema([{name:"Inicio",path:"/"},{name:"Certificación de ingresos",path:CERT_ROUTE},{name:certSupportConfig.title,path:certSupportConfig.path}]));
    const faqSchema=buildFaqSchema((certSupportConfig.faqs||[]).map(([q,a])=>({q,a})));
    if(faqSchema)base.push(faqSchema);
  }else if(toolConfig){
    base.push({"@context":"https://schema.org","@type":"WebApplication","name":toolConfig.heroTitle,"description":toolConfig.metaDescription,"url":meta.canonical,"applicationCategory":"FinanceApplication","operatingSystem":"Web","inLanguage":"es-CO","provider":{"@id":`${SITE_URL}/#negocio`}});
    base.push(buildBreadcrumbSchema([{name:"Inicio",path:"/"},{name:"Herramientas",path:"/#herramientas"},{name:toolConfig.heroTitle,path:toolConfig.path}]));
  }else if(serviceSeoConfig){
    base.push({"@context":"https://schema.org","@type":"Service","name":serviceSeoConfig.title,"description":serviceSeoConfig.metaDescription,"provider":{"@id":`${SITE_URL}/#negocio`},"areaServed":"CO","serviceType":serviceSeoConfig.serviceType,"url":meta.canonical});
    base.push(buildBreadcrumbSchema([{name:"Inicio",path:"/"},{name:"Servicios",path:"/#servicios"},{name:serviceSeoConfig.title,path:serviceSeoConfig.path}]));
    const faqSchema=buildFaqSchema((serviceSeoConfig.faqs||[]).map(([q,a])=>({q,a})));
    if(faqSchema)base.push(faqSchema);
  }else if(normalized==="/"){
    base.push(buildBreadcrumbSchema([{name:"Inicio",path:"/"}]));
  }
  return base;
};
const syncSeoTags=(meta,path,toolConfig,certSupportConfig,serviceSeoConfig)=>{
  if(typeof document==="undefined")return;
  document.title=meta.title;
  upsertMeta('meta[name="description"]',{name:"description",content:meta.description});
  upsertMeta('meta[name="robots"]',{name:"robots",content:meta.noindex?"noindex, nofollow":"index, follow"});
  upsertLink("canonical",meta.canonical);
  syncAlternateSeoLinks(meta.canonical);
  upsertMeta('meta[property="og:type"]',{property:"og:type",content:"website"});
  upsertMeta('meta[property="og:site_name"]',{property:"og:site_name",content:"CONTARAE"});
  upsertMeta('meta[property="og:title"]',{property:"og:title",content:meta.title});
  upsertMeta('meta[property="og:description"]',{property:"og:description",content:meta.description});
  upsertMeta('meta[property="og:url"]',{property:"og:url",content:meta.canonical});
  upsertMeta('meta[property="og:image"]',{property:"og:image",content:new URL("/contarae-og.png",SITE_URL).href});
  upsertMeta('meta[property="og:image:width"]',{property:"og:image:width",content:"1200"});
  upsertMeta('meta[property="og:image:height"]',{property:"og:image:height",content:"400"});
  upsertMeta('meta[property="og:image:alt"]',{property:"og:image:alt",content:meta.title});
  upsertMeta('meta[name="twitter:card"]',{name:"twitter:card",content:"summary_large_image"});
  upsertMeta('meta[name="twitter:title"]',{name:"twitter:title",content:meta.title});
  upsertMeta('meta[name="twitter:description"]',{name:"twitter:description",content:meta.description});
  upsertMeta('meta[name="twitter:image"]',{name:"twitter:image",content:new URL("/contarae-og.png",SITE_URL).href});
  document.querySelectorAll("script[data-contarae-schema]").forEach(el=>el.remove());
  if(meta.noindex)return;
  buildStructuredData(path,meta,toolConfig,certSupportConfig,serviceSeoConfig).forEach(schema=>{
    const script=document.createElement("script");
    script.type="application/ld+json";
    script.setAttribute("data-contarae-schema","client");
    script.textContent=JSON.stringify(schema);
    document.head.appendChild(script);
  });
};

const CITIES=["Bogotá D.C.","Medellín","Cali","Barranquilla","Cartagena","Cúcuta","Bucaramanga","Pereira","Santa Marta","Ibagué","Pasto","Manizales","Neiva","Villavicencio","Armenia","Valledupar","Montería","Sincelejo","Popayán","Tunja","Florencia","Riohacha","Quibdó","Yopal","Mocoa","Arauca","Leticia","Inírida","Mitú","Puerto Carreño","San José del Guaviare","San Andrés","Buenaventura","Soacha","Bello","Soledad","Itagüí","Envigado","Palmira","Floridablanca","Dosquebradas","Tulúa","Barrancabermeja","Maicao","Girardot","Zipaquirá","Facatativá","Chía","Fusagasugá","Tuluá","Sogamoso","Duitama","Girón","Piedecuesta","Apartadó","Turbo","Lorica","Magangué","Aguachica","Ocaña","Pamplona","Ciénaga","Fundación","Cartago","Buga","Tumaco","Ipiales","Sabaneta","La Estrella","Copacabana","Rionegro","Cajicá","Mosquera","Madrid","Funza"];

function LogoNav(){
  return(
    <div className="nav-logo-root" style={{display:"flex",alignItems:"center",gap:10,minWidth:280}}>
      <div style={{position:"relative"}}>
        <div style={{
          position:"absolute",
          inset:-10,
          borderRadius:"50%",
          background:"radial-gradient(circle, rgba(96,165,250,.18) 0%, rgba(96,165,250,0) 72%)",
          filter:"blur(10px)"
        }}/>
        <svg width="32" height="40" viewBox="0 0 32 40" style={{position:"relative"}}>
          <path d="M16 0 L32 10 L32 30 L16 40 L0 30 L0 10 Z" fill="#10233F" stroke="#3B82F6" strokeWidth="1.5"/>
          <path d="M16 4 L28 11 L28 29 L16 36 L4 29 L4 11 Z" fill="none" stroke="#93C5FD" strokeWidth=".8" opacity=".55"/>
          <text x="16" y="27" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fill="#fff" fontWeight="700">C</text>
        </svg>
      </div>
      <div>
        <div className="nav-brand-text" style={{display:"flex"}}>
          <span style={{fontFamily:FH,fontSize:21,fontWeight:700,color:"#F8FBFF",letterSpacing:"1.5px"}}>CONTA</span>
          <span style={{fontFamily:FH,fontSize:21,fontWeight:700,color:"#7DD3FC",letterSpacing:"1.5px"}}>RAE</span>
        </div>
        <div className="nav-logo-tag" style={{fontSize:8.5,color:"rgba(226,232,240,.82)",letterSpacing:"2.2px",fontFamily:F,marginTop:1,whiteSpace:"nowrap"}}>
          SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS
        </div>
      </div>
    </div>
  );
}
function LogoFt(){return(<div style={{display:"flex",alignItems:"center",gap:11,justifyContent:"center",marginBottom:14}}><svg width="38" height="46" viewBox="0 0 56 64"><path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="#1B3A5C" stroke="#2563EB" strokeWidth="2.5"/><path d="M28 6 L50 19 L50 45 L28 58 L6 45 L6 19 Z" fill="none" stroke="#60A5FA" strokeWidth="1.2" opacity=".5"/><text x="28" y="42" textAnchor="middle" fontFamily="Georgia,serif" fontSize="34" fill="#fff" fontWeight="700">C</text></svg><div><div style={{display:"flex"}}><span style={{fontFamily:FH,fontSize:22,fontWeight:700,color:"#fff",letterSpacing:"2px"}}>CONTA</span><span style={{fontFamily:FH,fontSize:22,fontWeight:700,color:"#60A5FA",letterSpacing:"2px"}}>RAE</span></div><div style={{height:1.5,background:"#60A5FA",opacity:.5,marginTop:3,marginBottom:5,borderRadius:2}}/><div style={{fontSize:8,color:"rgba(255,255,255,.75)",letterSpacing:"2.8px",fontFamily:F}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div></div></div>)}

const B=["#F8FBFF","#FFFFFF","#F2F7FE","#FBFDFF","#EFF5FC","#FFFFFF","#F3F8FF","#F8FBFF"];
const SUB_BG=["#FBFDFF","#F3F7FD","#EAF2FB"];
const IS={width:"100%",padding:"12px 14px",borderRadius:9,border:"1px solid #d0d9e8",fontSize:15,fontFamily:F,outline:"none",background:"#fff",boxSizing:"border-box"};
const AUTO_IS={...IS,background:"#F3F4F6",color:"#475569"};
const NOTE_BOX={padding:"12px 14px",borderRadius:12,background:"rgba(15,23,42,.03)",border:"1px solid rgba(37,99,235,.10)",fontSize:12,color:"#64748B",lineHeight:1.7,fontFamily:F};
const PANEL={padding:24,borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 10px 30px rgba(15,23,42,.05)"};
const BLOCK={padding:18,borderRadius:16,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.10)"};
const cop=v=>`COP $ ${fm(Math.round(v||0))}`;
const fspRate=(base,smlmv)=>{const s=(base||0)/smlmv; if(s<4)return 0; if(s<16)return .01; if(s<17)return .012; if(s<18)return .014; if(s<19)return .016; if(s<20)return .018; return .02;};
const riskRates={1:.00522,2:.01044,3:.02436,4:.0435,5:.0696};
const riskLabels={1:"Riesgo I (0,522%)",2:"Riesgo II (1,044%)",3:"Riesgo III (2,436%)",4:"Riesgo IV (4,350%)",5:"Riesgo V (6,960%)"};
const yearlyCaps={rent25:790/12,max40:1340/12,volAfc:3800/12};
const laborYearConfig={2025:{smlmv:1423500,auxT:200000},2026:{smlmv:1750905,auxT:249095}};
const retentionArt383Ranges=[
  {from:0,to:95,rate:0,fixed:0},
  {from:95,to:150,rate:.19,fixed:0},
  {from:150,to:360,rate:.28,fixed:10},
  {from:360,to:640,rate:.33,fixed:69},
  {from:640,to:945,rate:.35,fixed:162},
  {from:945,to:2300,rate:.37,fixed:268},
  {from:2300,to:Infinity,rate:.39,fixed:770}
];
const calcArt383Retention=baseUVT=>{
  const range=retentionArt383Ranges.find(item=>baseUVT>item.from&&baseUVT<=item.to)||retentionArt383Ranges[0];
  if(!range.rate)return{retUVT:0,rangeLabel:"0 a 95 UVT - 0%",formula:"0 UVT"};
  const retUVT=(baseUVT-range.from)*range.rate+range.fixed;
  const upper=Number.isFinite(range.to)?range.to.toLocaleString("es-CO"):"en adelante";
  const plus=range.fixed?` + ${range.fixed}`:"";
  return{
    retUVT,
    rangeLabel:`>${range.from.toLocaleString("es-CO")} a ${upper} UVT - ${Math.round(range.rate*100)}%`,
    formula:`(${baseUVT.toFixed(2)} - ${range.from.toLocaleString("es-CO")}) x ${Math.round(range.rate*100)}%${plus} = ${retUVT.toFixed(2)} UVT`
  };
};
const Sec=({id,title,sub,bg,children,narrow})=>(<section id={id} style={{padding:"72px 24px 64px",background:bg||"transparent",scrollMarginTop:"145px",position:"relative"}}><div style={{maxWidth:narrow?940:1140,margin:"0 auto"}}>{title&&<div style={{textAlign:"center",margin:"0 auto 34px",maxWidth:820}}>{sub&&<div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"7px 14px",borderRadius:999,background:"rgba(37,99,235,.06)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#2563EB",letterSpacing:"1.8px",marginBottom:12,fontFamily:F,boxShadow:"0 8px 20px rgba(37,99,235,.05)"}}><span style={{width:18,height:1.5,background:"linear-gradient(90deg, rgba(37,99,235,.10), rgba(37,99,235,.45))",borderRadius:999}}/>{sub}<span style={{width:18,height:1.5,background:"linear-gradient(90deg, rgba(37,99,235,.45), rgba(37,99,235,.10))",borderRadius:999}}/></div>}<h2 style={{fontFamily:FH,fontSize:"clamp(28px,3.8vw,42px)",fontWeight:700,color:"#0B1D3A",lineHeight:1.08,margin:"0 auto",maxWidth:760,textWrap:"balance"}}>{title}</h2><div style={{width:92,height:3,borderRadius:999,margin:"16px auto 0",background:"linear-gradient(90deg, rgba(37,99,235,.08), rgba(37,99,235,.38), rgba(56,189,248,.26), rgba(37,99,235,.08))",boxShadow:"0 4px 14px rgba(37,99,235,.08)"}}/></div>}{children}</div></section>);
const Cd=({children,s,className="",...props})=><div {...props} className={`card-glow-shell${className?` ${className}`:""}`} style={{padding:24,borderRadius:20,background:"transparent",border:"1px solid rgba(96,165,250,.22)",boxShadow:"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset",backdropFilter:"blur(10px)",scrollMarginTop:"136px",transition:"transform .34s ease,box-shadow .34s ease,border-color .34s ease, filter .34s ease",position:"relative",overflow:"hidden",isolation:"isolate",...s}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-7px) scale(1.022)";e.currentTarget.style.boxShadow="0 26px 56px rgba(37,99,235,.16), 0 0 0 1px rgba(96,165,250,.34) inset, 0 0 24px rgba(96,165,250,.12)";e.currentTarget.style.borderColor="rgba(96,165,250,.34)";const g=e.currentTarget.querySelector('.card-glow-ring');if(g)g.style.opacity="1";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0) scale(1)";e.currentTarget.style.boxShadow="0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset";e.currentTarget.style.borderColor="rgba(96,165,250,.22)";const g=e.currentTarget.querySelector('.card-glow-ring');if(g)g.style.opacity=".62";}}><div className="card-glow-ring" style={{position:"absolute",inset:-1,borderRadius:20,background:"linear-gradient(120deg, rgba(37,99,235,0) 0%, rgba(56,189,248,.55) 18%, rgba(255,255,255,.95) 32%, rgba(59,130,246,.42) 48%, rgba(37,99,235,0) 62%, rgba(125,211,252,.32) 78%, rgba(37,99,235,0) 100%)",backgroundSize:"220% 220%",animation:"cardGlowFlow 7.2s linear infinite",opacity:.62,filter:"blur(1px)"}}/><div style={{position:"absolute",inset:1.2,borderRadius:18.5,background:"linear-gradient(180deg, rgba(255,255,255,.985), rgba(255,255,255,.94))",zIndex:0}}/><div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:"linear-gradient(90deg, rgba(37,99,235,0), rgba(96,165,250,.44), rgba(56,189,248,.35), rgba(37,99,235,0))",zIndex:1}}/><div style={{position:"relative",zIndex:2}}>{children}</div></div>;

/* NAV WITH DROPDOWNS + ACTIVE */

function Nav({path}){
  const[op,sO]=useState(false);
  const certRoute=isCertificationPath(path);
  const toolConfig=getToolRouteConfig(path);
  const certSupportConfig=getCertificationSupportRouteConfig(path);
  const serviceSeoConfig=getServiceSeoRouteConfig(path);
  const standaloneRoute=certRoute||!!toolConfig||!!certSupportConfig||!!serviceSeoConfig;
  const localStandaloneId=certRoute?"certificacion":toolConfig?.sectionId||certSupportConfig?.sectionId||serviceSeoConfig?.sectionId;
  const[act,sAct]=useState(certRoute||certSupportConfig?"certificacion":toolConfig?"herramientas":serviceSeoConfig?"servicios":"inicio");
  const[dd,sDD]=useState(null);

  const menu=[
    {l:"Inicio",id:"inicio"},
    {l:"Servicios",id:"servicios",sub:[{l:"Servicios generales",id:"servicios"},{l:"Certificación de ingresos",id:"certificacion"},{l:"Planes contables",id:"planes"},{l:"Escenarios frecuentes",id:"escenarios"},{l:"Trámites contables",id:"tramites"}]},
    {l:"Herramientas",id:"herramientas",sub:[{l:"Introducción herramientas",id:"herramientas"},{l:"¿Debo declarar renta?",id:"tool-renta"},{l:"Retención en la fuente",id:"tool-retencion"},{l:"Planilla independientes",id:"tool-planilla"},{l:"Liquidador de nómina",id:"tool-nomina"},{l:"Liquidador de IVA",id:"tool-iva"},{l:"Precio antes de IVA",id:"tool-precio"},{l:"Calendario tributario",id:"calendario"}]},
    {l:"Recursos",id:"blog",sub:[{l:"Blog",id:"blog"},{l:"Descargas",id:"descargas"},{l:"Preguntas frecuentes",id:"faq"},{l:"Alertas tributarias",id:"alertas"}]},
    {l:"Nosotros",id:"whyus",sub:[{l:"¿Por qué elegirnos?",id:"whyus"},{l:"Sobre CONTARAE",id:"nosotros"}]},
    {l:"Portales",id:"portales",sub:[{l:"Portal clientes",id:"portal-clientes",href:CLIENT_PORTAL_ROUTE},{l:"Portal pagos",id:"portal-pagos",href:PAYMENTS_PORTAL_ROUTE}]},
    {l:"Contacto",id:"contacto"}
  ];

  useEffect(()=>{
    if(standaloneRoute){
      sAct(certRoute||certSupportConfig?"certificacion":toolConfig?"herramientas":"servicios");
      return;
    }
    const ids=["inicio","servicios","planes","escenarios","tramites","certificacion","herramientas","tool-renta","tool-retencion","tool-planilla","tool-nomina","tool-iva","tool-precio","calendario","blog","descargas","faq","alertas","whyus","nosotros","contacto"];
    const obs=new IntersectionObserver(en=>{
      en.forEach(e=>{
        if(e.isIntersecting)sAct(e.target.id);
      });
    },{threshold:.15,rootMargin:"-80px 0px"});

    ids.forEach(id=>{
      const el=document.getElementById(id);
      if(el)obs.observe(el);
    });

    return()=>obs.disconnect();
  },[standaloneRoute,certRoute,certSupportConfig,toolConfig,serviceSeoConfig]);

  const navBase={
    textDecoration:"none",
    fontSize:13,
    fontFamily:F,
    padding:"8px 13px",
    borderRadius:999,
    transition:"all .22s ease",
    display:"inline-flex",
    alignItems:"center",
    gap:6,
    whiteSpace:"nowrap"
  };

  const goTo=id=>e=>{
    if(standaloneRoute&&id!==localStandaloneId){
      sDD(null);
      sO(false);
      return;
    }
    const el=document.getElementById(id);
    if(!el)return;
    e.preventDefault();
    scrollToId(id);
    sAct(id);
    sDD(null);
    sO(false);
    if(window.history?.replaceState)window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}#${id}`);
  };
  const getMenuHref=item=>item.href||getSectionHref(item.id,path);
  const goToMenuItem=item=>event=>{
    if(item.href){
      sDD(null);
      sO(false);
      return;
    }
    goTo(item.id)(event);
  };

  return(
    <nav style={{
      position:"fixed",
      top:0,
      width:"100%",
      zIndex:200,
      padding:"14px 24px",
      display:"flex",
      alignItems:"center",
      justifyContent:"space-between",
      background:"linear-gradient(135deg, rgba(9,21,41,.95), rgba(15,39,73,.93) 55%, rgba(17,51,92,.94))",
      backdropFilter:"blur(16px)",
      WebkitBackdropFilter:"blur(16px)",
      borderBottom:"1px solid rgba(125,211,252,.16)",
      boxShadow:"0 12px 38px rgba(2,8,23,.26)"
    }}>
      <style>{`
        @keyframes navShine{
          0%{background-position:0% 50%;opacity:.88}
          50%{background-position:100% 50%;opacity:1}
          100%{background-position:0% 50%;opacity:.88}
        }
        @media(max-width:1180px){
          .dk{display:none!important;}
          .hm{display:block!important;}
        }
        @media(min-width:1181px) and (max-width:1360px){
          .nav-logo-root{min-width:230px!important;gap:8px!important;}
          .nav-logo-root svg{width:28px;height:35px;}
          .nav-brand-text span{font-size:18px!important;letter-spacing:1px!important;}
          .nav-logo-tag{font-size:7px!important;letter-spacing:1.3px!important;}
          .desktop-menu{gap:2px!important;}
          .desktop-menu a{font-size:12.5px!important;padding-left:10px!important;padding-right:10px!important;}
        }
        @media(max-width:620px){
          .nav-logo-root{min-width:0!important;}
          .nav-brand-text span{font-size:18px!important;letter-spacing:1px!important;}
          .nav-logo-tag{display:none!important;}
        }
      `}</style>

      <div style={{position:"absolute",inset:0,pointerEvents:"none",background:"linear-gradient(90deg, rgba(255,255,255,.03), rgba(255,255,255,0) 18%, rgba(125,211,252,.04) 45%, rgba(255,255,255,0) 72%, rgba(255,255,255,.02))"}}/>
      <LogoNav/>

      <div style={{display:"flex",gap:5,alignItems:"center",position:"relative",justifyContent:"flex-end",flex:"1 1 auto"}} className="dk desktop-menu">
        {menu.map((m,i)=>{
          const active=m.id===act||m.sub?.some(s=>s.id===act);
          return(
          <div
            key={i}
            style={{position:"relative",paddingBottom:9,marginBottom:-9}}
            onMouseEnter={()=>m.sub&&sDD(i)}
            onMouseLeave={()=>sDD(null)}
          >
            <a
              href={getMenuHref(m)}
              onClick={goToMenuItem(m)}
              style={{
                ...navBase,
                color:active?"#F8FBFF":"rgba(226,232,240,.84)",
                fontWeight:active?700:500,
                background:active?"linear-gradient(135deg, rgba(37,99,235,.42), rgba(14,165,233,.28))":"transparent",
                border:active?"1px solid rgba(125,211,252,.30)":"1px solid transparent",
                boxShadow:active?"0 8px 20px rgba(37,99,235,.18)":"none"
              }}
              onMouseEnter={e=>{
                if(!active){
                  e.currentTarget.style.background="rgba(255,255,255,.05)";
                  e.currentTarget.style.color="#F8FBFF";
                  e.currentTarget.style.border="1px solid rgba(125,211,252,.18)";
                }
              }}
              onMouseLeave={e=>{
                if(!active){
                  e.currentTarget.style.background="transparent";
                  e.currentTarget.style.color="rgba(226,232,240,.84)";
                  e.currentTarget.style.border="1px solid transparent";
                }
              }}
            >
              {m.l}{m.sub?" ▾":""}
            </a>

            {m.sub&&dd===i&&
              <div style={{
                position:"absolute",
                top:"calc(100% - 2px)",
                left:0,
                background:"linear-gradient(180deg, rgba(8,18,36,.985), rgba(10,24,45,.985))",
                border:"1px solid rgba(125,211,252,.18)",
                borderRadius:14,
                padding:"10px 0",
                minWidth:230,
                marginTop:0,
                boxShadow:"0 18px 40px rgba(2,8,23,.34)",
                overflow:"hidden",
                zIndex:300
              }}>
                <div style={{position:"absolute",top:0,left:0,width:"100%",height:1,background:"linear-gradient(90deg, rgba(125,211,252,0), rgba(125,211,252,.35), rgba(125,211,252,0))"}}/>
                {m.sub.map((s,j)=>
                  <a
                    key={j}
                    href={getMenuHref(s)}
                    onClick={goToMenuItem(s)}
                    style={{
                      display:"block",
                      padding:"11px 18px",
                      color:"rgba(226,232,240,.82)",
                      fontSize:13,
                      fontFamily:F,
                      textDecoration:"none",
                      whiteSpace:"nowrap",
                      transition:"background .2s,color .2s,padding-left .2s"
                    }}
                    onMouseEnter={e=>{
                      e.target.style.background="rgba(37,99,235,.16)";
                      e.target.style.color="#F8FBFF";
                      e.target.style.paddingLeft="22px";
                    }}
                    onMouseLeave={e=>{
                      e.target.style.background="transparent";
                      e.target.style.color="rgba(226,232,240,.82)";
                      e.target.style.paddingLeft="18px";
                    }}
                  >
                    {s.l}
                  </a>
                )}
              </div>
            }
          </div>
        )})}

        <a
          href={wm("Hola CONTARAE, me gustaría recibir asesoría sobre sus servicios contables.")}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            padding:"8px 16px",
            borderRadius:11,
            background:"linear-gradient(135deg,#2563EB,#38BDF8)",
            color:"#fff",
            fontSize:13,
            fontWeight:700,
            textDecoration:"none",
            marginLeft:8,
            boxShadow:"0 10px 24px rgba(37,99,235,.25)",
            border:"1px solid rgba(191,219,254,.18)"
          }}
        >
          WhatsApp
        </a>
      </div>

      <button
        onClick={()=>sO(!op)}
        className="hm"
        style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"none"}}
        aria-label="Menú"
      >
        <div style={{width:24,height:2.5,background:"#fff",marginBottom:5,borderRadius:99,transition:"all .3s",transform:op?"rotate(45deg) translate(5px,5px)":"none"}}/>
        <div style={{width:24,height:2.5,background:"#fff",marginBottom:5,borderRadius:99,opacity:op?0:1}}/>
        <div style={{width:24,height:2.5,background:"#fff",borderRadius:99,transition:"all .3s",transform:op?"rotate(-45deg) translate(5px,-5px)":"none"}}/>
      </button>

      {op&&
        <div style={{
          position:"absolute",
          top:"100%",
          left:0,
          width:"100%",
          background:"linear-gradient(180deg, rgba(8,18,36,.985), rgba(10,24,45,.985))",
          padding:"18px 24px",
          borderBottom:"1px solid rgba(125,211,252,.12)",
          maxHeight:"80vh",
          overflowY:"auto",
          boxShadow:"0 18px 40px rgba(2,8,23,.34)"
        }}>
          {menu.map((m,i)=>
            <div key={i}>
              <a
                href={getMenuHref(m)}
                onClick={goToMenuItem(m)}
                style={{
                  display:"block",
                  padding:"13px 0",
                  color:act===m.id?"#F8FBFF":"rgba(226,232,240,.82)",
                  fontSize:16,
                  fontWeight:act===m.id?700:500,
                  fontFamily:F,
                  textDecoration:"none",
                  borderBottom:"1px solid rgba(255,255,255,.06)"
                }}
              >
                {m.l}
              </a>

              {m.sub&&m.sub.map((s,j)=>
                <a
                  key={j}
                  href={getMenuHref(s)}
                  onClick={goToMenuItem(s)}
                  style={{
                    display:"block",
                    padding:"10px 0 10px 20px",
                    color:"rgba(186,200,218,.72)",
                    fontSize:14,
                    fontFamily:F,
                    textDecoration:"none"
                  }}
                >
                  → {s.l}
                </a>
              )}
            </div>
          )}

          <a
            href={wm("Hola CONTARAE, me gustaría recibir asesoría.")}
            target="_blank"
            rel="noopener noreferrer"
            onClick={()=>sO(false)}
            style={{
              display:"block",
              marginTop:14,
              padding:"13px 20px",
              borderRadius:11,
              background:"linear-gradient(135deg,#2563EB,#38BDF8)",
              color:"#fff",
              fontSize:15,
              fontWeight:700,
              textDecoration:"none",
              textAlign:"center",
              fontFamily:F,
              boxShadow:"0 10px 24px rgba(37,99,235,.22)"
            }}
          >
            WhatsApp
          </a>
        </div>
      }

      <div style={{
        position:"absolute",
        bottom:0,
        left:0,
        width:"100%",
        height:2,
        background:"linear-gradient(90deg, rgba(56,189,248,0), rgba(37,99,235,.72), rgba(56,189,248,.82), rgba(125,211,252,.72), rgba(56,189,248,0))",
        backgroundSize:"200% 100%",
        animation:"navShine 7s linear infinite",
        boxShadow:"0 0 14px rgba(56,189,248,.30)"
      }}/>
    </nav>
  );
}


function Banner({path}){const[s,sS]=useState(true);if(!s)return null;return(<div className="app-cert-banner" style={{position:"fixed",top:94,left:"50%",transform:"translateX(-50%)",width:"min(620px,calc(100% - 44px))",zIndex:190,pointerEvents:"none"}}><div className="app-cert-banner-inner" style={{background:"linear-gradient(90deg,#163457,#2563EB)",padding:"6px 12px",borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",gap:8,flexWrap:"wrap",boxShadow:"0 10px 22px rgba(15,23,42,.12)",border:"1px solid rgba(255,255,255,.10)",pointerEvents:"auto"}}><span style={{fontSize:11,color:"#fff",fontFamily:F,lineHeight:1.35,textAlign:"center"}}>🔥 <strong>¿Necesita su certificación de ingresos HOY?</strong></span><a href={getSectionHref("certificacion",path)} style={{fontSize:11,color:"#fff",fontWeight:800,background:"rgba(255,255,255,.16)",padding:"5px 11px",borderRadius:999,textDecoration:"none",fontFamily:F,letterSpacing:".2px"}}>Solicitar</a><button onClick={()=>sS(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.65)",cursor:"pointer",fontSize:13,padding:0,marginLeft:2,fontFamily:F}}>✕</button></div></div>)}

/* HERO WITH ANIMATED BG */

function Hero(){
  return(
    <section
      id="inicio"
      style={{
        minHeight:"100vh",
        display:"flex",
        alignItems:"center",
        justifyContent:"center",
        textAlign:"center",
        padding:"148px 24px 86px",
        position:"relative",
        overflow:"hidden",
        background:"linear-gradient(135deg,#F4F8FF 0%,#E7F0FF 20%,#EAF7FF 52%,#F8FBFF 100%)",
        backgroundSize:"220% 220%",
        animation:"gradBg 20s ease-in-out infinite"
      }}
    >
      <style>{`
        @keyframes gradBg{
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes driftWave{
          0%{transform:translate3d(-18px,-6px,0) scale(1.01)}
          50%{transform:translate3d(56px,18px,0) scale(1.045)}
          100%{transform:translate3d(-18px,-6px,0) scale(1.01)}
        }
        @keyframes driftWaveAlt{
          0%{transform:translate3d(16px,8px,0) scale(1.01)}
          50%{transform:translate3d(-48px,-18px,0) scale(1.04)}
          100%{transform:translate3d(16px,8px,0) scale(1.01)}
        }
        @keyframes floatSoft{
          0%{transform:translateY(0px) scale(1)}
          50%{transform:translateY(-16px) scale(1.04)}
          100%{transform:translateY(0px) scale(1)}
        }
        @keyframes heroReveal{
          0%{opacity:0;transform:translateY(32px)}
          100%{opacity:1;transform:translateY(0)}
        }
        @keyframes glowPulse{
          0%{opacity:.72}
          50%{opacity:1}
          100%{opacity:.72}
        }
      `}</style>

      <div style={{
        position:"absolute",
        inset:0,
        background:"radial-gradient(circle at 14% 18%, rgba(59,130,246,.16) 0%, rgba(59,130,246,0) 24%), radial-gradient(circle at 84% 18%, rgba(14,165,233,.13) 0%, rgba(14,165,233,0) 22%), radial-gradient(circle at 74% 74%, rgba(96,165,250,.10) 0%, rgba(96,165,250,0) 20%)"
      }}/>

      <div style={{
        position:"absolute",
        top:"10%",
        left:"-7%",
        width:360,
        height:360,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(59,130,246,.18) 0%, rgba(59,130,246,0) 70%)",
        filter:"blur(18px)",
        animation:"floatSoft 13s ease-in-out infinite"
      }}/>
      <div style={{
        position:"absolute",
        bottom:"-12%",
        right:"-5%",
        width:400,
        height:400,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(14,165,233,.16) 0%, rgba(14,165,233,0) 72%)",
        filter:"blur(18px)",
        animation:"floatSoft 16s ease-in-out infinite"
      }}/>
      <div style={{
        position:"absolute",
        top:"16%",
        left:"50%",
        transform:"translateX(-50%)",
        width:620,
        height:620,
        borderRadius:"50%",
        background:"radial-gradient(circle, rgba(96,165,250,.10) 0%, rgba(255,255,255,0) 67%)",
        filter:"blur(26px)",
        animation:"glowPulse 12s ease-in-out infinite"
      }}/>

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position:"absolute",
          inset:0,
          width:"100%",
          height:"100%",
          opacity:.58,
          animation:"driftWave 15s ease-in-out infinite"
        }}
      >
        <defs>
          <linearGradient id="waveStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(96,165,250,0)" />
            <stop offset="30%" stopColor="rgba(59,130,246,.24)" />
            <stop offset="60%" stopColor="rgba(14,165,233,.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </linearGradient>
          <linearGradient id="waveStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0)" />
            <stop offset="45%" stopColor="rgba(59,130,246,.18)" />
            <stop offset="75%" stopColor="rgba(125,211,252,.15)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path d="M-80 240 C 180 150, 360 350, 620 255 S 1120 130, 1680 270" fill="none" stroke="url(#waveStroke1)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M-120 640 C 220 500, 480 760, 820 625 S 1280 520, 1720 690" fill="none" stroke="url(#waveStroke2)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M1060 160 C 1220 230, 1280 340, 1170 470 C 1070 585, 1090 705, 1330 760" fill="none" stroke="rgba(59,130,246,.08)" strokeWidth="52" strokeLinecap="round"/>
      </svg>

      <svg
        viewBox="0 0 1600 900"
        preserveAspectRatio="none"
        style={{
          position:"absolute",
          inset:0,
          width:"100%",
          height:"100%",
          opacity:.5,
          animation:"driftWaveAlt 17s ease-in-out infinite"
        }}
      >
        <path d="M-120 330 C 140 250, 390 440, 660 360 S 1130 255, 1720 410" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M-100 710 C 180 610, 470 820, 820 710 S 1270 620, 1710 760" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>

      <div style={{
        position:"relative",
        zIndex:1,
        maxWidth:860,
        padding:"0 8px"
      }}>
        <div style={{
          display:"inline-block",
          padding:"8px 20px",
          borderRadius:100,
          background:"rgba(255,255,255,.68)",
          border:"1px solid rgba(37,99,235,.11)",
          boxShadow:"0 10px 24px rgba(37,99,235,.06)",
          fontSize:12,
          fontWeight:700,
          color:"#1D4ED8",
          marginBottom:30,
          letterSpacing:"1.5px",
          fontFamily:F,
          backdropFilter:"blur(8px)",
          animation:"heroReveal 1.15s cubic-bezier(.22,1,.36,1) both"
        }}>
          CONTADORES PÚBLICOS CERTIFICADOS EN COLOMBIA
        </div>

        <h1 style={{
          fontFamily:FH,
          fontSize:"clamp(32px,5.3vw,58px)",
          fontWeight:700,
          lineHeight:1.08,
          color:"#0B1D3A",
          marginBottom:22,
          animation:"heroReveal 1.35s cubic-bezier(.22,1,.36,1) both",
          animationDelay:".22s"
        }}>
          Soluciones contables con visión <span style={{color:"#2563EB"}}>moderna, clara y confiable</span>
        </h1>

        <p style={{
          fontSize:17,
          color:"#475569",
          lineHeight:1.85,
          maxWidth:720,
          margin:"0 auto 38px",
          fontFamily:F,
          animation:"heroReveal 1.45s cubic-bezier(.22,1,.36,1) both",
          animationDelay:".46s"
        }}>
          Servicios contables, tributarios y financieros para personas y empresas en Colombia.
          Procesos bien estructurados, acompañamiento profesional y una experiencia digital más ágil para impulsar su crecimiento.
        </p>

        <div style={{marginBottom:14,animation:"heroReveal 1.55s cubic-bezier(.22,1,.36,1) both",animationDelay:".74s"}}>
          <a
            href="#certificacion"
            style={{
              display:"inline-block",
              padding:"15px 34px",
              borderRadius:15,
              background:"linear-gradient(135deg,#2563EB,#38BDF8)",
              color:"#fff",
              fontSize:15,
              fontWeight:700,
              textDecoration:"none",
              boxShadow:"0 18px 34px rgba(37,99,235,.18)",
              fontFamily:F,
              textAlign:"center",
              lineHeight:1.4,
              border:"1px solid rgba(191,219,254,.28)",
              transition:"transform .28s ease, box-shadow .28s ease, filter .28s ease",
              position:"relative",
              overflow:"hidden"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow="0 20px 36px rgba(37,99,235,.24)";
              e.currentTarget.style.filter="brightness(1.02)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="0 16px 30px rgba(37,99,235,.18)";
              e.currentTarget.style.filter="brightness(1)";
            }}
          >
            Solicite su certificado de ingresos firmado por Contador Público
          </a>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:12,animation:"heroReveal 1.55s cubic-bezier(.22,1,.36,1) both",animationDelay:".98s"}}>
          <a
            href="#planes"
            style={{
              padding:"12px 24px",
              borderRadius:12,
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              border:"1px solid rgba(37,99,235,.12)",
              background:"rgba(255,255,255,.68)",
              fontFamily:F,
              backdropFilter:"blur(8px)",
              boxShadow:"0 10px 20px rgba(37,99,235,.05)",
              transition:"transform .26s ease, box-shadow .26s ease, background .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow="0 14px 24px rgba(37,99,235,.10)";
              e.currentTarget.style.background="rgba(255,255,255,.88)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="0 10px 20px rgba(37,99,235,.05)";
              e.currentTarget.style.background="rgba(255,255,255,.68)";
            }}
          >
            Ver Planes de Contabilidad
          </a>

          <a
            href="#tramites"
            style={{
              padding:"12px 24px",
              borderRadius:12,
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              border:"1px solid rgba(37,99,235,.12)",
              background:"rgba(255,255,255,.68)",
              fontFamily:F,
              backdropFilter:"blur(8px)",
              boxShadow:"0 10px 20px rgba(37,99,235,.05)",
              transition:"transform .26s ease, box-shadow .26s ease, background .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.boxShadow="0 14px 24px rgba(37,99,235,.10)";
              e.currentTarget.style.background="rgba(255,255,255,.88)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.boxShadow="0 10px 20px rgba(37,99,235,.05)";
              e.currentTarget.style.background="rgba(255,255,255,.68)";
            }}
          >
            Declaración de Renta
          </a>
        </div>

        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",animation:"heroReveal 1.55s cubic-bezier(.22,1,.36,1) both",animationDelay:"1.18s"}}>
          <a
            href="#servicios"
            style={{
              padding:"10px 20px",
              borderRadius:10,
              background:"rgba(37,99,235,.08)",
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              fontFamily:F,
              border:"1px solid rgba(37,99,235,.10)",
              transition:"transform .26s ease, background .26s ease, box-shadow .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.background="rgba(37,99,235,.12)";
              e.currentTarget.style.boxShadow="0 12px 22px rgba(37,99,235,.08)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.background="rgba(37,99,235,.08)";
              e.currentTarget.style.boxShadow="none";
            }}
          >
            Asesoría Tributaria
          </a>

          <a
            href="#tramites"
            style={{
              padding:"10px 20px",
              borderRadius:10,
              background:"rgba(37,99,235,.08)",
              color:"#1E3A8A",
              fontSize:14,
              fontWeight:700,
              textDecoration:"none",
              fontFamily:F,
              border:"1px solid rgba(37,99,235,.10)",
              transition:"transform .26s ease, background .26s ease, box-shadow .26s ease"
            }}
            onMouseEnter={e=>{
              e.currentTarget.style.transform="translateY(-2px)";
              e.currentTarget.style.background="rgba(37,99,235,.12)";
              e.currentTarget.style.boxShadow="0 12px 22px rgba(37,99,235,.08)";
            }}
            onMouseLeave={e=>{
              e.currentTarget.style.transform="translateY(0)";
              e.currentTarget.style.background="rgba(37,99,235,.08)";
              e.currentTarget.style.boxShadow="none";
            }}
          >
            Crear mi Empresa
          </a>
        </div>
      </div>
    </section>
  );
}


function WhyUs(){return(<Sec id="whyus" title="¿Por qué elegir a CONTARAE?" sub="NUESTROS DIFERENCIALES" bg={B[6]}><div style={{maxWidth:760,margin:"0 auto 24px",textAlign:"center",fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>Diseñamos una experiencia profesional, clara y cercana para que cada trámite, cálculo o servicio tenga una presentación más confiable y fácil de entender.</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>{[
  {i:"⚡",t:"Respuesta inmediata",d:"Atendemos su solicitud en menos de 24 horas hábiles. Su tiempo es valioso y lo respetamos con la agilidad que necesita."},
  {i:"🎓",t:"Contadores Públicos certificados",d:"Profesionales con tarjeta profesional vigente ante la Junta Central de Contadores y experiencia comprobada."},
  {i:"💻",t:"100% en línea",d:"Todos nuestros servicios se gestionan de forma digital, sin desplazamientos. Desde cualquier lugar de Colombia."},
  {i:"💲",t:"Precios transparentes",d:"Conozca el valor exacto antes de contratar. Sin costos ocultos ni sorpresas desde el primer contacto."},
  {i:"🔒",t:"Confidencialidad garantizada",d:"Su información financiera protegida conforme a la Ley 1581 de 2012. Total reserva profesional."},
  {i:"🤝",t:"Acompañamiento permanente",d:"No solo hacemos el trámite: lo asesoramos en cada paso. Somos su aliado contable de largo plazo."}
].map((w,i)=><Cd key={i}><div style={{fontSize:28,marginBottom:8}}>{w.i}</div><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{w.t}</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{w.d}</p></Cd>)}</div></Sec>)}

function SvcS(){const svcs=[
  {i:"📊",t:"Contabilidad Integral",d:"Ciclo contable completo para microempresas, emprendedores y pymes: registro de operaciones, conciliaciones bancarias, estados financieros y aplicación de NIIF.",p:"/contabilidad-para-pymes",w:"Hola CONTARAE, estoy interesado en el servicio de Contabilidad Integral."},
  {i:"📋",t:"Asesoría Tributaria",d:"Acompañamiento en obligaciones ante la DIAN: declaración de renta, IVA, retención en la fuente, ICA, información exógena y planeación tributaria.",p:"/asesoria-tributaria",w:"Hola CONTARAE, necesito asesoría tributaria."},
  {i:"💰",t:"Gestión Financiera",d:"Presupuestos, flujo de caja, indicadores financieros (KPIs), análisis de costos y reportes gerenciales personalizados.",p:"/servicios-contables",w:"Hola CONTARAE, me interesa el servicio de Gestión Financiera."},
  {i:"👥",t:"Nómina y Seguridad Social",d:"Liquidación de salarios, prestaciones sociales, aportes a seguridad social, planilla PILA, contratos laborales y formulario 220.",p:"/nomina-y-seguridad-social",w:"Hola CONTARAE, necesito información sobre Nómina y Seguridad Social."},
  {i:"📄",t:"Certificaciones Contables",d:"Certificados de ingresos, patrimonio y más, firmados por Contador Público. Conforme a Ley 43 de 1990. Entrega digital inmediata en PDF.",p:CERT_ROUTE,w:"Hola CONTARAE, necesito una certificación contable."},
  {i:"🔧",t:"Otros Servicios Contables",d:"Auditoría interna, informes financieros especiales, asesoría ante la DIAN, liquidación de empresas, constitución de consorcios y orientación societaria.",p:"/servicios-contables",w:"Hola CONTARAE, necesito información sobre un servicio contable específico."}
];return(<Sec id="servicios" title="Soluciones profesionales para su negocio" sub="NUESTROS SERVICIOS" bg={B[1]}><p style={{textAlign:"center",fontSize:15,color:"#5A6F8A",marginTop:-34,marginBottom:20,maxWidth:680,margin:"-34px auto 20px",fontFamily:F}}>Outsourcing contable para microempresas, emprendedores y pymes en Colombia.</p><div style={{textAlign:"center",marginBottom:34}}><a href="/servicios-contables" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"11px 18px",borderRadius:13,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.12)",color:"#1D4ED8",fontSize:14,fontWeight:800,textDecoration:"none",fontFamily:F}}>Ver página de servicios contables</a></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>{svcs.map((s,i)=><Cd key={i}><div style={{fontSize:28,marginBottom:8}}>{s.i}</div><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{s.t}</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{s.d}</p><div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:10}}><a href={s.p} style={{fontSize:14,color:"#2563EB",fontWeight:700,textDecoration:"none",fontFamily:F}}>Ver servicio →</a><a href={wm(s.w)} target="_blank" rel="noopener noreferrer" style={{fontSize:14,color:"#0F766E",fontWeight:700,textDecoration:"none",fontFamily:F}}>WhatsApp →</a></div></Cd>)}</div></Sec>)}

function PlnS(){
  const plans=[
    {n:"Emprendedor",p:500000,tg:"Independientes y microempresas",f:["Declaraciones tributarias básicas (IVA, Rete fuente)","Conciliación bancaria mensual","Estados financieros trimestrales","Asesoría tributaria básica permanente","Soporte por WhatsApp"],w:"Hola CONTARAE, estoy interesado en el Plan Emprendedor."},
    {n:"Empresarial",p:1000000,tg:"Pequeñas y medianas empresas",f:["Todo lo del Plan Emprendedor","Registro contable mensual completo","Liquidación de nómina y seguridad social","Estados financieros mensuales","Información exógena DIAN","Indicadores financieros y KPIs","Planeación tributaria estratégica","Soporte prioritario"],pop:true,w:"Hola CONTARAE, me interesa el Plan Empresarial."},
    {n:"Premium",p:2000000,tg:"Empresas en crecimiento",f:["Todo lo del Plan Empresarial","Presupuestos y control de gestión","Dashboard financiero con Power BI","Análisis de costos por centro","Reuniones mensuales con informe gerencial","Asesor financiero dedicado","Soporte 24/7"],w:"Hola CONTARAE, quiero conocer el Plan Premium."}
  ];
  const cardHover=(e,on)=>{
    const el=e.currentTarget;
    el.style.transform=on?"translateY(-8px) scale(1.022)":"translateY(0) scale(1)";
    el.style.boxShadow=on
      ?(el.dataset.pop==="1"?"0 28px 58px rgba(8,23,48,.30), 0 0 0 1px rgba(125,211,252,.22) inset":"0 26px 54px rgba(37,99,235,.15), 0 0 0 1px rgba(96,165,250,.24) inset")
      :(el.dataset.pop==="1"?"0 22px 46px rgba(8,23,48,.20), 0 0 0 1px rgba(125,211,252,.16) inset":"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset");
    const ring=el.querySelector('.plan-glow');
    if(ring) ring.style.opacity=on?"1":".72";
  };
  return(
    <Sec id="planes" title="Contabilidad integral para su empresa" sub="PLANES MENSUALES" bg={B[2]}>
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-34,marginBottom:16,fontFamily:F}}>Precios de referencia según volumen de información.</p>
      <div style={{textAlign:"center",marginBottom:34}}><a href="/planes-contables" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"11px 18px",borderRadius:13,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.12)",color:"#1D4ED8",fontSize:14,fontWeight:800,textDecoration:"none",fontFamily:F}}>Ver detalle de planes contables</a></div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:18}}>
        {plans.map((p,i)=>(
          <div
            key={i}
            data-pop={p.pop?"1":"0"}
            onMouseEnter={e=>cardHover(e,true)}
            onMouseLeave={e=>cardHover(e,false)}
            style={{
              padding:p.pop? "40px 28px 28px":"28px",
              borderRadius:20,
              position:"relative",
              overflow:"hidden",
              transform:"translateY(0) scale(1)",
              transition:"transform .34s ease, box-shadow .34s ease, border-color .34s ease",
              background:p.pop?"linear-gradient(145deg,#071427 0%, #0E274B 52%, #163B6A 100%)":"linear-gradient(180deg, rgba(255,255,255,.985), rgba(255,255,255,.94))",
              color:p.pop?"#F8FBFF":"#0B1D3A",
              border:p.pop?"1px solid rgba(125,211,252,.18)":"1px solid rgba(37,99,235,.09)",
              boxShadow:p.pop?"0 22px 46px rgba(8,23,48,.20), 0 0 0 1px rgba(125,211,252,.16) inset":"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset",
              backdropFilter:"blur(10px)",
              isolation:"isolate"
            }}
          >
            <div className="plan-glow" style={{position:"absolute",inset:-1,borderRadius:20,background:p.pop?"linear-gradient(120deg, rgba(56,189,248,0) 0%, rgba(96,165,250,.42) 22%, rgba(255,255,255,.82) 34%, rgba(59,130,246,.30) 48%, rgba(37,99,235,0) 64%, rgba(125,211,252,.22) 78%, rgba(37,99,235,0) 100%)":"linear-gradient(120deg, rgba(37,99,235,0) 0%, rgba(56,189,248,.38) 18%, rgba(255,255,255,.9) 32%, rgba(59,130,246,.22) 48%, rgba(37,99,235,0) 62%, rgba(125,211,252,.18) 78%, rgba(37,99,235,0) 100%)",backgroundSize:"220% 220%",animation:"cardGlowFlow 7.2s linear infinite",opacity:.72,filter:"blur(1px)",pointerEvents:"none"}}/>
            <div style={{position:"absolute",top:0,left:0,right:0,height:1.5,background:p.pop?"linear-gradient(90deg, rgba(125,211,252,0), rgba(125,211,252,.55), rgba(56,189,248,.35), rgba(125,211,252,0))":"linear-gradient(90deg, rgba(37,99,235,0), rgba(96,165,250,.44), rgba(56,189,248,.35), rgba(37,99,235,0))",zIndex:1}}/>
            {p.pop&&<div style={{position:"absolute",top:12,left:"50%",transform:"translateX(-50%)",background:"#60A5FA",color:"#fff",fontSize:10,fontWeight:700,padding:"4px 14px",borderRadius:100,fontFamily:F,zIndex:2}}>MÁS POPULAR</div>}
            <div style={{position:"relative",zIndex:2}}>
              <h3 style={{fontSize:20,fontWeight:700,fontFamily:F,marginBottom:4,color:p.pop?"#FFFFFF":"#0B1D3A"}}>{p.n}</h3>
              <div style={{fontSize:13,opacity:p.pop?.86:.62,marginBottom:8,fontFamily:F,color:p.pop?"rgba(255,255,255,.82)":"#5A6F8A"}}>{p.tg}</div>
              <div style={{marginBottom:16}}>
                <span style={{fontSize:14,textDecoration:"line-through",opacity:p.pop?.72:.5,fontFamily:F,color:p.pop?"rgba(255,255,255,.72)":"#64748B"}}>${fm(disc(p.p))}/mes</span>
                <span style={{display:"inline-block",marginLeft:8,fontSize:10,fontWeight:700,color:"#fff",background:"#DC2626",padding:"2px 8px",borderRadius:100,fontFamily:F}}>25% OFF</span>
                <div style={{fontSize:21,fontWeight:700,fontFamily:FH,color:p.pop?"#8DD8FF":"#2563EB",marginTop:4}}>Desde ${fm(p.p)}/mes</div>
              </div>
              {p.f.map((f,j)=><div key={j} style={{fontSize:14,padding:"5px 0",borderBottom:`1px solid ${p.pop?"rgba(255,255,255,.12)":"rgba(37,99,235,.05)"}`,fontFamily:F,opacity:p.pop?.98:.9,color:p.pop?"rgba(255,255,255,.94)":"#1F3147"}}>✓ {f}</div>)}
              <a href={wm(p.w)} target="_blank" rel="noopener noreferrer" style={{display:"block",marginTop:18,padding:"12px 20px",borderRadius:11,background:p.pop?"linear-gradient(135deg,#4FA2FF,#7CCBFF)":"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",textAlign:"center",fontFamily:F,boxShadow:p.pop?"0 12px 26px rgba(96,165,250,.22)":"0 12px 24px rgba(37,99,235,.16)"}}>Solicitar información</a>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  )
}

function ScnS(){const scn=[{e:"👔",t:"Soy empleado y necesito certificación para arrendar",d:"Le piden certificación de ingresos firmada por contador. La emitimos en horas, 100% en línea.",l:CERT_ROUTE},{e:"💼",t:"Soy independiente y no sé si debo declarar renta",d:"Sus ingresos pueden obligarlo a declarar. Use nuestra herramienta para verificar al instante.",l:"/debo-declarar-renta"},{e:"🏪",t:"Tengo una pyme y necesito organizar mi contabilidad",d:"Su empresa necesita estados financieros confiables y cumplimiento tributario. Nuestros planes lo cubren.",l:"/contabilidad-para-pymes"},{e:"📋",t:"Me pidieron renovar la matrícula mercantil",d:"El plazo vence el 31 de marzo. No renovar genera sanciones. Hacemos el trámite completo.",l:"#tramites"},{e:"🏗️",t:"Quiero crear mi empresa legalmente en Colombia",d:"SAS, LTDA o S.A., Cámara de Comercio, RUT y todos los requisitos para operar formalmente.",l:"/creacion-de-empresa"},{e:"🧮",t:"Quiero saber cuánto me retienen o debo pagar",d:"Use nuestras herramientas: retención en la fuente, planilla independientes, nómina e IVA.",l:"#herramientas"}];
return(<Sec id="escenarios" title="¿Se identifica con alguno de estos casos?" sub="¿EN QUÉ LE PODEMOS AYUDAR?" bg={B[3]}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>{scn.map((s,i)=><a key={i} href={s.l} style={{textDecoration:"none",color:"inherit"}}><Cd s={{cursor:"pointer"}}><div style={{fontSize:28,marginBottom:8}}>{s.e}</div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{s.t}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{s.d}</p><span style={{display:"inline-block",marginTop:8,fontSize:13,color:"#2563EB",fontWeight:600,fontFamily:F}}>Ver solución →</span></Cd></a>)}</div></Sec>)}

function TrmS(){const trm=[{i:"📄",t:"Certificación de Ingresos",d:"Documento firmado por Contador Público. Válido ante bancos, inmobiliarias, embajadas. 100% online, entrega inmediata.",l:CERT_ROUTE,w:"Necesito un certificado de ingresos."},{i:"📝",t:"Declaración de Renta",d:"Preparación y presentación ante la DIAN. Plazos 2026: 12 agosto al 26 octubre.",l:"/declaracion-de-renta-personas-naturales",w:"Necesito ayuda con mi declaración de renta."},{i:"🏢",t:"Renovación Matrícula Mercantil",d:"Gestión ante Cámara de Comercio. Plazo: 31 de marzo. Sanciones hasta 17 SMLMV.",l:"#contacto",w:"Necesito renovar mi matrícula mercantil."},{i:"🧾",t:"Facturación Electrónica",d:"Implementación completa: habilitación DIAN, proveedor tecnológico, capacitación y soporte.",l:"/facturacion-electronica",w:"Necesito implementar facturación electrónica."},{i:"📊",t:"Información Exógena",d:"Medios magnéticos ante la DIAN. Sanciones desde $524.000 hasta 5% de sumas no reportadas.",l:"#contacto",w:"Necesito ayuda con información exógena."},{i:"🏗️",t:"Creación de Empresas",d:"SAS, LTDA, S.A.: estatutos, Cámara de Comercio, RUT, cuenta bancaria e IVA.",l:"/creacion-de-empresa",w:"Quiero crear mi empresa en Colombia."}];
return(<Sec id="tramites" title="Trámites más solicitados" sub="TRÁMITES CLAVE" bg={B[4]}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>{trm.map((t,i)=><Cd key={i}><div style={{fontSize:26,marginBottom:6}}>{t.i}</div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{t.t}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{t.d}</p><div style={{display:"flex",gap:12,flexWrap:"wrap",marginTop:8}}><a href={t.l} style={{fontSize:13,color:"#2563EB",fontWeight:700,textDecoration:"none",fontFamily:F}}>Ver detalle →</a><a href={wm("Hola CONTARAE, "+t.w)} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#0F766E",fontWeight:700,textDecoration:"none",fontFamily:F}}>WhatsApp →</a></div></Cd>)}</div></Sec>)}

function MiniTrustIcon({kind}){
  const common={width:18,height:18,viewBox:"0 0 24 24",fill:"none",stroke:"currentColor",strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"};
  if(kind==="bank")return(<svg {...common}><path d="M3 10h18"/><path d="M5 10v7"/><path d="M9.5 10v7"/><path d="M14.5 10v7"/><path d="M19 10v7"/><path d="M2 17h20"/><path d="M12 4l9 4H3l9-4z"/></svg>);
  if(kind==="home")return(<svg {...common}><path d="M4 11.5L12 5l8 6.5"/><path d="M6.5 10.5V19h11v-8.5"/><path d="M10 19v-5h4v5"/></svg>);
  if(kind==="globe")return(<svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17"/><path d="M12 3.5c2.7 2.4 4.2 5.3 4.2 8.5S14.7 18.1 12 20.5C9.3 18.1 7.8 15.2 7.8 12S9.3 5.9 12 3.5z"/></svg>);
  if(kind==="car")return(<svg {...common}><path d="M5.5 15.5h13"/><path d="M7 15.5l1.3-4.1A2 2 0 0 1 10.2 10h3.6a2 2 0 0 1 1.9 1.4L17 15.5"/><circle cx="8" cy="16.5" r="1.5"/><circle cx="16" cy="16.5" r="1.5"/></svg>);
  if(kind==="doc")return(<svg {...common}><path d="M8 3.5h6l4 4V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 7 19V5A1.5 1.5 0 0 1 8.5 3.5z"/><path d="M14 3.5V8h4"/><path d="M9.5 12h5"/><path d="M9.5 15.5h5"/></svg>);
  return(<svg {...common}><path d="M12 3.5l6 2.2v5.2c0 4-2.4 7.1-6 9.1-3.6-2-6-5.1-6-9.1V5.7L12 3.5z"/><path d="M9.2 12.1l1.8 1.8 4-4"/></svg>);
}

function CertificationVideoSection(){
  return(
    <section style={{padding:"26px 24px 18px",background:B[6]}}>
      <div style={{maxWidth:980,margin:"0 auto",display:"grid",gap:18}}>
        <div style={{textAlign:"center",maxWidth:760,margin:"0 auto"}}>
          <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"7px 14px",borderRadius:999,background:"rgba(37,99,235,.06)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:800,color:"#2563EB",letterSpacing:"1.5px",marginBottom:12,fontFamily:F}}>VIDEO INSTRUCTIVO</div>
          <h2 style={{fontFamily:FH,fontSize:"clamp(26px,3.5vw,38px)",lineHeight:1.1,color:"#0B1D3A",margin:"0 0 10px"}}>Antes de comprar, mira cómo funciona el proceso</h2>
          <p style={{fontFamily:F,fontSize:15,color:"#52647F",lineHeight:1.8,margin:0}}>Te mostramos qué datos se diligencian, cómo se calculan las tarifas y qué soportes revisa CONTARAE antes de emitir la certificación firmada por Contador Público.</p>
        </div>
        <div style={{aspectRatio:"16 / 9",borderRadius:22,overflow:"hidden",boxShadow:"0 22px 54px rgba(15,23,42,.12)",border:"1px solid rgba(37,99,235,.12)",background:"#0B1D3A"}}>
          <iframe title="Paso a paso certificación de ingresos CONTARAE" src={CERTIFICATION_VIDEO_EMBED} style={{width:"100%",height:"100%",border:0,display:"block"}} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>
        </div>
      </div>
    </section>
  );
}

function LeadCaptureForm(){
  const initial={name:"",documentNumber:"",phone:"",email:"",serviceInterest:"Certificación de ingresos",comment:"",treatmentConsent:false,marketingConsent:false};
  const[form,setForm]=useState(initial);
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");
  const[error,setError]=useState("");
  const update=(field,value)=>setForm(current=>({
    ...current,
    [field]:field==="documentNumber"?onlyDigits(value):field==="phone"?normalizeColombianMobileNumber(value).slice(0,10):value
  }));
  const submit=async event=>{
    event.preventDefault();
    setMessage("");
    setError("");
    const normalized={...form,name:formatProperName(form.name),documentNumber:onlyDigits(form.documentNumber),phone:normalizeColombianMobileNumber(form.phone).slice(0,10),email:normalizeEmail(form.email)};
    setForm(normalized);
    if(!normalized.name||!normalized.documentNumber||!normalized.phone||!normalized.email){
      setError("Complete todos los datos de contacto.");
      return;
    }
    if(!isValidEmail(normalized.email)){
      setError("Ingrese un correo electrónico válido.");
      return;
    }
    setBusy(true);
    try{
      const response=await fetch("/api/submit-client-lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...normalized,sourcePath:window.location.pathname,marketingAttribution:getMarketingAttribution(),...getMarketingFormFields()})});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.detail||payload.error||"No fue posible registrar tus datos.");
      trackMarketingEvent("lead_submit",{service_interest:normalized.serviceInterest||"Certificación de ingresos",source_label:"Formulario web"});
      setMessage("Datos registrados correctamente. Te contactaremos por el canal que indicaste.");
      setForm(initial);
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  };

  return(
    <form onSubmit={submit} style={{position:"relative",zIndex:1,display:"grid",gap:10,textAlign:"left",padding:22,borderRadius:22,background:"rgba(255,255,255,.08)",border:"1px solid rgba(191,219,254,.18)",backdropFilter:"blur(10px)"}}>
      <div style={{fontSize:12,letterSpacing:"1.5px",fontWeight:900,color:"#93C5FD",fontFamily:F}}>RECIBE ASESORÍA</div>
      <div style={{fontFamily:FH,fontSize:24,lineHeight:1.15,color:"#fff"}}>Déjanos tus datos y te contactamos</div>
      <div className="lead-form-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
        <input required value={form.name} onChange={e=>update("name",e.target.value)} onBlur={e=>update("name",formatProperName(e.target.value))} placeholder="Nombre completo" autoComplete="name" style={{...IS,borderRadius:13}}/>
        <input required {...numericInputProps} value={form.documentNumber} onChange={e=>update("documentNumber",e.target.value)} placeholder="Documento o NIT" autoComplete="off" style={{...IS,borderRadius:13}}/>
        <input required {...numericInputProps} value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="WhatsApp (ej. 300 000 0000)" autoComplete="tel" style={{...IS,borderRadius:13}}/>
        <input required type="email" inputMode="email" value={form.email} onChange={e=>update("email",e.target.value)} onBlur={e=>update("email",normalizeEmail(e.target.value))} placeholder="Correo electrónico" autoComplete="email" style={{...IS,borderRadius:13}}/>
      </div>
      <select value={form.serviceInterest} onChange={e=>update("serviceInterest",e.target.value)} style={{...IS,borderRadius:13}}>
        {["Certificación de ingresos","Declaración de renta","Contabilidad mensual","Asesoría tributaria","Creación de empresa","Facturación electrónica","Otro servicio"].map(item=><option key={item} value={item}>{item}</option>)}
      </select>
      <textarea value={form.comment} onChange={e=>update("comment",e.target.value)} placeholder="Cuéntanos brevemente qué necesitas" style={{...IS,borderRadius:13,minHeight:86,resize:"vertical"}}/>
      <label style={{display:"flex",gap:10,alignItems:"flex-start",fontFamily:F,fontSize:12,color:"rgba(255,255,255,.78)",lineHeight:1.6}}>
        <input type="checkbox" checked={form.treatmentConsent} onChange={e=>update("treatmentConsent",e.target.checked)} required style={{marginTop:3}}/>
        Autorizo el tratamiento de mis datos personales conforme a la política de privacidad de CONTARAE para gestionar mi solicitud.
      </label>
      <label style={{display:"flex",gap:10,alignItems:"flex-start",fontFamily:F,fontSize:12,color:"rgba(255,255,255,.70)",lineHeight:1.6}}>
        <input type="checkbox" checked={form.marketingConsent} onChange={e=>update("marketingConsent",e.target.checked)} style={{marginTop:3}}/>
        Autorizo recibir comunicaciones comerciales o informativas por WhatsApp y/o correo.
      </label>
      {message?<div style={{padding:12,borderRadius:13,background:"rgba(34,197,94,.16)",color:"#DCFCE7",fontFamily:F,fontWeight:800,lineHeight:1.6}}>{message}</div>:null}
      {error?<div style={{padding:12,borderRadius:13,background:"rgba(220,38,38,.16)",color:"#FEE2E2",fontFamily:F,fontWeight:800,lineHeight:1.6}}>{error}</div>:null}
      <button type="submit" disabled={busy} style={{padding:"13px 18px",borderRadius:14,border:"none",background:busy?"#94A3B8":"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontFamily:F,fontWeight:900,cursor:busy?"not-allowed":"pointer"}}>
        {busy?"Enviando datos...":"Enviar datos"}
      </button>
      <style>{`@media(max-width:720px){.lead-form-grid{grid-template-columns:1fr!important;}}`}</style>
    </form>
  );
}

function CertificationPricingMiniCard(){
  return(
    <div className="cert-pricing-mini-card" style={{padding:22,borderRadius:24,background:"linear-gradient(160deg,#0B1D3A,#14345B)",color:"#fff",border:"1px solid rgba(125,211,252,.14)",boxShadow:"0 22px 50px rgba(15,23,42,.12)"}}>
      <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:14,flexWrap:"wrap"}}>
        <div>
          <div style={{fontSize:11,letterSpacing:"1.5px",fontWeight:900,color:"#93C5FD",fontFamily:F,marginBottom:6}}>TARIFAS CERTIFICACIÓN</div>
          <div style={{fontFamily:FH,fontSize:28,lineHeight:1.08,color:"#fff"}}>Desde $80.000</div>
        </div>
        <span style={{display:"inline-flex",alignItems:"center",padding:"7px 11px",borderRadius:999,background:"rgba(239,68,68,.16)",border:"1px solid rgba(239,68,68,.24)",fontSize:10,fontWeight:900,color:"#FECACA",fontFamily:F,whiteSpace:"nowrap"}}>15% OFF</span>
      </div>
      <p style={{fontSize:13,color:"rgba(226,232,240,.78)",lineHeight:1.7,fontFamily:F,margin:"0 0 12px"}}>Estas son las tarifas web vigentes según sus ingresos mensuales. ¿Tiene código promocional? Podrá ingresarlo antes del pago y obtener 15% adicional.</p>
      <div className="cert-price-tier-list" style={{display:"grid",gap:7}}>
        {CERTIFICATION_PRICE_TIERS.map((item,index)=>(
          <div key={item.range} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:12,alignItems:"center",padding:"9px 0",borderBottom:index===CERTIFICATION_PRICE_TIERS.length-1?"none":"1px solid rgba(125,211,252,.10)"}}>
            <span style={{fontSize:12,color:"rgba(226,232,240,.78)",fontFamily:F,lineHeight:1.55}}>{item.range}</span>
            <span style={{textAlign:"right",fontFamily:F,whiteSpace:"nowrap"}}><small style={{display:"block",fontSize:11,color:"rgba(226,232,240,.52)",fontWeight:800,textDecoration:"line-through"}}>${fm(certReferenceValue(item.value))}</small><strong style={{display:"block",fontSize:14,color:"#60A5FA"}}>${fm(item.value)}</strong></span>
          </div>
        ))}
      </div>
      <a href={CERT_ROUTE} style={{display:"flex",alignItems:"center",justifyContent:"center",marginTop:16,padding:"12px 16px",borderRadius:14,background:"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontSize:14,fontWeight:900,textDecoration:"none",fontFamily:F,boxShadow:"0 14px 28px rgba(37,99,235,.20)"}}>Iniciar solicitud</a>
    </div>
  )
}

function CertificationHero(){
  const heroMetrics=[["Tiempo estimado","Menos de 1 día hábil"],["Proceso","100% online"],["Pago","Wompi seguro"]];
  const recipientTags=[{label:"Bancos",kind:"bank"},{label:"Inmobiliarias",kind:"home"},{label:"Embajadas",kind:"globe"},{label:"Concesionarios",kind:"car"},{label:"Licitaciones",kind:"doc"},{label:"Arrendadores",kind:"shield"}];
  const processSteps=["Completa el formulario","Paga seguro con Wompi","Recibe el PDF listo para presentar"];
  const proofPoints=["Soportes verificables","Firma profesional","Seguimiento de referencia","Atención humana"];
  return(
    <section style={{padding:"164px 24px 48px",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#F4F8FF 0%,#E7F0FF 20%,#EAF7FF 52%,#F8FBFF 100%)",backgroundSize:"220% 220%",animation:"gradBg 20s ease-in-out infinite"}}>
      <style>{`
        @keyframes gradBg{
          0%{background-position:0% 50%}
          50%{background-position:100% 50%}
          100%{background-position:0% 50%}
        }
        @keyframes driftWave{
          0%{transform:translate3d(-18px,-6px,0) scale(1.01)}
          50%{transform:translate3d(56px,18px,0) scale(1.045)}
          100%{transform:translate3d(-18px,-6px,0) scale(1.01)}
        }
        @keyframes driftWaveAlt{
          0%{transform:translate3d(16px,8px,0) scale(1.01)}
          50%{transform:translate3d(-48px,-18px,0) scale(1.04)}
          100%{transform:translate3d(16px,8px,0) scale(1.01)}
        }
        @keyframes floatSoft{
          0%{transform:translateY(0px) scale(1)}
          50%{transform:translateY(-16px) scale(1.04)}
          100%{transform:translateY(0px) scale(1)}
        }
        @keyframes glowPulse{
          0%{opacity:.72}
          50%{opacity:1}
          100%{opacity:.72}
        }
      `}</style>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 14% 18%, rgba(59,130,246,.16) 0%, rgba(59,130,246,0) 24%), radial-gradient(circle at 84% 18%, rgba(14,165,233,.13) 0%, rgba(14,165,233,0) 22%), radial-gradient(circle at 74% 74%, rgba(96,165,250,.10) 0%, rgba(96,165,250,0) 20%)"}}/>
      <div style={{position:"absolute",top:"10%",left:"-7%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle, rgba(59,130,246,.18) 0%, rgba(59,130,246,0) 70%)",filter:"blur(18px)",animation:"floatSoft 13s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-12%",right:"-5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle, rgba(14,165,233,.16) 0%, rgba(14,165,233,0) 72%)",filter:"blur(18px)",animation:"floatSoft 16s ease-in-out infinite"}}/>
      <div style={{position:"absolute",top:"16%",left:"50%",transform:"translateX(-50%)",width:620,height:620,borderRadius:"50%",background:"radial-gradient(circle, rgba(96,165,250,.10) 0%, rgba(255,255,255,0) 67%)",filter:"blur(26px)",animation:"glowPulse 12s ease-in-out infinite"}}/>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.58,animation:"driftWave 15s ease-in-out infinite"}}>
        <defs>
          <linearGradient id="certWaveStroke1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(96,165,250,0)" />
            <stop offset="30%" stopColor="rgba(59,130,246,.24)" />
            <stop offset="60%" stopColor="rgba(14,165,233,.18)" />
            <stop offset="100%" stopColor="rgba(96,165,250,0)" />
          </linearGradient>
          <linearGradient id="certWaveStroke2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(59,130,246,0)" />
            <stop offset="45%" stopColor="rgba(59,130,246,.18)" />
            <stop offset="75%" stopColor="rgba(125,211,252,.15)" />
            <stop offset="100%" stopColor="rgba(59,130,246,0)" />
          </linearGradient>
        </defs>
        <path d="M-80 240 C 180 150, 360 350, 620 255 S 1120 130, 1680 270" fill="none" stroke="url(#certWaveStroke1)" strokeWidth="3" strokeLinecap="round"/>
        <path d="M-120 640 C 220 500, 480 760, 820 625 S 1280 520, 1720 690" fill="none" stroke="url(#certWaveStroke2)" strokeWidth="2.5" strokeLinecap="round"/>
        <path d="M1060 160 C 1220 230, 1280 340, 1170 470 C 1070 585, 1090 705, 1330 760" fill="none" stroke="rgba(59,130,246,.08)" strokeWidth="52" strokeLinecap="round"/>
      </svg>
      <svg viewBox="0 0 1600 900" preserveAspectRatio="none" style={{position:"absolute",inset:0,width:"100%",height:"100%",opacity:.5,animation:"driftWaveAlt 17s ease-in-out infinite"}}>
        <path d="M-120 330 C 140 250, 390 440, 660 360 S 1130 255, 1720 410" fill="none" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" strokeLinecap="round"/>
        <path d="M-100 710 C 180 610, 470 820, 820 710 S 1270 620, 1710 760" fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="1.2" strokeLinecap="round"/>
      </svg>
      <div className="cert-hero-wrap" style={{maxWidth:1080,margin:"0 auto",position:"relative",zIndex:1}}>
        <div className="cert-hero-grid" style={{display:"grid",gridTemplateColumns:"minmax(0,1.02fr) minmax(320px,.88fr)",gap:20,alignItems:"start"}}>
          <div className="cert-hero-copy" style={{padding:"30px 30px 26px",borderRadius:28,background:"linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.90))",border:"1px solid rgba(37,99,235,.10)",boxShadow:"0 22px 50px rgba(15,23,42,.08)"}}>
            <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",marginBottom:12}}>
              <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#2563EB",letterSpacing:"1.6px",fontFamily:F}}>EMISIÓN ÁGIL Y 100% ONLINE</div>
            </div>
            <div style={{fontSize:11,letterSpacing:"1.8px",fontWeight:800,color:"#64748B",fontFamily:F,marginBottom:10}}>CERTIFICACIÓN DE INGRESOS CON RESPALDO CONTABLE</div>
            <h1 style={{fontFamily:FH,fontSize:"clamp(28px,4.2vw,44px)",fontWeight:700,lineHeight:1.04,color:"#0B1D3A",marginBottom:12,maxWidth:640}}>Recibe tu certificación de ingresos lista para presentar y con respaldo profesional</h1>
            <p style={{fontSize:16,color:"#3F5A7A",lineHeight:1.78,fontFamily:F,maxWidth:620,marginBottom:18}}>Documento firmado por Contador Público, ideal para bancos, arriendos, embajadas y otros trámites que requieren una certificación seria, clara y bien presentada.</p>
            <div className="cert-hero-actions" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:12}}>
              <a href="#certificacion-info" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 24px",borderRadius:14,background:"#fff",color:"#1D4ED8",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,border:"1px solid rgba(37,99,235,.14)"}}>Conoce más sobre la certificación</a>
              <button type="button" onClick={openCertificationForm} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 16px 30px rgba(37,99,235,.18)",border:"none",cursor:"pointer"}}>Iniciar solicitud</button>
            </div>
            <div style={{fontSize:14,color:"#52647F",fontFamily:F,marginBottom:16,lineHeight:1.7}}>Si los soportes están claros, en muchos casos puede quedar lista <strong style={{color:"#0B1D3A"}}>el mismo día o en menos de 1 día hábil</strong>.</div>
            <div className="cert-proof-row" style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:16}}>
              {proofPoints.map((item,i)=><div key={i} style={{display:"inline-flex",alignItems:"center",gap:8,padding:"10px 14px",borderRadius:999,background:"rgba(11,29,58,.04)",border:"1px solid rgba(37,99,235,.08)",fontSize:12,fontWeight:700,color:"#37506F",fontFamily:F}}><span style={{width:20,height:20,borderRadius:"50%",display:"inline-flex",alignItems:"center",justifyContent:"center",background:"rgba(37,99,235,.10)",color:"#2563EB",fontSize:12}}>✓</span>{item}</div>)}
            </div>
            <div className="cert-metrics-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:12}}>
              {heroMetrics.map(([label,value],i)=><div key={i} style={{padding:"16px 16px",borderRadius:18,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.10)"}}><div style={{fontSize:11,letterSpacing:"1.3px",fontWeight:800,color:"#64748B",fontFamily:F,marginBottom:6}}>{label}</div><div style={{fontSize:22,fontWeight:800,color:"#0B1D3A",lineHeight:1.1,fontFamily:F}}>{value}</div></div>)}
            </div>
          </div>
          <div className="cert-hero-side" style={{padding:"24px 22px",borderRadius:28,background:"linear-gradient(160deg,#0B1D3A,#14345B)",color:"#fff",border:"1px solid rgba(125,211,252,.14)",boxShadow:"0 22px 50px rgba(15,23,42,.12)",display:"grid",gap:14,alignContent:"start"}}>
            <div style={{padding:"18px 18px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-end",marginBottom:10,flexWrap:"wrap"}}>
                <div>
                  <div style={{fontSize:11,letterSpacing:"1.6px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:6}}>TARIFA WEB VIGENTE</div>
                  <div style={{fontSize:30,fontWeight:800,lineHeight:1,color:"#fff",fontFamily:F}}>Desde $80.000</div>
                </div>
                <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"7px 12px",borderRadius:999,background:"rgba(239,68,68,.16)",border:"1px solid rgba(239,68,68,.24)",fontSize:11,fontWeight:800,color:"#FECACA",fontFamily:F}}>15% OFF</div>
              </div>
              <div style={{fontSize:12,color:"rgba(226,232,240,.78)",fontFamily:F,lineHeight:1.65,marginBottom:10}}>
                El precio depende del rango de ingresos mensuales. Si tiene código promocional, podrá ingresarlo antes del pago para obtener 15% adicional.
              </div>
              <div style={{display:"grid",gap:8}}>
                {CERTIFICATION_PRICE_TIERS.map((item,i)=><div key={item.range} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:12,padding:"8px 0",borderBottom:i===CERTIFICATION_PRICE_TIERS.length-1?"none":"1px solid rgba(125,211,252,.10)"}}><div style={{fontSize:12,color:"rgba(226,232,240,.76)",fontFamily:F,lineHeight:1.6}}>{item.range}</div><div style={{fontFamily:F,whiteSpace:"nowrap",textAlign:"right"}}><span style={{display:"block",fontSize:11,fontWeight:800,color:"rgba(226,232,240,.48)",textDecoration:"line-through"}}>${fm(certReferenceValue(item.value))}</span><span style={{display:"block",fontSize:14,fontWeight:900,color:"#60A5FA"}}>${fm(item.value)}</span></div></div>)}
              </div>
            </div>
            <div style={{padding:"16px 16px 14px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{fontSize:11,letterSpacing:"1.7px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:12}}>VÁLIDA PARA PRESENTAR ANTE</div>
              <div className="cert-recipient-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                {recipientTags.map((item,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:16,background:"rgba(255,255,255,.05)",border:"1px solid rgba(125,211,252,.08)"}}><div style={{width:32,height:32,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(147,197,253,.12)",color:"#BBDDFF"}}><MiniTrustIcon kind={item.kind}/></div><div style={{fontSize:13,fontWeight:700,color:"#E8F2FF",fontFamily:F,lineHeight:1.35}}>{item.label}</div></div>)}
              </div>
            </div>
            <div style={{padding:"16px 16px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{fontSize:11,letterSpacing:"1.5px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:10}}>PROCESO CLARO</div>
              <div style={{display:"grid",gap:10}}>
                {processSteps.map((item,i)=><div key={i} style={{display:"grid",gridTemplateColumns:"28px minmax(0,1fr)",gap:10,alignItems:"start"}}><div style={{width:28,height:28,borderRadius:"50%",background:"rgba(96,165,250,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",fontFamily:F}}>{i+1}</div><div style={{fontSize:14,color:"rgba(226,232,240,.86)",lineHeight:1.65,fontFamily:F,fontWeight:600}}>{item}</div></div>)}
              </div>
            </div>
            <div style={{padding:"16px 18px",borderRadius:18,background:"rgba(255,255,255,.08)",border:"1px solid rgba(125,211,252,.12)",fontSize:13,color:"rgba(226,232,240,.84)",lineHeight:1.75,fontFamily:F}}>Atención humana por WhatsApp y correo, revisión profesional antes de emitir y seguimiento por referencia durante todo el proceso.</div>
          </div>
        </div>
      </div>
    </section>
  )
}

function CertificationSupportPage({config}){
  const related=CERTIFICATION_SUPPORT_ROUTES.filter(item=>item.path!==config.path).slice(0,4);
  return(
    <>
      <section id={config.sectionId} style={{padding:"154px 24px 56px",background:"linear-gradient(135deg,#F4F8FF 0%,#EAF7FF 52%,#F8FBFF 100%)",overflow:"hidden"}}>
        <div style={{maxWidth:1060,margin:"0 auto",display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(320px,.46fr)",gap:24,alignItems:"center"}} className="cert-hero-grid">
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.12)",fontSize:11,fontWeight:800,color:"#2563EB",letterSpacing:"1.5px",fontFamily:F,marginBottom:16}}>{config.badge}</div>
            <h1 style={{fontFamily:FH,fontSize:"clamp(31px,4.5vw,52px)",lineHeight:1.04,color:"#0B1D3A",margin:"0 0 16px",maxWidth:760}}>{config.title}</h1>
            <p style={{fontFamily:F,fontSize:17,color:"#3F5A7A",lineHeight:1.85,margin:"0 0 16px",maxWidth:780}}>{config.intro}</p>
            <p style={{fontFamily:F,fontSize:15,color:"#52647F",lineHeight:1.8,margin:"0 0 24px",maxWidth:780}}>{config.intent}</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              <a href={CERT_ROUTE} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontSize:15,fontWeight:800,textDecoration:"none",fontFamily:F,boxShadow:"0 16px 30px rgba(37,99,235,.18)"}}>Solicitar certificación</a>
              <a href="#guia-certificacion" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 24px",borderRadius:14,background:"#fff",color:"#1D4ED8",fontSize:15,fontWeight:800,textDecoration:"none",fontFamily:F,border:"1px solid rgba(37,99,235,.14)"}}>Ver guía del caso</a>
            </div>
            <div style={{display:"flex",gap:10,flexWrap:"wrap",marginTop:16}}>
              {[CERT_DELIVERY_PROMISE,"Firma de Contador Público","Pago seguro y atención por WhatsApp"].map(item=>(
                <span key={item} style={{display:"inline-flex",alignItems:"center",padding:"9px 13px",borderRadius:999,background:"#fff",border:"1px solid rgba(37,99,235,.14)",color:"#1B3A5C",fontSize:13,fontWeight:800,fontFamily:F,boxShadow:"0 10px 24px rgba(15,23,42,.05)"}}>{item}</span>
              ))}
            </div>
          </div>
          <div className="cert-support-side" style={{display:"grid",gap:14}}>
            <div style={{padding:24,borderRadius:24,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 22px 50px rgba(15,23,42,.08)"}}>
              <div style={{fontSize:12,letterSpacing:"1.4px",fontWeight:900,color:"#1D4ED8",fontFamily:F,marginBottom:14}}>ANTES DE SOLICITAR</div>
              <div style={{display:"grid",gap:12}}>
                {config.checklist.map((item,index)=><div key={index} style={{display:"grid",gridTemplateColumns:"28px minmax(0,1fr)",gap:10,alignItems:"start"}}><div style={{width:28,height:28,borderRadius:"50%",background:"rgba(37,99,235,.10)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:"#2563EB",fontFamily:F}}>{index+1}</div><div style={{fontSize:14,color:"#334155",lineHeight:1.65,fontFamily:F,fontWeight:650}}>{item}</div></div>)}
              </div>
            </div>
            <div style={{padding:16,borderRadius:22,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 18px 42px rgba(15,23,42,.06)"}}>
              <div style={{fontSize:11,letterSpacing:"1.4px",fontWeight:900,color:"#1D4ED8",fontFamily:F,marginBottom:10}}>VIDEO INSTRUCTIVO</div>
              <div style={{aspectRatio:"16 / 9",borderRadius:16,overflow:"hidden",background:"#0B1D3A",border:"1px solid rgba(37,99,235,.10)"}}>
                <iframe title="Paso a paso certificación de ingresos CONTARAE" src={CERTIFICATION_VIDEO_EMBED} style={{width:"100%",height:"100%",border:0,display:"block"}} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{padding:"34px 24px 24px",background:B[6]}}>
        <div style={{maxWidth:1060,margin:"0 auto"}}>
          <CertificationPricingMiniCard/>
        </div>
      </section>

      <Sec id="guia-certificacion" title="Guía práctica para este caso" sub="CONTENIDO ÚTIL" bg={B[1]}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(6,minmax(0,1fr))",gap:18}} className="tool-grid cert-support-guide-grid">
          {config.cards.map(([title,desc],index)=>(
            <Cd key={index} s={{background:"#fff"}} className="cert-support-guide-card">
              <h2 style={{fontFamily:FH,fontSize:24,lineHeight:1.2,color:"#0B1D3A",marginBottom:10}}>{title}</h2>
              <p style={{fontSize:15,color:"#52647F",lineHeight:1.85,margin:0}}>{desc}</p>
            </Cd>
          ))}
        </div>
      </Sec>

      <Sec id="preguntas-caso" title="Preguntas frecuentes de este caso" sub="ACLARACIONES" bg={B[6]} narrow>
        <div style={{display:"grid",gap:12}}>
          {config.faqs.map(([question,answer],index)=>(
            <div key={index} style={{padding:"22px 24px",borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 14px 30px rgba(15,23,42,.04)"}}>
              <h2 style={{fontFamily:F,fontSize:17,lineHeight:1.4,color:"#0B1D3A",margin:"0 0 8px",fontWeight:900}}>{question}</h2>
              <p style={{fontSize:15,color:"#52647F",lineHeight:1.85,margin:0}}>{answer}</p>
            </div>
          ))}
        </div>
      </Sec>

      <Sec id="rutas-relacionadas" title="También puede interesarle" sub="RUTAS RELACIONADAS" bg={B[1]}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14}} className="tool-grid">
          {related.map(item=>(
            <a key={item.path} href={item.path} style={{display:"block",padding:18,borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 12px 26px rgba(15,23,42,.04)",textDecoration:"none"}}>
              <div style={{fontFamily:F,fontSize:11,letterSpacing:"1.2px",fontWeight:900,color:"#2563EB",marginBottom:8}}>GUÍA</div>
              <h2 style={{fontFamily:FH,fontSize:19,lineHeight:1.25,color:"#0B1D3A",margin:"0 0 8px"}}>{item.title}</h2>
              <p style={{fontFamily:F,fontSize:13,color:"#64748B",lineHeight:1.65,margin:0}}>Leer guía específica y continuar hacia la solicitud principal.</p>
            </a>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:24}}>
          <a href={CERT_ROUTE} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontSize:15,fontWeight:800,textDecoration:"none",fontFamily:F}}>Ir a la página principal de certificación</a>
        </div>
      </Sec>
    </>
  );
}

function RentaLeadCapture(){
  const initial={name:"",phone:"",email:"",documentInput:"",treatmentConsent:false,marketingConsent:true};
  const[form,setForm]=useState(initial);
  const[busy,setBusy]=useState(false);
  const[message,setMessage]=useState("");
  const[error,setError]=useState("");
  const dueInfo=getRentaDueInfo(form.documentInput);
  const update=(field,value)=>setForm(current=>({
    ...current,
    [field]:field==="phone"?normalizeColombianMobileNumber(value).slice(0,10):field==="documentInput"?onlyDigits(value).slice(0,12):value
  }));
  const whatsappConsultation=wm("Hola CONTARAE, quiero confirmar sin costo si estoy obligado a declarar renta.");
  const submit=async event=>{
    event.preventDefault();
    setMessage("");
    setError("");
    const normalized={
      ...form,
      name:formatProperName(form.name),
      phone:normalizeColombianMobileNumber(form.phone).slice(0,10),
      email:normalizeEmail(form.email),
      documentInput:onlyDigits(form.documentInput),
      lastTwoDigits:onlyDigits(form.documentInput).slice(-2)
    };
    setForm(normalized);
    const currentDue=getRentaDueInfo(normalized.lastTwoDigits);
    if(!normalized.name||!normalized.phone||!normalized.email||normalized.documentInput.length<2){
      setError("Complete nombre, WhatsApp, correo y documento o últimos dos dígitos.");
      return;
    }
    if(!isValidEmail(normalized.email)){
      setError("Ingrese un correo electrónico válido.");
      return;
    }
    if(!isValidColombianMobileNumber(normalized.phone)){
      setError("Ingrese un WhatsApp colombiano válido.");
      return;
    }
    setBusy(true);
    try{
      const comment=[
        "Solicita confirmación sin costo sobre obligación de declarar renta.",
        currentDue?`Últimos dos dígitos: ${currentDue.lastTwoDigits}. Fecha estimada de vencimiento: ${currentDue.label}.`:"Fecha pendiente por confirmar.",
        "La gestión de consulta se realizará principalmente por WhatsApp."
      ].join(" ");
      const response=await fetch("/api/submit-client-lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        name:normalized.name,
        phone:normalized.phone,
        email:normalized.email,
        documentNumber:normalized.documentInput,
        serviceInterest:"Declaración de renta",
        comment,
        treatmentConsent:normalized.treatmentConsent,
        marketingConsent:normalized.marketingConsent,
        sourcePath:window.location.pathname,
        sourceLabel:"Formulario corto renta",
        campaign:RENTA_CAMPAIGN_ID,
        taxCampaign:RENTA_CAMPAIGN_ID,
        taxYear:RENTA_TAX_YEAR,
        filingYear:RENTA_FILING_YEAR,
        taxLastTwoDigits:normalized.lastTwoDigits,
        estimatedDueDate:currentDue?.estimatedDueDate||"",
        dueDateLabel:currentDue?.label||"",
        taxLeadType:"confirmacion_gratuita",
        marketingAttribution:getMarketingAttribution(),
        ...getMarketingFormFields()
      })});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.detail||payload.error||"No fue posible registrar tus datos.");
      trackMarketingEvent("lead_submit",{service_interest:"Declaración de renta",source_label:"Formulario corto renta",campaign:RENTA_CAMPAIGN_ID});
      setMessage("Datos recibidos. Te contactaremos por WhatsApp para confirmar sin costo si estás obligado a declarar renta.");
      setForm(initial);
    }catch(err){
      setError(err.message);
    }finally{
      setBusy(false);
    }
  };

  return(
    <form onSubmit={submit} style={{padding:22,borderRadius:24,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 22px 50px rgba(15,23,42,.10)",display:"grid",gap:12}}>
      <div>
        <div style={{fontSize:11,letterSpacing:"1.4px",fontWeight:900,color:"#1D4ED8",fontFamily:F,marginBottom:8}}>CONFIRMACIÓN SIN COSTO</div>
        <h2 style={{fontFamily:FH,fontSize:25,lineHeight:1.12,color:"#0B1D3A",margin:"0 0 8px"}}>Confirma si estás obligado a declarar renta sin ningún costo</h2>
        <p style={{fontFamily:F,fontSize:14,color:"#52647F",lineHeight:1.7,margin:0}}>Déjanos tus datos principales y un asesor te contactará por WhatsApp para orientar la revisión inicial sin costo.</p>
      </div>
      <input required value={form.name} onChange={e=>update("name",e.target.value)} onBlur={e=>update("name",formatProperName(e.target.value))} placeholder="Nombre completo" autoComplete="name" style={IS}/>
      <input required {...numericInputProps} value={form.phone} onChange={e=>update("phone",e.target.value)} placeholder="WhatsApp" autoComplete="tel" style={IS}/>
      <input required type="email" inputMode="email" value={form.email} onChange={e=>update("email",e.target.value)} onBlur={e=>update("email",normalizeEmail(e.target.value))} placeholder="Correo electrónico" autoComplete="email" style={IS}/>
      <div>
        <label style={{display:"block",fontSize:13,fontWeight:800,color:"#1B3A5C",fontFamily:F,marginBottom:6}}>Documento o últimos dos dígitos</label>
        <input required {...numericInputProps} value={form.documentInput} onChange={e=>update("documentInput",e.target.value)} placeholder="Ej. 10203045 o 45" maxLength="12" autoComplete="off" style={{...IS,fontSize:18,fontWeight:900,textAlign:"center",letterSpacing:"1px"}}/>
        <div style={{fontFamily:F,fontSize:12,color:"#64748B",lineHeight:1.6,marginTop:6}}>
          {dueInfo?<>Fecha estimada de vencimiento: <strong>{dueInfo.label}</strong>.</>:"Con este dato calculamos el vencimiento estimado para recordarte a tiempo."}
        </div>
      </div>
      <label style={{display:"flex",gap:9,fontSize:12,color:"#475569",fontFamily:F,lineHeight:1.6}}>
        <input required type="checkbox" checked={form.treatmentConsent} onChange={e=>update("treatmentConsent",e.target.checked)}/>
        Autorizo el tratamiento de mis datos personales para gestionar esta solicitud.
      </label>
      <label style={{display:"flex",gap:9,fontSize:12,color:"#475569",fontFamily:F,lineHeight:1.6}}>
        <input type="checkbox" checked={form.marketingConsent} onChange={e=>update("marketingConsent",e.target.checked)}/>
        Autorizo recibir recordatorios e información relacionada por WhatsApp y/o correo.
      </label>
      {message?<div style={{padding:12,borderRadius:13,background:"rgba(34,197,94,.12)",color:"#15803D",fontFamily:F,fontWeight:800,lineHeight:1.6}}>{message}</div>:null}
      {error?<div style={{padding:12,borderRadius:13,background:"rgba(220,38,38,.10)",color:"#991B1B",fontFamily:F,fontWeight:800,lineHeight:1.6}}>{error}</div>:null}
      <button type="submit" disabled={busy} style={{padding:"13px 18px",borderRadius:14,border:"none",background:busy?"#94A3B8":"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontFamily:F,fontWeight:900,cursor:busy?"not-allowed":"pointer"}}>
        {busy?"Registrando...":"Solicitar confirmación gratis"}
      </button>
      <a href={whatsappConsultation} target="_blank" rel="noopener noreferrer" onClick={()=>trackMarketingEvent("renta_whatsapp_click",{source_label:"Formulario corto renta"})} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"12px 16px",borderRadius:14,background:"#25D366",color:"#fff",fontFamily:F,fontWeight:900,textDecoration:"none"}}>
        Prefiero consultar por WhatsApp
      </a>
      <div style={{fontFamily:F,fontSize:11,color:"#64748B",lineHeight:1.6}}>La revisión inicial se orienta por WhatsApp; si luego decides avanzar, el alcance se confirma caso por caso.</div>
    </form>
  );
}

function ServiceSeoPage({config}){
  const related=SERVICE_SEO_ROUTES.filter(item=>item.path!==config.path).slice(0,4);
  const isRentaPage=config.path==="/declaracion-de-renta-personas-naturales";
  return(
    <>
      <section id={config.sectionId} style={{padding:"154px 24px 58px",background:"linear-gradient(135deg,#F4F8FF 0%,#EAF7FF 52%,#F8FBFF 100%)",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 14% 18%, rgba(37,99,235,.13) 0%, rgba(37,99,235,0) 25%), radial-gradient(circle at 86% 20%, rgba(14,165,233,.11) 0%, rgba(14,165,233,0) 24%)",pointerEvents:"none"}}/>
        <div style={{maxWidth:1080,margin:"0 auto",display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(300px,.48fr)",gap:24,alignItems:"start",position:"relative",zIndex:1}} className="cert-hero-grid">
          <div>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.12)",fontSize:11,fontWeight:900,color:"#2563EB",letterSpacing:"1.5px",fontFamily:F,marginBottom:16}}>{config.badge}</div>
            <h1 style={{fontFamily:FH,fontSize:"clamp(31px,4.4vw,52px)",lineHeight:1.05,color:"#0B1D3A",margin:"0 0 16px",maxWidth:820}}>{config.title}</h1>
            <p style={{fontFamily:F,fontSize:17,color:"#3F5A7A",lineHeight:1.85,margin:"0 0 14px",maxWidth:780}}>{config.intro}</p>
            <p style={{fontFamily:F,fontSize:15,color:"#52647F",lineHeight:1.82,margin:"0 0 24px",maxWidth:780}}>{config.intent}</p>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}} className="cert-hero-actions">
              {isRentaPage?<a href="#confirmar-renta" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontSize:15,fontWeight:800,textDecoration:"none",fontFamily:F,boxShadow:"0 16px 30px rgba(37,99,235,.18)"}}>Confirmar obligación sin costo</a>:null}
              <a href="#detalle-servicio" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 24px",borderRadius:14,background:"#fff",color:"#1D4ED8",fontSize:15,fontWeight:800,textDecoration:"none",fontFamily:F,border:"1px solid rgba(37,99,235,.14)"}}>Ver detalles</a>
              {!isRentaPage?<a href={wm(config.whatsapp)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontSize:15,fontWeight:800,textDecoration:"none",fontFamily:F,boxShadow:"0 16px 30px rgba(37,99,235,.18)"}}>{config.ctaLabel}</a>:null}
            </div>
          </div>
          {isRentaPage?<div id="confirmar-renta"><RentaLeadCapture/></div>:<div style={{padding:22,borderRadius:24,background:"linear-gradient(160deg,#0B1D3A,#14345B)",color:"#fff",border:"1px solid rgba(125,211,252,.14)",boxShadow:"0 22px 50px rgba(15,23,42,.12)",display:"grid",gap:12}}>
            <div style={{fontSize:11,letterSpacing:"1.6px",fontWeight:900,color:"#93C5FD",fontFamily:F}}>RESUMEN DEL SERVICIO</div>
            {config.highlights.map(([label,text],index)=>(
              <div key={index} style={{padding:"14px 14px",borderRadius:18,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
                <div style={{fontSize:11,letterSpacing:"1.2px",fontWeight:900,color:"#BFDBFE",fontFamily:F,marginBottom:5}}>{label.toUpperCase()}</div>
                <div style={{fontSize:14,color:"rgba(240,249,255,.92)",lineHeight:1.65,fontFamily:F,fontWeight:650}}>{text}</div>
              </div>
            ))}
          </div>}
        </div>
      </section>

      <Sec id="detalle-servicio" title="Qué incluye este servicio" sub="ALCANCE" bg={B[1]}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:18}} className="tool-grid">
          {config.cards.map(([title,desc],index)=>(
            <Cd key={index} s={{background:"#fff"}}>
              <h2 style={{fontFamily:FH,fontSize:23,lineHeight:1.22,color:"#0B1D3A",marginBottom:10}}>{title}</h2>
              <p style={{fontSize:15,color:"#52647F",lineHeight:1.85,margin:0}}>{desc}</p>
            </Cd>
          ))}
        </div>
      </Sec>

      <Sec id="proceso-servicio" title="Cómo iniciar" sub="PROCESO" bg={B[6]} narrow>
        <div style={{display:"grid",gap:12}}>
          {config.checklist.map((item,index)=>(
            <div key={index} style={{display:"grid",gridTemplateColumns:"36px minmax(0,1fr)",gap:12,alignItems:"start",padding:"18px 20px",borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 14px 30px rgba(15,23,42,.04)"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"rgba(37,99,235,.10)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:"#2563EB",fontFamily:F}}>{index+1}</div>
              <div style={{fontSize:15,color:"#334155",lineHeight:1.75,fontFamily:F,fontWeight:650}}>{item}</div>
            </div>
          ))}
        </div>
        <div style={{textAlign:"center",marginTop:24}}>
          <a href={wm(config.whatsapp)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontSize:15,fontWeight:800,textDecoration:"none",fontFamily:F}}>{config.ctaLabel}</a>
        </div>
      </Sec>

      <Sec id="preguntas-servicio" title="Preguntas frecuentes" sub="ACLARACIONES" bg={B[1]} narrow>
        <div style={{display:"grid",gap:12}}>
          {config.faqs.map(([question,answer],index)=>(
            <div key={index} style={{padding:"22px 24px",borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 14px 30px rgba(15,23,42,.04)"}}>
              <h2 style={{fontFamily:F,fontSize:17,lineHeight:1.4,color:"#0B1D3A",margin:"0 0 8px",fontWeight:900}}>{question}</h2>
              <p style={{fontSize:15,color:"#52647F",lineHeight:1.85,margin:0}}>{answer}</p>
            </div>
          ))}
        </div>
      </Sec>

      <Sec id="servicios-relacionados" title="Servicios relacionados" sub="TAMBIÉN PUEDE INTERESARLE" bg={B[6]}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14}} className="tool-grid">
          {related.map(item=>(
            <a key={item.path} href={item.path} style={{display:"block",padding:18,borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 12px 26px rgba(15,23,42,.04)",textDecoration:"none"}}>
              <div style={{fontFamily:F,fontSize:11,letterSpacing:"1.2px",fontWeight:900,color:"#2563EB",marginBottom:8}}>SERVICIO</div>
              <h2 style={{fontFamily:FH,fontSize:19,lineHeight:1.25,color:"#0B1D3A",margin:"0 0 8px"}}>{item.title}</h2>
              <p style={{fontFamily:F,fontSize:13,color:"#64748B",lineHeight:1.65,margin:0}}>Ver detalle del servicio y opciones de contacto.</p>
            </a>
          ))}
        </div>
      </Sec>
    </>
  );
}

function ToolRouteWidget({toolId}){
  const uv25=49799,uv26=52374;
  if(toolId==="tool-renta")return <ToolRenta uv={uv25}/>;
  if(toolId==="tool-retencion")return <ToolRet uv25={uv25} uv26={uv26}/>;
  if(toolId==="tool-planilla")return <ToolPlan/>;
  if(toolId==="tool-nomina")return <ToolNom/>;
  if(toolId==="tool-iva")return <ToolIVA/>;
  if(toolId==="tool-precio")return <ToolPrIVA/>;
  return null;
}

function ToolRouteHero({config}){
  return(
    <section style={{padding:"154px 24px 46px",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,#F4F8FF 0%,#E7F0FF 20%,#EAF7FF 52%,#F8FBFF 100%)",backgroundSize:"220% 220%",animation:"gradBg 20s ease-in-out infinite"}}>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 14% 18%, rgba(59,130,246,.16) 0%, rgba(59,130,246,0) 24%), radial-gradient(circle at 84% 18%, rgba(14,165,233,.13) 0%, rgba(14,165,233,0) 22%), radial-gradient(circle at 74% 74%, rgba(96,165,250,.10) 0%, rgba(96,165,250,0) 20%)"}}/>
      <div style={{position:"absolute",top:"10%",left:"-7%",width:360,height:360,borderRadius:"50%",background:"radial-gradient(circle, rgba(59,130,246,.18) 0%, rgba(59,130,246,0) 70%)",filter:"blur(18px)",animation:"floatSoft 13s ease-in-out infinite"}}/>
      <div style={{position:"absolute",bottom:"-12%",right:"-5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle, rgba(14,165,233,.16) 0%, rgba(14,165,233,0) 72%)",filter:"blur(18px)",animation:"floatSoft 16s ease-in-out infinite"}}/>
      <div className="cert-hero-wrap" style={{maxWidth:1100,margin:"0 auto",position:"relative",zIndex:1,display:"grid",gap:18}}>
        <div style={{display:"flex",justifyContent:"center"}}>
          <div className="app-cert-banner" style={{width:"min(760px,calc(100% - 48px))",display:"flex",justifyContent:"center"}}>
            <div className="app-cert-banner-inner" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",gap:12,padding:"8px 18px",borderRadius:18,background:"linear-gradient(90deg,#1e3a8a 0%,#2563eb 100%)",color:"#fff",boxShadow:"0 18px 34px rgba(37,99,235,.16)"}}>
              <span style={{fontSize:18,lineHeight:1}}>🧮</span>
              <span style={{fontSize:14,fontWeight:800,letterSpacing:".02em"}}>{config.heroBadge}</span>
              <a href={`#${config.sectionId}`} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"7px 14px",borderRadius:999,background:"rgba(255,255,255,.16)",color:"#fff",textDecoration:"none",fontSize:13,fontWeight:800,border:"1px solid rgba(255,255,255,.12)"}}>Usar herramienta</a>
            </div>
          </div>
        </div>

        <div className="cert-hero-grid" style={{display:"grid",gridTemplateColumns:"minmax(0,1.03fr) minmax(320px,.87fr)",gap:20,alignItems:"start"}}>
          <div className="cert-hero-copy" style={{padding:"30px 30px 26px",borderRadius:28,background:"linear-gradient(180deg, rgba(255,255,255,.96), rgba(255,255,255,.90))",border:"1px solid rgba(37,99,235,.10)",boxShadow:"0 22px 50px rgba(15,23,42,.08)"}}>
            <div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"8px 16px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#2563EB",letterSpacing:"1.6px",fontFamily:F,marginBottom:12}}>{config.heroKicker}</div>
            <h1 style={{fontFamily:FH,fontSize:"clamp(30px,4.2vw,46px)",fontWeight:700,lineHeight:1.04,color:"#0B1D3A",marginBottom:12,maxWidth:690}}>{config.heroTitle}</h1>
            <p style={{fontSize:17,color:"#3F5A7A",lineHeight:1.82,fontFamily:F,maxWidth:650,marginBottom:18}}>{config.heroDesc}</p>
            <div className="cert-hero-actions" style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:14}}>
              <a href={`#${config.sectionId}-info`} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 24px",borderRadius:14,background:"#fff",color:"#1D4ED8",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,border:"1px solid rgba(37,99,235,.14)"}}>Conoce más sobre la herramienta</a>
              <a href={`#${config.sectionId}`} style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#2563EB,#38BDF8)",color:"#fff",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 16px 30px rgba(37,99,235,.18)"}}>Usar herramienta</a>
            </div>
            <div className="cert-proof-row" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}}>
              {config.highlights.map(([label,text],i)=>(
                <div key={i} style={{padding:"14px 14px",borderRadius:16,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.10)"}}>
                  <div style={{fontSize:11,letterSpacing:"1.4px",fontWeight:800,color:"#64748B",fontFamily:F,marginBottom:5}}>{label.toUpperCase()}</div>
                  <div style={{fontSize:14,color:"#17376A",lineHeight:1.65,fontFamily:F,fontWeight:600}}>{text}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="cert-hero-side" style={{padding:"24px 22px",borderRadius:28,background:"linear-gradient(160deg,#0B1D3A,#14345B)",color:"#fff",border:"1px solid rgba(125,211,252,.14)",boxShadow:"0 22px 50px rgba(15,23,42,.12)",display:"grid",gap:14,alignContent:"start"}}>
            <div style={{padding:"16px 16px 14px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{fontSize:11,letterSpacing:"1.7px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:12}}>IDEAL PARA</div>
              <div className="cert-recipient-grid" style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:10}}>
                {config.audiences.map((item,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"11px 12px",borderRadius:16,background:"rgba(255,255,255,.05)",border:"1px solid rgba(125,211,252,.08)"}}>
                    <div style={{width:32,height:32,borderRadius:11,display:"flex",alignItems:"center",justifyContent:"center",background:"rgba(147,197,253,.12)",color:"#BBDDFF",fontSize:12,fontWeight:800}}>{i+1}</div>
                    <div style={{fontSize:13,fontWeight:700,color:"#E8F2FF",fontFamily:F,lineHeight:1.35}}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"16px 16px",borderRadius:20,background:"rgba(255,255,255,.06)",border:"1px solid rgba(125,211,252,.12)"}}>
              <div style={{fontSize:11,letterSpacing:"1.5px",fontWeight:800,color:"#93C5FD",fontFamily:F,marginBottom:10}}>PROCESO CLARO</div>
              <div style={{display:"grid",gap:10}}>
                {config.steps.map((item,i)=>(
                  <div key={i} style={{display:"grid",gridTemplateColumns:"28px minmax(0,1fr)",gap:10,alignItems:"start"}}>
                    <div style={{width:28,height:28,borderRadius:"50%",background:"rgba(96,165,250,.18)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff",fontFamily:F}}>{i+1}</div>
                    <div style={{fontSize:14,color:"rgba(226,232,240,.86)",lineHeight:1.65,fontFamily:F,fontWeight:600}}>{item}</div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{padding:"16px 16px",borderRadius:20,background:"rgba(255,255,255,.05)",border:"1px solid rgba(125,211,252,.12)",fontSize:14,color:"rgba(226,232,240,.84)",lineHeight:1.75,fontFamily:F}}>
              {config.supportText}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ToolRouteInfo({config}){
  return(
    <Sec id={`${config.sectionId}-info`} title={config.infoTitle} sub={config.infoSub} bg={B[1]} narrow>
      <div style={{display:"grid",gap:14}}>
        {config.infoCards.map(([title,desc],i)=>(
          <div key={i} style={{padding:"24px 24px",borderRadius:20,background:"rgba(255,255,255,.92)",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 18px 36px rgba(15,23,42,.06)"}}>
            <h3 style={{margin:"0 0 8px",fontSize:22,lineHeight:1.3,color:"#15366b"}}>{title}</h3>
            <p style={{margin:0,fontSize:17,lineHeight:1.7,color:"#4b617c"}}>{desc}</p>
          </div>
        ))}
      </div>
    </Sec>
  );
}

function ToolRouteShell({config}){
  return(
    <>
      <ToolRouteHero config={config}/>
      <ToolRouteInfo config={config}/>
      <section style={{padding:"0 24px 48px",background:B[6]}}>
        <div style={{maxWidth:1140,margin:"0 auto"}}>
          <ToolStage id={config.sectionId} kicker={config.stageKicker} title={config.stageTitle} desc={config.stageDesc} tone={1}>
            <ToolRouteWidget toolId={config.toolId}/>
          </ToolStage>
        </div>
      </section>
    </>
  );
}

function ServicePaymentPage(){
  const getReference=()=>new URLSearchParams(window.location.search).get("ref")||new URLSearchParams(window.location.search).get("reference")||"";
  const[paymentRef]=useState(getReference());
  const[data,setData]=useState(null);
  const[loading,setLoading]=useState(true);
  const[error,setError]=useState("");
  const[phase,setPhase]=useState("idle");
  const pollRef=useRef(null);
  const startedAtRef=useRef(0);

  const loadPayment=async()=>{
    if(!paymentRef){setError("Falta la referencia del pago.");setLoading(false);return null;}
    try{
      const response=await fetch(`/api/get-service-payment?reference=${encodeURIComponent(paymentRef)}`);
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.detail||payload.error||"No fue posible consultar el pago.");
      setData(payload);
      setError("");
      return payload;
    }catch(err){
      setError(err.message);
      return null;
    }finally{
      setLoading(false);
    }
  };

  const pollPayment=()=>{
    window.clearTimeout(pollRef.current);
    startedAtRef.current=Date.now();
    setPhase("awaiting");
    const tick=async()=>{
      const payload=await loadPayment();
      const status=String(payload?.payment?.status||"").toLowerCase();
      if(status==="approved"){setPhase("approved");return;}
      if(status==="failed"){setPhase("failed");return;}
      if(Date.now()-startedAtRef.current>120000){setPhase("timeout");return;}
      pollRef.current=window.setTimeout(tick,2500);
    };
    tick();
  };

  useEffect(()=>{loadPayment();return()=>window.clearTimeout(pollRef.current);},[]);

  const payment=data?.payment||{};
  const request=data?.request||{};
  const client=request.client||{};
  const canPay=payment.status==="pending"&&Number(payment.amountInCents||0)>0;
  const paymentStatusText=payment.status==="approved"?"Pago aprobado":payment.status==="failed"?"Pago no confirmado":payment.status==="superseded"?"Link reemplazado":"Pendiente de pago";
  const phoneDigits=normalizeColombianMobileNumber(client.phone);
  const legalIdType=client.documentType==="PAS"?"PP":client.documentType;

  const openWompi=()=>{
    if(typeof window==="undefined"||!window.WidgetCheckout){alert("La pasarela de pago aún se está cargando. Intenta nuevamente en unos segundos.");return;}
    const checkout=new window.WidgetCheckout({
      currency:payment.currency||"COP",
      amountInCents:payment.amountInCents,
      reference:payment.reference,
      publicKey:payment.publicKey||WK,
      signature:{integrity:payment.signature},
      redirectUrl:window.location.href,
      customerData:{
        email:client.email||undefined,
        fullName:client.name||undefined,
        phoneNumber:phoneDigits||undefined,
        phoneNumberPrefix:phoneDigits?"+57":undefined,
        legalId:client.documentNumber||undefined,
        legalIdType:legalIdType||undefined
      }
    });
    setPhase("opening");
    checkout.open(result=>{
      const status=String(result?.transaction?.status||"").toUpperCase();
      if(status==="APPROVED"){pollPayment();return;}
      if(["DECLINED","ERROR","VOIDED","FAILED","REJECTED","CANCELED","CANCELLED"].includes(status)){setPhase("failed");loadPayment();return;}
      setPhase("idle");
    });
  };

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#eef4ff,#f8fbff 45%,#f5f8fd)",padding:"36px 18px",display:"flex",alignItems:"center",justifyContent:"center"}}>
      <div style={{width:"min(720px,100%)",background:"#fff",border:"1px solid rgba(37,99,235,.12)",borderRadius:24,boxShadow:"0 24px 64px rgba(15,23,42,.10)",padding:28}}>
        <div style={{fontSize:12,letterSpacing:"1.8px",color:"#2563EB",fontWeight:800,fontFamily:F,marginBottom:10}}>PAGO SEGURO CONTARAE</div>
        <h1 style={{fontFamily:FH,fontSize:"clamp(30px,5vw,44px)",lineHeight:1.08,color:"#0B1D3A",margin:"0 0 10px"}}>Pago de solicitud</h1>
        <p style={{fontFamily:F,fontSize:15,color:"#52647F",lineHeight:1.8,margin:"0 0 22px"}}>Revisa el resumen antes de continuar a la pasarela segura de Wompi.</p>

        {loading?<div style={{fontFamily:F,color:"#64748B"}}>Cargando link de pago...</div>:null}
        {error?<div style={{padding:14,borderRadius:16,background:"rgba(220,38,38,.08)",color:"#991B1B",fontFamily:F,fontWeight:700,marginBottom:16}}>{error}</div>:null}

        {data&&!error?<>
          <div style={{display:"grid",gap:10,marginBottom:18}}>
            {[["Cliente",client.name||"Sin nombre"],["Referencia de pago",payment.reference],["Referencia de solicitud",request.reference],["Servicio",request.title||"Servicio CONTARAE"],["Valor a pagar",payment.amountLabel||`$ ${fm(Math.round(Number(payment.amountInCents||0)/100))}`],["Estado",paymentStatusText]].map(([label,value])=>(
              <div key={label} style={{display:"grid",gridTemplateColumns:"170px minmax(0,1fr)",gap:12,padding:"12px 14px",borderRadius:14,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.10)"}}>
                <div style={{fontFamily:F,fontSize:12,letterSpacing:"1.1px",fontWeight:800,color:"#64748B"}}>{label}</div>
                <div style={{fontFamily:F,fontSize:14,fontWeight:800,color:"#0F172A",lineHeight:1.5,wordBreak:"break-word"}}>{value||"Sin dato"}</div>
              </div>
            ))}
          </div>

          {payment.status==="approved"||phase==="approved"?<div style={{padding:16,borderRadius:18,background:"rgba(34,197,94,.10)",color:"#15803D",fontFamily:F,fontWeight:800,lineHeight:1.7,marginBottom:16}}>Pago confirmado. CONTARAE continuará con la gestión de tu solicitud.</div>:null}
          {payment.status==="failed"||phase==="failed"?<div style={{padding:16,borderRadius:18,background:"rgba(220,38,38,.08)",color:"#991B1B",fontFamily:F,fontWeight:800,lineHeight:1.7,marginBottom:16}}>El pago no quedó confirmado. Puedes intentar nuevamente o escribirnos para soporte.</div>:null}
          {payment.status==="superseded"?<div style={{padding:16,borderRadius:18,background:"rgba(245,158,11,.10)",color:"#92400E",fontFamily:F,fontWeight:800,lineHeight:1.7,marginBottom:16}}>Este link fue reemplazado por un link más reciente. Ingresa al portal de pagos o escríbenos para recibir el enlace vigente.</div>:null}
          {phase==="awaiting"?<div style={{padding:16,borderRadius:18,background:"rgba(37,99,235,.08)",color:"#1D4ED8",fontFamily:F,fontWeight:800,lineHeight:1.7,marginBottom:16}}>Estamos confirmando el pago con Wompi. Esto puede tardar unos segundos.</div>:null}

          <div style={{display:"flex",gap:10,flexWrap:"wrap",justifyContent:"center"}}>
            <button type="button" onClick={openWompi} disabled={!canPay||phase==="awaiting"} style={{padding:"14px 24px",borderRadius:14,border:"none",background:canPay&&phase!=="awaiting"?"linear-gradient(135deg,#0B1D3A,#2563EB)":"#CBD5E1",color:"#fff",fontFamily:F,fontWeight:800,cursor:canPay&&phase!=="awaiting"?"pointer":"not-allowed"}}>
              {phase==="awaiting"?"Confirmando pago...":"Pagar con Wompi"}
            </button>
            <a href={wm(`Hola CONTARAE, necesito ayuda con el pago ${payment.reference||paymentRef}.`)} target="_blank" rel="noopener noreferrer" style={{padding:"14px 24px",borderRadius:14,background:"#25D366",color:"#fff",fontFamily:F,fontWeight:800,textDecoration:"none"}}>
              Ayuda por WhatsApp
            </a>
          </div>
        </>:null}
      </div>
    </div>
  );
}

function PaymentsPortalPage(){
  const[form,setForm]=useState({documentType:"CC",documentNumber:""});
  const[result,setResult]=useState(null);
  const[loading,setLoading]=useState(false);
  const[error,setError]=useState("");
  const[searched,setSearched]=useState(false);
  const cleanDocument=value=>onlyDigits(value).slice(0,30);
  const update=(field,value)=>setForm(current=>({...current,[field]:field==="documentNumber"?cleanDocument(value):value}));
  const serviceLabel=value=>({
    renta:"Declaración de renta",
    contabilidad:"Contabilidad",
    impuestos:"Impuestos",
    nomina:"Nómina",
    rut:"RUT y trámites DIAN",
    camara_comercio:"Cámara de comercio",
    asesoria:"Asesoría",
    otros:"Servicio CONTARAE"
  }[value]||"Servicio CONTARAE");
  const statusLabel=value=>({
    nuevo:"Nuevo",
    cotizado:"Cotizado",
    pendiente_documentos:"Pendiente de documentos",
    en_proceso:"En proceso",
    pendiente_pago:"Pendiente de pago",
    finalizado:"Finalizado",
    cancelado:"Cancelado"
  }[value]||"En revisión");
  const paymentLabel=value=>({
    pendiente:"Pendiente",
    parcial:"Pago parcial",
    pagado:"Pagado",
    pagado_manual:"Pagado manual",
    no_requiere:"No requiere pago"
  }[value]||"Pendiente");

  const consult=async event=>{
    event.preventDefault();
    setSearched(true);
    setResult(null);
    setError("");
    if(cleanDocument(form.documentNumber).length<5){
      setError("Ingresa un número de documento válido.");
      return;
    }
    setLoading(true);
    try{
      const response=await fetch("/api/public-service-payments",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.detail||payload.error||"No fue posible consultar los pagos.");
      setResult(payload);
    }catch(err){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  };

  const requests=result?.requests||[];
  const pending=requests.filter(request=>Number(request.balanceAmount||0)>0);
  const paid=requests.filter(request=>Number(request.balanceAmount||0)<=0);
  const helpLink=wm(`Hola CONTARAE, necesito ayuda consultando mis pagos pendientes. Documento: ${form.documentType} ${form.documentNumber||""}.`);

  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#eef4ff,#f8fbff 45%,#f5f8fd)",padding:"34px 18px"}}>
      <div style={{width:"min(980px,100%)",margin:"0 auto",display:"grid",gap:18}}>
        <section style={{background:"#fff",border:"1px solid rgba(37,99,235,.12)",borderRadius:24,boxShadow:"0 24px 64px rgba(15,23,42,.10)",padding:"clamp(22px,4vw,34px)"}}>
          <div style={{display:"flex",justifyContent:"space-between",gap:18,alignItems:"flex-start",flexWrap:"wrap",marginBottom:22}}>
            <div style={{maxWidth:620}}>
              <div style={{fontSize:12,letterSpacing:"1.8px",color:"#2563EB",fontWeight:800,fontFamily:F,marginBottom:10}}>PORTAL DE PAGOS CONTARAE</div>
              <h1 style={{fontFamily:FH,fontSize:"clamp(32px,5vw,50px)",lineHeight:1.05,color:"#0B1D3A",margin:"0 0 10px"}}>Consulta tus pagos pendientes</h1>
              <p style={{fontFamily:F,fontSize:15,color:"#52647F",lineHeight:1.8,margin:0}}>Ingresa el documento registrado en tu solicitud para ver saldos y links disponibles.</p>
            </div>
            <a href="/" style={{padding:"11px 15px",borderRadius:14,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.12)",color:"#1D4ED8",fontFamily:F,fontWeight:800,textDecoration:"none"}}>Volver a CONTARAE</a>
          </div>

          <form className="payments-portal-form" onSubmit={consult} style={{display:"grid",gridTemplateColumns:"160px minmax(220px,1fr) auto",gap:10,alignItems:"center"}}>
            <select value={form.documentType} onChange={event=>update("documentType",event.target.value)} style={{...IS,borderRadius:14,padding:"14px 15px"}}>
              <option value="CC">Cédula</option>
              <option value="CE">Cédula extranjería</option>
              <option value="NIT">NIT</option>
              <option value="PAS">Pasaporte</option>
            </select>
            <input {...numericInputProps} value={form.documentNumber} onChange={event=>update("documentNumber",event.target.value)} placeholder="Número de documento" style={{...IS,borderRadius:14,padding:"14px 15px"}}/>
            <button type="submit" disabled={loading} style={{padding:"14px 22px",borderRadius:14,border:"none",background:loading?"#CBD5E1":"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontFamily:F,fontWeight:900,cursor:loading?"not-allowed":"pointer",whiteSpace:"nowrap"}}>
              {loading?"Consultando...":"Consultar"}
            </button>
          </form>
          <style>{`@media(max-width:760px){.payments-portal-form,.payments-summary-grid,.payments-request-card{grid-template-columns:1fr!important;}.payments-request-actions{display:grid!important;grid-template-columns:1fr!important;justify-content:stretch!important;}.payments-request-actions a{display:block!important;width:100%!important;text-align:center!important;}.payments-summary-grid h2,.payments-summary-grid div{overflow-wrap:anywhere;}}`}</style>
          {error?<div style={{marginTop:14,padding:14,borderRadius:16,background:"rgba(220,38,38,.08)",color:"#991B1B",fontFamily:F,fontWeight:800,lineHeight:1.7}}>{error}</div>:null}
        </section>

        {result?(
          <section style={{display:"grid",gap:18}}>
            <div className="payments-summary-grid" style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:12}}>
              <div style={{padding:18,borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.10)"}}><div style={{fontFamily:F,fontSize:11,letterSpacing:"1.3px",fontWeight:900,color:"#64748B"}}>CLIENTE</div><div style={{fontFamily:FH,fontSize:24,color:"#0B1D3A",marginTop:6}}>{result.clientName||"Documento consultado"}</div></div>
              <div style={{padding:18,borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.10)"}}><div style={{fontFamily:F,fontSize:11,letterSpacing:"1.3px",fontWeight:900,color:"#64748B"}}>SALDO PENDIENTE</div><div style={{fontFamily:FH,fontSize:24,color:pending.length?"#C2410C":"#15803D",marginTop:6}}>{result.pendingAmountLabel||"$ 0"}</div></div>
              <div style={{padding:18,borderRadius:18,background:"#fff",border:"1px solid rgba(37,99,235,.10)"}}><div style={{fontFamily:F,fontSize:11,letterSpacing:"1.3px",fontWeight:900,color:"#64748B"}}>SOLICITUDES</div><div style={{fontFamily:FH,fontSize:24,color:"#0B1D3A",marginTop:6}}>{requests.length}</div></div>
            </div>

            {pending.length?(
              <div style={{display:"grid",gap:12}}>
                {pending.map(request=>(
                  <div className="payments-request-card" key={request.reference} style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto",gap:14,alignItems:"center",padding:18,borderRadius:20,background:"#fff",border:"1px solid rgba(37,99,235,.10)",boxShadow:"0 14px 36px rgba(15,23,42,.06)"}}>
                    <div>
                      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:8}}>
                        <span style={{fontFamily:F,fontSize:11,fontWeight:900,color:"#1D4ED8",background:"rgba(37,99,235,.08)",padding:"5px 9px",borderRadius:999}}>{paymentLabel(request.paymentStatus)}</span>
                        <span style={{fontFamily:F,fontSize:11,fontWeight:900,color:"#475569",background:"rgba(100,116,139,.10)",padding:"5px 9px",borderRadius:999}}>{statusLabel(request.status)}</span>
                      </div>
                      <div style={{fontFamily:F,fontSize:16,fontWeight:900,color:"#0F172A",lineHeight:1.35}}>{request.title||serviceLabel(request.serviceType)}</div>
                      <div style={{fontFamily:F,fontSize:13,color:"#64748B",lineHeight:1.8,marginTop:4}}>Referencia: {request.reference} · Saldo: <strong>{request.balance}</strong></div>
                    </div>
                    <div className="payments-request-actions" style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
                      {request.canPay&&request.paymentLink?.checkoutUrl?(
                        <a href={request.paymentLink.checkoutUrl} style={{padding:"12px 16px",borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontFamily:F,fontWeight:900,textDecoration:"none",whiteSpace:"nowrap"}}>Pagar ahora</a>
                      ):(
                        <a href={helpLink} target="_blank" rel="noopener noreferrer" style={{padding:"12px 16px",borderRadius:14,background:"#25D366",color:"#fff",fontFamily:F,fontWeight:900,textDecoration:"none",whiteSpace:"nowrap"}}>Solicitar link</a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ):searched?(
              <div style={{padding:20,borderRadius:20,background:"#fff",border:"1px dashed rgba(37,99,235,.18)",fontFamily:F,color:"#52647F",lineHeight:1.8}}>
                No encontramos pagos pendientes para este documento.
              </div>
            ):null}

            {paid.length?(
              <details style={{background:"#fff",border:"1px solid rgba(37,99,235,.10)",borderRadius:18,padding:18}}>
                <summary style={{fontFamily:F,fontWeight:900,color:"#0B1D3A",cursor:"pointer"}}>Ver solicitudes sin saldo pendiente ({paid.length})</summary>
                <div style={{display:"grid",gap:8,marginTop:14}}>
                  {paid.map(request=>(
                    <div key={request.reference} style={{display:"flex",justifyContent:"space-between",gap:12,flexWrap:"wrap",fontFamily:F,fontSize:13,color:"#52647F",padding:"10px 0",borderTop:"1px solid rgba(37,99,235,.08)"}}>
                      <span>{request.title||serviceLabel(request.serviceType)} · {request.reference}</span>
                      <strong style={{color:"#15803D"}}>{paymentLabel(request.paymentStatus)}</strong>
                    </div>
                  ))}
                </div>
              </details>
            ):null}
          </section>
        ):searched&&!loading&&!error?(
          <section style={{padding:20,borderRadius:20,background:"#fff",border:"1px dashed rgba(37,99,235,.18)",fontFamily:F,color:"#52647F",lineHeight:1.8}}>
            No encontramos solicitudes con pagos asociados a ese documento.
          </section>
        ):null}

        <div style={{textAlign:"center"}}>
          <a href={helpLink} target="_blank" rel="noopener noreferrer" style={{fontFamily:F,color:"#15803D",fontWeight:800,textDecoration:"none"}}>¿Necesitas ayuda? Escríbenos por WhatsApp</a>
        </div>
      </div>
    </div>
  );
}

/* ══════ CERTIFICATION ══════ */
function CrtS(){
  const CT=CERTIFICATION_PRICE_TIERS.map(item=>({r:item.formRange,v:item.value,before:certReferenceValue(item.value)}));
  const INITIAL_FORM={n:"",td:"CC",cc:"",le:"",tel:"",em:"",dir:"",ent:"",per:"",perMes:"",iL:"",iP:"",iD:"",iI:"",iA:"",iR:"",iInd:"",iO:"",oD:"",ev:[createEmptyEventualIncome()],cm:""};
  const PAYMENT_STORAGE_KEY="contarae-certification-reference";
  const PAYMENT_QUERY_PARAM="cert_ref";
  const FINAL_FAILED_STATUSES=new Set(["DECLINED","ERROR","VOIDED","FAILED","REJECTED","CANCELED","CANCELLED"]);
  const PAYMENT_PHASES={idle:"idle",preparing:"preparing",opening:"opening",awaiting:"awaiting",approved:"approved",failed:"failed"};
  const[step,sStep]=useState(0);
  const[f,sF]=useState(INITIAL_FORM);
  const[acc,sAcc]=useState(false);
  const[citySug,sCitySug]=useState([]);
  const[openForm,sOpenForm]=useState(false);
  const[formSession,sFormSession]=useState(0);
  const[supportFiles,sSupportFiles]=useState([]);
  const[lastRef,sLastRef]=useState("");
  const[paymentFlow,sPaymentFlow]=useState({phase:PAYMENT_PHASES.idle,reference:"",status:"",message:"",consecutive:""});
  const[promoCode,sPromoCode]=useState("");
  const[promoStatus,sPromoStatus]=useState({state:"idle",message:""});
  const[promoBusy,sPromoBusy]=useState(false);
  const pollTimeoutRef=useRef(null);
  const pollStartedAtRef=useRef(0);
  const trackedCertStepsRef=useRef(new Set());
  const approvedPaymentEventsRef=useRef(new Set());
  const u=(k,v)=>sF(p=>({...p,[k]:v}));
  const uF=(k,v)=>sF(p=>({...p,[k]:fmtI(v)}));
  const uE=(index,key,value)=>sF(p=>({...p,ev:(p.ev||[]).map((row,rowIndex)=>rowIndex===index?{...row,[key]:key==="amount"?fmtI(value):value}:row)}));
  const addEventualIncomeRow=()=>sF(p=>({...p,ev:[...(p.ev||[]),createEmptyEventualIncome()]}));
  const removeEventualIncomeRow=index=>sF(p=>({...p,ev:(p.ev||[]).filter((_,rowIndex)=>rowIndex!==index).length?(p.ev||[]).filter((_,rowIndex)=>rowIndex!==index):[createEmptyEventualIncome()]}));
  const handleCity=v=>{u("le",v);sCitySug(v.length>=2?CITIES.filter(c=>c.toLowerCase().includes(v.toLowerCase())).slice(0,8):[]);};
  const normalizePersonalData=()=>({
    n:formatProperName(f.n),
    cc:onlyDigits(f.cc),
    tel:normalizeColombianMobileNumber(f.tel).slice(0,10),
    em:normalizeEmail(f.em)
  });
  const continueFromPersonalStep=()=>{
    const normalized=normalizePersonalData();
    sF(current=>({...current,...normalized}));
    if(!normalized.n||!normalized.cc||!normalized.tel||!normalized.em){alert("Complete todos los campos");return;}
    if(!isValidColombianMobileNumber(normalized.tel)){alert("Ingrese un número de celular colombiano válido de 10 dígitos.");return;}
    if(!isValidEmail(normalized.em)){alert("Ingrese un correo electrónico válido.");return;}
    trackCertStepOnce("cert_step_personal_complete",{service_name:"certificacion_ingresos"});
    moveStep(1);
  };
  const ings=[["Ingresos laborales","iL","Salario y prestaciones de relación laboral."],["Pensiones","iP","Mesada pensional por vejez, invalidez o sobrevivencia."],["Dividendos","iD","Utilidades como socio o accionista."],["Inversiones","iI","Rendimientos de CDTs, fondos, acciones."],["Arriendos","iA","Cánones de arrendamiento de inmuebles propios."],["Remesas","iR","Dinero recibido del exterior."],["Ingresos por actividad independiente","iInd","Honorarios, prestación de servicios, comisiones habituales o actividad económica propia."]];
  const recurrentMonthlyTotal=ings.reduce((s,[,k])=>s+pN(f[k]),0)+pN(f.iO);
  const certifiedMonths=getCertifiedMonths(f.per,f.perMes);
  const filledEventuals=getFilledEventualIncomeRows(f.ev);
  const eventualTotal=filledEventuals.reduce((sum,row)=>sum+pN(row.amount),0);
  const recurrentPeriodTotal=certifiedMonths?recurrentMonthlyTotal*certifiedMonths:0;
  const globalPeriodTotal=recurrentPeriodTotal+eventualTotal;
  const totalIng=recurrentMonthlyTotal;
  const baseTarifa=gT(recurrentMonthlyTotal);
  const promoApplied=promoStatus.state==="valid"&&promoStatus.code===promoCodeValue(promoCode)&&promoStatus.monthlyIncome===recurrentMonthlyTotal;
  const promoDiscount=promoApplied?Number(promoStatus.discountAmount||0):0;
  const tarifa=promoApplied?Number(promoStatus.finalAmount||baseTarifa):baseTarifa;
  const createPaymentReference=()=>`CONTARAE-${Date.now()}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  const periodLabel=buildCertifiedPeriodLabel(f.per,certifiedMonths);
  const trackCertStepOnce=(event,params={})=>{
    if(trackedCertStepsRef.current.has(event))return;
    trackedCertStepsRef.current.add(event);
    trackMarketingEvent(event,params);
  };
  const continueFromIncomeStep=()=>{
    if(hasIncompleteEventualIncomeRows(f.ev)){alert("Complete concepto y valor en cada ingreso eventual diligenciado.");return;}
    if(recurrentMonthlyTotal<=0){alert("Ingrese al menos un ingreso mensual recurrente");return;}
    trackCertStepOnce("cert_step_income_complete",{
      service_name:"certificacion_ingresos",
      certified_months:certifiedMonths,
      recurring_monthly_income:recurrentMonthlyTotal,
      recurring_period_income:recurrentPeriodTotal,
      eventual_period_income:eventualTotal,
      total_period_income:globalPeriodTotal,
      has_eventual_income:eventualTotal>0,
      support_files_count:supportFiles.length
    });
    moveStep(3);
  };
  const updatePromoCode=value=>{sPromoCode(value);sPromoStatus({state:"idle",message:""});};
  const clearPromoCode=()=>{sPromoCode("");sPromoStatus({state:"idle",message:""});};
  const validatePromoCode=async()=>{
    const code=promoCodeValue(promoCode);
    if(!code){sPromoStatus({state:"invalid",message:"Ingresa un código promocional."});return;}
    if(!recurrentMonthlyTotal){sPromoStatus({state:"invalid",message:"Primero registra los ingresos recurrentes para calcular la tarifa."});return;}
    sPromoBusy(true);
    try{
      const response=await fetch("/api/validate-promo-code",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({code,monthlyIncome:recurrentMonthlyTotal})});
      const data=await response.json();
      if(!response.ok||!data.valid){sPromoStatus({state:"invalid",message:data.error||"Código no válido o inactivo.",code,monthlyIncome:recurrentMonthlyTotal});return;}
      sPromoStatus({...data,state:"valid",message:`Código aplicado: ${data.discountRateLabel} adicional.`,monthlyIncome:recurrentMonthlyTotal});
    }catch(error){
      sPromoStatus({state:"invalid",message:"No fue posible validar el código. Intente nuevamente.",code,monthlyIncome:recurrentMonthlyTotal});
    }finally{
      sPromoBusy(false);
    }
  };
  const buildPendingPayload=(paymentReference,uploadedSupportFiles=[])=>({
    nombre:formatProperName(f.n),
    tipo_documento:f.td,
    numero_documento:onlyDigits(f.cc),
    lugar_expedicion:f.le,
    telefono:normalizeColombianMobileNumber(f.tel).slice(0,10),
    correo:normalizeEmail(f.em),
    email:normalizeEmail(f.em),
    destino:f.dir,
    entidad:f.ent,
    periodo:periodLabel,
    periodo_meses:certifiedMonths?String(certifiedMonths):"",
    ingresos_laborales:f.iL,
    pensiones:f.iP,
    dividendos:f.iD,
    inversiones:f.iI,
    arriendos:f.iA,
    remesas:f.iR,
    ingresos_independiente:f.iInd,
    otros_ingresos:f.iO,
    otros_descripcion:f.oD,
    ingresos_eventuales_json:JSON.stringify(filledEventuals),
    total_ingresos:"$"+fm(recurrentMonthlyTotal),
    total_ingresos_num:String(recurrentMonthlyTotal),
    total_ingresos_periodo:"$"+fm(recurrentPeriodTotal),
    total_ingresos_eventuales:eventualTotal?`$${fm(eventualTotal)}`:"",
    total_ingresos_global_periodo:eventualTotal?`$${fm(globalPeriodTotal)}`:"",
    tarifa_base:"$"+fm(baseTarifa),
    codigo_promocional:promoApplied?promoStatus.code:"",
    aliado_estrategico:promoApplied?promoStatus.allyName:"",
    descuento_promocional:promoApplied?`$${fm(promoDiscount)}`:"",
    porcentaje_descuento_promocional:promoApplied?promoStatus.discountRateLabel:"",
    tarifa_pagada:"$"+fm(tarifa),
    soportes_adjuntos:uploadedSupportFiles.map(file=>file.originalName).join(", "),
    referencia_wompi:paymentReference,
    estado_pago:"PENDIENTE",
    comentarios:f.cm,
    declaracion_juramentada:"ACEPTADA",
    consecutivo:"",
    ...getMarketingFormFields()
  });
  const addSupportFiles=fileList=>{
    const incoming=Array.from(fileList||[]);
    if(!incoming.length)return;
    const next=[...supportFiles];
    const errors=[];
    incoming.forEach(file=>{
      const duplicate=next.some(item=>item.name===file.name&&item.size===file.size&&item.lastModified===file.lastModified);
      const contentType=String(file.type||"").toLowerCase();
      if(duplicate)return;
      if(next.length>=SUPPORT_MAX_FILES){errors.push(`Solo puedes adjuntar hasta ${SUPPORT_MAX_FILES} soportes por solicitud.`);return;}
      if(file.size>SUPPORT_MAX_BYTES){errors.push(`"${file.name}" supera el límite de ${fmtB(SUPPORT_MAX_BYTES)}.`);return;}
      if(contentType&&!SUPPORT_ALLOWED_TYPES.has(contentType)){errors.push(`"${file.name}" no tiene un formato permitido.`);return;}
      next.push(file);
    });
    sSupportFiles(next);
    if(errors.length)alert(errors.join("\n"));
  };
  const removeSupportFile=index=>sSupportFiles(current=>current.filter((_,fileIndex)=>fileIndex!==index));
  const uploadSupportFiles=async reference=>{
    if(!supportFiles.length)return[];
    const body=new FormData();
    body.append("reference",reference);
    supportFiles.forEach(file=>body.append("files",file));
    const response=await fetch("/api/upload-certification-supports",{method:"POST",body});
    const data=await response.json();
    if(!response.ok||!data.ok)throw new Error(data.error||"No fue posible cargar los soportes adjuntos.");
    return Array.isArray(data.supportFiles)?data.supportFiles:[];
  };
  const clearPollTimeout=()=>{if(pollTimeoutRef.current){window.clearTimeout(pollTimeoutRef.current);pollTimeoutRef.current=null;}};
  const clearTrackedReference=()=>{try{window.sessionStorage.removeItem(PAYMENT_STORAGE_KEY);}catch(e){} if(typeof window!=="undefined"){const url=new URL(window.location.href);url.searchParams.delete(PAYMENT_QUERY_PARAM);if(window.history?.replaceState)window.history.replaceState(null,"",`${url.pathname}${url.search}${url.hash}`);}};
  const persistTrackedReference=reference=>{try{window.sessionStorage.setItem(PAYMENT_STORAGE_KEY,reference);}catch(e){} if(typeof window!=="undefined"){const url=new URL(window.location.href);url.searchParams.set(PAYMENT_QUERY_PARAM,reference);if(window.history?.replaceState)window.history.replaceState(null,"",`${url.pathname}${url.search}${url.hash||"#certificacion"}`);}};
  const buildRedirectUrl=reference=>{const url=new URL(window.location.href);url.searchParams.set(PAYMENT_QUERY_PARAM,reference);url.hash="certificacion";return url.toString();};
  const resetForm=()=>{sStep(0);sAcc(false);sCitySug([]);sOpenForm(false);sF(INITIAL_FORM);sSupportFiles([]);trackedCertStepsRef.current.clear();approvedPaymentEventsRef.current.clear();clearPromoCode();};
  const closePaymentFeedback=()=>{clearPollTimeout();sPaymentFlow({phase:PAYMENT_PHASES.idle,reference:"",status:"",message:"",consecutive:""});};
  const releaseCheckoutOverlay=reference=>{sPaymentFlow({phase:PAYMENT_PHASES.idle,reference:reference||"",status:"",message:"",consecutive:""});};
  const cleanupWompiArtifacts=()=>{if(typeof document==="undefined")return;Array.from(document.querySelectorAll('iframe[src*="checkout.wompi.co"]')).forEach(frame=>{const container=frame.parentElement;if(container&&container!==document.body&&container.childElementCount===1){container.remove();return;}frame.remove();});};
  const reopenFormForPaymentRetry=()=>{clearTrackedReference();clearPollTimeout();cleanupWompiArtifacts();closePaymentFeedback();sOpenForm(false);sFormSession(session=>session+1);window.setTimeout(()=>{sStep(3);sOpenForm(true);},80);};
  const getPaymentFailureMessage=status=>{if(status==="DECLINED")return"El pago fue rechazado o declinado por la entidad financiera. Puede intentarlo con otro medio de pago o escribirnos para revisarlo.";if(status==="ERROR")return"No se confirmó el pago por un error en la transacción. Si ve un cobro reflejado, contáctenos y validamos el caso.";if(status==="VOIDED")return"La transacción fue anulada antes de completarse. Puede volver al formulario para intentarlo de nuevo.";return"No se confirmó el pago. Si necesita ayuda, nuestro equipo puede acompañarle por WhatsApp o correo electrónico.";};
  const getPaymentSupportLink=reference=>wm(`Hola CONTARAE, necesito ayuda con mi pago de certificación de ingresos. Referencia: ${reference||lastRef||"SIN_REFERENCIA"}.`);
  const markPaymentApproved=(reference,record={})=>{clearPollTimeout();clearTrackedReference();if(reference&&!record.ga4PaymentApprovedSentAt&&!approvedPaymentEventsRef.current.has(reference)){approvedPaymentEventsRef.current.add(reference);trackMarketingEvent("cert_payment_approved",{currency:"COP",value:Number(record.pricing?.finalAmount||tarifa||0),service_name:"certificacion_ingresos",certification_reference:reference,transaction_id:record.wompiTransaction?.id||reference,event_source:"browser"});}else if(reference&&record.ga4PaymentApprovedSentAt&&!approvedPaymentEventsRef.current.has(`${reference}:view`)){approvedPaymentEventsRef.current.add(`${reference}:view`);trackMarketingEvent("cert_payment_success_view",{currency:"COP",value:Number(record.pricing?.finalAmount||tarifa||0),service_name:"certificacion_ingresos",certification_reference:reference,transaction_id:record.wompiTransaction?.id||reference,event_source:"browser"});}sPaymentFlow({phase:PAYMENT_PHASES.approved,reference,status:"APPROVED",message:"Pago confirmado y solicitud enviada correctamente para revisión profesional.",consecutive:String(record.consecutive||"")});};
  const markPaymentFailed=(reference,status,message)=>{clearPollTimeout();sPaymentFlow({phase:PAYMENT_PHASES.failed,reference,status:status||"UNCONFIRMED",message:message||getPaymentFailureMessage(status)});};
  const pollPaymentStatus=reference=>{
    if(!reference)return;
    clearPollTimeout();
    pollStartedAtRef.current=Date.now();
    sPaymentFlow({phase:PAYMENT_PHASES.awaiting,reference,status:"PENDING",message:"Estamos confirmando el pago con Wompi y finalizando el envío de su solicitud. Esto puede tardar unos segundos.",consecutive:""});
    const checkStatus=async()=>{
      try{
        const paidResponse=await fetch(`/api/get-paid-form?reference=${encodeURIComponent(reference)}`);
        if(paidResponse.ok){
          const paidData=await paidResponse.json();
          const paidRecord=paidData.record||{};
          if(paidRecord.netlifySubmittedAt){markPaymentApproved(reference,paidRecord);return;}
          sPaymentFlow(prev=>({...prev,phase:PAYMENT_PHASES.awaiting,reference,status:"APPROVED",message:"Pago confirmado en Wompi. Estamos terminando el registro y el envío de la solicitud.",consecutive:String(paidRecord.consecutive||prev.consecutive||"")}));
        }else{
          const pendingResponse=await fetch(`/api/get-pending-form?reference=${encodeURIComponent(reference)}`);
          if(pendingResponse.ok){
            const pendingData=await pendingResponse.json();
            const pendingRecord=pendingData.record||{};
            const backendStatus=String(pendingRecord.status||pendingRecord.lastEventStatus||"").toUpperCase();
            if(FINAL_FAILED_STATUSES.has(backendStatus)){markPaymentFailed(reference,backendStatus,getPaymentFailureMessage(backendStatus));return;}
          }
        }
      }catch(error){}
      if(Date.now()-pollStartedAtRef.current>120000){markPaymentFailed(reference,"UNCONFIRMED","Aún no logramos confirmar el pago automáticamente. Si ya realizó el pago o necesita ayuda, escríbanos y validamos el caso de inmediato.");return;}
      pollTimeoutRef.current=window.setTimeout(checkStatus,2500);
    };
    checkStatus();
  };
  const handleWidgetResult=(reference,result)=>{
    const tx=result&&result.transaction?result.transaction:null;
    const status=String(tx?.status||"").toUpperCase();
    if(status==="APPROVED"){pollPaymentStatus(reference);return;}
    if(FINAL_FAILED_STATUSES.has(status)){markPaymentFailed(reference,status,getPaymentFailureMessage(status));return;}
    if(tx){markPaymentFailed(reference,status,"La transacción no quedó confirmada. Puede intentarlo de nuevo o escribirnos para recibir soporte.");return;}
    markPaymentFailed(reference,"CLOSED","El proceso de pago se cerró antes de confirmarse. Si necesita ayuda, nuestro equipo puede acompañarle por WhatsApp o correo electrónico.");
  };
  const openWompi=async()=>{let paymentReference="";try{
    trackMarketingEvent("cert_payment_click",{currency:"COP",value:tarifa,service_name:"certificacion_ingresos"});
    if(typeof window==="undefined"||!window.WidgetCheckout){alert("La pasarela de pago aún se está cargando. Intente nuevamente en unos segundos.");return;}
    if(promoCodeValue(promoCode)&&!promoApplied){alert("Valide el código promocional o borre el campo antes de pagar.");return;}
    const normalizedPersonal=normalizePersonalData();
    sF(current=>({...current,...normalizedPersonal}));
    if(!normalizedPersonal.n||!normalizedPersonal.cc||!isValidColombianMobileNumber(normalizedPersonal.tel)||!isValidEmail(normalizedPersonal.em)){alert("Revise los datos personales: nombre, documento, celular y correo deben estar completos y válidos.");sStep(0);sOpenForm(true);return;}
    paymentReference=createPaymentReference();
    const phoneDigits=normalizeColombianMobileNumber(normalizedPersonal.tel);
    const legalIdType=f.td==="Pasaporte"?"PP":f.td;
    let uploadedSupportFiles=[];
    sLastRef(paymentReference);
    sPaymentFlow({phase:PAYMENT_PHASES.preparing,reference:paymentReference,status:"PREPARING",message:supportFiles.length?"Estamos cargando sus soportes y guardando la solicitud antes de abrir el pago.":"Estamos guardando su solicitud en estado pendiente antes de abrir el pago.",consecutive:""});
    if(supportFiles.length){uploadedSupportFiles=await uploadSupportFiles(paymentReference);}
    const pendingPayload=buildPendingPayload(paymentReference,uploadedSupportFiles);
    const sp=await fetch("/api/save-pending-form",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:paymentReference,supportFiles:uploadedSupportFiles,...pendingPayload})});
    const spd=await sp.json();
    if(!sp.ok||!spd.ok){closePaymentFeedback();alert("No fue posible preparar la solicitud. Intente nuevamente.");return;}
    trackMarketingEvent("cert_pending_saved",{currency:"COP",value:tarifa,service_name:"certificacion_ingresos",certification_reference:paymentReference,has_support_files:supportFiles.length>0});
    persistTrackedReference(paymentReference);
    const sg=await fetch("/.netlify/functions/wompi-signature",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({reference:paymentReference,amountInCents:tarifa*100,currency:"COP",monthlyIncome:recurrentMonthlyTotal,promoCode:promoApplied?promoStatus.code:""})});
    const sd=await sg.json();
    if(!sg.ok||!sd.signature){clearTrackedReference();closePaymentFeedback();alert(sd.error||"Error generando la firma de seguridad. Intente nuevamente.");return;}
    sOpenForm(false);
    if(document.activeElement instanceof HTMLElement)document.activeElement.blur();
    sPaymentFlow({phase:PAYMENT_PHASES.opening,reference:paymentReference,status:"OPENING",message:"Estamos abriendo la ventana segura de Wompi. Si está en celular, al volver seguiremos confirmando el pago automáticamente.",consecutive:""});
    await new Promise(resolve=>window.setTimeout(resolve,160));
    const ck=new window.WidgetCheckout({
      currency:"COP",
      amountInCents:tarifa*100,
      reference:paymentReference,
      publicKey:WK,
      signature:{integrity:sd.signature},
      redirectUrl:buildRedirectUrl(paymentReference),
      customerData:{
        email:normalizedPersonal.em||undefined,
        fullName:normalizedPersonal.n||undefined,
        phoneNumber:phoneDigits||undefined,
        phoneNumberPrefix:phoneDigits?"+57":undefined,
        legalId:normalizedPersonal.cc||undefined,
        legalIdType:legalIdType||undefined
      }
    });
    ck.open(result=>handleWidgetResult(paymentReference,result));
    window.setTimeout(()=>releaseCheckoutOverlay(paymentReference),120);
  }catch(e){clearTrackedReference();markPaymentFailed(paymentReference||lastRef,"CONNECTION_ERROR","Ocurrió un problema al conectar con la pasarela de pago. Intente nuevamente o contáctenos para ayudarle.");}};
  const supportRef=paymentFlow.reference||lastRef||"PENDIENTE";
  const supportCode=paymentFlow.consecutive?`Solicitud N° ${paymentFlow.consecutive}`:supportRef;
  const waMsg=`Hola CONTARAE, confirmo mi solicitud:%0ACódigo: ${supportCode}%0AReferencia: ${supportRef}%0ANombre: ${f.n}%0ADocumento: ${f.td} ${f.cc}%0AIngreso mensual recurrente: $${fm(recurrentMonthlyTotal)}%0ATotal recurrente del período: $${fm(recurrentPeriodTotal)}${eventualTotal?`%0ATotal ingresos eventuales: $${fm(eventualTotal)}%0ATotal global del período: $${fm(globalPeriodTotal)}`:""}${promoApplied?`%0ACódigo promocional: ${promoStatus.code}%0ADescuento promocional: $${fm(promoDiscount)}`:""}%0AValor pagado: $${fm(tarifa)}%0ADestino: ${f.ent||f.dir}%0AEnviaré los soportes documentales por este medio o por correo electrónico.`;
  const pasos=["Datos personales","Destino","Ingresos y soportes","Confirmación y pago","Entrega en PDF"];
  const moveStep=n=>{sStep(n);};
  useEffect(()=>{
    const prev=document.body.style.overflow;
    const shouldLockBody=openForm||[PAYMENT_PHASES.preparing,PAYMENT_PHASES.awaiting,PAYMENT_PHASES.approved,PAYMENT_PHASES.failed].includes(paymentFlow.phase);
    if(shouldLockBody){document.body.style.overflow="hidden";}
    return()=>{document.body.style.overflow=prev;clearPollTimeout();};
  },[openForm,paymentFlow.phase]);
  useEffect(()=>{
    const url=new URL(window.location.href);
    const referenceFromUrl=url.searchParams.get(PAYMENT_QUERY_PARAM);
    let storedReference=referenceFromUrl||"";
    if(!storedReference){try{storedReference=window.sessionStorage.getItem(PAYMENT_STORAGE_KEY)||"";}catch(e){}}
    if(storedReference){sLastRef(storedReference);pollPaymentStatus(storedReference);}
    return()=>clearPollTimeout();
  },[]);
  useEffect(()=>{
    const handleOpenRequested=()=>{sStep(0);sOpenForm(true);};
    window.addEventListener(OPEN_CERT_FORM_EVENT,handleOpenRequested);
    return()=>window.removeEventListener(OPEN_CERT_FORM_EVENT,handleOpenRequested);
  },[]);
  useEffect(()=>{if(openForm)trackMarketingEvent("cert_form_open",{service_name:"certificacion_ingresos"});},[openForm]);

  return(<Sec id="certificacion" title="Certificación de ingresos por Contador Público" sub="CERTIFICADO DE INGRESOS ONLINE COLOMBIA" bg={B[5]} narrow>
    <p style={{textAlign:"center",fontSize:15,color:"#5A6F8A",marginTop:-34,marginBottom:10,fontFamily:F}}>Solicítela 100% online y recíbala firmada por Contador Público con tarjeta profesional vigente.</p>
    <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginBottom:36,fontFamily:F}}>Para arriendo, crédito bancario, visa, licitaciones y más. Si sus soportes están claros, en muchos casos puede quedar lista el mismo día o en menos de 1 día hábil.</p>

    <div id="certificacion-info" style={{display:"grid",gap:14,marginBottom:28,scrollMarginTop:"150px"}}>{[["¿Qué es un certificado de ingresos?","Documento suscrito por Contador Público con tarjeta profesional vigente que certifica sus ingresos con base en soportes verificables como extractos bancarios, contratos, facturas y comprobantes de pago."],["¿Por qué firma de Contador Público?","Según la Ley 43 de 1990 (art. 10), la firma otorga fe pública. El CTCP (Concepto 1106/2019) ratifica que deben soportarse en documentación verificable."],["¿Para qué se necesita?","Créditos bancarios, arrendamientos, compra de vehículo, trámites de visa, licitaciones, libreta militar y trámites académicos."],["¿Cuánto cuesta?","Desde $80.000 COP según el rango de ingresos mensuales recurrentes. Si cuenta con código de aliado estratégico, se aplica 15% de descuento adicional antes del pago."]].map(([t,d],i)=><div key={i} style={{padding:22,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.12)"}}><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{t}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>{d}</p></div>)}</div>

    <div style={{padding:24,borderRadius:18,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",marginBottom:28,color:"#fff",boxShadow:"0 18px 44px rgba(15,23,42,.12)"}}><div style={{display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap",marginBottom:10}}><div><div style={{fontSize:11,letterSpacing:"1.4px",fontWeight:900,color:"#93C5FD",fontFamily:F,marginBottom:6}}>PRECIOS CLAROS ANTES DE PAGAR</div><h3 style={{fontSize:20,fontWeight:800,margin:0,fontFamily:F}}>Tarifas certificado de ingresos</h3></div><span style={{display:"inline-flex",padding:"8px 12px",borderRadius:999,background:"rgba(239,68,68,.14)",border:"1px solid rgba(239,68,68,.22)",fontSize:11,fontWeight:900,color:"#FECACA",fontFamily:F}}>15% OFF vigente</span></div><p style={{fontSize:13,color:"rgba(226,232,240,.78)",lineHeight:1.7,fontFamily:F,margin:"0 0 14px"}}>¿Tiene código promocional? Podrá ingresarlo antes del pago y obtener 15% de descuento adicional.</p><div className="cert-price-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(235px,1fr))",gap:10}}>{CT.map((t,i)=><div key={i} style={{display:"grid",gap:8,padding:"14px 16px",borderRadius:12,background:"rgba(255,255,255,.075)",border:"1px solid rgba(191,219,254,.08)",fontFamily:F}}><span style={{fontSize:14,color:"rgba(226,232,240,.88)",lineHeight:1.45}}>{t.r}</span><div style={{display:"flex",alignItems:"flex-end",justifyContent:"space-between",gap:10}}><span style={{display:"inline-flex",padding:"4px 8px",borderRadius:999,background:"rgba(239,68,68,.14)",color:"#FECACA",fontSize:10,fontWeight:900}}>15% OFF</span><div style={{textAlign:"right"}}><div style={{fontSize:13,fontWeight:800,color:"rgba(226,232,240,.45)",textDecoration:"line-through"}}>${fm(t.before)}</div><div style={{fontSize:22,fontWeight:900,color:"#60A5FA",lineHeight:1.05}}>${fm(t.v)}</div></div></div></div>)}</div><div style={{marginTop:14,padding:12,borderRadius:10,background:"rgba(96,165,250,.13)",fontSize:13,fontFamily:F}}>🔒 Pago seguro procesado por <strong>Wompi</strong>. Tarjeta, PSE, Nequi o Daviplata.</div></div>

    <div style={{padding:24,borderRadius:16,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 5px 24px rgba(37,99,235,.05)",marginBottom:10}}><h3 style={{fontSize:18,fontWeight:700,color:"#0B1D3A",marginBottom:14,fontFamily:F,textAlign:"center"}}>Así funciona su solicitud</h3><div className="cert-process-grid" style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"}}>{["Completa el formulario en minutos","Relaciona solo los ingresos que aplican","Paga seguro con Wompi","Revisión profesional y validación","En muchos casos, la recibes el mismo día"].map((txt,i)=><div key={i} style={{padding:14,borderRadius:12,background:"rgba(37,99,235,.05)",border:"1px solid rgba(37,99,235,.10)"}}><div style={{width:26,height:26,borderRadius:"50%",background:"#2563EB",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,fontFamily:F,marginBottom:8}}>{i+1}</div><div style={{fontSize:14,fontWeight:600,color:"#0B1D3A",lineHeight:1.55,fontFamily:F}}>{txt}</div></div>)}</div><div style={{textAlign:"center",marginTop:18}}><button type="button" onClick={()=>sOpenForm(true)} style={{padding:"14px 28px",borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontSize:16,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F,boxShadow:"0 14px 30px rgba(37,99,235,.18)"}}>Iniciar formulario de solicitud</button></div></div>

    {openForm&&createPortal(
      <div className="cert-form-overlay" style={{position:"fixed",inset:0,background:"rgba(8,15,29,.62)",zIndex:12000,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 18px"}} onClick={()=>sOpenForm(false)}><div key={formSession} className="cert-form-dialog" style={{background:"#fff",borderRadius:22,width:"min(980px, 100%)",maxHeight:"min(92vh, 920px)",overflowY:"auto",padding:24,position:"relative",boxShadow:"0 30px 80px rgba(15,23,42,.28)",border:"1px solid rgba(37,99,235,.10)"}} onClick={e=>e.stopPropagation()}><button type="button" onClick={()=>sOpenForm(false)} style={{position:"absolute",top:16,right:16,width:38,height:38,borderRadius:"50%",border:"1px solid rgba(37,99,235,.12)",background:"#fff",cursor:"pointer",fontSize:18,color:"#1B3A5C",zIndex:2}}>×</button><div className="cert-form-steps" style={{display:"flex",gap:4,marginBottom:22,flexWrap:"wrap",justifyContent:"center",paddingRight:40}}>{pasos.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:28,height:28,borderRadius:"50%",background:i<=step?"#2563EB":"#d0d9e8",color:i<=step?"#fff":"#5A6F8A",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,fontFamily:F}}>{i+1}</div><span style={{fontSize:12,color:i<=step?"#0B1D3A":"#7A8FA8",fontWeight:i<=step?600:400,fontFamily:F}}>{p}</span>{i<4&&<span style={{color:"#d0d9e8",fontSize:14}}>→</span>}</div>)}</div>

    <div style={{padding:28,borderRadius:16,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 5px 24px rgba(37,99,235,.05)"}}>

    {step===0&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:14,fontFamily:F}}>📋 Paso 1: Datos Personales</h4><div style={{display:"grid",gap:14}}>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nombre completo</label><input style={IS} value={f.n} onChange={e=>u("n",e.target.value)} onBlur={e=>u("n",formatProperName(e.target.value))} autoComplete="name"/></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tipo de documento</label><select style={{...IS,cursor:"pointer"}} value={f.td} onChange={e=>u("td",e.target.value)}><option>CC</option><option>TI</option><option>CE</option><option>Pasaporte</option><option>NIT</option></select></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Número de documento</label><input {...numericInputProps} style={IS} value={f.cc} onChange={e=>u("cc",onlyDigits(e.target.value))} autoComplete="off"/></div>
      <div style={{position:"relative"}}><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Lugar de expedición</label><input style={IS} value={f.le} onChange={e=>handleCity(e.target.value)} placeholder="Escriba su ciudad..."/>{citySug.length>0&&<div style={{position:"absolute",top:"100%",left:0,width:"100%",background:"#fff",border:"1px solid #d0d9e8",borderRadius:8,boxShadow:"0 4px 16px rgba(0,0,0,.1)",zIndex:10,maxHeight:200,overflowY:"auto"}}>{citySug.map((c,i)=><div key={i} onClick={()=>{u("le",c);sCitySug([]);}} style={{padding:"10px 14px",cursor:"pointer",fontSize:14,fontFamily:F,borderBottom:"1px solid #f0f0f0"}} onMouseEnter={e=>e.target.style.background="#f0f4fa"} onMouseLeave={e=>e.target.style.background="#fff"}>{c}</div>)}</div>}</div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Teléfono / WhatsApp</label><input {...numericInputProps} style={IS} value={f.tel} onChange={e=>u("tel",normalizeColombianMobileNumber(e.target.value).slice(0,10))} placeholder="Ej: 300 000 0000" autoComplete="tel"/><div style={{marginTop:6,fontSize:12,color:"#64748B",fontFamily:F}}>Ingrese un celular colombiano de 10 dígitos. Si va a pagar por Nequi, use preferiblemente el mismo número asociado a esa cuenta.</div></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Correo electrónico</label><input style={IS} type="email" inputMode="email" value={f.em} onChange={e=>u("em",e.target.value)} onBlur={e=>u("em",normalizeEmail(e.target.value))} autoComplete="email"/></div>
    </div><div style={{textAlign:"right",marginTop:16}}><button type="button" onClick={continueFromPersonalStep} style={{padding:"12px 30px",borderRadius:11,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div></div>}

    {step===1&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:14,fontFamily:F}}>🏢 Paso 2: Destino de la Certificación</h4><div style={{display:"grid",gap:14}}>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>¿A quién va dirigida?</label><select style={{...IS,cursor:"pointer"}} value={f.dir} onChange={e=>u("dir",e.target.value)}><option value="">Seleccione...</option>{["Banco o entidad financiera","Inmobiliaria o arrendador","Embajada o trámite migratorio","Concesionario de vehículos","Entidad pública","Contratación o licitación","Otro destino"].map(o=><option key={o}>{o}</option>)}</select></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nombre de la entidad</label><input style={IS} value={f.ent} onChange={e=>u("ent",e.target.value)} placeholder="Ej: Bancolombia, Century 21..."/></div>
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Período a certificar</label><select style={{...IS,cursor:"pointer"}} value={f.per} onChange={e=>u("per",e.target.value)}><option value="">Seleccione...</option>{CERT_PERIOD_OPTIONS.map(option=><option key={option.label}>{option.label}</option>)}</select></div>
      {f.per==="Otro período"&&<div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Número de meses a certificar</label><input style={IS} value={f.perMes} onChange={e=>u("perMes",normalizeMonthInput(e.target.value))} placeholder="Ej: 4"/><div style={{marginTop:6,fontSize:12,color:"#64748B",fontFamily:F}}>Usaremos este valor para calcular el total recurrente del período certificado.</div></div>}
    </div><div style={{display:"flex",justifyContent:"space-between",marginTop:16}}><button type="button" onClick={()=>moveStep(0)} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#2563EB",fontSize:15,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button><button type="button" onClick={()=>f.dir&&certifiedMonths>0?moveStep(2):alert("Seleccione el destino y un período válido")} style={{padding:"12px 30px",borderRadius:11,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div></div>}

    {step===2&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:4,fontFamily:F}}>💰 Paso 3: Ingresos y Soportes</h4><p style={{fontSize:13,color:"#7A8FA8",marginBottom:14,fontFamily:F}}>Primero relacione sus ingresos mensuales recurrentes. Luego, si aplica, agregue ingresos eventuales del período certificado.</p>
      <div style={{padding:18,borderRadius:14,background:"#F8FBFF",border:"1px solid rgba(37,99,235,.10)",marginBottom:14}}><div style={{fontSize:12,letterSpacing:"1.2px",fontWeight:800,color:"#1D4ED8",marginBottom:12,fontFamily:F}}>INGRESOS MENSUALES RECURRENTES</div><div style={{display:"grid",gap:14}}>{ings.map(([l,k,tip])=><div key={k}><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l}</label><span style={{fontSize:13,color:"#7A8FA8",fontFamily:F,display:"block",marginBottom:3}}>{tip}</span><input {...currencyInputProps} style={IS} value={f[k]} onChange={e=>uF(k,e.target.value)} placeholder="$ 0"/></div>)}
      <div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Otros ingresos mensuales recurrentes</label><span style={{fontSize:13,color:"#7A8FA8",fontFamily:F,display:"block",marginBottom:3}}>Honorarios, comisiones u otros ingresos que se repiten de manera habitual.</span><input {...currencyInputProps} style={IS} value={f.iO} onChange={e=>uF("iO",e.target.value)} placeholder="$ 0"/><input style={{...IS,marginTop:6}} value={f.oD} onChange={e=>u("oD",e.target.value)} placeholder="Concepto de estos ingresos mensuales recurrentes"/></div></div></div>

      <div style={{padding:18,borderRadius:14,background:"#fff",border:"1px solid rgba(37,99,235,.10)",marginBottom:14}}><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",marginBottom:12,flexWrap:"wrap"}}><div><div style={{fontSize:12,letterSpacing:"1.2px",fontWeight:800,color:"#1D4ED8",fontFamily:F}}>INGRESOS EVENTUALES DEL PERÍODO</div><div style={{fontSize:13,color:"#64748B",fontFamily:F,marginTop:4}}>Registre ingresos no ordinarios, no fijos y no periódicos que sí deban incluirse en la certificación del período.</div></div><button type="button" onClick={addEventualIncomeRow} style={{padding:"10px 14px",borderRadius:12,border:"1px solid rgba(37,99,235,.16)",background:"rgba(37,99,235,.05)",color:"#2563EB",fontFamily:F,fontWeight:700,cursor:"pointer"}}>+ Agregar ingreso eventual</button></div><div style={{display:"grid",gap:12}}>{(f.ev||[]).map((row,index)=><div key={index} style={{display:"grid",gap:10,padding:14,borderRadius:12,background:"rgba(37,99,235,.04)",border:"1px solid rgba(37,99,235,.10)"}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Valor eventual #{index+1}</label><input {...currencyInputProps} style={IS} value={row.amount} onChange={e=>uE(index,"amount",e.target.value)} placeholder="$ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Concepto del ingreso eventual</label><input style={IS} value={row.concept} onChange={e=>uE(index,"concept",e.target.value)} placeholder="Ej: premio por rifa, venta ocasional, bonificación extraordinaria"/></div><div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"center",flexWrap:"wrap"}}><div style={{fontSize:12,color:"#64748B",fontFamily:F}}>Este valor no se sumará al ingreso mensual recurrente, solo al total del período.</div><button type="button" onClick={()=>removeEventualIncomeRow(index)} disabled={(f.ev||[]).length===1} style={{padding:"9px 12px",borderRadius:10,border:"1px solid rgba(220,38,38,.14)",background:(f.ev||[]).length===1?"rgba(148,163,184,.10)":"rgba(220,38,38,.06)",color:(f.ev||[]).length===1?"#94A3B8":"#DC2626",fontSize:12,fontWeight:700,cursor:(f.ev||[]).length===1?"not-allowed":"pointer",fontFamily:F}}>Quitar</button></div></div>)}</div></div>

      <div style={{marginTop:18,padding:18,borderRadius:11,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{display:"grid",gap:12}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12}}><div><div style={{fontSize:13,opacity:.55,fontFamily:F}}>TOTAL INGRESOS MENSUALES RECURRENTES</div><div style={{fontSize:11,opacity:.4,fontFamily:F}}>Calculado automáticamente — no modificable</div></div><div style={{fontSize:24,fontWeight:700,fontFamily:F,color:"#60A5FA"}}>$ {fm(recurrentMonthlyTotal)}</div></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.1)"}}><div><div style={{fontSize:13,opacity:.55,fontFamily:F}}>TOTAL RECURRENTE DEL PERÍODO</div><div style={{fontSize:11,opacity:.4,fontFamily:F}}>{periodLabel||"Período no definido"}</div></div><div style={{fontSize:22,fontWeight:700,fontFamily:F}}>$ {fm(recurrentPeriodTotal)}</div></div>{eventualTotal?(<><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.1)"}}><div><div style={{fontSize:13,opacity:.55,fontFamily:F}}>TOTAL EVENTUAL DEL PERÍODO</div><div style={{fontSize:11,opacity:.4,fontFamily:F}}>Solo ingresos no fijos reportados arriba</div></div><div style={{fontSize:22,fontWeight:700,fontFamily:F}}>$ {fm(eventualTotal)}</div></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.1)"}}><div><div style={{fontSize:13,opacity:.55,fontFamily:F}}>TOTAL GLOBAL DEL PERÍODO</div><div style={{fontSize:11,opacity:.4,fontFamily:F}}>Recurrentes del período + eventuales</div></div><div style={{fontSize:22,fontWeight:700,fontFamily:F,color:"#BFDBFE"}}>$ {fm(globalPeriodTotal)}</div></div></>):null}<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,paddingTop:12,borderTop:"1px solid rgba(255,255,255,.1)"}}><div><div style={{fontSize:13,opacity:.55,fontFamily:F}}>VALOR A PAGAR</div><div style={{fontSize:11,opacity:.4,fontFamily:F}}>Según ingresos mensuales recurrentes</div></div><div style={{fontSize:22,fontWeight:700,fontFamily:F}}>$ {fm(tarifa)}</div></div></div></div>

      <div style={{marginTop:16,padding:20,borderRadius:16,background:"linear-gradient(135deg,rgba(37,99,235,.10),rgba(56,189,248,.10))",border:"1px solid rgba(37,99,235,.18)",boxShadow:"0 14px 30px rgba(37,99,235,.08)"}}><div style={{display:"grid",gap:12}}><div><div style={{fontSize:12,letterSpacing:"1.3px",fontWeight:900,color:"#1D4ED8",fontFamily:F}}>CÓDIGO PROMOCIONAL / REFERIDOS</div><p style={{fontSize:14,color:"#3a5068",lineHeight:1.75,fontFamily:F,margin:"6px 0 0"}}>Si viene referido por un aliado estratégico, ingrese su código para aplicar un 15% adicional antes del pago.</p></div><div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) auto auto",gap:10,alignItems:"center"}} className="promo-code-row"><input style={{...IS,background:"#fff",textTransform:"uppercase"}} value={promoCode} onChange={e=>updatePromoCode(e.target.value)} placeholder="Escriba el código del aliado"/><button type="button" onClick={validatePromoCode} disabled={promoBusy||!promoCodeValue(promoCode)} style={{padding:"13px 18px",borderRadius:13,border:"none",background:promoBusy||!promoCodeValue(promoCode)?"#CBD5E1":"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontFamily:F,fontWeight:900,cursor:promoBusy||!promoCodeValue(promoCode)?"not-allowed":"pointer"}}>{promoBusy?"Validando...":"Aplicar"}</button><button type="button" onClick={clearPromoCode} disabled={!promoCodeValue(promoCode)} style={{padding:"13px 16px",borderRadius:13,border:"1px solid rgba(37,99,235,.14)",background:"#fff",color:"#1D4ED8",fontFamily:F,fontWeight:900,cursor:promoCodeValue(promoCode)?"pointer":"not-allowed",opacity:promoCodeValue(promoCode)?1:.55}}>Limpiar</button></div>{promoStatus.state==="valid"&&promoApplied?<div style={{padding:14,borderRadius:14,background:"rgba(34,197,94,.12)",border:"1px solid rgba(34,197,94,.20)",fontFamily:F,color:"#14532D",lineHeight:1.7}}><strong>Código aplicado correctamente.</strong> Valor normal: <strong>$ {fm(baseTarifa)}</strong> · Descuento: <strong>- $ {fm(promoDiscount)}</strong> · Total con referido: <strong>$ {fm(tarifa)}</strong></div>:null}{promoStatus.state==="invalid"?<div style={{padding:14,borderRadius:14,background:"rgba(220,38,38,.08)",border:"1px solid rgba(220,38,38,.16)",fontFamily:F,color:"#991B1B",lineHeight:1.7,fontWeight:800}}>{promoStatus.message}</div>:null}<style>{`@media(max-width:720px){.promo-code-row{grid-template-columns:1fr!important;}}`}</style></div></div>

      <div style={{marginTop:16,padding:18,borderRadius:12,background:"rgba(37,99,235,.04)",border:"1px dashed rgba(37,99,235,.16)"}}><h4 style={{fontSize:14,fontWeight:700,color:"#1B3A5C",marginBottom:8,fontFamily:F}}>📎 Soportes documentales opcionales</h4><p style={{fontSize:14,color:"#1B3A5C",lineHeight:1.8,fontFamily:F,marginBottom:10}}>Si ya cuenta con algunos soportes, puede adjuntarlos ahora mismo para que queden vinculados a la solicitud. Esto agiliza la revisión en el panel interno de CONTARAE.</p><div style={{padding:16,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.12)",marginBottom:12}}><input type="file" multiple accept={SUPPORT_ACCEPT} onChange={e=>{addSupportFiles(e.target.files);e.target.value="";}} style={{...IS,padding:"10px 12px",cursor:"pointer"}}/><div style={{marginTop:8,fontSize:12,color:"#64748B",lineHeight:1.7,fontFamily:F}}>Formatos permitidos: PDF, JPG, PNG, WEBP, HEIC, DOC y DOCX. Máximo {SUPPORT_MAX_FILES} archivos de hasta {fmtB(SUPPORT_MAX_BYTES)} cada uno.</div></div>{supportFiles.length>0&&<div style={{display:"grid",gap:8,marginBottom:12}}>{supportFiles.map((file,index)=><div key={`${file.name}-${file.lastModified}-${index}`} style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:12,padding:"12px 14px",borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.10)"}}><div><div style={{fontSize:14,fontWeight:700,color:"#0B1D3A",fontFamily:F,lineHeight:1.5}}>{file.name}</div><div style={{fontSize:12,color:"#64748B",fontFamily:F}}>{fmtB(file.size)} · {file.type||"Archivo"}</div></div><button type="button" onClick={()=>removeSupportFile(index)} style={{padding:"9px 12px",borderRadius:10,border:"1px solid rgba(220,38,38,.14)",background:"rgba(220,38,38,.06)",color:"#DC2626",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:F}}>Quitar</button></div>)}</div>}<p style={{fontSize:14,color:"#3a5068",lineHeight:1.8,fontFamily:F,marginBottom:10}}>Si aún no tiene todos los soportes, puede completar el pago y enviarlos después por <strong>WhatsApp</strong> o <strong>correo electrónico</strong>. Ejemplos: contratos, extractos bancarios, desprendibles de nómina, facturas, certificaciones, comprobantes de pago y demás documentos que acrediten la información reportada.</p><p style={{fontSize:14,color:"#3a5068",lineHeight:1.8,fontFamily:F,marginBottom:0}}>Después de recibir la solicitud, un profesional de CONTARAE se pondrá en contacto para realizar la revisión completa de la documentación y validar la información antes de emitir la certificación.</p></div>

      <div style={{marginTop:12}}><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Comentarios</label><textarea style={{...IS,minHeight:60,resize:"vertical",marginTop:4}} value={f.cm} onChange={e=>u("cm",e.target.value)} placeholder="Información adicional..."/></div>
      <div style={{display:"flex",justifyContent:"space-between",marginTop:16}}><button type="button" onClick={()=>moveStep(1)} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#2563EB",fontSize:15,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button><button type="button" onClick={continueFromIncomeStep} style={{padding:"12px 30px",borderRadius:11,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div>
    </div>}

    {step===3&&<div><h4 style={{fontSize:16,fontWeight:700,color:"#1B3A5C",marginBottom:14,fontFamily:F}}>📋 Paso 4: Confirmación y Pago</h4>
      <div style={{padding:18,borderRadius:11,background:"#f0f4fa",border:"1px solid rgba(37,99,235,.12)",marginBottom:16}}><div style={{display:"grid",gap:6,fontSize:15,fontFamily:F,color:"#3a5068"}}><div><strong>Nombre:</strong> {f.n}</div><div><strong>Documento:</strong> {f.td} {f.cc} — {f.le}</div><div><strong>Teléfono:</strong> {f.tel} | <strong>Correo:</strong> {f.em}</div><div><strong>Destino:</strong> {f.dir} {f.ent&&`— ${f.ent}`} | <strong>Período:</strong> {periodLabel||f.per}</div><div style={{marginTop:8,paddingTop:8,borderTop:"1px solid rgba(37,99,235,.1)"}}><strong>Total mensual recurrente:</strong> <span style={{color:"#2563EB",fontWeight:700,fontSize:17}}>$ {fm(recurrentMonthlyTotal)}</span></div><div><strong>Total recurrente del período:</strong> <span style={{color:"#0B1D3A",fontWeight:700}}>$ {fm(recurrentPeriodTotal)}</span>{eventualTotal?<> | <strong>Total eventuales:</strong> <span style={{color:"#0B1D3A",fontWeight:700}}>$ {fm(eventualTotal)}</span></>:null}</div>{promoApplied?<div><strong>Valor normal:</strong> <span style={{color:"#0B1D3A",fontWeight:700}}>$ {fm(baseTarifa)}</span> | <strong>Código:</strong> <span style={{color:"#15803D",fontWeight:800}}>{promoStatus.code}</span> | <strong>Descuento:</strong> <span style={{color:"#15803D",fontWeight:800}}>- $ {fm(promoDiscount)}</span></div>:null}<div>{eventualTotal?(<><strong>Total global del período:</strong> <span style={{color:"#0B1D3A",fontWeight:700}}>$ {fm(globalPeriodTotal)}</span> | </>):null}<strong>Valor a pagar:</strong> <span style={{color:"#0B1D3A",fontWeight:700,fontSize:17}}>$ {fm(tarifa)}</span></div></div></div>

      <div style={{padding:18,borderRadius:11,background:"rgba(220,38,38,.03)",border:"1px solid rgba(220,38,38,.1)",marginBottom:16}}><h4 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F}}>CONDICIONES DEL SERVICIO</h4><div style={{fontSize:14,color:"#3a5068",lineHeight:1.85,fontFamily:F}}>
        <p style={{marginBottom:8}}><strong>1. Veracidad:</strong> Declaro bajo gravedad del juramento (art. 83 Constitución) que la información refleja mi realidad económica. Los soportes son auténticos y no han sido alterados.</p>
        <p style={{marginBottom:8}}><strong>2. Verificación:</strong> CONTARAE verificará la información. No certificará datos no verificables o con inconsistencias.</p>
        <p style={{marginBottom:8}}><strong>3. Política de servicio:</strong> El valor pagado corresponde a revisión, verificación y elaboración. Si no puede emitirse por falta de información atribuible al solicitante, no hay devolución.</p>
        <p><strong>4. Datos personales:</strong> Autorizo el tratamiento conforme a la Ley 1581 de 2012.</p>
      </div><label style={{display:"flex",alignItems:"flex-start",gap:8,marginTop:14,cursor:"pointer"}}><input type="checkbox" checked={acc} onChange={e=>sAcc(e.target.checked)} style={{marginTop:3,accentColor:"#2563EB",width:18,height:18}}/><span style={{fontSize:15,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>He leído, entiendo y acepto las condiciones.</span></label></div>

      <div style={{textAlign:"center"}}><button type="button" onClick={()=>acc?openWompi():alert("Debe aceptar las condiciones")} disabled={!acc} style={{padding:"14px 40px",borderRadius:13,background:acc?"linear-gradient(135deg,#1B3A5C,#2563EB)":"#ccc",color:"#fff",fontSize:16,fontWeight:700,border:"none",cursor:acc?"pointer":"not-allowed",fontFamily:F,boxShadow:acc?"0 4px 20px rgba(37,99,235,.3)":"none"}}>🔒 Pagar $ {fm(tarifa)} con Wompi</button><p style={{fontSize:12,color:"#7A8FA8",marginTop:10,fontFamily:F}}>Guardaremos primero la solicitud en estado pendiente y luego abriremos la pasarela segura de pago.</p></div>
      <div style={{marginTop:14}}><button type="button" onClick={()=>moveStep(2)} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#2563EB",fontSize:15,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button></div>
    </div>}
    </div></div></div>, document.body)}

    {[PAYMENT_PHASES.preparing,PAYMENT_PHASES.awaiting,PAYMENT_PHASES.approved,PAYMENT_PHASES.failed].includes(paymentFlow.phase)&&createPortal(<div style={{position:"fixed",inset:0,background:"rgba(8,15,29,.58)",zIndex:12010,display:"flex",alignItems:"center",justifyContent:"center",padding:"24px 18px"}} onClick={()=>paymentFlow.phase===PAYMENT_PHASES.awaiting?null:(clearTrackedReference(),closePaymentFeedback())}><div style={{background:"#fff",borderRadius:20,padding:36,maxWidth:560,width:"100%",textAlign:"center",boxShadow:"0 20px 60px rgba(0,0,0,.25)",border:"1px solid rgba(37,99,235,.10)"}} onClick={e=>e.stopPropagation()}>
      {paymentFlow.phase===PAYMENT_PHASES.preparing&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:15,fontWeight:700,color:"#2563EB",marginBottom:14,fontFamily:F}}>Preparando solicitud</div><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:0}}>{paymentFlow.message}</p></>}
      {paymentFlow.phase===PAYMENT_PHASES.awaiting&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:15,fontWeight:700,color:"#2563EB",marginBottom:14,fontFamily:F}}>Confirmando pago</div><div style={{width:56,height:56,borderRadius:"50%",border:"4px solid rgba(37,99,235,.12)",borderTopColor:"#2563EB",margin:"0 auto 18px",animation:"App-logo-spin 1s linear infinite"}}/><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:10}}>{paymentFlow.message}</p><p style={{fontSize:13,color:"#7A8FA8",fontFamily:F,marginBottom:0}}>Referencia: <strong>{paymentFlow.reference}</strong></p></>}
      {paymentFlow.phase===PAYMENT_PHASES.approved&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:16,fontWeight:700,color:"#2563EB",marginBottom:14,fontFamily:F}}>{paymentFlow.consecutive?`Solicitud N° ${paymentFlow.consecutive}`:"Solicitud registrada"}</div><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:8}}>Pago confirmado. Su solicitud quedó aprobada en el sistema y uno de nuestros profesionales revisará la documentación que soporte la realidad económica de los ingresos reportados.</p>{supportFiles.length>0&&<p style={{fontSize:14,color:"#1D4ED8",lineHeight:1.8,fontFamily:F,marginBottom:8,fontWeight:700}}>Ya recibimos {supportFiles.length} soporte(s) adjunto(s) en el formulario. Si falta alguno, puede enviarlo después por WhatsApp o correo.</p>}<p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:8}}>Envíe los soportes por WhatsApp o al correo <strong>{EM}</strong>. Ejemplos: contratos, extractos bancarios, desprendibles de nómina, facturas, certificaciones y demás documentos que acrediten la información suministrada.</p><p style={{fontSize:13,color:"#7A8FA8",fontFamily:F,marginBottom:20}}>Referencia de pago: <strong>{paymentFlow.reference}</strong></p><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",animation:"heroUp 1.38s ease-out"}}><a href={`${WL}?text=${waMsg}`} target="_blank" rel="noopener noreferrer" style={{padding:"12px 22px",borderRadius:11,background:"#25D366",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Enviar soportes por WhatsApp</a><a href={`mailto:${EM}?subject=${encodeURIComponent(`Soportes solicitud ${paymentFlow.consecutive||paymentFlow.reference}`)}`} style={{padding:"12px 22px",borderRadius:11,background:"rgba(37,99,235,.08)",color:"#2563EB",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Enviar por correo</a><button type="button" onClick={()=>{closePaymentFeedback();resetForm();clearTrackedReference();}} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#5A6F8A",fontSize:14,fontWeight:600,border:"2px solid rgba(37,99,235,.12)",cursor:"pointer",fontFamily:F}}>Nueva solicitud</button></div></>}
      {paymentFlow.phase===PAYMENT_PHASES.failed&&<><div style={{display:"inline-block",padding:"6px 18px",borderRadius:100,background:"rgba(220,38,38,.10)",fontSize:16,fontWeight:700,color:"#DC2626",marginBottom:14,fontFamily:F}}>Pago no confirmado</div><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.8,fontFamily:F,marginBottom:8}}>{paymentFlow.message}</p><p style={{fontSize:13,color:"#7A8FA8",fontFamily:F,marginBottom:20}}>Referencia: <strong>{paymentFlow.reference||lastRef||"Pendiente"}</strong></p><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}><a href={getPaymentSupportLink(paymentFlow.reference)} target="_blank" rel="noopener noreferrer" style={{padding:"12px 22px",borderRadius:11,background:"#25D366",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar ayuda por WhatsApp</a><a href={`mailto:${EM}?subject=${encodeURIComponent(`Ayuda pago certificación ${paymentFlow.reference||lastRef||""}`)}`} style={{padding:"12px 22px",borderRadius:11,background:"rgba(37,99,235,.08)",color:"#2563EB",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar ayuda por correo</a><button type="button" onClick={reopenFormForPaymentRetry} style={{padding:"12px 22px",borderRadius:11,background:"transparent",color:"#5A6F8A",fontSize:14,fontWeight:600,border:"2px solid rgba(37,99,235,.12)",cursor:"pointer",fontFamily:F}}>Volver al formulario</button></div></>}
    </div></div>, document.body)}</Sec>);
}
/* ══════ TOOLS (ALL VISIBLE) ══════ */
const TOOL_META=[
  {id:"tool-renta",badge:"Consulte",title:"Fecha y condiciones de renta",desc:"Revise topes en UVT y pesos, condiciones frecuentes y fecha estimada de vencimiento.",cta:"Consultar renta"},
  {id:"tool-retencion",badge:"Optimice",title:"Retención en la fuente",desc:"Estime la retención mensual con deducciones, rentas exentas y años gravables 2025 y 2026.",cta:"Calcular retención"},
  {id:"tool-planilla",badge:"Simule",title:"Planilla independientes",desc:"Calcule salud, pensión y ARL para contratistas e independientes según su nivel de riesgo.",cta:"Liquidar planilla"},
  {id:"tool-nomina",badge:"Gestione",title:"Liquidador de nómina",desc:"Obtenga devengado, deducciones, prestaciones y costo total del trabajador de forma clara.",cta:"Abrir liquidador"},
  {id:"tool-iva",badge:"Calcule",title:"Liquidador de IVA",desc:"Determine IVA, subtotal y valor total para ventas, cotizaciones y facturación.",cta:"Calcular IVA"},
  {id:"tool-precio",badge:"Convierta",title:"Precio antes de IVA",desc:"Descubra el valor base de un producto o servicio a partir del precio final con IVA incluido.",cta:"Ver herramienta"}
];

const goAnchor=id=>e=>{
  const el=document.getElementById(id);
  if(!el)return;
  e.preventDefault();
  const y=el.getBoundingClientRect().top + window.pageYOffset - 156;
  window.scrollTo({top:y,behavior:"smooth"});
  if(window.history?.replaceState)window.history.replaceState(null,"",`#${id}`);
};

function ToolIntroCard({item}){
  const cardHover=(e,on)=>{
    const el=e.currentTarget;
    el.style.transform=on?"translateY(-8px) scale(1.022)":"translateY(0) scale(1)";
    el.style.boxShadow=on
      ?"0 26px 54px rgba(37,99,235,.15), 0 0 0 1px rgba(96,165,250,.24) inset"
      :"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset";
    const ring=el.querySelector('.toolintro-glow');
    if(ring) ring.style.opacity=on?"1":".72";
  };
  return(
    <div
      onMouseEnter={e=>cardHover(e,true)}
      onMouseLeave={e=>cardHover(e,false)}
      style={{
        padding:24,
        height:"100%",
        display:"flex",
        flexDirection:"column",
        justifyContent:"space-between",
        borderRadius:20,
        background:"#fff",
        border:"1px solid rgba(37,99,235,.12)",
        boxShadow:"0 18px 42px rgba(15,23,42,.07), 0 0 0 1px rgba(255,255,255,.55) inset",
        position:"relative",
        overflow:"hidden",
        transform:"translateY(0) scale(1)",
        transition:"transform .34s ease, box-shadow .34s ease"
      }}
    >
      <div className="toolintro-glow" style={{
        position:"absolute",
        inset:-2,
        borderRadius:22,
        pointerEvents:"none",
        opacity:.72,
        transition:"opacity .34s ease",
        background:"linear-gradient(135deg, rgba(125,211,252,.18), rgba(59,130,246,.10), rgba(125,211,252,.18))",
        maskImage:"linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
        WebkitMaskImage:"linear-gradient(#fff 0 0), linear-gradient(#fff 0 0)",
        maskComposite:"exclude",
        WebkitMaskComposite:"xor",
        padding:1
      }}/>
      <div style={{position:"relative",zIndex:1}}>
        <div style={{display:"inline-flex",padding:"6px 12px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#1D4ED8",letterSpacing:"1.1px",fontFamily:F,marginBottom:14,boxShadow:"0 6px 14px rgba(37,99,235,.05)"}}>{item.badge}</div>
        <h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F,lineHeight:1.25}}>{item.title}</h3>
        <p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.82,fontFamily:F,maxWidth:320}}>{item.desc}</p>
      </div>
      <a
        href={`#${item.id}`}
        onClick={goAnchor(item.id)}
        style={{marginTop:20,display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,padding:"12px 18px",borderRadius:13,background:"linear-gradient(135deg,#10233F,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 12px 24px rgba(37,99,235,.16)",border:"1px solid rgba(191,219,254,.18)",transition:"transform .28s ease, box-shadow .28s ease",position:"relative",zIndex:1}}
        onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 16px 30px rgba(37,99,235,.20)";}}
        onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="0 12px 24px rgba(37,99,235,.16)";}}
      >
        {item.cta} →
      </a>
    </div>
  )
}

function ToolStage({id,kicker,title,desc,children,tone=0}){const bg=SUB_BG[tone%SUB_BG.length];return(<div id={id} style={{minHeight:"calc(100vh - 108px)",display:"flex",alignItems:"center",padding:"14px 0 10px",scrollMarginTop:"145px"}}><div style={{width:"100%",background:bg,border:"1px solid rgba(37,99,235,.10)",borderRadius:28,padding:"34px 28px 28px",boxShadow:"0 16px 40px rgba(15,23,42,.06)",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:0,left:0,right:0,height:1,background:"linear-gradient(90deg, rgba(37,99,235,0), rgba(37,99,235,.26), rgba(56,189,248,.20), rgba(37,99,235,0))"}}/><div style={{maxWidth:970,margin:"0 auto 14px"}}><div style={{display:"inline-flex",alignItems:"center",gap:10,padding:"6px 14px",borderRadius:999,background:"rgba(37,99,235,.08)",border:"1px solid rgba(37,99,235,.10)",fontSize:11,fontWeight:700,color:"#1D4ED8",letterSpacing:"1.2px",fontFamily:F,marginBottom:12}}><span style={{width:14,height:1.5,background:"rgba(37,99,235,.35)",borderRadius:999}}/>{kicker}</div><h3 style={{fontFamily:FH,fontSize:"clamp(28px,3.9vw,42px)",fontWeight:700,color:"#0B1D3A",lineHeight:1.08,margin:"0 0 10px",maxWidth:720,textWrap:"balance"}}>{title}</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.82,maxWidth:760,fontFamily:F,margin:0}}>{desc}</p></div><div style={{marginTop:12}}>{children}</div></div></div>)}

function Tools(){const uv25=49799,uv26=52374;
return(<Sec id="herramientas" title="Herramientas CONTARAE" sub="HERRAMIENTAS" bg={B[6]}>
  <div style={{maxWidth:860,margin:"0 auto 26px",textAlign:"center"}}>
    <p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.85,fontFamily:F}}>En CONTARAE ponemos a disposición de nuestros usuarios herramientas prácticas elaboradas para facilitar cálculos tributarios, laborales y financieros de uso frecuente. Explore cada herramienta, conozca su utilidad y acceda directamente a la que necesita desde esta sección o desde el menú principal.</p>
  </div>

  <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:22,marginBottom:28}} className="tool-grid">
    {TOOL_META.map(item=><ToolIntroCard key={item.id} item={item}/>) }
  </div>

  <div style={{display:"grid",gap:26}}>
    <ToolStage id="tool-renta" tone={0} kicker="ANÁLISIS TRIBUTARIO" title="Condiciones y fecha para declarar renta" desc="Revise topes en UVT y pesos, entienda qué puede sumar en cada condición y consulte la fecha estimada de presentación según los últimos dígitos."><ToolRenta uv={uv25}/></ToolStage>
    <ToolStage id="tool-retencion" tone={1} kicker="CÁLCULO MENSUAL" title="Retención en la fuente" desc="Estime la retención aplicable con deducciones y rentas exentas, y compare fácilmente los años 2025 y 2026 para tomar mejores decisiones tributarias."><ToolRet uv25={uv25} uv26={uv26}/></ToolStage>
    <ToolStage id="tool-planilla" tone={2} kicker="SEGURIDAD SOCIAL" title="Planilla independientes" desc="Simule el valor de salud, pensión y ARL para contratistas e independientes con una vista clara del IBC y del total mensual a pagar."><ToolPlan/></ToolStage>
    <ToolStage id="tool-nomina" tone={0} kicker="GESTIÓN LABORAL" title="Liquidador de nómina" desc="Calcule devengado, deducciones, prestaciones, parafiscales y costo total del trabajador en una herramienta diseñada para empleadores y responsables de talento humano."><ToolNom/></ToolStage>
    <ToolStage id="tool-iva" tone={1} kicker="FACTURACIÓN Y VENTAS" title="Liquidador de IVA" desc="Obtenga el IVA correspondiente sobre el valor base y visualice el subtotal y total de la operación para cotizaciones, ventas y procesos comerciales."><ToolIVA/></ToolStage>
    <ToolStage id="tool-precio" tone={2} kicker="CONVERSIÓN DE VALORES" title="Precio antes de IVA" desc="Conozca el valor base de un producto o servicio a partir del precio final con IVA incluido. Útil para análisis de precios, márgenes y estructura comercial."><ToolPrIVA/></ToolStage>
  </div>
</Sec>)}


function ToolCTA({text,msg}){return(
  <div style={{marginTop:18,padding:"18px 18px 16px",borderRadius:16,background:"linear-gradient(135deg, rgba(27,58,92,.08), rgba(37,99,235,.10))",border:"1px solid rgba(37,99,235,.12)"}}>
    <p style={{fontSize:15,lineHeight:1.75,color:"#1B3A5C",fontFamily:F,fontWeight:600,marginBottom:12}}>{text}</p>
    <a href={wm(msg)} target="_blank" rel="noopener noreferrer" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"11px 18px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 10px 22px rgba(37,99,235,.18)"}}>Solicitar asesoría por WhatsApp</a>
    <div style={{marginTop:12,fontSize:11,color:"#64748B",lineHeight:1.65,fontFamily:F}}>Esta herramienta se dispone para uso orientativo. Es responsabilidad del usuario revisar y validar que la información utilizada y el resultado estén alineados con la normatividad vigente aplicable a su caso.</div>
  </div>
)}

function ToolRenta({uv}){
  const initialLead={name:"",documentNumber:"",phone:"",email:"",treatmentConsent:false,marketingConsent:true};
  const[active,sActive]=useState("ingresos_patrimonio");
  const[topStatus,sTopStatus]=useState("");
  const[dueInput,sDueInput]=useState("");
  const[lead,setLead]=useState(initialLead);
  const[leadBusy,setLeadBusy]=useState(false);
  const[leadMsg,setLeadMsg]=useState("");
  const[leadErr,setLeadErr]=useState("");
  const t14=1400*uv,t45=4500*uv,sancionUvt=10,sancionCop=10*52374;
  const dueInfo=getRentaDueInfo(dueInput||lead.documentNumber);
  const getUrgencyMeta=()=>{
    if(!dueInfo)return{label:"Consulta tu vencimiento",tone:"#1D4ED8",bg:"rgba(37,99,235,.08)",note:"La fecha permite priorizar la preparación si finalmente debes declarar."};
    const dueDate=new Date(`${dueInfo.estimatedDueDate}T12:00:00`);
    const today=new Date();today.setHours(0,0,0,0);
    const diffDays=Math.ceil((dueDate.getTime()-today.getTime())/86400000);
    if(diffDays<0)return{label:"Vencimiento superado",tone:"#991B1B",bg:"rgba(220,38,38,.10)",note:"Conviene revisar el caso cuanto antes para evitar que aumenten sanciones o intereses."};
    if(diffDays<=10)return{label:"Prioridad alta",tone:"#B91C1C",bg:"rgba(220,38,38,.10)",note:"La fecha está cerca. Lo ideal es validar obligación y soportes de inmediato."};
    if(diffDays<=30)return{label:"Vence pronto",tone:"#B45309",bg:"rgba(245,158,11,.14)",note:"Aún hay margen, pero ya conviene organizar documentos y confirmar si debes declarar."};
    return{label:"Preparación oportuna",tone:"#15803D",bg:"rgba(34,197,94,.12)",note:"Buen momento para revisar soportes con calma y evitar correr al final."};
  };
  const urgencyMeta=getUrgencyMeta();
  const topStatusMeta={
    supera:{label:"Sí, supero uno o más topes",title:"Tu caso requiere revisión prioritaria",tone:"#B45309",bg:"rgba(245,158,11,.12)",priority:"alta",profile:"supera_topes",offer:"Podemos confirmar tu obligación sin costo, revisar soportes y acompañarte en la preparación de la declaración antes del vencimiento."},
    duda:{label:"No estoy seguro",title:"Tu caso merece confirmación profesional",tone:"#1D4ED8",bg:"rgba(37,99,235,.08)",priority:"media",profile:"no_seguro",offer:"Podemos ayudarte a validar topes, movimientos y fecha de vencimiento para que tomes una decisión con tranquilidad."},
    no_supera:{label:"No supero topes",title:"Podemos hacer una revisión preventiva",tone:"#15803D",bg:"rgba(34,197,94,.10)",priority:"baja",profile:"no_supera_topes",offer:"Si quieres estar seguro, hacemos una confirmación inicial sin costo antes de descartar la obligación."}
  };
  const currentTopMeta=topStatusMeta[topStatus]||{label:"Sin respuesta",title:"Confirma si superas topes",tone:"#1D4ED8",bg:"rgba(37,99,235,.07)",priority:"media",profile:"pendiente_calificacion",offer:"Responde la pregunta final para orientar mejor la revisión inicial."};
  const supportChecklist=topStatus==="no_supera"
    ? ["Documento de identidad o RUT","Últimos dos dígitos del documento","Resumen de ingresos del año","Extractos o certificados principales si tienes dudas"]
    : ["Certificado de ingresos y retenciones","Extractos bancarios y billeteras digitales","Certificados de créditos, intereses y retenciones","Predial, vehículo, inversiones y otros activos","Soportes de dependientes, medicina prepagada, AFC o pensiones voluntarias","Costos y gastos soportados si eres independiente"];
  const conditionGroups=[
    {id:"ingresos_patrimonio",icon:"💼",title:"Ingresos y patrimonio",summary:"Revise ingresos acumulados del año y activos a 31 de diciembre.",items:[
      {label:"Ingresos brutos",uvt:"1.400 UVT",cop:t14,detail:"Incluye salarios, honorarios, comisiones, arriendos, pensiones, ingresos como independiente, ventas y demás pagos recibidos durante el año gravable. No se revisa solo el saldo final: se analiza el ingreso acumulado."},
      {label:"Patrimonio bruto",uvt:"4.500 UVT",cop:t45,detail:"Sume inmuebles, vehículos, cuentas bancarias, inversiones, aportes, derechos fiduciarios y otros activos a 31 de diciembre. El patrimonio bruto se mira antes de descontar créditos o deudas."}
    ]},
    {id:"consumos_compras",icon:"💳",title:"Consumos, compras y tarjetas",summary:"Agrupa compras del año y consumos hechos con tarjeta de crédito.",items:[
      {label:"Compras y consumos",uvt:"1.400 UVT",cop:t14,detail:"Incluye compras en efectivo, tarjeta, transferencias, pagos digitales y consumos relevantes hechos durante el año. Es un criterio distinto al de ingresos."},
      {label:"Consumos con tarjeta de crédito",uvt:"1.400 UVT",cop:t14,detail:"Se tienen en cuenta los consumos acumulados con tarjeta de crédito durante el año, incluso si después se pagaron las cuotas o se difirieron las compras."}
    ]},
    {id:"movimientos_financieros",icon:"🏦",title:"Movimientos financieros",summary:"Bancos, depósitos, transferencias, inversiones y billeteras digitales.",items:[
      {label:"Movimientos bancarios",uvt:"1.400 UVT",cop:t14,detail:"Deben revisarse los movimientos de ingreso en cada banco, cuenta de ahorro, cuenta corriente, depósito, inversión y billetera digital. También pueden sumar transferencias, consignaciones, desembolsos de créditos, movimientos entre entidades y otros depósitos que aumenten el acumulado anual, aunque no todos representen utilidad real."}
    ]},
    {id:"responsabilidades",icon:"📌",title:"Responsabilidades especiales",summary:"Responsabilidad de IVA y revisión del RUT durante el año gravable.",items:[
      {label:"Responsable de IVA",uvt:"Condición especial",cop:null,detail:"Si fue responsable de IVA durante el año, esta condición puede obligar a declarar renta aunque otros topes no parezcan superados. Conviene revisar RUT, responsabilidades y actividad económica."}
    ]}
  ];
  const updateLead=(field,value)=>setLead(current=>({
    ...current,
    [field]:field==="documentNumber"?onlyDigits(value).slice(0,12):field==="phone"?normalizeColombianMobileNumber(value).slice(0,10):value
  }));
  const submitLead=async event=>{
    event.preventDefault();
    setLeadMsg("");setLeadErr("");
    const normalized={...lead,name:formatProperName(lead.name),documentNumber:onlyDigits(lead.documentNumber||dueInput),phone:normalizeColombianMobileNumber(lead.phone).slice(0,10),email:normalizeEmail(lead.email)};
    setLead(normalized);
    const currentDue=getRentaDueInfo(normalized.documentNumber||dueInput);
    if(!normalized.name||normalized.documentNumber.length<2||!normalized.phone||!normalized.email){setLeadErr("Complete nombre, documento o últimos dígitos, WhatsApp y correo.");return;}
    if(!isValidEmail(normalized.email)){setLeadErr("Ingrese un correo electrónico válido.");return;}
    if(!isValidColombianMobileNumber(normalized.phone)){setLeadErr("Ingrese un WhatsApp colombiano válido.");return;}
    if(!topStatus){setLeadErr("Seleccione si supera topes, no está seguro o quiere una revisión preventiva.");return;}
    setLeadBusy(true);
    try{
      const answer=currentTopMeta.label||"Sin respuesta";
      const due=currentDue?`Fecha estimada de vencimiento: ${currentDue.label}.`:"Fecha estimada pendiente por confirmar.";
      const response=await fetch("/api/submit-client-lead",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
        ...normalized,
        serviceInterest:"Declaración de renta",
        comment:`Guía interactiva renta. Respuesta topes: ${answer}. Prioridad sugerida: ${currentTopMeta.priority}. ${due} Checklist sugerido: ${supportChecklist.join("; ")}.`,
        sourcePath:window.location.pathname,
        sourceLabel:"Guía condiciones renta",
        campaign:RENTA_CAMPAIGN_ID,
        taxCampaign:RENTA_CAMPAIGN_ID,
        taxYear:RENTA_TAX_YEAR,
        filingYear:RENTA_FILING_YEAR,
        taxLastTwoDigits:onlyDigits(normalized.documentNumber).slice(-2),
        estimatedDueDate:currentDue?.estimatedDueDate||"",
        dueDateLabel:currentDue?.label||"",
        taxLeadType:"guia_condiciones_renta",
        taxProfile:currentTopMeta.profile,
        taxConditions:topStatus?[topStatus]:[],
        leadPriority:currentTopMeta.priority,
        supportChecklist,
        marketingAttribution:getMarketingAttribution(),
        ...getMarketingFormFields()
      })});
      const payload=await response.json();
      if(!response.ok)throw new Error(payload.detail||payload.error||"No fue posible registrar tus datos.");
      trackMarketingEvent("lead_submit",{service_interest:"Declaración de renta",source_label:"Guía condiciones renta",campaign:RENTA_CAMPAIGN_ID});
      setLeadMsg("Datos recibidos. Te contactaremos por WhatsApp para confirmar tu caso y orientarte antes del vencimiento.");
      setLead(initialLead);
      sTopStatus("");
    }catch(err){
      setLeadErr(err.message);
    }finally{
      setLeadBusy(false);
    }
  };
  return(
    <div style={PANEL}>
      <div style={{display:"grid",gap:18}}>
        <div>
          <h3 style={{fontSize:24,fontWeight:900,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Guía de declaración de renta personas naturales</h3>
          <div style={{...NOTE_BOX,marginBottom:0}}>Año gravable 2025 · UVT usada para topes: <strong>{cop(uv)}</strong>. Revise las condiciones, consulte su fecha estimada y solicite confirmación inicial sin costo.</div>
        </div>

        <div style={{padding:18,borderRadius:20,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff",border:"1px solid rgba(125,211,252,.16)",boxShadow:"0 18px 42px rgba(15,23,42,.12)"}}>
          <div style={{fontFamily:FH,fontSize:25,lineHeight:1.15,marginBottom:8}}>Declarar renta no siempre significa pagar impuesto</div>
          <p style={{fontFamily:F,fontSize:14,lineHeight:1.75,color:"rgba(240,249,255,.86)",margin:"0 0 12px"}}>En muchos casos la declaración queda sin valor a pagar o con saldos controlados por retenciones, deducciones y rentas exentas. Presentarla a tiempo evita sanciones, intereses y requerimientos.</p>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:10}}>
            <div style={{padding:13,borderRadius:16,background:"rgba(255,255,255,.08)",border:"1px solid rgba(191,219,254,.16)"}}><div style={{fontSize:11,letterSpacing:"1.1px",fontWeight:900,color:"#BFDBFE",fontFamily:F}}>SANCIÓN MÍNIMA</div><strong style={{display:"block",fontSize:20,fontFamily:FH,marginTop:4}}>{sancionUvt} UVT</strong><span style={{fontFamily:F,fontSize:13,color:"rgba(226,232,240,.82)"}}>{cop(sancionCop)} en 2026</span></div>
            <div style={{padding:13,borderRadius:16,background:"rgba(255,255,255,.08)",border:"1px solid rgba(191,219,254,.16)",fontFamily:F,fontSize:13,lineHeight:1.65,color:"rgba(226,232,240,.86)"}}>Si no se declara cuando corresponde, la sanción puede ser mayor según ingresos, consignaciones, impuesto a cargo, emplazamientos o requerimientos.</div>
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12}} className="tool-grid">
          {conditionGroups.map(group=>{
            const open=active===group.id;
            return(
              <div key={group.id} style={{padding:16,borderRadius:18,background:open?"#F8FBFF":"#fff",border:`1px solid ${open?"rgba(37,99,235,.28)":"rgba(37,99,235,.10)"}`,boxShadow:open?"0 16px 34px rgba(37,99,235,.08)":"0 10px 24px rgba(15,23,42,.04)"}}>
                <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",marginBottom:10}}>
                  <div style={{display:"flex",gap:10,alignItems:"center"}}>
                    <span style={{width:36,height:36,borderRadius:14,background:"rgba(37,99,235,.08)",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:18}}>{group.icon}</span>
                    <div>
                      <div style={{fontFamily:F,fontSize:15,fontWeight:900,color:"#0F172A",lineHeight:1.3}}>{group.title}</div>
                      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginTop:5}}>
                        {group.items.map(item=><span key={item.label} style={{fontFamily:F,fontSize:11,color:"#1D4ED8",background:"rgba(37,99,235,.08)",borderRadius:999,padding:"4px 7px",fontWeight:900}}>{item.uvt}{item.cop?` · ${cop(item.cop)}`:""}</span>)}
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={()=>sActive(open?"":group.id)} style={{padding:"7px 10px",borderRadius:999,border:"1px solid rgba(37,99,235,.14)",background:open?"#1D4ED8":"#fff",color:open?"#fff":"#1D4ED8",fontFamily:F,fontSize:11,fontWeight:900,cursor:"pointer",whiteSpace:"nowrap"}}>{open?"Ocultar":"Ver detalle"}</button>
                </div>
                <p style={{fontFamily:F,fontSize:13,color:"#52647F",lineHeight:1.65,margin:0}}>{group.summary}</p>
                {open?(
                  <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid rgba(37,99,235,.10)",display:"grid",gap:10}}>
                    {group.items.map(item=>(
                      <div key={item.label} style={{padding:12,borderRadius:14,background:"#fff",border:"1px solid rgba(37,99,235,.10)"}}>
                        <div style={{display:"flex",justifyContent:"space-between",gap:10,alignItems:"flex-start",flexWrap:"wrap",marginBottom:6}}>
                          <strong style={{fontFamily:F,fontSize:13,color:"#0F172A"}}>{item.label}</strong>
                          <span style={{fontFamily:F,fontSize:11,color:"#1D4ED8",fontWeight:900,background:"rgba(37,99,235,.08)",borderRadius:999,padding:"4px 7px"}}>{item.uvt}{item.cop?` · ${cop(item.cop)}`:""}</span>
                        </div>
                        <p style={{fontFamily:F,fontSize:13,color:"#475569",lineHeight:1.65,margin:0}}>{item.detail}</p>
                      </div>
                    ))}
                  </div>
                ):null}
              </div>
            );
          })}
        </div>

        <div style={{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(260px,.45fr)",gap:14,alignItems:"stretch"}} className="cert-hero-grid">
          <div style={{padding:18,borderRadius:20,background:"linear-gradient(135deg,rgba(37,99,235,.08),rgba(56,189,248,.10))",border:"1px solid rgba(37,99,235,.12)"}}>
            <h4 style={{fontFamily:FH,fontSize:25,lineHeight:1.15,color:"#0B1D3A",margin:"0 0 8px"}}>Consulta tu fecha estimada de vencimiento</h4>
            <p style={{fontFamily:F,fontSize:14,color:"#52647F",lineHeight:1.7,margin:"0 0 12px"}}>Ingresa el documento completo o solo los dos últimos dígitos para ubicar la fecha estimada de presentación.</p>
            <input {...numericInputProps} style={{...IS,maxWidth:260,textAlign:"center",fontSize:20,fontWeight:900,letterSpacing:"1px"}} value={dueInput} onChange={e=>sDueInput(onlyDigits(e.target.value).slice(0,12))} placeholder="Ej. 10203045 o 45"/>
          </div>
          <div style={{padding:18,borderRadius:20,background:dueInfo?"#0B1D3A":"#fff",border:"1px solid rgba(37,99,235,.12)",display:"flex",flexDirection:"column",justifyContent:"center"}}>
            <div style={{fontFamily:F,fontSize:11,letterSpacing:"1.2px",fontWeight:900,color:dueInfo?"#93C5FD":"#1D4ED8",marginBottom:8}}>FECHA ESTIMADA</div>
            <div style={{fontFamily:FH,fontSize:dueInfo?30:22,lineHeight:1.1,color:dueInfo?"#fff":"#0B1D3A"}}>{dueInfo?dueInfo.label:"Pendiente por consultar"}</div>
            <p style={{fontFamily:F,fontSize:12,color:dueInfo?"rgba(226,232,240,.78)":"#64748B",lineHeight:1.6,margin:"8px 0 0"}}>{dueInfo?`Últimos dígitos: ${dueInfo.lastTwoDigits}`:"La fecha no confirma por sí sola la obligación; solo indica el vencimiento si debes declarar."}</p>
            <div style={{marginTop:12,padding:"8px 10px",borderRadius:999,background:urgencyMeta.bg,color:urgencyMeta.tone,fontFamily:F,fontSize:12,fontWeight:900,alignSelf:"flex-start"}}>{urgencyMeta.label}</div>
          </div>
        </div>

        <div style={{padding:18,borderRadius:20,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 14px 30px rgba(15,23,42,.05)"}}>
          <div style={{display:"grid",gap:14}}>
            <div>
              <div style={{fontSize:12,letterSpacing:"1.3px",fontWeight:900,color:"#1D4ED8",fontFamily:F}}>DIAGNÓSTICO INICIAL</div>
              <h4 style={{fontFamily:FH,fontSize:24,lineHeight:1.15,color:"#0B1D3A",margin:"6px 0 6px"}}>¿Superas uno o más topes o tienes dudas sobre tu caso?</h4>
              <p style={{fontFamily:F,fontSize:14,color:"#52647F",lineHeight:1.7,margin:0}}>No buscamos que declares por declarar. Primero confirmamos si realmente estás obligado y qué tan conveniente es preparar tu caso.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",gap:10}} className="tool-grid">
              {Object.entries(topStatusMeta).map(([key,meta])=>(
                <button key={key} type="button" onClick={()=>sTopStatus(key)} style={{padding:14,borderRadius:16,border:`1px solid ${topStatus===key?meta.tone:"rgba(37,99,235,.12)"}`,background:topStatus===key?meta.bg:"#F8FBFF",textAlign:"left",cursor:"pointer",fontFamily:F,color:"#0F172A"}}>
                  <strong style={{display:"block",fontSize:14,lineHeight:1.35,color:topStatus===key?meta.tone:"#0F172A"}}>{meta.label}</strong>
                  <span style={{display:"block",fontSize:12,color:"#64748B",lineHeight:1.55,marginTop:5}}>{key==="supera"?"Quiero acompañamiento para preparar mi declaración.":key==="duda"?"Necesito validar movimientos, ingresos o patrimonio.":"Quiero confirmar antes de descartarlo."}</span>
                </button>
              ))}
            </div>
            <div style={{padding:16,borderRadius:18,background:currentTopMeta.bg,border:"1px solid rgba(37,99,235,.10)"}}>
              <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center",marginBottom:7}}>
                <span style={{fontFamily:F,fontSize:11,fontWeight:900,letterSpacing:"1px",color:currentTopMeta.tone}}>PRIORIDAD {currentTopMeta.priority.toUpperCase()}</span>
                <span style={{fontFamily:F,fontSize:11,fontWeight:900,color:urgencyMeta.tone,background:urgencyMeta.bg,borderRadius:999,padding:"4px 8px"}}>{urgencyMeta.label}</span>
              </div>
              <div style={{fontFamily:F,fontSize:17,fontWeight:900,color:currentTopMeta.tone,marginBottom:6}}>{currentTopMeta.title}</div>
              <p style={{fontFamily:F,fontSize:14,color:"#475569",lineHeight:1.7,margin:"0 0 6px"}}>{currentTopMeta.offer}</p>
              <p style={{fontFamily:F,fontSize:13,color:"#64748B",lineHeight:1.65,margin:0}}>{urgencyMeta.note}</p>
            </div>
            <div style={{padding:16,borderRadius:18,background:"rgba(15,23,42,.03)",border:"1px solid rgba(37,99,235,.10)"}}>
              <div style={{fontFamily:F,fontSize:13,fontWeight:900,color:"#0B1D3A",marginBottom:10}}>Soportes que normalmente revisamos</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>
                {supportChecklist.map(item=><div key={item} style={{display:"flex",gap:8,alignItems:"flex-start",fontFamily:F,fontSize:13,color:"#475569",lineHeight:1.55}}><span style={{width:18,height:18,borderRadius:999,background:"rgba(37,99,235,.10)",color:"#1D4ED8",display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,flex:"0 0 auto"}}>✓</span><span>{item}</span></div>)}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={submitLead} style={{display:"grid",gap:10,padding:18,borderRadius:20,background:"#fff",border:"1px solid rgba(37,99,235,.12)",boxShadow:"0 14px 30px rgba(15,23,42,.05)"}}>
          <div><div style={{fontSize:12,letterSpacing:"1.3px",fontWeight:900,color:"#1D4ED8",fontFamily:F}}>CONFIRMACIÓN SIN COSTO</div><h4 style={{fontFamily:FH,fontSize:24,lineHeight:1.15,color:"#0B1D3A",margin:"6px 0 0"}}>Déjanos tus datos y revisamos tu caso por WhatsApp</h4></div>
          <div className="renta-lead-grid" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}><input required style={IS} value={lead.name} onChange={e=>updateLead("name",e.target.value)} onBlur={e=>updateLead("name",formatProperName(e.target.value))} placeholder="Nombre completo" autoComplete="name"/><input required style={IS} value={lead.documentNumber} onChange={e=>updateLead("documentNumber",e.target.value)} placeholder="Documento o últimos dígitos"/><input required style={IS} value={lead.phone} onChange={e=>updateLead("phone",e.target.value)} placeholder="WhatsApp" autoComplete="tel"/><input required type="email" style={IS} value={lead.email} onChange={e=>updateLead("email",e.target.value)} onBlur={e=>updateLead("email",normalizeEmail(e.target.value))} placeholder="Correo electrónico" autoComplete="email"/></div>
          <label style={{display:"flex",gap:9,fontSize:12,color:"#475569",fontFamily:F,lineHeight:1.6}}><input required type="checkbox" checked={lead.treatmentConsent} onChange={e=>updateLead("treatmentConsent",e.target.checked)}/>Autorizo el tratamiento de mis datos para gestionar esta solicitud.</label>
          <label style={{display:"flex",gap:9,fontSize:12,color:"#475569",fontFamily:F,lineHeight:1.6}}><input type="checkbox" checked={lead.marketingConsent} onChange={e=>updateLead("marketingConsent",e.target.checked)}/>Autorizo recibir recordatorios e información relacionada por WhatsApp y/o correo.</label>
          {leadMsg?<div style={{padding:10,borderRadius:12,background:"rgba(34,197,94,.12)",color:"#15803D",fontFamily:F,fontWeight:800}}>{leadMsg}</div>:null}{leadErr?<div style={{padding:10,borderRadius:12,background:"rgba(220,38,38,.10)",color:"#991B1B",fontFamily:F,fontWeight:800}}>{leadErr}</div>:null}
          <button type="submit" disabled={leadBusy} style={{padding:"12px 18px",borderRadius:12,border:"none",background:leadBusy?"#94A3B8":"linear-gradient(135deg,#0B1D3A,#2563EB)",color:"#fff",fontFamily:F,fontWeight:900,cursor:leadBusy?"not-allowed":"pointer"}}>{leadBusy?"Registrando...":"Confirmar mi caso sin costo"}</button>
        </form>

        <div style={{fontSize:11,color:"#64748B",lineHeight:1.65,fontFamily:F}}>Información orientativa. La obligación real puede depender de residencia fiscal, naturaleza de ingresos, soportes, responsabilidades en RUT, topes especiales y normativa vigente aplicable.</div>
      </div>
    </div>
  )
}

function ToolRet({uv25,uv26}){
  const[yr,sYr]=useState(2025);
  const vals=yr===2025?{uv:uv25,smlmv:laborYearConfig[2025].smlmv}:{uv:uv26,smlmv:laborYearConfig[2026].smlmv};
  const {uv,smlmv}=vals;
  const[d,sD]=useState({ing:"",pensionada:false});
  const[x,sX]=useState({vol:"",afc:"",med:"",intViv:"",dep:false,otras:""});
  const[r,sR]=useState(null);
  const calc=()=>{const ingreso=pN(d.ing); if(ingreso<=0) return; const esPensionada=!!d.pensionada; const salud=Math.round(ingreso*0.04); const pension=esPensionada?0:Math.round(ingreso*0.04); const solidaridad=esPensionada?0:Math.round(ingreso*fspRate(ingreso,smlmv)); const incr=salud+pension+solidaridad; const subtotalA=Math.max(0, ingreso-incr); const combinedCap=Math.min(Math.round(ingreso*0.30), Math.round(yearlyCaps.volAfc*uv)); const volReq=pN(x.vol), afcReq=pN(x.afc); const vol=Math.min(volReq,combinedCap); const afc=Math.min(afcReq,Math.max(0,combinedCap-vol)); const rentEx=vol+afc; const med=Math.min(pN(x.med),Math.round(16*uv)); const dep=x.dep?Math.min(Math.round(ingreso*0.10),Math.round(32*uv)):0; const intViv=Math.min(pN(x.intViv),Math.round(100*uv)); const otras=pN(x.otras); const ded=med+dep+intViv+otras; const subtotalC=Math.max(0, subtotalA-rentEx-ded); const ex25=Math.min(Math.round(subtotalC*0.25), Math.round(yearlyCaps.rent25*uv)); const requestedBenefits=rentEx+ded+ex25; const cap40=Math.round(subtotalA*0.40); const cap1340=Math.round(yearlyCaps.max40*uv); const acceptedBenefits=Math.min(requestedBenefits,cap40,cap1340); const limited=requestedBenefits>acceptedBenefits; const base=Math.max(0, subtotalA-acceptedBenefits); const u=base/uv; const art383=calcArt383Retention(u); const ret=Math.max(0,Math.round(art383.retUVT*uv)); sR({ingreso,esPensionada,salud,pension,solidaridad,incr,subtotalA,volReq,afcReq,vol,afc,rentEx,med,dep,intViv,otras,ded,subtotalC,ex25,requestedBenefits,cap40,cap1340,acceptedBenefits,limited,base,baseUVT:u,retUVT:art383.retUVT,ret,rangeLabel:art383.rangeLabel,formula:art383.formula,tasa:ingreso?((ret/ingreso)*100).toFixed(2):"0.00",neto:ingreso-ret,uv});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Retención en la fuente</h3><div style={{display:"flex",gap:8,marginBottom:14}}>{[2025,2026].map(y=><button type="button" key={y} onClick={()=>{sYr(y);sR(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:15,background:yr===y?"#2563EB":"#E6EEF8",color:yr===y?"#fff":"#1B3A5C"}}>{y}</button>)}</div><div style={{...NOTE_BOX,marginBottom:16}}>Vigencia {yr}. UVT: {cop(uv)} | SMLMV: {cop(smlmv)}. Cálculo orientativo bajo procedimiento 1, con depuración por INCR, rentas exentas, deducciones, renta exenta 25% y límite del 40%.</div><div style={{display:"grid",gap:16}}><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Bloque 1 — INCR</div><div style={{display:"grid",gap:10}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Ingreso mensual bruto</label><input style={IS} value={d.ing} onChange={e=>sD(p=>({...p,ing:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><label style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}><input type="checkbox" checked={d.pensionada} onChange={e=>{sD(p=>({...p,pensionada:e.target.checked}));sR(null);}} style={{accentColor:"#2563EB",width:18,height:18,marginTop:2}}/><span>Persona pensionada <span style={{display:"block",fontSize:12,color:"#64748B",fontWeight:400,lineHeight:1.6,marginTop:3}}>No se calcula aporte obligatorio a pensión ni fondo de solidaridad pensional.</span></span></label><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}><div><label style={{fontSize:12,fontWeight:700,color:"#64748B",fontFamily:F}}>Salud obligatoria (4%)</label><input readOnly style={AUTO_IS} value={cop(pN(d.ing)*0.04)}/></div><div><label style={{fontSize:12,fontWeight:700,color:"#64748B",fontFamily:F}}>Pensión obligatoria {d.pensionada?"(no aplica)":"(4%)"}</label><input readOnly style={AUTO_IS} value={cop(d.pensionada?0:pN(d.ing)*0.04)}/></div><div><label style={{fontSize:12,fontWeight:700,color:"#64748B",fontFamily:F}}>Fondo de solidaridad</label><input readOnly style={AUTO_IS} value={cop(d.pensionada?0:pN(d.ing)*fspRate(pN(d.ing),smlmv))}/></div></div></div></div><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Bloque 2 — Rentas exentas</div><div style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))"}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Aportes voluntarios a pensión</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Tope conjunto con AFC: 30% del ingreso y hasta {cop(yearlyCaps.volAfc*uv)} al mes.</div><input style={IS} value={x.vol} onChange={e=>sX(p=>({...p,vol:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Aportes AFC</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Comparte el mismo tope con voluntarios.</div><input style={IS} value={x.afc} onChange={e=>sX(p=>({...p,afc:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div></div></div><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Bloque 3 — Deducciones</div><div style={{display:"grid",gap:10,gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))"}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Medicina prepagada</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Tope 16 UVT = {cop(16*uv)}.</div><input style={IS} value={x.med} onChange={e=>sX(p=>({...p,med:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Intereses de vivienda</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Tope 100 UVT = {cop(100*uv)}.</div><input style={IS} value={x.intViv} onChange={e=>sX(p=>({...p,intViv:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}><input type="checkbox" checked={x.dep} onChange={e=>sX(p=>({...p,dep:e.target.checked}))} style={{accentColor:"#2563EB",width:18,height:18}}/>Dependientes</label><div style={{fontSize:12,color:"#64748B",marginTop:6,fontFamily:F}}>10% del ingreso bruto, máximo 32 UVT = {cop(32*uv)}.</div></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Otras deducciones procedentes</label><div style={{fontSize:12,color:"#64748B",margin:"3px 0 6px",fontFamily:F}}>Incluya solo deducciones soportadas y permitidas para su caso.</div><input style={IS} value={x.otras} onChange={e=>sX(p=>({...p,otras:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div></div></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular retención</button></div>{r&&<div style={{marginTop:18,display:"grid",gap:14}}>{[{title:"Bloque 1 — INCR",rows:[["Ingreso bruto",r.ingreso],["Salud 4%",r.salud],[r.esPensionada?"Pensión (no aplica por pensionado)":"Pensión 4%",r.pension],[r.esPensionada?"Fondo de solidaridad (no aplica)":"Fondo de solidaridad",r.solidaridad],["Subtotal INCR",r.incr],["Subtotal (A)",r.subtotalA]]},{title:"Bloque 2 — Rentas exentas",rows:[["Voluntarios solicitados",r.volReq],["Voluntarios aceptados",r.vol],["AFC solicitado",r.afcReq],["AFC aceptado",r.afc],["Subtotal rentas exentas",r.rentEx]]},{title:"Bloque 3 — Deducciones",rows:[["Medicina prepagada",r.med],["Dependientes",r.dep],["Intereses vivienda",r.intViv],["Otras deducciones",r.otras],["Subtotal deducciones",r.ded],["Subtotal (C)",r.subtotalC]]},{title:"Bloque 4 y 5 — Renta exenta 25% y límite 40%",rows:[["Renta exenta 25%",r.ex25],["Beneficios solicitados",r.requestedBenefits],["Límite 40%",r.cap40],["Límite 1.340 UVT anuales",r.cap1340],["Valor aceptado",r.acceptedBenefits]]}].map((block,idx)=><div key={idx} style={{...BLOCK,background:"#fff"}}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>{block.title}</div><div style={{display:"grid",gap:8}}>{block.rows.map(([label,val],j)=><div key={j} style={{display:"flex",justifyContent:"space-between",gap:12,fontSize:14,fontFamily:F,color:"#334155"}}><span>{label}</span><strong>{cop(val)}</strong></div>)}</div></div>)}{r.limited&&<div style={{padding:14,borderRadius:12,background:"rgba(220,38,38,.06)",border:"1px solid rgba(220,38,38,.14)",fontSize:13,color:"#B91C1C",fontFamily:F}}>Se aplicó el límite del 40% del artículo 388 ET.</div>}<div style={{padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Base gravable</span><strong>{cop(r.base)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Base en UVT</span><strong>{r.baseUVT.toFixed(2)} UVT</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Rango aplicado</span><strong>{r.rangeLabel}</strong></div><div style={{fontSize:13,color:"rgba(255,255,255,.78)",lineHeight:1.7}}>Fórmula: {r.formula}</div><div style={{fontSize:13,color:"rgba(255,255,255,.78)"}}>Retención en pesos: {r.retUVT.toFixed(2)} UVT × {cop(r.uv)} = {cop(r.ret)}</div><div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,.15)"}}><span style={{fontSize:16}}>Retención estimada</span><strong style={{fontSize:22,color:"#60A5FA"}}>{cop(r.ret)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Tasa efectiva</span><strong>{r.tasa}%</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Neto después de retención</span><strong>{cop(r.neto)}</strong></div></div></div></div>}<ToolCTA text="Una retención mal calculada puede afectar su flujo de caja y generar diferencias tributarias innecesarias. Revísela con apoyo profesional antes de presentarla." msg="Hola CONTARAE, necesito ayuda para liquidar correctamente mi retención en la fuente y validar topes, deducciones y rentas exentas."/></div>)}

function ToolPlan(){
  const[yr,sYr]=useState(2025);const smlmv=laborYearConfig[yr].smlmv;const[d,sD]=useState({ing:"",arl:"1",pensionada:false});const[r,sR]=useState(null);
  const calc=()=>{const ing=pN(d.ing);if(ing<=0)return;const esPensionada=!!d.pensionada;const ibcRaw=Math.round(ing*.40);const ibc=Math.max(smlmv,Math.min(ibcRaw,25*smlmv));const salud=Math.round(ibc*.125);const pension=esPensionada?0:Math.round(ibc*.16);const solidaridad=esPensionada?0:Math.round(ibc*fspRate(ibc,smlmv));const arl=Math.round(ibc*riskRates[d.arl]);sR({ing,esPensionada,ibcRaw,ibc,salud,pension,solidaridad,arl,total:salud+pension+solidaridad+arl});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Planilla independientes / contratistas</h3><div style={{display:"flex",gap:8,marginBottom:14}}>{[2025,2026].map(y=><button type="button" key={y} onClick={()=>{sYr(y);sR(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:15,background:yr===y?"#2563EB":"#E6EEF8",color:yr===y?"#fff":"#1B3A5C"}}>{y}</button>)}</div><div style={{...NOTE_BOX,marginBottom:16}}>Vigencia {yr}. SMLMV: {cop(smlmv)} | IBC mínimo: {cop(smlmv)} | IBC máximo: {cop(25*smlmv)}. El fondo de solidaridad aplica desde 4 SMLMV cuando hay obligación de cotizar a pensión.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Ingresos u honorarios mensuales</label><input style={IS} value={d.ing} onChange={e=>sD(p=>({...p,ing:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><label style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}><input type="checkbox" checked={d.pensionada} onChange={e=>{sD(p=>({...p,pensionada:e.target.checked}));sR(null);}} style={{accentColor:"#2563EB",width:18,height:18,marginTop:2}}/><span>Soy pensionado <span style={{display:"block",fontSize:12,color:"#64748B",fontWeight:400,lineHeight:1.6,marginTop:3}}>No se calcula cotización a pensión ni fondo de solidaridad pensional.</span></span></label><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nivel de riesgo ARL</label><select style={{...IS,cursor:"pointer"}} value={d.arl} onChange={e=>sD(p=>({...p,arl:e.target.value}))}>{Object.keys(riskLabels).map(k=><option key={k} value={k}>{riskLabels[k]}</option>)}</select></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular planilla</button></div>{r&&<div style={{marginTop:18,display:"grid",gap:14}}><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Base de cotización</div><div style={{display:"grid",gap:8}}>{[["Ingresos",r.ing],["IBC teórico (40%)",r.ibcRaw],["IBC aplicado",r.ibc]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:14,fontFamily:F}}><span>{l}</span><strong>{cop(v)}</strong></div>)}</div></div><div style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>Aportes mensuales</div><div style={{display:"grid",gap:8}}>{[["Salud 12,5%",r.salud],[r.esPensionada?"Pensión (no aplica por pensionado)":"Pensión 16%",r.pension],[`ARL ${riskLabels[d.arl]}`,r.arl],[r.esPensionada?"Fondo de solidaridad (no aplica)":"Fondo de solidaridad",r.solidaridad],["Total a pagar",r.total]].map(([l,v],i)=><div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:14,fontFamily:F}}><span>{l}</span><strong>{cop(v)}</strong></div>)}</div></div></div>}<ToolCTA text="Pagar de más o de menos en su planilla puede generar reprocesos, intereses o requerimientos. Le ayudamos a liquidarla correctamente." msg="Hola CONTARAE, necesito apoyo con la liquidación de mi planilla como independiente."/></div>)
}
function ToolNom(){
  const[yr,sYr]=useState(2025);const cfg=laborYearConfig[yr];const[d,sD]=useState({sal:"",dias:"30",arl:"1",tipoEmp:"juridica",nEmp:"3",pensionada:false});const[r,sR]=useState(null);
  const calc=()=>{const s=pN(d.sal),dias=Math.min(30,Math.max(1,parseInt(d.dias)||30));if(s<=0)return;const esPensionada=!!d.pensionada;const salarioProp=Math.round(s*dias/30);const aux=s<=2*cfg.smlmv?Math.round(cfg.auxT*dias/30):0;const dev=salarioProp+aux;const dedSal=Math.round(salarioProp*.04),dedPen=esPensionada?0:Math.round(salarioProp*.04),fsp=esPensionada?0:Math.round(salarioProp*fspRate(s,cfg.smlmv));const neto=dev-(dedSal+dedPen+fsp);const numEmp=parseInt(d.nEmp)||0;const aplicaExon=(d.tipoEmp==='juridica' && s<10*cfg.smlmv) || (d.tipoEmp==='natural' && numEmp>=2 && s<10*cfg.smlmv);const empSal=aplicaExon?0:Math.round(salarioProp*.085),empPen=esPensionada?0:Math.round(salarioProp*.12),empArl=Math.round(salarioProp*riskRates[d.arl]);const sena=aplicaExon?0:Math.round(salarioProp*.02),icbf=aplicaExon?0:Math.round(salarioProp*.03),caja=Math.round(salarioProp*.04);const basePrest=salarioProp+aux,prima=Math.round(basePrest/12),ces=Math.round(basePrest/12),intCes=Math.round(ces*.12),vac=Math.round(salarioProp/24);sR({esPensionada,salarioProp,aux,dev,dedSal,dedPen,fsp,neto,empSal,empPen,empArl,sena,icbf,caja,prima,ces,intCes,vac,costoTotal:dev+empSal+empPen+empArl+sena+icbf+caja+prima+ces+intCes+vac,aplicaExon});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Liquidador de nómina</h3><div style={{display:"flex",gap:8,marginBottom:14}}>{[2025,2026].map(y=><button type="button" key={y} onClick={()=>{sYr(y);sR(null);}} style={{flex:1,padding:"12px 0",borderRadius:12,border:"none",cursor:"pointer",fontFamily:F,fontWeight:700,fontSize:15,background:yr===y?"#2563EB":"#E6EEF8",color:yr===y?"#fff":"#1B3A5C"}}>{y}</button>)}</div><div style={{...NOTE_BOX,marginBottom:16}}>Vigencia {yr}. SMLMV: {cop(cfg.smlmv)} | Auxilio de transporte: {cop(cfg.auxT)}. La exoneración de SENA, ICBF y salud se valida para trabajadores que devengan menos de 10 SMLMV; en persona natural empleadora aplica desde 2 trabajadores.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Salario mensual base</label><input style={IS} value={d.sal} onChange={e=>sD(p=>({...p,sal:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><label style={{display:"flex",alignItems:"flex-start",gap:8,fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}><input type="checkbox" checked={d.pensionada} onChange={e=>{sD(p=>({...p,pensionada:e.target.checked}));sR(null);}} style={{accentColor:"#2563EB",width:18,height:18,marginTop:2}}/><span>Trabajador pensionado <span style={{display:"block",fontSize:12,color:"#64748B",fontWeight:400,lineHeight:1.6,marginTop:3}}>No se calcula cotización a pensión ni fondo de solidaridad pensional.</span></span></label><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Días trabajados</label><input style={IS} value={d.dias} onChange={e=>sD(p=>({...p,dias:e.target.value.replace(/\D/g,"")}))} placeholder="30"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nivel de riesgo ARL</label><select style={{...IS,cursor:"pointer"}} value={d.arl} onChange={e=>sD(p=>({...p,arl:e.target.value}))}>{Object.keys(riskLabels).map(k=><option key={k} value={k}>{riskLabels[k]}</option>)}</select></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tipo de empleador</label><select style={{...IS,cursor:"pointer"}} value={d.tipoEmp} onChange={e=>sD(p=>({...p,tipoEmp:e.target.value}))}><option value="juridica">Sociedad o persona jurídica</option><option value="natural">Persona natural empleadora</option></select></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Número de trabajadores</label><input style={IS} value={d.nEmp} onChange={e=>sD(p=>({...p,nEmp:e.target.value.replace(/\D/g,"")}))} placeholder="3"/></div></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular nómina</button></div>{r&&<div style={{marginTop:18,display:"grid",gap:14}}>{[{t:"Devengado",rows:[["Salario proporcional",r.salarioProp],["Auxilio de transporte",r.aux],["Subtotal devengado",r.dev]]},{t:"Deducciones trabajador",rows:[["Salud 4%",r.dedSal],[r.esPensionada?"Pensión (no aplica por pensionado)":"Pensión 4%",r.dedPen],[r.esPensionada?"Fondo de solidaridad (no aplica)":"Fondo de solidaridad",r.fsp],["Neto a pagar",r.neto]]},{t:"Aportes empleador",rows:[["Salud 8,5%",r.empSal],[r.esPensionada?"Pensión empleador (no aplica)":"Pensión 12%",r.empPen],[`ARL ${riskLabels[d.arl]}`,r.empArl]]},{t:"Parafiscales",rows:[["SENA",r.sena],["ICBF",r.icbf],["Caja de compensación",r.caja],["Exoneración aplicada",r.aplicaExon?"Sí":"No"]]},{t:"Prestaciones sociales",rows:[["Prima",r.prima],["Cesantías",r.ces],["Intereses de cesantías",r.intCes],["Vacaciones",r.vac]]}].map((b,i)=><div key={i} style={BLOCK}><div style={{fontSize:13,fontWeight:700,color:"#2563EB",marginBottom:10,fontFamily:F}}>{b.t}</div><div style={{display:"grid",gap:8}}>{b.rows.map(([l,v],j)=><div key={j} style={{display:"flex",justifyContent:"space-between",fontSize:14,fontFamily:F}}><span>{l}</span><strong>{typeof v==='string'?v:cop(v)}</strong></div>)}</div></div>)}<div style={{padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff",display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Costo total empresa</span><strong style={{fontSize:22,color:"#60A5FA"}}>{cop(r.costoTotal)}</strong></div></div></div>}<ToolCTA text="Una nómina mal liquidada puede afectar costos, aportes y cumplimiento laboral. Reciba apoyo para hacerlo correctamente." msg="Hola CONTARAE, necesito apoyo con la liquidación de nómina y seguridad social."/></div>)
}
function ToolIVA(){
  const[d,sD]=useState({base:"",tar:"19",tipo:"gravado"});const[r,sR]=useState(null);
  const calc=()=>{const b=pN(d.base),effectiveTar=d.tipo==="gravado"?d.tar:"0",t=parseFloat(effectiveTar)/100,iva=Math.round(b*t);sR({b,iva,tot:b+iva,tar:effectiveTar,tipo:d.tipo});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Calculadora de IVA</h3><div style={{...NOTE_BOX,marginBottom:16}}>Herramienta informativa con tarifas de referencia 0%, 5% y 19%. Exento, excluido y no gravado no son equivalentes contablemente, aunque puedan arrojar IVA cero.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Base gravable</label><input style={IS} value={d.base} onChange={e=>sD(p=>({...p,base:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tratamiento</label><select style={{...IS,cursor:"pointer"}} value={d.tipo} onChange={e=>{sD(p=>({...p,tipo:e.target.value}));sR(null);}}><option value="gravado">Gravado</option><option value="exento">Exento</option><option value="excluido">Excluido</option><option value="no gravado">No gravado</option></select></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tarifa</label><select style={{...IS,cursor:d.tipo==="gravado"?"pointer":"not-allowed"}} value={d.tar} disabled={d.tipo!=="gravado"} onChange={e=>sD(p=>({...p,tar:e.target.value}))}><option value="0">0%</option><option value="5">5%</option><option value="19">19%</option></select></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Calcular IVA</button></div>{r&&<div style={{marginTop:18,padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff",display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Base</span><strong>{cop(r.b)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Tratamiento</span><strong>{r.tipo}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Tarifa aplicada</span><strong>{r.tar}%</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>IVA</span><strong style={{color:"#60A5FA"}}>{cop(r.iva)}</strong></div><div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,.15)"}}><span style={{fontSize:16}}>Total</span><strong style={{fontSize:22}}>{cop(r.tot)}</strong></div></div>}<ToolCTA text="Un IVA mal calculado afecta sus cobros, márgenes y cumplimiento. Reciba apoyo para facturar con mayor seguridad." msg="Hola CONTARAE, necesito apoyo para calcular correctamente el IVA de mis operaciones."/></div>)
}
function ToolPrIVA(){
  const[d,sD]=useState({total:"",tar:"19"});const[r,sR]=useState(null);
  const calc=()=>{const t=pN(d.total),tr=parseFloat(d.tar)/100,base=t>0?Math.round(t/(1+tr)):0,iva=t-base;sR({t,base,iva,tar:d.tar});};
  return(<div style={PANEL}><h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>Precio antes de IVA</h3><div style={{...NOTE_BOX,marginBottom:16}}>Desglosa un valor total para identificar la base antes de IVA y el IVA incluido. Tarifas disponibles: 0%, 5% y 19%.</div><div style={{display:"grid",gap:12}}><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Precio total (IVA incluido)</label><input style={IS} value={d.total} onChange={e=>sD(p=>({...p,total:fmtI(e.target.value)}))} placeholder="COP $ 0"/></div><div><label style={{fontSize:14,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Tarifa</label><select style={{...IS,cursor:"pointer"}} value={d.tar} onChange={e=>sD(p=>({...p,tar:e.target.value}))}><option value="0">0%</option><option value="5">5%</option><option value="19">19%</option></select></div><button type="button" onClick={calc} style={{padding:"13px 20px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Desglosar valor</button></div>{r&&<div style={{marginTop:18,padding:22,borderRadius:16,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff",display:"grid",gap:8,fontFamily:F}}><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Valor total</span><strong>{cop(r.t)}</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Tarifa</span><strong>{r.tar}%</strong></div><div style={{display:"flex",justifyContent:"space-between"}}><span style={{opacity:.7}}>Precio antes de IVA</span><strong>{cop(r.base)}</strong></div><div style={{display:"flex",justifyContent:"space-between",paddingTop:10,borderTop:"1px solid rgba(255,255,255,.15)"}}><span style={{fontSize:16}}>IVA incluido</span><strong style={{fontSize:22,color:"#60A5FA"}}>{cop(r.iva)}</strong></div></div>}<ToolCTA text="Desglosar mal un precio puede afectar su rentabilidad y sus cotizaciones. Le ayudamos a estructurar correctamente sus valores antes de IVA." msg="Hola CONTARAE, necesito apoyo para desglosar precios antes de IVA."/></div>)
}

const TLC=[
  {m:"Renta",c:"#2563EB",items:[
    "Grandes contribuyentes: pago 1a cuota en febrero, declaración y pago 2a cuota en abril, pago 3a cuota en junio.",
    "Personas jurídicas: declaración y pago 1a cuota en mayo y pago 2a cuota en julio.",
    "Personas naturales: declaración y pago entre el 12 de agosto y el 26 de octubre según los dos últimos dígitos del NIT."
  ]},
  {m:"IVA",c:"#0EA5E9",items:[
    "Bimestral: vencimientos en marzo, mayo, julio, septiembre, noviembre y enero de 2027.",
    "Cuatrimestral: vencimientos en mayo, septiembre y enero de 2027.",
    "Consulte el período aplicable según su responsabilidad y periodicidad registrada ante la DIAN."
  ]},
  {m:"Retefuente",c:"#1D4ED8",items:[
    "Declaración y pago mensual durante todo el año gravable 2026.",
    "Los vencimientos varían según el último dígito del NIT.",
    "Una presentación extemporánea puede generar sanciones e intereses."
  ]},
  {m:"Otros",c:"#3B82F6",items:[
    "También existen vencimientos para RST, impuesto al patrimonio, activos en el exterior y RUB.",
    "Las fechas exactas dependen del tipo de obligación y del último dígito del NIT cuando aplique.",
    "Si necesita confirmar su obligación o fecha exacta, solicite asesoría personalizada."
  ]}
];

function TlS(){
const getNitDates=(n)=>{if(n.length<1)return null;const d=parseInt(n);const rentaPN=[{r:"01-02",f:"12 ago"},{r:"03-04",f:"13 ago"},{r:"05-06",f:"14 ago"},{r:"07-08",f:"18 ago"},{r:"09-10",f:"19 ago"},{r:"11-12",f:"20 ago"},{r:"13-14",f:"21 ago"},{r:"15-16",f:"24 ago"},{r:"17-18",f:"25 ago"},{r:"19-20",f:"26 ago"},{r:"21-22",f:"27 ago"},{r:"23-24",f:"28 ago"},{r:"25-26",f:"31 ago"},{r:"27-28",f:"1 sep"},{r:"29-30",f:"2 sep"},{r:"31-32",f:"3 sep"},{r:"33-34",f:"4 sep"},{r:"35-36",f:"7 sep"},{r:"37-38",f:"8 sep"},{r:"39-40",f:"9 sep"},{r:"41-42",f:"10 sep"},{r:"43-44",f:"11 sep"},{r:"45-46",f:"14 sep"},{r:"47-48",f:"15 sep"},{r:"49-50",f:"16 sep"},{r:"51-52",f:"17 sep"},{r:"53-54",f:"18 sep"},{r:"55-56",f:"21 sep"},{r:"57-58",f:"22 sep"},{r:"59-60",f:"23 sep"},{r:"61-62",f:"24 sep"},{r:"63-64",f:"25 sep"},{r:"65-66",f:"28 sep"},{r:"67-68",f:"1 oct"},{r:"69-70",f:"2 oct"},{r:"71-72",f:"5 oct"},{r:"73-74",f:"6 oct"},{r:"75-76",f:"7 oct"},{r:"77-78",f:"8 oct"},{r:"79-80",f:"9 oct"},{r:"81-82",f:"13 oct"},{r:"83-84",f:"14 oct"},{r:"85-86",f:"15 oct"},{r:"87-88",f:"16 oct"},{r:"89-90",f:"19 oct"},{r:"91-92",f:"20 oct"},{r:"93-94",f:"21 oct"},{r:"95-96",f:"22 oct"},{r:"97-98",f:"23 oct"},{r:"99-00",f:"26 oct"}];
const match=rentaPN.find(r=>{const[a,b]=r.r.split("-");return d>=parseInt(a)&&d<=parseInt(b);});return match?match.f:null;};
return(<Sec id="calendario" title="Calendario tributario DIAN 2026" sub="OBLIGACIONES TRIBUTARIAS" bg={B[7]}><p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-18,marginBottom:16,fontFamily:F}}>Decreto 2229 de 2023. Fuente: www.dian.gov.co</p>
<div style={{maxWidth:760,margin:"0 auto 24px",...NOTE_BOX}}>Consulte aquí el resumen general de fechas tributarias 2026. La búsqueda específica de renta para personas naturales por los dos últimos dígitos del NIT se muestra ahora dentro de la herramienta ¿Debe declarar renta?, solo cuando el resultado indica que sí existe obligación.</div>
<div style={{display:"grid",gap:14,maxWidth:800,margin:"0 auto"}}>{TLC.map((t,i)=><div key={i} style={{display:"flex",gap:16,alignItems:"flex-start"}}><div style={{minWidth:76,textAlign:"center"}}><div style={{fontSize:17,fontWeight:700,color:t.c,fontFamily:FH}}>{t.m}</div><div style={{width:3,height:40,background:t.c,margin:"6px auto",borderRadius:4,opacity:.3}}/></div><Cd s={{flex:1,padding:18,borderRadius:16,background:"#fff",borderLeft:`4px solid ${t.c}`}}>{t.items.map((item,j)=><div key={j} style={{fontSize:14,color:"#3a5068",lineHeight:1.75,fontFamily:F,padding:"2px 0"}}>• {item}</div>)}</Cd></div>)}</div>
<p style={{textAlign:"center",marginTop:20,fontSize:13,color:"#5A6F8A",fontFamily:F}}>Fuente: Calendario Tributario DIAN 2026 — Decreto 2229 de 2023. <a href={wm("Hola CONTARAE, necesito conocer mis fechas tributarias específicas.")} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>Consulte sus fechas →</a></p></Sec>)}

/* ══════ ALERTS ══════ */
function AltS(){return(<Sec id="alertas" title="Alertas y novedades tributarias" sub="NOTICIAS" bg={B[0]}><div style={{display:"grid",gap:12,maxWidth:800,margin:"0 auto"}}>{[
  {tag:"Urgente",t:"Declaración de renta personas naturales 2026: del 12 de agosto al 26 de octubre",d:"Abril 2026",cl:"#DC2626",bg:"rgba(220,38,38,.07)"},
  {tag:"Importante",t:"Información exógena: grandes contribuyentes del 28 abril al 13 mayo 2026",d:"Abril 2026",cl:"#D97706",bg:"rgba(217,119,6,.07)"},
  {tag:"DIAN",t:"UVT 2026: $52.374 — Nuevos topes aplicables",d:"Marzo 2026",cl:"#2563EB",bg:"rgba(37,99,235,.07)"},
  {tag:"Normativo",t:"Reforma Laboral 2025 (Ley 2466): impacto en nómina y prestaciones",d:"Marzo 2026",cl:"#2563EB",bg:"rgba(37,99,235,.07)"},
  {tag:"DIAN",t:"Topes declarar renta año gravable 2025: UVT $49.799",d:"Febrero 2026",cl:"#2563EB",bg:"rgba(37,99,235,.07)"},
  {tag:"Informativo",t:"Renovación matrícula mercantil vencida 31 marzo. Gestione renovación extemporánea",d:"Abril 2026",cl:"#5A6F8A",bg:"rgba(90,111,138,.07)"}
].map((a,i)=><Cd key={i} s={{padding:"18px 22px",borderRadius:12,background:"#fff",display:"flex",gap:14,alignItems:"flex-start"}}><span style={{fontSize:11,fontWeight:700,color:a.cl,background:a.bg,padding:"4px 10px",borderRadius:100,fontFamily:F,whiteSpace:"nowrap"}}>{a.tag}</span><div style={{flex:1}}><h4 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",lineHeight:1.55,fontFamily:F}}>{a.t}</h4><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:6}}><span style={{fontSize:12,color:"#7A8FA8",fontFamily:F}}>{a.d}</span><a href={wm(`Hola CONTARAE, necesito ayuda con: ${a.t}`)} target="_blank" rel="noopener noreferrer" style={{fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Necesito ayuda →</a></div></div></Cd>)}</div></Sec>)}

/* ══════ ABOUT ══════ */
function Abt(){return(<Sec id="nosotros" title="Conozca a CONTARAE" sub="NOSOTROS" bg={B[1]} narrow>
<div style={{padding:28,borderRadius:15,background:"#fff",border:"1px solid rgba(37,99,235,.12)",marginBottom:18}}><h3 style={{fontSize:18,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F}}>¿Quiénes somos?</h3><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.85,fontFamily:F}}>CONTARAE es una firma de servicios contables, tributarios y financieros fundada con el propósito de brindar soluciones profesionales y accesibles a microempresas, emprendedores, pymes y personas naturales en Colombia. Contamos con Contadores Públicos certificados con tarjeta profesional vigente y amplia experiencia en diversos sectores.</p><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.85,fontFamily:F,marginTop:12}}>Nos especializamos en outsourcing contable, asesoría tributaria, gestión financiera y certificaciones contables. Cada cliente recibe un servicio personalizado, cercano y confidencial.</p></div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(130px,1fr))",gap:14,marginBottom:18}}>{[["100+","Clientes atendidos"],["500+","Certificaciones emitidas"],["5+","Años de experiencia"],["100%","Compromiso profesional"]].map(([n,l],i)=><div key={i} style={{textAlign:"center",padding:18,borderRadius:12,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)"}}><div style={{fontSize:26,fontWeight:700,color:"#60A5FA",fontFamily:FH}}>{n}</div><div style={{fontSize:12,color:"rgba(255,255,255,.65)",fontFamily:F,marginTop:4}}>{l}</div></div>)}</div>
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:16,marginBottom:18}}><div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Misión</h3><p style={{fontSize:14,lineHeight:1.8,opacity:.9,fontFamily:F}}>Brindar servicios contables de alta calidad con responsabilidad y transparencia, contribuyendo al crecimiento sostenible de nuestros clientes mediante soluciones integrales y personalizadas.</p></div><div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff"}}><h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Visión</h3><p style={{fontSize:14,lineHeight:1.8,opacity:.9,fontFamily:F}}>Ser firma líder en servicios contables y financieros en Colombia, por innovación, profesionalismo y la confianza que generamos como aliado estratégico de largo plazo.</p></div></div>
<div style={{padding:24,borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.12)",marginBottom:18}}><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:12,fontFamily:F}}>Valores</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>{[["Transparencia","Comunicación clara y veraz en cada interacción."],["Responsabilidad","Cumplimiento oportuno de cada compromiso."],["Confidencialidad","Protección absoluta de su información."],["Excelencia","Calidad y rigor técnico en cada servicio."],["Compromiso","Su éxito financiero es nuestra prioridad."],["Ética","Integridad y apego a la normatividad."]].map(([v,d],i)=><div key={i} style={{padding:"12px 14px",borderRadius:9,background:"rgba(37,99,235,.04)"}}><div style={{fontSize:14,fontWeight:700,color:"#1B3A5C",fontFamily:F}}>✦ {v}</div><div style={{fontSize:13,color:"#5A6F8A",marginTop:3,fontFamily:F}}>{d}</div></div>)}</div></div>
<div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Nuestro Compromiso</h3><p style={{fontSize:15,lineHeight:1.85,opacity:.9,fontFamily:F}}>En CONTARAE entendemos que detrás de cada número hay un esfuerzo, un proyecto de vida y una familia. Por eso tratamos cada caso con la misma dedicación como si fuera el nuestro. Su tranquilidad financiera es nuestra prioridad.</p><a href={wm("Hola CONTARAE, me gustaría conocer más sobre sus servicios.")} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:14,padding:"10px 22px",borderRadius:10,background:"#60A5FA",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",fontFamily:F}}>Conózcanos más →</a></div></Sec>)}

/* ══════ BLOG ══════ */
const BLG=[{title:"Declaración de renta PN 2026",tag:"Tributario",date:"Abr 2026",ex:"Conozca topes, plazos, soportes y sanciones para cumplir con su declaración del año gravable 2025 sin contratiempos.",content:"La declaración de renta de personas naturales en 2026 exige revisar topes de ingresos, patrimonio, compras, consumos y movimientos bancarios. Además de conocer las fechas oficiales, conviene preparar con tiempo certificados de ingresos, extractos, soportes de inversiones, deudas y deducciones. Una revisión previa evita sanciones por extemporaneidad, omisión o inexactitud y le permite planear mejor su flujo de caja antes de presentar y pagar ante la DIAN."},{title:"Renovación matrícula mercantil",tag:"Empresarial",date:"Mar 2026",ex:"Revise requisitos, plazo máximo, costos y consecuencias de no renovar oportunamente su registro mercantil.",content:"La renovación de matrícula mercantil debe gestionarse cada año dentro del plazo legal. No hacerlo puede generar sanciones, afectar la reputación comercial de la empresa y complicar trámites bancarios, contractuales y societarios. Tener actualizada la información en Cámara de Comercio también facilita la formalización del negocio y la participación en procesos de contratación o validación ante terceros."},{title:"Certificación de ingresos",tag:"Certificaciones",date:"Mar 2026",ex:"Le explicamos qué soportes se necesitan, cómo se determina la tarifa y en qué casos la solicitan bancos, inmobiliarias o embajadas.",content:"La certificación de ingresos debe elaborarse con soportes suficientes y coherentes con la realidad económica del solicitante. Dependiendo del tipo de ingreso, pueden requerirse desprendibles de nómina, facturas, contratos, extractos, certificados de inversiones o documentos de arriendo. Una certificación bien preparada brinda confianza al tercero que la recibe y reduce devoluciones o requerimientos adicionales."},{title:"Facturación electrónica",tag:"Tributario",date:"Feb 2026",ex:"Obligaciones, requisitos técnicos y puntos clave para implementar o actualizar su facturación electrónica correctamente.",content:"La facturación electrónica no es solo un requisito formal: impacta el control del ingreso, la trazabilidad de la operación y el cumplimiento ante la DIAN. Es importante validar numeración, habilitación, proveedor tecnológico, certificado digital y consistencia entre facturas, notas crédito y reportes contables. Una implementación adecuada evita rechazos, errores de transmisión y diferencias tributarias posteriores."},{title:"5 errores contabilidad pymes",tag:"Contable",date:"Ene 2026",ex:"Errores frecuentes en pequeñas empresas y recomendaciones prácticas para evitarlos desde la operación diaria.",content:"Entre los errores más comunes están mezclar finanzas personales con las del negocio, no conciliar bancos, no conservar soportes, no revisar impuestos periódicamente y no interpretar indicadores financieros. Corregir estos puntos mejora la visibilidad del negocio, permite tomar mejores decisiones y disminuye riesgos tributarios y contables con el paso del tiempo."},{title:"Información exógena DIAN",tag:"Tributario",date:"Ene 2026",ex:"Qué es, quiénes deben presentarla, qué información reporta y por qué conviene prepararla con anticipación.",content:"La información exógena o medios magnéticos exige consolidar operaciones con terceros, pagos, retenciones, ingresos y otros movimientos reportables. Prepararla con anticipación ayuda a depurar bases, corregir inconsistencias y evitar sanciones derivadas de errores, omisiones o reportes tardíos. Es una obligación sensible porque cruza información relevante con otras declaraciones y reportes frente a la DIAN."}];
function BlgS(){const[exp,sE]=useState(null);return(<Sec id="blog" title="Artículos y guías" sub="BLOG" bg={B[2]}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>{BLG.map((p,i)=><Cd key={i} s={{borderRadius:16,overflow:"hidden",padding:0,background:"#fff"}}><div style={{padding:22}}><div style={{display:"flex",gap:6,marginBottom:8}}><span style={{fontSize:10,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.06)",padding:"3px 9px",borderRadius:100,fontFamily:F}}>{p.tag}</span><span style={{fontSize:10,color:"#7A8FA8",fontFamily:F}}>{p.date}</span></div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:6,lineHeight:1.45,fontFamily:F}}>{p.title}</h3><p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{p.ex}</p><button onClick={()=>sE(exp===i?null:i)} style={{marginTop:10,fontSize:13,color:"#2563EB",fontWeight:600,fontFamily:F,background:"none",border:"none",cursor:"pointer",padding:0}}>{exp===i?"Cerrar ✕":"Leer más →"}</button></div>{exp===i&&<div style={{padding:"0 22px 22px",borderTop:"1px solid rgba(37,99,235,.05)"}}><div style={{paddingTop:14,fontSize:14,color:"#3a5068",lineHeight:1.9,fontFamily:F,whiteSpace:"pre-line"}}>{p.content}</div><div style={{marginTop:14,padding:12,borderRadius:8,background:"rgba(37,99,235,.04)"}}><a href={wm(`Hola CONTARAE, necesito ayuda con: ${p.title}`)} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Consultar por WhatsApp →</a></div></div>}</Cd>)}</div></Sec>)}

/* ══════ DOWNLOADS ══════ */
const DL=[{n:"Checklist declaración renta PN",d:"Documentos para declarar renta 2025.",f:"PDF"},{n:"Calendario tributario DIAN 2026",d:"Fechas de todas las obligaciones.",f:"PDF"},{n:"Control ingresos y gastos",d:"Plantilla mensual para independientes.",f:"Excel"},{n:"Conciliación retenciones",d:"Cruce retenciones vs formulario 220.",f:"Excel"},{n:"Control facturación mensual",d:"Facturas con cálculo automático de IVA.",f:"Excel"},{n:"Conciliación bancaria",d:"Compare extracto vs registros contables.",f:"Excel"},{n:"Inventario activos fijos",d:"Activos con depreciación y valor en libros.",f:"Excel"},{n:"Estados financieros pymes",d:"Balance y estado de resultados NIIF.",f:"Excel"},{n:"Liquidación prestaciones",d:"Prima, cesantías, intereses y vacaciones.",f:"Excel"},{n:"Control nómina mensual",d:"Nómina con deducciones y aportes.",f:"Excel"},{n:"Modelo certificación laboral",d:"Formato listo para diligenciar.",f:"Word"},{n:"Guía soportes certificación",d:"Documentos según tipo de ingreso.",f:"PDF"},{n:"Autorización datos personales",d:"Formato Ley 1581/2012.",f:"PDF"},{n:"Solicitud certificación contable",d:"Modelo de solicitud formal.",f:"Word"},{n:"Checklist creación empresa",d:"Requisitos para SAS, LTDA o S.A.",f:"PDF"},{n:"Modelo acta constitución SAS",d:"Acta y estatutos para SAS.",f:"Word"}];
function DwS(){return(<Sec id="descargas" title="Formatos y guías" sub="RECURSOS" bg={B[3]} narrow><div style={{display:"grid",gap:10}}>{DL.map((d,i)=><Cd key={i} s={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderRadius:11,background:"#fff",gap:12,flexWrap:"wrap"}}><div style={{flex:1,minWidth:200}}><h4 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>{d.n}</h4><p style={{fontSize:13,color:"#5A6F8A",marginTop:2,fontFamily:F}}>{d.d}</p></div><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:10,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.07)",padding:"2px 8px",borderRadius:100,fontFamily:F}}>{d.f}</span><a href={wm(`Hola, solicito: ${d.n}`)} target="_blank" rel="noopener noreferrer" style={{padding:"7px 14px",borderRadius:7,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar</a></div></Cd>)}</div></Sec>)}

/* ══════ FAQ ══════ */
const FQ=[{q:"¿Cuánto cuesta la certificación de ingresos?",a:"La tarifa depende del rango de ingresos acreditados y del nivel de soporte requerido. Siempre informamos el valor antes del pago, para que el cliente sepa exactamente qué incluye el servicio y en qué plazo se entrega el documento firmado por contador público."},{q:"¿Cuánto tarda la entrega del certificado?",a:"Con documentación completa y pago confirmado, normalmente se entrega en pocas horas. Si la información requiere validaciones adicionales o documentos complementarios, el tiempo puede extenderse, pero siempre le informamos el estado del proceso."},{q:"¿Qué soportes necesito para la certificación?",a:"Depende del tipo de ingreso. Para ingresos laborales suelen usarse desprendibles o certificados; para independientes, facturas, contratos, extractos y reportes; para arriendos o inversiones, los soportes que evidencien el flujo real. Lo ideal es que cada ingreso quede respaldado de forma clara y verificable."},{q:"¿La certificación tiene vigencia?",a:"Sí. Aunque no existe una vigencia única para todos los casos, usualmente las entidades receptoras aceptan documentos recientes, por lo que recomendamos usarla dentro de los 30 a 60 días posteriores a su expedición, salvo que la entidad indique algo distinto."},{q:"¿Puedo solicitar si soy independiente?",a:"Sí. La certificación aplica para trabajadores independientes, contratistas, freelancers, comerciantes, rentistas y otras personas naturales con ingresos demostrables. Lo importante es contar con soportes suficientes y coherentes con el monto que se certificará."},{q:"¿Qué pasa si mis soportes están incompletos?",a:"Podemos orientarle sobre qué documentos faltan y qué alternativas existen para complementar la solicitud. No siempre se requiere detener el proceso de inmediato, pero sí es necesario completar los soportes antes de emitir una certificación responsable y sustentada."},{q:"¿Cómo sé si debo declarar renta?",a:"En la sección de herramientas puede revisar los topes principales de forma orientativa. Sin embargo, la obligación real depende también de su condición tributaria, de la naturaleza de sus ingresos y de otros criterios normativos, por lo que una revisión profesional siempre es recomendable."},{q:"¿Qué documentos necesito para declarar renta?",a:"Usualmente se revisan certificados laborales, extractos bancarios, certificados de inversiones, deudas, bienes, aportes, pagos a salud y pensión, soportes de deducciones y cualquier documento que afecte su patrimonio o su renta. Tenerlos organizados reduce errores y agiliza el proceso."},{q:"¿Qué pasa si no declaro a tiempo?",a:"Puede generarse sanción por extemporaneidad y, según el caso, intereses o sanciones mínimas. Además del costo económico, presentar tarde suele traer más presión operativa y riesgo de omisiones, por lo que conviene programar la declaración con anticipación."},{q:"¿Puedo corregir mi declaración?",a:"Sí, en muchos casos es posible corregirla dentro de los términos legales. La conveniencia y el costo de la corrección dependen del tipo de error, del momento en que se detecta y del efecto sobre el impuesto a cargo o el saldo declarado."},{q:"¿Cómo funciona el plan mensual?",a:"Primero revisamos el tamaño y necesidad de su negocio, y luego proponemos un plan acorde al volumen de operaciones y obligaciones. El objetivo es acompañarlo de forma permanente para que su contabilidad y sus impuestos no dependan de acciones improvisadas."},{q:"¿Puedo contratar un servicio puntual?",a:"Sí. Puede contratar certificaciones, declaraciones, matrícula mercantil, facturación electrónica, información exógena u otros apoyos específicos sin necesidad de tomar un plan mensual. Así recibe exactamente el servicio que necesita en ese momento."},{q:"¿Qué incluye el outsourcing contable?",a:"Incluye registro contable, conciliaciones, revisión de soportes, estados financieros, orientación en impuestos y acompañamiento sobre cumplimiento. El alcance final puede variar según el plan y el tipo de empresa, pero siempre busca dar control y claridad sobre la información financiera."},{q:"¿Cuánto tarda renovar matrícula?",a:"Con información completa, el trámite puede resolverse en un plazo corto, pero el tiempo exacto depende de la entidad y del estado documental. Lo recomendable es no esperar al último momento, porque los vencimientos suelen concentrar más solicitudes."},{q:"¿Qué necesito para crear empresa?",a:"Se requiere definir el tipo societario, revisar el nombre, preparar los datos de socios o accionistas, actividad económica, capital y demás elementos básicos para formalizar el negocio ante Cámara de Comercio y DIAN. Una buena planeación evita reprocesos posteriores."},{q:"¿Me ayudan con facturación electrónica?",a:"Sí. Podemos acompañarle en habilitación, numeración, revisión del proveedor tecnológico y aspectos operativos para que su proceso de facturación sea consistente con la normatividad y con su operación contable."},{q:"¿Qué medios de pago aceptan?",a:"Aceptamos medios digitales como Wompi, incluyendo opciones como tarjeta, PSE y otros canales habilitados. También podemos informarle las alternativas disponibles al momento de contratar un servicio específico."},{q:"¿Cómo envío mis documentos?",a:"Puede enviarlos por el formulario cuando aplique o por WhatsApp, según el tipo de servicio. Siempre es importante que los archivos sean legibles, completos y correspondan exactamente a la información que se desea certificar o liquidar."},{q:"¿Mis datos están seguros?",a:"Sí. La información se trata bajo criterios de confidencialidad y protección de datos. Además, procuramos que cada trámite use solo la información necesaria y que el cliente tenga claridad sobre su uso y finalidad."},{q:"¿Qué es la información exógena?",a:"Es un reporte de operaciones con terceros y otros datos tributarios que ciertas personas o empresas deben presentar ante la DIAN. Su preparación exige depurar bases y revisar coherencia con declaraciones, retenciones y soportes contables para evitar inconsistencias."}];
function FaqS(){const[o,sO]=useState(null);return(<Sec id="faq" title="Preguntas frecuentes" sub="DUDAS" bg={B[4]} narrow><div style={{display:"grid",gap:9}}>{FQ.map((f,i)=><Cd key={i} s={{borderRadius:11,background:"#fff",overflow:"hidden",cursor:"pointer",padding:0}} onClick={()=>sO(o===i?null:i)}><div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:15,fontWeight:600,color:"#0B1D3A",fontFamily:F,flex:1}}>{f.q}</span><span style={{fontSize:17,color:"#2563EB",transform:o===i?"rotate(45deg)":"rotate(0)",transition:"transform .3s",marginLeft:10}}>+</span></div>{o===i&&<div style={{padding:"0 20px 14px",fontSize:14,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>{f.a}</div>}</Cd>)}</div></Sec>)}

/* ══════ PRIVACY ══════ */
const PV=[{t:"1. Responsable",c:`CONTARAE. Bogotá D.C. ${EM}. +57 300 143 2008.`},{t:"2. Marco",c:"Constitución (art. 15), Ley 1581/2012, Decreto 1074/2015."},{t:"3. Definiciones",c:"Dato personal, sensible, titular, responsable, encargado, tratamiento, autorización (art. 3)."},{t:"4. Principios",c:"Legalidad, finalidad, libertad, veracidad, transparencia, acceso restringido, seguridad, confidencialidad."},{t:"5. Datos",c:"Identificación, contacto, financieros/tributarios, laborales."},{t:"6. Finalidades",c:"Servicios contables, certificaciones, DIAN, nómina, comunicación, facturación, consultas."},{t:"7. Derechos",c:"Conocer, actualizar, rectificar, prueba de autorización, quejas SIC, revocar, acceso gratuito (art. 8)."},{t:"8. Autorización",c:"Previa, expresa e informada. Conservada conforme art. 9."},{t:"9. Sensibles",c:"No se recopilan sistemáticamente (arts. 5 y 6)."},{t:"10. Menores",c:"No se tratan salvo representante legal (art. 7)."},{t:"11. Deberes",c:"Habeas data, conservar autorización, informar, veracidad, seguridad (art. 17)."},{t:"12. Seguridad",c:"Técnicas, humanas y administrativas."},{t:"13. Transferencia",c:"Solo legal o autorización expresa. Internacional art. 26."},{t:"14. Consultas",c:`10 días hábiles (prorrogable 5). Reclamos 15 (prorrogable 8). ${EM}.`},{t:"15. Canales",c:`${EM}. +57 300 143 2008. Bogotá. Lun-Vie 8am-6pm.`},{t:"16. Vigencia",c:"Desde publicación. Modificaciones en el sitio web."},{t:"17. Autoridad",c:"SIC. www.sic.gov.co. 01 8000 910 165."}];
function Prv(){const[s,sS]=useState(false);return(<div style={{maxWidth:900,margin:"0 auto",padding:"0 24px"}}><div style={{textAlign:"center",marginBottom:16}}><button onClick={()=>sS(!s)} style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>{s?"Ocultar":"Consultar"} Política de Datos</button></div>{s&&<div style={{padding:24,borderRadius:13,background:"rgba(255,255,255,.05)",border:"1px solid rgba(96,165,250,.1)",marginBottom:18}}><h3 style={{fontFamily:FH,fontSize:17,fontWeight:700,color:"#fff",marginBottom:16,textAlign:"center"}}>Política de Tratamiento de Datos Personales</h3>{PV.map((p,i)=><div key={i} style={{marginBottom:12}}><h4 style={{fontSize:13,fontWeight:700,color:"#60A5FA",marginBottom:3,fontFamily:F}}>{p.t}</h4><p style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.8,fontFamily:F}}>{p.c}</p></div>)}</div>}</div>)}

/* ══════ FOOTER ══════ */
function Ftr(){return(<><section id="contacto" style={{padding:"88px 24px",background:B[7]}}><div style={{maxWidth:880,margin:"0 auto",textAlign:"center",padding:"56px 36px",borderRadius:24,background:"linear-gradient(135deg,#0B1D3A,#17345D 55%,#1B3A5C)",position:"relative",overflow:"hidden",boxShadow:"0 24px 60px rgba(15,23,42,.18)",border:"1px solid rgba(125,211,252,.12)"}}><div style={{position:"absolute",inset:0,background:"radial-gradient(circle at 20% 20%, rgba(56,189,248,.12), transparent 32%), radial-gradient(circle at 80% 22%, rgba(59,130,246,.10), transparent 28%)"}}/><h2 style={{position:"relative",fontFamily:FH,fontSize:"clamp(23px,3.7vw,34px)",fontWeight:700,color:"#fff",marginBottom:14}}>¿Listo para ordenar sus finanzas?</h2><p style={{position:"relative",fontSize:15,color:"rgba(255,255,255,.70)",margin:"0 auto 28px",fontFamily:F,maxWidth:600,lineHeight:1.8}}>Contadores Públicos certificados en Bogotá a su servicio, con una experiencia clara, cercana y profesional en cada paso.</p><div style={{position:"relative",display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:22}}><a href={wm("Hola CONTARAE, quiero recibir asesoría contable.")} target="_blank" rel="noopener noreferrer" style={{padding:"13px 28px",borderRadius:14,background:"#25D366",color:"#fff",fontSize:15,fontWeight:700,textDecoration:"none",fontFamily:F,boxShadow:"0 12px 24px rgba(37,211,102,.18)"}}>WhatsApp</a><a href={`mailto:${EM}`} style={{padding:"13px 28px",borderRadius:14,background:"rgba(255,255,255,.1)",color:"#fff",fontSize:15,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,.16)",fontFamily:F,backdropFilter:"blur(8px)"}}>Correo</a></div><LeadCaptureForm/></div></section>
<footer style={{padding:"44px 24px 32px",background:"#080E1B"}}><LogoFt/><div style={{maxWidth:720,margin:"0 auto",textAlign:"center"}}><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:12,marginBottom:20}}><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>📱 <strong style={{color:"#fff"}}>WhatsApp:</strong> +57 300 143 2008</div><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>✉️ <strong style={{color:"#fff"}}>Correo:</strong> {EM}</div><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>📍 <strong style={{color:"#fff"}}>Ubicación:</strong> Bogotá D.C.</div><div style={{fontSize:14,color:"rgba(255,255,255,.6)",fontFamily:F}}>🕐 <strong style={{color:"#fff"}}>Horario:</strong> Lun-Vie 8am-6pm</div></div><div style={{display:"flex",justifyContent:"center",gap:10,flexWrap:"wrap",marginBottom:20}}>{SOCIAL_LINKS.map(([label,url])=><a key={label} href={url} target="_blank" rel="noopener noreferrer" style={{fontSize:13,color:"#BFDBFE",fontFamily:F,textDecoration:"none",padding:"9px 13px",borderRadius:999,border:"1px solid rgba(96,165,250,.16)",background:"rgba(255,255,255,.04)"}}>{label}</a>)}</div><Prv/><div style={{display:"flex",justifyContent:"center",marginBottom:14}}><a href={ADMIN_ROUTE} style={{fontSize:12,color:"rgba(255,255,255,.45)",fontFamily:F,textDecoration:"none",padding:"9px 14px",borderRadius:999,border:"1px solid rgba(96,165,250,.14)",background:"rgba(255,255,255,.03)",transition:"all .2s ease"}} onMouseEnter={e=>{e.currentTarget.style.color="#BFDBFE";e.currentTarget.style.borderColor="rgba(96,165,250,.3)";e.currentTarget.style.background="rgba(37,99,235,.09)";}} onMouseLeave={e=>{e.currentTarget.style.color="rgba(255,255,255,.45)";e.currentTarget.style.borderColor="rgba(96,165,250,.14)";e.currentTarget.style.background="rgba(255,255,255,.03)";}}>Panel de funcionarios</a></div><div style={{borderTop:"1px solid rgba(96,165,250,.1)",paddingTop:18,marginTop:12}}><p style={{fontSize:11,color:"rgba(255,255,255,.35)",fontFamily:F}}>© 2026 CONTARAE · Bogotá D.C., Colombia · Todos los derechos reservados</p><p style={{fontSize:11,color:"rgba(255,255,255,.3)",marginTop:4,fontFamily:F}}>Ley 1581 de 2012 — Protección de Datos Personales</p></div></div></footer></>)}

/* ══════ FLOATS ══════ */
function Flt(){const[s,sS]=useState(false);useEffect(()=>{const h=()=>sS(window.scrollY>400);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
return(<><a className={`floating-whatsapp ${s?"floating-whatsapp-visible":""}`} href={wm("Hola CONTARAE, me gustaría recibir asesoría.")} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:28,right:28,zIndex:1000,width:52,height:52,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 16px rgba(37,211,102,.4)",textDecoration:"none",fontSize:24,opacity:.85,transition:"opacity .2s, transform .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".85"} aria-label="WhatsApp">💬</a>
{s&&<button className="floating-to-top" onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:88,right:32,zIndex:1000,width:40,height:40,borderRadius:"50%",background:"rgba(11,29,58,.8)",border:"1px solid rgba(96,165,250,.25)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",color:"#60A5FA",boxShadow:"0 3px 12px rgba(0,0,0,.15)",fontSize:16,fontWeight:700,opacity:.85,transition:"opacity .2s, transform .2s"}} onMouseEnter={e=>e.currentTarget.style.opacity="1"} onMouseLeave={e=>e.currentTarget.style.opacity=".85"} aria-label="Subir">⇧</button>}</>)}

/* ══════ APP ══════ */
export default function App(){
  const[path,sPath]=useState(getCurrentPath());
  const certRoute=isCertificationPath(path);
  const adminRoute=isAdminPath(path);
  const verifyRoute=isVerifyPath(path);
  const paymentRoute=isPaymentPath(path);
  const paymentsPortalRoute=isPaymentsPortalPath(path);
  const clientPortalRoute=isClientPortalPath(path);
  const toolConfig=getToolRouteConfig(path);
  const toolRoute=!!toolConfig;
  const certSupportConfig=getCertificationSupportRouteConfig(path);
  const certSupportRoute=!!certSupportConfig;
  const serviceSeoConfig=getServiceSeoRouteConfig(path);
  const serviceSeoRoute=!!serviceSeoConfig;

  useEffect(()=>{captureMarketingAttribution();const timer=window.setTimeout(captureMarketingAttribution,1800);return()=>window.clearTimeout(timer);},[path]);
  useEffect(()=>{const sync=()=>sPath(getCurrentPath());window.addEventListener("popstate",sync);window.addEventListener("hashchange",sync);return()=>{window.removeEventListener("popstate",sync);window.removeEventListener("hashchange",sync);};},[]);
  useEffect(()=>{if(adminRoute||verifyRoute||paymentRoute||paymentsPortalRoute||clientPortalRoute)return undefined;const obs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="translateY(0)";}});},{threshold:.06});setTimeout(()=>{document.querySelectorAll(".ai").forEach(el=>{el.style.opacity="0";el.style.transform="translateY(18px)";el.style.transition="opacity .72s ease,transform .72s cubic-bezier(.22,1,.36,1)";obs.observe(el);});},100);return()=>obs.disconnect();},[path,adminRoute,verifyRoute,paymentRoute,paymentsPortalRoute,clientPortalRoute]);
  useEffect(()=>{if(adminRoute||verifyRoute||paymentRoute||paymentsPortalRoute||clientPortalRoute)return undefined;const go=e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const href=a.getAttribute("href");if(!href||href==="#")return;const id=href.slice(1);if(!scrollToId(id))return;e.preventDefault();if(window.history?.replaceState)window.history.replaceState(null,"",`${window.location.pathname}${window.location.search}#${id}`);};document.addEventListener("click",go);return()=>document.removeEventListener("click",go);},[adminRoute,verifyRoute,paymentRoute,paymentsPortalRoute,clientPortalRoute]);
  useEffect(()=>{const trackWhatsapp=e=>{const target=e.target instanceof Element?e.target:null;const a=target?.closest('a[href*="wa.me/"],a[href*="whatsapp.com/"]');if(!a)return;trackMarketingEvent("whatsapp_click",{link_url:a.href,link_text:(a.textContent||"").trim().slice(0,80)});};document.addEventListener("click",trackWhatsapp);return()=>document.removeEventListener("click",trackWhatsapp);},[]);
  useEffect(()=>{if(adminRoute||verifyRoute||paymentRoute||paymentsPortalRoute||clientPortalRoute)return undefined;const id=window.location.hash?.slice(1);if(!id)return undefined;const timer=window.setTimeout(()=>{scrollToId(id,"auto");},120);return()=>window.clearTimeout(timer);},[path,adminRoute,verifyRoute,paymentRoute,paymentsPortalRoute,clientPortalRoute]);
  useEffect(()=>{
    const meta=getClientSeoMeta({path,adminRoute,verifyRoute,paymentRoute,paymentsPortalRoute,clientPortalRoute,toolRoute,toolConfig,certRoute,certSupportConfig,serviceSeoConfig});
    syncSeoTags(meta,path,toolConfig,certSupportConfig,serviceSeoConfig);
  },[path,certRoute,certSupportRoute,certSupportConfig,toolRoute,toolConfig,serviceSeoRoute,serviceSeoConfig,adminRoute,verifyRoute,paymentRoute,paymentsPortalRoute,clientPortalRoute]);

  return(<div style={{fontFamily:F,color:"#0B1D3A",background:"#f8fafd",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;scroll-padding-top:156px;}body{background:#f6fafe;color:#0B1D3A;}::selection{background:#2563EB;color:#fff;}a{color:inherit;}h1,h2,h3,h4{letter-spacing:-.02em;}p{font-family:${F};}section{position:relative;}@keyframes cardGlowFlow{0%{background-position:0% 50%}100%{background-position:220% 50%}} .card-glow-shell:hover .card-glow-ring{opacity:1!important;}.cert-pricing-mini-card .cert-price-tier-list{grid-template-columns:repeat(2,minmax(0,1fr));column-gap:28px;}.cert-support-guide-grid{grid-template-columns:repeat(6,minmax(0,1fr))!important;align-items:stretch;}.cert-support-guide-card{grid-column:span 2;min-height:100%;}.cert-support-guide-card:nth-child(4){grid-column:2 / span 2;}.cert-support-guide-card:nth-child(5){grid-column:4 / span 2;} @media(max-width:1024px){.tool-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;}.cert-hero-grid{grid-template-columns:1fr!important;}.cert-pricing-mini-card .cert-price-tier-list{grid-template-columns:repeat(2,minmax(0,1fr));}.cert-support-guide-grid{grid-template-columns:repeat(4,minmax(0,1fr))!important;}.cert-support-guide-card,.cert-support-guide-card:nth-child(4){grid-column:span 2!important;}.cert-support-guide-card:nth-child(5){grid-column:2 / span 2!important;}}@media(max-width:768px){.dk{display:none!important;}.hm{display:block!important;}.tool-grid{grid-template-columns:1fr!important;}.cert-support-guide-grid{grid-template-columns:1fr!important;}.cert-support-guide-card,.cert-support-guide-card:nth-child(4),.cert-support-guide-card:nth-child(5){grid-column:auto!important;}.lead-form-grid,.renta-lead-grid{grid-template-columns:1fr!important;}section{padding-left:18px!important;padding-right:18px!important;}.cert-pricing-mini-card .cert-price-tier-list{grid-template-columns:1fr!important;}.app-cert-banner{top:88px!important;width:min(520px,calc(100% - 28px))!important;}.app-cert-banner-inner{padding:8px 12px!important;border-radius:16px!important;}.cert-hero-wrap{max-width:100%!important;}.cert-hero-grid{grid-template-columns:1fr!important;gap:16px!important;}.cert-hero-copy,.cert-hero-side{padding:20px 18px!important;border-radius:22px!important;}.cert-hero-actions{flex-direction:column!important;align-items:stretch!important;}.cert-proof-row{display:grid!important;grid-template-columns:1fr 1fr!important;gap:10px!important;}.cert-metrics-grid,.cert-price-grid,.cert-process-grid,.cert-recipient-grid{grid-template-columns:1fr!important;}.cert-form-overlay{padding:8px!important;align-items:flex-start!important;overflow-y:auto!important;}.cert-form-dialog{width:100%!important;max-height:none!important;min-height:calc(100vh - 16px)!important;padding:18px!important;border-radius:18px!important;}.cert-form-steps{justify-content:flex-start!important;overflow-x:auto!important;flex-wrap:nowrap!important;padding-right:0!important;}.floating-whatsapp{width:44px!important;height:44px!important;right:14px!important;bottom:calc(14px + env(safe-area-inset-bottom,0px))!important;font-size:20px!important;opacity:0!important;pointer-events:none!important;transform:translateY(8px) scale(.92)!important;box-shadow:0 3px 14px rgba(37,211,102,.28)!important;}.floating-whatsapp-visible{opacity:.76!important;pointer-events:auto!important;transform:scale(.96)!important;}.floating-whatsapp-visible:hover{opacity:1!important;transform:scale(1)!important;}.floating-to-top{width:36px!important;height:36px!important;right:18px!important;bottom:calc(66px + env(safe-area-inset-bottom,0px))!important;font-size:14px!important;opacity:.78!important;}}`}</style>
    {adminRoute?<AdminPanel/>:clientPortalRoute?<ClientPortal/>:verifyRoute?<CertificateVerificationPage/>:paymentsPortalRoute?<PaymentsPortalPage/>:paymentRoute?<>
    <script src="https://checkout.wompi.co/widget.js" async></script>
    <ServicePaymentPage/>
    </>:<>
    <script src="https://checkout.wompi.co/widget.js" async></script>
    <Nav path={path}/>{!toolRoute&&<Banner path={path}/>}
    <form name="certificacion" data-netlify="true" hidden><input name="form-name" type="hidden" value="certificacion"/><input name="consecutivo"/><input name="nombre"/><input name="tipo_documento"/><input name="numero_documento"/><input name="lugar_expedicion"/><input name="telefono"/><input name="correo"/><input name="email"/><input name="destino"/><input name="entidad"/><input name="periodo"/><input name="periodo_meses"/><input name="ingresos_laborales"/><input name="pensiones"/><input name="dividendos"/><input name="inversiones"/><input name="arriendos"/><input name="remesas"/><input name="ingresos_independiente"/><input name="otros_ingresos"/><input name="otros_descripcion"/><input name="ingresos_eventuales_json"/><input name="total_ingresos"/><input name="total_ingresos_num"/><input name="total_ingresos_periodo"/><input name="total_ingresos_eventuales"/><input name="total_ingresos_global_periodo"/><input name="tarifa_base"/><input name="codigo_promocional"/><input name="aliado_estrategico"/><input name="descuento_promocional"/><input name="porcentaje_descuento_promocional"/><input name="porcentaje_comision_aliado"/><input name="comision_aliado_estimada"/><input name="tarifa_pagada"/><input name="soportes_adjuntos"/><input name="referencia_wompi"/><input name="estado_pago"/><input name="comentarios"/><input name="declaracion_juramentada"/><input name="wompi_transaction_id"/>{MARKETING_FORM_FIELDS.map(name=><input key={name} name={name}/>)}</form>
    {certSupportRoute?<>
      <CertificationSupportPage config={certSupportConfig}/>
      <div className="ai"><FaqS/></div>
      <div className="ai"><Ftr/></div>
    </>:serviceSeoRoute?<>
      <ServiceSeoPage config={serviceSeoConfig}/>
      <div className="ai"><FaqS/></div>
      <div className="ai"><Ftr/></div>
    </>:toolRoute?<>
      <ToolRouteShell config={toolConfig}/>
      <div className="ai"><FaqS/></div>
      <div className="ai"><Ftr/></div>
    </>:certRoute?<>
      <CertificationHero/>
      <CertificationVideoSection/>
      <div className="ai"><CrtS/></div>
      <div className="ai"><FaqS/></div>
      <div className="ai"><Ftr/></div>
    </>:<>
      <Hero/>
      <div className="ai"><SvcS/></div>
      <div className="ai"><PlnS/></div>
      <div className="ai"><ScnS/></div>
      <div className="ai"><TrmS/></div>
      <div className="ai"><CrtS/></div>
      <div className="ai"><CertificationVideoSection/></div>
      <div className="ai"><Tools/></div>
      <div className="ai"><TlS/></div>
      <div className="ai"><BlgS/></div>
      <div className="ai"><DwS/></div>
      <div className="ai"><FaqS/></div>
      <div className="ai"><AltS/></div>
      <div className="ai"><WhyUs/></div>
      <div className="ai"><Abt/></div>
      <div className="ai"><Ftr/></div>
    </>}
    <Flt/>
    </>}
  </div>);
}
