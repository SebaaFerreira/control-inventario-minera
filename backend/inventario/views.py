from rest_framework import viewsets
from .models import Bodega, Categoria, Articulo, Movimiento
from .serializers import BodegaSerializer, CategoriaSerializer, ArticuloSerializer, MovimientoSerializer

class BodegaViewSet(viewsets.ModelViewSet):
    queryset = Bodega.objects.all()
    serializer_class = BodegaSerializer


class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer


class ArticuloViewSet(viewsets.ModelViewSet):
    queryset = Articulo.objects.all()
    serializer_class = ArticuloSerializer

class MovimientoViewSet(viewsets.ModelViewSet):
    queryset = Movimiento.objects.all()
    serializer_class = MovimientoSerializer