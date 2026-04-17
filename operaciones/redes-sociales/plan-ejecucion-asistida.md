# Plan de ejecucion asistida

Este es el orden para que yo construya el sistema y tu solo apruebes accesos o decisiones clave.

## Fase 0: decisiones

Responsable: usuario + Codex.

- Crear Gmail propio del negocio.
- Crear redes sociales propias de CONTARAE.
- Crear/configurar OpenAI Platform con API key para Make.
- Confirmar usuarios/redes deseados.
- Confirmar correo publico y correo de administracion.
- Confirmar frecuencia de publicacion.
- IA definida: OpenAI API.
- Confirmar si TikTok inicia manual o se evalua API.

Entregable:

- `decisiones-clave.md` completo.
- `fase-0-creacion-cuentas.md` ejecutado.

## Fase 1: base gratuita

Responsable: Codex prepara; usuario ejecuta permisos OAuth.

- Crear Google Sheet con Apps Script.
- Crear carpetas de Drive.
- Conectar Google Sheets, Google Drive y Gmail en Make.
- Probar creacion de borradores.

Entregable:

- Calendario editorial funcionando.

## Fase 2: IA a borradores

Responsable: Codex configura escenario; usuario aprueba conexion IA si aplica.

- Conectar OpenAI API en Make.
- Escenario de ideas organicas.
- Escenario de PDFs.
- Prompts con formato JSON.
- Correos de aprobacion.

Entregable:

- Borradores generados en Google Sheets.

## Fase 3: publicacion Facebook e Instagram

Responsable: Codex configura escenario; usuario acepta permisos Meta.

- Conectar Facebook Pages.
- Confirmar Instagram Business.
- Probar una publicacion de Facebook.
- Probar una publicacion de Instagram con una imagen de prueba.
- Activar publicacion solo con estado `aprobado`.

Entregable:

- Publicacion automatica FB/IG.

## Fase 4: TikTok sin costo adicional

Responsable: Codex configura escenario; usuario publica desde app TikTok.

- Preparar copy, guion, hashtags y enlace de asset.
- Enviar correo de TikTok listo para subir.
- Actualizar columna `tiktok_estado`.

Entregable:

- TikTok semiautomatico sin herramienta paga adicional.

## Fase 5: mejora opcional

Responsable: se decide despues de validar el MVP.

- Evaluar API TikTok.
- Evaluar herramienta puente si ya existe cuenta.
- Crear plantillas visuales en Canva.
- Agregar reportes de rendimiento.

Entregable:

- Automatizacion mas completa segun costo/beneficio.
