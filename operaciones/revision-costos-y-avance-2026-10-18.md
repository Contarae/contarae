# Revision de costos y avance de CONTARAE

Fecha de revision: 18 de octubre de 2026, America/Bogota.

## Alcance y limites de la evidencia

Revision del codigo en `3975175`, configuracion, dependencias, documentacion operativa, pagina publica y tarifas oficiales. No se modificaron funciones, formularios, pagos, datos de clientes, suscripciones ni despliegues. Las tarifas publicadas no demuestran el plan contratado ni el valor de una factura.

Se consultaron los paneles autenticados del equipo CONTARAE en Netlify y Resend, y dos recibos PDF de Netlify. No se copiaron documentos de clientes ni credenciales al informe. Los importes son los mostrados por el proveedor, sin convertirlos a COP ni estimar cargos bancarios.

## Costos comprobados en las cuentas

| Concepto | Resultado comprobado |
| --- | --- |
| Netlify Personal | USD 9/mes, 1.000 creditos incluidos; ultimo recibo visible USD 9 el 15 de octubre |
| Ciclo de Netlify | 15 de octubre al 14 de noviembre de 2026 |
| Consumo de Netlify | 13,6 creditos, equivalente al 1,36% de la cuota; saldo 986,4 |
| Desglose visible | Transferencia 9 creditos; computo 3,8; solicitudes 0,7 (3.595 peticiones); produccion 0; IA 0. Los componentes estan redondeados |
| Recarga automatica | Desactivada |
| Complementos de Netlify | Ninguno activo segun el panel |
| Moras en Netlify | Sin facturas vencidas visibles |
| Resend | Transaccional USD 0/mes y marketing USD 0/mes; sin metodo de pago ni facturas |
| Excedentes de Resend | Desactivados e inhabilitados en Free |

El costo fijo mensual comprobado de estos dos proveedores suma USD 9. A eso se agregan las comisiones reales de Wompi, renovaciones de dominio/correo y publicidad o automatizaciones externas que puedan existir. No se presenta USD 9 como costo total del negocio.

No se encontro sobreconsumo actual de Netlify ni suscripciones pagas de Resend. En el grafico historico de Netlify el ciclo 15 de septiembre-14 de octubre mostraba 98 creditos. Las vistas de consumo pueden tener retrasos entre si: la vista general actual mostro 13,6 y el grafico diario aun 11; se usa el saldo detallado de la vista general para el corte actual.

### Dos recibos el 15 de septiembre: periodos diferentes

Se revisaron completos los recibos descargados desde Netlify:

- `VMZNSF-00007`: USD 8,71, correspondiente a Members del 12 de agosto al 11 de septiembre. Subtotal USD 9 y nota de credito de USD 0,29. El trafico, computo y despliegues detallados de julio/agosto se cubren con creditos precomprados y cada linea de compra adicional marca USD 0.
- `VMZNSF-00009`: USD 9, correspondiente a Members del 15 de septiembre al 14 de octubre. Compilaciones concurrentes USD 0.

No son dos cuotas del mismo periodo segun esos recibos. La fecha conjunta de pago no demuestra duplicidad ni excedentes. No se deduce el motivo del cambio de fechas del ciclo, porque el recibo no lo explica.

## Conclusiones principales

1. La web usa Netlify, Netlify Blobs, Wompi y Resend. No se encontraron llamadas de produccion a Supabase, OpenAI, Make, Zapier, Twilio ni a un generador externo de PDF.
2. Hay riesgos de consumo evitable al crecer: consultas publicas que leen historiales completos, recargas amplias del administrador, archivos sin expediente y bitacora sin politica de conservacion.
3. El consumo y los recibos consultados no muestran sobrecostos actuales por exceso de uso. La revision no cubre todas las cuentas externas del negocio ni concilia el extracto bancario.
4. Netlify confirmo que produccion publica `main` en `31a7e32`, publicado el 11 de octubre. Los siete commits adicionales de la rama de seguridad no estan publicados en el dominio principal.
5. Las mejoras de seguridad no introdujeron en el codigo una suscripcion nueva. Algunas agregan trabajo dentro de Netlify: auditoria, respaldo programado y consulta de salud.

## Inventario de servicios y costos

