# Control de Inventario - Proyecto Minera

MVP para pruebas locales de bodega. Backend Django 6.0.6 / Django REST Framework / SQLite; frontend React / Vite / Tailwind CSS. Esta actualización mantiene el diseño, los colores y la distribución de las pantallas.

## Actualización funcional — 29/09/2026

### Carga de herramientas de bodega — 29/09/2026

- Por solicitud del responsable, se reemplazaron los 6 artículos y 10 movimientos anteriores por el listado de **56 artículos, 375 unidades en total** de Herramientas Manuales. Se conservaron los 184 trabajadores, las bodegas, las categorías y las cuentas de administración.
- Ocho artículos tienen stock cero: las seis cantidades inicialmente vacías se confirmaron como cero, además de las llaves ajustable de 14 pulgadas y Stillson de 10 pulgadas. Se registraron 48 entradas iniciales; no se generan movimientos de cantidad cero.
- Los **56 artículos del listado son Herramientas Manuales**, según confirmación del responsable, incluido el foco solar. Todos están asignados a esa categoría, son retornables y usan la unidad `Unidades`, con códigos estables `HMB-001` a `HMB-056`. Los juegos se cuentan como juegos completos.
- Nombres normalizados: arco de sierra, cortapernos (napoleón), alicate de presión, flexómetro, crimpadora de férulas, cortatubos, llave Stillson, terrajas y marcas TOPTUL/FORCE/STANLEY/INGCO. Se conserva `nombre_original` en `backend/inventario/data/herramientas_manuales_bodega.json` para revisar cada equivalencia. `Corta Churro` se identificó por el responsable como cortacables manual; el juego de llaves punta-corona de 8 a 32 está medido en **milímetros**, también confirmado por el responsable. El nivel de 60 cm elimina la comilla accidental de la descripción original.
- Registro LEIME disponible en el menú lateral mediante su categoría y ruta existentes. Se mantienen las clases de estilo y el diseño.
- Respaldo anterior completo: `work/inventario-antes-herramientas-2026-09-29.json` (local, excluido de Git). Se puede restaurar desde Reportes y Config; reemplaza también los datos posteriores, por lo que debe descargarse otro respaldo antes de hacerlo.

La carga es atómica y puede repetirse sin duplicar artículos ni restablecer existencias que hayan cambiado:

```powershell
.\.venv\Scripts\python.exe backend/manage.py cargar_herramientas_bodega
```

El reemplazo completo es una operación excepcional por CLI que elimina artículos y sus movimientos actuales. Exige `--reemplazar --respaldo ruta-a-un-archivo-nuevo.json`; crea el respaldo antes del cambio y nunca sobrescribe uno existente. No ejecutar ese modo sobre una bodega en operación sin solicitar expresamente reemplazar sus datos. Los flujos normales de API y administración conservan la protección del historial. Las pruebas cubren reintentos, respaldo, conservación del personal y rollback de un reemplazo fallido.

### Cambios realizados

