# Prueba de rendimiento de TaskFlow

## Resultado (17 de noviembre de 2026)

Se midió `GET /api/projects/:id/tasks?limit=20&offset=0` con k6, contra una API local y una base SQLite exclusiva para esta prueba. Cada iteración hace una solicitud, sin pausa. El login y la búsqueda del proyecto se hacen una sola vez en `setup`.

| Medida | Datos chicos: 12 tareas, 5 comentarios | Datos grandes: 5.000 tareas, 20.000 comentarios |
| --- | ---: | ---: |
| Carga | 1 usuario, 30 s | 20 usuarios, 1 min |
| Tiempo p95 del listado | 0,799 ms | 421,09 ms |
| Errores HTTP del listado | 0 % | 0 % |
| Iteraciones por segundo | 1.607,93 | 61,01 |
| Comprobaciones | 100 % | 100 % |

El p95 grande cumplió el límite de 500 ms de los requerimientos no funcionales en esta ejecución. Sin embargo, el endpoint devolvió las 5.000 tareas pese a solicitar `limit=20`: incumple el criterio independiente de paginación. El detalle está en [el reporte del hallazgo](../docs/issues/performance-listado-sin-paginacion.md).

**Hipótesis:** al crecer los datos aumenta el trabajo de lectura, conteo de comentarios, serialización y transferencia, porque se procesan y devuelven todas las tareas. El código consulta todas las filas antes de responder. La comparación cambia tanto el volumen como los usuarios simultáneos, tal como pide la clase, por lo que no permite atribuir el incremento exclusivamente al volumen. Hacen falta pruebas con igual concurrencia para aislar esa causa.

Entorno: macOS 26.6.2, Apple M4, Node.js 26.12.0, k6 2.4.0, API y SQLite locales. Los resultados completos están en [small-summary.json](./small-summary.json) y [large-summary.json](./large-summary.json); los checks verifican HTTP 200 y que `items` sea una lista, no la paginación. Los umbrales del escenario son p95 < 500 ms, errores HTTP < 1 % y checks al 100 %.

## Reproducir

Requiere dependencias instaladas y k6. Desde la raíz, con macOS/Linux:

```sh
DATABASE_URL=file:./performance.db ./server/node_modules/.bin/prisma db push --schema server/prisma/schema.prisma --skip-generate
cd server
DATABASE_URL=file:./performance.db ./node_modules/.bin/ts-node --transpile-only prisma/performance-seed.ts
DATABASE_URL=file:./performance.db PORT=3105 ./node_modules/.bin/ts-node --transpile-only src/index.ts
```

En otra terminal, desde la raíz:

```sh
k6 run --summary-export performance/small-summary.json -e BASE_URL=http://127.0.0.1:3105 -e VUS=1 -e DURATION=30s performance/scenarios/api-load.k6.js
cd server
DATABASE_URL=file:./performance.db ./node_modules/.bin/ts-node --transpile-only prisma/performance-seed.ts --large
cd ..
k6 run --summary-export performance/large-summary.json -e BASE_URL=http://127.0.0.1:3105 -e VUS=20 -e DURATION=1m performance/scenarios/api-load.k6.js
```

La seed borra y recrea los datos **solo** si `DATABASE_URL` es `file:./performance.db`; no usar simultáneamente con otras pruebas sobre esa base. La API debe seguir ejecutándose entre ambas mediciones. El proyecto de prueba se identifica por la consulta de proyectos tras iniciar sesión, sin asumir un ID fijo.
