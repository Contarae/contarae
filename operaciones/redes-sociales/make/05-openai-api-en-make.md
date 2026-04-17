# Escenario base: OpenAI API en Make

Objetivo: usar OpenAI como motor de ideas, guiones, captions y conversion de PDFs a publicaciones.

## Opcion recomendada

Usar el modulo oficial de OpenAI en Make si permite seleccionar el modelo requerido.

Si el modulo de Make no muestra el modelo deseado, usar:

- HTTP > Make a request
- Endpoint: `https://api.openai.com/v1/responses`

## Conexion segura

No pegar la API key en Google Sheets ni en prompts.

Guardar la API key en:

- Conexion segura del modulo OpenAI de Make, o
- Header Authorization del modulo HTTP usando variable/connection segura.

Header:

```text
Authorization: Bearer {{OPENAI_API_KEY}}
Content-Type: application/json
```

## Modelos

Configuracion inicial:

- Ideas organicas: `gpt-5.4-nano`
- Adaptacion por plataforma: `gpt-5.4-nano`
- PDFs y normativa: `gpt-5.4-mini`
- Revision editorial mas cuidadosa: `gpt-5.4-mini`

## Request ejemplo para HTTP

```json
{
  "model": "gpt-5.4-nano",
  "input": [
    {
      "role": "system",
      "content": "Eres el asistente editorial de CONTARAE. Devuelve solo JSON valido."
    },
    {
      "role": "user",
      "content": "Genera una publicacion sobre 5 errores que se cometen en la declaracion de renta."
    }
  ],
  "text": {
    "format": {
      "type": "json_object"
    }
  }
}
```

## Request ejemplo para PDF/normativa

```json
{
  "model": "gpt-5.4-mini",
  "input": [
    {
      "role": "system",
      "content": "Eres el asistente editorial de CONTARAE. Usa solo la informacion entregada. No inventes fechas, articulos ni interpretaciones. Devuelve solo JSON valido."
    },
    {
      "role": "user",
      "content": "Convierte este texto extraido de un PDF en 1 a 3 publicaciones: {{pdf_text}}"
    }
  ],
  "text": {
    "format": {
      "type": "json_object"
    }
  }
}
```

## Control de costos

Reglas recomendadas:

- Generar maximo 3 borradores por ejecucion.
- Limitar PDFs muy largos: si el texto supera el limite practico del escenario, dividir en partes.
- No generar imagenes ni videos con IA en la primera version.
- Guardar respuestas en Google Sheets para no regenerar lo mismo.
- Usar `gpt-5.4-nano` para ideas simples.
- Usar `gpt-5.4-mini` solo cuando el documento sea normativo o la publicacion requiera mas cuidado.

## Validacion

Antes de activar en automatico:

1. Ejecutar una idea organica.
2. Revisar que el JSON sea valido.
3. Guardar resultado en Google Sheets.
4. Probar un PDF corto.
5. Revisar que no invente datos.
6. Confirmar que todo queda en `pendiente_aprobacion`, no publicado.
