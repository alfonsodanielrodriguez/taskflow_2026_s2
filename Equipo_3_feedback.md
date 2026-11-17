# Equipo 3 — Calificaciones por equipo, Testing y Calidad de Software 2026

**Repo:** https://github.com/alfonsodanielrodriguez/taskflow_2026_s2

Este archivo tiene solo las tareas calificadas por equipo. Las notas individuales (cuestionario de la clase 1, cuestionarios de Moodle y participación) se llevan aparte.

_Escala de las notas: 0-100._

## Tareas por equipo

| Tarea | Clase | Peso | Puntos del curso (máx., de 100) | Nota | Aporta a la final (puntos) | Observaciones |
|---|---|---|---|---|---|---|
| Taller de refinamiento | 2 | 5,3 | 2,65 | pendiente |  | Pendiente de entrega: no figura en el repo (README, docs/, docx). |
| Integration + cobertura + refactor (código pestilente + Ej. 1 de clase 7) | 3 y 7 | 10,6 | 5,30 | 78 | 4,13 | Refactor de 5 smells (PR #1); los tests de assignee y status son de caracterización (pasan contra el código anterior). Ramas 44,49 % y líneas 72,01 % verificadas. Falta el `coverageThreshold` en Jest y el listado escrito de smells. |
| Postman + Supertest, caza de bugs | 5 | 5,3 | 2,65 | 75 | 1,99 | Dos tests Supertest que detectan bugs reales de la spec (US-02 c5 y US-13 c1); verifican solo status, no el cuerpo. A los reportes del docx les faltan entorno, reproducibilidad y severidad. Postman no se cuenta. |
| ADR | 6 | 5,3 | 2,65 | 47 | 1,25 | ADR consistente con lo que hicieron (App Actions sobre `server/tests/helpers.ts`), pero sin alternativas descartadas ni costos, y sin framework Playwright ni Component Object. |
| E2E + bugs | 7 y 8 | 10,6 | 5,30 | 66 | 3,50 | 13 casos de Playwright para US-12, 14, 15 y 16 que detectan los bugs de US-15 y US-16, pero van contra la API y no recorren la interfaz. Los bugs están como borradores en `docs/issues/`, no son GitHub issues, y les faltan reproducibilidad y severidad. |
| Performance (k6: tabla seed chica vs grande + issue) | 9 | 5,3 | 2,65 | pendiente |  | Pendiente de entrega: no hay k6, `performance/` ni issue. |
| Seguridad + accesibilidad (ZAP, axe-core, CVSS) | 11 | 5,3 | 2,65 | pendiente |  | Pendiente de entrega: no hay ZAP, axe-core ni CVSS. |
| Pipeline (`ci.yml` y job de E2E) | 12 | 10,6 | 5,30 | 0 | 0,00 | No hay ningún `ci.yml` ni otro `.yml` en el repo ni en su historial; Actions está vacío. 0 puntos. |
| Presentación (por definir) | 16 | 15,9 | 7,95 | pendiente |  | Pendiente: todavía no se hizo. |
| Informe de una página | 12 | 12,8 | 6,40 | pendiente |  | Pendiente de entrega: `docs/informe-pruebas-ejercicio-2.md` es el informe de E2E, no este. |
| **Total por equipo** | | **87,0** (42,4 ya calificados) | **43,50** | 51,3 (promedio ponderado de lo calificado) | **10,87** | Faltan por entregar: Taller de refinamiento, Performance, Seguridad + accesibilidad, Informe y Presentación. |
| Tareas individuales (Moodle 6, participación 5, cuestionario clase 1 2; pesos provisorios) |  | 13 | 6,50 |  | pendiente | Se llevan aparte, ver `Calificacion_final.md`. |
| **Proyecto final corregido** |  |  | **50,00** | pendiente | pendiente | Vale el 50 % de la nota final. Se califica después de que arreglen lo señalado en estas tareas. |
| **Total del curso** |  |  | **100,00** |  | **10,87** de 100 (hasta ahora; faltan individuales y proyecto final) | 43,50 (equipo) + 6,50 (individuales) + 50,00 (proyecto) |

_Los 13 de peso restantes de las tareas (6,5 puntos del curso: Moodle 6, participación 5, cuestionario clase 1 2) son individuales. Pesos provisorios, pendientes de confirmar._

## Proyecto corregido

| Concepto | Nota | Observaciones |
|---|---|---|
| Nota del proyecto corregido (incluye Rúbrica C de Pact) | | |

## Sugerencias de arreglo para el equipo (2026-11-17)

Notas en escala 0-100. Los "GitHub issues" son los tickets de la pestaña Issues del repo.

### Pipeline
- **No hay `ci.yml`:** crear `.github/workflows/ci.yml` con jobs independientes (sin `needs`, para que una etapa en rojo no oculte a las demás): build del servidor, lint, tests, cobertura y build del cliente. Cada job con `actions/checkout`, `actions/setup-node` con `cache: npm` y `npm ci`. Recupera hasta 97 puntos.
- **Lint:** ESLint no está instalado en `server/`: `npm --prefix server i -D eslint@9 @eslint/js@9 typescript-eslint@8`, agregar `eslint.config.mjs` y commitear `package.json` y el lock. Evita un descuento de 5.
- **Job de E2E (opcional):** checkout, setup-node con cache, `npm ci`, `npx prisma generate`, `npx playwright install --with-deps chromium`, `npx playwright test`, y subir el reporte como artefacto. 3 puntos.

### E2E + bugs
- **Los tests no pasan por la interfaz:** `tests/e2e/task-stories.spec.ts` usa `{ request }` y llama a `/api/...`; eso es un test de API. Reescribir los casos con `page` y los `data-testid` que ya tiene el cliente (`task-title-input`, `task-duedate-input`, `task-duedate-value`, `tag-add-input`, `tag-add-button`, `tag-chip`, `task-assignee-select`). Dejar `setup()` como fixture que prepara datos por API y arranca el test ya en la pantalla de la tarea. Recupera hasta 12 puntos.
- **Bugs como GitHub issues:** `docs/issues/US-15-...md` y `US-16-...md` son borradores; en la pestaña Issues hay 0. Abrir un GitHub issue por bug y agregar reproducibilidad (por ejemplo "3/3 con `TZ=America/Montevideo`; con `TZ=UTC` no se reproduce") y severidad con una frase de justificación. Cargar también los bugs de la clase 5 (US-02 c5 y US-13 c1). Adjuntar el trace de Playwright (`--trace on`) como evidencia. Recupera hasta 22 puntos.

### ADR
- **Alternativas y costos:** agregar al ADR una sección "Alternativas consideradas" (Page Object, Screenplay) y otra de costos (más archivos que mantener, helpers de Supertest y de Playwright duplicados). Hasta 14 puntos.
- **Consistencia con el repo:** corregir lo que dice sobre `tasks.test.ts` y `task-status.test.ts` (ya usan los helpers) y sobre acciones "existentes" que no están en `helpers.ts`. Hasta 3 puntos.
- **Framework y Component Object:** mover `setup()` y `authenticated()` a `tests/e2e/fixtures/` como fixture de Playwright y crear al menos un componente reutilizable (por ejemplo la tarjeta de tarea) en `e2e/src/components/`. Hasta 32 puntos entre los dos.

### Postman + Supertest
- **Reportes de bug incompletos:** al docx le faltan entorno (SO, Node, comando), reproducibilidad y severidad en cada hallazgo. Hasta 15 puntos.
- **Cuerpo de las respuestas:** en los tests negativos agregar asserts sobre `res.body.error`, no solo el status. Hasta 10 puntos.

### Integration + cobertura + refactor
- **Threshold sin configurar:** agregar en `server/jest.config.js` `coverageThreshold: { global: { branches: 40, lines: 70 } }`. Hasta 12 puntos.
- **Smells sin documentar:** agregar a `docs/` una tabla "smell, dónde estaba, refactor que lo resolvió, commit", y un test de caracterización para las constantes de auth (`d7c2320`). Hasta 10 puntos.

### Pendientes de entrega
- Taller de refinamiento, Performance, Seguridad + accesibilidad, Informe de una página y Presentación.
