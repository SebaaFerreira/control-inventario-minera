from django.contrib import admin
from .models import Bodega, Categoria, Articulo, Movimiento, Trabajador

# Registramos los modelos para que aparezcan en el panel de control
admin.site.register(Bodega)
admin.site.register(Categoria)
admin.site.register(Articulo)
admin.site.register(Movimiento)
admin.site.register(Trabajador)