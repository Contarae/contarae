// CONTARAE - Servicios Contables, Tributarios y Financieros
// Versión Final - Abril 2026

import { useState, useEffect } from "react";

/* ══════════════════════════════════════════
   CONFIGURACIÓN PRINCIPAL
   ══════════════════════════════════════════ */
const WA="573013101050";
const WL=`https://wa.me/${WA}`;
const EM="info@contarae.com";
const F="'Outfit',sans-serif";
const FH="'Libre Baskerville',serif";
const fm=n=>new Intl.NumberFormat("es-CO").format(n);

/* ══════════════════════════════════════════
   DATOS DE SERVICIOS
   ══════════════════════════════════════════ */
const SERVICES=[
  {icon:"📊",title:"Contabilidad Integral",desc:"Nos encargamos del ciclo contable completo de su empresa: recolección y clasificación de documentos, registro de operaciones, conciliaciones bancarias, elaboración de estados financieros (balance general, estado de resultados, flujo de efectivo) y aplicación de Normas Internacionales de Información Financiera (NIIF). Usted recibe información financiera confiable, oportuna y lista para la toma de decisiones."},
  {icon:"📋",title:"Asesoría Tributaria",desc:"Le acompañamos en el cumplimiento de todas sus obligaciones ante la DIAN: declaración de renta (personas naturales y jurídicas), declaración de IVA, retención en la fuente, ICA, información exógena (medios magnéticos) y planeación tributaria. Optimizamos su carga fiscal dentro del marco legal vigente, evitando sanciones y aprovechando los beneficios tributarios a los que tiene derecho."},
  {icon:"💰",title:"Gestión Financiera",desc:"Diseñamos e implementamos herramientas de control financiero para su empresa: elaboración de presupuestos, análisis de flujo de caja, construcción de indicadores financieros (KPIs), análisis de costos por centro de responsabilidad, proyecciones financieras y reportes gerenciales personalizados. Todo orientado a que usted tome decisiones informadas y estratégicas sobre su negocio."},
  {icon:"👥",title:"Nómina y Seguridad Social",desc:"Gestionamos de forma integral la nómina de su empresa: liquidación mensual de salarios, prestaciones sociales (prima, cesantías, intereses, vacaciones), aportes a seguridad social (salud, pensión, ARL), elaboración y pago de planilla PILA, liquidación de contratos laborales y generación del certificado de ingresos y retenciones (formulario 220) para sus empleados. Todo en cumplimiento del Código Sustantivo del Trabajo y la normatividad laboral vigente."},
  {icon:"📄",title:"Certificaciones Contables",desc:"Expedimos certificaciones de ingresos, patrimonio, no declarante de renta y demás certificaciones contables que requiera, firmadas por Contador Público con tarjeta profesional vigente ante la Junta Central de Contadores. Nuestras certificaciones cumplen con lo establecido en la Ley 43 de 1990 y los lineamientos del Consejo Técnico de la Contaduría Pública (CTCP), otorgando fe pública y plena validez ante cualquier entidad en Colombia."}
];

const PLANS=[
  {name:"Emprendedor",price:"Desde $500.000/mes",target:"Independientes y microempresas",features:["Registro contable mensual completo","Declaraciones tributarias básicas (IVA, retención en la fuente)","Conciliación bancaria mensual","Estados financieros trimestrales","Asesoría tributaria básica permanente","Soporte por WhatsApp en horario laboral"]},
  {name:"Empresarial",price:"Desde $1.000.000/mes",target:"Pequeñas y medianas empresas",features:["Todo lo incluido en el Plan Emprendedor","Liquidación de nómina y seguridad social","Estados financieros mensuales detallados","Preparación y presentación de información exógena DIAN","Indicadores financieros y KPIs personalizados","Planeación tributaria estratégica","Soporte prioritario extendido"],popular:true},
  {name:"Premium",price:"Desde $2.000.000/mes",target:"Empresas en crecimiento",features:["Todo lo incluido en el Plan Empresarial","Elaboración de presupuestos y control de gestión","Dashboard financiero personalizado con Power BI","Análisis de costos por centro de responsabilidad","Reuniones mensuales de seguimiento con informe gerencial","Asesor financiero dedicado a su empresa","Soporte 24/7 por WhatsApp y correo"]}
];

const TRAMITES=[
  {icon:"📄",title:"Certificación de Ingresos",desc:"Documento suscrito por Contador Público con tarjeta profesional vigente que certifica sus ingresos mensuales o anuales con base en soportes verificables. Válido ante bancos, inmobiliarias, embajadas, concesionarios y cualquier entidad que requiera acreditar su capacidad de pago. Proceso 100% en línea con entrega inmediata en formato PDF.",link:"cert"},
  {icon:"📝",title:"Declaración de Renta",desc:"Preparación, revisión y presentación oportuna de la declaración de renta ante la DIAN, tanto para personas naturales como jurídicas. Incluye análisis de deducciones, rentas exentas, cálculo del impuesto y verificación contra la información exógena reportada por terceros. Evite sanciones por extemporaneidad o inexactitud.",link:"wa"},
  {icon:"🏢",title:"Renovación de Matrícula Mercantil",desc:"Gestión completa de la renovación anual ante la Cámara de Comercio, conforme al artículo 33 del Código de Comercio. Incluye actualización de información financiera, códigos CIIU y datos de contacto. El plazo legal es hasta el 31 de marzo de cada año; el incumplimiento puede generar sanciones de la Superintendencia de Sociedades de hasta 17 SMLMV y la cancelación de la matrícula si no se renueva por 5 años consecutivos (Ley 1727 de 2014).",link:"wa"},
  {icon:"🧾",title:"Facturación Electrónica",desc:"Implementación y soporte completo del sistema de facturación electrónica conforme a los requisitos de la DIAN. Incluye habilitación como facturador electrónico, selección e implementación del proveedor tecnológico, capacitación a su equipo, configuración de numeración y resolución de facturación, y soporte técnico continuo para el cumplimiento de la normatividad vigente.",link:"wa"},
  {icon:"📊",title:"Información Exógena (Medios Magnéticos)",desc:"Preparación y presentación del reporte de información exógena ante la DIAN dentro de los plazos establecidos en el calendario tributario. Este reporte detalla las operaciones con terceros (clientes, proveedores, empleados) y es la principal herramienta de cruce de información que utiliza la DIAN para el control tributario. El incumplimiento genera sanciones desde $524.000 COP (10 UVT) hasta el 5% de las sumas no reportadas.",link:"wa"},
  {icon:"🏗️",title:"Creación y Formalización de Empresas",desc:"Le acompañamos en todo el proceso de constitución legal de su empresa: elección del tipo societario (SAS, LTDA, S.A.), elaboración de estatutos, registro en Cámara de Comercio, inscripción del RUT ante la DIAN, apertura de cuenta bancaria empresarial, inscripción como responsable de IVA (si aplica) y cumplimiento de los requisitos iniciales para operar formalmente en Colombia.",link:"wa"}
];

const CERT_TARIFAS=[
  {r:"Hasta $2.000.000",t:"$80.000"},
  {r:"De $2.000.001 a $4.000.000",t:"$100.000"},
  {r:"De $4.000.001 a $7.000.000",t:"$120.000"},
  {r:"De $7.000.001 a $12.000.000",t:"$150.000"},
  {r:"De $12.000.001 a $20.000.000",t:"$180.000"},
  {r:"Más de $20.000.000",t:"$200.000"}
];

const FAQS=[
  {q:"¿Cuánto cuesta una certificación de ingresos?",a:"Desde $80.000 COP dependiendo del rango de ingresos mensuales a certificar. El valor incluye revisión de soportes, elaboración del documento y firma por Contador Público con tarjeta profesional vigente. Consulte nuestra tabla de tarifas detallada en la sección de Certificación de Ingresos."},
  {q:"¿Qué documentos necesito para declarar renta?",a:"Los documentos principales son: certificado de ingresos y retenciones (formulario 220) emitido por su empleador, extractos bancarios de todas sus cuentas del año gravable, certificados de inversiones (CDTs, fondos, acciones), información de bienes (inmuebles, vehículos), información de deudas (créditos, hipotecas), y certificados de pagos de salud, pensión y aportes voluntarios. Nosotros le guiamos en la recopilación completa."},
  {q:"¿Cómo funciona el plan mensual de contabilidad?",a:"Usted elige el plan que se ajuste al tamaño y necesidades de su empresa. A partir de ese momento, nuestro equipo se encarga de toda la gestión contable, tributaria y financiera de forma permanente. Recibe reportes periódicos, tiene acceso a asesoría continua y nosotros nos encargamos del cumplimiento de todas sus obligaciones ante la DIAN y demás entidades. Los precios dependen del volumen de información y la complejidad de las operaciones de cada cliente."},
  {q:"¿Puedo contratar solo un servicio puntual sin plan mensual?",a:"¡Por supuesto! Ofrecemos servicios puntuales como certificaciones de ingresos, declaraciones de renta, renovación de matrícula mercantil, constitución de empresas y cualquier trámite contable o tributario específico. No es necesario tener un plan mensual contratado."},
  {q:"¿Cuánto tarda la renovación de matrícula mercantil?",a:"El trámite puede completarse en 1 a 3 días hábiles una vez recibida toda la documentación necesaria (información financiera a corte 31 de diciembre del año anterior, códigos CIIU actualizados y datos de contacto). Le recomendamos hacer la renovación en enero o febrero para evitar congestiones cerca de la fecha límite del 31 de marzo."},
  {q:"¿Qué medios de pago aceptan?",a:"Aceptamos pagos a través de Wompi (tarjeta de crédito, tarjeta débito, PSE), Nequi, Daviplata y transferencia bancaria directa. Para certificaciones de ingresos, el comprobante de pago debe adjuntarse junto con los soportes documentales."},
  {q:"¿Cómo sé si estoy obligado a declarar renta?",a:"Depende de varios factores establecidos por la DIAN para cada año gravable: ingresos brutos, patrimonio bruto, compras y consumos, consumos con tarjeta de crédito y consignaciones bancarias. Si cualquiera de estos supera los topes en UVT definidos por ley, usted está obligado a declarar. Use nuestra herramienta gratuita '¿Está obligado a declarar renta?' en la sección de Herramientas para verificarlo al instante."},
  {q:"¿Qué es la información exógena y quién debe reportarla?",a:"La información exógena (también conocida como medios magnéticos) es un reporte detallado de operaciones con terceros que ciertos contribuyentes deben presentar ante la DIAN. Están obligados quienes superen los topes de ingresos establecidos por resolución DIAN cada año. Este reporte incluye información de clientes, proveedores, empleados, retenciones practicadas y recibidas, entre otros. Su incumplimiento genera sanciones económicas significativas."}
];

/* ══════════════════════════════════════════
   ARTÍCULOS DEL BLOG (contenido completo)
   ══════════════════════════════════════════ */
