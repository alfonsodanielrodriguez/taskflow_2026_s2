# Auditoría de seguridad y accesibilidad

Fecha: 17 de noviembre de 2026. Entorno: macOS 26.6.2, Apple M4, Node 26.12.0, Chromium de Playwright, axe-core 4.14.1. La API y el frontend se ejecutaron localmente con una base SQLite `security-test.db` separada. Los usuarios y datos de prueba son descartables.

## Seguridad: comprobaciones de autorización y recuperación

Se ejecutó `node security/check-access.cjs` contra `http://127.0.0.1:3000/api`. El script crea sus propias cuentas y tarea; no imprime credenciales ni tokens.

| Prueba | Esperado | Observado |
| --- | --- | --- |
| Un usuario ajeno elimina una tarea | 403 y la tarea persiste | DELETE 204; al consultar como propietario se recibe 404 |
| Recuperación solicitada sin autenticación | El token no se expone en la respuesta pública | Respuesta 200 con token; se usó para cambiar la contraseña y entrar con la nueva: 200 en ambos pasos |

### SEC-01: usuario ajeno elimina tareas

Reproducción: ejecutar el script anterior; crea dos usuarios, un proyecto y una tarea del primero, y ejecuta DELETE con el segundo. La especificación US-13 criterio 1 requiere 403. En `server/src/modules/tasks/tasks.routes.ts`, DELETE no aplica el middleware de membresía.

**CVSS v3.1 preliminar: 8,1 (alta), `CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:N/I:H/A:H`.** Supone una API accesible por red, que cualquier cuenta autenticada puede identificar una tarea ajena y que la pérdida afecta gravemente la integridad y disponibilidad de los datos. El alcance real depende del despliegue y la recuperación de datos.

**Historia de remediación:** Como miembro de un proyecto, quiero que solo sus miembros puedan eliminar tareas para proteger el trabajo del equipo. Criterios: usuario ajeno recibe 403 y la tarea permanece; miembro autorizado puede eliminar; solicitud sin token recibe 401; pruebas automatizadas cubren ambos roles y comprueban la persistencia.

### SEC-02: token de recuperación expuesto

Reproducción: ejecutar el mismo script. Sin sesión, solicita recuperación para el correo de la cuenta de prueba, extrae el token de la respuesta, establece una nueva contraseña y comprueba el login. El código indica que no hay servicio de email; la demostración es local, pero la exposición sería explotable si esa respuesta se publicara sin protección.

**CVSS v3.1 preliminar: 9,8 (crítica), `CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H`.** Supone acceso de red al endpoint y conocimiento del correo de la víctima; la captura completa de la cuenta podría comprometer confidencialidad, integridad y disponibilidad. Validar esta puntuación según el despliegue real.

**Historia de remediación:** Como usuario, quiero recuperar mi cuenta sin exponer el token a terceros. Criterios: la respuesta pública no contiene el token; este se envía por un canal controlado, es de un solo uso y expira; se evita revelar si existe una cuenta; pruebas verifican esos comportamientos.

## Escaneo OWASP ZAP

Se ejecutó `zap-full-scan.py` de la imagen `ghcr.io/zaproxy/zaproxy:stable` sobre `http://host.docker.internal:3000/api/health`, con spider de un minuto. Es un escaneo activo limitado a la API local y las rutas descubiertas desde ese punto: **no incluye una sesión autenticada ni cubre todas las rutas o la interfaz**. ZAP exploró 6 URL y finalizó con 4 advertencias y código 2. [Informe HTML](results/zap.html) y [JSON](results/zap.json).

| Alerta | Riesgo asignado por ZAP | Interpretación |
| --- | --- | --- |
| CORS Misconfiguration | Medio | El servidor permite solicitudes entre orígenes. Hay que contrastar la política necesaria con el despliegue y los endpoints que exponen datos; el hallazgo por sí solo no demuestra robo de sesión. |
| Cross-Domain Misconfiguration | Medio | Relacionada con la política CORS anterior; revisar conjuntamente. |
| Divulgación de `X-Powered-By` | Bajo | La cabecera revela la tecnología utilizada. |
| Falta `X-Content-Type-Options` | Bajo | La respuesta de salud no establece `nosniff`; revisar las cabeceras de seguridad del servidor. |

Los niveles anteriores son los del escáner, no puntuaciones CVSS. Los dos problemas de CORS pueden referirse a la misma configuración y requieren validación. No se puede concluir que el sistema esté libre de otras vulnerabilidades. Reproducción, con Docker y la API local iniciados:

```sh
docker run --rm -v "$PWD/security/results:/zap/wrk:rw" ghcr.io/zaproxy/zaproxy:stable zap-full-scan.py -t http://host.docker.internal:3000/api/health -J zap.json -r zap.html -m 1
```

## Accesibilidad

Se ejecutó `npx playwright test --config playwright.accessibility.config.ts` con axe-core y reglas etiquetadas WCAG 2.0/2.1 A y AA. El [reporte Playwright](results/accessibility.json) incluye resultados completos de axe como adjuntos. Resultado: login y tablero sin violaciones automáticas detectadas; proyectos con una violación `link-name` de impacto `serious`; navegación de login con Tab y Enter aprobada. Son tres pruebas aprobadas y una fallida.

**ACC-01:** En proyectos, el enlace al proyecto está vacío y no tiene nombre accesible. Para reproducir: ingresar con `ana@test.com` / `Password1` y ejecutar la prueba de proyectos; axe identifica `.card-title`. La API devuelve `title`, mientras el cliente lee `name`, por lo que el contenido del enlace queda vacío. Un lector de pantalla no recibe un nombre útil y el enlace tampoco se muestra visualmente. Es un hallazgo de accesibilidad, por lo que no se le asigna CVSS.

**Historia de remediación:** Como usuario de teclado o lector de pantalla, quiero que cada enlace de proyecto tenga su nombre visible y accesible para identificarlo y abrirlo. Criterios: API y cliente acuerdan el campo del nombre; el nombre se muestra en cada enlace; axe no reporta `link-name`; se verifica con teclado y lector de pantalla.

Las pruebas automáticas no prueban conformidad completa con WCAG. Falta revisión manual con lector de pantalla, comprobación completa de teclado y contraste, y auditoría de las vistas restantes.

## Reproducir

Con dependencias instaladas, desde la raíz y en macOS/Linux:

```sh
DATABASE_URL=file:./security-test.db ./server/node_modules/.bin/prisma db push --schema server/prisma/schema.prisma --skip-generate
cd server
DATABASE_URL=file:./security-test.db ./node_modules/.bin/ts-node --transpile-only prisma/seed.ts
DATABASE_URL=file:./security-test.db PORT=3000 ./node_modules/.bin/ts-node --transpile-only src/index.ts
```

En otra terminal: `npm --prefix client run dev -- --host 127.0.0.1`. En una tercera: `npx playwright install chromium`, `npx playwright test --config playwright.accessibility.config.ts` y `node security/check-access.cjs`. La seed borra los datos de la base seleccionada: comprobar la variable antes de ejecutarla y usar únicamente la base aislada indicada. La prueba de proyectos debe fallar mientras exista ACC-01.