- **Inventario:** creación de consumibles y herramientas retornables corregida (`RETORNABLE`, no `HERRAMIENTA`). Los botones existentes permiten consultar, editar y eliminar artículos. Se conservan los artículos con historial; para retirarlos del uso, cambiar su estado a `BAJA`.
- **Stock:** existencias y umbral crítico admiten dos decimales. Se rechazan cantidades negativas, cero en movimientos, stock insuficiente y salidas de artículos en mantenimiento/baja. Ajustar el stock físico mediante Editar registra automáticamente una `ENTRADA` o `BAJA`, incluida la reducción a cero.
- **Movimientos:** guardado del movimiento y actualización del stock en una transacción. Se protegen frente a solicitudes simultáneas. Las salidas del frontend incluyen una clave de operación para que un reintento de la misma solicitud no duplique el descuento.
- **Devoluciones:** recepción completa desde Historial y Ficha de Cargos; fecha automática y actualización del stock una sola vez. Se admite devolver un consumible sin usar desde el historial. Solo las herramientas `PENDIENTE` cuentan como préstamos/deudas; los consumibles `N/A` no se cuentan como herramientas pendientes.
- **Trazabilidad:** movimientos inmutables y sin eliminación por API o administración. No se permite registrar una devolución independiente; se devuelve la salida original. Entradas, bajas y ajustes pueden no tener trabajador; las salidas sí requieren trabajador activo con RUT válido.
- **Resumen:** indicadores basados en `estado_prestamo`, nombres reales de trabajadores y día de operación en `America/Santiago`. Stock crítico cero respetado.
- **Conexión:** API centralizada, proxy `/api` de Vite y URL opcional en `VITE_API_URL`. Errores HTTP/conexión visibles; eliminados los datos ficticios y los guardados locales que simulaban éxito. Cargas de datos descartan respuestas de pantallas que ya fueron abandonadas.
- **Formularios:** bloqueo de envíos repetidos, filtros de trabajadores habilitados y conservación del turno importado. Código de barras funciona como ingreso de texto seguido de Enter. Botones de iconos operables también con teclado.
- **Configuración inicial:** creación idempotente de bodega/categorías desde el backend, sin duplicados por React StrictMode; asociación de categorías tolerante a acentos.
- **Personal:** RUT normalizado y validación de dígito verificador, duplicados y jefaturas. Importación `.xlsx` / `.xlsm` atómica, con encabezados acentuados, detección de hoja, números de fila en errores y sin truncar silenciosamente campos. `.xls` no está soportado: convertir a `.xlsx`.
- **Respaldos:** JSON limitado a modelos de inventario, validación de IDs/referencias y restauración completa transaccional. Un error revierte toda la operación. Se restaura el stock del respaldo sin volver a aplicar movimientos; registros posteriores que no aparecen en el respaldo se eliminan. Las cuentas Django no se incluyen ni se reemplazan.
- **Reportes:** exportación CSV compatible con Excel, con acentos, comillas escapadas y tratamiento como texto de celdas que parecen fórmulas. Se liberan las URL temporales de descarga.
- **Dependencias:** actualizaciones compatibles del lockfile mediante `npm audit fix`; auditoría final sin vulnerabilidades reportadas.
- **Pruebas:** suite de regresión de API, importaciones, respaldos, rollback y concurrencia; pruebas de exportación CSV y script de verificación para contribuyentes.

### Datos existentes y migraciones

Las migraciones `0006` y `0007` conservan artículos, trabajadores y movimientos. Agregan stock decimal, restricciones, clave de operación y conservación de códigos históricos de turno. No recalculan los stocks del historial ni inventan fechas de devoluciones anteriores.

Se verificó la migración y el ciclo exportar/restaurar sobre una copia de la base existente (6 artículos, 10 movimientos, 184 trabajadores). El respaldo previo a aplicar migraciones se guardó localmente en `work/db-before-mvp.sqlite3`; no se incluye en Git.

La base heredada contiene 7 registros con RUT inválido y algunos códigos de turno no estándar. Se conservan para revisión del responsable de personal; los RUT inválidos quedan excluidos de nuevos retiros. Los códigos válidos de nuevas importaciones son `A`, `B`, `C`, `D`, `E`, `F`, `AE`, `AF`, `DIA` y `NOCHE`; `14x14` corresponde a `sistema_turno`. Los respaldos preservan los valores históricos.

