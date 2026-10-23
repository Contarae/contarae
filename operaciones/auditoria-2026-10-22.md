# Auditoria de CONTARAE - 22 de octubre de 2026

Zona horaria: America/Bogota. Revision de solo lectura sobre produccion. Codigo local auditado: `9f3f183`, rama `codex/security-containment`. Se genera este informe; no se cambia codigo de aplicacion, configuracion, dependencias, cuentas ni datos de produccion.

## Conclusion

La web publica carga y el formulario de certificacion abre en escritorio y movil. Sin embargo, las mejoras enviadas a GitHub no estan desplegadas y hay defectos funcionales/de seguridad que las 49 pruebas existentes no cubrian. No corresponde afirmar que todo esta protegido o que no quedan riesgos.

Prioridad: corregir asignacion concurrente de consecutivos y revocacion de sesiones; incorporar pruebas de esos casos; despues publicar y validar las mejoras acumuladas con retorno a la version anterior disponible. No modificar precios, agregar tiempos de espera ni obligar al comprador a pasos adicionales.

## Hallazgos por prioridad

### A1. Alta: mejoras de la rama no publicadas

Netlify confirma produccion en `main`, commit `31a7e32de229866543eb7f54a41e5f26ed44866f`, publicado el 11 de octubre a las 11:44 de Colombia. El ultimo commit local/enviado es `9f3f183`. La lista de despliegues recientes no incluye este ultimo.

Evidencia HTTP del dominio: `/api/admin-health` devuelve 404; las respuestas HTML no incluyen la nueva CSP ni COOP; el JS principal publicado sigue siendo `main.cc238d26.js`. No confundir push con publicacion. Las mejoras de la rama no se consideran protecciones activas del dominio.

Accion: integrar y publicar de forma controlada despues de resolver los hallazgos de mayor impacto, verificar reglas y funciones efectivas, y comprobar el primer respaldo nuevo completo. No se ejecuto despliegue durante la auditoria.

### A2. Alta: pagos simultaneos pueden compartir consecutivo

En [wompi-webhook.js](/Users/diego/contarae/netlify/functions/wompi-webhook.js:969), el contador se lee, incrementa y escribe sin una operacion condicional/atomica. La creacion del registro pagado tampoco usa una condicion de primera escritura.

Reproduccion aislada: dos solicitudes ficticias diferentes, dos eventos firmados validos y ejecucion simultanea. Ambas respondieron 200 y quedaron con consecutivo `1000`. Las pruebas previas cubren reintentos secuenciales, no simultaneidad. Este bloque coincide con el codigo publicado; no es una regresion introducida por el ultimo commit.

Impacto: identificadores operativos duplicados y carreras entre eventos; tambien se deben comprobar eventos simultaneos de una misma transaccion. No se observo duplicidad en las 28 solicitudes pagadas incluidas en el respaldo real de hoy. Esa observacion no elimina el defecto.

Accion: asignacion unica con control de version y reintento acotado, registro idempotente de transacciones y proteccion de escrituras del expediente. Mantener consecutivos historicos intactos; no renumerar registros existentes.

### A3. Alta: suspender/restablecer usuario no invalida sus sesiones abiertas

[client-portal-auth.js](/Users/diego/contarae/netlify/functions/utils/client-portal-auth.js:164) valida firma y vencimiento de la cookie, pero no consulta si la cuenta fue suspendida o su acceso revocado. La sesion tiene una duracion maxima de ocho horas.

Reproduccion aislada: crear usuario, obtener cookie valida, restablecer clave y luego suspenderlo. El login nuevo se rechaza, pero la cookie anterior permite lectura y escritura con HTTP 200. Ademas, el cambio obligatorio de clave temporal se presenta en la interfaz, pero [client-portal-save.js](/Users/diego/contarae/netlify/functions/client-portal-save.js:12) y los endpoints de datos/importacion no lo exigen del lado servidor.

Accion: revision de estado/version de acceso en servidor, revocar sesiones al suspender o recuperar acceso, y restringir sesiones con cambio obligatorio a las operaciones necesarias. Preservar acceso asistido y aislamiento por empresa. No acortar arbitrariamente el tiempo de compra.

Referencia: [OWASP, gestion de sesiones](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html) recomienda invalidar sesiones previas ante cambios sensibles de credenciales/permisos. No basta ocultar opciones en React.

### A4. Alta: el respaldo automatico publicado no contiene PDF ni soportes

