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
            'tipo_control', 'unidad_medida', 'factor_conversion',
            'stock_actual', 'stock_critico',
            'fecha_creacion', 'estado'
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
            'trabajador', 'trabajador_nombre',
            'capataz_autoriza', 'destino_uso', 'turno', 'fecha_hora',
            'estado_prestamo', 'fecha_devolucion' # <-- Se reemplazó 'devuelto' por 'estado_prestamo'
        ]

    def validate(self, data):
        tipo_movimiento = data.get('tipo_movimiento')
        cantidad = data.get('cantidad')
        articulo = data.get('articulo')

        # 1. Validaciones exclusivas para SALIDAS
        if tipo_movimiento == 'SALIDA':
            
            # A. Validar que no haya quiebre de stock negativo
            if articulo and cantidad > articulo.stock_actual:
                raise serializers.ValidationError({
                    "cantidad": f"Stock insuficiente. Solo quedan {articulo.stock_actual} unidades de {articulo.nombre}."
                })
            
            # B. Validar que el destino/uso venga sí o sí (aunque en el modelo permita nulos)
            if not data.get('destino_uso'):
                raise serializers.ValidationError({
                    "destino_uso": "El campo de destino o uso es obligatorio para registrar una salida."
                })

        # 2. Validaciones exclusivas para DEVOLUCIONES
        elif tipo_movimiento == 'DEVOLUCION':
            if articulo and articulo.tipo_control != 'RETORNABLE':
                raise serializers.ValidationError({
                    "articulo": f"El artículo {articulo.nombre} es un consumible, no requiere devolución."
                })

        return data