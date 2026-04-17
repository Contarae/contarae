# Escenario 03: publicacion aprobada

Objetivo: publicar automaticamente contenido aprobado en Facebook e Instagram, y preparar TikTok sin costo adicional.

## Frecuencia sugerida

Cada 30 minutos.

## Modulos Make

1. Scheduler
   - Run scenario: every 30 minutes.

2. Google Sheets > Search Rows
   - Buscar filas donde:
     - `estado` = `aprobado`
     - `fecha_programada` <= hoy
     - `hora_programada` <= hora actual

3. Router
   - Ruta Facebook.
   - Ruta Instagram.
   - Ruta TikTok.

## Ruta Facebook

Filtro:

- `plataformas` contiene `facebook`.
- `copy_facebook` no esta vacio.

Modulo:

- Facebook Pages > Create a Post, Create a Post with Photo, Upload a Video o Create a Reel, segun `formato` y `asset_url`.

Actualizar fila:

- `facebook_post_id` = ID devuelto por Facebook.

## Ruta Instagram

Filtro:

- `plataformas` contiene `instagram`.
- `copy_instagram` no esta vacio.
- `asset_url` existe si se publica foto, carrusel o reel.

Modulo:

- Instagram for Business > Create a Photo Post, Create a Carousel Post o Create a Reel Post.

Actualizar fila:

- `instagram_post_id` = ID devuelto por Instagram.

## Ruta TikTok

Filtro:

- `plataformas` contiene `tiktok`.

Primera version sin costo adicional:

1. Google Drive > Copy/Move a File
   - Mover asset/video a `03 TikTok listo para subir`.
2. Gmail/Email > Send an Email
   - Enviar paquete:
     - titulo
     - copy_tiktok
     - guion_video
     - hashtags
     - enlace al asset/video
3. Google Sheets > Update a Row
   - `tiktok_estado` = `listo_para_subida_manual`

Fase 2 opcional:

- Usar TikTok Content Posting API via HTTP si CONTARAE quiere invertir tiempo tecnico en app de desarrollador.
- Usar Buffer/Metricool solo si ya se tiene cuenta o si el costo se aprueba.

## Cierre de fila

Despues de procesar rutas:

- Si Facebook e Instagram terminaron bien y TikTok quedo `listo_para_subida_manual`, actualizar:
  - `estado` = `publicado`
  - `notas` = `Publicado FB/IG; TikTok listo para subida manual`

Si una ruta falla:

- `estado` = `error`
- `error` = mensaje del modulo

## Prueba rapida

Crear una fila aprobada con solo Facebook al inicio. Luego probar Instagram con una imagen publica. Despues activar TikTok como paquete manual.
