from django.db import models

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
    rut = models.CharField(max_length=12, unique=True)
    nombre_completo = models.CharField(max_length=150)
    
    # Campos integrados de tu versión y la de Sebastián
    cargo = models.CharField(max_length=100, blank=True, null=True, help_text="Ej. M1 Carpintero, Capataz")
    turno_asignado = models.CharField(max_length=50, blank=True, null=True, help_text="Ej. 14x14 A, Día, Noche")
    activo = models.BooleanField(default=True) # Para desactivar si los desvinculan
    
    # Llaves foráneas recursivas para la cadena de mando (Agregadas por Seba)
    capataz_asignado = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='trabajadores_capataz'
    )
    supervisor_asignado = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='trabajadores_supervisor'
    )

    def __str__(self):
        return f"{self.nombre_completo} ({self.rut})"


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
    
    stock_actual = models.IntegerField(default=0)
    stock_critico = models.IntegerField(default=10)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

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

    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2) # Permite decimales para KG
    
    trabajador = models.ForeignKey(Trabajador, on_delete=models.PROTECT, related_name='movimientos')
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

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.articulo.nombre} ({self.cantidad})"

    def save(self, *args, **kwargs):
        # 1. Verificamos si es un movimiento nuevo
        es_nuevo = self.pk is None 
        
        # 2. Automatización del estado de préstamo ANTES de guardar en base de datos
        if es_nuevo:
            if self.articulo.tipo_control == 'RETORNABLE' and self.tipo_movimiento == 'SALIDA':
                self.estado_prestamo = 'PENDIENTE'
            elif self.articulo.tipo_control == 'CONSUMIBLE':
                self.estado_prestamo = 'N/A'
        
        # 3. Guardamos el movimiento en la base de datos
        super().save(*args, **kwargs)
        
        # 4. Si es nuevo, hacemos la matemática con el stock
        if es_nuevo:
            articulo = self.articulo
            # Convertimos la cantidad para hacer la matemática segura
            cantidad_cambio = int(self.cantidad) 
            
            if self.tipo_movimiento in ['ENTRADA', 'DEVOLUCION']:
                articulo.stock_actual += cantidad_cambio
            elif self.tipo_movimiento in ['SALIDA', 'BAJA']:
                articulo.stock_actual -= cantidad_cambio
            
            # Guardamos el nuevo stock en el artículo
            articulo.save()