| Servicio | Evidencia de uso | Que puede generar costo | Estado de facturacion |
| --- | --- | --- | --- |
| Netlify | Alojamiento, Functions, Edge y despliegues | Plan, publicaciones de produccion, solicitudes, transferencia y computo | Personal USD 9/mes confirmado; 13,6/1.000 creditos, sin recarga automatica ni complementos activos |
| Netlify Blobs | Solicitudes, soportes, PDF emitidos, portal, promociones, auditoria y respaldos | Recurso dentro de Netlify; las funciones y descargas asociadas tambien consumen recursos | No es una segunda base de datos contratada en el codigo; no se estima una tarifa por lectura |
| Wompi | Widget, firma y webhook | Comision sobre transacciones exitosas segun contrato y medio | Integracion confirmada; tarifa contratada pendiente |
| Resend | Confirmaciones de compra, aviso al negocio, aviso a aliado y envio del certificado | Plan y excedentes si estan habilitados | USD 0/mes confirmado; Free transaccional y marketing, sin facturas ni metodo de pago |
| Dominio `contarae.com` | Dominio publico y correo de marca | Renovacion y posibles adicionales del registrador | Proveedor, importe y renovacion por confirmar |
| Correo corporativo | `info@contarae.com`; documentos mencionan GoDaddy/Microsoft 365 | Licencias y renovacion del buzon | Evidencia documental, sin factura consultada |
| Google Analytics y Tag Manager | Scripts observados en la pagina publica | Las ediciones estandar son gratuitas; los servicios que una etiqueta conecte se revisan aparte | No se detecto una contratacion 360 en el repositorio |
| Google Ads | Atribucion de campanas y plan publicitario historico | Presupuesto de anuncios fuera de la factura de alojamiento | Gasto actual no comprobado |
| GitHub | Repositorio remoto | Suscripciones o servicios adicionales de la cuenta, si existen | Sin workflows de Actions encontrados en este checkout; plan pendiente |
| Make y OpenAI para redes | Instrucciones y ejemplos bajo `operaciones/redes-sociales` | Automatizaciones y consumo de API si se activaron fuera del repositorio | No hay evidencia suficiente de ejecucion o cobros actuales |
| Supabase y Cloudflare | Propuestas anteriores; sin integracion en el codigo de la aplicacion | Solo si hay servicios contratados fuera de este proyecto | No atribuirles gastos de esta web sin revisar las cuentas; DNS no confirmado |

Las calculadoras de renta, retencion, planilla, nomina e IVA hacen sus operaciones en JavaScript en el navegador. No hay una tarifa de API por pulsar Calcular. Registrar un lead desde esas pantallas si utiliza una funcion de Netlify.

Los PDF y codigos QR se crean con `pdf-lib` y `qrcode`, dentro de las funciones. No se encontro una API comercial por certificado. Si existe consumo de computo de Netlify al generarlos. WhatsApp usa enlaces `wa.me`, no una integracion de mensajeria de pago por envio.

## Tarifas publicas de referencia

### Netlify

Para planes actuales por creditos: Free incluye 300 creditos/mes, Personal USD 9 con 1.000 y Pro desde USD 20 con 3.000. Referencias de consumo: publicacion exitosa de produccion 15 creditos; transferencia 20/GB; solicitudes 2/10.000; computo 10/GB-hora. Los previews y despliegues de rama no consumen creditos de publicacion, aunque su trafico si puede consumir recursos. Edge se mide por solicitudes, no por computo de Functions. Las cuentas Legacy tienen condiciones distintas.

Con recarga automatica habilitada puede haber cobros adicionales. Sin saldo, Netlify puede pausar los proyectos. La decision debe equilibrar presupuesto y continuidad de ventas; no desactivar recargas a ciegas.

Ejemplos de consumo, no facturas: 10 publicaciones de produccion = 150 creditos; 20 = 300, antes del trafico. Un push a GitHub no equivale necesariamente a una publicacion de produccion.

