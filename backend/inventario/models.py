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
    
    stock_actual = models.IntegerField(default=0)
    stock_critico = models.IntegerField(default=10)
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.nombre} ({self.codigo_interno})"


class Movimiento(models.Model):
    TIPO_MOVIMIENTO_CHOICES = [
        ('ENTRADA', 'Entrada (Ingreso por camión/guía)'),
        ('SALIDA', 'Salida (Vale de Consumo)'),
        ('DEVOLUCION', 'Devolución (Retorno a bodega)'),
        ('BAJA', 'Baja (Producto dañado/merma)'),
    ]

    articulo = models.ForeignKey(Articulo, on_delete=models.CASCADE, related_name='movimientos')
    tipo_movimiento = models.CharField(max_length=20, choices=TIPO_MOVIMIENTO_CHOICES)
    cantidad = models.DecimalField(max_digits=10, decimal_places=2) # Permite decimales para KG
    
    # Campos obligatorios solicitados por la faena
    rut_personal = models.CharField(max_length=12)
    nombre_personal = models.CharField(max_length=100)
    capataz_autoriza = models.CharField(max_length=100)
    destino_uso = models.CharField(max_length=200, blank=True, null=True)
    turno = models.CharField(max_length=50)
    
    fecha_hora = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.tipo_movimiento} - {self.articulo.nombre} ({self.cantidad})"

    def save(self, *args, **kwargs):
        # Al guardar un movimiento, actualizamos el stock actual del artículo
        articulo = self.articulo
        cantidad_cambio = int(self.cantidad) # O float si manejan decimales estrictos

        if self.tipo_movimiento in ['ENTRADA', 'DEVOLUCION']:
            articulo.stock_actual += cantidad_cambio
        elif self.tipo_movimiento in ['SALIDA', 'BAJA']:
            articulo.stock_actual -= cantidad_cambio
        
        # Guardamos el cambio en el artículo
        articulo.save()
        
        # Ejecutamos el guardado normal del movimiento
        super().save(*args, **kwargs)