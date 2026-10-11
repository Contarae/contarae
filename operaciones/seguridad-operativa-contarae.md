# Seguridad operativa CONTARAE

## Arquitectura actual

- Frontend React publicado en Netlify.
- Backend en Netlify Functions bajo `/api/*`.
- Datos operativos en Netlify Blobs.
- Pagos procesados con Wompi y webhooks firmados.
- Correos transaccionales mediante Resend.

## Datos sensibles

- Solicitudes de certificacion y soportes cargados por clientes.
- Certificados emitidos y documentos profesionales.
- Leads comerciales.
- Usuarios del portal de clientes.
- Pagos, referencias y estados de transaccion.
- Backups operativos.

## Secretos requeridos

- `ADMIN_PANEL_USERNAME`
- `ADMIN_PANEL_PASSWORD`
- `ADMIN_PANEL_SECRET`
- `CLIENT_PORTAL_SECRET`
- `WOMPI_EVENTS_SECRET`
- `WOMPI_INTEGRITY_KEY`
- `WOMPI_PUBLIC_KEY`
- `RESEND_API_KEY`
- `GA4_API_SECRET`

## Endpoints publicos de mayor exposicion

- `/api/submit-client-lead`
- `/api/save-pending-form`
- `/api/upload-certification-supports`
- `/api/validate-promo-code`
- `/api/wompi-signature`
- `/api/public-service-payments`
- `/api/get-service-payment`
- `/api/get-pending-form`
- `/api/get-paid-form`
- `/api/public-verify-certification`

## Reglas para cambios seguros en certificaciones

- No cambiar calculo de tarifas sin prueba manual del flujo completo.
- No cambiar firma Wompi ni webhook sin verificar pago aprobado y rechazado.
- No cambiar generacion de consecutivos sin revisar certificados existentes.
- No cambiar generacion de PDF sin comparar visualmente el certificado.
- No exponer soportes, certificados o documentos sin sesion admin.

## Controles actuales

- Cookies `HttpOnly`, `SameSite=Lax` y `Secure` en produccion.
- Rate limit nativo de Netlify en logins y endpoints publicos sensibles.
- CORS restringido a dominios esperados.
- Honeypot pasivo y limites de tamano en formularios publicos.
- Validacion de nombre, tipo, tamano y firma basica de archivos de soporte.
- Bitacora de eventos de seguridad en Netlify Blobs.
- Backups diarios de datos estructurados e inventario privado de archivos.

## Acciones que requieren intervencion externa

- Activar Cloudflare delante del dominio.
- Configurar Cloudflare Turnstile.
- Crear Supabase o base de datos equivalente.
- Rotar secretos en Netlify.
- Activar 2FA del proveedor cuando este disponible.
