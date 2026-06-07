# Control de Inventario - Proyecto Minera
   
   ## Estado Actual:
   - Configurando el entorno de trabajo y Git.
   - Próximo paso: Definir las primeras vistas/rutas.

   06/06/26

   0.- al iniciar cualquier trabajo usar siempre el comando  
      git pull origin main 
   para traer lo mas actualizado del github
   
   1.- Preparar los archivos modificados:
      git add .
   (El punto al final indica que quieres agregar todos los cambios realizados en la carpeta).

   2.- Crear un punto de guardado con un mensaje descriptivo:
      git commit -m "Añadida vista de usuarios y actualizado README"
   (Cambia el texto entre comillas por una descripción breve y formal de lo que hiciste).

   3.- Subir los cambios a GitHub:
      git push origin main

## Estado Actual del Proyecto

### 1. Modelado de Base de Datos (Backend - Django)
Se reestructuraron los modelos iniciales para adaptarlos a las reglas de negocio de la operación en bodega:
* **Modelo Trabajador:** Se creó una tabla independiente para registrar al personal (RUT, Nombre, Cargo, Turno) y vincularlos a los movimientos, evitando errores de ingreso manual en cada transacción.
* **Factor de Conversión:** Se añadió el campo `factor_conversion` en el modelo `Articulo` para automatizar el cálculo y equivalencia entre kilos y unidades (ej. granel).
* **Trazabilidad de Herramientas:** Se incorporaron los campos de control de devolución en el modelo `Movimiento` para rastrear en tiempo real las herramientas de tipo retornable (vales de cargo pendientes).
* **Configuración del Entorno:** Se reinició la base de datos local (`db.sqlite3`), se aplicaron migraciones limpias y se registraron los modelos en el panel de administración. Se generó un superusuario para pruebas.

### 2. Arquitectura Frontend (React)
* Se inicializó el proyecto base utilizando Vite con la plantilla de React en el directorio `/frontend`.
* Entorno de desarrollo frontend verificado y corriendo en el puerto 5173.

---
### Próximo Paso
* Configurar CORS en el archivo `settings.py` de Django para habilitar la comunicación e intercambio de datos (JSON) entre la API (puerto 8000) y el servidor de React (puerto 5173).


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

