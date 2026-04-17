# Variables y conexiones Make

## Conexiones necesarias

- Google Sheets: calendario editorial.
- Google Drive: PDFs de entrada y assets.
- Correo de GoDaddy via SMTP, Outlook/Microsoft 365 o Email by Make: notificaciones de aprobacion.
- Facebook Pages: publicar en pagina de CONTARAE.
- Instagram for Business: publicar en cuenta Business.
- OpenAI: generacion de ideas, guiones, captions y contenido desde PDFs.

## Variables recomendadas

Crear en Make, o documentar dentro del escenario:

- `SHEET_ID`: ID del Google Sheet del calendario.
- `SHEET_NAME`: `Calendario`.
- `DRIVE_PDF_FOLDER_ID`: carpeta `01 PDFs entrada`.
- `DRIVE_ASSETS_FOLDER_ID`: carpeta `02 Piezas aprobadas`.
- `DRIVE_TIKTOK_FOLDER_ID`: carpeta `03 TikTok listo para subir`.
- `BRAND_NAME`: `CONTARAE`.
- `DEFAULT_HASHTAGS`: `#CONTARAE #Contabilidad #Impuestos #Renta #DIAN #FinanzasParaEmpresas`
- `APPROVAL_EMAIL`: correo del responsable de aprobacion.
- `BUSINESS_EMAIL`: correo oficial de CONTARAE en GoDaddy.
- `OPENAI_PROJECT`: `CONTARAE Redes`
- `OPENAI_ORGANIC_MODEL`: `gpt-5.4-nano`
- `OPENAI_PDF_MODEL`: `gpt-5.4-mini`

## Columnas minimas para filtros

- `estado`
- `fecha_programada`
- `hora_programada`
- `plataformas`
- `formato`
- `copy_facebook`
- `copy_instagram`
- `copy_tiktok`
- `asset_url`
- `pdf_url`
- `fuente_legal`
- `requiere_revision_tributaria`

## Filtros criticos

Publicar solo si:

- `estado` es exactamente `aprobado`.
- `fecha_programada` es menor o igual a la fecha actual.
- `copy_facebook` o `copy_instagram` no estan vacios segun plataforma.
- Para Instagram, `asset_url` no esta vacio si el formato requiere imagen/video.
- `requiere_revision_tributaria` es `no` o existe `aprobado_por`.

## Convenciones de nombres

- IDs de contenido: `CON-0001`, `CON-0002`, etc.
- PDFs: `YYYY-MM-DD_entidad_tipo_tema.pdf`
- Assets: `CON-0001_instagram_1080x1080.png`
- Videos: `CON-0001_tiktok_1080x1920.mp4`