El almacen conserva 30 copias diarias. Se leyo `daily/2026-10-22.json`, generado a las 00:00:03 de Colombia: version 1, alcance `structured-json-records`, sin SHA-256 de integridad incorporado. Reporta cero registros omitidos.

| Almacen | Objetos listados | Registros JSON incluidos |
| --- | ---: | ---: |
| certification-requests | 144 | 84 |
| service-requests | 2 | 2 |
| client-leads | 5 | 5 |
| client-portal | 3 | 3 |
| promo-codes | 2 | 2 |

Los 60 objetos no incluidos de certificaciones corresponden a claves de archivos. No es correcto decir que no hay respaldo: existe respaldo reciente de registros, pero no permite por si solo recuperar un PDF borrado. Tampoco existe `manifest/latest.json` en el almacen actual; eso es compatible con la version antigua publicada, no demuestra fallo del respaldo diario.

La copia privada externa del 18 de octubre es adicional y puntual. Las copias binarias y comprobaciones nuevas estan implementadas en la rama, pendientes de publicacion. Despues faltan copias externas recurrentes, cifrado/gestion de claves, alertas por antiguedad o fallo y ensayos periodicos de recuperacion. La copia automatica dentro de Netlify no protege de perdida completa de esa cuenta.

### A5. Media: fallo de correo puede quedar sin reintento

[wompi-webhook.js](/Users/diego/contarae/netlify/functions/wompi-webhook.js:1139) guarda el error de Resend, pero devuelve 200 aunque no se haya enviado la confirmacion al cliente. No se encontro una cola/tarea de reintento de esas notificaciones.

Reproduccion aislada: proveedor de correo simulado con 503; la compra queda aprobada, no hay marca de correo enviado y el webhook responde 200. Esto no demuestra que haya ocurrido con clientes reales.