const BLOG=[
  {
    title:"Declaración de renta personas naturales 2026: guía completa",
    tag:"Tributario",date:"Abril 2026",
    excerpt:"Conozca los topes, plazos, documentos necesarios y sanciones para la declaración de renta del año gravable 2025 ante la DIAN.",
    content:`La declaración de renta es el informe que las personas naturales presentan ante la Dirección de Impuestos y Aduanas Nacionales (DIAN) para reportar sus ingresos, patrimonio, gastos, deducciones y retenciones del año gravable anterior. Para el año gravable 2025, que se declara en 2026, los plazos van del 12 de agosto al 26 de octubre de 2026, según los dos últimos dígitos del NIT (Decreto 2229 de 2023).

¿QUIÉN DEBE DECLARAR?

Según la DIAN, debe presentar declaración de renta la persona natural residente en Colombia que durante 2025 haya cumplido al menos uno de estos criterios:

• Ingresos brutos iguales o superiores a $69.718.600 (1.400 UVT).
• Patrimonio bruto a 31 de diciembre igual o superior a $224.095.500 (4.500 UVT).
• Compras y consumos totales iguales o superiores a $69.718.600 (1.400 UVT).
• Consumos con tarjeta de crédito iguales o superiores a $69.718.600 (1.400 UVT).
• Consignaciones bancarias, depósitos o inversiones iguales o superiores a $69.718.600 (1.400 UVT).
• Ser responsable de IVA al cierre del año gravable.

El valor de la UVT para 2025 es de $49.799 (Resolución DIAN del 7 de noviembre de 2024).

DOCUMENTOS NECESARIOS

Para preparar su declaración necesitará: certificado de ingresos y retenciones (formulario 220), extractos bancarios de todas las cuentas, certificados de inversiones financieras, información de bienes inmuebles y vehículos, información de créditos y deudas, certificados de aportes a salud, pensión y aportes voluntarios, y facturas de gastos deducibles.

SANCIONES POR INCUMPLIMIENTO

No declarar o hacerlo fuera de plazo genera sanciones según el Estatuto Tributario. La sanción por extemporaneidad es del 5% del impuesto a cargo por cada mes o fracción de retraso (art. 641-642 ET). La sanción mínima para 2026 es de $524.000 (10 UVT). Adicionalmente, la DIAN puede imponer sanción por no declarar equivalente al 20% de las consignaciones bancarias o de los ingresos brutos.

En CONTARAE nos encargamos de todo el proceso: recopilación de documentos, cálculo del impuesto, identificación de deducciones y rentas exentas, y presentación oportuna ante la DIAN.`
  },
  {
    title:"Renovación de matrícula mercantil: todo lo que debe saber",
    tag:"Empresarial",date:"Marzo 2026",
    excerpt:"Plazos, requisitos, costos y consecuencias de no renovar a tiempo su matrícula ante la Cámara de Comercio.",
    content:`La matrícula mercantil es el registro obligatorio que certifica la existencia, propiedad y situación financiera de las empresas y establecimientos de comercio ante las Cámaras de Comercio en Colombia. Su renovación anual es una obligación legal establecida en el artículo 33 del Código de Comercio.

PLAZO DE RENOVACIÓN

La renovación debe realizarse dentro de los tres primeros meses de cada año, es decir, hasta el 31 de marzo. Para 2026, la fecha límite es el 31 de marzo de 2026. Se recomienda realizar el trámite en enero o febrero para evitar congestiones en las plataformas digitales de las Cámaras de Comercio.

¿QUIÉN DEBE RENOVAR?

Todas las personas naturales y jurídicas que ejerzan actividades comerciales, así como sus establecimientos de comercio, sucursales y agencias registrados ante cualquier Cámara de Comercio del país.

INFORMACIÓN REQUERIDA

Para la renovación se necesita la información financiera con corte al 31 de diciembre del año anterior (activos, pasivos, patrimonio, ingresos por actividad ordinaria), los códigos de actividad económica (CIIU) actualizados, datos de contacto actualizados (dirección, teléfono, correo electrónico) y el número de empleados.

COSTO

El valor de la renovación se calcula sobre los activos totales reportados y varía según la Cámara de Comercio. No es un valor fijo sino proporcional al tamaño de la empresa.

CONSECUENCIAS DE NO RENOVAR

El incumplimiento puede generar: sanciones económicas de la Superintendencia de Sociedades (hasta 17 SMLMV), marcación en el certificado como "comerciante no cumplidor", pérdida de acceso a beneficios de la Cámara de Comercio, restricciones para acceder a créditos y licitaciones, requerimientos por parte de la Policía Nacional según el Código Nacional de Seguridad y Convivencia, y cancelación de la matrícula si no se renueva por 5 años consecutivos (artículo 31 de la Ley 1727 de 2014).

CÓMO RENOVAR

El proceso puede realizarse 100% en línea a través del portal de la Cámara de Comercio correspondiente o a través de la Ventanilla Única Empresarial (VUE). También puede hacerse de forma presencial en las sedes de la Cámara de Comercio.

En CONTARAE realizamos la gestión completa de renovación para que usted no tenga que preocuparse por plazos ni trámites.`
  },
  {
    title:"Certificación de ingresos en Colombia: guía completa",
    tag:"Certificaciones",date:"Marzo 2026",
    excerpt:"Qué es, quién la puede emitir, base legal, soportes necesarios y cómo solicitar su certificación de ingresos.",
    content:`La certificación de ingresos es un documento suscrito por un Contador Público con tarjeta profesional vigente ante la Junta Central de Contadores, en el cual se certifica de forma clara y verificable el nivel de ingresos de una persona natural, con base en soportes documentales.

BASE LEGAL

Según la Ley 43 de 1990 (artículos 1 y 10), el Contador Público está facultado para emitir certificaciones sobre actividades relacionadas con la ciencia contable. La firma del Contador otorga fe pública, lo que significa que se presume, salvo prueba en contrario, que la información certificada cumple con los requisitos legales aplicables. El Consejo Técnico de la Contaduría Pública (CTCP), mediante Concepto 1106 de 2019, ha señalado que las certificaciones de ingresos emitidas por contador deben estar soportadas en documentación verificable.

¿QUIÉN LA PUEDE EMITIR?

Únicamente un Contador Público con tarjeta profesional vigente expedida por la Junta Central de Contadores. Incluir información incompleta o contraria a la realidad expone al profesional a sanciones disciplinarias ante la JCC y, cuando se destina a la DIAN, a las sanciones previstas en el Estatuto Tributario.

SOPORTES DOCUMENTALES NECESARIOS

Los soportes varían según el tipo de ingreso: para ingresos laborales se requieren desprendibles de nómina o certificado del empleador; para ingresos por honorarios o servicios, facturas o cuentas de cobro y extractos bancarios; para ingresos por arriendos, contratos de arrendamiento y comprobantes de pago; para ingresos por pensiones, desprendible de mesada pensional; para ingresos por inversiones, certificados de la entidad financiera.

¿CUÁNDO SE NECESITA?

Las situaciones más comunes incluyen: solicitudes de crédito bancario o hipotecario, arrendamiento de inmuebles (como requisito de inmobiliarias y aseguradoras), compra de vehículo (financiación a través de concesionarios), trámites de visa o migratorios ante embajadas, procesos de contratación o licitaciones, trámite de libreta militar ante el Ministerio de Defensa, y trámites académicos.

VALIDEZ

La validez de la certificación depende de la entidad que la solicita. Generalmente aceptan certificaciones con antigüedad máxima de 30 a 60 días. Se recomienda confirmar con la entidad destino antes de solicitar la certificación.

En CONTARAE emitimos su certificación de ingresos de forma inmediata, 100% en línea, con firma de Contador Público y entrega digital en PDF.`
  },
  {
    title:"Facturación electrónica en Colombia: obligaciones y requisitos",
    tag:"Tributario",date:"Febrero 2026",
    excerpt:"Todo lo que necesita saber sobre la facturación electrónica: quiénes están obligados, requisitos técnicos y cómo implementarla.",
    content:`La facturación electrónica es el sistema de emisión de facturas en formato digital que cumple con los requisitos legales y técnicos establecidos por la DIAN. En Colombia, la implementación de este sistema ha sido progresiva y hoy es obligatoria para la gran mayoría de contribuyentes que realizan operaciones de venta de bienes o prestación de servicios.

MARCO NORMATIVO

La facturación electrónica en Colombia está regulada principalmente por el artículo 616-1 del Estatuto Tributario, la Resolución DIAN 000042 de 2020 y sus modificaciones posteriores. Estas normas establecen las condiciones técnicas, los plazos y los requisitos que deben cumplir los facturadores electrónicos.

¿QUIÉNES ESTÁN OBLIGADOS?

Están obligados a facturar electrónicamente: todas las personas jurídicas que vendan bienes o presten servicios, las personas naturales responsables de IVA, las personas naturales no responsables de IVA que superen los topes establecidos por la DIAN, y los contribuyentes del Régimen Simple de Tributación (RST). Existen algunas excepciones para pequeños comerciantes que cumplan ciertos requisitos.

REQUISITOS TÉCNICOS

Para emitir facturas electrónicas se necesita: habilitación como facturador electrónico ante la DIAN (mediante solicitud en el portal transaccional), selección de un proveedor tecnológico autorizado, resolución de autorización de numeración de facturación vigente, software o plataforma compatible con las especificaciones técnicas de la DIAN (formato XML estándar UBL 2.1), y certificado digital de firma electrónica.

DOCUMENTO SOPORTE

Adicionalmente, cuando se realizan compras a personas no obligadas a facturar (como personas naturales no comerciantes), el comprador debe generar el "documento soporte en adquisiciones efectuadas a sujetos no obligados a expedir factura", que también se transmite electrónicamente a la DIAN.

En CONTARAE le asesoramos en todo el proceso de implementación de facturación electrónica, desde la habilitación hasta la capacitación de su equipo.`
  },
  {
    title:"5 errores comunes en la contabilidad de pymes colombianas",
    tag:"Contable",date:"Enero 2026",
    excerpt:"Identifique y evite los errores más frecuentes que cometen las pequeñas y medianas empresas en su gestión contable.",
    content:`La gestión contable adecuada es fundamental para la salud financiera de cualquier empresa. Sin embargo, muchas pymes en Colombia cometen errores que pueden resultar en sanciones, pérdida de oportunidades de negocio o decisiones financieras equivocadas. A continuación, los 5 errores más comunes y cómo evitarlos.

ERROR 1: NO LLEVAR CONTABILIDAD FORMAL

Según el Código de Comercio (artículos 19 y 48-74) y la Ley 1314 de 2009, todos los comerciantes están obligados a llevar contabilidad conforme a las Normas Internacionales de Información Financiera (NIIF) que correspondan a su grupo (Grupo 1, 2 o 3 según el Decreto 2420 de 2015). Muchas pymes operan sin registros contables formales, lo que limita su acceso a créditos, las expone a sanciones y dificulta la toma de decisiones.

ERROR 2: MEZCLAR FINANZAS PERSONALES Y EMPRESARIALES

Uno de los errores más frecuentes en microempresas es no separar las cuentas bancarias ni los gastos personales de los del negocio. Esto genera distorsiones en la información financiera, dificulta el cálculo correcto de impuestos y puede considerarse como defraudación fiscal si se deducen gastos personales como empresariales.

ERROR 3: NO CONCILIAR BANCOS MENSUALMENTE

La conciliación bancaria es el proceso de verificar que los registros contables coincidan con los movimientos reflejados en los extractos bancarios. No realizarla mensualmente puede ocultar errores, fraudes o transacciones no registradas que afectan la confiabilidad de la información financiera.

ERROR 4: DESCONOCER LOS PLAZOS TRIBUTARIOS

El calendario tributario de la DIAN establece fechas estrictas para la presentación de declaraciones (renta, IVA, retención en la fuente, ICA, información exógena). El desconocimiento o incumplimiento de estos plazos genera sanciones por extemporaneidad que inician en $524.000 (10 UVT para 2026) y pueden incrementarse significativamente según el impuesto y el tiempo de retraso.

ERROR 5: NO CONSERVAR LOS SOPORTES CONTABLES

El Estatuto Tributario y el Código de Comercio exigen conservar los libros de contabilidad y los comprobantes de las operaciones por un mínimo de 5 años. En materia tributaria, la DIAN puede solicitar soportes hasta por el término de firmeza de las declaraciones. No conservar adecuadamente facturas, contratos, recibos y demás soportes puede resultar en el desconocimiento de costos y deducciones.

En CONTARAE ayudamos a las pymes a implementar prácticas contables sólidas desde el inicio, evitando estos errores y construyendo una base financiera confiable.`
  },
  {
    title:"Información exógena DIAN: ¿qué es y quién debe reportarla?",
    tag:"Tributario",date:"Enero 2026",
    excerpt:"Entienda qué son los medios magnéticos, quiénes están obligados a reportar y cuáles son los plazos y sanciones.",
    content:`La información exógena, comúnmente conocida como "medios magnéticos", es el reporte detallado de operaciones con terceros que ciertos contribuyentes deben presentar periódicamente ante la DIAN. Este reporte es la principal herramienta de cruce de información que utiliza la autoridad tributaria para verificar la consistencia de las declaraciones de renta, IVA y retención en la fuente.

¿QUÉ SE REPORTA?

La información exógena incluye: pagos a terceros (proveedores, contratistas, empleados), ingresos recibidos de terceros (clientes), retenciones en la fuente practicadas y recibidas, impuesto a las ventas (IVA) generado y descontable, saldos de cuentas por cobrar y por pagar, información de socios y accionistas, y donaciones realizadas o recibidas.

¿QUIÉNES ESTÁN OBLIGADOS?

Los obligados a reportar están definidos por resolución de la DIAN que se expide cada año. En términos generales, deben reportar: personas naturales y jurídicas con ingresos brutos superiores al tope establecido por la DIAN (generalmente entre 100 y 500 millones según el tipo de información), entidades del sector público, consorcios y uniones temporales, entes que administren fondos de inversión o de pensiones, y entidades financieras.

PLAZOS 2026

Para el año gravable 2025, los plazos de presentación en 2026 son: grandes contribuyentes entre el 28 de abril y el 13 de mayo de 2026; personas jurídicas y naturales entre el 14 de mayo y el 12 de junio de 2026. Las fechas específicas dependen del último dígito del NIT.

SANCIONES POR INCUMPLIMIENTO

El artículo 651 del Estatuto Tributario establece las siguientes sanciones: por no enviar la información: multa hasta del 5% de las sumas respecto de las cuales no se suministró la información; por enviar información con errores: multa hasta del 4% de las sumas sobre las cuales se suministró información errónea; por enviar información de forma extemporánea: multa hasta del 3% de las sumas reportadas fuera de plazo. La sanción mínima es de $524.000 (10 UVT para 2026).

En CONTARAE nos encargamos de la preparación completa y presentación oportuna de la información exógena, garantizando la exactitud de los datos reportados y evitando sanciones.`
  }
];