Fuentes: [Planes](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/), [Medicion](https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/how-credits-work/), [Blobs](https://www.netlify.com/knowledge-base/netlify-blobs-vs-vercel-blob/).

### Resend

En la cuenta `contarae`, Usage mostro Free para transaccional, marketing y equipo; cuotas visibles 0/3.000 correos mensuales y 0/100 diarios, 0 automatizaciones y 1/3 dominios. Los contadores reflejan lo que el panel mostraba al consultar, no prueban ausencia de envios historicos. En Emails si habia tres envios entregados dentro del filtro de ultimos 15 dias.

Billing confirmo USD 0/mes para transaccional y USD 0/mes para marketing, sin metodo de pago y sin facturas. Los interruptores de excedentes transaccionales y automatizaciones estaban desactivados e inhabilitados en Free. No hay evidencia de cargos de Resend en esta cuenta. Los anuncios de complementos con precio que aparecen debajo son ofertas, no suscripciones contratadas.

Referencia publica transaccional: Free, 3.000 correos/mes y 100/dia; Pro, USD 20/mes para 50.000, sin limite diario del plan gratuito. Pro publica excedentes de USD 0,90 por bloques de 1.000 cuando se habilita el pago por uso. Confirmar que estas condiciones coinciden con la cuenta.

Flujo de certificacion revisado: compra aprobada envia un aviso al negocio y una confirmacion al cliente; emitir el certificado agrega otro correo. Un aliado puede agregar un cuarto. Correcciones y reenvios agregan consumo.

Como referencia de capacidad, si todos esos envios ocurren el mismo dia y no hay otros correos, 100 envios permiten aproximadamente 33 procesos de tres correos o 25 de cuatro. No son limites del numero de ventas: los envios pueden ocurrir en dias diferentes. La cuota debe preservar la entrega al cliente y los avisos operativos.

El codigo usa claves de idempotencia y marcas de notificacion para reducir duplicados. Esto no sustituye una revision de errores, reintentos y entregabilidad en Resend.

Fuentes: [Precios](https://resend.com/pricing), [Excedentes](https://resend.com/changelog/pay-as-you-go-pricing).

### Wompi

Referencia publica del Plan Avanzado Agregador: 2,65% + COP 700 + IVA por transaccion exitosa. Debe contrastarse con el contrato y los medios habilitados; hay otras modalidades y tarifas.

Ejemplos usando esa tarifa e IVA del 19% sobre la comision, solo para ilustrar el margen:

| Venta | Comision aproximada con IVA |
| --- | ---: |
| COP 80.000 | COP 3.356 |
| COP 100.000 | COP 3.987 |
| COP 155.000 | COP 5.721 |

Estos ejemplos no incluyen otras deducciones o condiciones particulares de liquidacion. Consultar el detalle de Wompi para el costo efectivo.

Fuente: [Tarifa oficial](https://www.wompi.co/es/co/planes-tarifas/plan-avanzado-agregador).

### Servicios sin tarifa por calculo

Las ediciones estandar de [Analytics](https://marketingplatform.google.com/about/analytics/) y [Tag Manager](https://marketingplatform.google.com/intl/en_uk/about/tag-manager/) son gratuitas. No confundir medicion con presupuesto publicitario. El archivo `operaciones/plan-publicidad-certificacion-ingresos.md` registra un antecedente de Google Ads de abril/mayo de 2026; ese dato historico no confirma gasto de octubre ni campanas activas.

## Hallazgos de consumo y crecimiento

### Prioridad alta: busqueda publica de pagos con lectura completa

`netlify/functions/utils/service-requests.js:1106` lista todas las solicitudes, lee cada registro y despues filtra por documento. Incluso una consulta sin resultados realiza ese trabajo.

Consecuencia: con N registros y Q consultas, las lecturas de registros crecen aproximadamente como N por Q. Por ejemplo, 5.000 registros y 100 consultas implican alrededor de 500.000 lecturas, mas listados. No significa 500.000 solicitudes externas facturadas ni una tarifa por lectura; si puede aumentar tiempo de funcion, memoria y latencia.

Propuesta: indice privado por documento normalizado y tipo, con lectura directa, conservando los resultados actuales. La migracion debe verificar concordancia con historicos y manejo de actualizaciones, cancelaciones y eliminaciones. Evitar caches publicos de datos financieros.

### Prioridad alta: verificacion por codigo con recorrido completo

`netlify/functions/public-verify-certification.js:145` llama a `listAllCertifications()` para encontrar un codigo. Esa funcion lee registros pagados y pendientes. La busqueda directa por referencia tiene otro recorrido y no debe confundirse con esta busqueda.

Propuesta: indice codigo-referencia que conserve versiones anteriores y su estado de reemplazo. Es una mejora sensible: probar certificados existentes y corregidos antes de publicar. No cambiar codigos ni validez documental para ahorrar recursos.

### Prioridad media: recargas amplias del administrador

`src/AdminPanel.js:4679` carga certificaciones, servicios, pagos, leads, usuarios, promociones y salud al autenticar. Ademas, `listServicePayments()` vuelve a consultar expedientes tras obtener la lista general.

Propuesta: paginacion y resumenes, evitar lecturas repetidas y cargar detalles cuando se necesitan. El dashboard necesita totales globales correctos; paginar sin resolver esos totales produciria informacion incompleta.

### Prioridad media: archivos cargados antes del pago y sin expediente

El formulario carga soportes antes de guardar la solicitud y abrir Wompi. La carga publica acepta una referencia normalizada sin exigir un expediente existente. Puede haber archivos abandonados si el proceso falla o se cierra. La validacion limita archivos por peticion, no el volumen acumulado por referencia.

Propuesta: identificacion de archivos huerfanos y limites acumulados seguros. Primero elaborar inventario y politica de conservacion; no eliminar historicos, expedientes ni soportes de pagos pendientes automaticamente sin determinar su estado. Se debe conservar la experiencia actual de adjuntar documentos antes de comprar.

### Prioridad media: respaldo y bitacora crecen con el historico

`netlify/functions/utils/data-backup.js:180` recorre cinco almacenes. Cada dia lista dos veces cada almacen: una para registros JSON y otra para inventario de archivos. Lee los registros y los metadatos de archivos; guarda dos objetos y aplica la retencion.

Se conservan hasta 30 respaldos diarios por cantidad. Los binarios no se duplican: el respaldo contiene un inventario. Esto evita copiar todos los PDF cada dia, pero no permite restaurar por si solo un archivo borrado. El hash se guarda, sin una comprobacion independiente de restauracion.

`security-audit.js` agrega eventos y lista todas sus claves para mostrar los ultimos. No se encontro una politica de conservacion para esa bitacora.

Propuesta: reutilizar el listado del respaldo, medir duracion y volumen, acotar consultas de auditoria y acordar conservacion. Mantener el respaldo diario y la trazabilidad mientras se optimizan.

### Prioridad media: descarga inicial y cache

`src/App.js:3` importa directamente los portales administrativo y de clientes. El visitante publico recibe un paquete que incluye codigo de esas areas. El JS publico observado fue `main.cc238d26.js`; respondio con `public,max-age=0,must-revalidate`.

Propuesta: dividir codigo por ruta y revisar cache de assets con hash. Medir transferencia comprimida y visitas antes de estimar ahorro. El cache de soportes, API privadas o documentos de clientes requiere reglas diferentes.

La funcion `share-meta` esta asociada a `/*`, incluso para peticiones donde no modifica metadatos. Acotar su alcance puede simplificar ejecucion. No se afirma una doble tarifa por pasar por Edge: el proveedor mide Edge dentro de solicitudes web.

### Control existente: consultas de estado de pago acotadas

`src/App.js:2480` y `src/App.js:2921` consultan cada 2,5 segundos hasta aproximadamente dos minutos. En certificaciones puede haber dos peticiones por vuelta si aun no hay registro pagado: alrededor de un centenar durante una espera completa, segun latencia.

No se encontro un bucle infinito. Se puede estudiar una espera progresiva manteniendo confirmacion rapida al principio. No es una justificacion para expirar el formulario ni limitar el tiempo del cliente para comprar.

## Estado de los ajustes de seguridad

| Ajuste | Estado observado |
| --- | --- |
| Aprobacion por webhook firmado y aprobacion manual desactivada | Presente en el codigo |
| Limites de frecuencia en rutas publicas y login | Configurados en la rama; falta confirmar despliegue y aplicacion efectiva |
| Validacion basica de archivos | Implementada; no equivale a antivirus |
| Honeypot | El servidor revisa campos de trampa; no se encontro un campo trampa incorporado a los formularios React |
| Limites de JSON | Se comprueba `Content-Length`; falta limitar bytes reales si el encabezado falta o no representa el cuerpo |
| Auditoria | Implementada en la rama; conservacion y consulta requieren mejora |
| Respaldo diario y manifiesto con SHA-256 | Implementados en la rama; falta verificar ejecucion real y restauracion, incluidos archivos |
| Salud operativa | Endpoint y panel implementados en la rama; produccion sigue en `31a7e32` y `/api/admin-health` devolvio 404 |
| Nuevas cabeceras CSP/COOP | En `netlify.toml` de la rama; no aparecieron en la respuesta publica revisada |
| Revelar claves del portal | Endpoint deshabilitado; la interfaz y el almacenamiento reversible de contrasenas aun requieren completar el ajuste |
| Supabase, Cloudflare y Turnstile | Sin integracion encontrada en el codigo revisado |

La consulta de solo lectura a GitHub confirmo `main` en `31a7e32` y `codex/security-containment` en `3975175`, con siete commits adicionales. Netlify mostro "Currently published" para `main @ 31a7e32`, publicado el 11 de octubre a las 11:44 segun su panel. Enviar la rama a GitHub no publico esos siete commits en el dominio principal.

Antes de publicar, corregir la CSP de `netlify.toml:21`: su `frame-src` omite `https://www.youtube.com`, mientras `src/App.js:2090` inserta el video instructivo de ese dominio. Al aplicar esa politica el navegador bloquearia el video. Revisar tambien el checkout real y sus recursos, sin asumir que una compilacion valida demuestra compatibilidad de la pasarela.

El panel de salud puede mostrar "Completas" mientras `health` es nulo; y mostrar un hash no equivale a verificar integridad. Corregir estos estados evita una falsa lectura de seguridad.

## Verificacion realizada

- Pagina inicial publica disponible y scripts de Wompi, GTM y Analytics observados.
- Peticiones HTTP de lectura a pagina, asset JS y nuevo endpoint de salud.
- Pruebas Node: 10 aprobadas.
- Pruebas React: 4 aprobadas.
- Sin pruebas de carga ni envio de solicitudes ficticias a produccion.
- Sin pago real, correo de prueba ni prueba integral de emision en esta revision.

Las pruebas existentes no cubren de punta a punta compra, webhook, emision, correccion y verificacion de certificados. La prueba de sesion titulada "expire" comprueba firma y secreto incorrecto, pero no demuestra el vencimiento. Agregar cobertura de esos casos sigue pendiente.

## Orden recomendado de trabajo

1. Completar la conciliacion con tarifa efectiva y liquidaciones de Wompi, renovaciones de dominio/correo y campanas activas. Netlify y Resend ya revisados no justifican ampliar el plan por consumo observado. Tampoco cambiar automaticamente a un plan menor sin evaluar margen para despliegues y continuidad de ventas.
2. El commit publicado ya esta identificado: `31a7e32`. Corregir compatibilidad de CSP/video/checkout y completar pruebas de certificacion antes de publicar la rama. No desplegar automaticamente durante esta auditoria.
3. Optimizar consultas por documento y codigo con indices compatibles, pruebas de historicos y verificacion de versiones corregidas.
4. Optimizar lecturas del administrador, respaldo, auditoria y descarga inicial. Medir antes/despues con el mismo volumen.
5. Preparar inventario de huerfanos y politica de conservacion; aplicar eliminaciones solo con criterios revisados y recuperacion comprobada.

No hace falta contratar Supabase, Cloudflare de pago ni otra automatizacion para empezar estas mejoras. Una migracion de proveedor debe responder a mediciones y necesidades reales, no a la expectativa de ahorrar sin conocer el consumo actual.

## Datos necesarios para cerrar la conciliacion de costos

| Cuenta | Datos pendientes |
| --- | --- |
| Netlify | Plan, ciclo, consumo actual, ultimo cargo, recargas, complementos y commit publicado comprobados; falta conciliar el historial completo con el extracto bancario |
| Resend | Plan, cuotas visibles, excedentes desactivados y ausencia de facturas ya comprobados; falta serie historica para dimensionar picos diarios futuros |
| Wompi | Tarifa contratada, liquidaciones y deducciones efectivas |
| Dominio y correo | Proveedor, renovaciones, licencias y servicios duplicados |
| Publicidad | Campanas activas, presupuesto y cargos actuales |
| Automatizaciones externas | Confirmar si Make/OpenAI llegaron a activarse y su consumo |

El total mensual completo no puede calcularse con rigor hasta conciliar esos datos. El fijo confirmado de Netlify mas Resend es USD 9/mes. No sumar automaticamente el precio de todos los planes de referencia: varios estan en nivel gratuito o no estan contratados.
