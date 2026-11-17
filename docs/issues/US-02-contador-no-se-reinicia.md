# [BUG] US-02 c5: el login exitoso no reinicia los intentos fallidos

## Historia y criterio
US-02, criterio 5.

## Pasos para reproducir
1. Registrar un usuario con Password1.
2. Hacer tres intentos con Wrongpass1.
3. Iniciar sesión con Password1 (200).
4. Hacer otros tres intentos incorrectos.
5. Iniciar sesión con Password1.

## Resultado esperado
HTTP 200: el login exitoso reinicia el contador.

## Resultado obtenido
HTTP 401: Account temporarily locked.

## Reproducibilidad
3/3 ejecuciones con `TZ=America/Montevideo` y datos nuevos en cada intento, el 2026-11-17.
Otras zonas horarias: no medidas.

## Severidad
Media: bloquea usuarios legítimos por 15 minutos sin alcanzar cinco fallos consecutivos.

## Entorno
Windows, Node.js 24.14.0, npm 11.9.0, Playwright 1.64.1, Chromium 156.0.8078.4, SQLite aislada. Base: `c2563be` más esta rama.

## Evidencia
Comandos, resultados y reportes JSON en [el registro de verificación](../evidencia/README.md). Reproducciones de clase 5: `tests/e2e/bug-reproductions.spec.ts` (API); US-15 y US-16: `tests/e2e/task-stories.spec.ts` (UI).

- [Trace bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat1](../evidencia/traces/montevideo/bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat1.zip)
- [Trace bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat2](../evidencia/traces/montevideo/bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat2.zip)
- [Trace bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts](../evidencia/traces/montevideo/bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts.zip)

## Causa observada
`auth.service.ts` solo limpia lockedUntil y conserva failedAttempts.

## Ticket publicado
[GitHub issue #3](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/3)
