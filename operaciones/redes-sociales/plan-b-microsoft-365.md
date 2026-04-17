# Plan B: Microsoft 365 + OneDrive + Excel

Objetivo: continuar la automatizacion sin depender de Google Sheets/Drive si Google mantiene bloqueada la cuenta `info@contarae.com`.

## Cuando usar este plan

Usar este plan si:

- El correo de GoDaddy funciona sobre Microsoft 365.
- Google no restaura la cuenta.
- Se prefiere evitar crear cuentas Google adicionales.
- Se quiere mantener todo bajo el correo corporativo `info@contarae.com`.

## Herramientas equivalentes

- Google Sheets -> Microsoft 365 Excel.
- Google Drive -> OneDrive.
- Gmail -> Microsoft 365 Email/Outlook.
- Google Apps Script -> configuracion manual de tabla en Excel.

## Make soporta esta ruta

Make tiene integraciones verificadas para:

- Microsoft 365 Excel.
- OneDrive.
- Microsoft 365 Email (Outlook).

## Estructura recomendada en OneDrive

Crear carpeta:

- `CONTARAE Redes`

Subcarpetas:

- `01 PDFs entrada`
- `02 Piezas aprobadas`
- `03 TikTok listo para subir`
- `04 Publicado`

## Archivo Excel

Crear archivo:

- `CONTARAE calendario redes.xlsx`

Crear una tabla llamada:

- `Calendario`

Usar las mismas columnas de:

- `calendario-contenido.csv`

## Cambios en escenarios Make

Reemplazos:

- Google Sheets > Search Rows -> Microsoft 365 Excel > Search Rows / List Table Rows.
- Google Sheets > Add Row -> Microsoft 365 Excel > Add a Table Row.
- Google Sheets > Update Row -> Microsoft 365 Excel > Update a Row.
- Google Drive > Watch Files -> OneDrive > Watch Files.
- Google Drive > Download File -> OneDrive > Download a File.
- Gmail > Send Email -> Microsoft 365 Email > Send an Email.

## Ventajas

- Mantiene el correo corporativo como centro.
- Evita bloqueo de Google.
- No requiere Google Workspace.
- Encaja bien con correos GoDaddy basados en Microsoft 365.

## Desventajas

- Excel en Make suele requerir que los datos esten dentro de una tabla formal.
- Google Sheets es mas comodo para edicion colaborativa sencilla.
- Algunas plantillas existentes del paquete estan escritas pensando en Google Sheets y hay que mapearlas a Excel.

## Decision recomendada

Si la apelacion de Google tarda o falla, avanzar con Microsoft 365.

La automatizacion central se mantiene igual:

1. OpenAI genera borradores.
2. Excel guarda calendario y estados.
3. OneDrive guarda PDFs y assets.
4. Outlook envia aprobaciones.
5. Facebook/Instagram publican desde Make.
6. TikTok queda listo para subida manual.
