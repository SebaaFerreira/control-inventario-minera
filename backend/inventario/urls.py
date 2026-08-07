from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BodegaViewSet, 
    CategoriaViewSet, 
    ArticuloViewSet, 
    MovimientoViewSet, 
    TrabajadorViewSet,
    exportar_respaldo,
    importar_respaldo,
    importar_excel_trabajadores
)

router = DefaultRouter()
router.register(r'bodegas', BodegaViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'articulos', ArticuloViewSet)
router.register(r'movimientos', MovimientoViewSet)
router.register(r'trabajadores', TrabajadorViewSet)

urlpatterns = [
    # 🚨 RUTAS INDEPENDIENTES (Deben ir ARRIBA para que no choquen con el router)
    path('importar-tarja/', importar_excel_trabajadores, name='importar_excel_trabajadores'),
    path('respaldos/exportar/', exportar_respaldo, name='exportar_respaldo'),
    path('respaldos/importar/', importar_respaldo, name='importar_respaldo'),
    
    # El router general va al final
    path('', include(router.urls)),
]