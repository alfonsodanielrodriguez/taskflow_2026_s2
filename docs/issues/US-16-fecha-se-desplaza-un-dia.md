# [BUG] US-16 devuelve la fecha de vencimiento un día antes

## Historia y criterio
US-16, criterios de aceptación 1, 2 y 3: la fecha es un día calendario, se devuelve en formato `YYYY-MM-DD` y no cambia según la zona horaria.

## Pasos para reproducir
1. Crear una tarea como miembro del proyecto.
2. Enviar `PATCH /api/tasks/{taskId}` con `{ "dueDate": "2026-09-15" }`.
3. Inspeccionar el campo `dueDate` de la respuesta.

## Resultado esperado
La respuesta devuelve `dueDate: "2026-09-15"`.

## Resultado obtenido
La respuesta devuelve `dueDate: "2026-09-14"`. Con `2000-01-01`, también devuelve el día anterior (`1999-12-31`).

## Evidencia
Fallaron `US-16 feliz: guarda la fecha como día calendario sin hora` y `US-16 borde: acepta fechas pasadas` en `npx playwright test`. Implementación relacionada: `server/src/lib/ids.ts`, funciones `parseDueDate` y `formatDueDate`.

## Entorno
- macOS, Node.js 26.12.0, Playwright 1.64.1.
- API local en `http://127.0.0.1:3000/api`.