const DOWNLOADS=[
  {n:"Checklist Declaración de Renta Persona Natural",d:"Lista completa de documentos necesarios para preparar su declaración de renta: certificados, extractos, soportes de bienes, deudas y deducciones.",f:"PDF"},
  {n:"Formato Autorización Tratamiento de Datos Personales",d:"Formato conforme a la Ley 1581 de 2012 y Decreto 1074 de 2015 para autorización expresa del tratamiento de datos personales.",f:"PDF"},
  {n:"Guía de Soportes para Certificación de Ingresos",d:"Documento detallado con los soportes requeridos según cada tipo de ingreso (laboral, pensión, arriendos, inversiones, independiente).",f:"PDF"},
  {n:"Calendario Tributario 2026",d:"Todas las fechas de vencimiento de obligaciones tributarias nacionales: renta, IVA, retención en la fuente, información exógena y más.",f:"PDF"},
  {n:"Modelo de Certificación de Ingresos",d:"Modelo de referencia de una certificación de ingresos emitida por Contador Público conforme a la Ley 43 de 1990 y lineamientos del CTCP.",f:"PDF"}
];

/* ══════════════════════════════════════════
   POLÍTICA DE TRATAMIENTO DE DATOS
   ══════════════════════════════════════════ */
const PRIVACY_SECTIONS=[
  {t:"1. Identificación del Responsable",c:"Nombre: CONTARAE — Servicios Contables, Tributarios y Financieros. Domicilio: Bogotá D.C., Colombia. Correo electrónico: info@contarae.com. Teléfono/WhatsApp: +57 3013101050. Sitio web: www.contarae.com."},
  {t:"2. Marco Normativo",c:"La presente política se rige por la Constitución Política de Colombia (artículo 15 — derecho a la intimidad y habeas data), la Ley Estatutaria 1581 de 2012 (Régimen General de Protección de Datos Personales), el Decreto 1074 de 2015 (que compiló el Decreto 1377 de 2013 — reglamentario parcial de la Ley 1581), y demás normas concordantes y complementarias vigentes en la República de Colombia."},
  {t:"3. Definiciones",c:"Conforme al artículo 3 de la Ley 1581 de 2012: Dato personal: cualquier información vinculada o que pueda asociarse a una o varias personas naturales determinadas o determinables. Dato sensible: dato que afecta la intimidad del titular o cuyo uso indebido puede generar discriminación (origen racial, orientación política, convicciones religiosas, datos de salud, entre otros). Titular: persona natural cuyos datos personales son objeto de tratamiento. Responsable del tratamiento: persona natural o jurídica que decide sobre la base de datos y/o el tratamiento de los datos. Encargado del tratamiento: persona natural o jurídica que realiza el tratamiento de datos por cuenta del responsable. Tratamiento: cualquier operación sobre datos personales (recolección, almacenamiento, uso, circulación, supresión). Autorización: consentimiento previo, expreso e informado del titular para el tratamiento de sus datos. Base de datos: conjunto organizado de datos personales que sea objeto de tratamiento."},
  {t:"4. Principios Rectores del Tratamiento",c:"CONTARAE aplica los principios establecidos en el artículo 4 de la Ley 1581 de 2012: (a) Legalidad: el tratamiento se sujeta a la ley y demás disposiciones vigentes. (b) Finalidad: el tratamiento obedece a una finalidad legítima, informada al titular. (c) Libertad: el tratamiento solo se ejerce con consentimiento previo, expreso e informado del titular. (d) Veracidad: la información es veraz, completa, exacta, actualizada y comprobable. (e) Transparencia: se garantiza al titular el derecho a obtener información sobre sus datos en cualquier momento. (f) Acceso y circulación restringida: el tratamiento se sujeta a los límites derivados de la naturaleza de los datos y la autorización del titular. (g) Seguridad: la información se maneja con medidas técnicas, humanas y administrativas para evitar su adulteración, pérdida, consulta, uso o acceso no autorizado. (h) Confidencialidad: todas las personas que intervengan en el tratamiento están obligadas a garantizar la reserva de la información."},
  {t:"5. Datos Personales Recopilados",c:"CONTARAE recopila las siguientes categorías de datos personales en el ejercicio de sus actividades: Datos de identificación: nombre completo, número de documento de identidad, lugar y fecha de expedición. Datos de contacto: dirección, teléfono, celular, correo electrónico. Datos financieros y tributarios: información de ingresos, patrimonio, extractos bancarios, estados financieros, declaraciones tributarias, certificados de inversiones, información de bienes y deudas. Estos datos se recopilan únicamente cuando son necesarios para la prestación de los servicios contables, tributarios y financieros contratados por el titular. Datos laborales: información de empleadores, cargos, antigüedad y remuneración, cuando sean necesarios para certificaciones de ingresos u otros servicios solicitados."},
  {t:"6. Finalidades del Tratamiento",c:"Los datos personales recopilados por CONTARAE serán utilizados para las siguientes finalidades: (a) Prestación de servicios contables, tributarios y financieros contratados por el titular. (b) Elaboración y expedición de certificaciones de ingresos, patrimonio y demás certificaciones contables. (c) Preparación y presentación de declaraciones tributarias ante la DIAN y demás entidades. (d) Gestión de nómina, seguridad social y obligaciones laborales del cliente. (e) Comunicación relacionada con los servicios contratados, incluyendo recordatorios de vencimientos y obligaciones. (f) Envío de información relevante sobre cambios normativos en materia contable, tributaria y financiera. (g) Facturación y gestión de cobro de los servicios prestados. (h) Atención de consultas, peticiones, quejas y reclamos. (i) Cumplimiento de obligaciones legales y requerimientos de autoridades competentes."},
  {t:"7. Derechos del Titular",c:"De conformidad con el artículo 8 de la Ley 1581 de 2012, el titular de los datos personales tiene los siguientes derechos: (a) Conocer, actualizar y rectificar sus datos personales. (b) Solicitar prueba de la autorización otorgada para el tratamiento. (c) Ser informado, previa solicitud, sobre el uso que se ha dado a sus datos. (d) Presentar quejas ante la Superintendencia de Industria y Comercio (SIC) por infracciones a la ley. (e) Revocar la autorización y/o solicitar la supresión de sus datos cuando considere que no se respetan los principios, derechos y garantías constitucionales y legales. (f) Acceder de forma gratuita a sus datos personales que hayan sido objeto de tratamiento. Estos derechos pueden ejercerse por el titular, sus causahabientes, su representante o apoderado, o por estipulación a favor de otro."},
  {t:"8. Autorización del Titular",c:"CONTARAE obtiene la autorización del titular de manera previa, expresa e informada, a través de los siguientes medios: (a) Formularios físicos o electrónicos que incluyan la finalidad del tratamiento y los derechos del titular. (b) Formularios del sitio web www.contarae.com que incluyan checkbox de aceptación de la presente política. (c) Mensajes de correo electrónico o WhatsApp en los que el titular manifieste su consentimiento de forma inequívoca. La autorización será conservada por CONTARAE en condiciones que permitan su consulta posterior, conforme al artículo 9 de la Ley 1581 de 2012 y el artículo 2.2.2.25.2.4 del Decreto 1074 de 2015."},
  {t:"9. Tratamiento de Datos Sensibles",c:"CONTARAE no recopila datos sensibles de forma sistemática. En caso excepcional de que el tratamiento de datos sensibles sea necesario para la prestación de algún servicio (por ejemplo, información de salud para certificaciones especiales), se informará al titular: (a) que no está obligado a autorizar dicho tratamiento; (b) cuáles datos sensibles serán tratados; (c) la finalidad específica del tratamiento. Se obtendrá autorización expresa y reforzada conforme a los artículos 5 y 6 de la Ley 1581 de 2012."},
  {t:"10. Datos de Menores de Edad",c:"CONTARAE no recopila ni trata datos personales de niños, niñas y adolescentes, salvo que sea estrictamente necesario para la prestación de un servicio solicitado por su representante legal (por ejemplo, cuando un menor es dependiente económico para efectos de la declaración de renta). En tales casos, se asegurará el respeto del interés superior del menor conforme al artículo 7 de la Ley 1581 de 2012 y se obtendrá la autorización del representante legal."},
  {t:"11. Deberes del Responsable",c:"En cumplimiento del artículo 17 de la Ley 1581 de 2012, CONTARAE se compromete a: (a) Garantizar al titular el pleno y efectivo ejercicio del derecho de habeas data. (b) Solicitar y conservar copia de la autorización otorgada por el titular. (c) Informar debidamente al titular sobre la finalidad de la recolección y los derechos que le asisten. (d) Garantizar que la información sea veraz, completa, exacta, actualizada, comprobable y comprensible. (e) Conservar la información bajo condiciones de seguridad para impedir su adulteración, pérdida, consulta, uso o acceso no autorizado o fraudulento. (f) Rectificar la información cuando sea incorrecta. (g) Tramitar las consultas y reclamos en los términos señalados en la ley. (h) Insertar en la base de datos la leyenda 'reclamo en trámite' cuando corresponda."},
  {t:"12. Medidas de Seguridad",c:"CONTARAE implementa medidas de seguridad de naturaleza técnica, humana y administrativa para proteger los datos personales contra acceso no autorizado, pérdida, alteración, destrucción o uso indebido. Estas medidas incluyen: (a) Técnicas: almacenamiento seguro de información digital, uso de contraseñas robustas, respaldos periódicos de información, uso de canales cifrados para la transmisión de datos sensibles. (b) Humanas: capacitación al personal sobre obligaciones de confidencialidad y manejo adecuado de datos personales, acuerdos de confidencialidad con colaboradores y contratistas. (c) Administrativas: procedimientos internos para el manejo de bases de datos, controles de acceso a la información según niveles de autorización, y protocolos de respuesta ante incidentes de seguridad."},
  {t:"13. Transferencia y Transmisión de Datos",c:"CONTARAE no realiza transferencia de datos personales a terceros países ni a terceros nacionales, salvo cuando sea estrictamente necesario para el cumplimiento de las finalidades del tratamiento o por mandato legal. En particular: (a) Podrá transmitir datos a la DIAN, Cámaras de Comercio, Superintendencia de Sociedades y demás entidades públicas en cumplimiento de obligaciones legales. (b) Podrá transmitir datos a entidades financieras o empleadores cuando el titular así lo autorice para efectos de certificaciones. (c) En caso de transferencia a terceros países, se verificará que el país destinatario proporcione niveles adecuados de protección de datos conforme al artículo 26 de la Ley 1581 de 2012, o que se cuente con la autorización expresa del titular."},
  {t:"14. Procedimiento para Consultas y Reclamos",c:"Consultas (artículo 14 de la Ley 1581): Los titulares podrán consultar su información personal mediante solicitud dirigida a info@contarae.com o al WhatsApp +57 3013101050. La consulta será atendida en un plazo máximo de diez (10) días hábiles contados a partir de la fecha de recibo. Si no fuere posible atenderla en dicho plazo, se informará al titular los motivos de la demora y la fecha en que será atendida, la cual no podrá superar los cinco (5) días hábiles siguientes al vencimiento del primer plazo. Reclamos (artículo 15 de la Ley 1581): Cuando el titular considere que su información debe ser corregida, actualizada o suprimida, o cuando advierta un incumplimiento de la ley, podrá presentar un reclamo a través de los mismos canales. El reclamo será atendido en un plazo máximo de quince (15) días hábiles. Si no fuere posible, se informará al titular los motivos y la nueva fecha, que no podrá superar los ocho (8) días hábiles siguientes. El reclamo debe contener: identificación del titular, descripción de los hechos, documentos de soporte (si aplican) y datos de contacto."},
  {t:"15. Canales de Atención",c:"Para ejercer sus derechos como titular de datos personales, puede comunicarse a través de los siguientes canales: Correo electrónico: info@contarae.com. WhatsApp: +57 3013101050. Dirección física: Bogotá D.C., Colombia. Horario de atención: lunes a viernes de 8:00 a.m. a 6:00 p.m."},
  {t:"16. Vigencia y Modificaciones",c:"La presente política entra en vigencia a partir de su publicación en el sitio web www.contarae.com y permanecerá vigente mientras CONTARAE continúe realizando el tratamiento de datos personales. Los datos personales serán conservados durante el tiempo que sea necesario para cumplir las finalidades descritas en esta política y las obligaciones legales aplicables (incluyendo los términos de firmeza de las declaraciones tributarias y las obligaciones de conservación de soportes contables establecidas en la ley colombiana). CONTARAE se reserva el derecho de modificar esta política en cualquier momento. Cualquier cambio será publicado en el sitio web y, cuando sea significativo, se comunicará a los titulares a través de los canales de atención disponibles."},
  {t:"17. Autoridad de Vigilancia",c:"La Superintendencia de Industria y Comercio (SIC), a través de la Delegatura para la Protección de Datos Personales, es la autoridad encargada de vigilar el cumplimiento de la legislación en materia de protección de datos personales en Colombia. El titular puede presentar quejas o denuncias ante la SIC cuando considere que sus derechos han sido vulnerados. Página web: www.sic.gov.co. Línea de atención: 01 8000 910 165."}
];

