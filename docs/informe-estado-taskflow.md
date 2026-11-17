# Informe de estado de calidad — TaskFlow

**Fecha:** 17 de noviembre de 2026 · **Alcance:** aplicación web, API y pruebas disponibles en el repositorio local. · **Decisión recomendada: no liberar.**

## Estado y métricas

Las compilaciones del servidor y del cliente finalizaron correctamente. No existe un workflow de GitHub Actions en el repositorio revisado, por lo que no hay resultado de pipeline para evaluar; el comando de lint falló porque ESLint no está instalado. Las comprobaciones se ejecutaron localmente, no en CI.

| Métrica elegida | Resultado | Lectura |
| --- | --- | --- |
| Tests de integración del servidor | **16/18 pasan** | Fallan autorización para eliminar tareas y reinicio del contador de login. |
| Cobertura de código | **72,01 % líneas; 44,49 % ramas** | Las líneas quedan por debajo del 80 % indicado para el proyecto final; Jest no tiene umbrales configurados. |
| Rendimiento del listado, p95 | **421,09 ms**, 0 % errores HTTP | Cumple el límite de 500 ms en la ejecución local con 5.000 tareas, 20.000 comentarios y 20 usuarios. |

Se descartó el **número de líneas de código** como métrica: no demuestra comportamiento correcto ni ayuda a decidir si es seguro liberar. La cobertura tampoco garantiza ausencia de defectos y debe leerse junto con los tests y hallazgos.

## Defectos y riesgos

- **Crítico, CVSS preliminar 9,8:** el token de recuperación se devuelve sin autenticación; una prueba local cambió la contraseña e inició sesión con ella. **Alto, CVSS preliminar 8,1:** un usuario ajeno pudo eliminar una tarea. Las puntuaciones dependen de los supuestos de despliegue explicados en el informe de seguridad.
- El listado devuelve 5.000 tareas aunque se pidan 20. En accesibilidad, axe detectó enlaces de proyecto sin nombre accesible. Los defectos de etiquetas, fecha y contador de login figuran en los reportes o pruebas existentes.
- ZAP registró cuatro advertencias en un escaneo limitado al endpoint de salud y rutas descubiertas. Los tests de Playwright identificados como E2E usan la API, por lo que no prueban el recorrido completo de la interfaz. Pact no se ejecutó para este informe. No se verificó el estado actual de los issues remotos ni existe una matriz completa de trazabilidad en el repositorio.

**Para habilitar una liberación:** corregir y volver a probar la recuperación de cuenta y los permisos; resolver los defectos funcionales y de accesibilidad, validar las rutas y flujos pendientes, y establecer CI con cobertura y pruebas verificables. Los resultados locales no alcanzan para afirmar que la aplicación sea segura o accesible en su totalidad.

**Evidencia:** ejecución local de `npm run build`, `npm run build:client`, `npm run lint` y `npm run test:coverage` el 17/11/2026; [performance](../performance/README.md); [seguridad y accesibilidad](../security/README.md); [feedback del equipo](../Equipo_3_feedback.md).
