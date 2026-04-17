# Automatizacion de redes sociales CONTARAE

Este paquete deja lista la base operativa para construir los escenarios en Make con el menor costo adicional posible.

## Decision de herramientas

Usar como primera version:

- Make: orquestacion principal, ya tienes cuenta paga.
- Google Sheets: calendario editorial y cola de aprobacion.
- Google Drive: carpeta de PDFs, piezas visuales y videos.
- Gmail o Email by Make: aviso de borradores listos para revisar.
- Facebook Pages: publicacion directa en la pagina.
- Instagram for Business: publicacion directa en cuenta business conectada a Facebook.
- TikTok: primera version sin costo adicional como cola de publicacion manual. Make deja listo el copy, guion, archivo y checklist. La publicacion automatica de TikTok se deja como fase 2 via API oficial o una herramienta externa si ya existe cuenta.

## Por que TikTok queda semi-automatico en la fase 1

Make tiene integraciones practicas para Facebook e Instagram organico. Para TikTok organico, la ruta gratuita y estable es dejar todo preparado y enviar una alerta para publicar manualmente. La publicacion directa por API de TikTok requiere una app de desarrollador, permisos, OAuth, consentimiento y auditoria para publicar en publico; no es el camino mas rapido para empezar.

## Flujo general

1. El contenido entra por dos vias:
   - Ideas organicas creadas por IA.
   - PDFs cargados en Google Drive: conceptos, decretos, resoluciones, comunicados.
2. Make crea borradores y los guarda en Google Sheets.
3. La persona responsable revisa y cambia el estado a `aprobado`.
4. Make publica Facebook e Instagram.
5. Para TikTok, Make envia el paquete listo para subir: guion, caption, hashtags y enlace del video/arte.

## Estados del calendario

- `idea`: tema pendiente de desarrollo.
- `borrador`: IA genero contenido, falta revision.
- `pendiente_aprobacion`: listo para que un humano lo valide.
- `aprobado`: autorizado para publicar.
- `publicado`: ya salio al menos en una plataforma.
- `error`: requiere correccion.
- `descartado`: no se publica.

## Escenarios Make incluidos

- `make/01-ideas-organicas-a-borrador.md`
- `make/02-pdf-a-borrador.md`
- `make/03-publicacion-aprobada.md`
- `make/04-reporte-semanal.md`
- `make/05-openai-api-en-make.md`

## Archivos clave

- `calendario-contenido.csv`: plantilla para importar a Google Sheets.
- `decisiones-clave.md`: datos que se deben confirmar antes de conectar cuentas reales.
- `fase-0-creacion-cuentas.md`: guia para crear Gmail, OpenAI Platform y redes desde cero.
- `incidente-google-cuenta-inhabilitada.md`: registro y texto sugerido para apelar la cuenta Google bloqueada.
- `plan-b-microsoft-365.md`: ruta alternativa usando Outlook, OneDrive y Excel.
- `permisos-y-seguridad.md`: limites, permisos y manejo seguro de accesos.
- `plan-ejecucion-asistida.md`: orden de construccion con aprobaciones necesarias.
- `prompts/01-sistema-marca.md`: reglas de voz, cumplimiento y seguridad.
- `prompts/02-idea-organica.md`: genera posts desde ideas.
- `prompts/03-pdf-a-publicaciones.md`: convierte PDFs en borradores.
- `prompts/04-adaptador-plataformas.md`: adapta copy por red social.
- `templates/email-aprobacion.html`: correo de revision.
- `google-apps-script/configurar-calendario.gs`: script gratuito para crear la hoja en Google Sheets con columnas y listas desplegables.

## Orden recomendado de implementacion

1. Crear Google Sheet importando `calendario-contenido.csv`.
   - Alternativa mas rapida: pegar y ejecutar `google-apps-script/configurar-calendario.gs` en Extensiones > Apps Script.
2. Crear carpetas de Drive:
   - `CONTARAE Redes / 01 PDFs entrada`
   - `CONTARAE Redes / 02 Piezas aprobadas`
   - `CONTARAE Redes / 03 TikTok listo para subir`
   - `CONTARAE Redes / 04 Publicado`
3. Configurar conexiones de Make: Google Sheets, Google Drive, Gmail, Facebook Pages, Instagram for Business.
4. Construir primero el escenario 01.
5. Construir el escenario 03 solo cuando ya existan borradores aprobados.
6. Construir el escenario 02 para documentos PDF.
7. Activar el reporte semanal.

## Regla de seguridad editorial

Todo contenido tributario debe pasar por revision humana antes de publicarse. La IA puede resumir, estructurar y proponer, pero no debe inventar interpretaciones ni reemplazar criterio profesional.
