from io import StringIO
from django.core.management import call_command
from django.http import HttpResponse, JsonResponse
from rest_framework.decorators import api_view
from rest_framework import viewsets
from rest_framework.exceptions import ValidationError
from .imports import restaurar_respaldo, importar_trabajadores, normalizar
from django.db import transaction
from rest_framework.response import Response
from .models import Bodega, Categoria, Articulo, Movimiento, Trabajador
from .serializers import BodegaSerializer, CategoriaSerializer, ArticuloSerializer, MovimientoSerializer, TrabajadorSerializer


@api_view(['POST'])
def inicializar_inventario(request):
    # La configuración es idempotente incluso con React StrictMode o dos clientes.
    definiciones = {
        'epp': 'Elementos de Protección Personal (EPP)',
        'fijaciones': 'Fijaciones y Sujeciones',
        'tuberias': 'Tuberías y Fitting',
        'sustancias': 'Sustancias Peligrosas (HazMat)',
        'manuales': 'Herramientas Manuales',
        'electricas': 'Herramientas Eléctricas',
        'leime': 'Registro LEIME',
    }
    with transaction.atomic():
        if not Bodega.objects.exists():
            Bodega.objects.create(nombre='Bodega Central Promet', ubicacion='Faena Principal')
        mapeo = {}
        for slug, nombre in definiciones.items():
            categoria = next((c for c in Categoria.objects.order_by('id') if normalizar(c.nombre) in (normalizar(nombre), slug.upper()) or slug.upper() in normalizar(c.nombre)), None)
            if categoria is None:
                categoria = Categoria.objects.create(nombre=nombre)
            mapeo[slug] = categoria.id
    return JsonResponse({'categorias_por_slug': mapeo})

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
            if not categoria.isdigit():
                raise ValidationError({'categoria': 'La categoría debe ser un ID numérico.'})
            queryset = queryset.filter(categoria_id=categoria)
        return queryset

class MovimientoViewSet(viewsets.ModelViewSet):
    queryset = Movimiento.objects.select_related('articulo', 'trabajador').order_by('-id')
    serializer_class = MovimientoSerializer
    http_method_names = ['get', 'post', 'put', 'patch', 'head', 'options']

    def create(self, request, *args, **kwargs):
        with transaction.atomic():
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            clave = serializer.validated_data.get('clave_operacion')
            anterior = Movimiento.objects.filter(clave_operacion=clave).first() if clave else None
            if anterior:
                for campo, valor in serializer.validated_data.items():
                    if campo not in ('estado_prestamo', 'clave_operacion') and getattr(anterior, campo) != valor:
                        raise ValidationError('Esta operación ya existe con otros datos. Actualice el formulario.')
                return Response(self.get_serializer(anterior).data, status=200)
            serializer.save()
            return Response(serializer.data, status=201)

class TrabajadorViewSet(viewsets.ModelViewSet):
    queryset = Trabajador.objects.all()
    serializer_class = TrabajadorSerializer


# =========================================================
# 📥 LÓGICA DE EXPORTACIÓN E IMPORTACIÓN (JSON)
# =========================================================
@api_view(['GET'])
def exportar_respaldo(request):
    try:
        out = StringIO()
        with transaction.atomic():
            call_command('dumpdata', 'inventario', format='json', indent=4, stdout=out)
        response = HttpResponse(out.getvalue(), content_type='application/json')
        response['Content-Disposition'] = 'attachment; filename="respaldo_bodega.json"'
        return response
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@api_view(['POST'])
def importar_respaldo(request):
    archivo = request.FILES.get('archivo')
    if not archivo:
        raise ValidationError({'error': 'No se adjuntó archivo.'})
    restaurar_respaldo(archivo)
    return JsonResponse({'mensaje': 'Base de inventario restaurada correctamente.'})


@api_view(['POST'])
def importar_excel_trabajadores(request):
    archivo = request.FILES.get('archivo')
    if not archivo:
        raise ValidationError({'error': 'No se adjuntó archivo.'})
    creados, actualizados = importar_trabajadores(archivo)
    return JsonResponse({'mensaje': f'Trabajadores Nuevos: {creados} | Trabajadores Actualizados: {actualizados}'})
