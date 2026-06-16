from rest_framework import viewsets
from .models import Bodega, Categoria, Articulo, Movimiento, Trabajador
from .serializers import BodegaSerializer, CategoriaSerializer, ArticuloSerializer, MovimientoSerializer, TrabajadorSerializer

class BodegaViewSet(viewsets.ModelViewSet):
    queryset = Bodega.objects.all()
    serializer_class = BodegaSerializer

class CategoriaViewSet(viewsets.ModelViewSet):
    queryset = Categoria.objects.all()
    serializer_class = CategoriaSerializer

class ArticuloViewSet(viewsets.ModelViewSet):
    # 🛠️ SOLUCIÓN: Le devolvemos esta línea base para que el router no se pierda
    queryset = Articulo.objects.all()
    serializer_class = ArticuloSerializer
    
    def get_queryset(self):
        # 1. Traemos todos los artículos por defecto
        queryset = Articulo.objects.all()
        
        # 2. Capturamos lo que React nos envíe en la URL (ej: ?categoria=epp)
        categoria = self.request.query_params.get('categoria', None)
        
        # 3. Si hay una categoría en la URL, filtramos la base de datos
        if categoria is not None:
            queryset = queryset.filter(categoria__iexact=categoria)
            
        return queryset

class MovimientoViewSet(viewsets.ModelViewSet):
    # Ordenamos los movimientos para que aparezcan los más recientes primero
    queryset = Movimiento.objects.all().order_by('-id')
    serializer_class = MovimientoSerializer

    # ➖ LÓGICA 1: Cuando se CREA una salida (Descontar stock de la bodega)
    def perform_create(self, serializer):
        movimiento = serializer.save()
        
        if movimiento.tipo_movimiento == 'SALIDA':
            articulo = movimiento.articulo
            articulo.stock_actual -= movimiento.cantidad
            
            # Control de seguridad para evitar que el inventario quede en negativo
            if articulo.stock_actual < 0:
                articulo.stock_actual = 0
                
            articulo.save()

    # ➕ LÓGICA 2: Cuando se ACTUALIZA a devuelto (Restaurar stock en el pañol)
    def perform_update(self, serializer):
        movimiento_viejo = self.get_object()
        estaba_devuelto = movimiento_viejo.devuelto
        
        movimiento_nuevo = serializer.save()
        
        # Si antes no estaba marcado como devuelto y ahora el bodeguero confirmó la recepción
        if not estaba_devuelto and movimiento_nuevo.devuelto:
            articulo = movimiento_nuevo.articulo
            articulo.stock_actual += movimiento_nuevo.cantidad
            articulo.save()

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorSerializer