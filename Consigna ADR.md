# Consigna de ADR

## 1. que arquitectura usa hoy el framework y donde

La suite actual no aplica una arquitectura de automatizacion completa de manera formal. La mayoria de los tests realiza las solicitudes HTTP directamente dentro de cada caso mediante Supertest.

Por ejemplo, en `server/tests/tasks.test.ts` y `server/tests/task-status.test.ts` aparecen directamente los pasos para crear usuarios, enviar solicitudes, configurar el token y validar las respuestas. Igual existe una aplicacion inicial del patron App Actions en `server/tests/helpers.ts`. Este archivo define acciones reutilizables que representan operaciones de la aplicacion:
- `registerUser(...)`: registra un usuario.
- `createProject(...)`: crea un proyecto.
- `createTask(...)`: crea una tarea.
- `auth(...)`: prepara la autenticacion de una solicitud.

Estas funciones describen acciones del negocio y ocultan parte del detalle tecnico de Supertest.

## 2. Que patron conviene utilizar

Conviente utilizar el patron de App Actions porque cuando los tests representan operaciones o recorridos del usuario que pueden repetirse desde diferentes niveles, por ejemplo desde la API o desde la interfaz. La eleccion es parte de una practica que ya existe parcialmente en `server/tests/helpers.ts` y se ajusta al tipo de sistema donde una aplicacion con acciones de negocio repetidas, pruebas actuales de API y posibles pruebas futuras de interfaz se adapta al codigo.


En codigo ya existen acciones de negocio claros y reutilizables:
- Registrar o autenticar un usuario.
- Crear un proyecto.
- Agregar miembros.
- Crear y asignar una tarea.
- Cambiar el estado de una tarea.
- Agregar comentarios.

Esta arquitectura es adecuada para el proyecto por los siguientes criterios:

### Reutilizacion
Las mismas acciones se repiten en varios archivos. Centralizarlas evita duplicar solicitudes, selectores y datos de preparacion.

### Legibilidad
Un test puede expresar la intencion del escenario con acciones como `createProject`, `createTask` o `changeTaskStatus`, sin mostrar en cada paso los detalles de URL, encabezados y formato de la solicitud.

### Mantenimiento
Si cambia un endpoint, un selector o la forma de autenticacion, se actualiza la accion correspondiente en un unico lugar en vez de modificar todos los tests.

### Tamano del proyecto
El sistema tiene varios flujos relacionados, pero no una complejidad que justifique una arquitectura mas pesada. App Actions aporta estructura sin introducir demasiadas clases o abstracciones.


## 3. Proponer un cambio

Se propone adoptar App Actions como arquitectura de automatizacion.

Las acciones se organizaran por dominio:
```text
tests/
|-- actions/
|   |-- auth.actions.ts
|   |-- project.actions.ts
|   |-- task.actions.ts
|   `-- comment.actions.ts
|-- auth.test.ts
|-- projects.test.ts
|-- tasks.test.ts
`-- comments.test.ts
```

Cada archivo de acciones concentrara operaciones completas de la aplicacion. Por ejemplo, `task.actions.ts` podra exponer `createTask`, `assignTask`, `changeTaskStatus` y `addTaskComment`.
Los tests conservaran las validaciones y los datos propios de cada escenario, pero dejaran de repetir los detalles tecnicos necesarios para ejecutar una accion.

