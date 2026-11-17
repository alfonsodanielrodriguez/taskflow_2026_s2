# [BUG] El listado devuelve todas las tareas aunque se solicite una página

**Criterio:** requerimientos no funcionales, Rendimiento 1: todo endpoint de listado devuelve resultados paginados y ninguna colección completa sin límite. El criterio 2 fija p95 de hasta 500 ms con 5.000 tareas y 20.000 comentarios; en la medición realizada ese segundo criterio se cumplió.

**Entorno:** macOS 26.6.2, Apple M4, Node.js 26.12.0, k6 2.4.0, SQLite local. Datos: 5.000 tareas y 20.000 comentarios en un proyecto.

**Pasos:** preparar la seed grande según [el informe](../../performance/README.md), autenticarse como `performance@test.com` y solicitar `GET /api/projects/{id}/tasks?limit=20&offset=0` con el token.

**Esperado:** como máximo 20 elementos en `items`, con `total` indicando el total disponible.

**Obtenido:** `limit: 20`, `offset: 0`, `total: 5000` e `items.length: 5000`. Una ejecución observada; repetir según los pasos para verificar reproducibilidad.

**Evidencia de rendimiento:** con 20 usuarios durante un minuto, p95 421,09 ms y 0 % errores HTTP; [resumen k6](../../performance/large-summary.json). El escenario verifica estado y tipo de respuesta, no detecta por sí mismo la paginación incorrecta.

**Hipótesis:** el controlador obtiene y serializa todos los registros antes de responder, sin aplicar `limit` y `offset` a la consulta. El tamaño de la respuesta y el trabajo del servidor crecen con el proyecto. El impacto observado es una transferencia grande; no se afirma que se haya superado el umbral de 500 ms.
