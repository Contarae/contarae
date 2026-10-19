# Mejoras de seguridad y continuidad

Fecha: 19 de octubre de 2026. Rama local: `codex/security-containment`, base `3975175`.

## Estado y alcance

Cambios locales implementados y probados. Sin commit, push ni despliegue en esta ronda. No se modificaron suscripciones, cuentas, precios, reglas contables, datos de clientes o certificados de produccion. El informe de costos del 18 de octubre se conserva sin editar.

No se introdujeron esperas obligatorias, vencimientos del formulario, CAPTCHA visible ni pasos adicionales para comprar. No se contrataron herramientas ni se agregaron dependencias.

## Respaldo anterior a los cambios

Directorio privado fuera del repositorio: `/Users/diego/contarae-backups/pre-mejoras-2026-10-18`.

- `proyecto-completo.tar.gz`: copia completa del proyecto, incluyendo Git, archivos locales, configuracion, dependencias y compilacion anterior. Archivo de aproximadamente 560 MB; inventario de 87.860 entradas comprobado.
- SHA-256 del archivo: `b509b32582a063a2a02b0dd1a7eb0126046c92c28c9ffd5de9b0937d6048a8f5`. La verificacion con `shasum -a 256 -c proyecto-completo.sha256` devuelve OK.
- `produccion/`: copia de 186 objetos de seis almacenes Netlify Blobs, 559.528.900 bytes. Incluye registros, soportes, PDF, datos del portal, promociones y respaldos anteriores. Conserva claves, metadatos, versiones y hashes en su manifiesto.
- Se contrastaron las versiones de cada almacen antes y despues de copiar. No se presenta como una instantanea transaccional simultanea de todos los almacenes.
- `ensayo-recuperacion/`: reconstruccion local de los 186 objetos y su manifiesto, con verificacion de hashes. No se escribio nada en produccion.
- Copias privadas de variables Netlify de produccion, deploy-preview y branch-deploy. No se incluyen valores en este informe.

Estos archivos contienen informacion sensible y credenciales. Permisos restrictivos de carpeta/archivos, pero no se afirma que el archivo comprimido este cifrado. No subirlos a GitHub ni servirlos desde la web. Esta copia no exporta todas las cuentas externas, facturas de proveedores o configuraciones ajenas al proyecto.

Comprobacion local repetible, sin conexion a produccion:

```sh
node scripts/verify-private-backup.mjs /Users/diego/contarae-backups/pre-mejoras-2026-10-18/produccion
```

El segundo argumento opcional permite ensayar la recuperacion en una carpeta local NUEVA. No sobrescribe carpetas existentes. Para una recuperacion real, primero comparar cambios posteriores y ensayar en un entorno aislado; no reemplazar produccion a ciegas con una copia antigua.

## Cambios implementados

| Area | Mejora y proteccion de compatibilidad |
| --- | --- |
| Formularios | Limites sobre bytes realmente recibidos, lectura acotada y errores 400/413. No depende solo de Content-Length. Trampas invisibles para bots en captacion, consulta de pagos y certificacion. |
| Firma y promociones | Conservadas tarifas, firma y contratos de respuesta. Adaptacion a Functions v2 para que Netlify reconozca limites ya declarados: firma 40/minuto y promociones 60/minuto, por IP y dominio. Manifest de empaquetado comprobado; falta comprobar aplicacion efectiva tras desplegar. |
| Certificaciones y servicios | Lecturas reutilizadas en memoria del servidor, acotadas por tiempo, entradas y bytes. Cada consulta comprueba versiones con listado fuertemente consistente. Altas, cambios y bajas comprobados. No se sirve informacion antigua si falla el almacenamiento. |
| Pagos administrativos | Un solo recorrido de registros; eliminada la segunda lectura individual de cada expediente. Sin cambiar saldos o reglas de aplicacion de pagos. |
| Accesos de clientes | No se generan ni exponen copias reversibles de claves. Los hashes y accesos existentes se conservan; copias antiguas se retiran en la siguiente escritura normal. Una clave antigua de variables de entorno no puede saltarse una clave restablecida en almacenamiento. |
| Claves temporales | Copia disponible en memoria de la interfaz al crear/restablecer, con boton para cerrar. Se retira la opcion de revelar claves almacenadas. Sin reinicio masivo de contrasenas. |
| Respaldo automatico | Copia JSON y archivos binarios, reutilizando archivos por SHA-256. Comprueba lectura posterior antes de actualizar manifiesto o aplicar retencion. Un fallo no reemplaza la ultima copia exitosa. Nombres unicos evitan sobrescribir una copia del mismo dia. |
| Ejecucion de respaldos | La tarea diaria encola una funcion autenticada en segundo plano usando el secreto administrativo existente. Diferencia encolado de finalizado y registra fallos. El empaquetado confirma modo background y horario diario existente. |
| Salud operativa | Muestra Sin comprobar cuando no hay evidencia, en vez de Completas. Verifica el contenido JSON del respaldo contra su hash; el indicador dice Integridad de registros, no promete verificar todos los archivos cada vez. |
| Auditoria | Consulta por prefijos de fecha de los ultimos 30 dias. Conserva eventos anteriores sin borrarlos. |
| Descarga y cache | Portales privados cargados por separado, con reintento si falla su carga. JS inicial gzip: 261,19 KB a 146,52 KB, aproximadamente 44% menos en esta compilacion. Cache largo solo en assets con hash. |
| Cabeceras | CSP compatible con marcos de YouTube, Wompi y documentos locales. Edge de metadatos excluye API y assets comunes. No se amplia el cache de documentos privados. |
| Inventario | Utilidad de solo lectura para distinguir adjuntos referenciados, protegidos y posibles huerfanos. En la copia examinada: 56 archivos de certificaciones referenciados y 4 protegidos, ninguno candidato a borrar. Cero eliminaciones. |

