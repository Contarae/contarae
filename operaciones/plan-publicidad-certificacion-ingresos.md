# Plan de publicidad - Certificación de ingresos CONTARAE

## Diagnóstico inicial

### Datos observados

- Google Ads: campaña Performance Max "Asesoría Contable", 30 de abril a 2 de mayo de 2026, presupuesto COP 15.000/día, 1.278 impresiones, COP 16.516 de costo y 0 conversiones.
- Activos con más interacción: logo 503 impresiones y 23 clics, título "Asesoría Contable" 206 impresiones y 20 clics, "Contadores Profesionales" 97 impresiones y 19 clics.
- Search Console: últimos 28 días con 23 clics, 683 impresiones, CTR 3,4% y posición media 7,4.
- Páginas orgánicas principales: `/certificado-de-ingresos-contador-publico`, `/certificado-de-ingresos-para-banco`, `/certificacion`, `/certificado-de-ingresos-para-independientes`, `/comprar-certificado-de-ingresos`.
- Consultas detectadas: "certificado de ingresos por contador publico", "certificado de ingresos para independientes", "certificado de ingresos", "certificación de ingresos", "justificante de ingresos banco", "certificado de ingresos por arrendamiento", "como comprobar ingresos si soy independiente".
- Dispositivo: móvil 12 clics / 230 impresiones; escritorio 11 clics / 451 impresiones. El tráfico convierte potencialmente en ambos, pero móvil debe ser prioritario para formulario y WhatsApp.
- Países: Colombia concentra clics útiles. Estados Unidos, Venezuela y España tienen impresiones sin clics o baja intención para el servicio local.

### Lectura estratégica

El servicio tiene intención comercial clara: bancos, arriendo, independientes, contador público, documento firmado y urgencia. La campaña anterior mezcló una categoría amplia ("asesoría contable") con un producto puntual ("certificación de ingresos"), sin conversiones medidas. Antes de escalar presupuesto se debe cerrar la medición y separar campañas por intención.

El sitio ya tiene rutas SEO valiosas, sitemap, robots, canonical, datos estructurados y una función edge para metadatos. La prioridad no es crear muchas URL nuevas de inmediato, sino optimizar medición, landing principal, conversiones y arquitectura de campañas.

## Objetivo comercial

Vender certificaciones de ingresos firmadas por Contador Público en Colombia, priorizando personas naturales que necesitan demostrar ingresos ante bancos, inmobiliarias, arrendadores, embajadas, concesionarios o procesos privados.

### KPI principales

- Conversión primaria: pago aprobado de certificación.
- Conversiones secundarias: formulario iniciado, formulario enviado pendiente de pago, clic a WhatsApp, lead de contacto, carga de soportes.
- Métricas de control: costo por formulario iniciado, costo por solicitud pendiente, costo por pago aprobado, tasa de formulario a pago, tasa de pago a certificado emitido.

## Fase 1 - Medición y trazabilidad

1. Instalar Google Tag Manager o Google tag con GA4 y Google Ads.
2. Configurar eventos:
   - `cert_form_open`
   - `cert_step_1_complete`
   - `cert_step_2_complete`
   - `cert_payment_click`
   - `cert_pending_saved`
   - `cert_payment_approved`
   - `whatsapp_click`
   - `lead_submit`
3. Marcar como conversión principal en Google Ads solo `cert_payment_approved`.
4. Marcar como conversiones secundarias `cert_pending_saved`, `lead_submit` y `whatsapp_click`.
5. Activar conversiones mejoradas con email/teléfono cuando haya consentimiento y pago o lead.
6. Guardar `gclid`, `gbraid` y `wbraid` en formularios y pagos para importación offline si se requiere.
7. Validar con Tag Assistant, vista DebugView de GA4 y diagnóstico de conversiones en Google Ads.

## Fase 2 - SEO técnico y landings

1. Verificar en Search Console indexación de:
   - `/certificacion`
   - `/certificado-de-ingresos-contador-publico`
   - `/certificado-de-ingresos-para-independientes`
   - `/certificado-de-ingresos-para-banco`
   - `/certificado-de-ingresos-para-arrendamiento`
   - `/comprar-certificado-de-ingresos`
2. Actualizar `lastmod` del sitemap cada vez que cambiemos contenido importante.
3. Revisar titles y descriptions para que ataquen intención transaccional y no solo informativa.
4. Fortalecer contenido visible en la landing principal:
   - precio desde COP 80.000
   - entrega digital
   - firmado por Contador Público
   - revisión de soportes
   - pago seguro
   - validación posterior del certificado
