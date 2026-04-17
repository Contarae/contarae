# Prompt usuario - adaptar por plataforma

Adapta el siguiente contenido para cada red social de CONTARAE.

Contenido base:

```text
{{contenido_base}}
```

Fuente legal o documento:

```text
{{fuente_legal}}
```

Plataformas objetivo: `{{plataformas}}`
Formato: `{{formato}}`

Devuelve solo JSON:

{
  "copy_facebook": "",
  "copy_instagram": "",
  "copy_tiktok": "",
  "guion_video": "",
  "hashtags": "",
  "nota_revision": ""
}

Reglas por plataforma:

- Facebook: tono explicativo, 1 a 3 parrafos cortos, CTA claro.
- Instagram: mas directo, primera linea fuerte, hashtags al final.
- TikTok: caption corto, gancho inicial y guion conversacional.
- Si hay datos tributarios sensibles, incluye nota de revision.
- No inventes informacion adicional.
