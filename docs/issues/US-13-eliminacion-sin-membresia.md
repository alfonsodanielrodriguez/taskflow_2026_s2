# [BUG] US-13 c1: un usuario externo puede eliminar tareas

## Historia y criterio
US-13, criterio 1.

## Pasos para reproducir
1. Registrar un owner y crear un proyecto y una tarea.
2. Registrar un segundo usuario sin agregarlo al proyecto.
3. Enviar DELETE /api/tasks/{id} con el token del segundo usuario.

## Resultado esperado
HTTP 403 con error FORBIDDEN; la tarea permanece.

## Resultado obtenido
HTTP 204: la tarea se elimina.

## Reproducibilidad
3/3 ejecuciones con `TZ=America/Montevideo` y datos nuevos en cada intento, el 2026-11-17.
Otras zonas horarias: no medidas.

## Severidad
Alta: permite eliminar datos de otro equipo sin autorización.

## Entorno
Windows, Node.js 24.14.0, npm 11.9.0, Playwright 1.64.1, Chromium 156.0.8078.4, SQLite aislada. Base: `c2563be` más esta rama.

## Evidencia
Comandos, resultados y reportes JSON en [el registro de verificación](../evidencia/README.md). Reproducciones de clase 5: `tests/e2e/bug-reproductions.spec.ts` (API); US-15 y US-16: `tests/e2e/task-stories.spec.ts` (UI).

- [Trace bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat1](../evidencia/traces/montevideo/bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat1.zip)
- [Trace bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat2](../evidencia/traces/montevideo/bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat2.zip)
- [Trace bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task](../evidencia/traces/montevideo/bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task.zip)

## Causa observada
La ruta DELETE omite requireTaskProjectMember.
