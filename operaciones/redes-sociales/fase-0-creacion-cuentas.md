# Fase 0: creacion de cuentas CONTARAE

Objetivo: crear el ecosistema propio de CONTARAE desde cero, usando el menor costo adicional posible.

## Resumen de decision actual

- Make: ya existe cuenta paga vinculada al correo personal.
- Gmail del negocio: pendiente de crear.
- Redes sociales propias: pendientes de crear.
- Motor IA: OpenAI API.
- TikTok: iniciar semi-automatico sin costo adicional.

## Orden recomendado

1. Usar el correo de GoDaddy como correo oficial del negocio.
2. Crear una cuenta de Google usando ese correo de GoDaddy para acceder a Google Sheets y Drive.
3. Crear o configurar cuenta OpenAI Platform con el correo de GoDaddy.
4. Crear Facebook Page de CONTARAE.
5. Crear Instagram Business y conectarlo a Facebook Page.
6. Crear TikTok de CONTARAE.
7. Crear conexiones en Make usando las cuentas definitivas.
8. Importar/configurar Google Sheet y escenarios.

## Correo del negocio

Decision recomendada si ya existe correo GoDaddy: usar ese correo como identidad principal de CONTARAE.

Ese correo puede servir para:

- Crear cuentas de Facebook, Instagram, TikTok y OpenAI.
- Recibir notificaciones.
- Enviar correos desde Make usando SMTP, Outlook/Microsoft 365 o la conexion de correo disponible.
- Verse mas profesional que un Gmail gratuito.

## Google Sheets y Google Drive con correo GoDaddy

Para usar Google Sheets y Google Drive no es obligatorio crear un Gmail nuevo, pero si necesitas una cuenta de Google.

Ruta recomendada:

- Crear una cuenta de Google usando el correo de GoDaddy.
- Elegir la opcion tipo `Usar mi direccion de correo actual` durante el registro.
- No crear un Gmail nuevo si quieres mantener todo bajo el correo corporativo.
- Usar esa cuenta de Google para Sheets, Drive y permisos de Make.

Importante:

- El correo seguira siendo GoDaddy.
- Google solo actuara como cuenta para acceder a Sheets/Drive.
- El buzón de correo no se mueve a Google a menos que contrates Google Workspace o migres el correo.

## Alternativa Gmail gratuito

Solo usar esta alternativa si el correo GoDaddy no permite crear una cuenta de Google o si se prefiere separar operaciones.

Opciones de correo a probar, en este orden:

1. `contarae@gmail.com`
2. `contarae.co@gmail.com`
3. `somoscontarae@gmail.com`
4. `contaraeoficial@gmail.com`
5. `contarae.colombia@gmail.com`

Si CONTARAE ya tiene dominio propio, la version mas profesional a futuro seria Google Workspace con algo como:

- `hola@contarae.com`
- `admin@contarae.com`
- `redes@contarae.com`

Pero para empezar sin costo adicional, Gmail gratuito funciona.

## Seguridad de la cuenta de correo

Acciones que debe hacer el usuario directamente:

- Crear la cuenta.
- Definir contrasena.
- Agregar telefono de recuperacion.
- Agregar correo personal como recuperacion.
- Activar verificacion en dos pasos.
- Guardar la contrasena en administrador de contrasenas.

No usar contrasenas genericas.

## OpenAI Platform

Crear o iniciar sesion en:

- `https://platform.openai.com/`

Configuracion recomendada:

- Crear proyecto: `CONTARAE Redes`
- Crear API key para Make: `make-contarae-redes`
- Guardar la API key solo dentro de la conexion segura de Make.
- Configurar limite mensual bajo para empezar.
- Usar el correo de GoDaddy como cuenta principal, si queda confirmado como correo oficial.

Presupuesto sugerido inicial:

- USD 10 a USD 20 mensuales.

Esto deberia alcanzar para validar el flujo de borradores si se usan modelos economicos y se evita generar imagen/video por IA al principio.

## Modelos OpenAI recomendados

Uso inicial recomendado:

- Ideas organicas, captions, hooks y hashtags: `gpt-5.4-nano`.
- PDFs tributarios, resumen de documentos y guiones con mayor cuidado: `gpt-5.4-mini`.

Razon:

- `gpt-5.4-nano` reduce costo para tareas simples.
- `gpt-5.4-mini` ofrece mejor calidad para contenido mas delicado o largo.

## Facebook Page

Facebook normalmente requiere que una pagina sea creada y administrada desde una cuenta personal.

Decision recomendada:

- Usar la cuenta personal del responsable como administrador.
- Crear pagina: `CONTARAE`.
- Agregar correo publico del negocio.
- Conectar la pagina con Instagram Business.

Nombre visible recomendado:

- `CONTARAE`

Categoria sugerida:

- Servicios de contabilidad
- Consultor financiero
- Servicio empresarial

## Instagram

Crear cuenta usando el Gmail del negocio.

Usuarios a probar:

1. `@contarae`
2. `@contarae.co`
3. `@somoscontarae`
4. `@contaraeoficial`
5. `@contaraecolombia`

Configuracion necesaria:

- Cambiar a cuenta Business.
- Conectar con la Facebook Page.
- Usar el mismo logo y biografia base.

## TikTok

Crear cuenta usando el Gmail del negocio.

Usuarios a probar:

1. `@contarae`
2. `@contarae.co`
3. `@somoscontarae`
4. `@contaraeoficial`
5. `@contaraecolombia`

Fase inicial:

- Make prepara guion, caption, hashtags y asset.
- Se envia correo con todo listo.
- El responsable sube manualmente desde la app.

## Biografia base

Version corta:

```text
CONTARAE
Contabilidad, impuestos y finanzas claras para personas y empresas.
Colombia
```

Version con CTA:

```text
CONTARAE
Te ayudamos a ordenar tus impuestos, contabilidad y finanzas.
Asesoria clara para tomar mejores decisiones.
```

## Pendientes para continuar

Confirmar:

- Correo GoDaddy exacto que se usara como correo oficial.
- Si se creara cuenta de Google con ese mismo correo para Sheets/Drive.
- Usuario elegido para Instagram/TikTok.
- Si la Facebook Page se crea desde la cuenta personal del responsable.
- Presupuesto mensual inicial de OpenAI.
