from rest_framework import serializers
from .models import Bodega, Categoria, Articulo, Movimiento, Trabajador

class BodegaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bodega
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ArticuloSerializer(serializers.ModelSerializer):
    class Meta:
        model = Articulo
        fields = '__all__'

class MovimientoSerializer(serializers.ModelSerializer):
    articulo_nombre = serializers.ReadOnlyField(source='articulo.nombre')
    
    class Meta:
        model = Movimiento
        fields = '__all__'

class TrabajadorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trabajador
        fields = '__all__'