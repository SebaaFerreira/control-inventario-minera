from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BodegaViewSet, CategoriaViewSet, ArticuloViewSet, MovimientoViewSet, TrabajadorViewSet

# El router de DRF crea automáticamente todas las rutas estándar de una API (CRUD)
router = DefaultRouter()
router.register(r'bodegas', BodegaViewSet)
router.register(r'categorias', CategoriaViewSet)
router.register(r'articulos', ArticuloViewSet)
router.register(r'movimientos', MovimientoViewSet)
router.register(r'trabajadores', TrabajadorViewSet) # <-- Se agregó la ruta de trabajadores

urlpatterns = [
    path('', include(router.urls)),
]