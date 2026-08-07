import os
import tempfile
from io import StringIO
from django.core.management import call_command
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
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
    queryset = Articulo.objects.all()
    serializer_class = ArticuloSerializer
    
    def get_queryset(self):
        queryset = Articulo.objects.all()
        categoria = self.request.query_params.get('categoria', None)
        if categoria is not None:
            queryset = queryset.filter(categoria__iexact=categoria)
        return queryset

class MovimientoViewSet(viewsets.ModelViewSet):
    queryset = Movimiento.objects.all().order_by('-id')
    serializer_class = MovimientoSerializer

    def perform_create(self, serializer):
        movimiento = serializer.save()
        if movimiento.tipo_movimiento == 'SALIDA':
            articulo = movimiento.articulo
            articulo.stock_actual -= movimiento.cantidad
            if articulo.stock_actual < 0:
                articulo.stock_actual = 0
            articulo.save()

    def perform_update(self, serializer):
        movimiento_viejo = self.get_object()
        # FIX: Adaptado a tu nuevo modelo que usa estado_prestamo en vez del booleano devuelto
        estaba_devuelto = (movimiento_viejo.estado_prestamo == 'DEVUELTO')
        
        movimiento_nuevo = serializer.save()
        
        if not estaba_devuelto and movimiento_nuevo.estado_prestamo == 'DEVUELTO':
            articulo = movimiento_nuevo.articulo
            articulo.stock_actual += movimiento_nuevo.cantidad
            articulo.save()

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorSerializer


# =========================================================
# 📥 LÓGICA DE EXPORTACIÓN E IMPORTACIÓN (SNAPSHOTS JSON)
# =========================================================

@api_view(['GET'])
def exportar_respaldo(request):
    try:
        out = StringIO()
        # Genera un snapshot exacto de todas las tablas y IDs de 'inventario'
        call_command('dumpdata', 'inventario', format='json', indent=4, stdout=out)
        
        response = HttpResponse(out.getvalue(), content_type='application/json')
        response['Content-Disposition'] = 'attachment; filename="respaldo_bodega.json"'
        return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@api_view(['POST'])
def importar_respaldo(request):
    try:
        if 'archivo' not in request.FILES:
            return JsonResponse({'error': 'No se adjuntó ningún archivo.'}, status=400)

        archivo = request.FILES['archivo']

        # Guardamos el archivo subido en una ruta temporal de Windows/Linux
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
            for chunk in archivo.chunks():
                tmp.write(chunk)
            tmp_path = tmp.name

        # Inyectamos el JSON directamente a la base de datos, restaurando IDs exactos
        call_command('loaddata', tmp_path)

        # Limpiamos borrando el archivo temporal
        os.remove(tmp_path)

        return JsonResponse({'mensaje': 'Base de datos restaurada con éxito.'})
    except Exception as e:
        return JsonResponse({'error': f"Error al restaurar: {str(e)}"}, status=500)