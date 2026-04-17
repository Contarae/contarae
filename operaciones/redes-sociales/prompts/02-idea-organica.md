# Prompt usuario - idea organica

Genera una publicacion para CONTARAE a partir de esta idea:

Tema: `{{tema}}`
Formato preferido: `{{formato}}`
Plataformas: `{{plataformas}}`
Audiencia: empresarios, independientes y personas naturales en Colombia.

Necesito que produzcas un borrador listo para revision humana.

Devuelve solo este JSON:

{
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
  "fuente_legal": "no aplica",
  "requiere_revision_tributaria": "si",
  "notas_revision": ""
}

Instrucciones:

- Si el tema incluye renta, impuestos, DIAN, sanciones, topes, plazos o normativa, no inventes cifras ni fechas.
- Para carrusel, crea entre 5 y 7 slides.
- Para video corto, crea guion de 30 a 45 segundos.
- CTA sugerido: invitar a revisar el caso con CONTARAE, sin prometer resultados.
- Hashtags maximo 8.
