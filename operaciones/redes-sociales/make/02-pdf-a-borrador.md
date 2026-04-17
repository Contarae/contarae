# Escenario 02: PDF a borrador

Objetivo: detectar PDFs nuevos en Google Drive, extraer informacion util y generar borradores para redes.

## Frecuencia sugerida

Cada 2 horas durante dias habiles, o manual al cargar documentos importantes.

## Modulos Make

1. Google Drive > Watch Files in a Folder
   - Carpeta: `01 PDFs entrada`.
   - Tipo: PDF.

2. Google Drive > Download a File
   - Descargar el PDF detectado.

3. PDF/Text extractor
   - Opcion preferida: modulo nativo disponible en Make para extraer texto si esta en tu cuenta.
   - Alternativa sin costo adicional: Google Drive OCR si el PDF es imagen, convirtiendo a Google Docs y leyendo texto.
   - Alternativa si el PDF ya tiene texto: usar extractor de texto disponible en Make.

4. IA > Create completion/chat/agent
   - Prompt base: `prompts/01-sistema-marca.md`
   - Prompt usuario: `prompts/03-pdf-a-publicaciones.md`
   - Entrada:
     - texto extraido del PDF
     - nombre del archivo
     - enlace del archivo

5. JSON > Parse JSON
   - Esperar un arreglo con 1 a 3 propuestas de publicacion.

6. Iterator
   - Crear una fila por cada propuesta.

7. Google Sheets > Add a Row
   - `tipo_contenido`: `pdf`
   - `fuente`: nombre del PDF
   - `pdf_url`: enlace al PDF
   - `estado`: `pendiente_aprobacion`
   - `fuente_legal`: entidad, fecha y numero del documento si existen.
   - `requiere_revision_tributaria`: `si`

8. Gmail/Email > Send an Email
   - Avisar que hay borradores creados desde PDF.

## Reglas para documentos

- La IA solo puede usar informacion presente en el PDF.
- Si el documento no contiene fecha, entidad o numero, debe poner `no especificado`.
- No debe afirmar que una norma esta vigente si el PDF no lo confirma.
- La revision humana es obligatoria.

## Prueba rapida

Subir un PDF corto a la carpeta `01 PDFs entrada`.

Resultado esperado:

- 1 a 3 filas nuevas en Google Sheets.
- Cada fila queda en `pendiente_aprobacion`.
- Cada fila incluye `pdf_url` y `fuente_legal`.
