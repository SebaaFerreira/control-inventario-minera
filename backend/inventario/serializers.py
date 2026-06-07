from rest_framework import serializers
from .models import Bodega, Categoria, Articulo, Movimiento, Trabajador

class TrabajadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trabajador
        fields = '__all__'

class BodegaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bodega
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ArticuloSerializer(serializers.ModelSerializer):
    # Estas líneas permiten que al listar un artículo, veamos el nombre de la bodega y categoría, no solo su ID.
    categoria_nombre = serializers.ReadOnlyField(source='categoria.nombre')
    bodega_nombre = serializers.ReadOnlyField(source='bodega.nombre')

    class Meta:
        model = Articulo
        fields = [
            'id', 'nombre', 'marca', 'codigo_producto', 'codigo_interno',
            'categoria', 'categoria_nombre', 'bodega', 'bodega_nombre',
            'tipo_control', 'unidad_medida', 'factor_conversion', # <-- Se agregó factor_conversion
            'stock_actual', 'stock_critico',
            'fecha_creacion'
        ]

class MovimientoSerializer(serializers.ModelSerializer):
    articulo_nombre = serializers.ReadOnlyField(source='articulo.nombre')
    codigo_interno = serializers.ReadOnlyField(source='articulo.codigo_interno')
    # Extraemos el nombre del trabajador vinculado para mostrarlo en la tabla de React
    trabajador_nombre = serializers.ReadOnlyField(source='trabajador.nombre_completo')

    class Meta:
        model = Movimiento
        fields = [
            'id', 'articulo', 'articulo_nombre', 'codigo_interno',
            'tipo_movimiento', 'cantidad', 
            'trabajador', 'trabajador_nombre', # <-- Se reemplazó rut_personal y nombre_personal
            'capataz_autoriza', 'destino_uso', 'turno', 'fecha_hora',
            'devuelto', 'fecha_devolucion' # <-- Se agregaron los campos de trazabilidad
        ]