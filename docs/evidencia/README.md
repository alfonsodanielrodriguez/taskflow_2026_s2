# Evidencia de verificación — 2026-11-17

Entorno: Windows, Node.js 24.14.0, npm 11.9.0, Playwright 1.64.1, Chromium 156.0.8078.4, SQLite aislada `server/prisma/e2e.db`. Código base `c2563be` con los cambios de esta rama. La configuración aplica TZ al servidor y timezoneId al navegador.

## Resultados

| Bug | America/Montevideo | UTC | Severidad y justificación |
| --- | --- | --- | --- |
| US-02 c5 | 3/3 reproducciones | No medido | Media: bloqueo prematuro de usuarios legítimos durante 15 minutos. |
| US-13 c1 | 3/3 reproducciones | No medido | Alta: un usuario externo puede borrar datos de otro proyecto. |
| US-15 | 3/3 reproducciones | No medido | Media: duplicación de etiquetas y filtros inconsistentes. |
| US-16 | 3/3 reproducciones | 0/3 reproducciones (3 pruebas pasan) | Media: el vencimiento visible cambia un día según la zona horaria. |

Suite de interfaz: 13 casos, 10 pasan y 3 fallan por US-15 y US-16 (fecha normal y pasada). Reproducciones API separadas: 2 casos, ambos fallan por US-02 y US-13; no se contabilizan como cobertura de interfaz.

Integración: 21 tests, 19 pasan y 2 fallan por US-02 y US-13. Cobertura: líneas 74,24 %, ramas 45,33 %; supera los mínimos de 70 % y 40 %. Lint y builds del cliente y servidor pasan. Los bugs se reportan conservando sus tests activos; no se modificó el comportamiento del producto para ocultarlos.

## Comandos (PowerShell)

```powershell
npm ci
npm --prefix server exec -- prisma generate --schema server/prisma/schema.prisma
npm run build
npm run build:client
npm run lint
npm run test:coverage
npx playwright install chromium
npx playwright test --trace on
$env:TZ = 'America/Montevideo'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/evidencia/montevideo.json'
npx playwright test --grep 'US-02|US-13|US-15 borde|US-16 feliz' --repeat-each=3 --trace on --reporter=list,json --output=test-results/montevideo
$env:TZ = 'UTC'
$env:PLAYWRIGHT_JSON_OUTPUT_NAME = 'docs/evidencia/utc.json'
npx playwright test --grep 'US-16 feliz' --repeat-each=3 --trace on --reporter=list,json --output=test-results/utc
Remove-Item Env:TZ
Remove-Item Env:PLAYWRIGHT_JSON_OUTPUT_NAME
```

En CI se instala Chromium con `--with-deps`. Los servidores se levantan automáticamente y se rechaza reutilizar uno que ya esté iniciado para evitar medir una zona horaria equivocada. `dev.db` no se modifica.

Reportes de las repeticiones: [Montevideo](montevideo.json), [UTC](utc.json). Traces guardados a continuación; abrir cualquier ZIP con `npx playwright show-trace "ruta/al/archivo.zip"`.

## Traces: montevideo

- [bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat1.zip](traces/montevideo/bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat1.zip)
- [bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat2.zip](traces/montevideo/bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts-repeat2.zip)
- [bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts.zip](traces/montevideo/bug-reproductions-US-02-c5-f4aae-ogin-resets-failed-attempts.zip)
- [bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat1.zip](traces/montevideo/bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat1.zip)
- [bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat2.zip](traces/montevideo/bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task-repeat2.zip)
- [bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task.zip](traces/montevideo/bug-reproductions-US-13-c1-f233a-tsider-cannot-delete-a-task.zip)
- [task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat1.zip](traces/montevideo/task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat1.zip)
- [task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat2.zip](traces/montevideo/task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado-repeat2.zip)
- [task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado.zip](traces/montevideo/task-stories-US-15-borde-r-a7272-ayúsculas-no-crea-duplicado.zip)
- [task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat1.zip](traces/montevideo/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat1.zip)
- [task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat2.zip](traces/montevideo/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat2.zip)
- [task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora.zip](traces/montevideo/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora.zip)

## Traces: utc

- [task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat1.zip](traces/utc/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat1.zip)
- [task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat2.zip](traces/utc/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora-repeat2.zip)
- [task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora.zip](traces/utc/task-stories-US-16-feliz-guarda-el-día-calendario-sin-hora.zip)
