# [BUG] US-16: el vencimiento se desplaza un día en Montevideo

## Historia y criterio
US-16, criterios 1, 2 y 3.

## Pasos para reproducir
1. Iniciar servidor con TZ=America/Montevideo.
2. Abrir una tarea y seleccionar 2026-09-15 como vencimiento.
3. Guardar y recargar el detalle.
4. Repetir con TZ=UTC reiniciando el servidor.

## Resultado esperado
Se muestra 2026-09-15 en ambas zonas horarias.

## Resultado obtenido
Montevideo: 2026-09-14. UTC: 2026-09-15. Una fecha pasada 2000-01-01 también vuelve 1999-12-31 en Montevideo.

## Reproducibilidad
3/3 ejecuciones con `TZ=America/Montevideo` y datos nuevos en cada intento, el 2026-11-17.
Con `TZ=UTC`: 0/3 reproducciones; las tres pruebas pasan.

## Severidad
Media: adelanta el vencimiento visible y puede provocar decisiones erróneas de planificación.

## Entorno
Windows, Node.js 24.14.0, npm 11.9.0, Playwright 1.64.1, Chromium 156.0.8078.4, SQLite aislada. Base: `c2563be` más esta rama.

## Evidencia
Comandos, resultados y reportes JSON en [el registro de verificación](../evidencia/README.md). Reproducciones de clase 5: `tests/e2e/bug-reproductions.spec.ts` (API); US-15 y US-16: `tests/e2e/task-stories.spec.ts` (UI).

- [Trace task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat1](../evidencia/traces/montevideo/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat1.zip)
- [Trace task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat2](../evidencia/traces/montevideo/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat2.zip)
- [Trace task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora](../evidencia/traces/montevideo/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora.zip)

## Causa observada
formatDueDate usa getters locales sobre un timestamp almacenado en UTC.
