import json
from pathlib import Path
from decimal import Decimal
from uuid import NAMESPACE_URL, uuid5
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.core import serializers
from inventario.models import Articulo, Bodega, Categoria, Movimiento, Trabajador


class Command(BaseCommand):
    help = 'Carga el listado confirmado de herramientas de bodega sin duplicar ni restablecer stock en reintentos.'

    def add_arguments(self, parser):
        parser.add_argument('--reemplazar', action='store_true', help='Reemplaza artículos y movimientos; conserva personal, bodegas y categorías.')
        parser.add_argument('--respaldo', help='Archivo JSON nuevo obligatorio al reemplazar; nunca se sobrescribe.')

    def handle(self, *args, **options):
        ruta = Path(__file__).resolve().parents[2] / 'data' / 'herramientas_manuales_bodega.json'
        filas = json.loads(ruta.read_text(encoding='utf-8'))
        pendientes = []
        creados = omitidos = 0
        with transaction.atomic():
            categoria = Categoria.objects.filter(nombre__iexact='herramientas manuales').first()
            bodega = Bodega.objects.order_by('id').first()
            if not categoria or not bodega:
                raise CommandError('Inicialice la categoría Herramientas Manuales y la bodega antes de cargar.')
            if options['reemplazar']:
                if not options['respaldo']:
                    raise CommandError('El reemplazo requiere --respaldo con un archivo JSON nuevo.')
                datos = [obj for modelo in (Categoria, Bodega, Trabajador, Articulo, Movimiento) for obj in modelo.objects.order_by('pk')]
                respaldo = serializers.serialize('json', datos, ensure_ascii=False, indent=2)
                try:
                    with Path(options['respaldo']).open('x', encoding='utf-8') as archivo:
                        archivo.write(respaldo)
                except OSError as error:
                    raise CommandError(f'No se pudo crear el respaldo; no se reemplazó el inventario: {error}') from error
                self.stdout.write(f'Respaldo previo: {options["respaldo"]}')
                # Operación excepcional autorizada por CLI, fuera de los flujos normales de historial.
                Movimiento.objects.all().delete()
                Articulo.objects.all().delete()
            for fila in filas:
                if fila['stock'] is None or fila.get('pendiente_identificacion'):
                    pendientes.append(fila['nombre'])
                    continue
                codigo = fila['codigo']
                existente = Articulo.objects.filter(codigo_interno=codigo).first()
                if existente:
                    if existente.nombre != fila['nombre'] or existente.categoria_id != categoria.pk or existente.bodega_id != bodega.pk:
                        raise CommandError(f'El código {codigo} pertenece a otro registro. Se revierte toda la carga.')
                    omitidos += 1
                    continue
                if Articulo.objects.filter(nombre__iexact=fila['nombre'], categoria=categoria, bodega=bodega).exists():
                    raise CommandError(f'Ya existe {fila["nombre"]} con otro código. Revise su identidad antes de cargar.')
                articulo = Articulo.objects.create(
                    nombre=fila['nombre'], codigo_interno=codigo, marca=fila.get('marca', ''),
                    categoria=categoria, bodega=bodega, tipo_control='RETORNABLE', unidad_medida='Unidades',
                    stock_actual=0, estado='OPERATIVO',
                )
                articulo.full_clean()
                cantidad = Decimal(str(fila['stock']))
                if cantidad < 0:
                    raise CommandError(f'Stock negativo en {codigo}.')
                if cantidad:
                    Movimiento.objects.create(
                        articulo=articulo, tipo_movimiento='ENTRADA', cantidad=cantidad,
                        capataz_autoriza='Carga de inventario autorizada', turno='N/A',
                        destino_uso='Listado herramientas manuales bodega del 29/09/2026',
                        clave_operacion=uuid5(NAMESPACE_URL, f'inventario-minera/herramientas-bodega/2026-09-29/{codigo}'),
                    )
                creados += 1
        self.stdout.write(f'Creados: {creados}; existentes conservados: {omitidos}; pendientes: {len(pendientes)}.')
        for nombre in pendientes:
            self.stdout.write(f'Pendiente: {nombre}')