/* ══════════════════════════════════════════
   ESTILOS REUTILIZABLES
   ══════════════════════════════════════════ */
const IS={width:"100%",padding:"10px 13px",borderRadius:9,border:"1px solid #d0d9e8",fontSize:13,fontFamily:F,outline:"none",background:"#f8fafd",boxSizing:"border-box"};
const LS={fontSize:11,fontWeight:600,color:"#1B3A5C",display:"block",marginBottom:3,fontFamily:F};
const TS={fontSize:10,color:"#7A8FA8",display:"block",marginBottom:5,fontFamily:F};

/* ══════════════════════════════════════════
   COMPONENTES DE UI
   ══════════════════════════════════════════ */
const Sec=({id,title,sub,bg,children,narrow})=>(
  <section id={id} style={{padding:"88px 24px",background:bg||"transparent"}}>
    <div style={{maxWidth:narrow?900:1100,margin:"0 auto"}}>
      {title&&<div style={{textAlign:"center",marginBottom:52}}>
        {sub&&<div style={{fontSize:11,fontWeight:600,color:"#2563EB",letterSpacing:"2px",marginBottom:10,fontFamily:F}}>{sub}</div>}
        <h2 style={{fontFamily:FH,fontSize:"clamp(23px,3.5vw,37px)",fontWeight:700,color:"#0B1D3A"}}>{title}</h2>
      </div>}
      {children}
    </div>
  </section>
);

const Cd=({children,s})=>(
  <div style={{padding:26,borderRadius:15,background:"#fff",border:"1px solid rgba(37,99,235,.07)",transition:"transform .3s,box-shadow .3s",...s}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-3px)";e.currentTarget.style.boxShadow="0 8px 28px rgba(37,99,235,.06)";}} onMouseLeave={e=>{e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
    {children}
  </div>
);

/* Botón flotante WhatsApp */
function WaFloat(){
  return <a href={WL} target="_blank" rel="noopener noreferrer" style={{position:"fixed",bottom:28,right:28,zIndex:1000,width:60,height:60,borderRadius:"50%",background:"#25D366",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 4px 20px rgba(37,211,102,.4)",transition:"transform .3s",textDecoration:"none",fontSize:28}} onMouseEnter={e=>e.currentTarget.style.transform="scale(1.1)"} onMouseLeave={e=>e.currentTarget.style.transform="scale(1)"}>💬</a>;
}

/* Navegación */
function Nav(){
  const [menuOpen,setMenuOpen]=useState(false);
  const items=["Inicio","Servicios","Planes","Trámites","Certificación","Herramientas","Nosotros","Blog","Contacto"];
  return(
    <nav style={{position:"fixed",top:0,width:"100%",zIndex:200,padding:"12px 28px",display:"flex",alignItems:"center",justifyContent:"space-between",background:"rgba(8,27,57,.95)",backdropFilter:"blur(16px)",borderBottom:"1px solid rgba(96,165,250,.1)"}}>
      <span style={{fontFamily:FH,fontSize:21,fontWeight:700,color:"#fff",letterSpacing:"-0.5px"}}>CONTA<span style={{color:"#60A5FA"}}>RAE</span></span>
      <div style={{display:"flex",gap:18,flexWrap:"wrap",alignItems:"center"}}>
        {items.map(i=><a key={i} href={`#${i.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")}`} style={{textDecoration:"none",color:"rgba(255,255,255,.6)",fontSize:11,fontWeight:500,transition:"color .2s",fontFamily:F}} onMouseEnter={e=>e.target.style.color="#60A5FA"} onMouseLeave={e=>e.target.style.color="rgba(255,255,255,.6)"}>{i}</a>)}
        <a href={WL} target="_blank" rel="noopener noreferrer" style={{padding:"6px 15px",borderRadius:9,background:"linear-gradient(135deg,#2563EB,#60A5FA)",color:"#fff",fontSize:11,fontWeight:600,textDecoration:"none"}}>WhatsApp</a>
      </div>
    </nav>
  );
}

/* Hero */
function Hero(){
  return(
    <section id="inicio" style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"130px 24px 80px",position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:"-15%",right:"-8%",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(37,99,235,.07) 0%,transparent 70%)"}}/>
      <div style={{position:"absolute",bottom:"-10%",left:"-5%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,.05) 0%,transparent 70%)"}}/>
      <div style={{maxWidth:760,position:"relative",zIndex:1}}>
        <div style={{display:"inline-block",padding:"6px 20px",borderRadius:100,background:"rgba(37,99,235,.1)",fontSize:11,fontWeight:600,color:"#60A5FA",marginBottom:28,letterSpacing:"1.5px",fontFamily:F}}>SERVICIOS CONTABLES, TRIBUTARIOS Y FINANCIEROS</div>
        <h1 style={{fontFamily:FH,fontSize:"clamp(30px,5vw,56px)",fontWeight:700,lineHeight:1.12,color:"#0B1D3A",marginBottom:24}}>
          Su tranquilidad financiera <span style={{background:"linear-gradient(135deg,#1B3A5C,#60A5FA)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>comienza aquí</span>
        </h1>
        <p style={{fontSize:16,color:"#5A6F8A",lineHeight:1.75,maxWidth:580,margin:"0 auto 38px",fontFamily:F}}>En CONTARAE nos encargamos de su contabilidad, impuestos y finanzas para que usted se enfoque en hacer crecer su negocio. Contadores Públicos certificados con amplia experiencia en el manejo contable de empresas de diversos sectores en Colombia.</p>
        <div style={{display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
          <a href="#certificacion" style={{padding:"14px 32px",borderRadius:13,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:600,textDecoration:"none",boxShadow:"0 4px 20px rgba(37,99,235,.3)",transition:"transform .2s",fontFamily:F}} onMouseEnter={e=>e.target.style.transform="translateY(-2px)"} onMouseLeave={e=>e.target.style.transform="translateY(0)"}>Certificación de Ingresos</a>
          <a href="#planes" style={{padding:"14px 32px",borderRadius:13,color:"#1B3A5C",fontSize:15,fontWeight:600,textDecoration:"none",border:"2px solid rgba(27,58,92,.18)",transition:"border-color .2s",fontFamily:F}} onMouseEnter={e=>e.target.style.borderColor="rgba(37,99,235,.5)"} onMouseLeave={e=>e.target.style.borderColor="rgba(27,58,92,.18)"}>Ver Planes</a>
        </div>
      </div>
    </section>
  );
}

/* Servicios */
function ServicesSection(){
  return(
    <Sec id="servicios" title="Soluciones profesionales a la medida de su negocio" sub="NUESTROS SERVICIOS">
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-38,marginBottom:40,maxWidth:700,margin:"-38px auto 40px",lineHeight:1.7,fontFamily:F}}>Ofrecemos un portafolio completo de servicios contables, tributarios y financieros para empresas y personas naturales en Colombia. Cada servicio está diseñado para garantizar el cumplimiento normativo y optimizar la gestión de su negocio.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:20}}>
        {SERVICES.map((s,i)=>(
          <Cd key={i}>
            <div style={{fontSize:30,marginBottom:10}}>{s.icon}</div>
            <h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>{s.title}</h3>
            <p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{s.desc}</p>
            <a href={WL} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:12,fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar asesoría →</a>
          </Cd>
        ))}
      </div>
    </Sec>
  );
}

/* Planes */
function PlansSection(){
  return(
    <Sec id="planes" title="Servicio contable integral para su empresa" sub="PLANES MENSUALES" bg="linear-gradient(180deg,rgba(37,99,235,.03) 0%,transparent 100%)">
      <div style={{textAlign:"center",marginTop:-38,marginBottom:40}}>
        <p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.7,fontFamily:F,maxWidth:700,margin:"0 auto"}}>Aseguramos todos los procesos contables, tributarios y financieros de su negocio de forma permanente. Nuestros planes se ajustan al volumen de información y las necesidades específicas de cada cliente. Los precios indicados son valores de referencia.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(300px,1fr))",gap:20}}>
        {PLANS.map((p,i)=>(
          <div key={i} style={{padding:30,borderRadius:17,background:p.popular?"linear-gradient(135deg,#0B1D3A,#1B3A5C)":"#fff",border:p.popular?"none":"1px solid rgba(37,99,235,.08)",position:"relative",color:p.popular?"#fff":"#0B1D3A",transition:"transform .3s"}} onMouseEnter={e=>e.currentTarget.style.transform="translateY(-3px)"} onMouseLeave={e=>e.currentTarget.style.transform="translateY(0)"}>
            {p.popular&&<div style={{position:"absolute",top:-11,left:"50%",transform:"translateX(-50%)",background:"#60A5FA",color:"#fff",fontSize:10,fontWeight:700,padding:"3px 13px",borderRadius:100,fontFamily:F}}>MÁS POPULAR</div>}
            <h3 style={{fontSize:20,fontWeight:700,fontFamily:F}}>{p.name}</h3>
            <div style={{fontSize:12,opacity:.65,marginBottom:12,fontFamily:F}}>{p.target}</div>
            <div style={{fontSize:21,fontWeight:700,marginBottom:18,fontFamily:FH,color:p.popular?"#60A5FA":"#2563EB"}}>{p.price}</div>
            {p.features.map((f,j)=><div key={j} style={{fontSize:13,padding:"5px 0",borderBottom:`1px solid ${p.popular?"rgba(255,255,255,.07)":"rgba(37,99,235,.05)"}`,fontFamily:F,opacity:.88}}>✓ {f}</div>)}
            <a href={WL} target="_blank" rel="noopener noreferrer" style={{display:"block",marginTop:20,padding:"11px 22px",borderRadius:11,background:p.popular?"#60A5FA":"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",textAlign:"center",fontFamily:F}}>Solicitar información</a>
          </div>
        ))}
      </div>
      <p style={{textAlign:"center",marginTop:26,fontSize:13,color:"#5A6F8A",fontFamily:F}}>¿No sabe cuál plan necesita? <a href={WL} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>Agende una asesoría gratuita</a></p>
    </Sec>
  );
}

