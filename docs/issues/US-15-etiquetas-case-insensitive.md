# [BUG] US-15 agrega duplicados de etiquetas que solo difieren en mayúsculas

## Historia y criterio
US-15, criterios de aceptación 1, 2 y 3: normalizar las etiquetas a minúsculas, comparar sin distinguir mayúsculas y no permitir duplicados.

## Pasos para reproducir
1. Crear una tarea como miembro del proyecto.
2. Enviar `POST /api/tasks/{taskId}/tags` con `{ "name": "Bug" }`.
3. Enviar el mismo endpoint para esa tarea con `{ "name": "bug" }`.

## Resultado esperado
La segunda solicitud devuelve HTTP 200 y la tarea conserva una única etiqueta, normalizada a `bug`.

## Resultado obtenido
La segunda solicitud devuelve HTTP 201 y la tarea queda con dos etiquetas.

## Evidencia
Falló `US-15 borde: repetir etiqueta ignorando mayúsculas no crea duplicado` al ejecutar `npx playwright test`: esperado 200, recibido 201. Implementación relacionada: `server/src/modules/tasks/tasks.service.ts`, función `addTag`.

## Entorno
- macOS, Node.js 26.12.0, Playwright 1.64.1.
- API local en `http://127.0.0.1:3000/api`.
