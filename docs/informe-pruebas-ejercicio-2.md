# Informe de pruebas — Ejercicio 2

## Alcance

Se agregaron tres casos por historia para US-12 (editar tarea), US-14 (asignar tarea), US-15 (etiquetas) y US-16 (fecha de vencimiento): un caso feliz, uno de error y uno de borde. Cada operación HTTP se espera de forma asíncrona y se lee su respuesta antes de realizar asserts.

La especificación usada como fuente es `taskflow_especificacion_requerimientos.docx`. Los tests están en `tests/e2e/task-stories.spec.ts` y su configuración en `playwright.config.ts`. Requieren la API disponible en `http://127.0.0.1:3000/api`; `API_BASE_URL` puede cambiar el origen, por ejemplo `http://127.0.0.1:3000`.

## Hallazgo de este ejercicio

### Las etiquetas no se normalizan ni se comparan sin distinguir mayúsculas

- **Historia:** US-15, criterios 1, 2 y 3.
- **Pasos:** agregar `Bug` a una tarea y luego agregar `bug` a la misma tarea.
- **Esperado:** la etiqueta se guarda en minúsculas; la segunda operación devuelve HTTP 200 y no crea un duplicado.
- **Resultado obtenido:** al agregar `bug` después de `Bug`, la API respondió HTTP 201 y la tarea quedó con dos etiquetas.
- **Causa observada en código:** `addTag` conserva el nombre tras quitar espacios externos y busca por igualdad exacta.
- **Test:** `US-15 borde: repetir etiqueta ignorando mayúsculas no crea duplicado`.
- **Issue:** borrador registrado en `docs/issues/US-15-etiquetas-case-insensitive.md` con la plantilla del repositorio.

### US-16 — la fecha de vencimiento vuelve un día antes

- **Criterios:** US-16, criterios 1, 2 y 3.
- **Pasos:** asignar `2026-09-15` o la fecha pasada `2000-01-01`.
- **Esperado:** la API devuelve exactamente la misma fecha calendario enviada.
- **Resultado obtenido:** devolvió `2026-09-14` y `1999-12-31`, respectivamente.
- **Test:** `US-16 feliz: guarda la fecha como día calendario sin hora` y `US-16 borde: acepta fechas pasadas`.
- **Causa observada en código:** el valor se serializa como fecha local aunque la base almacena el día como timestamp UTC.
- **Issue:** borrador registrado en `docs/issues/US-16-fecha-se-desplaza-un-dia.md` con la plantilla del repositorio.

## Hallazgos acumulados del Ejercicio 1

1. **US-02 — el contador de intentos fallidos no se reinicia después de un login exitoso.** La entrega del Ejercicio 1 informa que tras tres fallos, un login correcto y tres fallos más, la cuenta queda bloqueada prematuramente. La causa indicada es que se limpia `lockedUntil` pero no `failedAttempts`.
2. **US-13 — un usuario externo puede eliminar una tarea.** La entrega informa que un usuario no miembro recibió HTTP 204 al eliminar una tarea, cuando la especificación requiere HTTP 403; la tarea fue borrada. La ruta DELETE no aplicaría el middleware de membresía.

## Ejecución

Comando ejecutado: `npx playwright test`.

Resultado de la ejecución final: **10 pasaron y 3 fallaron**. Los fallos confirmaron los defectos de US-15 y US-16 descritos arriba. Se separó el caso de borde de fecha pasada del caso que borra la fecha con `null`; la prueba de borrado pasó.

Los dos issues están registrados como archivos basados en la plantilla del repositorio en `docs/issues/`. No se crearon en GitHub porque el entorno no tiene `gh` instalado ni una sesión de GitHub configurada.