/* Trámites */
function TramitesSection(){
  return(
    <Sec id="tramites" title="Los trámites y servicios más solicitados" sub="TRÁMITES CLAVE">
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-38,marginBottom:40,maxWidth:700,margin:"-38px auto 40px",lineHeight:1.7,fontFamily:F}}>Estos son los servicios que nuestros clientes solicitan con mayor frecuencia. Todos se gestionan de forma ágil y profesional, garantizando el cumplimiento de la normatividad colombiana vigente.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:20}}>
        {TRAMITES.map((t,i)=>(
          <Cd key={i}>
            <div style={{fontSize:28,marginBottom:8}}>{t.icon}</div>
            <h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:6,fontFamily:F}}>{t.title}</h3>
            <p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.7,fontFamily:F}}>{t.desc}</p>
            <a href={t.link==="cert"?"#certificacion":WL} target={t.link==="wa"?"_blank":undefined} rel={t.link==="wa"?"noopener noreferrer":undefined} style={{display:"inline-block",marginTop:10,fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>{t.link==="cert"?"Solicitar al instante →":"Solicitar este servicio →"}</a>
          </Cd>
        ))}
      </div>
    </Sec>
  );
}

/* Certificación de Ingresos */
function CertSection(){
  const [form,setForm]=useState({n:"",cc:"",tel:"",email:"",dir:"",ent:"",per:"",iL:"",iP:"",iD:"",iI:"",iA:"",iR:"",iO:"",oD:"",com:""});
  const [sent,setSent]=useState(false);
  const u=(k,v)=>setForm(p=>({...p,[k]:v}));

  const ingresos=[
    ["Ingresos laborales","iL","Salario, prestaciones sociales y demás pagos derivados de una relación laboral con un empleador."],
    ["Ingresos por pensiones","iP","Mesada pensional recibida por vejez, invalidez o sobrevivencia otorgada por un fondo de pensiones."],
    ["Ingresos por dividendos","iD","Participaciones, utilidades o dividendos recibidos por ser socio o accionista de una sociedad comercial."],
    ["Ingresos por inversiones","iI","Rendimientos financieros provenientes de CDTs, fondos de inversión, cuentas de ahorro, acciones u otros instrumentos del mercado de valores."],
    ["Ingresos por arriendos","iA","Cánones de arrendamiento recibidos periódicamente por inmuebles (casas, apartamentos, locales, oficinas) de su propiedad."],
    ["Ingresos por remesas","iR","Dinero recibido periódicamente del exterior a través de giros internacionales o transferencias desde otros países."]
  ];

  return(
    <Sec id="certificacion" title="Solicite su certificación de ingresos al instante" sub="CERTIFICACIÓN DE INGRESOS" bg="linear-gradient(180deg,rgba(37,99,235,.04) 0%,transparent 100%)" narrow>
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-38,marginBottom:40,lineHeight:1.7,fontFamily:F}}>Respuesta inmediata · 100% en línea · Firmada por Contador Público con tarjeta profesional vigente</p>

      {/* Bloques informativos */}
      <div style={{display:"grid",gap:18,marginBottom:36}}>
        {[
          ["¿Qué es una certificación de ingresos?","Es un documento suscrito por un Contador Público con tarjeta profesional vigente ante la Junta Central de Contadores, en el cual se certifica de forma clara y verificable el nivel de ingresos de una persona natural. Se elabora con base en soportes documentales como extractos bancarios, contratos de trabajo, facturas, cuentas de cobro o comprobantes de pago que evidencien la realidad económica del solicitante."],
          ["¿Por qué debe estar firmada por un Contador Público?","Según el artículo 10 de la Ley 43 de 1990, la firma de un Contador Público otorga fe pública al documento, lo que significa que se presume, salvo prueba en contrario, que la información certificada cumple con los requisitos legales aplicables. Esto le confiere plena validez y credibilidad ante cualquier entidad pública o privada en Colombia. El Consejo Técnico de la Contaduría Pública (CTCP), mediante Concepto 1106 de 2019, ha ratificado que las certificaciones deben estar soportadas en documentación verificable."],
          ["¿Qué información se valida antes de emitir la certificación?","Nuestro equipo verifica: la identidad del solicitante (documento de identidad), las fuentes y montos de ingreso declarados, la coherencia entre los soportes documentales y las cifras a certificar, el período de certificación solicitado, y que la información sea susceptible de verificación conforme a los estándares profesionales de la contaduría pública en Colombia."],
          ["¿En qué casos se necesita una certificación de ingresos?","Las situaciones más comunes incluyen: solicitudes de crédito bancario o hipotecario, arrendamiento de inmuebles (requisito de inmobiliarias y aseguradoras de arriendo), compra de vehículo a través de financiación o leasing, trámites de visa o migratorios ante embajadas y consulados, procesos de contratación pública o privada y licitaciones, trámite de definición de situación militar (libreta militar) ante el Ministerio de Defensa, y trámites académicos o cualquier entidad que requiera acreditar formalmente la capacidad de pago del solicitante."]
        ].map(([t,d],i)=>(
          <div key={i} style={{padding:24,borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.07)"}}>
            <h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>{t}</h3>
            <p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{d}</p>
          </div>
        ))}
      </div>

      {/* Tarifas */}
      <div style={{padding:28,borderRadius:15,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",marginBottom:36,color:"#fff"}}>
        <h3 style={{fontSize:17,fontWeight:700,marginBottom:16,textAlign:"center",fontFamily:F}}>Tarifas según nivel de ingresos mensuales</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:9}}>
          {CERT_TARIFAS.map((t,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"10px 15px",borderRadius:8,background:"rgba(255,255,255,.07)",fontFamily:F}}>
              <span style={{fontSize:13,opacity:.85}}>{t.r}</span>
              <span style={{fontSize:14,fontWeight:700,color:"#60A5FA"}}>{t.t}</span>
            </div>
          ))}
        </div>
        <p style={{fontSize:11,opacity:.55,marginTop:12,textAlign:"center",fontFamily:F}}>El valor incluye revisión de soportes, elaboración del documento y firma por Contador Público con tarjeta profesional vigente. Entrega digital en formato PDF.</p>
        <div style={{marginTop:16,padding:14,borderRadius:9,background:"rgba(96,165,250,.14)",fontSize:12,lineHeight:1.6,fontFamily:F}}>
          <strong>Medios de pago:</strong> Wompi (tarjeta de crédito, tarjeta débito, PSE), Nequi, Daviplata o transferencia bancaria. Los datos de pago serán proporcionados una vez recibida su solicitud.
        </div>
      </div>

      {/* Proceso */}
      <div style={{marginBottom:36}}>
        <h3 style={{fontSize:17,fontWeight:700,color:"#0B1D3A",marginBottom:18,textAlign:"center",fontFamily:F}}>¿Cómo funciona el proceso?</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:14}}>
          {[
            ["1","Complete el formulario","Diligencie sus datos personales, la información de ingresos por cada fuente y el destino de la certificación."],
            ["2","Adjunte soportes y pago","Envíe por correo o WhatsApp sus extractos bancarios, contratos o comprobantes, junto con el comprobante de pago según el rango de ingresos."],
            ["3","Revisión profesional","Uno de nuestros Contadores Públicos revisará la documentación. Si falta algún documento o se requiere información adicional, nos comunicaremos de inmediato."],
            ["4","Reciba su certificado","Una vez verificada toda la información, recibirá su certificación de ingresos firmada por Contador Público en formato PDF a través de WhatsApp y al correo electrónico registrado."]
          ].map(([n,t,d],i)=>(
            <div key={i} style={{padding:20,borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.07)",textAlign:"center"}}>
              <div style={{width:36,height:36,borderRadius:"50%",background:"linear-gradient(135deg,#2563EB,#60A5FA)",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",fontWeight:700,fontSize:16,fontFamily:FH}}>{n}</div>
              <h4 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>{t}</h4>
              <p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.65,fontFamily:F}}>{d}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Formulario - Netlify Forms */}
      <div style={{padding:30,borderRadius:17,background:"#fff",border:"1px solid rgba(37,99,235,.1)",boxShadow:"0 6px 30px rgba(37,99,235,.05)"}}>
        <h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:6,textAlign:"center",fontFamily:F}}>Formulario de Solicitud</h3>
        <p style={{fontSize:13,color:"#5A6F8A",marginBottom:24,textAlign:"center",fontFamily:F}}>Complete la información a continuación y nos pondremos en contacto de inmediato</p>

        {!sent ? (
          <form name="certificacion" method="POST" data-netlify="true" onSubmit={e=>{e.preventDefault();setSent(true);}} style={{display:"grid",gap:18}}>
            <input type="hidden" name="form-name" value="certificacion" />

            {/* Datos personales */}
            <div style={{padding:18,borderRadius:11,background:"#f8fafd",border:"1px solid rgba(37,99,235,.05)"}}>
              <h4 style={{fontSize:13,fontWeight:700,color:"#1B3A5C",marginBottom:10,fontFamily:F}}>📋 Datos Personales</h4>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
                {[["Nombre completo","n"],["Número de cédula","cc"],["Teléfono / WhatsApp","tel"],["Correo electrónico","email"]].map(([l,k])=>(
                  <div key={k}><label style={LS}>{l}</label><input name={k} style={IS} value={form[k]} onChange={e=>u(k,e.target.value)} required/></div>
                ))}
              </div>
            </div>

            {/* Destino */}
            <div style={{padding:18,borderRadius:11,background:"#f8fafd",border:"1px solid rgba(37,99,235,.05)"}}>
              <h4 style={{fontSize:13,fontWeight:700,color:"#1B3A5C",marginBottom:10,fontFamily:F}}>🏢 Destino de la Certificación</h4>
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",gap:10}}>
                <div>
                  <label style={LS}>¿A quién va dirigida?</label>
                  <select name="dirigido" style={{...IS,cursor:"pointer"}} value={form.dir} onChange={e=>u("dir",e.target.value)} required>
                    <option value="">Seleccione...</option>
                    {["Banco o entidad financiera","Inmobiliaria o arrendador","Embajada o trámite migratorio","Concesionario de vehículos","Entidad pública","Proceso de contratación o licitación","Otro destino"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
                <div><label style={LS}>Nombre de la entidad destino</label><input name="entidad" style={IS} value={form.ent} onChange={e=>u("ent",e.target.value)} placeholder="Ej: Bancolombia, Century 21..."/></div>
                <div>
                  <label style={LS}>Período a certificar</label>
                  <select name="periodo" style={{...IS,cursor:"pointer"}} value={form.per} onChange={e=>u("per",e.target.value)} required>
                    <option value="">Seleccione...</option>
                    {["Último mes","Últimos 3 meses","Últimos 6 meses","Último año (12 meses)","Otro período"].map(o=><option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Ingresos */}
            <div style={{padding:18,borderRadius:11,background:"#f8fafd",border:"1px solid rgba(37,99,235,.05)"}}>
              <h4 style={{fontSize:13,fontWeight:700,color:"#1B3A5C",marginBottom:4,fontFamily:F}}>💰 Detalle de Ingresos Mensuales</h4>
              <p style={{...TS,marginBottom:14}}>Diligencie únicamente los tipos de ingreso que apliquen a su caso. Indique el valor mensual aproximado en pesos colombianos (COP).</p>
              <div style={{display:"grid",gap:12}}>
                {ingresos.map(([l,k,tip])=>(
                  <div key={k}>
                    <label style={LS}>{l}</label>
                    <span style={TS}>{tip}</span>
                    <input name={k} style={IS} value={form[k]} onChange={e=>u(k,e.target.value)} placeholder="$ Valor mensual"/>
                  </div>
                ))}
                <div>
                  <label style={LS}>Otros ingresos</label>
                  <span style={TS}>Honorarios, comisiones, actividades independientes, prestación de servicios u otros conceptos no contemplados anteriormente.</span>
                  <input name="otrosIngresos" style={IS} value={form.iO} onChange={e=>u("iO",e.target.value)} placeholder="$ Valor mensual"/>
                  <input name="otrosDescripcion" style={{...IS,marginTop:6}} value={form.oD} onChange={e=>u("oD",e.target.value)} placeholder="Describa el concepto de estos ingresos"/>
                </div>
              </div>
            </div>

            {/* Comentarios y soportes */}
            <div style={{padding:18,borderRadius:11,background:"#f8fafd",border:"1px solid rgba(37,99,235,.05)"}}>
              <h4 style={{fontSize:13,fontWeight:700,color:"#1B3A5C",marginBottom:10,fontFamily:F}}>📎 Comentarios y Soportes</h4>
              <label style={LS}>Comentarios u observaciones</label>
              <textarea name="comentarios" style={{...IS,minHeight:70,resize:"vertical"}} value={form.com} onChange={e=>u("com",e.target.value)} placeholder="Indique cualquier información adicional relevante para su certificación..."/>
              <div style={{marginTop:12,padding:14,borderRadius:9,background:"rgba(37,99,235,.04)",border:"1px dashed rgba(37,99,235,.18)"}}>
                <p style={{fontSize:12,color:"#1B3A5C",fontWeight:600,marginBottom:5,fontFamily:F}}>📄 Documentos requeridos (enviar por correo o WhatsApp junto con esta solicitud):</p>
                <p style={{fontSize:11,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>
                  • Copia de su documento de identidad (cédula de ciudadanía o cédula de extranjería)<br/>
                  • Extractos bancarios recientes donde se evidencien los ingresos declarados<br/>
                  • Soportes de la fuente del ingreso según corresponda (contratos laborales, desprendibles de nómina, facturas, cuentas de cobro, contratos de arrendamiento, certificados de inversiones)<br/>
                  • <strong>Comprobante de pago del servicio</strong> según el rango de ingresos correspondiente (ver tabla de tarifas)
                </p>
              </div>
            </div>

            {/* Botón enviar */}
            <div style={{textAlign:"center"}}>
              <button type="submit" style={{padding:"13px 44px",borderRadius:13,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:15,fontWeight:700,border:"none",cursor:"pointer",boxShadow:"0 4px 20px rgba(37,99,235,.3)",fontFamily:F,transition:"transform .2s"}} onMouseEnter={e=>e.target.style.transform="translateY(-2px)"} onMouseLeave={e=>e.target.style.transform="translateY(0)"}>
                Enviar Solicitud
              </button>
              <p style={{fontSize:12,color:"#5A6F8A",marginTop:12,fontFamily:F}}>
                ¿Prefiere WhatsApp? <a href={WL} target="_blank" rel="noopener noreferrer" style={{color:"#2563EB",fontWeight:600,textDecoration:"none"}}>Escríbanos directamente</a>
              </p>
            </div>

            {/* Mensaje profesional */}
            <div style={{padding:16,borderRadius:10,background:"rgba(37,99,235,.04)",border:"1px solid rgba(37,99,235,.08)",textAlign:"center"}}>
              <p style={{fontSize:12,color:"#1B3A5C",lineHeight:1.75,fontFamily:F}}>
                Una vez recibida su solicitud, nuestro equipo verificará la información y los soportes adjuntos. En caso de requerirse información adicional, <strong>uno de nuestros profesionales se contactará con usted a la mayor brevedad</strong>. Si toda la documentación está completa y el pago ha sido confirmado, recibirá su certificación de ingresos firmada por Contador Público en formato PDF a través de WhatsApp y al correo electrónico registrado.
              </p>
            </div>
          </form>
        ) : (
          <div style={{textAlign:"center",padding:36}}>
            <div style={{fontSize:44,marginBottom:14}}>✅</div>
            <h3 style={{fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F}}>¡Solicitud recibida exitosamente!</h3>
            <p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.7,fontFamily:F,maxWidth:500,margin:"0 auto"}}>Recuerde enviar los soportes documentales y el comprobante de pago a nuestro correo ({EM}) o WhatsApp. Nos comunicaremos con usted de inmediato.</p>
            <div style={{display:"flex",gap:12,justifyContent:"center",marginTop:22}}>
              <a href={WL} target="_blank" rel="noopener noreferrer" style={{padding:"11px 24px",borderRadius:11,background:"#25D366",color:"#fff",fontSize:13,fontWeight:600,textDecoration:"none",fontFamily:F}}>Enviar soportes por WhatsApp</a>
              <button onClick={()=>setSent(false)} style={{padding:"11px 24px",borderRadius:11,background:"transparent",color:"#2563EB",fontSize:13,fontWeight:600,border:"2px solid rgba(37,99,235,.2)",cursor:"pointer",fontFamily:F}}>Nueva solicitud</button>
            </div>
          </div>
        )}
      </div>
    </Sec>
  );
}

/* Herramientas */
function ToolsSection(){
  const [calcInput,setCalcInput]=useState("");
  const [calcResult,setCalcResult]=useState(null);
  const [rentaForm,setRentaForm]=useState({i:"",p:"",c:"",tc:"",b:""});
  const [rentaResult,setRentaResult]=useState(null);
  const uvt=49799; // UVT 2025

  const calcRetencion=()=>{
    const ing=parseFloat(calcInput.replace(/\./g,"").replace(/,/g,""))||0;
    if(ing<=0)return;
    let u2=ing/uvt,r=0;
    if(u2<=95)r=0;
    else if(u2<=150)r=(ing-95*uvt)*.19;
    else if(u2<=360)r=55*uvt*.19+(ing-150*uvt)*.28;
    else if(u2<=640)r=55*uvt*.19+210*uvt*.28+(ing-360*uvt)*.33;
    else if(u2<=945)r=55*uvt*.19+210*uvt*.28+280*uvt*.33+(ing-640*uvt)*.35;
    else if(u2<=2300)r=55*uvt*.19+210*uvt*.28+280*uvt*.33+305*uvt*.35+(ing-945*uvt)*.37;
    else r=55*uvt*.19+210*uvt*.28+280*uvt*.33+305*uvt*.35+1355*uvt*.37+(ing-2300*uvt)*.39;
    setCalcResult({i:ing,r:Math.max(0,Math.round(r)),t:ing>0?((Math.max(0,r)/ing)*100).toFixed(1):"0"});
  };

  const checkRenta=()=>{
    const v=k=>parseFloat(rentaForm[k].replace(/\./g,"").replace(/,/g,""))||0;
    const i=v("i"),p=v("p"),c=v("c"),tc=v("tc"),b=v("b");
    const tope1400=1400*uvt, tope4500=4500*uvt;
    const obligado=i>tope1400||p>tope4500||c>tope1400||tc>tope1400||b>tope1400;
    const razones=[];
    if(i>tope1400)razones.push(`Sus ingresos brutos ($${fm(i)}) superan el tope de 1.400 UVT ($${fm(Math.round(tope1400))})`);
    if(p>tope4500)razones.push(`Su patrimonio bruto ($${fm(p)}) supera el tope de 4.500 UVT ($${fm(Math.round(tope4500))})`);
    if(c>tope1400)razones.push(`Sus compras y consumos ($${fm(c)}) superan el tope de 1.400 UVT ($${fm(Math.round(tope1400))})`);
    if(tc>tope1400)razones.push(`Sus consumos con tarjeta de crédito ($${fm(tc)}) superan el tope de 1.400 UVT ($${fm(Math.round(tope1400))})`);
    if(b>tope1400)razones.push(`Sus consignaciones bancarias ($${fm(b)}) superan el tope de 1.400 UVT ($${fm(Math.round(tope1400))})`);
    setRentaResult({obligado,razones});
  };

  return(
    <Sec id="herramientas" title="Calcule y consulte al instante" sub="HERRAMIENTAS GRATUITAS">
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-38,marginBottom:40,maxWidth:700,margin:"-38px auto 40px",lineHeight:1.7,fontFamily:F}}>Herramientas de consulta rápida basadas en la normatividad tributaria colombiana vigente. Los resultados son estimados y no reemplazan la asesoría profesional.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(440px,1fr))",gap:22}}>
        {/* Calculadora */}
        <Cd s={{padding:26}}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>🧮 Calculadora de Retención en la Fuente</h3>
          <p style={{fontSize:12,color:"#5A6F8A",marginBottom:16,lineHeight:1.6,fontFamily:F}}>Estime la retención en la fuente aplicable a sus ingresos laborales mensuales. Cálculo basado en el procedimiento 1 del artículo 383 del Estatuto Tributario (tabla del art. 241 ET) con valores aproximados.</p>
          <label style={LS}>Ingreso mensual bruto (COP)</label>
          <div style={{display:"flex",gap:9,marginTop:5}}>
            <input style={IS} value={calcInput} onChange={e=>setCalcInput(e.target.value)} placeholder="Ej: 5000000"/>
            <button onClick={calcRetencion} style={{padding:"10px 20px",borderRadius:10,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F,whiteSpace:"nowrap"}}>Calcular</button>
          </div>
          {calcResult&&(
            <div style={{marginTop:16,padding:18,borderRadius:11,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,textAlign:"center"}}>
                <div><div style={{fontSize:10,opacity:.55,fontFamily:F}}>Ingreso bruto</div><div style={{fontSize:15,fontWeight:700,fontFamily:F}}>${fm(calcResult.i)}</div></div>
                <div><div style={{fontSize:10,opacity:.55,fontFamily:F}}>Retención estimada</div><div style={{fontSize:15,fontWeight:700,color:"#60A5FA",fontFamily:F}}>${fm(calcResult.r)}</div></div>
                <div><div style={{fontSize:10,opacity:.55,fontFamily:F}}>Tasa efectiva</div><div style={{fontSize:15,fontWeight:700,fontFamily:F}}>{calcResult.t}%</div></div>
              </div>
              <p style={{fontSize:10,opacity:.45,marginTop:10,textAlign:"center",fontFamily:F}}>* Estimado con UVT 2025: $49.799. No incluye deducciones ni rentas exentas. Consulte con nuestros profesionales para un cálculo personalizado.</p>
            </div>
          )}
        </Cd>

        {/* Obligado a declarar */}
        <Cd s={{padding:26}}>
          <h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:5,fontFamily:F}}>📝 ¿Está obligado a declarar renta?</h3>
          <p style={{fontSize:12,color:"#5A6F8A",marginBottom:16,lineHeight:1.6,fontFamily:F}}>Verifique si debe presentar declaración de renta por el año gravable 2025 (a declarar entre agosto y octubre de 2026). Basado en los topes definidos por la DIAN mediante Decreto 2229 de 2023. UVT 2025: $49.799.</p>
          <div style={{display:"grid",gap:9}}>
            {[
              ["Ingresos brutos anuales 2025","i","Tope: $69.718.600 (1.400 UVT)"],
              ["Patrimonio bruto a dic 31/2025","p","Tope: $224.095.500 (4.500 UVT)"],
              ["Compras y consumos totales 2025","c","Tope: $69.718.600 (1.400 UVT)"],
              ["Consumos con tarjeta de crédito 2025","tc","Tope: $69.718.600 (1.400 UVT)"],
              ["Consignaciones bancarias, depósitos o inversiones 2025","b","Tope: $69.718.600 (1.400 UVT)"]
            ].map(([l,k,tip])=>(
              <div key={k}>
                <label style={LS}>{l}</label>
                <span style={{fontSize:9,color:"#7A8FA8",fontFamily:F}}>{tip}</span>
                <input style={{...IS,marginTop:3}} value={rentaForm[k]} onChange={e=>setRentaForm(p=>({...p,[k]:e.target.value}))} placeholder="$ Valor anual"/>
              </div>
            ))}
            <button onClick={checkRenta} style={{padding:"10px 20px",borderRadius:10,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:12,fontWeight:600,border:"none",cursor:"pointer",fontFamily:F,marginTop:4}}>Verificar obligación</button>
          </div>
          {rentaResult&&(
            <div style={{marginTop:16,padding:18,borderRadius:11,background:rentaResult.obligado?"rgba(220,38,38,.07)":"rgba(22,163,74,.07)",border:`1px solid ${rentaResult.obligado?"rgba(220,38,38,.16)":"rgba(22,163,74,.16)"}`}}>
              <div style={{fontSize:15,fontWeight:700,color:rentaResult.obligado?"#DC2626":"#16A34A",marginBottom:6,fontFamily:F}}>
                {rentaResult.obligado?"⚠️ Probablemente SÍ está obligado a declarar renta":"✅ Con base en los datos ingresados, posiblemente NO está obligado a declarar renta"}
              </div>
              {rentaResult.razones.length>0&&rentaResult.razones.map((r,i)=><p key={i} style={{fontSize:12,color:"#5A6F8A",lineHeight:1.6,fontFamily:F}}>• {r}</p>)}
              <p style={{fontSize:10,color:"#7A8FA8",marginTop:10,lineHeight:1.6,fontFamily:F}}>* Verificación preliminar basada en los topes generales del Decreto 2229 de 2023. Tenga en cuenta que también están obligados a declarar quienes sean responsables de IVA al cierre del año gravable, independientemente de los montos. Consulte con nuestros profesionales para una evaluación completa de su situación particular.</p>
              <a href={WL} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:10,fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Solicitar asesoría personalizada →</a>
            </div>
          )}
        </Cd>
      </div>
    </Sec>
  );
}