La separacion del respaldo evita ejecutar todo el trabajo dentro del limite de 30 segundos de una tarea programada. Background tiene un limite mayor, no ilimitado; al crecer se debe medir duracion y dividir trabajos si fuera necesario. Fuentes: [Scheduled Functions](https://docs.netlify.com/build/functions/scheduled-functions/) y [configuracion de Functions](https://docs.netlify.com/build/functions/configuration/).

## Verificacion

- 42 pruebas Node aprobadas, con almacenamiento aislado y proveedores simulados.
- 7 pruebas React aprobadas: acceso administrativo, listado/detalle de certificaciones, salud no comprobada, login de clientes y entrega/copia de clave temporal.
- Compra simulada: tarifa del servidor, firma, importe alterado, webhook invalido, estados no aprobados y reintento sin duplicar consecutivo/correos.
- Emision y correccion de PDF real dentro de la prueba: bytes y hash comprobados, version anterior conservada y marcada reemplazada, ultima version valida.
- Clientes: crear, autenticar, cambiar/restablecer clave, conservar empresa, rechazar acceso suspendido, aislamiento entre empresas y bloqueo de escritura concurrente atrasada.
- Respaldo: restauracion de registros, metadatos y archivos; reutilizacion de binarios, rechazo de copia incompleta, deteccion de JSON alterado y conservacion de copia previa tras fallo de reintento.
- Cache: fixture de 100 registros; 100 lecturas iniciales, cero lecturas de contenido en segunda consulta sin cambios y dos para un cambio mas una adicion. No se traduce esto en una promesa de ahorro facturado.
- Compilacion React y empaquetado Netlify completados. Manifest confirma rutas/limites de firma y promociones y funcion de respaldo background. `git diff --check` limpio.
- Chrome: seis rutas en escritorio 1440x1000 y movil 390x844, 12 revisiones sin errores JavaScript ni violaciones CSP en el recorrido aislado. Modal de certificacion y trampa invisible comprobados; video con contenido simulado.
- Wompi: script publico real cargado, apertura de iframe permitida por CSP con contenido de pago simulado. Se bloquearon envios y no se hizo ninguna transaccion real. No equivale a validar 3DS, Nequi ni cada medio de pago en produccion.
- Observacion visual pendiente: portada movil con ancho de contenido 430 px en viewport de 390 px, asociado a elementos decorativos/seccion de herramientas. No se hizo un rediseño de esa seccion en esta ronda.

Avisos de herramientas: base Browserslist antigua y advertencias de Node sobre modulo/deprecacion. No impiden estas comprobaciones; no se cambiaron dependencias indiscriminadamente para silenciarlos.

## Limites y pendientes

1. Publicar requiere una etapa separada: revisar el diff, commit/push y despliegue controlado. La evidencia anterior situaba produccion en `main @ 31a7e32`; no se presume que un push de la rama de seguridad la publique. Verificar despues cabeceras, limites, accesos, checkout y primer respaldo completado, conservando la version anterior como retorno.
2. Los indices persistentes por documento/codigo y la paginacion de historicos siguen pendientes. El cache reduce relecturas, pero aun lista claves y necesita leer registros en arranques en frio. Una migracion merece pruebas y recuperacion especificas antes de tocar el formato historico.
3. No se eliminaron archivos ni eventos antiguos. Los respaldos JSON retienen hasta 30 instantaneas por cantidad, no exactamente 30 dias si hay reintentos. Las copias binarias no se purgan automaticamente; su almacenamiento crecera con nuevos documentos/versiones. Revisar conservacion antes de automatizar borrados.
4. El respaldo automatico sigue dentro de Netlify. El respaldo externo local de esta ronda es puntual, no una copia externa recurrente. No protege por si solo de perdida de toda la cuenta del proveedor. La primera copia binaria consume recursos; no se garantiza costo cero, aunque no se activa ningun plan adicional.
5. Diferencia previa en cartera: `fastCustomerBalances` conserva totales pero deja vencimientos/antiguedad en cero en la vista compacta. El detalle completo calcula esos valores. Se documento sin modificar la logica financiera en esta ronda; requiere una revision funcional y de rendimiento dedicada.
6. Quedan la correccion visual movil indicada y las pruebas reales de medios de pago/despliegue. No hubo cobros, correos reales de prueba ni modificaciones a expedientes de produccion.
7. Cloudflare/Turnstile, MFA, copias externas recurrentes y politicas de retencion dependen de acceso/configuracion o decisiones operativas. No se crearon cuentas ni se cambio DNS. El honeypot y los limites no son una defensa completa contra ataques distribuidos o agotamiento de cuota.

Vista local aislada: `node scripts/preview-safe.cjs`, normalmente en `http://127.0.0.1:4183`. Sirve la compilacion y las cabeceras; bloquea operaciones API, por lo que no permite comprar ni modificar datos reales.
