# Escenario 01: ideas organicas a borrador

Objetivo: generar contenido organico para CONTARAE y dejarlo en Google Sheets como borrador pendiente de aprobacion.

## Frecuencia sugerida

Ejecutar lunes, miercoles y viernes a las 08:00 America/Bogota.

## Modulos Make

1. Scheduler
   - Run scenario: Every week.
   - Days: Monday, Wednesday, Friday.
   - Time: 08:00.

2. Google Sheets > Search Rows
   - Buscar filas donde:
     - `tipo_contenido` = `organico`
     - `estado` = `idea`
   - Limite: 1 o 3 segun volumen.

3. Router
   - Ruta A: existe una idea en la hoja.
   - Ruta B: no existe idea, generar una idea nueva con IA.

4. IA > Create completion/chat/agent
   - Prompt base: `prompts/01-sistema-marca.md`
   - Prompt usuario: `prompts/02-idea-organica.md`
   - Entrada:
     - tema
     - formato
     - plataformas
     - audiencia: empresarios, independientes y personas naturales en Colombia

5. JSON > Parse JSON
   - Usar la estructura esperada del prompt.

6. Google Sheets > Update a Row
   - Actualizar:
     - `estado` = `pendiente_aprobacion`
     - `titulo`
     - `copy_facebook`
     - `copy_instagram`
     - `copy_tiktok`
     - `guion_video`
     - `texto_carrusel`
     - `hashtags`
     - `requiere_revision_tributaria` = `si`

7. Gmail/Email > Send an Email
   - Para: responsable de aprobacion.
   - Asunto: `Borrador CONTARAE listo para revisar - {{id}}`
   - HTML: `templates/email-aprobacion.html`

## Reglas

- No publicar desde este escenario.
- Si la IA devuelve datos incompletos, marcar `estado` = `error`.
- Si no hay tema, usar una idea de calendario tributario colombiano, pero sin inventar fechas. Si la fecha no esta confirmada, no mencionarla.

## Prueba rapida

Crear una fila con:

- `id`: `CON-TEST-001`
- `tipo_contenido`: `organico`
- `tema`: `5 errores que se cometen en la declaracion de renta`
- `plataformas`: `facebook,instagram,tiktok`
- `formato`: `carrusel`
- `estado`: `idea`

El resultado esperado es una fila en `pendiente_aprobacion` con copies listos y correo de revision enviado.
