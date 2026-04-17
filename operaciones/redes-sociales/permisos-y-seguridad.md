# Permisos y seguridad

## Lo que puedo preparar

- Estructura de Google Sheets.
- Carpetas de Google Drive.
- Prompts y reglas editoriales.
- Escenarios Make paso a paso.
- Blueprints o configuraciones importables cuando tengamos un escenario base real.
- Pruebas controladas con contenido de ejemplo.
- Checklist de publicacion y aprobacion.

## Lo que requiere tu accion directa

- Crear o iniciar sesion en Instagram, Facebook, TikTok, Google y Make.
- Aceptar permisos OAuth de cada app.
- Resolver captchas o verificaciones.
- Ingresar codigos de email, SMS o autenticador.
- Definir contrasenas reales.

## Politica de contrasenas

No usar contrasenas genericas para cuentas reales.

Riesgos de contrasenas genericas:

- Otra persona podria acceder si la contraseña se comparte por error.
- Puede disparar bloqueos de seguridad.
- Aumenta el riesgo de perder cuentas nuevas.

Metodo recomendado:

1. Tu creas o actualizas la contraseña en el sitio oficial.
2. Guardas la contraseña en tu administrador de contraseñas o llavero.
3. Activas verificacion en dos pasos.
4. Yo sigo configurando todo lo que no implique ver o manejar la contraseña.

## Permisos por plataforma

### Google

Necesario para:

- Google Sheets.
- Google Drive.
- Acceso de Make a hojas y carpetas.

Permisos esperados:

- Ver y editar hojas seleccionadas.
- Ver archivos de carpetas de contenido.

Si se usa correo GoDaddy, Google no necesariamente envia correos. El envio de correos puede hacerse por SMTP, Outlook/Microsoft 365 o Email by Make.

### GoDaddy / correo corporativo

Necesario para:

- Usar el correo oficial de CONTARAE como identidad de marca.
- Crear cuentas de OpenAI, redes sociales y servicios.
- Enviar o recibir notificaciones.

Opciones de conexion en Make:

- Si el correo GoDaddy esta sobre Microsoft 365, usar conexion Microsoft 365 Email/Outlook cuando este disponible.
- Si el correo permite SMTP, usar SMTP con conexion segura.
- Si no se quiere conectar el buzon al inicio, usar Email by Make para notificaciones internas y mantener el correo GoDaddy solo como login/identidad.

### Facebook

Necesario para:

- Publicar en la pagina de CONTARAE.
- Conectar Instagram Business.

Permisos esperados:

- Administrar o crear contenido de la pagina.
- Leer informacion basica de la pagina.

### Instagram

Necesario para:

- Publicar fotos, carruseles y reels desde Make.

Requisitos:

- Cuenta Instagram Business.
- Conectada a una Facebook Page.
- No usar cuenta Creator para esta automatizacion.

### TikTok

Primera version:

- Sin permisos de publicacion automatica.
- Make prepara contenido y envia alerta para subida manual.

Version avanzada:

- App de desarrollador TikTok.
- OAuth.
- Permisos de publicacion.
- Posible auditoria de la app antes de publicar en publico.

## API keys

Si se usa una API key, no debe quedar escrita en documentos, prompts ni capturas.

Forma recomendada:

- Guardarla como conexion segura dentro de Make.
- O guardarla en variables seguras del proveedor.
- No pegarla en Google Sheets ni en archivos del proyecto.
