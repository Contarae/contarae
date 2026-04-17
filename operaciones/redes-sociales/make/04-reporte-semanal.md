# Escenario 04: reporte semanal

Objetivo: enviar un resumen semanal de publicaciones, errores y pendientes.

## Frecuencia sugerida

Viernes a las 16:30 America/Bogota.

## Modulos Make

1. Scheduler
   - Weekly, Friday, 16:30.

2. Google Sheets > Search Rows
   - Filtrar registros de los ultimos 7 dias.

3. Array aggregator
   - Agrupar por estado:
     - publicado
     - pendiente_aprobacion
     - error
     - aprobado

4. IA opcional
   - Crear resumen ejecutivo breve.
   - Si se quiere ahorrar operaciones/costos, omitir IA y usar plantilla fija.

5. Gmail/Email > Send an Email
   - Para: responsable de CONTARAE.
   - Asunto: `Reporte semanal redes CONTARAE`

## Cuerpo sugerido

- Publicadas esta semana.
- Pendientes de aprobacion.
- Errores por corregir.
- PDFs procesados.
- TikToks listos para subir.
- Ideas sugeridas para la proxima semana.
