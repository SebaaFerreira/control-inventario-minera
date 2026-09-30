from django.contrib import admin
from .models import Bodega, Categoria, Articulo, Movimiento, Trabajador

# Registramos los modelos para que aparezcan en el panel de control
admin.site.register(Bodega)
admin.site.register(Categoria)
@admin.register(Articulo)
class ArticuloAdmin(admin.ModelAdmin):
    list_display = ('codigo_interno', 'nombre', 'stock_actual', 'estado')

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return ['stock_actual', 'tipo_control'] if obj.movimientos.exists() else ['stock_actual']
        return []
@admin.register(Movimiento)
class MovimientoAdmin(admin.ModelAdmin):
    list_display = ('articulo', 'tipo_movimiento', 'cantidad', 'trabajador', 'estado_prestamo', 'fecha_hora')

    def get_readonly_fields(self, request, obj=None):
        if obj:
            return [f.name for f in self.model._meta.fields if f.name != 'estado_prestamo']
        return ['estado_prestamo', 'fecha_devolucion', 'fecha_hora']

    def has_delete_permission(self, request, obj=None):
        return False
admin.site.register(Trabajador)
