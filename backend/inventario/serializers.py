from decimal import Decimal
from django.db import transaction
from rest_framework import serializers
from .models import Bodega, Categoria, Articulo, Movimiento, Trabajador
from .rut import normalizar_rut

class BodegaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Bodega
        fields = '__all__'

class CategoriaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Categoria
        fields = '__all__'

class ArticuloSerializer(serializers.ModelSerializer):
    estado = serializers.ChoiceField(choices=['OPERATIVO', 'MANTENIMIENTO', 'BAJA'], required=False)

    class Meta:
        model = Articulo
        fields = '__all__'

    def validate_factor_conversion(self, valor):
        if valor is not None and valor <= 0:
            raise serializers.ValidationError('El factor debe ser mayor que cero.')
        return valor

    def validate(self, attrs):
        if self.instance and 'tipo_control' in attrs and attrs['tipo_control'] != self.instance.tipo_control and self.instance.movimientos.exists():
            raise serializers.ValidationError({'tipo_control': 'No puede cambiar el control de un artículo con historial.'})
        return attrs

    def update(self, instance, validated_data):
        with transaction.atomic():
            instance = Articulo.objects.select_for_update().get(pk=instance.pk)
            nuevo_stock = validated_data.pop('stock_actual', instance.stock_actual)
            diferencia = nuevo_stock - instance.stock_actual
            instance = super().update(instance, validated_data)
            if diferencia:
                Movimiento.objects.create(
                    articulo=instance,
                    tipo_movimiento='ENTRADA' if diferencia > 0 else 'BAJA',
                    cantidad=abs(diferencia), capataz_autoriza='Ajuste de inventario',
                    destino_uso='Ajuste de stock físico desde inventario', turno='N/A',
                )
                instance.refresh_from_db()
            return instance

class MovimientoSerializer(serializers.ModelSerializer):
    clave_operacion = serializers.UUIDField(required=False, allow_null=True)
    articulo_nombre = serializers.ReadOnlyField(source='articulo.nombre')
    trabajador_nombre = serializers.ReadOnlyField(source='trabajador.nombre_completo')
    cantidad = serializers.DecimalField(max_digits=10, decimal_places=2, min_value=Decimal('0.01'))

    class Meta:
        model = Movimiento
        fields = '__all__'
        read_only_fields = ['fecha_devolucion', 'fecha_hora']

    def validate(self, attrs):
        if self.instance:
            for campo, valor in attrs.items():
                if campo != 'estado_prestamo' and valor != getattr(self.instance, campo):
                    raise serializers.ValidationError('Solo puede registrar la devolución de un movimiento existente.')
        elif attrs.get('tipo_movimiento') == 'DEVOLUCION':
            raise serializers.ValidationError('Devuelva la salida original desde Historial o Ficha de Cargos.')
        return attrs

class TrabajadorSerializer(serializers.ModelSerializer):
    habilitado_retiro = serializers.ReadOnlyField(source='puede_retirar')
    class Meta:
        model = Trabajador
        fields = '__all__'

    def validate_rut(self, valor):
        rut = normalizar_rut(valor)
        for trabajador in Trabajador.objects.exclude(pk=self.instance.pk if self.instance else None):
            if trabajador.rut.replace('.', '').replace(' ', '').upper() == rut:
                raise serializers.ValidationError('Ya existe un trabajador con este RUT.')
        return rut

    def validate_turno_asignado(self, valor):
        turno = valor.strip().upper().replace('TURNO ', '').replace('Í', 'I')
        if turno not in ('A', 'B', 'C', 'D', 'E', 'F', 'AE', 'AF', 'DIA', 'NOCHE'):
            raise serializers.ValidationError('Turno inválido. Use A, B, C, D, E, F, AE, AF, DIA o NOCHE; el sistema 14x14 corresponde a sistema_turno.')
        return turno

    def validate(self, attrs):
        for campo, rol in [('capataz_asignado', 'CAPATAZ'), ('supervisor_asignado', 'SUPERVISOR')]:
            jefe = attrs.get(campo)
            if jefe and (jefe.rol != rol or jefe == self.instance):
                raise serializers.ValidationError({campo: 'La jefatura debe tener el rol correspondiente y ser otra persona.'})
        return attrs
