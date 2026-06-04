from rest_framework import serializers
from .models import Bodega, Categoria, Articulo

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
            'tipo_control', 'unidad_medida', 'stock_actual', 'stock_critico',
            'fecha_creacion'
        ]