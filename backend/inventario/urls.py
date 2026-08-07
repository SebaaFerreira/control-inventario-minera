from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    BodegaViewSet, 
    CategoriaViewSet, 
    ArticuloViewSet, 
    MovimientoViewSet, 
    TrabajadorViewSet,
    exportar_respaldo,
    importar_respaldo
)

router = DefaultRouter()
router.register(r'bodegas', BodegaViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'articulos', ArticuloViewSet)
router.register(r'movimientos', MovimientoViewSet)
router.register(r'trabajadores', TrabajadorViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('respaldos/exportar/', exportar_respaldo, name='exportar_respaldo'),
    path('respaldos/importar/', importar_respaldo, name='importar_respaldo'),
]