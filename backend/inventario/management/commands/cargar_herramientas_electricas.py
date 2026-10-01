from .cargar_herramientas_bodega import Command as CargaBodega


class Command(CargaBodega):
    help = 'Agrega herramientas eléctricas sin reemplazar el inventario ni duplicar cargas.'
    archivo_listado = 'herramientas_electricas_bodega.json'
    nombre_categoria = 'Herramientas Eléctricas'
    fecha_listado = '2026-10-01'
    descripcion_listado = 'Listado herramientas eléctricas bodega del 01/10/2026'

    def add_arguments(self, parser):
        # Esta carga es exclusivamente aditiva: no admite reemplazo del inventario.
        pass