Wompi considera entregado un evento al recibir 200; no hay que depender de otro evento para recuperar el correo. Fuente: [documentacion de eventos Wompi](https://docs.wompi.co/docs/colombia/eventos/).

Accion: cola durable de notificaciones con reintentos acotados, idempotencia y alerta de fallo. Conservar el pago aprobado; no volver a cobrar ni convertir una falla de correo en una venta perdida.

### A6. Media: resumen de cartera omite vencimientos

[client-portal-data.js](/Users/diego/contarae/netlify/functions/utils/client-portal-data.js:1105) inicializa antiguedad y vencimientos en cero en el resumen rapido. El detalle completo usa el calculo real.

Reproduccion aislada: factura a credito vencida de 180.000; resumen completo informa 180.000 vencidos y resumen compacto informa cero, aunque ambos conservan el mismo saldo pendiente. Es un problema de informacion mostrada, no evidencia de borrado de facturas. El bloque ya existia en la version publicada.

Accion: mantener consistencia entre ambos resumenes usando las mismas reglas financieras, sin degradar el tiempo de carga. Probar abonos directos, distribucion de abonos, anulaciones, saldos a favor y fechas limite.

### A7. Media: dependencias con avisos pendientes

`npm audit --omit=dev --json` senala 102 paquetes: 3 criticos, 79 altos, 15 moderados y 5 bajos. No significa 102 fallos explotables de la web ni demuestra una intrusion.

`react-scripts` figura en dependencies, por lo que omitir devDependencies NO excluye su cadena de compilacion/desarrollo. Se verifico que los tres paquetes clasificados como criticos (`proxy-addr`, `shell-quote`, `websocket-driver`) llegan por esa cadena. La web publicada sirve archivos estaticos; no se debe atribuir automaticamente a ella el riesgo de un servidor de desarrollo.

Tambien hay avisos transitivos en `@netlify/blobs` via `@netlify/otel`/OpenTelemetry, que requieren revisar su alcance en Functions. No se demostro explotabilidad de esos avisos en esta aplicacion.

Accion: separar riesgos de ejecucion y de herramientas, actualizar versiones compatibles con pruebas y planificar la modernizacion de la compilacion. No ejecutar `npm audit fix --force`: el informe propone incluso `react-scripts@0.0.0` como cambio mayor, que no es una correccion funcional aceptable.

### A8. Media: carga publica necesita controles acumulados

[upload-certification-supports.js](/Users/diego/contarae/netlify/functions/upload-certification-supports.js:27) procesa multipart antes de validar los archivos. [certification-supports.js](/Users/diego/contarae/netlify/functions/utils/certification-supports.js:179) limita cinco archivos por envio y seis MB por archivo, pero no limita el total acumulado de multiples envios por referencia.

Accion: acotar el cuerpo multipart, evitar duplicados en reintentos y controlar cuota acumulada con un identificador de solicitud validado. Conservar la posibilidad de adjuntar antes de pagar. No se envio carga abusiva a produccion y no se borraron archivos.

### A9. Baja: desbordamiento horizontal en portada movil

En Chrome, viewport 390x844, la portada tiene ancho desplazable de 422 px. Las otras cinco rutas revisadas no mostraron ese desbordamiento en su primera pantalla. El modal de certificacion abre y cabe en el viewport.

Accion: revisar anchuras minimas/decoraciones de herramientas y portada sin redisenar compra o paneles. No presentar la ausencia de errores JavaScript como garantia de que todo el diseno es correcto.

## Comprobaciones realizadas

- Seis rutas publicadas en escritorio 1440x1000 y movil 390x844: inicio, certificacion, acceso administrativo, portal de clientes, portal de pagos y verificacion. Todas respondieron 200 y renderizaron contenido, sin errores JavaScript capturados en esos recorridos.
- El script real de Wompi estuvo disponible y el formulario de certificacion abrio. No se inicio checkout ni se probo una transaccion bancaria real en esta auditoria.
- Sesiones anonimas de administrador y cliente: 200, configuradas y no autenticadas. Consulta vacia de verificacion: 200. Salud administrativa: 404 por version aun no desplegada.
- HSTS y X-Frame-Options presentes en HTML; CSP y COOP nuevas ausentes. No se hizo una prueba de saturacion ni se agotaron limites de produccion.
- Las 42 pruebas Node y 7 React existentes pasan. Compilacion optimizada correcta: JS inicial local 146,52 KB gzip. Este archivo local NO es el paquete publicado actualmente.
- Cuatro reproducciones adicionales aisladas confirman A2, A3, A5 y A6. No se incorporaron al repositorio de pruebas ni se modifico la aplicacion durante esta auditoria.
- Lectura del estado de Netlify, fechas de despliegue, alcance del respaldo y agregados. No se imprimieron credenciales, nombres, documentos ni expedientes de clientes.
- La auditoria npm solo consulto avisos; no instalo, elimino ni actualizo dependencias. No se modificaron planes de pago o recargas.

## Plan por fases

| Fase | Trabajo | Participacion del propietario |
| --- | --- | --- |
| 1 | Corregir consecutivos concurrentes, revocacion y cambio obligatorio de claves; agregar regresiones | No requiere nuevas cuentas; revisar y probar en aislamiento antes de publicar |
| 2 | Recuperacion de correos, resumen de cartera, cuotas de adjuntos y ajuste movil | Implementacion sin nuevas cuentas; definir destinatario/canal de alertas si hace falta |
| 3 | Ensayo de despliegue aislado, control de secretos/datos de prueba, publicacion y verificacion | Autorizacion para produccion y para una prueba real de pago controlada |
| 4 | Indices por documento/codigo, paginacion e importaciones acotadas; medicion con historicos | Puede prepararse sin cuentas nuevas; migraciones requieren validacion y recuperacion |
| 5 | Dependencias: actualizaciones compatibles y modernizacion gradual de herramientas | Sin compra de servicio por defecto; no mezclar una migracion grande con el arreglo de pagos |
| 6 | Copia externa cifrada recurrente, MFA, proteccion perimetral/antibots y conservacion | Acceso/configuracion de cuentas y decisiones sobre costos y retencion |

Pendientes de crecimiento adicionales: consultas por codigo aun recorren historiales; los respaldos binarios nuevos no tienen purga automatica y creceran con nuevas versiones; la retencion JSON es de 30 instantaneas, no necesariamente 30 dias si hay reintentos. Revisar tambien los permisos para modificar solicitudes pendientes y la minimizacion de datos de verificaciones publicas antes de ampliar su uso.

## Limites de esta auditoria

No es una prueba de penetracion exhaustiva, un monitoreo continuo ni una certificacion de ausencia de incidentes. No se verificaron todos los roles con sesiones reales, todos los medios de pago, ni envio efectivo de correo. No se revisaron facturas/consumo de proveedores en esta ronda; las cifras de costos del informe anterior conservan su fecha de corte.

El estado publico disponible no demuestra que cada compra termine correctamente. Las reproducciones aisladas prueban defectos del codigo, no un ataque o perdida de datos en produccion. No hubo cobros, envio real de correos, cambios DNS, push ni despliegue en esta auditoria.