5. Añadir bloques por intención si no están suficientemente visibles:
   - para banco o crédito
   - para arrendamiento
   - para independientes
   - para empleado
   - para visa o embajada, solo si el servicio realmente lo cubre
6. Evaluar nuevas URL solo después de validar demanda:
   - `/certificado-de-ingresos-para-visa`
   - `/certificado-de-ingresos-para-credito-hipotecario`
   - `/certificado-de-ingresos-para-inmobiliaria`
   - `/certificado-de-ingresos-para-empleados`

## Fase 3 - Google Ads Search

Crear una campaña Search separada de Performance Max, enfocada en intención alta.

### Grupo 1 - Contador Público

- certificado de ingresos contador público
- certificación de ingresos contador público
- certificado de ingresos firmado por contador
- certificado contable de ingresos

### Grupo 2 - Banco y crédito

- certificado de ingresos para banco
- certificación de ingresos para crédito
- justificante de ingresos banco
- certificado de ingresos para préstamo

### Grupo 3 - Independientes

- certificado de ingresos para independientes
- como comprobar ingresos si soy independiente
- certificación de ingresos independiente
- soporte de ingresos independiente

### Grupo 4 - Arrendamiento

- certificado de ingresos para arrendamiento
- certificado de ingresos para inmobiliaria
- certificado ingresos codeudor
- certificado de ingresos para arriendo

### Negativas iniciales

- gratis
- formato
- ejemplo
- plantilla
- pdf gratis
- descargar
- modelo
- falso
- editable
- sin soporte
- trabajo
- empleo
- curso

## Fase 4 - Anuncios y extensiones

### Propuesta de títulos

- Certificación de ingresos
- Firmada por Contador Público
- Certificado para banco
- Certificado para arriendo
- Para independientes
- Solicitud 100% en línea
- Pago seguro por Wompi
- Entrega digital en PDF
- Desde COP 80.000
- Revisión de soportes
- CONTARAE Colombia

### Propuesta de descripciones

- Solicite su certificación de ingresos firmada por Contador Público. Pago en línea, revisión profesional y entrega digital.
- Ideal para bancos, arriendos, créditos e independientes. Cargue soportes, pague seguro y reciba seguimiento.
- Tarifas claras según ingresos reportados. Documento en PDF con datos de validación y atención por WhatsApp.
- Proceso 100% digital en Colombia. Revisamos soportes antes de emitir para que el certificado sea consistente.

### Recursos recomendados

- Enlaces de sitio: Banco, Independientes, Arrendamiento, Comprar certificado, Verificar certificado.
- Extractos destacados: Pago seguro, Entrega digital, Revisión profesional, Atención por WhatsApp.
- Fragmentos estructurados: Usos: Banco, arriendo, crédito, independiente, inmobiliaria.
- Llamada o WhatsApp si Google Ads lo permite según configuración local.

## Fase 5 - Performance Max

Usar Performance Max solo después de tener conversiones funcionando.

1. Crear grupo de recursos exclusivo para certificación de ingresos.
2. Enviar señales de audiencia:
   - visitantes de páginas de certificación
   - usuarios que abrieron formulario
   - leads y pagos anteriores
   - intención personalizada con consultas de certificado de ingresos
3. Excluir o reducir señales demasiado amplias como asesoría contable general.
4. Usar creatividades específicas de certificación, no genéricas de contabilidad.
5. Mantener Search como fuente de intención principal mientras el volumen sea bajo.

## Fase 6 - Presupuesto y pruebas

### Primera etapa

- Search: COP 20.000 a COP 40.000 diarios por 10 a 14 días.
- Performance Max: pausada o con presupuesto menor hasta tener conversiones.
- Objetivo: acumular clics de intención alta y medir calidad real.

### Reglas de optimización

- No optimizar por conversiones antes de confirmar que la etiqueta mide correctamente.
- Pausar términos con gasto y cero intención comercial.
- Subir presupuesto solo si hay pagos o solicitudes calificadas.
- Separar móviles si WhatsApp/formulario rinde mejor que escritorio.

## Fase 7 - Operación semanal

1. Lunes: revisar términos de búsqueda, negativas y CTR.
2. Miércoles: revisar conversiones, formularios pendientes y WhatsApp.
3. Viernes: revisar costo por pago, páginas de destino y ajustes de anuncio.
4. Cada 15 días: actualizar contenidos SEO con consultas reales de Search Console.
5. Cada mes: decidir nuevas URL por intención con impresiones o consultas repetidas.

## Primer paso recomendado

Implementar medición completa antes de reactivar inversión. Sin esto, Google Ads seguirá mostrando clics y costo, pero no sabremos qué anuncio, consulta, dispositivo o página realmente genera pagos.