/* Nosotros */
function AboutSection(){
  return(
    <Sec id="nosotros" title="Conozca a CONTARAE" sub="NOSOTROS" bg="linear-gradient(180deg,rgba(37,99,235,.03) 0%,transparent 100%)" narrow>
      <div style={{padding:30,borderRadius:16,background:"#fff",border:"1px solid rgba(37,99,235,.07)",marginBottom:20}}>
        <h3 style={{fontSize:17,fontWeight:700,color:"#0B1D3A",marginBottom:10,fontFamily:F}}>¿Quiénes somos?</h3>
        <p style={{fontSize:14,color:"#5A6F8A",lineHeight:1.8,fontFamily:F}}>CONTARAE es una firma de servicios contables, tributarios y financieros comprometida con la excelencia profesional y la satisfacción de nuestros clientes. Contamos con un equipo de Contadores Públicos certificados, con tarjeta profesional vigente ante la Junta Central de Contadores y amplia experiencia en el manejo contable de empresas de diversos sectores y tamaños en Colombia. Nos especializamos en brindar soluciones integrales y personalizadas que permiten a nuestros clientes cumplir con sus obligaciones legales y fiscales, mientras optimizan la gestión de sus recursos financieros. Cada cliente recibe un trato profesional, cercano y confidencial, porque entendemos que detrás de cada número hay una historia, un esfuerzo y un proyecto de vida.</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:18}}>
        <div style={{padding:26,borderRadius:14,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",color:"#fff"}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Nuestra Misión</h3>
          <p style={{fontSize:13,lineHeight:1.75,opacity:.9,fontFamily:F}}>Brindar servicios contables, tributarios y financieros de alta calidad, con responsabilidad, oportunidad y transparencia, contribuyendo al crecimiento sostenible de nuestros clientes mediante soluciones integrales y personalizadas que garanticen el cumplimiento normativo y la optimización de sus recursos.</p>
        </div>
        <div style={{padding:26,borderRadius:14,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff"}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:8,fontFamily:F}}>Nuestra Visión</h3>
          <p style={{fontSize:13,lineHeight:1.75,opacity:.9,fontFamily:F}}>Ser reconocidos como una firma líder en servicios contables y financieros en Colombia, destacándonos por la innovación en nuestros procesos, el profesionalismo de nuestro equipo y la confianza que generamos en cada uno de nuestros clientes, siendo su aliado estratégico de largo plazo para el éxito financiero de sus negocios.</p>
        </div>
      </div>
      <div style={{marginTop:18,padding:26,borderRadius:14,background:"#fff",border:"1px solid rgba(37,99,235,.07)"}}>
        <h3 style={{fontSize:16,fontWeight:700,color:"#0B1D3A",marginBottom:12,fontFamily:F}}>Nuestros Valores</h3>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:10}}>
          {[
            ["Transparencia","Información clara y veraz en todo momento."],
            ["Responsabilidad","Cumplimiento oportuno de cada compromiso."],
            ["Confidencialidad","Su información financiera está protegida."],
            ["Excelencia profesional","Calidad y rigor en cada servicio."],
            ["Compromiso","Su éxito financiero es nuestro objetivo."],
            ["Ética","Actuamos con integridad y rectitud."]
          ].map(([v,d],i)=>(
            <div key={i} style={{padding:"10px 14px",borderRadius:9,background:"rgba(37,99,235,.04)"}}>
              <div style={{fontSize:13,fontWeight:700,color:"#1B3A5C",fontFamily:F}}>✦ {v}</div>
              <div style={{fontSize:11,color:"#5A6F8A",marginTop:2,fontFamily:F}}>{d}</div>
            </div>
          ))}
        </div>
      </div>
    </Sec>
  );
}

