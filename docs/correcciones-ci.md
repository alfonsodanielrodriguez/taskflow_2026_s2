# Correcciones de los fallos de CI

Fecha de verificación: 2026-11-17. Rama: `fix/taskflow-regressions`.

## Comportamiento corregido

| Issue | Corrección | Verificación |
| --- | --- | --- |
| [#3](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/3) | El login correcto reinicia failedAttempts y lockedUntil. | Regresión de login en Supertest y reproducción API de Playwright. |
| [#4](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/4) | DELETE exige membresía del proyecto. | Un externo recibe 403; la tarea permanece y el owner puede borrarla. |
| [#5](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/5) | Las etiquetas se recortan y normalizan a minúsculas; repetir devuelve 200 y conserva un enlace. | API y UI; repetición al límite de diez etiquetas; reconocimiento de una etiqueta previa con mayúsculas. |
| [#6](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/6) | La serialización usa los componentes UTC de la fecha calendario. | Fecha normal, pasada y eliminación de vencimiento en Montevideo y UTC. |

La creación y comprobación de enlaces de etiquetas se agrupan en una transacción. Esta corrección no incorpora una migración de limpieza de duplicados históricos: reconoce etiquetas previas al repetirlas y evita crear nuevos enlaces duplicados en el flujo probado.

## Resultados locales

- `npm run lint`: pasa.
- `npm run build`: pasa.
- `npm run build:client`: pasa.
- `npm run test:coverage`: 24/24 tests; 78,30 % líneas y 49,17 % ramas, sobre los mínimos configurados de 70 % y 40 %.
- `npx playwright test --trace on`: 15/15 casos; incluye 13 pruebas de interfaz y 2 reproducciones API separadas. Zona: America/Montevideo.
- `$env:TZ = 'UTC'; npx playwright test --grep 'US-16' --trace on --output=test-results/utc-fixed`: 4/4 casos.

Los reportes anteriores y sus traces conservan evidencia histórica de los defectos antes de esta corrección. Estos resultados verifican los cuatro issues indicados; no reemplazan los informes de otros hallazgos de seguridad, accesibilidad o rendimiento.
