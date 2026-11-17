# ADR: App Actions y Component Objects para la automatización

Estado: aceptado. Fecha: 2026-11-17.

## Contexto y estado actual

Las pruebas de integración usan Supertest. `server/tests/helpers.ts` contiene exactamente `registerUser`, `auth`, `createProject` y `createTask`, además de la instancia `app`. `tasks.test.ts` y `task-status.test.ts` ya consumen helpers, aunque conservan solicitudes directas para las operaciones bajo prueba. No existen todavía acciones de login, membresía, asignación, transición o comentarios en ese archivo.

Los E2E antes ejecutaban solo solicitudes HTTP. Ahora `tests/e2e/fixtures/task.ts` prepara usuarios, proyecto, miembro y tarea por API, instala la sesión del navegador y abre el detalle. `setup` y `authenticated` viven en esa carpeta de fixtures. Los casos de historias realizan sus acciones y observaciones con `page` a través de `e2e/src/components/task-detail.ts`.

## Decisión

Mantener App Actions para la preparación por API y un Component Object `TaskDetail` para las interacciones reutilizables del editor: campos, guardado, etiquetas y recarga. Los asserts de negocio permanecen en los tests. La fixture limpia el proyecto al finalizar, incluso si el escenario falla; los usuarios tienen identificadores únicos en una base E2E aislada.

La UI impide seleccionar usuarios externos y escribir fechas arbitrarias. Estos límites se prueban en el navegador; los contratos HTTP inválidos corresponden a Supertest. Editar el título por UI conserva los demás valores, pero no prueba la semántica PATCH de campos omitidos porque el formulario envía todos los campos.

## Alternativas consideradas

| Alternativa | Beneficio | Motivo de la elección |
| --- | --- | --- |
| Page Object completo | Centraliza cada pantalla y navegación | Viable al crecer; hoy un componente del editor evita una clase de página demasiado amplia. |
| Screenplay | Actores, tareas y capacidades reutilizables | Más abstracciones y formación de equipo para un sistema pequeño; no se justifica todavía. |
| Solicitudes y selectores dentro de cada test | Arranque rápido | Duplica detalles técnicos y dificulta cambios de endpoints o selectores. |

## Costos y consecuencias

Hay más archivos que mantener y revisar: fixtures y componentes separados. Supertest y Playwright requieren helpers distintos porque sus contextos HTTP y ciclos de vida no son intercambiables; existe duplicación de preparación que debe mantenerse coherente. El Component Object depende de `data-testid`; cambios de UI requieren actualizarlo. Se conserva una sola capa pequeña, sin implementar acciones que ningún caso usa.

## Verificación

`npm test`, `npm run test:coverage` y `npx playwright test --trace on`. Los jobs independientes de CI permiten ver fallos de producto sin ocultar compilación, lint o cobertura. Las expectativas de bugs conocidos no se deshabilitan.
