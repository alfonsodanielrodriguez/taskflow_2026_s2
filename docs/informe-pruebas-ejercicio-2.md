# Informe de pruebas — Ejercicio 2

La suite `tests/e2e/task-stories.spec.ts` ejecuta 13 casos sobre la interfaz real para US-12, US-14, US-15 y US-16. La fixture prepara los datos por API y abre el detalle autenticado. Las interacciones y verificaciones usan los data-testid del cliente mediante `TaskDetail`; los casos no envían directamente las operaciones bajo prueba a la API.

Hay tres casos por historia (feliz, error y borde) y un cuarto caso para quitar la fecha. El selector de asignado excluye usuarios externos; el control nativo de fecha rechaza texto inválido. Estas comprobaciones son límites de la UI, no pruebas del rechazo de payloads HTTP manipulados. El formulario envía todos los campos al guardar; editar solo el título verifica conservación de los demás valores en UI, no omisión de campos en PATCH.

Resultado: 10 pasan y 3 fallan. US-15 crea etiquetas duplicadas al cambiar mayúsculas; US-16 desplaza un día la fecha normal y la pasada en Montevideo. Los dos bugs de clase 5 (US-02 c5 y US-13 c1) cuentan además con reproducciones API separadas y traces; no se presentan como tests de interfaz.

Los cuatro bugs se reprodujeron 3/3 veces con TZ=America/Montevideo. US-16 no se reprodujo en UTC (0/3). Entorno, comandos exactos, severidad, JSON y ZIP de cada ejecución están en [el registro de evidencia](evidencia/README.md). Los reportes completos están en [docs/issues](issues/).

Los cuatro tickets se publicaron en GitHub el 2026-11-17 con entorno, reproducibilidad, severidad y enlaces permanentes a los traces: [US-02 c5](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/3), [US-13 c1](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/4), [US-15](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/5), [US-16](https://github.com/alfonsodanielrodriguez/taskflow_2026_s2/issues/6).
