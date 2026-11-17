# Smells y refactors verificados

| Smell | Dónde estaba | Refactor que lo resolvió | Commit |
| --- | --- | --- | --- |
| Error oculto / retorno null inesperado | Serialización de comentarios | Propagar el error en lugar de devolver null | `68d715e` |
| Números mágicos | `auth.service.ts`: costo bcrypt, intentos, bloqueo y reset | Constantes con nombres de política | `d7c2320` |
| Validación duplicada | Asignación en creación y edición de tareas | Validación compartida de asignado | `8ca803d` |
| Condicionales anidados | Autorización de cambios de estado | Flujo plano con salidas tempranas | `f63886e` |
| Consultas N+1 | Listado de tareas, asignados y comentarios | Consultas por lote | `3580fdf` |

`server/tests/auth-policy.test.ts` caracteriza el comportamiento que conservó `d7c2320`: bcrypt costo 10 en registro y reset, bloqueo al quinto fallo por 15 minutos (incluido el límite de expiración), token aleatorio de 24 bytes representado por 48 caracteres hexadecimales y caducidad almacenada de una hora. No afirma que resetPassword valide la caducidad: esa validación no existe hoy. Los tests de regresión de US-02 y US-13 permanecen activos y fallan por bugs preexistentes.
