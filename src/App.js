import { useState, useEffect } from "react";

/* ══════════ CONFIG ══════════ */
const WA="573013101050",WL=`https://wa.me/${WA}`,EM="info@contarae.com",F="'Outfit',sans-serif",FH="'Libre Baskerville',serif";
const fm=n=>new Intl.NumberFormat("es-CO").format(n);

/* ══════════ LOGO SVG COMPONENTS ══════════ */
function LogoNavbar(){return(
<div style={{display:"flex",alignItems:"center",gap:10}}>
  <svg width="32" height="40" viewBox="0 0 32 40"><path d="M16 0 L32 10 L32 30 L16 40 L0 30 L0 10 Z" fill="#1B3A5C" stroke="#2563EB" strokeWidth="1.5"/><path d="M16 4 L28 11 L28 29 L16 36 L4 29 L4 11 Z" fill="none" stroke="#60A5FA" strokeWidth="0.8" opacity="0.5"/><text x="16" y="27" textAnchor="middle" fontFamily="'Georgia',serif" fontSize="20" fill="#fff" fontWeight="700">C</text></svg>
  <div><div style={{display:"flex",gap:0}}><span style={{fontFamily:FH,fontSize:18,fontWeight:700,color:"#fff",letterSpacing:"1.5px"}}>CONTA</span><span style={{fontFamily:FH,fontSize:18,fontWeight:700,color:"#60A5FA",letterSpacing:"1.5px"}}>RAE</span></div><div style={{fontSize:7,color:"rgba(255,255,255,0.55)",letterSpacing:"2.5px",fontFamily:F,marginTop:1}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div></div>
</div>
)}

function LogoHero(){return(
<div style={{display:"flex",alignItems:"center",gap:14,justifyContent:"center",marginBottom:32}}>
  <svg width="56" height="64" viewBox="0 0 56 64"><path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="#0B1D3A" stroke="#1B3A5C" strokeWidth="3"/><path d="M28 6 L50 19 L50 45 L28 58 L6 45 L6 19 Z" fill="none" stroke="#2563EB" strokeWidth="1.5"/><text x="28" y="42" textAnchor="middle" fontFamily="'Georgia',serif" fontSize="34" fill="#fff" fontWeight="700">C</text></svg>
  <div><div style={{display:"flex",gap:0}}><span style={{fontFamily:FH,fontSize:32,fontWeight:700,color:"#0B1D3A",letterSpacing:"2px"}}>CONTA</span><span style={{fontFamily:FH,fontSize:32,fontWeight:700,color:"#2563EB",letterSpacing:"2px"}}>RAE</span></div><div style={{height:2,background:"#2563EB",marginTop:4,marginBottom:6,borderRadius:2}}/><div style={{fontSize:9.5,color:"#5A6F8A",letterSpacing:"3px",fontFamily:F}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div></div>
</div>
)}

function LogoFooter(){return(
<div style={{display:"flex",alignItems:"center",gap:12,justifyContent:"center",marginBottom:10}}>
  <svg width="40" height="48" viewBox="0 0 56 64"><path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="#1B3A5C" stroke="#2563EB" strokeWidth="2.5"/><path d="M28 6 L50 19 L50 45 L28 58 L6 45 L6 19 Z" fill="none" stroke="#60A5FA" strokeWidth="1.2" opacity="0.5"/><text x="28" y="42" textAnchor="middle" fontFamily="'Georgia',serif" fontSize="34" fill="#fff" fontWeight="700">C</text></svg>
  <div><div style={{display:"flex",gap:0}}><span style={{fontFamily:FH,fontSize:24,fontWeight:700,color:"#fff",letterSpacing:"2px"}}>CONTA</span><span style={{fontFamily:FH,fontSize:24,fontWeight:700,color:"#60A5FA",letterSpacing:"2px"}}>RAE</span></div><div style={{height:1.5,background:"#60A5FA",opacity:0.5,marginTop:3,marginBottom:5,borderRadius:2}}/><div style={{fontSize:8,color:"rgba(255,255,255,0.75)",letterSpacing:"3px",fontFamily:F}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div></div>
</div>
)}

/* ══════════ DATA ══════════ */
const SERVICES=[
  {icon:"📊",title:"Contabilidad Integral",desc:"Ciclo contable completo: recolección, clasificación, registro, conciliaciones bancarias, estados financieros (balance general, estado de resultados, flujo de efectivo) y aplicación de NIIF. Información financiera confiable y oportuna para la toma de decisiones."},
  {icon:"📋",title:"Asesoría Tributaria",desc:"Acompañamiento en todas sus obligaciones ante la DIAN: declaración de renta, IVA, retención en la fuente, ICA, información exógena y planeación tributaria. Optimizamos su carga fiscal dentro del marco legal vigente, evitando sanciones."},
  {icon:"💰",title:"Gestión Financiera",desc:"Presupuestos, análisis de flujo de caja, indicadores financieros (KPIs), análisis de costos, proyecciones financieras y reportes gerenciales personalizados. Decisiones informadas y estratégicas para su negocio."},
  {icon:"👥",title:"Nómina y Seguridad Social",desc:"Liquidación mensual de salarios, prestaciones sociales (prima, cesantías, intereses, vacaciones), aportes a seguridad social, planilla PILA, liquidación de contratos y certificado de ingresos y retenciones (formulario 220)."},
  {icon:"📄",title:"Certificaciones Contables",desc:"Certificaciones de ingresos, patrimonio, no declarante y más. Firmadas por Contador Público con tarjeta profesional vigente. Conforme a la Ley 43 de 1990 y lineamientos del CTCP. Entrega digital inmediata."}
];

const PLANS=[
  {name:"Emprendedor",price:"Desde $500.000/mes",target:"Independientes y microempresas",features:["Registro contable mensual completo","Declaraciones tributarias básicas (IVA, Rete fuente)","Conciliación bancaria mensual","Estados financieros trimestrales","Asesoría tributaria básica permanente","Soporte por WhatsApp"]},
  {name:"Empresarial",price:"Desde $1.000.000/mes",target:"Pequeñas y medianas empresas",features:["Todo lo del Plan Emprendedor","Liquidación de nómina y seguridad social","Estados financieros mensuales","Información exógena DIAN","Indicadores financieros y KPIs","Planeación tributaria estratégica","Soporte prioritario"],popular:true},
  {name:"Premium",price:"Desde $2.000.000/mes",target:"Empresas en crecimiento",features:["Todo lo del Plan Empresarial","Presupuestos y control de gestión","Dashboard financiero con Power BI","Análisis de costos por centro","Reuniones mensuales con informe gerencial","Asesor financiero dedicado","Soporte 24/7"]}
];

const TRAMITES=[
  {icon:"📄",title:"Certificación de Ingresos",desc:"Documento suscrito por Contador Público que certifica sus ingresos con base en soportes verificables. Válido ante bancos, inmobiliarias, embajadas y más. Proceso 100% en línea con entrega inmediata.",link:"cert"},
  {icon:"📝",title:"Declaración de Renta",desc:"Preparación y presentación ante la DIAN para personas naturales y jurídicas. Análisis de deducciones, rentas exentas y verificación contra información exógena. Plazos 2026: 12 agosto al 26 octubre.",link:"wa"},
  {icon:"🏢",title:"Renovación Matrícula Mercantil",desc:"Gestión ante la Cámara de Comercio conforme al art. 33 del Código de Comercio. Plazo: 31 de marzo. Incumplimiento: sanciones hasta 17 SMLMV y cancelación por 5 años sin renovar (Ley 1727/2014).",link:"wa"},
  {icon:"🧾",title:"Facturación Electrónica",desc:"Implementación completa: habilitación ante DIAN, proveedor tecnológico, resolución de numeración, capacitación y soporte técnico conforme a la normatividad vigente.",link:"wa"},
  {icon:"📊",title:"Información Exógena",desc:"Preparación y presentación de medios magnéticos ante la DIAN. Principal herramienta de cruce de información tributaria. Sanciones desde $524.000 (10 UVT) hasta el 5% de sumas no reportadas.",link:"wa"},
  {icon:"🏗️",title:"Creación de Empresas",desc:"Constitución legal completa: tipo societario (SAS, LTDA, S.A.), estatutos, registro en Cámara de Comercio, RUT, cuenta bancaria empresarial e inscripción como responsable de IVA.",link:"wa"}
];

const CT=[{r:"Hasta $2.000.000",t:"$80.000"},{r:"$2.000.001 a $4.000.000",t:"$100.000"},{r:"$4.000.001 a $7.000.000",t:"$120.000"},{r:"$7.000.001 a $12.000.000",t:"$150.000"},{r:"$12.000.001 a $20.000.000",t:"$180.000"},{r:"Más de $20.000.000",t:"$200.000"}];

const WHY_US=[
  {icon:"⚡",title:"Respuesta inmediata",desc:"Atendemos su solicitud en menos de 24 horas hábiles. Su tiempo es valioso y lo respetamos."},
  {icon:"🎓",title:"Contadores Públicos certificados",desc:"Profesionales con tarjeta profesional vigente ante la Junta Central de Contadores y amplia experiencia en diversos sectores."},
  {icon:"💻",title:"100% en línea",desc:"Todos nuestros servicios se gestionan de forma digital, sin desplazamientos. Desde cualquier lugar de Colombia."},
  {icon:"💲",title:"Precios transparentes",desc:"Conozca el valor antes de contratar. Sin costos ocultos, sin sorpresas. Tarifas claras desde el primer contacto."},
  {icon:"🔒",title:"Confidencialidad garantizada",desc:"Su información financiera está protegida conforme a la Ley 1581 de 2012 de protección de datos personales."},
  {icon:"🤝",title:"Acompañamiento permanente",desc:"No solo hacemos el trámite, lo asesoramos en cada paso. Somos su aliado contable de largo plazo."}
];

const SCENARIOS=[
  {emoji:"👔",title:"Soy empleado y necesito certificación para arrendar",desc:"Le piden una certificación de ingresos firmada por contador para el estudio de arrendamiento. Nosotros la emitimos en horas.",link:"#certificacion"},
  {emoji:"💼",title:"Soy independiente y no sé si debo declarar renta",desc:"Como trabajador independiente, sus ingresos pueden obligarlo a declarar. Use nuestra herramienta gratuita para verificar.",link:"#herramientas"},
  {emoji:"🏪",title:"Tengo una pyme y necesito organizar mi contabilidad",desc:"Su empresa necesita estados financieros confiables, cumplimiento tributario y orden financiero. Nuestros planes lo cubren todo.",link:"#planes"},
  {emoji:"📋",title:"Me pidieron renovar la matrícula mercantil",desc:"El plazo vence el 31 de marzo. No renovar genera sanciones de la Superintendencia de Sociedades. Nosotros hacemos el trámite.",link:"#tramites"},
  {emoji:"🏗️",title:"Quiero crear mi empresa legalmente en Colombia",desc:"Constitución de SAS, LTDA o S.A., registro en Cámara de Comercio, RUT y todos los requisitos para operar formalmente.",link:"#tramites"},
  {emoji:"🧮",title:"Quiero saber cuánto me retienen de mi salario",desc:"Use nuestra calculadora gratuita de retención en la fuente y conozca el estimado de descuento sobre su ingreso mensual.",link:"#herramientas"}
];

const TIMELINE=[
  {month:"Ene-Mar",items:["Renovación matrícula mercantil (plazo 31 mar)","Retención en la fuente mensual","IVA bimestral (ene-feb)"],color:"#2563EB"},
  {month:"Abr-May",items:["2ª cuota renta grandes contribuyentes","Inicio información exógena","IVA bimestral (mar-abr)"],color:"#1B3A5C"},
  {month:"Jun-Jul",items:["3ª cuota grandes contribuyentes","Declaración renta personas jurídicas","IVA bimestral (may-jun)"],color:"#2563EB"},
  {month:"Ago-Oct",items:["Declaración renta personas naturales (12 ago - 26 oct)","IVA bimestral (jul-ago, sep-oct)","Retención mensual"],color:"#0B1D3A"},
  {month:"Nov-Dic",items:["Precios de transferencia (15 dic)","Cierre contable año gravable","Preparación información exógena siguiente año"],color:"#1B3A5C"}
];

const ALERTS=[
  {tag:"Importante",title:"Declaración de renta personas naturales 2026: plazos del 12 de agosto al 26 de octubre",date:"Abril 2026"},
  {tag:"Normativo",title:"Reforma Laboral 2025 (Ley 2466): impacto en liquidación de nómina y prestaciones sociales",date:"Marzo 2026"},
  {tag:"DIAN",title:"Nuevos topes para declarar renta año gravable 2025: UVT $49.799 — Verifique si está obligado",date:"Febrero 2026"},
  {tag:"Recordatorio",title:"Plazo renovación matrícula mercantil: hasta el 31 de marzo de 2026 ante Cámara de Comercio",date:"Enero 2026"}
];

const BLOG=[
{title:"Declaración de renta personas naturales 2026: guía completa",tag:"Tributario",date:"Abril 2026",excerpt:"Topes, plazos, documentos y sanciones para la declaración del año gravable 2025 ante la DIAN.",content:`La declaración de renta es el informe que las personas naturales presentan ante la DIAN para reportar ingresos, patrimonio, gastos, deducciones y retenciones del año gravable anterior.

PLAZOS 2026
Del 12 de agosto al 26 de octubre de 2026, según los dos últimos dígitos del NIT (Decreto 2229 de 2023).

¿QUIÉN DEBE DECLARAR? (Año gravable 2025)
Debe declarar quien cumpla al menos uno de estos criterios:
• Ingresos brutos ≥ $69.718.600 (1.400 UVT)
• Patrimonio bruto a dic 31 ≥ $224.095.500 (4.500 UVT)
• Compras y consumos ≥ $69.718.600 (1.400 UVT)
• Consumos con tarjeta de crédito ≥ $69.718.600 (1.400 UVT)
• Consignaciones bancarias ≥ $69.718.600 (1.400 UVT)
• Ser responsable de IVA al cierre del año gravable
UVT 2025: $49.799

DOCUMENTOS NECESARIOS
Certificado de ingresos y retenciones (formulario 220), extractos bancarios, certificados de inversiones, información de bienes y deudas, certificados de aportes a salud, pensión y aportes voluntarios.

SANCIONES
Extemporaneidad: 5% del impuesto a cargo por mes o fracción (art. 641-642 ET). Sanción mínima 2026: $524.000 (10 UVT). No declarar: hasta el 20% de consignaciones o ingresos brutos.`},
{title:"Renovación de matrícula mercantil: todo lo que debe saber",tag:"Empresarial",date:"Marzo 2026",excerpt:"Plazos, requisitos, costos y consecuencias de no renovar ante la Cámara de Comercio.",content:`La matrícula mercantil certifica la existencia y situación financiera de empresas ante las Cámaras de Comercio. Su renovación anual es obligatoria según el artículo 33 del Código de Comercio.

PLAZO: Hasta el 31 de marzo de cada año.

¿QUIÉN DEBE RENOVAR?
Todas las personas naturales y jurídicas que ejerzan actividades comerciales y sus establecimientos de comercio registrados.

INFORMACIÓN REQUERIDA
Información financiera a dic 31 del año anterior, códigos CIIU actualizados, datos de contacto y número de empleados.

CONSECUENCIAS DE NO RENOVAR
• Sanciones de Superintendencia de Sociedades (hasta 17 SMLMV)
• Marcación como "comerciante no cumplidor"
• Restricciones para créditos y licitaciones
• Requerimientos de Policía Nacional (Código de Seguridad y Convivencia)
• Cancelación si no renueva por 5 años consecutivos (Ley 1727 de 2014)

CÓMO RENOVAR
100% en línea a través del portal de la Cámara de Comercio o la Ventanilla Única Empresarial (VUE).`},
{title:"Certificación de ingresos en Colombia: guía completa",tag:"Certificaciones",date:"Marzo 2026",excerpt:"Qué es, base legal, soportes necesarios y cómo solicitarla de forma rápida y segura.",content:`Documento suscrito por Contador Público con tarjeta profesional vigente que certifica el nivel de ingresos de una persona natural con base en soportes verificables.

BASE LEGAL
Ley 43 de 1990 (arts. 1 y 10): el Contador Público está facultado para emitir certificaciones y su firma otorga fe pública. Concepto CTCP 1106 de 2019: las certificaciones deben estar soportadas en documentación verificable.

SOPORTES NECESARIOS
• Laborales: desprendibles de nómina o certificado del empleador
• Honorarios: facturas, cuentas de cobro y extractos bancarios
• Arriendos: contratos y comprobantes de pago
• Pensiones: desprendible de mesada pensional
• Inversiones: certificados de la entidad financiera

¿CUÁNDO SE NECESITA?
Créditos bancarios, arrendamientos, compra de vehículo, trámites de visa, licitaciones, libreta militar y trámites académicos.

VALIDEZ
Generalmente entre 30 y 60 días según la entidad que la solicita.`},
{title:"Facturación electrónica en Colombia: obligaciones y requisitos",tag:"Tributario",date:"Febrero 2026",excerpt:"Quiénes están obligados, requisitos técnicos y cómo implementarla correctamente.",content:`Sistema de emisión de facturas en formato digital conforme a los requisitos de la DIAN.

MARCO NORMATIVO
Artículo 616-1 del Estatuto Tributario y Resolución DIAN 000042 de 2020.

OBLIGADOS
• Personas jurídicas que vendan bienes o presten servicios
• Personas naturales responsables de IVA
• Personas naturales no responsables que superen topes DIAN
• Contribuyentes del Régimen Simple (RST)

REQUISITOS TÉCNICOS
• Habilitación como facturador electrónico ante la DIAN
• Proveedor tecnológico autorizado
• Resolución de numeración de facturación vigente
• Software compatible (formato XML estándar UBL 2.1)
• Certificado digital de firma electrónica

DOCUMENTO SOPORTE
Al comprar a personas no obligadas a facturar, se debe generar el "documento soporte en adquisiciones" y transmitirlo a la DIAN.`},
{title:"5 errores comunes en la contabilidad de pymes",tag:"Contable",date:"Enero 2026",excerpt:"Los errores más frecuentes que cometen las pymes y cómo evitarlos.",content:`ERROR 1: NO LLEVAR CONTABILIDAD FORMAL
El Código de Comercio (arts. 19 y 48-74) y la Ley 1314 de 2009 obligan a llevar contabilidad conforme a NIIF. No hacerlo limita acceso a créditos y expone a sanciones.

ERROR 2: MEZCLAR FINANZAS PERSONALES Y EMPRESARIALES
No separar cuentas genera distorsiones financieras y puede considerarse defraudación fiscal al deducir gastos personales como empresariales.

ERROR 3: NO CONCILIAR BANCOS MENSUALMENTE
Sin conciliación bancaria mensual se ocultan errores, fraudes o transacciones no registradas que afectan la confiabilidad de la información.

ERROR 4: DESCONOCER PLAZOS TRIBUTARIOS
El calendario DIAN establece fechas estrictas. El incumplimiento genera sanciones desde $524.000 (10 UVT para 2026).

ERROR 5: NO CONSERVAR SOPORTES CONTABLES
El Estatuto Tributario y el Código de Comercio exigen conservar libros y comprobantes por mínimo 5 años. Sin soportes, la DIAN puede desconocer costos y deducciones.`},
{title:"Información exógena DIAN: ¿qué es y quién debe reportarla?",tag:"Tributario",date:"Enero 2026",excerpt:"Medios magnéticos: qué son, quiénes están obligados y plazos de presentación.",content:`La información exógena (medios magnéticos) es el reporte detallado de operaciones con terceros que ciertos contribuyentes presentan ante la DIAN. Es la principal herramienta de cruce de información tributaria.

¿QUÉ SE REPORTA?
Pagos a terceros, ingresos recibidos, retenciones practicadas y recibidas, IVA generado y descontable, cuentas por cobrar y pagar, información de socios y donaciones.

OBLIGADOS
Personas naturales y jurídicas con ingresos superiores al tope DIAN (generalmente entre 100 y 500 millones), entidades públicas, consorcios, fondos de inversión y entidades financieras.

PLAZOS 2026 (año gravable 2025)
• Grandes contribuyentes: 28 abril al 13 mayo
• Personas jurídicas y naturales: 14 mayo al 12 junio

SANCIONES (Art. 651 ET)
• No enviar: hasta 5% de sumas no reportadas
• Errores: hasta 4% de sumas con información errónea
• Extemporaneidad: hasta 3% de sumas reportadas tarde
• Sanción mínima: $524.000 (10 UVT)`}
];

const DOWNLOADS=[
  {n:"Checklist Declaración de Renta PN",d:"Lista completa de documentos para preparar su declaración persona natural."},
  {n:"Autorización Tratamiento de Datos",d:"Formato conforme a la Ley 1581 de 2012 y Decreto 1074 de 2015."},
  {n:"Guía Soportes Certificación de Ingresos",d:"Soportes requeridos según cada tipo de ingreso."},
  {n:"Calendario Tributario 2026",d:"Fechas de vencimiento de todas las obligaciones tributarias."},
  {n:"Modelo Certificación de Ingresos",d:"Modelo conforme a Ley 43/1990 y lineamientos CTCP."}
];

const FAQS=[
  {q:"¿Cuánto cuesta una certificación de ingresos?",a:"Desde $80.000 COP según rango de ingresos mensuales. Incluye revisión de soportes, elaboración y firma por Contador Público con tarjeta profesional vigente."},
  {q:"¿Qué documentos necesito para declarar renta?",a:"Certificado de ingresos y retenciones (formulario 220), extractos bancarios de todas sus cuentas, certificados de inversiones, información de bienes y deudas, y certificados de aportes a salud, pensión y aportes voluntarios."},
  {q:"¿Cómo funciona el plan mensual?",a:"Elija el plan que se ajuste a su empresa. Nos encargamos de toda la gestión contable, tributaria y financiera de forma permanente con reportes periódicos. Los precios dependen del volumen de información de cada cliente."},
  {q:"¿Puedo contratar un servicio puntual?",a:"Sí. Ofrecemos certificaciones, declaraciones, renovación de matrícula, creación de empresas y cualquier trámite contable sin necesidad de plan mensual."},
  {q:"¿Cuánto tarda la renovación de matrícula?",a:"De 1 a 3 días hábiles con documentación completa. Recomendamos hacerlo en enero o febrero para evitar congestiones antes del 31 de marzo."},
  {q:"¿Qué medios de pago aceptan?",a:"Wompi (tarjeta crédito/débito, PSE), Nequi, Daviplata y transferencia bancaria."},
  {q:"¿Cómo sé si debo declarar renta?",a:"Depende de sus ingresos, patrimonio, compras, consumos con tarjeta y consignaciones bancarias. Use nuestra herramienta gratuita en la sección Herramientas para verificarlo al instante."},
  {q:"¿Qué es la información exógena?",a:"Son los medios magnéticos: reporte de operaciones con terceros ante la DIAN. Obligatorio para contribuyentes que superen ciertos topes de ingresos. Su incumplimiento genera sanciones significativas."}
];

const PRIVACY=[
  {t:"1. Identificación del Responsable",c:`CONTARAE — Servicios Contables, Tributarios y Financieros. Domicilio: Bogotá D.C., Colombia. Correo: ${EM}. WhatsApp: +57 ${WA.slice(2)}. Web: www.contarae.com.`},
  {t:"2. Marco Normativo",c:"Constitución Política de Colombia (artículo 15), Ley Estatutaria 1581 de 2012, Decreto 1074 de 2015 (compiló Decreto 1377 de 2013) y demás normas concordantes vigentes."},
  {t:"3. Definiciones",c:"Conforme al artículo 3 de la Ley 1581 de 2012: Dato personal: cualquier información vinculada a personas naturales determinadas o determinables. Dato sensible: dato que afecta la intimidad del titular o cuyo uso indebido puede generar discriminación. Titular: persona natural cuyos datos son objeto de tratamiento. Responsable: quien decide sobre la base de datos y/o el tratamiento. Encargado: quien realiza el tratamiento por cuenta del responsable. Tratamiento: cualquier operación sobre datos personales. Autorización: consentimiento previo, expreso e informado del titular. Base de datos: conjunto organizado de datos personales objeto de tratamiento."},
  {t:"4. Principios Rectores",c:"CONTARAE aplica los principios del artículo 4 de la Ley 1581 de 2012: (a) Legalidad: tratamiento sujeto a la ley. (b) Finalidad: finalidad legítima informada al titular. (c) Libertad: consentimiento previo, expreso e informado. (d) Veracidad: información veraz, completa, exacta y actualizada. (e) Transparencia: derecho del titular a obtener información en cualquier momento. (f) Acceso y circulación restringida: sujeto a los límites de la autorización. (g) Seguridad: medidas para evitar adulteración, pérdida o acceso no autorizado. (h) Confidencialidad: reserva obligatoria de la información."},
  {t:"5. Datos Recopilados",c:"Datos de identificación (nombre, cédula), contacto (dirección, teléfono, correo), financieros y tributarios (ingresos, patrimonio, extractos, estados financieros, declaraciones), y laborales (empleadores, remuneración) cuando sean necesarios para los servicios contratados."},
  {t:"6. Finalidades del Tratamiento",c:"(a) Prestación de servicios contables, tributarios y financieros. (b) Elaboración de certificaciones contables. (c) Preparación de declaraciones tributarias ante la DIAN. (d) Gestión de nómina y seguridad social. (e) Comunicación sobre servicios y vencimientos. (f) Información sobre cambios normativos. (g) Facturación y cobro. (h) Atención de consultas y reclamos. (i) Cumplimiento de obligaciones legales."},
  {t:"7. Derechos del Titular",c:"Conforme al artículo 8 de la Ley 1581 de 2012: (a) Conocer, actualizar y rectificar sus datos. (b) Solicitar prueba de la autorización otorgada. (c) Ser informado sobre el uso dado a sus datos. (d) Presentar quejas ante la Superintendencia de Industria y Comercio (SIC). (e) Revocar la autorización y/o solicitar supresión de datos. (f) Acceder gratuitamente a sus datos personales."},
  {t:"8. Autorización",c:"CONTARAE obtiene autorización previa, expresa e informada mediante: formularios físicos o electrónicos, formularios del sitio web con checkbox de aceptación, y mensajes de correo o WhatsApp con consentimiento inequívoco. La autorización se conserva conforme al art. 9 de la Ley 1581 y art. 2.2.2.25.2.4 del Decreto 1074 de 2015."},
  {t:"9. Datos Sensibles",c:"CONTARAE no recopila datos sensibles sistemáticamente. En caso excepcional necesario para un servicio, se informará al titular que no está obligado a autorizar, cuáles datos sensibles se tratarán y la finalidad específica, obteniendo autorización expresa conforme a los artículos 5 y 6 de la Ley 1581 de 2012."},
  {t:"10. Datos de Menores",c:"CONTARAE no trata datos de menores salvo que sea necesario para un servicio solicitado por el representante legal (ej: dependientes para declaración de renta). Se asegurará el interés superior del menor conforme al artículo 7 de la Ley 1581 de 2012."},
  {t:"11. Deberes del Responsable",c:"En cumplimiento del artículo 17 de la Ley 1581: garantizar el habeas data, solicitar y conservar autorización, informar sobre finalidad y derechos, garantizar veracidad de la información, conservar con seguridad, rectificar cuando sea incorrecto, tramitar consultas y reclamos en los términos de ley."},
  {t:"12. Medidas de Seguridad",c:"Técnicas: almacenamiento seguro, contraseñas robustas, respaldos periódicos, canales cifrados. Humanas: capacitación al personal, acuerdos de confidencialidad. Administrativas: procedimientos internos, controles de acceso por niveles, protocolos ante incidentes de seguridad."},
  {t:"13. Transferencia de Datos",c:"CONTARAE no transfiere datos a terceros salvo por cumplimiento legal (DIAN, Cámaras de Comercio, Superintendencias) o autorización expresa del titular (entidades financieras, empleadores). Para transferencia internacional se verifica nivel de protección conforme al artículo 26 de la Ley 1581."},
  {t:"14. Consultas y Reclamos",c:`Consultas (art. 14): atendidas en máximo 10 días hábiles, prorrogable 5 más. Reclamos (art. 15): atendidos en máximo 15 días hábiles, prorrogable 8 más. Debe contener: identificación del titular, descripción de hechos, documentos de soporte y datos de contacto. Canal: ${EM} o WhatsApp +57 ${WA.slice(2)}.`},
  {t:"15. Canales de Atención",c:`Correo: ${EM}. WhatsApp: +57 ${WA.slice(2)}. Dirección: Bogotá D.C., Colombia. Horario: lunes a viernes 8:00 a.m. a 6:00 p.m.`},
  {t:"16. Vigencia",c:"Esta política rige desde su publicación en www.contarae.com. Los datos se conservan durante el tiempo necesario para las finalidades descritas y obligaciones legales aplicables. CONTARAE puede modificar esta política publicando cambios en el sitio web."},
  {t:"17. Autoridad de Vigilancia",c:"Superintendencia de Industria y Comercio (SIC) — Delegatura para Protección de Datos Personales. Web: www.sic.gov.co. Línea: 01 8000 910 165."}
];

/* ══════════ UI HELPERS ══════════ */
const IS={width:"100%",padding:"10px 13px",borderRadius:9,border:"1px solid #d0d9e8",fontSize:13,fontFamily:F,outline:"none",background:"#f8fafd",boxSizing:"border-box"};
const Sec=({id,title,sub,bg,children,narrow})=>(<section id={id} style={{padding:"85px 24px",background:bg||"transparent"}}><div style={{maxWidth:narrow?900:1100,margin:"0 auto"}}>{title&&<div style={{textAlign:"center",marginBottom:48}}>{sub&&<div style={{fontSize:11,fontWeight:600,color:"#2563EB",letterSpacing:"2px",marginBottom:9,fontFamily:F}}>{sub}</div>}<h2 style={{fontFamily:FH,fontSize:"clamp(22px,3.5vw,36px)",fontWeight:700,color:"#0B1D3A"}}>{title}</h2></div>}{children}</div></section>);
const Cd=({children,s})=><div style={{padding:24,borderRadius:14,background:"#fff",border:"1px solid rgba(37,99,235,.07)",transition:"transform .3s,box-shadow .3s",...s}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 26px rgba(37,99,235,.06)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>{children}</div>;

/* ══════════ SECTIONS ══════════ */
function Nav(){const items=["Inicio","Servicios","Planes","Trámites","Certificación","Herramientas","Nosotros","Blog","Contacto"];return(<nav style={{position:"fixed",top:0,width:"100%",zIndex:200,padding:"10px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(8,27,57,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(96,165,250,.1)"}}><LogoNavbar/><div style={{display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>{items.map(i=><a key={i} href={`#${i.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}`} style={{textDecoration:"none",color:"rgba(255,255,255,.6)",fontSize:11,fontWeight:500,fontFamily:F}} onMouseEnter={e=>e.target.style.color="#60A5FA"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.6)"}>{i}</a>)}<a href={WL} target="_blank" rel="noopener noreferrer" style={{padding:"5px 14px",borderRadius:8,background:"linear-gradient(135deg,#2563EB,#60A5FA)",color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none"}}>WhatsApp</a></div></nav>)}

function Hero(){return(<section id="inicio" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"140px 24px 80px",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:"-15%",right:"-8%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 70%)"}}></div><div style={{maxWidth:760,position:"relative",zIndex:1}}><LogoHero/><h1 style={{fontFamily:FH,fontSize:"clamp(28px,5vw,52px)",fontWeight:700,lineHeight:1.12,color:"#0B1D3A",marginBottom:22}}>Su tranquilidad financiera <span style={{background:"linear-gradient(135deg,#1B3A5C,#60A5FA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>comienza aquí</span></h1><p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.75,maxWidth:580,margin:"0 auto 36px",fontFamily:F}}>Contadores Públicos certificados con amplia experiencia. Nos encargamos de su contabilidad, impuestos y finanzas para que usted se enfoque en crecer.</p><div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap"}}><a href="#certificacion" style={{padding:"13px 30px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",boxShadow:"0 4px 18px rgba(37,99,235,.3)",fontFamily:F}}>Certificación de Ingresos</a><a href="#planes" style={{padding:"13px 30px",borderRadius:12,color:"#1B3A5C",fontSize:14,fontWeight:600,textDecoration:"none",border:"2px solid rgba(27,58,92,.18)",fontFamily:F}}>Ver Planes</a></div></div></section>)}

function WhyUs(){return(<Sec title="¿Por qué elegir a CONTARAE?" sub="NUESTROS DIFERENCIALES"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>{WHY_US.map((w,i)=><Cd key={i}><div style={{fontSize:28,marginBottom:8}}>{w.icon}</div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{w.title}</h3><p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{w.desc}</p></Cd>)}</div></Sec>)}

function SvcS(){return(<Sec id="servicios" title="Soluciones profesionales a la medida" sub="NUESTROS SERVICIOS"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>{SERVICES.map((s,i)=><Cd key={i}><div style={{fontSize:28,marginBottom:8}}>{s.icon}</div><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{s.title}</h3><p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{s.desc}</p><a href={WL} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:10,fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar asesoría →</a></Cd>)}</div></Sec>)}

function PlnS(){return(<Sec id="planes" title="Servicio contable integral" sub="PLANES MENSUALES" bg="linear-gradient(180deg,rgba(37,99,235,.03) 0%,transparent 100%)"><p style={{textAlign:"center",fontSize:13,color:"#5A6F8A",marginTop:-34,marginBottom:36,fontFamily:F}}>Nuestros planes se ajustan al volumen de información y necesidades de cada cliente. Precios de referencia.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:18}}>{PLANS.map((p,i)=><div key={i} style={{padding:28,borderRadius:16,background:p.popular?"linear-gradient(135deg,#0B1D3A,#1B3A5C)":"#fff",border:p.popular?"none":"1px solid rgba(37,99,235,.07)",position:"relative",color:p.popular?"#fff":"#0B1D3A"}}>{p.popular&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#60A5FA",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 12px",borderRadius:100,fontFamily:F}}>MÁS POPULAR</div>}<h3 style={{fontSize:19,fontWeight:700,fontFamily:F}}>{p.name}</h3><div style={{fontSize:11,opacity:.6,marginBottom:10,fontFamily:F}}>{p.target}</div><div style={{fontSize:20,fontWeight:700,marginBottom:16,fontFamily:FH,color:p.popular?"#60A5FA":"#2563EB"}}>{p.price}</div>{p.features.map((f,j)=><div key={j} style={{fontSize:12,padding:"4px 0",borderBottom:`1px solid ${p.popular?"rgba(255,255,255,.06)":"rgba(37,99,235,.04)"}`,fontFamily:F,opacity:.85}}>✓ {f}</div>)}<a href={WL} target="_blank" rel="noopener noreferrer" style={{display:"block",marginTop:18,padding:"10px 20px",borderRadius:10,background:p.popular?"#60A5FA":"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",textAlign:"center",fontFamily:F}}>Solicitar información</a></div>)}</div><p style={{textAlign:"center",marginTop:22,fontSize:12,color:"#5A6F8A",fontFamily:F}}>¿No sabe cuál necesita? <a href={WL} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>Asesoría gratuita</a></p></Sec>)}

function Scenarios(){return(<Sec title="¿Se identifica con alguno de estos casos?" sub="¿EN QUÉ LE PODEMOS AYUDAR?"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>{SCENARIOS.map((s,i)=><a key={i} href={s.link} style={{textDecoration:"none",color:"inherit"}}><Cd s={{cursor:"pointer"}}><div style={{fontSize:28,marginBottom:8}}>{s.emoji}</div><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{s.title}</h3><p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.65,fontFamily:F}}>{s.desc}</p><span style={{display:"inline-block",marginTop:8,fontSize:11,color:"#2563EB",fontWeight:600,fontFamily:F}}>Ver solución →</span></Cd></a>)}</div></Sec>)}

function TrmS(){return(<Sec id="tramites" title="Los trámites más solicitados" sub="TRÁMITES CLAVE"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:18}}>{TRAMITES.map((t,i)=><Cd key={i}><div style={{fontSize:26,marginBottom:6}}>{t.icon}</div><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{t.title}</h3><p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{t.desc}</p><a href={t.link==="cert"?"#certificacion":WL} target={t.link==="wa"?"_blank":undefined} style={{display:"inline-block",marginTop:8,fontSize:11,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>{t.link==="cert"?"Solicitar al instante →":"Solicitar servicio →"}</a></Cd>)}</div></Sec>)}

/* CERTIFICACIÓN */
function CrtS(){const[fm2,sF]=useState({n:"",cc:"",tel:"",em:"",dir:"",ent:"",per:"",iL:"",iP:"",iD:"",iI:"",iA:"",iR:"",iO:"",oD:"",cm:""});const[ok,sOk]=useState(false);const u=(k,v)=>sF(p=>({...p,[k]:v}));
const ings=[["Ingresos laborales","iL","Salario y prestaciones de relación laboral."],["Pensiones","iP","Mesada pensional por vejez, invalidez o sobrevivencia."],["Dividendos","iD","Utilidades como socio o accionista."],["Inversiones","iI","Rendimientos de CDTs, fondos, acciones."],["Arriendos","iA","Cánones de arrendamiento de inmuebles propios."],["Remesas","iR","Dinero recibido del exterior."]];
return(<Sec id="certificacion" title="Solicite su certificación al instante" sub="CERTIFICACIÓN DE INGRESOS" bg="linear-gradient(180deg,rgba(37,99,235,.04) 0%,transparent 100%)" narrow>
<p style={{textAlign:"center",fontSize:13,color:"#5A6F8A",marginTop:-34,marginBottom:36,fontFamily:F}}>Respuesta inmediata · 100% en línea · Firmada por Contador Público con tarjeta profesional vigente</p>
<div style={{display:"grid",gap:16,marginBottom:32}}>{[["¿Qué es?","Documento suscrito por Contador Público con tarjeta profesional vigente ante la Junta Central de Contadores que certifica el nivel de ingresos de una persona natural con base en soportes documentales verificables (extractos, contratos, facturas, comprobantes de pago)."],["¿Por qué firma de Contador?","Según el artículo 10 de la Ley 43 de 1990, la firma otorga fe pública: se presume que la información cumple requisitos legales. El CTCP (Concepto 1106/2019) ratifica que las certificaciones deben estar soportadas en documentación verificable."],["¿Qué se valida?","Identidad del solicitante, fuentes y montos de ingreso, coherencia entre soportes y cifras, y el período de certificación solicitado."],["¿Cuándo se necesita?","Créditos bancarios, arrendamientos, compra de vehículo, trámites de visa, licitaciones, libreta militar, trámites académicos y cualquier entidad que exija acreditar capacidad de pago."]].map(([t,d],i)=><div key={i} style={{padding:22,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.06)"}}><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{t}</h3><p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{d}</p></div>)}</div>
<div style={{padding:24,borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",marginBottom:32,color:"#fff"}}><h3 style={{fontSize:16,fontWeight:700,marginBottom:14,textAlign:"center",fontFamily:F}}>Tarifas según ingresos mensuales</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:8}}>{CT.map((t,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"9px 14px",borderRadius:7,background:"rgba(255,255,255,.07)",fontFamily:F}}><span style={{fontSize:12,opacity:.8}}>{t.r}</span><span style={{fontSize:13,fontWeight:700,color:"#60A5FA"}}>{t.t}</span></div>)}</div><div style={{marginTop:14,padding:12,borderRadius:8,background:"rgba(96,165,250,.13)",fontSize:11,fontFamily:F}}><strong>Pago:</strong> Wompi (tarjeta, PSE), Nequi, Daviplata o transferencia bancaria.</div></div>
<div style={{marginBottom:32}}><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:16,textAlign:"center",fontFamily:F}}>¿Cómo funciona?</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:12}}>{[["1","Complete el formulario","Datos, ingresos y destino."],["2","Adjunte soportes y pago","Extractos y comprobante de pago."],["3","Revisión profesional","Si falta algo, lo contactamos."],["4","Reciba su certificado","PDF firmado por WhatsApp y correo."]].map(([n,t,d],i)=><div key={i} style={{padding:18,borderRadius:10,background:"#fff",border:"1px solid rgba(37,99,235,.06)",textAlign:"center"}}><div style={{width:32,height:32,borderRadius:"50%",background:"linear-gradient(135deg,#2563EB,#60A5FA)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 8px",fontWeight:700,fontSize:15,fontFamily:FH}}>{n}</div><h4 style={{fontSize:13,fontWeight:700,color:"#0B1D3A",marginBottom:3,fontFamily:F}}>{t}</h4><p style={{fontSize:11,color:"#5A6F8A",fontFamily:F}}>{d}</p></div>)}</div></div>
<div style={{padding:28,borderRadius:16,background:"#fff",border:"1px solid rgba(37,99,235,.08)",boxShadow:"0 5px 24px rgba(37,99,235,.04)"}}><h3 style={{fontSize:18,fontWeight:700,color:"#0B1D3A",marginBottom:20,textAlign:"center",fontFamily:F}}>Formulario de Solicitud</h3>
{!ok?<form name="certificacion" method="POST" data-netlify="true" onSubmit={e=>{e.preventDefault();sOk(true)}} style={{display:"grid",gap:16}}><input type="hidden" name="form-name" value="certificacion"/>
<div style={{padding:16,borderRadius:10,background:"#f8fafd"}}><h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:8,fontFamily:F}}>📋 Datos Personales</h4><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8}}>{[["Nombre completo","n"],["Cédula","cc"],["Tel/WhatsApp","tel"],["Correo","em"]].map(([l,k])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l}</label><input name={k} style={IS} value={fm2[k]} onChange={e=>u(k,e.target.value)} required/></div>)}</div></div>
<div style={{padding:16,borderRadius:10,background:"#f8fafd"}}><h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:8,fontFamily:F}}>🏢 Destino</h4><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:8}}><div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Dirigida a</label><select name="dirigido" style={{...IS,cursor:"pointer"}} value={fm2.dir} onChange={e=>u("dir",e.target.value)} required><option value="">Seleccione...</option>{["Banco","Inmobiliaria","Embajada","Concesionario","Entidad pública","Contratación","Otro"].map(o=><option key={o}>{o}</option>)}</select></div><div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Entidad</label><input name="entidad" style={IS} value={fm2.ent} onChange={e=>u("ent",e.target.value)}/></div><div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Período</label><select name="periodo" style={{...IS,cursor:"pointer"}} value={fm2.per} onChange={e=>u("per",e.target.value)} required><option value="">Seleccione...</option>{["Último mes","Últimos 3 meses","Últimos 6 meses","Último año","Otro"].map(o=><option key={o}>{o}</option>)}</select></div></div></div>
<div style={{padding:16,borderRadius:10,background:"#f8fafd"}}><h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:3,fontFamily:F}}>💰 Ingresos Mensuales</h4><p style={{fontSize:10,color:"#7A8FA8",marginBottom:12,fontFamily:F}}>Solo los que apliquen (COP).</p><div style={{display:"grid",gap:10}}>{ings.map(([l,k,tip])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l}</label><span style={{fontSize:9,color:"#7A8FA8",fontFamily:F}}> — {tip}</span><input name={k} style={{...IS,marginTop:3}} value={fm2[k]} onChange={e=>u(k,e.target.value)} placeholder="$ Valor mensual"/></div>)}<div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Otros ingresos</label><span style={{fontSize:9,color:"#7A8FA8",fontFamily:F}}> — Honorarios, comisiones, independiente.</span><input name="otrosVal" style={{...IS,marginTop:3}} value={fm2.iO} onChange={e=>u("iO",e.target.value)} placeholder="$ Valor"/><input name="otrosDesc" style={{...IS,marginTop:4}} value={fm2.oD} onChange={e=>u("oD",e.target.value)} placeholder="Concepto"/></div></div></div>
<div style={{padding:16,borderRadius:10,background:"#f8fafd"}}><h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:8,fontFamily:F}}>📎 Comentarios</h4><textarea name="comentarios" style={{...IS,minHeight:60,resize:"vertical"}} value={fm2.cm} onChange={e=>u("cm",e.target.value)} placeholder="Información adicional..."/><div style={{marginTop:10,padding:12,borderRadius:7,background:"rgba(37,99,235,.04)",border:"1px dashed rgba(37,99,235,.15)"}}><p style={{fontSize:11,color:"#1B3A5C",fontWeight:600,fontFamily:F}}>📄 Enviar por correo o WhatsApp:</p><p style={{fontSize:10,color:"#5A6F8A",fontFamily:F}}>Cédula · Extractos · Soportes de ingreso · <strong>Comprobante de pago</strong></p></div></div>
<div style={{textAlign:"center"}}><button type="submit" style={{padding:"12px 40px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:700,border:"none",cursor:"pointer",fontFamily:F}}>Enviar Solicitud</button><p style={{fontSize:11,color:"#5A6F8A",marginTop:10,fontFamily:F}}>¿Prefiere WhatsApp? <a href={WL} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>Escríbanos</a></p></div>
<div style={{padding:14,borderRadius:9,background:"rgba(37,99,235,.04)",textAlign:"center"}}><p style={{fontSize:11,color:"#1B3A5C",lineHeight:1.75,fontFamily:F}}>Una vez recibida su solicitud, nuestro equipo verificará la información. En caso de requerirse información adicional, <strong>uno de nuestros profesionales se contactará a la mayor brevedad</strong>. Con documentación completa y pago confirmado, recibirá su certificación firmada en PDF por WhatsApp y correo.</p></div>
</form>:<div style={{textAlign:"center",padding:30}}><div style={{fontSize:42,marginBottom:12}}>✅</div><h3 style={{fontSize:18,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>¡Solicitud recibida!</h3><p style={{fontSize:13,color:"#5A6F8A",marginTop:6,fontFamily:F}}>Envíe soportes y comprobante de pago por correo o WhatsApp.</p><div style={{display:"flex",gap:10,justifyContent:"center",marginTop:18}}><a href={WL} target="_blank" rel="noopener noreferrer" style={{padding:"10px 22px",borderRadius:10,background:"#25D366",color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none",fontFamily:F}}>WhatsApp</a><button onClick={()=>sOk(false)} style={{padding:"10px 22px",borderRadius:10,color:"#2563EB",fontSize:12,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F,background:"transparent"}}>Nueva solicitud</button></div></div>}
</div></Sec>)}

/* HERRAMIENTAS */
function Tools(){const[cI,sCI]=useState("");const[cR,sCR]=useState(null);const[rF,sRF]=useState({i:"",p:"",c:"",tc:"",b:""});const[rR,sRR]=useState(null);const uv=49799;
const calc=()=>{const i=parseFloat(cI.replace(/\./g,"").replace(/,/g,""))||0;if(i<=0)return;let u2=i/uv,r=0;if(u2<=95)r=0;else if(u2<=150)r=(i-95*uv)*.19;else if(u2<=360)r=55*uv*.19+(i-150*uv)*.28;else if(u2<=640)r=55*uv*.19+210*uv*.28+(i-360*uv)*.33;else if(u2<=945)r=55*uv*.19+210*uv*.28+280*uv*.33+(i-640*uv)*.35;else if(u2<=2300)r=55*uv*.19+210*uv*.28+280*uv*.33+305*uv*.35+(i-945*uv)*.37;else r=55*uv*.19+210*uv*.28+280*uv*.33+305*uv*.35+1355*uv*.37+(i-2300*uv)*.39;sCR({i,r:Math.max(0,Math.round(r)),t:i>0?((Math.max(0,r)/i)*100).toFixed(1):"0"});};
const chk=()=>{const v=k=>parseFloat(rF[k].replace(/\./g,"").replace(/,/g,""))||0;const i=v("i"),p=v("p"),c=v("c"),tc=v("tc"),b=v("b");const t14=1400*uv,t45=4500*uv;const ob=i>t14||p>t45||c>t14||tc>t14||b>t14;const rz=[];if(i>t14)rz.push(`Ingresos ($${fm(i)}) superan 1.400 UVT ($${fm(Math.round(t14))})`);if(p>t45)rz.push(`Patrimonio ($${fm(p)}) supera 4.500 UVT ($${fm(Math.round(t45))})`);if(c>t14)rz.push(`Compras ($${fm(c)}) superan 1.400 UVT`);if(tc>t14)rz.push(`Tarjeta de crédito ($${fm(tc)}) supera 1.400 UVT`);if(b>t14)rz.push(`Consignaciones ($${fm(b)}) superan 1.400 UVT`);sRR({ob,rz});};
return(<Sec id="herramientas" title="Calcule y consulte al instante" sub="HERRAMIENTAS GRATUITAS"><p style={{textAlign:"center",fontSize:13,color:"#5A6F8A",marginTop:-34,marginBottom:36,fontFamily:F}}>Basadas en normatividad tributaria colombiana vigente. Los resultados son estimados.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(420px,1fr))",gap:20}}>
<Cd s={{padding:24}}><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:4,fontFamily:F}}>🧮 Calculadora Retención en la Fuente</h3><p style={{fontSize:11,color:"#5A6F8A",marginBottom:14,fontFamily:F}}>Procedimiento 1, art. 383 ET. UVT 2025: $49.799.</p><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Ingreso mensual bruto (COP)</label><div style={{display:"flex",gap:8,marginTop:4}}><input style={IS} value={cI} onChange={e=>sCI(e.target.value)} placeholder="5000000"/><button onClick={calc} style={{padding:"9px 18px",borderRadius:9,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Calcular</button></div>{cR&&<div style={{marginTop:14,padding:16,borderRadius:10,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,textAlign:"center"}}><div><div style={{fontSize:9,opacity:.5,fontFamily:F}}>Ingreso</div><div style={{fontSize:14,fontWeight:700,fontFamily:F}}>${fm(cR.i)}</div></div><div><div style={{fontSize:9,opacity:.5,fontFamily:F}}>Retención</div><div style={{fontSize:14,fontWeight:700,color:"#60A5FA",fontFamily:F}}>${fm(cR.r)}</div></div><div><div style={{fontSize:9,opacity:.5,fontFamily:F}}>Tasa</div><div style={{fontSize:14,fontWeight:700,fontFamily:F}}>{cR.t}%</div></div></div><p style={{fontSize:9,opacity:.4,marginTop:8,textAlign:"center",fontFamily:F}}>* Estimado. No incluye deducciones ni rentas exentas.</p></div>}</Cd>
<Cd s={{padding:24}}><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:4,fontFamily:F}}>📝 ¿Debe declarar renta?</h3><p style={{fontSize:11,color:"#5A6F8A",marginBottom:14,fontFamily:F}}>Año gravable 2025 (Decreto 2229/2023). UVT: $49.799.</p><div style={{display:"grid",gap:8}}>{[["Ingresos brutos anuales","i","≥$69.718.600"],["Patrimonio a dic 31","p","≥$224.095.500"],["Compras y consumos","c","≥$69.718.600"],["Consumos tarjeta crédito","tc","≥$69.718.600"],["Consignaciones bancarias","b","≥$69.718.600"]].map(([l,k,tip])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l}</label><span style={{fontSize:9,color:"#7A8FA8",fontFamily:F}}> Tope: {tip}</span><input style={{...IS,marginTop:3}} value={rF[k]} onChange={e=>sRF(p=>({...p,[k]:e.target.value}))} placeholder="$ Valor anual"/></div>)}<button onClick={chk} style={{padding:"9px 18px",borderRadius:9,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Verificar</button></div>{rR&&<div style={{marginTop:14,padding:16,borderRadius:10,background:rR.ob?"rgba(220,38,38,.06)":"rgba(22,163,74,.06)",border:`1px solid ${rR.ob?"rgba(220,38,38,.14)":"rgba(22,163,74,.14)"}`}}><div style={{fontSize:14,fontWeight:700,color:rR.ob?"#DC2626":"#16A34A",marginBottom:5,fontFamily:F}}>{rR.ob?"⚠️ Probablemente SÍ está obligado":"✅ Posiblemente NO está obligado"}</div>{rR.rz.map((r,i)=><p key={i} style={{fontSize:11,color:"#5A6F8A",fontFamily:F}}>• {r}</p>)}<p style={{fontSize:9,color:"#7A8FA8",marginTop:8,fontFamily:F}}>* También deben declarar quienes sean responsables de IVA, independientemente de los montos. Consulte con nuestros profesionales.</p><a href={WL} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:8,fontSize:11,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Asesoría personalizada →</a></div>}</Cd>
</div></Sec>)}

/* LÍNEA DE TIEMPO */
function Timeline(){return(<Sec title="Obligaciones tributarias 2026" sub="CALENDARIO TRIBUTARIO"><p style={{textAlign:"center",fontSize:13,color:"#5A6F8A",marginTop:-34,marginBottom:36,maxWidth:700,margin:"-34px auto 36px",fontFamily:F}}>Principales vencimientos del calendario tributario colombiano para el año 2026. Basado en el Decreto 2229 de 2023 y resoluciones DIAN.</p><div style={{display:"grid",gap:14,maxWidth:800,margin:"0 auto"}}>{TIMELINE.map((t,i)=><div key={i} style={{display:"flex",gap:16,alignItems:"flex-start"}}><div style={{minWidth:80,padding:"10px 0",textAlign:"center"}}><div style={{fontSize:16,fontWeight:700,color:t.color,fontFamily:FH}}>{t.month}</div><div style={{width:3,height:40,background:t.color,margin:"6px auto",borderRadius:4,opacity:.3}}></div></div><div style={{flex:1,padding:18,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.07)",borderLeft:`3px solid ${t.color}`}}>{t.items.map((item,j)=><div key={j} style={{fontSize:13,color:"#3a5068",lineHeight:1.7,fontFamily:F,padding:"2px 0"}}>• {item}</div>)}</div></div>)}</div><p style={{textAlign:"center",marginTop:24,fontSize:12,color:"#5A6F8A",fontFamily:F}}>Además: retención en la fuente mensual, ICA según municipio, y obligaciones especiales según actividad económica. <a href={WL} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>Consulte fechas específicas</a></p></Sec>)}

/* ALERTAS */
function AlertsS(){return(<Sec title="Novedades y alertas tributarias" sub="ALERTAS NORMATIVAS" bg="linear-gradient(180deg,rgba(37,99,235,.03) 0%,transparent 100%)"><div style={{display:"grid",gap:12,maxWidth:800,margin:"0 auto"}}>{ALERTS.map((a,i)=><div key={i} style={{padding:"18px 22px",borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.07)",display:"flex",gap:14,alignItems:"flex-start"}}><div><span style={{fontSize:9,fontWeight:700,color:a.tag==="Importante"?"#DC2626":a.tag==="DIAN"?"#2563EB":"#0B1D3A",background:a.tag==="Importante"?"rgba(220,38,38,.08)":a.tag==="DIAN"?"rgba(37,99,235,.08)":"rgba(11,29,58,.06)",padding:"3px 9px",borderRadius:100,fontFamily:F}}>{a.tag}</span></div><div style={{flex:1}}><h4 style={{fontSize:13,fontWeight:700,color:"#0B1D3A",lineHeight:1.5,fontFamily:F}}>{a.title}</h4><span style={{fontSize:10,color:"#7A8FA8",fontFamily:F}}>{a.date}</span></div></div>)}</div></Sec>)}

/* NOSOTROS */
function Abt(){return(<Sec id="nosotros" title="Conozca a CONTARAE" sub="NOSOTROS" narrow><div style={{padding:28,borderRadius:14,background:"#fff",border:"1px solid rgba(37,99,235,.06)",marginBottom:18}}><h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>¿Quiénes somos?</h3><p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>CONTARAE es una firma de servicios contables, tributarios y financieros comprometida con la excelencia profesional. Contamos con Contadores Públicos certificados, con tarjeta profesional vigente ante la Junta Central de Contadores y amplia experiencia en empresas de diversos sectores en Colombia. Cada cliente recibe un trato profesional, cercano y confidencial.</p></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(270px,1fr))",gap:16}}><div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><h3 style={{fontSize:15,fontWeight:700,marginBottom:7,fontFamily:F}}>Misión</h3><p style={{fontSize:12,lineHeight:1.75,opacity:.9,fontFamily:F}}>Brindar servicios contables, tributarios y financieros de alta calidad, con responsabilidad y transparencia, contribuyendo al crecimiento sostenible de nuestros clientes mediante soluciones integrales y personalizadas.</p></div><div style={{padding:24,borderRadius:13,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff"}}><h3 style={{fontSize:15,fontWeight:700,marginBottom:7,fontFamily:F}}>Visión</h3><p style={{fontSize:12,lineHeight:1.75,opacity:.9,fontFamily:F}}>Ser reconocidos como firma líder en servicios contables y financieros en Colombia, por innovación, profesionalismo y la confianza que generamos como aliado estratégico de largo plazo.</p></div></div><div style={{marginTop:16,padding:24,borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.06)"}}><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F}}>Valores</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:8}}>{[["Transparencia","Información clara y veraz."],["Responsabilidad","Cumplimiento oportuno."],["Confidencialidad","Su información protegida."],["Excelencia","Calidad en cada servicio."],["Compromiso","Su éxito es nuestro objetivo."],["Ética","Integridad y rectitud."]].map(([v,d],i)=><div key={i} style={{padding:"8px 12px",borderRadius:8,background:"rgba(37,99,235,.04)"}}><div style={{fontSize:12,fontWeight:700,color:"#1B3A5C",fontFamily:F}}>✦ {v}</div><div style={{fontSize:10,color:"#5A6F8A",marginTop:1,fontFamily:F}}>{d}</div></div>)}</div></div></Sec>)}

/* BLOG */
function BlgS(){const[exp,sExp]=useState(null);return(<Sec id="blog" title="Artículos y guías" sub="BLOG"><p style={{textAlign:"center",fontSize:13,color:"#5A6F8A",marginTop:-34,marginBottom:36,fontFamily:F}}>Información basada en normatividad colombiana vigente y fuentes oficiales de la DIAN.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:18}}>{BLOG.map((p,i)=><div key={i} style={{borderRadius:14,background:"#fff",border:"1px solid rgba(37,99,235,.06)",overflow:"hidden"}}><div style={{padding:22}}><div style={{display:"flex",gap:6,marginBottom:8}}><span style={{fontSize:9,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.06)",padding:"2px 8px",borderRadius:100,fontFamily:F}}>{p.tag}</span><span style={{fontSize:9,color:"#7A8FA8",fontFamily:F}}>{p.date}</span></div><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:6,lineHeight:1.4,fontFamily:F}}>{p.title}</h3><p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.65,fontFamily:F}}>{p.excerpt}</p><button onClick={()=>sExp(exp===i?null:i)} style={{marginTop:10,fontSize:11,color:"#2563EB",fontWeight:600,fontFamily:F,background:"none",border:"none",cursor:"pointer",padding:0}}>{exp===i?"Cerrar ✕":"Leer más →"}</button></div>{exp===i&&<div style={{padding:"0 22px 22px",borderTop:"1px solid rgba(37,99,235,.05)"}}><div style={{paddingTop:16,fontSize:12,color:"#3a5068",lineHeight:1.85,fontFamily:F,whiteSpace:"pre-line"}}>{p.content}</div><div style={{marginTop:14,padding:12,borderRadius:8,background:"rgba(37,99,235,.04)"}}><p style={{fontSize:11,color:"#1B3A5C",fontWeight:600,fontFamily:F}}>¿Necesita ayuda con este trámite?</p><a href={WL} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Consultar por WhatsApp →</a></div></div>}</div>)}</div></Sec>)}

/* DOWNLOADS */
function DwS(){return(<Sec title="Formatos y guías gratuitas" sub="DESCARGAS" narrow><div style={{display:"grid",gap:10}}>{DOWNLOADS.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px",borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.06)",gap:14,flexWrap:"wrap"}}><div style={{flex:1,minWidth:220}}><h4 style={{fontSize:13,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>{d.n}</h4><p style={{fontSize:11,color:"#5A6F8A",marginTop:2,fontFamily:F}}>{d.d}</p></div><a href={`${WL}?text=${encodeURIComponent(`Hola, solicito el formato: ${d.n}`)}`} target="_blank" rel="noopener noreferrer" style={{padding:"7px 16px",borderRadius:8,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none",fontFamily:F,whiteSpace:"nowrap"}}>Solicitar por WhatsApp</a></div>)}</div></Sec>)}

/* FAQ */
function FaqS(){const[o,sO]=useState(null);return(<Sec id="faq" title="Preguntas frecuentes" sub="RESOLVEMOS SUS DUDAS" narrow><div style={{display:"grid",gap:9}}>{FAQS.map((f,i)=><div key={i} style={{borderRadius:11,background:"#fff",border:"1px solid rgba(37,99,235,.06)",overflow:"hidden",cursor:"pointer"}} onClick={()=>sO(o===i?null:i)}><div style={{padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:600,color:"#0B1D3A",fontFamily:F,flex:1}}>{f.q}</span><span style={{fontSize:16,color:"#2563EB",transform:o===i?"rotate(45deg)":"rotate(0)",transition:"transform .3s",marginLeft:8}}>+</span></div>{o===i&&<div style={{padding:"0 20px 14px",fontSize:12,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{f.a}</div>}</div>)}</div></Sec>)}

/* PRIVACY */
function Prv(){const[s,sS]=useState(false);return(<div style={{maxWidth:900,margin:"0 auto",padding:"0 24px"}}><div style={{textAlign:"center",marginBottom:18}}><button onClick={()=>sS(!s)} style={{background:"none",border:"none",color:"#2563EB",fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>{s?"Ocultar":"Consultar"} Política de Tratamiento de Datos Personales</button></div>{s&&<div style={{padding:28,borderRadius:14,background:"#fff",border:"1px solid rgba(37,99,235,.06)",marginBottom:36}}><h3 style={{fontFamily:FH,fontSize:18,fontWeight:700,color:"#0B1D3A",marginBottom:4,textAlign:"center"}}>Política de Tratamiento de Datos Personales</h3><p style={{fontSize:11,color:"#5A6F8A",marginBottom:22,textAlign:"center",fontFamily:F}}>CONTARAE — Servicios Contables, Tributarios y Financieros</p>{PRIVACY.map((s2,i)=><div key={i} style={{marginBottom:16}}><h4 style={{fontSize:13,fontWeight:700,color:"#1B3A5C",marginBottom:5,fontFamily:F}}>{s2.t}</h4><p style={{fontSize:11,color:"#5A6F8A",lineHeight:1.85,fontFamily:F}}>{s2.c}</p></div>)}<div style={{marginTop:20,padding:14,borderRadius:9,background:"rgba(37,99,235,.04)",textAlign:"center"}}><p style={{fontSize:10,color:"#1B3A5C",lineHeight:1.7,fontFamily:F}}>Al utilizar nuestros servicios usted autoriza el tratamiento de sus datos conforme a esta política.</p></div><p style={{fontSize:9,color:"#7A8FA8",marginTop:14,textAlign:"center",fontFamily:F}}>Última actualización: Abril 2026</p></div>}</div>)}

/* FOOTER */
function Ftr(){return(<><section id="contacto" style={{padding:"85px 24px"}}><div style={{maxWidth:660,margin:"0 auto",textAlign:"center",padding:"52px 34px",borderRadius:20,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-45,right:-45,width:160,height:160,borderRadius:"50%",background:"rgba(96,165,250,.1)"}}></div><h2 style={{fontFamily:FH,fontSize:"clamp(20px,3.5vw,32px)",fontWeight:700,color:"#fff",marginBottom:10,position:"relative"}}>¿Listo para ordenar sus finanzas?</h2><p style={{fontSize:13,color:"rgba(255,255,255,.65)",marginBottom:12,fontFamily:F,position:"relative"}}>Asesoría inicial sin costo. Contadores Públicos certificados.</p><p style={{fontSize:12,color:"rgba(255,255,255,.45)",marginBottom:26,fontFamily:F,position:"relative"}}>{EM} | +57 301 310 1050 | Bogotá, Colombia</p><div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",position:"relative"}}><a href={WL} target="_blank" rel="noopener noreferrer" style={{padding:"12px 28px",borderRadius:12,background:"#25D366",color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",fontFamily:F}}>WhatsApp</a><a href={`mailto:${EM}`} style={{padding:"12px 28px",borderRadius:12,background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,.16)",fontFamily:F}}>Correo</a></div></div></section><Prv/><footer style={{padding:"32px 24px",textAlign:"center",borderTop:"1px solid rgba(37,99,235,.06)"}}><LogoFooter/><p style={{fontSize:9,color:"#A0B0C0",marginTop:6,fontFamily:F}}>© 2026 CONTARAE · Bogotá D.C., Colombia · Todos los derechos reservados</p><p style={{fontSize:9,color:"#A0B0C0",marginTop:3,fontFamily:F}}>Ley 1581 de 2012 — Protección de Datos Personales</p></footer></>)}

/* ══════════ APP ══════════ */
function WaF(){return <a href={WL} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:28,right:28,zIndex:1000,width:60,height:60,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,.4)",transition:"transform .3s",textDecoration:"none",fontSize:28}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</a>}

export default function App(){
  useEffect(()=>{const obs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="translateY(0)";}});},{threshold:.08});setTimeout(()=>{document.querySelectorAll(".ai").forEach(el=>{el.style.opacity="0";el.style.transform="translateY(20px)";el.style.transition="opacity .6s ease,transform .6s ease";obs.observe(el);});},100);return()=>obs.disconnect();},[]);
  return(<div style={{fontFamily:F,color:"#0B1D3A",background:"#f8fafd",minHeight:"100vh"}}><style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;}::selection{background:#2563EB;color:#fff;}`}</style>
  <Nav/><Hero/>
  <div className="ai"><WhyUs/></div>
  <div className="ai"><SvcS/></div>
  <div className="ai"><PlnS/></div>
  <div className="ai"><Scenarios/></div>
  <div className="ai"><TrmS/></div>
  <div className="ai"><CrtS/></div>
  <div className="ai"><Tools/></div>
  <div className="ai"><Timeline/></div>
  <div className="ai"><AlertsS/></div>
  <div className="ai"><Abt/></div>
  <div className="ai"><BlgS/></div>
  <div className="ai"><DwS/></div>
  <div className="ai"><FaqS/></div>
  <div className="ai"><Ftr/></div>
  <WaF/>
  </div>);
}
