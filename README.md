# Control de Inventario - Proyecto Minera
   
   ## Estado Actual:
   - Configurando el entorno de trabajo y Git.
   - Próximo paso: Definir las primeras vistas/rutas.

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