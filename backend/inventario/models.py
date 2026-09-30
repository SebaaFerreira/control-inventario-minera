from decimal import Decimal
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator
from django.db import models, transaction
from django.db.models import F
from django.utils import timezone
from .rut import normalizar_rut

class Bodega(models.Model):
    nombre = models.CharField(max_length=100)
    ubicacion = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return self.nombre


class Categoria(models.Model):
    nombre = models.CharField(max_length=100)

    def __str__(self):
        return self.nombre


class Trabajador(models.Model):
    ROLES_CHOICES = [
        ('OPERARIO', 'Operario / Pañolero'),
        ('CAPATAZ', 'Capataz'),
        ('SUPERVISOR', 'Supervisor'),
    ]

    TURNO_CHOICES = [
        ('A', 'Turno A'),
        ('B', 'Turno B'),
        ('E', 'Turno E'),
        ('DIA', 'Turno Día'),
        ('NOCHE', 'Turno Noche'),
    ]

    rut = models.CharField(max_length=12, unique=True)
    nombre_completo = models.CharField(max_length=150)

    # Clasificación profesional
    rol = models.CharField(max_length=20, choices=ROLES_CHOICES, default='OPERARIO')
    especialidad = models.CharField(max_length=100, blank=True, null=True)
    # Se conservan códigos históricos; la API valida los nuevos ingresos.
    turno_asignado = models.CharField(max_length=20, default='DIA')

    # Jerarquía
    capataz_asignado = models.ForeignKey(
        'self', on_delete=models.SET_NULL, blank=True, null=True,
        limit_choices_to={'rol': 'CAPATAZ'}, related_name='operarios_a_cargo'
    )
    supervisor_asignado = models.ForeignKey(
        'self', on_delete=models.SET_NULL, blank=True, null=True,
        limit_choices_to={'rol': 'SUPERVISOR'}, related_name='capataces_a_cargo'
    )

    activo = models.BooleanField(default=True)

    # =======================================================
    # 🆕 NUEVOS CAMPOS (IMPORTACIÓN DE TARJA EXCEL)
    # =======================================================
    estado_asistencia = models.CharField(max_length=50, blank=True, null=True, default='TURNO')
    sistema_turno = models.CharField(max_length=50, blank=True, null=True) # Ej: 14x14
    telefono = models.CharField(max_length=50, blank=True, null=True)
    test_esfuerzo = models.CharField(max_length=50, blank=True, null=True)
    habitacion = models.CharField(max_length=100, blank=True, null=True)

    @property
    def puede_retirar(self):
        if not self.activo:
            return False
        try:
            normalizar_rut(self.rut)
            return True
        except ValidationError:
            return False

    def __str__(self):
        return f"{self.nombre_completo} ({self.rut}) - {self.get_rol_display()}"


class Articulo(models.Model):
    TIPO_CONTROL_CHOICES = [
        ('RETORNABLE', 'Retornable (Se devuelve)'),
        ('CONSUMIBLE', 'Consumible (No se devuelve)'),
    ]



    nombre = models.CharField(max_length=150)
    marca = models.CharField(max_length=100, blank=True, null=True)
    codigo_producto = models.CharField(max_length=100, blank=True, null=True)
    codigo_interno = models.CharField(max_length=100, unique=True)

    # Relaciones flexibles con las otras tablas
    categoria = models.ForeignKey(Categoria, on_delete=models.PROTECT, related_name='articulos')
    bodega = models.ForeignKey(Bodega, on_delete=models.PROTECT, related_name='articulos')

    tipo_control = models.CharField(max_length=20, choices=TIPO_CONTROL_CHOICES, default='CONSUMIBLE')
    unidad_medida = models.CharField(max_length=50, default='Unidades')
    # Cuántos kilos/litros representa 1 unidad. Ej: 1 tornillo = 0.005 kg. Si no aplica, dejar nulo.
    factor_conversion = models.DecimalField(max_digits=10, decimal_places=4, blank=True, null=True)

    stock_actual = models.DecimalField(max_digits=12, decimal_places=2, default=0, validators=[MinValueValidator(0)])
    stock_critico = models.DecimalField(max_digits=12, decimal_places=2, default=10, validators=[MinValueValidator(0)])

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    estado = models.CharField(max_length=20, default='OPERATIVO')

    class Meta:
        constraints = [
            models.CheckConstraint(condition=models.Q(stock_actual__gte=0), name='stock_no_negativo'),
            models.CheckConstraint(condition=models.Q(stock_critico__gte=0), name='critico_no_negativo'),
        ]

    def __str__(self):
        return f"{self.nombre} ({self.get_tipo_control_display()})"


