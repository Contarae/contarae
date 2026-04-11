import { useState, useEffect } from "react";

/* ══════════ CONFIG ══════════ */
const WA="573013101050",WL=`https://wa.me/${WA}`,EM="info@contarae.com",F="'Outfit',sans-serif",FH="'Libre Baskerville',serif";
const fm=n=>new Intl.NumberFormat("es-CO").format(n);
const wm=(msg)=>`${WL}?text=${encodeURIComponent(msg)}`;
const WOMPI_KEY="pub_prod_aEMHipEJ29G4pZOiIwgRC1GOvbqIYzP6";

/* ══════════ LOGO SVG ══════════ */
function LogoNavbar(){return(<div style={{display:"flex",alignItems:"center",gap:9}}><svg width="30" height="38" viewBox="0 0 32 40"><path d="M16 0 L32 10 L32 30 L16 40 L0 30 L0 10 Z" fill="#1B3A5C" stroke="#2563EB" strokeWidth="1.5"/><path d="M16 4 L28 11 L28 29 L16 36 L4 29 L4 11 Z" fill="none" stroke="#60A5FA" strokeWidth="0.8" opacity="0.5"/><text x="16" y="27" textAnchor="middle" fontFamily="Georgia,serif" fontSize="20" fill="#fff" fontWeight="700">C</text></svg><div><div style={{display:"flex"}}><span style={{fontFamily:FH,fontSize:17,fontWeight:700,color:"#fff",letterSpacing:"1.5px"}}>CONTA</span><span style={{fontFamily:FH,fontSize:17,fontWeight:700,color:"#60A5FA",letterSpacing:"1.5px"}}>RAE</span></div><div style={{fontSize:6.5,color:"rgba(255,255,255,0.55)",letterSpacing:"2.2px",fontFamily:F,marginTop:1}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div></div></div>)}

function LogoFooter(){return(<div style={{display:"flex",alignItems:"center",gap:11,justifyContent:"center",marginBottom:14}}><svg width="38" height="46" viewBox="0 0 56 64"><path d="M28 0 L56 16 L56 48 L28 64 L0 48 L0 16 Z" fill="#1B3A5C" stroke="#2563EB" strokeWidth="2.5"/><path d="M28 6 L50 19 L50 45 L28 58 L6 45 L6 19 Z" fill="none" stroke="#60A5FA" strokeWidth="1.2" opacity="0.5"/><text x="28" y="42" textAnchor="middle" fontFamily="Georgia,serif" fontSize="34" fill="#fff" fontWeight="700">C</text></svg><div><div style={{display:"flex"}}><span style={{fontFamily:FH,fontSize:22,fontWeight:700,color:"#fff",letterSpacing:"2px"}}>CONTA</span><span style={{fontFamily:FH,fontSize:22,fontWeight:700,color:"#60A5FA",letterSpacing:"2px"}}>RAE</span></div><div style={{height:1.5,background:"#60A5FA",opacity:.5,marginTop:3,marginBottom:5,borderRadius:2}}/><div style={{fontSize:7.5,color:"rgba(255,255,255,0.75)",letterSpacing:"2.8px",fontFamily:F}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div></div></div>)}

/* ══════════ ALL DATA ══════════ */
const WHY_US=[
  {icon:"⚡",t:"Respuesta inmediata",d:"Atendemos su solicitud en menos de 24 horas hábiles. Su tiempo es valioso y lo respetamos."},
  {icon:"🎓",t:"Contadores Públicos certificados",d:"Profesionales con tarjeta profesional vigente ante la Junta Central de Contadores y amplia experiencia."},
  {icon:"💻",t:"100% en línea",d:"Todos nuestros servicios se gestionan de forma digital, sin desplazamientos. Desde cualquier lugar de Colombia."},
  {icon:"💲",t:"Precios transparentes",d:"Conozca el valor antes de contratar. Sin costos ocultos, sin sorpresas, desde el primer contacto."},
  {icon:"🔒",t:"Confidencialidad garantizada",d:"Su información financiera está protegida conforme a la Ley 1581 de 2012 de protección de datos personales."},
  {icon:"🤝",t:"Acompañamiento permanente",d:"No solo hacemos el trámite, lo asesoramos en cada paso. Somos su aliado contable de largo plazo."}
];

const SERVICES=[
  {icon:"📊",t:"Contabilidad Integral",d:"Ciclo contable completo: registro, conciliaciones bancarias, estados financieros y aplicación de NIIF para pymes, microempresas y emprendedores en Colombia.",wa:"Hola CONTARAE, estoy interesado en el servicio de Contabilidad Integral para mi empresa. Me gustaría recibir más información."},
  {icon:"📋",t:"Asesoría Tributaria",d:"Declaración de renta, IVA, retención en la fuente, ICA, información exógena y planeación tributaria ante la DIAN. Optimizamos su carga fiscal.",wa:"Hola CONTARAE, necesito asesoría tributaria. Me gustaría conocer más sobre este servicio."},
  {icon:"💰",t:"Gestión Financiera",d:"Presupuestos, flujo de caja, indicadores financieros (KPIs), análisis de costos y reportes gerenciales personalizados para la toma de decisiones.",wa:"Hola CONTARAE, me interesa el servicio de Gestión Financiera. Quisiera recibir más información."},
  {icon:"👥",t:"Nómina y Seguridad Social",d:"Liquidación de salarios, prestaciones sociales, aportes a seguridad social, planilla PILA, contratos laborales y certificados de ingresos y retenciones.",wa:"Hola CONTARAE, necesito información sobre el servicio de Nómina y Seguridad Social."},
  {icon:"📄",t:"Certificaciones Contables",d:"Certificados de ingresos, patrimonio y más, firmados por Contador Público con tarjeta profesional vigente. Conforme a Ley 43 de 1990. Entrega digital inmediata.",wa:"Hola CONTARAE, necesito una certificación contable. Me gustaría conocer los requisitos."}
];

const PLANS=[
  {n:"Emprendedor",p:"Desde $500.000/mes",tg:"Independientes y microempresas",f:["Registro contable mensual completo","Declaraciones tributarias básicas (IVA, Rete fuente)","Conciliación bancaria mensual","Estados financieros trimestrales","Asesoría tributaria básica permanente","Soporte por WhatsApp"],wa:"Hola CONTARAE, estoy interesado en el Plan Emprendedor de contabilidad para mi negocio. ¿Me pueden dar más información?"},
  {n:"Empresarial",p:"Desde $1.000.000/mes",tg:"Pequeñas y medianas empresas",f:["Todo lo del Plan Emprendedor","Liquidación de nómina y seguridad social","Estados financieros mensuales","Información exógena DIAN","Indicadores financieros y KPIs","Planeación tributaria estratégica","Soporte prioritario"],pop:true,wa:"Hola CONTARAE, me interesa el Plan Empresarial de contabilidad. ¿Podrían darme más detalles?"},
  {n:"Premium",p:"Desde $2.000.000/mes",tg:"Empresas en crecimiento",f:["Todo lo del Plan Empresarial","Presupuestos y control de gestión","Dashboard financiero con Power BI","Análisis de costos por centro","Reuniones mensuales con informe gerencial","Asesor financiero dedicado","Soporte 24/7"],wa:"Hola CONTARAE, quiero conocer más sobre el Plan Premium de contabilidad. ¿Me pueden asesorar?"}
];

const SCENARIOS=[
  {e:"👔",t:"Soy empleado y necesito certificación para arrendar",d:"Le piden certificación de ingresos firmada por contador para el estudio de arrendamiento. La emitimos en horas.",l:"#certificacion"},
  {e:"💼",t:"Soy independiente y no sé si debo declarar renta",d:"Sus ingresos pueden obligarlo a declarar. Use nuestra herramienta gratuita para verificar al instante.",l:"#herramientas"},
  {e:"🏪",t:"Tengo una pyme y necesito organizar mi contabilidad",d:"Su empresa necesita estados financieros confiables y cumplimiento tributario. Nuestros planes lo cubren.",l:"#planes"},
  {e:"📋",t:"Me pidieron renovar la matrícula mercantil",d:"El plazo vence el 31 de marzo. No renovar genera sanciones. Nosotros hacemos el trámite completo.",l:"#tramites"},
  {e:"🏗️",t:"Quiero crear mi empresa legalmente en Colombia",d:"SAS, LTDA o S.A., registro en Cámara de Comercio, RUT y todos los requisitos para operar formalmente.",l:"#tramites"},
  {e:"🧮",t:"Quiero saber cuánto me retienen de mi salario",d:"Use nuestra calculadora gratuita de retención en la fuente y conozca el estimado al instante.",l:"#herramientas"}
];

const TRAMITES=[
  {icon:"📄",t:"Certificación de Ingresos",d:"Documento firmado por Contador Público que certifica sus ingresos con base en soportes verificables. Válido ante bancos, inmobiliarias, embajadas. 100% online, entrega inmediata.",l:"cert",wa:"Hola CONTARAE, necesito un certificado de ingresos firmado por Contador Público."},
  {icon:"📝",t:"Declaración de Renta",d:"Preparación y presentación ante la DIAN para personas naturales y jurídicas. Análisis de deducciones, rentas exentas. Plazos 2026: 12 agosto al 26 octubre.",l:"wa",wa:"Hola CONTARAE, necesito ayuda con mi declaración de renta. ¿Me pueden asesorar?"},
  {icon:"🏢",t:"Renovación Matrícula Mercantil",d:"Gestión ante Cámara de Comercio (art. 33 Código de Comercio). Plazo: 31 de marzo. Sanciones hasta 17 SMLMV por incumplimiento (Ley 1727/2014).",l:"wa",wa:"Hola CONTARAE, necesito renovar mi matrícula mercantil. ¿Cuáles son los requisitos y costos?"},
  {icon:"🧾",t:"Facturación Electrónica",d:"Implementación completa: habilitación DIAN, proveedor tecnológico, resolución de numeración, capacitación y soporte técnico.",l:"wa",wa:"Hola CONTARAE, necesito implementar facturación electrónica en mi empresa. ¿Me pueden orientar?"},
  {icon:"📊",t:"Información Exógena",d:"Preparación y presentación de medios magnéticos ante la DIAN. Sanciones desde $524.000 (10 UVT) hasta el 5% de sumas no reportadas (art. 651 ET).",l:"wa",wa:"Hola CONTARAE, necesito ayuda con la presentación de información exógena ante la DIAN."},
  {icon:"🏗️",t:"Creación de Empresas",d:"Constitución legal: tipo societario, estatutos, Cámara de Comercio, RUT, cuenta bancaria e inscripción como responsable de IVA.",l:"wa",wa:"Hola CONTARAE, quiero crear mi empresa legalmente en Colombia. ¿Cuáles son los pasos y costos?"}
];

const CT=[{r:"Hasta $2.000.000",v:80000},{r:"$2.000.001 a $4.000.000",v:100000},{r:"$4.000.001 a $7.000.000",v:120000},{r:"$7.000.001 a $12.000.000",v:150000},{r:"$12.000.001 a $20.000.000",v:180000},{r:"Más de $20.000.000",v:200000}];

const getTarifa=(total)=>{if(total<=2000000)return 80000;if(total<=4000000)return 100000;if(total<=7000000)return 120000;if(total<=12000000)return 150000;if(total<=20000000)return 180000;return 200000;};

const TIMELINE=[
  {m:"Ene-Mar",items:["Renovación matrícula mercantil (plazo 31 mar)","Retención en la fuente mensual","IVA bimestral (ene-feb)"],c:"#2563EB"},
  {m:"Abr-May",items:["2ª cuota renta grandes contribuyentes","Inicio información exógena","IVA bimestral (mar-abr)"],c:"#1B3A5C"},
  {m:"Jun-Jul",items:["3ª cuota grandes contribuyentes","Declaración renta personas jurídicas","IVA bimestral (may-jun)"],c:"#2563EB"},
  {m:"Ago-Oct",items:["Declaración renta personas naturales (12 ago - 26 oct)","IVA bimestral (jul-ago, sep-oct)"],c:"#0B1D3A"},
  {m:"Nov-Dic",items:["Precios de transferencia (15 dic)","Cierre contable año gravable","Preparación información exógena"],c:"#1B3A5C"}
];

const ALERTS=[
  {tag:"Importante",t:"Declaración de renta personas naturales 2026: plazos del 12 de agosto al 26 de octubre",d:"Abril 2026"},
  {tag:"Normativo",t:"Reforma Laboral 2025 (Ley 2466): impacto en liquidación de nómina y prestaciones sociales",d:"Marzo 2026"},
  {tag:"DIAN",t:"Nuevos topes para declarar renta año gravable 2025: UVT $49.799 — Verifique si está obligado",d:"Febrero 2026"},
  {tag:"Recordatorio",t:"Plazo renovación matrícula mercantil: hasta el 31 de marzo de 2026 ante Cámara de Comercio",d:"Enero 2026"}
];

const BLOG=[
{title:"Declaración de renta personas naturales 2026: guía completa",tag:"Tributario",date:"Abril 2026",ex:"Topes, plazos, documentos y sanciones para la declaración del año gravable 2025 ante la DIAN.",content:`La declaración de renta es el informe ante la DIAN para reportar ingresos, patrimonio, gastos, deducciones y retenciones del año gravable anterior.

PLAZOS 2026
Del 12 de agosto al 26 de octubre de 2026, según los dos últimos dígitos del NIT (Decreto 2229 de 2023).

¿QUIÉN DEBE DECLARAR? (Año gravable 2025)
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
Extemporaneidad: 5% del impuesto a cargo por mes o fracción (art. 641-642 ET). Sanción mínima 2026: $524.000 (10 UVT). No declarar: hasta 20% de consignaciones o ingresos brutos.`},
{title:"Renovación de matrícula mercantil: todo lo que debe saber",tag:"Empresarial",date:"Marzo 2026",ex:"Plazos, requisitos, costos y consecuencias de no renovar ante la Cámara de Comercio.",content:`Obligatoria según artículo 33 del Código de Comercio. Plazo: hasta el 31 de marzo de cada año.

¿QUIÉN DEBE RENOVAR?
Todas las personas naturales y jurídicas que ejerzan actividades comerciales y sus establecimientos de comercio.

INFORMACIÓN REQUERIDA
Información financiera a dic 31, códigos CIIU actualizados, datos de contacto y número de empleados.

CONSECUENCIAS DE NO RENOVAR
• Sanciones de Superintendencia de Sociedades (hasta 17 SMLMV)
• Marcación como "comerciante no cumplidor"
• Restricciones para créditos y licitaciones
• Cancelación por 5 años sin renovar (Ley 1727 de 2014)

CÓMO RENOVAR
100% en línea a través del portal de la Cámara de Comercio o la Ventanilla Única Empresarial (VUE).`},
{title:"Certificación de ingresos en Colombia: guía completa",tag:"Certificaciones",date:"Marzo 2026",ex:"Qué es, base legal, soportes necesarios y cómo solicitarla de forma rápida.",content:`Documento suscrito por Contador Público con tarjeta profesional vigente que certifica el nivel de ingresos con base en soportes verificables.

BASE LEGAL
Ley 43 de 1990 (arts. 1 y 10): firma del Contador otorga fe pública. Concepto CTCP 1106 de 2019: certificaciones soportadas en documentación verificable.

SOPORTES NECESARIOS
• Laborales: desprendibles de nómina o certificado del empleador
• Honorarios: facturas, cuentas de cobro y extractos bancarios
• Arriendos: contratos y comprobantes de pago
• Pensiones: desprendible de mesada pensional
• Inversiones: certificados de la entidad financiera

¿CUÁNDO SE NECESITA?
Créditos bancarios, arrendamientos, compra de vehículo, trámites de visa, licitaciones, libreta militar y trámites académicos.`},
{title:"Facturación electrónica en Colombia: obligaciones y requisitos",tag:"Tributario",date:"Febrero 2026",ex:"Quiénes están obligados, requisitos técnicos y cómo implementarla.",content:`Sistema de emisión de facturas digital conforme a requisitos DIAN.

MARCO NORMATIVO
Artículo 616-1 del Estatuto Tributario y Resolución DIAN 000042 de 2020.

OBLIGADOS
• Personas jurídicas que vendan bienes o presten servicios
• Personas naturales responsables de IVA
• Contribuyentes del Régimen Simple (RST)

REQUISITOS TÉCNICOS
• Habilitación como facturador electrónico ante la DIAN
• Proveedor tecnológico autorizado
• Resolución de numeración vigente
• Software compatible (XML estándar UBL 2.1)
• Certificado digital de firma electrónica`},
{title:"5 errores comunes en la contabilidad de pymes",tag:"Contable",date:"Enero 2026",ex:"Los errores más frecuentes de las pymes colombianas y cómo evitarlos.",content:`ERROR 1: NO LLEVAR CONTABILIDAD FORMAL
Código de Comercio (arts. 19 y 48-74) y Ley 1314 de 2009 obligan a NIIF.

ERROR 2: MEZCLAR FINANZAS PERSONALES Y EMPRESARIALES
Genera distorsiones y puede considerarse defraudación fiscal.

ERROR 3: NO CONCILIAR BANCOS MENSUALMENTE
Oculta errores, fraudes o transacciones no registradas.

ERROR 4: DESCONOCER PLAZOS TRIBUTARIOS
Sanciones desde $524.000 (10 UVT para 2026).

ERROR 5: NO CONSERVAR SOPORTES CONTABLES
Mínimo 5 años. Sin soportes DIAN desconoce costos y deducciones.`},
{title:"Información exógena DIAN: ¿qué es y quién debe reportarla?",tag:"Tributario",date:"Enero 2026",ex:"Medios magnéticos: obligados, plazos y sanciones.",content:`Reporte de operaciones con terceros ante la DIAN. Principal herramienta de cruce tributario.

¿QUÉ SE REPORTA?
Pagos a terceros, ingresos, retenciones, IVA, cuentas por cobrar/pagar, socios y donaciones.

PLAZOS 2026
• Grandes contribuyentes: 28 abril al 13 mayo
• Personas jurídicas y naturales: 14 mayo al 12 junio

SANCIONES (Art. 651 ET)
• No enviar: hasta 5% de sumas no reportadas
• Errores: hasta 4% de sumas erróneas
• Extemporaneidad: hasta 3%
• Mínima: $524.000 (10 UVT)`}
];

const DOWNLOADS=[
  {n:"Checklist Declaración de Renta PN",d:"Lista completa de documentos para su declaración."},
  {n:"Autorización Tratamiento de Datos",d:"Formato conforme a Ley 1581/2012."},
  {n:"Guía Soportes Certificación de Ingresos",d:"Soportes según tipo de ingreso."},
  {n:"Calendario Tributario 2026",d:"Fechas de todas las obligaciones tributarias."},
  {n:"Modelo Certificación de Ingresos",d:"Modelo conforme a Ley 43/1990."}
];

const FAQS=[
  {q:"¿Cuánto cuesta una certificación de ingresos?",a:"Desde $80.000 COP según rango de ingresos. Incluye revisión de soportes, elaboración y firma por Contador Público."},
  {q:"¿Qué documentos necesito para declarar renta?",a:"Certificado de ingresos y retenciones (formulario 220), extractos bancarios, certificados de inversiones, información de bienes y deudas, y certificados de aportes a salud y pensión."},
  {q:"¿Cómo funciona el plan mensual?",a:"Elija el plan según su empresa. Nos encargamos de toda la gestión contable, tributaria y financiera con reportes periódicos. Precios dependen del volumen de información."},
  {q:"¿Puedo contratar un servicio puntual?",a:"Sí. Certificaciones, declaraciones, renovación de matrícula, creación de empresas y cualquier trámite sin necesidad de plan mensual."},
  {q:"¿Cuánto tarda la renovación de matrícula?",a:"De 1 a 3 días hábiles con documentación completa. Recomendamos hacerlo antes del 31 de marzo."},
  {q:"¿Qué medios de pago aceptan?",a:"Wompi (tarjeta crédito/débito, PSE), Nequi, Daviplata y transferencia bancaria."},
  {q:"¿Cómo sé si debo declarar renta?",a:"Depende de ingresos, patrimonio, compras, tarjeta de crédito y consignaciones. Use nuestra herramienta gratuita en Herramientas."},
  {q:"¿Qué es la información exógena?",a:"Medios magnéticos: reporte de operaciones con terceros ante la DIAN. Obligatorio para contribuyentes que superen ciertos topes."}
];

const PRIVACY=[
  {t:"1. Identificación del Responsable",c:`CONTARAE — Servicios Contables, Tributarios y Financieros. Bogotá D.C., Colombia. Correo: ${EM}. WhatsApp: +57 301 310 1050. Web: www.contarae.com.`},
  {t:"2. Marco Normativo",c:"Constitución Política (artículo 15), Ley Estatutaria 1581 de 2012, Decreto 1074 de 2015 y normas concordantes."},
  {t:"3. Definiciones",c:"Conforme al artículo 3, Ley 1581/2012: Dato personal: información vinculada a personas naturales. Dato sensible: afecta intimidad o genera discriminación. Titular: persona cuyos datos se tratan. Responsable: quien decide sobre la base de datos. Encargado: quien trata por cuenta del responsable. Tratamiento: cualquier operación sobre datos. Autorización: consentimiento previo, expreso e informado. Base de datos: conjunto organizado de datos."},
  {t:"4. Principios Rectores",c:"Art. 4 Ley 1581/2012: (a) Legalidad (b) Finalidad (c) Libertad (d) Veracidad (e) Transparencia (f) Acceso restringido (g) Seguridad (h) Confidencialidad."},
  {t:"5. Datos Recopilados",c:"Identificación (nombre, cédula), contacto (dirección, teléfono, correo), financieros/tributarios (ingresos, patrimonio, extractos, estados financieros), laborales cuando sean necesarios."},
  {t:"6. Finalidades",c:"(a) Servicios contables, tributarios y financieros (b) Certificaciones (c) Declaraciones ante DIAN (d) Nómina y seguridad social (e) Comunicación sobre servicios (f) Información normativa (g) Facturación (h) Consultas y reclamos (i) Obligaciones legales."},
  {t:"7. Derechos del Titular",c:"Art. 8 Ley 1581/2012: (a) Conocer, actualizar y rectificar datos (b) Solicitar prueba de autorización (c) Ser informado del uso (d) Quejas ante SIC (e) Revocar autorización (f) Acceso gratuito."},
  {t:"8. Autorización",c:"Previa, expresa e informada mediante formularios físicos/electrónicos, sitio web o WhatsApp. Se conserva conforme al art. 9 Ley 1581 y art. 2.2.2.25.2.4 Decreto 1074/2015."},
  {t:"9. Datos Sensibles",c:"No se recopilan sistemáticamente. En caso excepcional se informa al titular conforme a arts. 5 y 6 Ley 1581/2012."},
  {t:"10. Datos de Menores",c:"No se tratan salvo necesidad del representante legal (ej: dependientes para renta), conforme al art. 7 Ley 1581/2012."},
  {t:"11. Deberes del Responsable",c:"Art. 17 Ley 1581: garantizar habeas data, conservar autorización, informar finalidad y derechos, garantizar veracidad, seguridad, rectificación y tramitar consultas/reclamos."},
  {t:"12. Medidas de Seguridad",c:"Técnicas: almacenamiento seguro, contraseñas robustas, respaldos, canales cifrados. Humanas: capacitación, acuerdos de confidencialidad. Administrativas: procedimientos internos, controles de acceso, protocolos ante incidentes."},
  {t:"13. Transferencia de Datos",c:"Solo por cumplimiento legal (DIAN, Cámaras de Comercio) o autorización expresa del titular. Internacional: conforme al art. 26 Ley 1581."},
  {t:"14. Consultas y Reclamos",c:`Consultas (art. 14): máximo 10 días hábiles, prorrogable 5. Reclamos (art. 15): máximo 15 días hábiles, prorrogable 8. Canal: ${EM} o WhatsApp +57 301 310 1050.`},
  {t:"15. Canales de Atención",c:`Correo: ${EM}. WhatsApp: +57 301 310 1050. Bogotá D.C., Colombia. Lunes a viernes 8:00 a.m. a 6:00 p.m.`},
  {t:"16. Vigencia",c:"Rige desde su publicación en www.contarae.com. Datos conservados según finalidades y obligaciones legales. Modificaciones publicadas en el sitio web."},
  {t:"17. Autoridad de Vigilancia",c:"Superintendencia de Industria y Comercio (SIC) — Delegatura para Protección de Datos Personales. Web: www.sic.gov.co. Línea: 01 8000 910 165."}
];

/* ══════════ FORMAT HELPERS ══════════ */
const fmtInput=(val)=>{const nums=val.replace(/\D/g,"");if(!nums)return"";return"$ "+fm(parseInt(nums));};
const parseNum=(val)=>parseInt(val.replace(/\D/g,""))||0;

/* ══════════ UI HELPERS ══════════ */
const IS={width:"100%",padding:"10px 12px",borderRadius:8,border:"1px solid #d0d9e8",fontSize:13,fontFamily:F,outline:"none",background:"#f8fafd",boxSizing:"border-box"};
const Sec=({id,title,sub,bg,children,narrow})=>(<section id={id} style={{padding:"80px 24px",background:bg||"transparent"}}><div style={{maxWidth:narrow?900:1100,margin:"0 auto"}}>{title&&<div style={{textAlign:"center",marginBottom:44}}>{sub&&<div style={{fontSize:11,fontWeight:600,color:"#2563EB",letterSpacing:"2px",marginBottom:8,fontFamily:F}}>{sub}</div>}<h2 style={{fontFamily:FH,fontSize:"clamp(21px,3.5vw,34px)",fontWeight:700,color:"#0B1D3A"}}>{title}</h2></div>}{children}</div></section>);
const Cd=({children,s})=><div style={{padding:22,borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.07)",transition:"transform .3s,box-shadow .3s",...s}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(37,99,235,.06)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>{children}</div>;

/* ══════════ NAV WITH HAMBURGER ══════════ */
function Nav(){
  const[open,setOpen]=useState(false);
  const items=[["Inicio","inicio"],["Servicios","servicios"],["Planes","planes"],["Certificación","certificacion"],["Herramientas","herramientas"],["Nosotros","nosotros"],["Blog","blog"],["Contacto","contacto"]];
  return(<nav style={{position:"fixed",top:0,width:"100%",zIndex:200,padding:"8px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(8,14,27,.96)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(96,165,250,.1)"}}>
    <LogoNavbar/>
    {/* Desktop menu */}
    <div style={{display:"flex",gap:15,alignItems:"center"}} className="dsk-menu">
      {items.map(([l,id])=><a key={id} href={`#${id}`} style={{textDecoration:"none",color:"rgba(255,255,255,.6)",fontSize:11,fontWeight:500,fontFamily:F,transition:"color .2s"}} onMouseEnter={e=>e.target.style.color="#60A5FA"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.6)"}>{l}</a>)}
      <a href={wm("Hola CONTARAE, me gustaría recibir asesoría sobre sus servicios contables.")} target="_blank" rel="noopener noreferrer" style={{padding:"5px 14px",borderRadius:8,background:"linear-gradient(135deg,#2563EB,#60A5FA)",color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none"}}>WhatsApp</a>
    </div>
    {/* Hamburger */}
    <button onClick={()=>setOpen(!open)} className="ham-btn" style={{background:"none",border:"none",cursor:"pointer",padding:6,display:"none"}} aria-label="Menú">
      <div style={{width:22,height:2,background:"#fff",marginBottom:5,transition:"all .3s",transform:open?"rotate(45deg) translate(5px,5px)":"none"}}/>
      <div style={{width:22,height:2,background:"#fff",marginBottom:5,opacity:open?0:1,transition:"all .3s"}}/>
      <div style={{width:22,height:2,background:"#fff",transition:"all .3s",transform:open?"rotate(-45deg) translate(5px,-5px)":"none"}}/>
    </button>
    {/* Mobile menu */}
    {open&&<div style={{position:"absolute",top:"100%",left:0,width:"100%",background:"rgba(8,14,27,.98)",padding:"16px 24px",borderBottom:"1px solid rgba(96,165,250,.1)"}} className="mob-menu">
      {items.map(([l,id])=><a key={id} href={`#${id}`} onClick={()=>setOpen(false)} style={{display:"block",padding:"11px 0",color:"rgba(255,255,255,.75)",fontSize:14,fontWeight:500,fontFamily:F,textDecoration:"none",borderBottom:"1px solid rgba(255,255,255,.06)"}}>{l}</a>)}
      <a href={wm("Hola CONTARAE, me gustaría recibir asesoría.")} target="_blank" rel="noopener noreferrer" onClick={()=>setOpen(false)} style={{display:"block",marginTop:12,padding:"11px 20px",borderRadius:10,background:"#25D366",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",textAlign:"center",fontFamily:F}}>WhatsApp</a>
    </div>}
  </nav>);
}

/* ══════════ URGENCY BANNER ══════════ */
function Banner(){
  const[show,setShow]=useState(true);
  if(!show)return null;
  return(<div style={{position:"fixed",top:56,width:"100%",zIndex:190,background:"linear-gradient(90deg,#1B3A5C,#2563EB)",padding:"8px 24px",display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
    <span style={{fontSize:12,color:"#fff",fontFamily:F}}>🔥 <strong>¿Necesita su certificación de ingresos HOY?</strong> Solicítela ahora y recíbala en horas</span>
    <a href="#certificacion" style={{fontSize:11,color:"#fff",fontWeight:700,background:"rgba(255,255,255,.2)",padding:"3px 12px",borderRadius:100,textDecoration:"none",fontFamily:F}}>Solicitar</a>
    <button onClick={()=>setShow(false)} style={{background:"none",border:"none",color:"rgba(255,255,255,.5)",cursor:"pointer",fontSize:16,padding:0,marginLeft:8}}>✕</button>
  </div>);
}

/* ══════════ HERO ══════════ */
function Hero(){return(
  <section id="inicio" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"140px 24px 80px",position:"relative",overflow:"hidden"}}>
    <div style={{position:"absolute",top:"-15%",right:"-8%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 70%)"}}/>
    <div style={{maxWidth:780,position:"relative",zIndex:1}}>
      <div style={{display:"inline-block",padding:"5px 18px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:11,fontWeight:600,color:"#60A5FA",marginBottom:26,letterSpacing:"1.5px",fontFamily:F}}>CONTADORES PÚBLICOS CERTIFICADOS EN BOGOTÁ</div>
      <h1 style={{fontFamily:FH,fontSize:"clamp(27px,5vw,50px)",fontWeight:700,lineHeight:1.12,color:"#0B1D3A",marginBottom:20}}>Su tranquilidad financiera <span style={{background:"linear-gradient(135deg,#1B3A5C,#60A5FA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>comienza aquí</span></h1>
      <p style={{fontSize:15,color:"#5A6F8A",lineHeight:1.75,maxWidth:600,margin:"0 auto 34px",fontFamily:F}}>Servicios contables, tributarios y financieros para empresas y personas naturales en Colombia. Outsourcing contable para microempresas, emprendedores y pymes.</p>
      <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:14}}>
        <a href="#certificacion" style={{padding:"13px 24px",borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",boxShadow:"0 4px 18px rgba(37,99,235,.3)",fontFamily:F,textAlign:"center",lineHeight:1.4}}>Solicite su certificado de ingresos firmado<br/>por Contador Público — rápido y seguro</a>
        <a href="#planes" style={{padding:"13px 24px",borderRadius:12,color:"#1B3A5C",fontSize:13,fontWeight:600,textDecoration:"none",border:"2px solid rgba(27,58,92,.18)",fontFamily:F}}>Ver Planes de Contabilidad</a>
      </div>
      <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap"}}>
        {[["📝 Declaración de Renta","#tramites"],["💬 Asesoría Tributaria Gratis",wm("Hola CONTARAE, me gustaría agendar una asesoría tributaria gratuita.")],["🏗️ Crear mi Empresa","#tramites"]].map(([l,h],i)=>
          <a key={i} href={h} target={h.startsWith("http")?"_blank":undefined} rel={h.startsWith("http")?"noopener noreferrer":undefined} style={{padding:"8px 16px",borderRadius:10,background:"rgba(37,99,235,.06)",color:"#1B3A5C",fontSize:12,fontWeight:600,textDecoration:"none",fontFamily:F,transition:"background .2s"}} onMouseEnter={e=>e.target.style.background="rgba(37,99,235,.12)"} onMouseLeave={e=>e.target.style.background="rgba(37,99,235,.06)"}>{l}</a>
        )}
      </div>
    </div>
  </section>
)}

/* ══════════ WHY US ══════════ */
function WhyUs(){return(<Sec title="¿Por qué elegir a CONTARAE?" sub="NUESTROS DIFERENCIALES"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16}}>{WHY_US.map((w,i)=><Cd key={i}><div style={{fontSize:26,marginBottom:6}}>{w.icon}</div><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{w.t}</h3><p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{w.d}</p></Cd>)}</div></Sec>)}

/* ══════════ SERVICES ══════════ */
function SvcS(){return(<Sec id="servicios" title="Soluciones profesionales para su negocio" sub="NUESTROS SERVICIOS"><p style={{textAlign:"center",fontSize:13,color:"#5A6F8A",marginTop:-30,marginBottom:34,maxWidth:650,margin:"-30px auto 34px",fontFamily:F}}>Outsourcing contable para microempresas, emprendedores y pymes en Colombia. Cada servicio garantiza cumplimiento normativo.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:16}}>{SERVICES.map((s,i)=><Cd key={i}><div style={{fontSize:26,marginBottom:6}}>{s.icon}</div><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{s.t}</h3><p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{s.d}</p><a href={wm(s.wa)} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:8,fontSize:11,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar asesoría →</a></Cd>)}</div></Sec>)}

/* ══════════ PLANS ══════════ */
function PlnS(){return(<Sec id="planes" title="Contabilidad integral para su empresa" sub="PLANES MENSUALES" bg="linear-gradient(180deg,rgba(37,99,235,.03) 0%,transparent 100%)"><p style={{textAlign:"center",fontSize:12,color:"#5A6F8A",marginTop:-30,marginBottom:32,fontFamily:F}}>Precios de referencia según volumen de información. Contador para microempresas y emprendedores desde $500.000/mes.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:16}}>{PLANS.map((p,i)=><div key={i} style={{padding:26,borderRadius:15,background:p.pop?"linear-gradient(135deg,#0B1D3A,#1B3A5C)":"#fff",border:p.pop?"none":"1px solid rgba(37,99,235,.07)",position:"relative",color:p.pop?"#fff":"#0B1D3A"}}>{p.pop&&<div style={{position:"absolute",top:-10,left:"50%",transform:"translateX(-50%)",background:"#60A5FA",color:"#fff",fontSize:9,fontWeight:700,padding:"3px 12px",borderRadius:100,fontFamily:F}}>MÁS POPULAR</div>}<h3 style={{fontSize:18,fontWeight:700,fontFamily:F}}>{p.n}</h3><div style={{fontSize:11,opacity:.6,marginBottom:8,fontFamily:F}}>{p.tg}</div><div style={{fontSize:19,fontWeight:700,marginBottom:14,fontFamily:FH,color:p.pop?"#60A5FA":"#2563EB"}}>{p.p}</div>{p.f.map((f,j)=><div key={j} style={{fontSize:12,padding:"3px 0",borderBottom:`1px solid ${p.pop?"rgba(255,255,255,.06)":"rgba(37,99,235,.04)"}`,fontFamily:F,opacity:.85}}>✓ {f}</div>)}<a href={wm(p.wa)} target="_blank" rel="noopener noreferrer" style={{display:"block",marginTop:16,padding:"10px 18px",borderRadius:10,background:p.pop?"#60A5FA":"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",textAlign:"center",fontFamily:F}}>Solicitar información</a></div>)}</div></Sec>)}

/* ══════════ SCENARIOS ══════════ */
function ScnS(){return(<Sec title="¿Se identifica con alguno de estos casos?" sub="¿EN QUÉ LE PODEMOS AYUDAR?"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16}}>{SCENARIOS.map((s,i)=><a key={i} href={s.l} style={{textDecoration:"none",color:"inherit"}}><Cd s={{cursor:"pointer"}}><div style={{fontSize:26,marginBottom:6}}>{s.e}</div><h3 style={{fontSize:13,fontWeight:700,color:"#0B1D3A",marginBottom:4,fontFamily:F}}>{s.t}</h3><p style={{fontSize:11,color:"#5A6F8A",lineHeight:1.65,fontFamily:F}}>{s.d}</p><span style={{display:"inline-block",marginTop:6,fontSize:11,color:"#2563EB",fontWeight:600,fontFamily:F}}>Ver solución →</span></Cd></a>)}</div></Sec>)}

/* ══════════ TRAMITES ══════════ */
function TrmS(){return(<Sec id="tramites" title="Trámites más solicitados" sub="TRÁMITES CLAVE"><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(290px,1fr))",gap:16}}>{TRAMITES.map((t,i)=><Cd key={i}><div style={{fontSize:24,marginBottom:5}}>{t.icon}</div><h3 style={{fontSize:13,fontWeight:700,color:"#0B1D3A",marginBottom:4,fontFamily:F}}>{t.t}</h3><p style={{fontSize:11,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{t.d}</p><a href={t.l==="cert"?"#certificacion":wm(t.wa)} target={t.l==="wa"?"_blank":undefined} rel={t.l==="wa"?"noopener noreferrer":undefined} style={{display:"inline-block",marginTop:7,fontSize:11,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>{t.l==="cert"?"Solicitar al instante →":"Solicitar servicio →"}</a></Cd>)}</div></Sec>)}
/* ══════════ CERTIFICATION WITH WOMPI ══════════ */
function CrtS(){
  const[step,setStep]=useState(1);
  const[f,sF]=useState({n:"",cc:"",tel:"",em:"",dir:"",ent:"",per:"",iL:"",iP:"",iD:"",iI:"",iA:"",iR:"",iO:"",oD:"",cm:""});
  const[accepted,setAccepted]=useState(false);
  const[paid,setPaid]=useState(false);
  const u=(k,v)=>sF(p=>({...p,[k]:v}));
  const uFmt=(k,v)=>sF(p=>({...p,[k]:fmtInput(v)}));

  const ings=[["Ingresos laborales","iL","Salario y prestaciones de relación laboral."],["Pensiones","iP","Mesada pensional."],["Dividendos","iD","Utilidades como socio o accionista."],["Inversiones","iI","Rendimientos de CDTs, fondos, acciones."],["Arriendos","iA","Cánones de inmuebles propios."],["Remesas","iR","Dinero recibido del exterior."]];
  const totalIng=ings.reduce((s,[,k])=>s+parseNum(f[k]),0)+parseNum(f.iO);
  const tarifa=getTarifa(totalIng);

  const openWompi=async()=>{
    const ref=`CERT-${f.cc}-${Date.now()}`;
    const amountCents=tarifa*100;
    try{
      // Get signature from serverless function
      const sigRes=await fetch("/.netlify/functions/wompi-signature",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({reference:ref,amountInCents:amountCents,currency:"COP"})
      });
      const sigData=await sigRes.json();
      if(!sigData.signature){alert("Error generando firma de pago. Intente nuevamente.");return;}

      const checkout=new window.WidgetCheckout({
        currency:"COP",
        amountInCents:amountCents,
        reference:ref,
        publicKey:WOMPI_KEY,
        "signature:integrity":sigData.signature,
        redirectUrl:"https://contarae.com"
      });
      checkout.open(function(result){
        const tx=result.transaction;
        if(tx && tx.status==="APPROVED"){
          const formData=new URLSearchParams();
          formData.append("form-name","certificacion");
          formData.append("nombre",f.n);
          formData.append("cedula",f.cc);
          formData.append("telefono",f.tel);
          formData.append("correo",f.em);
          formData.append("destino",f.dir);
          formData.append("entidad",f.ent);
          formData.append("periodo",f.per);
          formData.append("ingresos_laborales",f.iL);
          formData.append("pensiones",f.iP);
          formData.append("dividendos",f.iD);
          formData.append("inversiones",f.iI);
          formData.append("arriendos",f.iA);
          formData.append("remesas",f.iR);
          formData.append("otros_ingresos",f.iO);
          formData.append("otros_descripcion",f.oD);
          formData.append("total_ingresos","$"+fm(totalIng));
          formData.append("tarifa_pagada","$"+fm(tarifa));
          formData.append("referencia_wompi",ref);
          formData.append("estado_pago","APROBADO");
          formData.append("comentarios",f.cm);
          formData.append("declaracion_juramentada","ACEPTADA");
          fetch("/",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:formData.toString()}).catch(()=>{});
          setPaid(true);
        } else if(tx && tx.status==="DECLINED"){
          alert("El pago fue rechazado. Por favor intente con otro medio de pago.");
        } else if(tx && tx.status==="ERROR"){
          alert("Ocurrió un error procesando el pago. Intente nuevamente.");
        }
      });
    }catch(err){alert("Error de conexión. Intente nuevamente.");}
  };

  const resumenWA=`Hola CONTARAE, confirmo mi solicitud de certificación de ingresos:%0ANombre: ${f.n}%0ACédula: ${f.cc}%0ATotal ingresos: $${fm(totalIng)}%0AValor pagado: $${fm(tarifa)}%0ADestino: ${f.ent||f.dir}%0AAdjunto mis soportes documentales.`;

  const progBar=(<div style={{display:"flex",gap:4,marginBottom:28}}>{[1,2,3,4].map(s=><div key={s} style={{flex:1,height:4,borderRadius:4,background:s<=step?"#2563EB":"#e0e7f0",transition:"background .3s"}}/>)}</div>);

  return(<Sec id="certificacion" title="Certificación de ingresos por Contador Público" sub="CERTIFICADO DE INGRESOS ONLINE COLOMBIA" bg="linear-gradient(180deg,rgba(37,99,235,.04) 0%,transparent 100%)" narrow>
    <p style={{textAlign:"center",fontSize:13,color:"#5A6F8A",marginTop:-30,marginBottom:8,fontFamily:F}}>Solicite su certificado de ingresos firmado por Contador Público con tarjeta profesional vigente.</p>
    <p style={{textAlign:"center",fontSize:12,color:"#5A6F8A",marginBottom:34,fontFamily:F}}>Certificado de ingresos para arriendo, crédito bancario, visa, licitaciones y más. 100% en línea. Entrega inmediata en Bogotá y toda Colombia.</p>

    {/* Info blocks */}
    <div style={{display:"grid",gap:14,marginBottom:28}}>{[
      ["¿Qué es un certificado de ingresos?","Documento suscrito por Contador Público con tarjeta profesional vigente ante la Junta Central de Contadores que certifica sus ingresos mensuales o anuales con base en soportes documentales verificables como extractos bancarios, contratos, facturas y comprobantes de pago."],
      ["¿Por qué debe estar firmado por un Contador Público?","Según el artículo 10 de la Ley 43 de 1990, la firma otorga fe pública al documento. El Consejo Técnico de la Contaduría Pública (CTCP), mediante Concepto 1106 de 2019, ratifica que las certificaciones deben estar soportadas en documentación verificable."],
      ["¿Para qué necesita una certificación de ingresos?","Para solicitudes de crédito bancario o hipotecario, arrendamiento de inmuebles, compra de vehículo, trámites de visa ante embajadas, procesos de contratación o licitación, definición de situación militar y trámites académicos."],
      ["¿Cuánto cuesta el certificado de ingresos?","Desde $80.000 COP dependiendo del rango de ingresos mensuales. Incluye revisión profesional de soportes, elaboración del documento y firma por Contador Público. Entrega digital en PDF."]
    ].map(([t,d],i)=><div key={i} style={{padding:20,borderRadius:11,background:"#fff",border:"1px solid rgba(37,99,235,.06)"}}><h3 style={{fontSize:13,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{t}</h3><p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{d}</p></div>)}</div>

    {/* Tarifas */}
    <div style={{padding:22,borderRadius:13,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",marginBottom:28,color:"#fff"}}><h3 style={{fontSize:15,fontWeight:700,marginBottom:12,textAlign:"center",fontFamily:F}}>Tarifas certificado de ingresos</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(210px,1fr))",gap:7}}>{CT.map((t,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",padding:"8px 12px",borderRadius:6,background:"rgba(255,255,255,.07)",fontFamily:F}}><span style={{fontSize:11,opacity:.8}}>{t.r}</span><span style={{fontSize:12,fontWeight:700,color:"#60A5FA"}}>${fm(t.v)}</span></div>)}</div><div style={{marginTop:12,padding:10,borderRadius:7,background:"rgba(96,165,250,.13)",fontSize:11,fontFamily:F,display:"flex",alignItems:"center",gap:6}}>🔒 <span>Pago seguro procesado por <strong>Wompi</strong>. Tarjeta, PSE, Nequi o Daviplata.</span></div></div>

    {/* FORM */}
    <div style={{padding:26,borderRadius:15,background:"#fff",border:"1px solid rgba(37,99,235,.08)",boxShadow:"0 5px 22px rgba(37,99,235,.04)"}}>
      <h3 style={{fontSize:17,fontWeight:700,color:"#0B1D3A",marginBottom:6,textAlign:"center",fontFamily:F}}>Formulario de Solicitud</h3>
      <p style={{fontSize:11,color:"#5A6F8A",marginBottom:20,textAlign:"center",fontFamily:F}}>Paso {step} de 4</p>
      {progBar}

      {!paid ? (<>
        {/* STEP 1 */}
        {step===1&&<div><h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:10,fontFamily:F}}>📋 Paso 1: Datos Personales</h4><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8}}>{[["Nombre completo","n"],["Número de cédula","cc"],["Teléfono / WhatsApp","tel"],["Correo electrónico","em"]].map(([l,k])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l}</label><input style={IS} value={f[k]} onChange={e=>u(k,e.target.value)} required/></div>)}</div><div style={{textAlign:"right",marginTop:14}}><button onClick={()=>f.n&&f.cc&&f.tel&&f.em?setStep(2):alert("Complete todos los campos")} style={{padding:"10px 28px",borderRadius:10,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div></div>}

        {/* STEP 2 */}
        {step===2&&<div><h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:10,fontFamily:F}}>🏢 Paso 2: Destino de la Certificación</h4><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:8}}><div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Dirigida a</label><select style={{...IS,cursor:"pointer"}} value={f.dir} onChange={e=>u("dir",e.target.value)}><option value="">Seleccione...</option>{["Banco o entidad financiera","Inmobiliaria o arrendador","Embajada o trámite migratorio","Concesionario de vehículos","Entidad pública","Contratación o licitación","Otro destino"].map(o=><option key={o}>{o}</option>)}</select></div><div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Nombre de la entidad</label><input style={IS} value={f.ent} onChange={e=>u("ent",e.target.value)} placeholder="Ej: Bancolombia, Century 21..."/></div><div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Período a certificar</label><select style={{...IS,cursor:"pointer"}} value={f.per} onChange={e=>u("per",e.target.value)}><option value="">Seleccione...</option>{["Último mes","Últimos 3 meses","Últimos 6 meses","Último año","Otro período"].map(o=><option key={o}>{o}</option>)}</select></div></div><div style={{display:"flex",justifyContent:"space-between",marginTop:14}}><button onClick={()=>setStep(1)} style={{padding:"10px 20px",borderRadius:10,background:"transparent",color:"#2563EB",fontSize:13,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button><button onClick={()=>f.dir?setStep(3):alert("Seleccione destino")} style={{padding:"10px 28px",borderRadius:10,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div></div>}

        {/* STEP 3 */}
        {step===3&&<div><h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:3,fontFamily:F}}>💰 Paso 3: Detalle de Ingresos Mensuales</h4><p style={{fontSize:10,color:"#7A8FA8",marginBottom:12,fontFamily:F}}>Diligencie solo los que apliquen. El valor se formatea automáticamente.</p><div style={{display:"grid",gap:9}}>{ings.map(([l,k,tip])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l} <span style={{fontWeight:400,fontSize:9,color:"#7A8FA8"}}>— {tip}</span></label><input style={{...IS,marginTop:2}} value={f[k]} onChange={e=>uFmt(k,e.target.value)} placeholder="$ 0"/></div>)}<div><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Otros ingresos <span style={{fontWeight:400,fontSize:9,color:"#7A8FA8"}}>— Honorarios, comisiones, independiente</span></label><input style={{...IS,marginTop:2}} value={f.iO} onChange={e=>uFmt("iO",e.target.value)} placeholder="$ 0"/><input style={{...IS,marginTop:4}} value={f.oD} onChange={e=>u("oD",e.target.value)} placeholder="Describa el concepto"/></div></div>
          {/* TOTAL AUTOMÁTICO */}
          <div style={{marginTop:16,padding:16,borderRadius:10,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}><div><div style={{fontSize:10,opacity:.5,fontFamily:F}}>TOTAL INGRESOS MENSUALES</div><div style={{fontSize:9,opacity:.4,fontFamily:F}}>Calculado automáticamente — no modificable</div></div><div style={{fontSize:22,fontWeight:700,fontFamily:F,color:"#60A5FA"}}>$ {fm(totalIng)}</div></div><div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,.1)"}}><div><div style={{fontSize:10,opacity:.5,fontFamily:F}}>VALOR A PAGAR POR SU CERTIFICACIÓN</div><div style={{fontSize:9,opacity:.4,fontFamily:F}}>Según tabla de tarifas vigente — no modificable</div></div><div style={{fontSize:20,fontWeight:700,fontFamily:F,color:"#fff"}}>$ {fm(tarifa)}</div></div></div>
          {/* Soportes */}
          <div style={{marginTop:14,padding:14,borderRadius:9,background:"rgba(37,99,235,.04)",border:"1px dashed rgba(37,99,235,.15)"}}><h4 style={{fontSize:11,fontWeight:700,color:"#1B3A5C",marginBottom:5,fontFamily:F}}>📎 Adjunte soportes (opcional, máx 10MB)</h4><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" style={{fontSize:11,fontFamily:F}}/><p style={{fontSize:10,color:"#5A6F8A",marginTop:6,fontFamily:F}}>¿Archivos pesados? Envíelos después por <a href={WL} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>WhatsApp</a></p></div>
          <div style={{marginTop:10}}><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Comentarios</label><textarea style={{...IS,minHeight:50,resize:"vertical",marginTop:3}} value={f.cm} onChange={e=>u("cm",e.target.value)} placeholder="Información adicional..."/></div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:14}}><button onClick={()=>setStep(2)} style={{padding:"10px 20px",borderRadius:10,background:"transparent",color:"#2563EB",fontSize:13,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button><button onClick={()=>totalIng>0?setStep(4):alert("Ingrese al menos un valor de ingresos")} style={{padding:"10px 28px",borderRadius:10,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:13,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Siguiente →</button></div>
        </div>}

        {/* STEP 4 */}
        {step===4&&<div>
          <h4 style={{fontSize:12,fontWeight:700,color:"#1B3A5C",marginBottom:10,fontFamily:F}}>📋 Paso 4: Resumen y Pago</h4>
          {/* Resumen */}
          <div style={{padding:16,borderRadius:10,background:"#f8fafd",border:"1px solid rgba(37,99,235,.06)",marginBottom:14}}><div style={{display:"grid",gap:5,fontSize:12,fontFamily:F,color:"#3a5068"}}><div><strong>Nombre:</strong> {f.n}</div><div><strong>Cédula:</strong> {f.cc}</div><div><strong>Teléfono:</strong> {f.tel}</div><div><strong>Correo:</strong> {f.em}</div><div><strong>Destino:</strong> {f.dir} {f.ent&&`— ${f.ent}`}</div><div><strong>Período:</strong> {f.per}</div><div style={{marginTop:6,paddingTop:6,borderTop:"1px solid rgba(37,99,235,.08)"}}><strong>Total ingresos mensuales:</strong> <span style={{color:"#2563EB",fontWeight:700}}>$ {fm(totalIng)}</span></div><div><strong>Valor a pagar:</strong> <span style={{color:"#0B1D3A",fontWeight:700,fontSize:14}}>$ {fm(tarifa)}</span></div></div></div>
          {/* Declaración juramentada */}
          <div style={{padding:16,borderRadius:10,background:"rgba(220,38,38,.03)",border:"1px solid rgba(220,38,38,.1)",marginBottom:14}}>
            <h4 style={{fontSize:12,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>DECLARACIÓN JURAMENTADA Y ACEPTACIÓN DE CONDICIONES</h4>
            <div style={{fontSize:11,color:"#3a5068",lineHeight:1.8,fontFamily:F}}>
              <p style={{marginBottom:8}}><strong>1. Declaración bajo gravedad de juramento:</strong> Declaro bajo la gravedad del juramento, conforme al artículo 83 de la Constitución Política de Colombia, que la información suministrada en este formulario refleja mi realidad económica actual. Los documentos y soportes que adjunto o adjuntaré son auténticos, confiables y reales, no han sido alterados, modificados ni falsificados.</p>
              <p style={{marginBottom:8}}><strong>2. Verificación de información:</strong> CONTARAE se reserva el derecho de verificar la información y los soportes entregados. CONTARAE no certificará información que no sea verificable o que presente inconsistencias con los soportes documentales.</p>
              <p style={{marginBottom:8}}><strong>3. Política de no devolución:</strong> El valor pagado corresponde al servicio profesional de revisión, verificación y elaboración de la certificación. En caso de que no pueda ser emitida por falta de información, inconsistencias o insuficiencia de soportes atribuibles al solicitante, CONTARAE no está obligada a la devolución total ni parcial del valor pagado, toda vez que el servicio de revisión profesional ya fue prestado.</p>
              <p><strong>4. Autorización de tratamiento de datos:</strong> Autorizo a CONTARAE el tratamiento de mis datos personales conforme a su Política de Tratamiento de Datos Personales y la Ley 1581 de 2012.</p>
            </div>
            <label style={{display:"flex",alignItems:"flex-start",gap:8,marginTop:12,cursor:"pointer"}}><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)} style={{marginTop:3,accentColor:"#2563EB"}}/><span style={{fontSize:12,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>He leído, entiendo y acepto las condiciones anteriores.</span></label>
          </div>
          {/* Pago */}
          <div style={{textAlign:"center"}}>
            <button onClick={()=>accepted?openWompi():alert("Debe aceptar las condiciones para continuar")} disabled={!accepted} style={{padding:"13px 36px",borderRadius:12,background:accepted?"linear-gradient(135deg,#1B3A5C,#2563EB)":"#ccc",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:accepted?"pointer":"not-allowed",fontFamily:F,boxShadow:accepted?"0 4px 18px rgba(37,99,235,.3)":"none"}}>🔒 Pagar $ {fm(tarifa)} con Wompi</button>
            <p style={{fontSize:10,color:"#7A8FA8",marginTop:8,fontFamily:F}}>Pago seguro procesado por Wompi. Sus datos están protegidos.</p>
          </div>
          <div style={{display:"flex",justifyContent:"flex-start",marginTop:14}}><button onClick={()=>setStep(3)} style={{padding:"10px 20px",borderRadius:10,background:"transparent",color:"#2563EB",fontSize:13,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>← Atrás</button></div>
        </div>}
      </>):(
        /* POST PAGO */
        <div style={{textAlign:"center",padding:28}}>
          <div style={{fontSize:44,marginBottom:12}}>✅</div>
          <h3 style={{fontSize:18,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>¡Pago confirmado y solicitud recibida!</h3>
          <p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.75,fontFamily:F,maxWidth:520,margin:"0 auto 8px"}}>Uno de nuestros Contadores Públicos revisará la información y los soportes. En caso de requerirse documentación adicional, nos pondremos en contacto de inmediato por WhatsApp o correo.</p>
          <p style={{fontSize:12,color:"#5A6F8A",fontFamily:F,marginBottom:6}}><strong>Tiempo estimado:</strong> con documentación completa, recibirá su certificación firmada en PDF por WhatsApp y correo.</p>
          <p style={{fontSize:11,color:"#7A8FA8",fontFamily:F,marginBottom:18}}>Consulte el estado de su solicitud por WhatsApp con su número de cédula.</p>
          <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
            <a href={`${WL}?text=${resumenWA}`} target="_blank" rel="noopener noreferrer" style={{padding:"11px 24px",borderRadius:10,background:"#25D366",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",fontFamily:F}}>Enviar soportes por WhatsApp</a>
            <button onClick={()=>{setPaid(false);setStep(1);setAccepted(false);sF({n:"",cc:"",tel:"",em:"",dir:"",ent:"",per:"",iL:"",iP:"",iD:"",iI:"",iA:"",iR:"",iO:"",oD:"",cm:""});}} style={{padding:"11px 24px",borderRadius:10,color:"#2563EB",fontSize:13,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F,background:"transparent"}}>Nueva solicitud</button>
          </div>
        </div>
      )}
    </div>
  </Sec>);
}

/* ══════════ TOOLS ══════════ */
function Tools(){const[cI,sCI]=useState("");const[cR,sCR]=useState(null);const[rF,sRF]=useState({i:"",p:"",c:"",tc:"",b:""});const[rR,sRR]=useState(null);const uv=49799;
const calc=()=>{const i=parseNum(cI);if(i<=0)return;let u2=i/uv,r=0;if(u2<=95)r=0;else if(u2<=150)r=(i-95*uv)*.19;else if(u2<=360)r=55*uv*.19+(i-150*uv)*.28;else if(u2<=640)r=55*uv*.19+210*uv*.28+(i-360*uv)*.33;else if(u2<=945)r=55*uv*.19+210*uv*.28+280*uv*.33+(i-640*uv)*.35;else if(u2<=2300)r=55*uv*.19+210*uv*.28+280*uv*.33+305*uv*.35+(i-945*uv)*.37;else r=55*uv*.19+210*uv*.28+280*uv*.33+305*uv*.35+1355*uv*.37+(i-2300*uv)*.39;sCR({i,r:Math.max(0,Math.round(r)),t:i>0?((Math.max(0,r)/i)*100).toFixed(1):"0"});};
const chk=()=>{const v=k=>parseNum(rF[k]);const i=v("i"),p=v("p"),c=v("c"),tc=v("tc"),b=v("b");const t14=1400*uv,t45=4500*uv;const ob=i>t14||p>t45||c>t14||tc>t14||b>t14;const rz=[];if(i>t14)rz.push(`Ingresos ($${fm(i)}) superan 1.400 UVT ($${fm(Math.round(t14))})`);if(p>t45)rz.push(`Patrimonio ($${fm(p)}) supera 4.500 UVT ($${fm(Math.round(t45))})`);if(c>t14)rz.push(`Compras ($${fm(c)}) superan 1.400 UVT`);if(tc>t14)rz.push(`Tarjeta crédito ($${fm(tc)}) supera 1.400 UVT`);if(b>t14)rz.push(`Consignaciones ($${fm(b)}) superan 1.400 UVT`);sRR({ob,rz});};
return(<Sec id="herramientas" title="Herramientas de consulta gratuitas" sub="HERRAMIENTAS"><p style={{textAlign:"center",fontSize:12,color:"#5A6F8A",marginTop:-30,marginBottom:32,fontFamily:F}}>Basadas en normatividad tributaria colombiana. Resultados estimados.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(400px,1fr))",gap:18}}>
<Cd s={{padding:22}}><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:4,fontFamily:F}}>🧮 Calculadora Retención en la Fuente</h3><p style={{fontSize:10,color:"#5A6F8A",marginBottom:12,fontFamily:F}}>Art. 383 ET. UVT 2025: $49.799.</p><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>Ingreso mensual bruto</label><div style={{display:"flex",gap:7,marginTop:3}}><input style={IS} value={cI} onChange={e=>sCI(fmtInput(e.target.value))} placeholder="$ 0"/><button onClick={calc} style={{padding:"9px 16px",borderRadius:9,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Calcular</button></div>{cR&&<div style={{marginTop:12,padding:14,borderRadius:9,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,textAlign:"center"}}><div><div style={{fontSize:9,opacity:.5,fontFamily:F}}>Ingreso</div><div style={{fontSize:13,fontWeight:700,fontFamily:F}}>${fm(cR.i)}</div></div><div><div style={{fontSize:9,opacity:.5,fontFamily:F}}>Retención</div><div style={{fontSize:13,fontWeight:700,color:"#60A5FA",fontFamily:F}}>${fm(cR.r)}</div></div><div><div style={{fontSize:9,opacity:.5,fontFamily:F}}>Tasa</div><div style={{fontSize:13,fontWeight:700,fontFamily:F}}>{cR.t}%</div></div></div></div>}</Cd>
<Cd s={{padding:22}}><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:4,fontFamily:F}}>📝 ¿Debe declarar renta 2026?</h3><p style={{fontSize:10,color:"#5A6F8A",marginBottom:12,fontFamily:F}}>Año gravable 2025 (Decreto 2229/2023). UVT: $49.799.</p><div style={{display:"grid",gap:7}}>{[["Ingresos brutos anuales","i","≥$69.718.600"],["Patrimonio a dic 31","p","≥$224.095.500"],["Compras y consumos","c","≥$69.718.600"],["Tarjeta de crédito","tc","≥$69.718.600"],["Consignaciones bancarias","b","≥$69.718.600"]].map(([l,k,tip])=><div key={k}><label style={{fontSize:11,fontWeight:600,color:"#1B3A5C",fontFamily:F}}>{l} <span style={{fontSize:9,color:"#7A8FA8",fontWeight:400}}>Tope: {tip}</span></label><input style={{...IS,marginTop:2}} value={rF[k]} onChange={e=>sRF(p=>({...p,[k]:fmtInput(e.target.value)}))} placeholder="$ 0"/></div>)}<button onClick={chk} style={{padding:"9px 16px",borderRadius:9,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:11,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F}}>Verificar</button></div>{rR&&<div style={{marginTop:12,padding:14,borderRadius:9,background:rR.ob?"rgba(220,38,38,.06)":"rgba(22,163,74,.06)",border:`1px solid ${rR.ob?"rgba(220,38,38,.12)":"rgba(22,163,74,.12)"}`}}><div style={{fontSize:13,fontWeight:700,color:rR.ob?"#DC2626":"#16A34A",marginBottom:4,fontFamily:F}}>{rR.ob?"⚠️ Probablemente SÍ está obligado":"✅ Posiblemente NO está obligado"}</div>{rR.rz.map((r,i)=><p key={i} style={{fontSize:11,color:"#5A6F8A",fontFamily:F}}>• {r}</p>)}<p style={{fontSize:9,color:"#7A8FA8",marginTop:6,fontFamily:F}}>* También deben declarar responsables de IVA. Consulte con nuestros profesionales.</p><a href={wm("Hola CONTARAE, quiero verificar si estoy obligado a declarar renta.")} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Asesoría personalizada →</a></div>}</Cd>
</div></Sec>)}

/* ══════════ TIMELINE ══════════ */
function TlS(){return(<Sec title="Calendario de obligaciones tributarias 2026" sub="LÍNEA DE TIEMPO"><div style={{display:"grid",gap:12,maxWidth:780,margin:"0 auto"}}>{TIMELINE.map((t,i)=><div key={i} style={{display:"flex",gap:14,alignItems:"flex-start"}}><div style={{minWidth:72,textAlign:"center"}}><div style={{fontSize:15,fontWeight:700,color:t.c,fontFamily:FH}}>{t.m}</div><div style={{width:3,height:34,background:t.c,margin:"5px auto",borderRadius:4,opacity:.3}}/></div><div style={{flex:1,padding:16,borderRadius:11,background:"#fff",border:"1px solid rgba(37,99,235,.06)",borderLeft:`3px solid ${t.c}`}}>{t.items.map((item,j)=><div key={j} style={{fontSize:12,color:"#3a5068",lineHeight:1.7,fontFamily:F}}>• {item}</div>)}</div></div>)}</div></Sec>)}

/* ══════════ ALERTS ══════════ */
function AltS(){return(<Sec title="Alertas y novedades tributarias" sub="ALERTAS NORMATIVAS" bg="linear-gradient(180deg,rgba(37,99,235,.03) 0%,transparent 100%)"><div style={{display:"grid",gap:10,maxWidth:780,margin:"0 auto"}}>{ALERTS.map((a,i)=><div key={i} style={{padding:"16px 20px",borderRadius:11,background:"#fff",border:"1px solid rgba(37,99,235,.06)",display:"flex",gap:12,alignItems:"flex-start"}}><span style={{fontSize:9,fontWeight:700,color:a.tag==="Importante"?"#DC2626":"#2563EB",background:a.tag==="Importante"?"rgba(220,38,38,.07)":"rgba(37,99,235,.07)",padding:"3px 8px",borderRadius:100,fontFamily:F,whiteSpace:"nowrap"}}>{a.tag}</span><div style={{flex:1}}><h4 style={{fontSize:12,fontWeight:700,color:"#0B1D3A",lineHeight:1.5,fontFamily:F}}>{a.t}</h4><span style={{fontSize:10,color:"#7A8FA8",fontFamily:F}}>{a.d}</span></div></div>)}</div></Sec>)}

/* ══════════ ABOUT ══════════ */
function Abt(){return(<Sec id="nosotros" title="Conozca a CONTARAE" sub="NOSOTROS" narrow><div style={{padding:24,borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.06)",marginBottom:16}}><h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:7,fontFamily:F}}>¿Quiénes somos?</h3><p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>CONTARAE es una firma de servicios contables, tributarios y financieros con Contadores Públicos certificados. Nos especializamos en outsourcing contable para microempresas, emprendedores y pymes en Colombia. Cada cliente recibe trato profesional, cercano y confidencial.</p></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:14}}><div style={{padding:22,borderRadius:12,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:6,fontFamily:F}}>Misión</h3><p style={{fontSize:12,lineHeight:1.75,opacity:.9,fontFamily:F}}>Brindar servicios contables, tributarios y financieros de alta calidad, con responsabilidad y transparencia, contribuyendo al crecimiento sostenible de nuestros clientes.</p></div><div style={{padding:22,borderRadius:12,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff"}}><h3 style={{fontSize:14,fontWeight:700,marginBottom:6,fontFamily:F}}>Visión</h3><p style={{fontSize:12,lineHeight:1.75,opacity:.9,fontFamily:F}}>Ser firma líder en servicios contables y financieros en Colombia, por innovación, profesionalismo y confianza como aliado estratégico de largo plazo.</p></div></div><div style={{marginTop:14,padding:22,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.06)"}}><h3 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:9,fontFamily:F}}>Valores</h3><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:7}}>{[["Transparencia","Información clara y veraz."],["Responsabilidad","Cumplimiento oportuno."],["Confidencialidad","Su información protegida."],["Excelencia","Calidad en cada servicio."],["Compromiso","Su éxito es nuestro objetivo."],["Ética","Integridad y rectitud."]].map(([v,d],i)=><div key={i} style={{padding:"7px 10px",borderRadius:7,background:"rgba(37,99,235,.04)"}}><div style={{fontSize:11,fontWeight:700,color:"#1B3A5C",fontFamily:F}}>✦ {v}</div><div style={{fontSize:10,color:"#5A6F8A",fontFamily:F}}>{d}</div></div>)}</div></div></Sec>)}

/* ══════════ BLOG ══════════ */
function BlgS(){const[exp,sE]=useState(null);return(<Sec id="blog" title="Artículos y guías contables" sub="BLOG"><p style={{textAlign:"center",fontSize:12,color:"#5A6F8A",marginTop:-30,marginBottom:32,fontFamily:F}}>Información basada en normatividad colombiana vigente y fuentes oficiales DIAN.</p><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(310px,1fr))",gap:16}}>{BLOG.map((p,i)=><div key={i} style={{borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.06)",overflow:"hidden"}}><div style={{padding:20}}><div style={{display:"flex",gap:5,marginBottom:7}}><span style={{fontSize:9,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.06)",padding:"2px 7px",borderRadius:100,fontFamily:F}}>{p.tag}</span><span style={{fontSize:9,color:"#7A8FA8",fontFamily:F}}>{p.date}</span></div><h3 style={{fontSize:13,fontWeight:700,color:"#0B1D3A",marginBottom:5,lineHeight:1.4,fontFamily:F}}>{p.title}</h3><p style={{fontSize:11,color:"#5A6F8A",lineHeight:1.65,fontFamily:F}}>{p.ex}</p><button onClick={()=>sE(exp===i?null:i)} style={{marginTop:8,fontSize:11,color:"#2563EB",fontWeight:600,fontFamily:F,background:"none",border:"none",cursor:"pointer",padding:0}}>{exp===i?"Cerrar ✕":"Leer más →"}</button></div>{exp===i&&<div style={{padding:"0 20px 20px",borderTop:"1px solid rgba(37,99,235,.05)"}}><div style={{paddingTop:14,fontSize:11,color:"#3a5068",lineHeight:1.85,fontFamily:F,whiteSpace:"pre-line"}}>{p.content}</div><div style={{marginTop:12,padding:10,borderRadius:7,background:"rgba(37,99,235,.04)"}}><a href={wm(`Hola CONTARAE, necesito ayuda con: ${p.title}`)} target="_blank" rel="noopener noreferrer" style={{fontSize:11,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Consultar por WhatsApp →</a></div></div>}</div>)}</div></Sec>)}

/* ══════════ DOWNLOADS ══════════ */
function DwS(){return(<Sec title="Formatos y guías gratuitas" sub="DESCARGAS" narrow><div style={{display:"grid",gap:9}}>{DOWNLOADS.map((d,i)=><div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 18px",borderRadius:11,background:"#fff",border:"1px solid rgba(37,99,235,.06)",gap:12,flexWrap:"wrap"}}><div style={{flex:1,minWidth:200}}><h4 style={{fontSize:12,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>{d.n}</h4><p style={{fontSize:10,color:"#5A6F8A",marginTop:2,fontFamily:F}}>{d.d}</p></div><a href={wm(`Hola, solicito el formato: ${d.n}`)} target="_blank" rel="noopener noreferrer" style={{padding:"6px 14px",borderRadius:7,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:10,fontWeight:600,textDecoration:"none",fontFamily:F,whiteSpace:"nowrap"}}>Solicitar por WhatsApp</a></div>)}</div></Sec>)}

/* ══════════ FAQ ══════════ */
function FaqS(){const[o,sO]=useState(null);return(<Sec id="faq" title="Preguntas frecuentes" sub="DUDAS" narrow><div style={{display:"grid",gap:8}}>{FAQS.map((f,i)=><div key={i} style={{borderRadius:10,background:"#fff",border:"1px solid rgba(37,99,235,.06)",overflow:"hidden",cursor:"pointer"}} onClick={()=>sO(o===i?null:i)}><div style={{padding:"13px 18px",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontSize:13,fontWeight:600,color:"#0B1D3A",fontFamily:F,flex:1}}>{f.q}</span><span style={{fontSize:15,color:"#2563EB",transform:o===i?"rotate(45deg)":"rotate(0)",transition:"transform .3s",marginLeft:8}}>+</span></div>{o===i&&<div style={{padding:"0 18px 13px",fontSize:12,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{f.a}</div>}</div>)}</div></Sec>)}

/* ══════════ PRIVACY ══════════ */
function Prv(){const[s,sS]=useState(false);return(<div style={{maxWidth:900,margin:"0 auto",padding:"0 24px"}}><div style={{textAlign:"center",marginBottom:16}}><button onClick={()=>sS(!s)} style={{background:"none",border:"none",color:"rgba(255,255,255,.7)",fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>{s?"Ocultar":"Consultar"} Política de Datos</button></div>{s&&<div style={{padding:26,borderRadius:13,background:"rgba(255,255,255,.05)",border:"1px solid rgba(96,165,250,.1)",marginBottom:20}}><h3 style={{fontFamily:FH,fontSize:17,fontWeight:700,color:"#fff",marginBottom:4,textAlign:"center"}}>Política de Tratamiento de Datos Personales</h3><p style={{fontSize:10,color:"rgba(255,255,255,.5)",marginBottom:20,textAlign:"center",fontFamily:F}}>CONTARAE — Servicios Contables, Tributarios y Financieros</p>{PRIVACY.map((s2,i)=><div key={i} style={{marginBottom:14}}><h4 style={{fontSize:12,fontWeight:700,color:"#60A5FA",marginBottom:4,fontFamily:F}}>{s2.t}</h4><p style={{fontSize:11,color:"rgba(255,255,255,.65)",lineHeight:1.85,fontFamily:F}}>{s2.c}</p></div>)}<p style={{fontSize:9,color:"rgba(255,255,255,.35)",marginTop:14,textAlign:"center",fontFamily:F}}>Última actualización: Abril 2026</p></div>}</div>)}

/* ══════════ FOOTER ══════════ */
function Ftr(){return(<>
  <section id="contacto" style={{padding:"80px 24px"}}><div style={{maxWidth:640,margin:"0 auto",textAlign:"center",padding:"48px 30px",borderRadius:18,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",position:"relative",overflow:"hidden"}}><div style={{position:"absolute",top:-40,right:-40,width:150,height:150,borderRadius:"50%",background:"rgba(96,165,250,.1)"}}/>
    <h2 style={{fontFamily:FH,fontSize:"clamp(20px,3.5vw,30px)",fontWeight:700,color:"#fff",marginBottom:10,position:"relative"}}>¿Listo para ordenar sus finanzas?</h2>
    <p style={{fontSize:13,color:"rgba(255,255,255,.6)",marginBottom:24,fontFamily:F,position:"relative"}}>Asesoría inicial sin costo. Contadores Públicos certificados en Bogotá.</p>
    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",position:"relative"}}><a href={wm("Hola CONTARAE, me gustaría agendar una asesoría gratuita.")} target="_blank" rel="noopener noreferrer" style={{padding:"12px 26px",borderRadius:11,background:"#25D366",color:"#fff",fontSize:13,fontWeight:700,textDecoration:"none",fontFamily:F}}>WhatsApp</a><a href={`mailto:${EM}`} style={{padding:"12px 26px",borderRadius:11,background:"rgba(255,255,255,.1)",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,.15)",fontFamily:F}}>Correo</a></div>
  </div></section>
  <footer style={{padding:"40px 24px 30px",background:"#080E1B"}}>
    <LogoFooter/>
    <div style={{maxWidth:600,margin:"0 auto",textAlign:"center"}}>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10,marginBottom:18}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,.6)",fontFamily:F}}>📱 <strong style={{color:"#fff"}}>WhatsApp:</strong> +57 301 310 1050</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.6)",fontFamily:F}}>✉️ <strong style={{color:"#fff"}}>Correo:</strong> {EM}</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.6)",fontFamily:F}}>📍 <strong style={{color:"#fff"}}>Ubicación:</strong> Bogotá D.C., Colombia</div>
        <div style={{fontSize:12,color:"rgba(255,255,255,.6)",fontFamily:F}}>🕐 <strong style={{color:"#fff"}}>Horario:</strong> Lun-Vie 8am a 6pm</div>
      </div>
      <Prv/>
      <div style={{borderTop:"1px solid rgba(96,165,250,.1)",paddingTop:16,marginTop:10}}>
        <p style={{fontSize:9,color:"rgba(255,255,255,.35)",fontFamily:F}}>© 2026 CONTARAE · Bogotá D.C., Colombia · Todos los derechos reservados</p>
        <p style={{fontSize:9,color:"rgba(255,255,255,.3)",marginTop:3,fontFamily:F}}>Ley 1581 de 2012 — Protección de Datos Personales</p>
      </div>
    </div>
  </footer>
</>)}

/* ══════════ FLOATING BUTTONS ══════════ */
function Floats(){
  const[show,setShow]=useState(false);
  useEffect(()=>{const h=()=>setShow(window.scrollY>400);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  return(<>
    {/* WhatsApp */}
    <a href={wm("Hola CONTARAE, me gustaría recibir asesoría.")} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:28,right:28,zIndex:1000,width:56,height:56,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 18px rgba(37,211,102,.4)",textDecoration:"none",fontSize:26,transition:"transform .3s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} aria-label="WhatsApp">💬</a>
    {/* Scroll to top */}
    {show&&<button onClick={()=>window.scrollTo({top:0,behavior:"smooth"})} style={{position:"fixed",bottom:28,left:28,zIndex:1000,width:44,height:44,borderRadius:"50%",background:"rgba(11,29,58,.85)",border:"1px solid rgba(96,165,250,.2)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:18,color:"#60A5FA",boxShadow:"0 3px 12px rgba(0,0,0,.2)",transition:"transform .3s"}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"} aria-label="Subir">↑</button>}
  </>);
}

/* ══════════ MAIN APP ══════════ */
export default function App(){
  useEffect(()=>{const obs=new IntersectionObserver(en=>{en.forEach(e=>{if(e.isIntersecting){e.target.style.opacity="1";e.target.style.transform="translateY(0)";}});},{threshold:.07});setTimeout(()=>{document.querySelectorAll(".ai").forEach(el=>{el.style.opacity="0";el.style.transform="translateY(18px)";el.style.transition="opacity .6s ease,transform .6s ease";obs.observe(el);});},100);return()=>obs.disconnect();},[]);

  return(<div style={{fontFamily:F,color:"#0B1D3A",background:"#f8fafd",minHeight:"100vh"}}>
    <style>{`@import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');*{margin:0;padding:0;box-sizing:border-box;}html{scroll-behavior:smooth;}::selection{background:#2563EB;color:#fff;}@media(max-width:768px){.dsk-menu{display:none!important;}.ham-btn{display:block!important;}}`}</style>
    <script src="https://checkout.wompi.co/widget.js" async></script>
    {/* Schema.org */}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify({"@context":"https://schema.org","@type":"ProfessionalService","name":"CONTARAE","description":"Servicios contables, tributarios y financieros. Certificación de ingresos por Contador Público, outsourcing contable para microempresas, emprendedores y pymes en Colombia.","url":"https://contarae.com","telephone":"+573013101050","email":"info@contarae.com","address":{"@type":"PostalAddress","addressLocality":"Bogotá","addressCountry":"CO"},"areaServed":"CO","priceRange":"$$","openingHours":"Mo-Fr 08:00-18:00","serviceType":["Certificación de ingresos","Contabilidad","Asesoría tributaria","Declaración de renta","Gestión financiera"]})}}/>
    <Nav/>
    <Banner/>
    {/* Hidden form for Netlify detection */}
    <form name="certificacion" data-netlify="true" hidden>
      <input name="form-name" type="hidden" value="certificacion"/>
      <input name="nombre"/><input name="cedula"/><input name="telefono"/><input name="correo"/>
      <input name="destino"/><input name="entidad"/><input name="periodo"/>
      <input name="ingresos_laborales"/><input name="pensiones"/><input name="dividendos"/>
      <input name="inversiones"/><input name="arriendos"/><input name="remesas"/>
      <input name="otros_ingresos"/><input name="otros_descripcion"/>
      <input name="total_ingresos"/><input name="tarifa_pagada"/>
      <input name="referencia_wompi"/><input name="estado_pago"/>
      <input name="comentarios"/><input name="declaracion_juramentada"/>
    </form>
    <Hero/>
    <div className="ai"><WhyUs/></div>
    <div className="ai"><SvcS/></div>
    <div className="ai"><PlnS/></div>
    <div className="ai"><ScnS/></div>
    <div className="ai"><TrmS/></div>
    <div className="ai"><CrtS/></div>
    <div className="ai"><Tools/></div>
    <div className="ai"><TlS/></div>
    <div className="ai"><AltS/></div>
    <div className="ai"><Abt/></div>
    <div className="ai"><BlgS/></div>
    <div className="ai"><DwS/></div>
    <div className="ai"><FaqS/></div>
    <div className="ai"><Ftr/></div>
    <Floats/>
  </div>);
}
