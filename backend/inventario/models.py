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