# [BUG] US-15: etiquetas duplicadas al cambiar mayúsculas

## Historia y criterio
US-15, criterios 1, 2 y 3.

## Pasos para reproducir
1. Abrir una tarea como miembro.
2. Escribir Bug y pulsar Agregar etiqueta.
3. Escribir bug y pulsar Agregar etiqueta.

## Resultado esperado
Una única etiqueta normalizada a bug; la segunda operación es idempotente.

## Resultado obtenido
La interfaz muestra dos chips: Bug y bug; la API crea ambas etiquetas.

## Reproducibilidad
3/3 ejecuciones con `TZ=America/Montevideo` y datos nuevos en cada intento, el 2026-11-17.
Otras zonas horarias: no medidas.

## Severidad
Media: genera duplicados y hace inconsistentes la clasificación y los filtros.

## Entorno
Windows, Node.js 24.14.0, npm 11.9.0, Playwright 1.64.1, Chromium 156.0.8078.4, SQLite aislada. Base: `c2563be` más esta rama.

## Evidencia
Comandos, resultados y reportes JSON en [el registro de verificación](../evidencia/README.md). Reproducciones de clase 5: `tests/e2e/bug-reproductions.spec.ts` (API); US-15 y US-16: `tests/e2e/task-stories.spec.ts` (UI).

- [Trace task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat1](../evidencia/traces/montevideo/task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat1.zip)
- [Trace task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat2](../evidencia/traces/montevideo/task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat2.zip)
- [Trace task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado](../evidencia/traces/montevideo/task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado.zip)

## Causa observada
addTag recorta espacios, pero no convierte a minúsculas y compara por igualdad exacta.