/* Blog con artículos expandibles */
function BlogSection(){
  const [expanded,setExpanded]=useState(null);
  return(
    <Sec id="blog" title="Artículos y guías para su negocio" sub="BLOG Y RECURSOS">
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-38,marginBottom:40,maxWidth:700,margin:"-38px auto 40px",lineHeight:1.7,fontFamily:F}}>Información actualizada sobre temas contables, tributarios y financieros en Colombia, basada en la normatividad vigente y fuentes oficiales de la DIAN.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:20}}>
        {BLOG.map((p,i)=>(
          <div key={i} style={{borderRadius:15,background:"#fff",border:"1px solid rgba(37,99,235,.07)",overflow:"hidden",transition:"box-shadow .3s"}} onMouseEnter={e=>e.currentTarget.style.boxShadow="0 6px 24px rgba(37,99,235,.06)"} onMouseLeave={e=>e.currentTarget.style.boxShadow="none"}>
            <div style={{padding:26}}>
              <div style={{display:"flex",gap:7,marginBottom:10}}>
                <span style={{fontSize:10,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.07)",padding:"3px 10px",borderRadius:100,fontFamily:F}}>{p.tag}</span>
                <span style={{fontSize:10,color:"#7A8FA8",padding:"3px 0",fontFamily:F}}>{p.date}</span>
              </div>
              <h3 style={{fontSize:15,fontWeight:700,color:"#0B1D3A",marginBottom:8,fontFamily:F,lineHeight:1.4}}>{p.title}</h3>
              <p style={{fontSize:13,color:"#5A6F8A",lineHeight:1.65,fontFamily:F}}>{p.excerpt}</p>
              <button onClick={()=>setExpanded(expanded===i?null:i)} style={{display:"inline-block",marginTop:12,fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F,background:"none",border:"none",cursor:"pointer",padding:0}}>
                {expanded===i?"Cerrar ✕":"Leer más →"}
              </button>
            </div>
            {expanded===i&&(
              <div style={{padding:"0 26px 26px",borderTop:"1px solid rgba(37,99,235,.06)"}}>
                <div style={{paddingTop:18,fontSize:13,color:"#3a5068",lineHeight:1.85,fontFamily:F,whiteSpace:"pre-line"}}>{p.content}</div>
                <div style={{marginTop:16,padding:14,borderRadius:10,background:"rgba(37,99,235,.04)"}}>
                  <p style={{fontSize:12,color:"#1B3A5C",fontWeight:600,fontFamily:F}}>¿Necesita ayuda con este trámite?</p>
                  <a href={WL} target="_blank" rel="noopener noreferrer" style={{display:"inline-block",marginTop:6,fontSize:12,color:"#2563EB",fontWeight:600,textDecoration:"none",fontFamily:F}}>Consultar por WhatsApp →</a>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* Descarga de formatos */
function DownloadsSection(){
  return(
    <Sec title="Formatos y guías gratuitas para descargar" sub="RECURSOS DESCARGABLES" bg="linear-gradient(180deg,rgba(37,99,235,.03) 0%,transparent 100%)" narrow>
      <p style={{textAlign:"center",fontSize:14,color:"#5A6F8A",marginTop:-38,marginBottom:40,lineHeight:1.7,fontFamily:F}}>Documentos de referencia para facilitar sus trámites contables y tributarios. Solicítelos sin costo a través de nuestro WhatsApp.</p>
      <div style={{display:"grid",gap:12}}>
        {DOWNLOADS.map((d,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"18px 24px",borderRadius:13,background:"#fff",border:"1px solid rgba(37,99,235,.07)",gap:16,flexWrap:"wrap"}}>
            <div style={{flex:1,minWidth:240}}>
              <h4 style={{fontSize:14,fontWeight:700,color:"#0B1D3A",fontFamily:F}}>{d.n}</h4>
              <p style={{fontSize:12,color:"#5A6F8A",marginTop:3,lineHeight:1.5,fontFamily:F}}>{d.d}</p>
            </div>
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <span style={{fontSize:10,fontWeight:600,color:"#2563EB",background:"rgba(37,99,235,.07)",padding:"3px 10px",borderRadius:100,fontFamily:F}}>{d.f}</span>
              <a href={`${WL}?text=${encodeURIComponent(`Hola, me gustaría solicitar el formato: ${d.n}`)}`} target="_blank" rel="noopener noreferrer" style={{padding:"8px 18px",borderRadius:9,background:"linear-gradient(135deg,#1B3A5C,#2563EB)",color:"#fff",fontSize:12,fontWeight:600,textDecoration:"none",fontFamily:F,whiteSpace:"nowrap"}}>Solicitar por WhatsApp</a>
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* FAQ */
function FaqSection(){
  const [open,setOpen]=useState(null);
  return(
    <Sec id="faq" title="Preguntas frecuentes" sub="RESOLVEMOS SUS DUDAS" narrow>
      <div style={{display:"grid",gap:10}}>
        {FAQS.map((f,i)=>(
          <div key={i} style={{borderRadius:12,background:"#fff",border:"1px solid rgba(37,99,235,.07)",overflow:"hidden",cursor:"pointer"}} onClick={()=>setOpen(open===i?null:i)}>
            <div style={{padding:"16px 22px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontSize:14,fontWeight:600,color:"#0B1D3A",fontFamily:F,flex:1}}>{f.q}</span>
              <span style={{fontSize:18,color:"#2563EB",transform:open===i?"rotate(45deg)":"rotate(0)",transition:"transform .3s",marginLeft:10}}>+</span>
            </div>
            {open===i&&<div style={{padding:"0 22px 16px",fontSize:13,color:"#5A6F8A",lineHeight:1.75,fontFamily:F}}>{f.a}</div>}
          </div>
        ))}
      </div>
    </Sec>
  );
}

/* Política de Datos */
function PrivacySection(){
  const [show,setShow]=useState(false);
  return(
    <div style={{maxWidth:900,margin:"0 auto",padding:"0 24px"}}>
      <div style={{textAlign:"center",marginBottom:20}}>
        <button onClick={()=>setShow(!show)} style={{background:"none",border:"none",color:"#2563EB",fontSize:13,fontWeight:600,cursor:"pointer",fontFamily:F,textDecoration:"underline"}}>
          {show?"Ocultar":"Consultar"} Política de Tratamiento de Datos Personales
        </button>
      </div>
      {show&&(
        <div style={{padding:30,borderRadius:16,background:"#fff",border:"1px solid rgba(37,99,235,.07)",marginBottom:40}}>
          <h3 style={{fontFamily:FH,fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:6,textAlign:"center"}}>Política de Tratamiento de Datos Personales</h3>
          <p style={{fontSize:12,color:"#5A6F8A",marginBottom:24,textAlign:"center",fontFamily:F}}>CONTARAE — Servicios Contables, Tributarios y Financieros</p>
          {PRIVACY_SECTIONS.map((s,i)=>(
            <div key={i} style={{marginBottom:18}}>
              <h4 style={{fontSize:14,fontWeight:700,color:"#1B3A5C",marginBottom:6,fontFamily:F}}>{s.t}</h4>
              <p style={{fontSize:12,color:"#5A6F8A",lineHeight:1.85,fontFamily:F}}>{s.c}</p>
            </div>
          ))}
          <div style={{marginTop:24,padding:16,borderRadius:10,background:"rgba(37,99,235,.04)",textAlign:"center"}}>
            <p style={{fontSize:11,color:"#1B3A5C",lineHeight:1.7,fontFamily:F}}>Al utilizar nuestros servicios, diligenciar formularios en este sitio web o comunicarse con nosotros a través de cualquier canal, usted declara conocer y autorizar el tratamiento de sus datos personales conforme a la presente política.</p>
          </div>
          <p style={{fontSize:10,color:"#7A8FA8",marginTop:16,textAlign:"center",fontFamily:F}}>Última actualización: Abril 2026</p>
        </div>
      )}
    </div>
  );
}

/* Contacto + Footer */
function ContactFooter(){
  return(
    <>
      <section id="contacto" style={{padding:"88px 24px"}}>
        <div style={{maxWidth:680,margin:"0 auto",textAlign:"center",padding:"56px 38px",borderRadius:22,background:"linear-gradient(135deg,#0B1D3A,#1B3A5C)",position:"relative",overflow:"hidden"}}>
          <div style={{position:"absolute",top:-50,right:-50,width:180,height:180,borderRadius:"50%",background:"rgba(96,165,250,.1)"}}/>
          <div style={{position:"absolute",bottom:-30,left:-30,width:130,height:130,borderRadius:"50%",background:"rgba(255,255,255,.04)"}}/>
          <h2 style={{fontFamily:FH,fontSize:"clamp(22px,3.5vw,34px)",fontWeight:700,color:"#fff",marginBottom:12,position:"relative"}}>¿Listo para ordenar sus finanzas?</h2>
          <p style={{fontSize:14,color:"rgba(255,255,255,.7)",marginBottom:14,lineHeight:1.7,position:"relative",fontFamily:F}}>Contáctenos hoy y reciba una asesoría inicial sin costo. Nuestro equipo de Contadores Públicos está listo para ayudarle con cualquier necesidad contable, tributaria o financiera.</p>
          <p style={{fontSize:13,color:"rgba(255,255,255,.5)",marginBottom:28,fontFamily:F,position:"relative"}}>Correo: {EM} | WhatsApp: +57 301 310 1050 | Bogotá, Colombia</p>
          <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",position:"relative"}}>
            <a href={WL} target="_blank" rel="noopener noreferrer" style={{padding:"13px 30px",borderRadius:13,background:"#25D366",color:"#fff",fontSize:14,fontWeight:700,textDecoration:"none",fontFamily:F}}>Escribir por WhatsApp</a>
            <a href={`mailto:${EM}`} style={{padding:"13px 30px",borderRadius:13,background:"rgba(255,255,255,.12)",color:"#fff",fontSize:14,fontWeight:600,textDecoration:"none",border:"1px solid rgba(255,255,255,.18)",fontFamily:F}}>Enviar correo</a>
          </div>
        </div>
      </section>
      <PrivacySection/>
      <footer style={{padding:"36px 24px",textAlign:"center",borderTop:"1px solid rgba(37,99,235,.07)"}}>
        <div style={{fontFamily:FH,fontSize:20,fontWeight:700,color:"#0B1D3A",marginBottom:5}}>CONTA<span style={{color:"#2563EB"}}>RAE</span></div>
        <p style={{fontSize:11,color:"#7A8FA8",fontFamily:F}}>Servicios Contables, Tributarios y Financieros</p>
        <p style={{fontSize:10,color:"#A0B0C0",marginTop:8,fontFamily:F}}>© 2026 CONTARAE · Bogotá D.C., Colombia · Todos los derechos reservados</p>
        <p style={{fontSize:10,color:"#A0B0C0",marginTop:4,fontFamily:F}}>Ley 1581 de 2012 — Protección de Datos Personales</p>
      </footer>
    </>
  );
}

/* ══════════════════════════════════════════
   APLICACIÓN PRINCIPAL
   ══════════════════════════════════════════ */
export default function App(){
  useEffect(()=>{
    const obs=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{
        if(entry.isIntersecting){
          entry.target.style.opacity="1";
          entry.target.style.transform="translateY(0)";
        }
      });
    },{threshold:0.08});
    setTimeout(()=>{
      document.querySelectorAll(".ai").forEach(el=>{
        el.style.opacity="0";
        el.style.transform="translateY(22px)";
        el.style.transition="opacity .65s ease,transform .65s ease";
        obs.observe(el);
      });
    },100);
    return()=>obs.disconnect();
  },[]);

  return(
    <div style={{fontFamily:F,color:"#0B1D3A",background:"#f8fafd",minHeight:"100vh"}}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Outfit:wght@300;400;500;600;700&display=swap');
        *{margin:0;padding:0;box-sizing:border-box;}
        html{scroll-behavior:smooth;}
        ::selection{background:#2563EB;color:#fff;}
      `}</style>
      <Nav/>
      <Hero/>
      <div className="ai"><ServicesSection/></div>
      <div className="ai"><PlansSection/></div>
      <div className="ai"><TramitesSection/></div>
      <div className="ai"><CertSection/></div>
      <div className="ai"><ToolsSection/></div>
      <div className="ai"><AboutSection/></div>
      <div className="ai"><BlogSection/></div>
      <div className="ai"><DownloadsSection/></div>
      <div className="ai"><FaqSection/></div>
      <div className="ai"><ContactFooter/></div>
      <WaFloat/>
    </div>
  );
}