SQLite usa transacciones `IMMEDIATE` y espera de bloqueo de 20 segundos para serializar escrituras: [documentación Django](https://docs.djangoproject.com/en/6.0/ref/databases/#sqlite-notes).

## Instalar y ejecutar en Windows

Requisitos: Python 3.12 o superior y Node.js 22.12 o superior. Ejecutar desde la raíz del repositorio.

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend/requirements.txt
cd frontend
npm.cmd ci
cd ..
```

Antes de migrar otra base existente, detener Django y copiar `backend/db.sqlite3` a una ubicación de respaldo. No borrar ni reiniciar la base para aplicar estas migraciones.

Terminal 1 — backend:

```powershell
.\.venv\Scripts\python.exe backend/manage.py migrate
.\.venv\Scripts\python.exe backend/manage.py runserver 127.0.0.1:8000
```

Terminal 2 — frontend:

```powershell
cd frontend
npm.cmd run dev
```

Abrir [http://localhost:5173](http://localhost:5173). La API está en [http://127.0.0.1:8000/api/](http://127.0.0.1:8000/api/). Vite reserva el puerto 5173; si está ocupado, cerrar el proceso anterior. El frontend usa `/api` y Vite redirige a Django en 8000; ver `frontend/.env.example` para otra dirección.

La administración Django permite gestionar personal, entradas y bajas:

```powershell
.\.venv\Scripts\python.exe backend/manage.py createsuperuser
```

Acceder a [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/). Usar la cuenta existente si ya hay una. El stock de artículos existentes es de solo lectura allí: registrar entradas/bajas o usar Editar stock desde el frontend para mantener la bitácora.

## Verificar antes de contribuir

```powershell
powershell -ExecutionPolicy Bypass -File scripts/verificar.ps1
```

El script ejecuta `check`, detección de migraciones pendientes, 35 pruebas del backend (incluidas tres de concurrencia y cuatro de carga de herramientas), lint, 2 pruebas CSV, build y auditoría npm. Las pruebas usan una base separada `backend/test_inventory.sqlite3`, que el runner crea y elimina. No usar ese nombre para datos de trabajo.

Verificación efectuada: controles anteriores aprobados; recorrido en navegador de creación de personal/artículo, escaneo, salida decimal, resumen, devolución en historial y ficha, salida independiente, ajuste a cero, protección de eliminación, descarga CSV/JSON, importación de tarja y restauración. Los registros QA se crearon en `work/browser-qa.sqlite3`, separados de la base real.

### Lista de prueba manual

1. Crear un trabajador con RUT válido (para datos de prueba puede usarse `12345678-5` si no existe).
2. Abrir Herramientas Manuales y crear un artículo con código único y stock 10.
3. Registrar salida de 2,5 con trabajador/jefatura: stock esperado 7,5 y estado `PENDIENTE`; resumen muestra un préstamo.
4. Intentar retirar 100, cero o una herramienta en mantenimiento: debe rechazarse sin alterar stock.
5. Recibir desde Historial o Ficha: stock vuelve a 10, estado `DEVUELTO` y fecha registrada. Repetir la petición no suma otra vez.
6. Editar stock a 12,5 y luego a cero: bitácora muestra entrada 2,5 y baja 12,5. Intentar eliminar un artículo con historial: debe bloquearse.
7. Crear/retirar un consumible: estado `N/A`, sin deuda de herramienta; Historial permite devolver la cantidad completa sin usar.
8. Importar tarja válida y repetirla: actualiza por RUT sin duplicar. Una fila inválida debe rechazar el archivo completo.
9. Descargar CSV y JSON. En una base de pruebas, modificar registros y restaurar el JSON: deben recuperarse exactamente los registros del respaldo.

## Alcance del MVP

- Preparado para pruebas locales/controladas. El frontend todavía no tiene inicio de sesión, permisos de usuarios ni auditoría de identidad del operador; la API local no exige autenticación. El texto Admin Pañol del menú es una etiqueta existente.
- Devoluciones completas por salida; las parciales no están implementadas. Una corrección se registra mediante otro movimiento o ajuste de stock; el movimiento original se conserva.
- Las cantidades se expresan en la unidad de medida del artículo. `factor_conversion` se conserva/valida como dato; no se realiza conversión automática kg/unidades.
- Una reposición se registra con Editar stock (entrada auditada) o con una `ENTRADA` por administración/API. Cambiar estado técnico a `BAJA` bloquea el uso; para descontar existencias registrar una baja/ajuste.
- La restauración JSON reemplaza todo el inventario. Descargar un respaldo actual antes de restaurar. No usar restauraciones para combinar dos bases.
- `.gitignore` excluye entornos, nuevas bases y cachés; los archivos de base/caché que ya estaban versionados siguen rastreados. No añadir bases con datos personales a futuros commits.

## Registro histórico del proyecto

Las notas siguientes documentan etapas anteriores. Para el comportamiento vigente y las pruebas, usar las secciones de arriba.

## Flujo de Trabajo y Sincronización (Git)
**Fecha de inicio estructurado:** 06/06/26

Para mantener el orden y evitar conflictos en el código al trabajar en paralelo, el ciclo de desarrollo debe seguir estrictamente esta secuencia de comandos en la terminal:

**0. Sincronizar el entorno local (Siempre al iniciar el día):**
`git pull origin main`
*Este comando descarga las últimas actualizaciones que el otro desarrollador haya subido al repositorio de GitHub.*

**1. Preparar los archivos para el guardado:**
`git add .`
*El punto al final le indica a Git que debe rastrear todos los archivos que fueron creados o modificados en la carpeta del proyecto.*

**2. Empaquetar los cambios (Commit):**
`git commit -m "Descripción breve y formal de los cambios realizados"`
*Crea un punto de guardado en el historial. El mensaje entre comillas debe explicar claramente qué se hizo (ej. "Añadida vista de usuarios").*

**3. Subir los cambios a la nube:**
`git push origin main`
*Envía tu paquete de cambios a GitHub para que el otro desarrollador pueda descargarlos con un `git pull`.*

---
## Estado Actual del Proyecto

### 1. Modelado de Base de Datos (Backend - Django)
Se reestructuraron los modelos iniciales para adaptarlos a las reglas de negocio de la operación en bodega:
* **Modelo Trabajador:** Se creó una tabla independiente para registrar al personal (RUT, Nombre, Cargo, Turno) y vincularlos a los movimientos, evitando errores de ingreso manual en cada transacción.
* **Factor de Conversión:** Se añadió el campo `factor_conversion` en el modelo `Articulo` para automatizar el cálculo y equivalencia entre kilos y unidades (ej. granel).
* **Trazabilidad de Herramientas:** Se incorporaron los campos de control de devolución en el modelo `Movimiento` para rastrear en tiempo real las herramientas de tipo retornable (vales de cargo pendientes).
* **Configuración del Entorno:** Se reinició la base de datos local (`db.sqlite3`), se aplicaron migraciones limpias y se registraron los modelos en el panel de administración. Se generó un superusuario para pruebas.

**Comandos de aprendizaje utilizados en esta etapa:**
Al modificar la estructura de los datos, fue necesario reiniciar la base de datos local y aplicar los cambios.

`python manage.py makemigrations`
*Traduce los cambios hechos en models.py a instrucciones para la base de datos.*

`python manage.py migrate`
*Ejecuta las instrucciones y crea/modifica las tablas reales en db.sqlite3.*

`python manage.py createsuperuser`
*Crea una cuenta de administrador para acceder a la interfaz web (http://127.0.0.1:8000/admin).*

`python manage.py runserver`
*Enciende el servidor local del Backend.*

### 2. Arquitectura Frontend (React)
* Se inicializó el proyecto base utilizando Vite con la plantilla de React en el directorio `/frontend`.
* Entorno de desarrollo frontend verificado y corriendo en el puerto 5173.

---
### Próximo Paso
* Configurar CORS en el archivo `settings.py` de Django para habilitar la comunicación e intercambio de datos (JSON) entre la API (puerto 8000) y el servidor de React (puerto 5173).

**Comandos de aprendizaje utilizados en esta etapa:**

`pip install django-cors-headers`
*Descarga la librería oficial para permitir conexiones externas en Django. (Configuración: Se debió agregar `corsheaders` y su respectivo Middleware en el archivo `settings.py`, además de autorizar el puerto 5173).*


### 3. Actualización de la API REST (Django REST Framework)
Se modificó la base de la API creada inicialmente para alinearla con la nueva estructura de la base de datos y evitar errores de campos faltantes/sobrantes. Los cambios por archivo fueron los siguientes:

**En `serializers.py`:**
* Se creó el `TrabajadorSerializer`.
* **ArticuloSerializer:** Se agregó el campo `factor_conversion` a la lista de fields para exponerlo al frontend.
* **MovimientoSerializer:** * *Se eliminaron:* Los campos estáticos `rut_personal` y `nombre_personal`.
  * *Se agregaron:* La llave foránea `trabajador` y el campo de lectura `trabajador_nombre` (vinculado al modelo Trabajador).
  * *Se agregaron:* Los campos de trazabilidad de herramientas `devuelto` y `fecha_devolucion`.

**En `views.py`:**
* Se importaron los modelos y serializadores correspondientes a `Trabajador`.
* Se creó la vista `TrabajadorViewSet` heredando de `ModelViewSet`.

**En `urls.py`:**
* Se registró la nueva ruta `router.register(r'trabajadores', TrabajadorViewSet)` para exponer el endpoint en `/api/trabajadores/`.
**Comandos de aprendizaje utilizados en esta etapa:**

`npm create vite@latest frontend -- --template react`
*Genera la estructura base de React utilizando Vite (más rápido que el método tradicional).*

`cd frontend` y luego `npm install`
*Ingresa a la carpeta creada y descarga las dependencias base de Node.*

`npm install -D @tailwindcss/vite`
*Instala Tailwind CSS v4, el motor de estilos que permite maquetar sin crear archivos .css externos. (Configuración: Se agregó el plugin en `vite.config.js` y la directiva `@import "tailwindcss";` en `index.css`).*

`npm run dev`
*Enciende el servidor local de prueba del Frontend (Puerto 5173).*


### 4. Interfaz de Usuario (Frontend) y Conexión API
* **Integración Frontend-Backend:** Se estableció exitosamente la comunicación entre React (puerto 5173) y la API de Django (puerto 8000). El panel principal ya consume de manera asíncrona mediante `fetch` los datos reales de la base de datos (Listado de Artículos).
* **Motor de Estilos:** Se instaló y configuró **Tailwind CSS v4** integrando `@tailwindcss/vite`. Se optimizó el proyecto eliminando los archivos de configuración heredados de versiones anteriores para mantener un entorno limpio.
* **Maquetación del Layout:** Se diseñó la estructura base del panel administrativo siguiendo un formato corporativo estándar. La interfaz consta de un menú lateral izquierdo fijo (Sidebar) para la navegación y un contenedor principal a la derecha para el renderizado dinámico de las vistas.

**Comandos de aprendizaje utilizados en esta etapa:**

`npm install -D @tailwindcss/vite`
*Instala Tailwind CSS v4, el motor de estilos que permite maquetar sin crear archivos .css externos. (Configuración: Se agregó el plugin en `vite.config.js` y la directiva `@import "tailwindcss";` en `index.css`).*

`npm run dev`
*Enciende el servidor local de prueba del Frontend (Puerto 5173).*

### 5. Enrutamiento SPA y Envío de Datos (Peticiones POST)
* **React Router DOM:** Se implementó navegación dinámica sin recarga de página (Single Page Application). Se modularizó la interfaz separando el componente `Sidebar.jsx` de las vistas `Articulos.jsx` y `Salidas.jsx`.
* **Módulo de Salidas:** Creación del formulario de Vales de Consumo. Implementación de peticiones POST hacia la API de Django para registrar salidas de herramientas e insumos operando con llaves foráneas (Trabajador y Artículo).

**Comandos de aprendizaje utilizados en esta etapa:**
`npm install react-router-dom` (Librería estándar para gestión de rutas en React)

---

## Hoja de Ruta - Próximas Mejoras (QA Faena)
Observaciones levantadas para la optimización operativa de la aplicación:
1. **Buscadores en Formularios:** Reemplazar las listas desplegables nativas (`<select>`) por inputs con autocompletado y búsqueda por texto para el manejo eficiente de grandes nóminas de personal.
2. **Estructura Organizacional (Cadena de Mando):** Ampliar el modelo `Trabajador` para incluir Especialidad/Cargo, Turno automático y llaves foráneas recursivas que indiquen quién es el Capataz y Supervisor asignado a cada operario.