class Movimiento(models.Model):
    TIPO_MOVIMIENTO_CHOICES = [
        ('ENTRADA', 'Entrada (Ingreso por camión/guía)'),
        ('SALIDA', 'Salida (Vale de Consumo)'),
        ('DEVOLUCION', 'Devolución (Retorno a bodega)'),
        ('BAJA', 'Baja (Producto dañado/merma)'),
    ]

    ESTADO_PRESTAMO_CHOICES = [
        ('PENDIENTE', 'Pendiente de Devolución'),
        ('DEVUELTO', 'Devuelto'),
        ('N/A', 'No Aplica (Consumible)'),
    ]

    articulo = models.ForeignKey(Articulo, on_delete=models.PROTECT, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2) # Permite decimales para KG

    trabajador = models.ForeignKey(Trabajador, on_delete=models.PROTECT, related_name='movimientos', blank=True, null=True)
    capataz_autoriza = models.CharField(max_length=100)
    destino_uso = models.CharField(max_length=200, blank=True, null=True)
    turno = models.CharField(max_length=50)

    fecha_hora = models.DateTimeField(auto_now_add=True)

    # Reemplazamos el booleano devuelto por el estado_prestamo para mayor precisión
    estado_prestamo = models.CharField(
        max_length=15,
        choices=ESTADO_PRESTAMO_CHOICES,
        default='N/A',
        help_text="Controla el estado de las herramientas entregadas en terreno."
    )
    fecha_devolucion = models.DateTimeField(blank=True, null=True)
    clave_operacion = models.UUIDField(null=True, blank=True, unique=True, editable=False)

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.articulo.nombre} ({self.cantidad})"

    class Meta:
        constraints = [models.CheckConstraint(condition=models.Q(cantidad__gt=0), name='cantidad_positiva')]

    def clean(self):
        super().clean()
        if not self.articulo_id or self.cantidad is None:
            return
        try:
            cantidad = Decimal(str(self.cantidad))
        except Exception:
            return  # clean_fields informa el error del campo.
        if not cantidad.is_finite():
            return
        if self._state.adding:
            if self.tipo_movimiento == 'DEVOLUCION':
                raise ValidationError('Registre la devolución sobre la salida original.')
            if self.tipo_movimiento in ('SALIDA', 'BAJA') and cantidad > self.articulo.stock_actual:
                raise ValidationError({'cantidad': 'Stock insuficiente.'})
            if self.tipo_movimiento == 'SALIDA':
                if self.articulo.estado != 'OPERATIVO':
                    raise ValidationError({'articulo': 'El artículo no está operativo.'})
                if not self.trabajador_id or not self.trabajador.puede_retirar:
                    raise ValidationError({'trabajador': 'Seleccione un trabajador activo con RUT válido.'})
        else:
            anterior = Movimiento.objects.get(pk=self.pk)
            if self.estado_prestamo != anterior.estado_prestamo and (anterior.tipo_movimiento != 'SALIDA' or anterior.estado_prestamo == 'DEVUELTO' or self.estado_prestamo != 'DEVUELTO'):
                raise ValidationError({'estado_prestamo': 'Solo se permite devolver una salida una vez.'})

    def save(self, *args, **kwargs):
        # Un movimiento y su efecto sobre el stock constituyen una sola operación.
        with transaction.atomic():
            articulo = Articulo.objects.select_for_update().get(pk=self.articulo_id)
            self.articulo = articulo
            if self.trabajador_id:
                self.trabajador = Trabajador.objects.select_for_update().get(pk=self.trabajador_id)
            if self._state.adding:
                self.cantidad = Decimal(str(self.cantidad))
                if not self.cantidad.is_finite() or self.cantidad <= 0:
                    raise ValidationError({'cantidad': 'La cantidad debe ser mayor que cero.'})
                if self.cantidad != self.cantidad.quantize(Decimal('0.01')):
                    raise ValidationError({'cantidad': 'Se permiten hasta dos decimales.'})
                if self.tipo_movimiento not in ('ENTRADA', 'SALIDA', 'BAJA'):
                    raise ValidationError({'tipo_movimiento': 'Registre la devolución sobre la salida original.'})
                if self.tipo_movimiento == 'SALIDA':
                    if articulo.estado != 'OPERATIVO':
                        raise ValidationError({'articulo': 'El artículo no está operativo.'})
                    if not self.trabajador_id or not self.trabajador.activo:
                        raise ValidationError({'trabajador': 'Seleccione un trabajador activo.'})
                self.estado_prestamo = 'PENDIENTE' if self.tipo_movimiento == 'SALIDA' and articulo.tipo_control == 'RETORNABLE' else 'N/A'
                self.fecha_devolucion = None
                self.full_clean()
                if self.tipo_movimiento in ('SALIDA', 'BAJA'):
                    cambiado = Articulo.objects.filter(pk=articulo.pk, stock_actual__gte=self.cantidad).update(stock_actual=F('stock_actual') - self.cantidad)
                    if not cambiado:
                        raise ValidationError({'cantidad': 'Stock insuficiente para registrar el movimiento.'})
                else:
                    if articulo.stock_actual + self.cantidad > Decimal('9999999999.99'):
                        raise ValidationError({'cantidad': 'El stock supera el máximo permitido.'})
                    Articulo.objects.filter(pk=articulo.pk).update(stock_actual=F('stock_actual') + self.cantidad)
            else:
                anterior = Movimiento.objects.select_for_update().get(pk=self.pk)
                for campo in ('articulo_id', 'trabajador_id', 'tipo_movimiento', 'cantidad', 'capataz_autoriza', 'destino_uso', 'turno', 'fecha_hora'):
                    if getattr(self, campo) != getattr(anterior, campo):
                        raise ValidationError('Los movimientos registrados son inmutables; registre otro movimiento para corregirlos.')
                if self.estado_prestamo != anterior.estado_prestamo:
                    if anterior.tipo_movimiento != 'SALIDA' or anterior.estado_prestamo == 'DEVUELTO' or self.estado_prestamo != 'DEVUELTO':
                        raise ValidationError({'estado_prestamo': 'Solo se permite devolver una salida una vez.'})
                    if articulo.stock_actual + anterior.cantidad > Decimal('9999999999.99'):
                        raise ValidationError({'cantidad': 'El stock supera el máximo permitido.'})
                    Articulo.objects.filter(pk=articulo.pk).update(stock_actual=F('stock_actual') + anterior.cantidad)
                    self.fecha_devolucion = timezone.now()
                else:
                    self.fecha_devolucion = anterior.fecha_devolucion
                kwargs.pop('update_fields', None)
            super().save(*args, **kwargs)
            self.articulo.refresh_from_db()

    def delete(self, *args, **kwargs):
        raise ValidationError('No se pueden eliminar movimientos del historial.')
