# Prompt usuario - PDF a publicaciones

Convierte el siguiente documento en propuestas de contenido para redes sociales de CONTARAE.

Nombre del archivo: `{{file_name}}`
URL del PDF: `{{pdf_url}}`
Texto extraido:

```text
{{pdf_text}}
```

Devuelve solo un JSON con esta estructura:

{
  "documento": {
    "titulo_detectado": "",
    "entidad": "",
    "tipo_documento": "",
    "numero": "",
    "fecha": "",
    "fuente_legal": "",
    "resumen": "",
    "limitaciones": ""
  },
  "publicaciones": [
    {
      "tema": "",
      "formato": "carrusel",
      "titulo": "",
      "copy_facebook": "",
      "copy_instagram": "",
      "copy_tiktok": "",
      "guion_video": "",
      "texto_carrusel": [
        {
          "slide": 1,
          "titulo": "",
          "texto": ""
        }
      ],
      "hashtags": "",
      "fuente_legal": "",
      "requiere_revision_tributaria": "si",
      "notas_revision": ""
    }
  ]
}

Reglas:

- Genera entre 1 y 3 publicaciones.
- Usa solo informacion del documento.
- Si un dato no aparece, usa `no especificado`.
- No agregues conclusiones legales que el documento no diga.
- Cada publicacion debe ser entendible para una persona no experta.
- Incluye referencia al documento fuente en `fuente_legal`.
- Marca todo como `requiere_revision_tributaria: si`.
