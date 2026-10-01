import json
import uuid
from decimal import Decimal
from io import BytesIO
from unittest.mock import patch
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TransactionTestCase
from django.db import IntegrityError, transaction
from openpyxl import Workbook
from rest_framework.test import APITestCase
from .models import Bodega, Categoria, Articulo, Trabajador, Movimiento


class InventarioAPITests(APITestCase):
    def setUp(self):
        self.bodega = Bodega.objects.create(nombre='Bodega QA')
        self.categoria = Categoria.objects.create(nombre='Herramientas Manuales')
        self.trabajador = Trabajador.objects.create(rut='12345678-5', nombre_completo='Persona QA')
        self.articulo = Articulo.objects.create(nombre='Taladro QA', codigo_interno='QA-001', bodega=self.bodega, categoria=self.categoria, tipo_control='RETORNABLE', stock_actual=10)
        self.payload = dict(articulo=self.articulo.pk, trabajador=self.trabajador.pk, tipo_movimiento='SALIDA', cantidad='2.50', capataz_autoriza='Jefatura QA', turno='DIA')

    def salida(self, **cambios):
        return self.client.post('/api/movimientos/', {**self.payload, **cambios}, format='json')

    def stock(self):
        self.articulo.refresh_from_db()
        return self.articulo.stock_actual

    def test_salida_decimal_y_nombres(self):
        res = self.salida()
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(self.stock(), Decimal('7.50'))
        self.assertEqual(res.data['estado_prestamo'], 'PENDIENTE')
        self.assertEqual(res.data['trabajador_nombre'], 'Persona QA')

    def test_cantidades_invalidas_no_alteran_datos(self):
        for cantidad in ('0', '-1', '11', '0.001', 'NaN'):
            res = self.salida(cantidad=cantidad)
            self.assertEqual(res.status_code, 400, res.data)
        self.assertEqual(self.stock(), 10)
        self.assertEqual(Movimiento.objects.count(), 0)

    def test_salidas_sucesivas_no_exceden_stock(self):
        self.assertEqual(self.salida(cantidad='7').status_code, 201)
        self.assertEqual(self.salida(cantidad='7').status_code, 400)
        self.assertEqual(self.stock(), 3)
        self.assertEqual(Movimiento.objects.count(), 1)

    def test_estado_y_trabajador_inactivo(self):
        for estado in ('MANTENIMIENTO', 'BAJA'):
            self.articulo.estado = estado
            self.articulo.save()
            self.assertEqual(self.salida().status_code, 400)
        self.articulo.estado = 'OPERATIVO'
        self.articulo.save()
        self.trabajador.activo = False
        self.trabajador.save()
        self.assertEqual(self.salida().status_code, 400)
        self.assertEqual(self.stock(), 10)

    def test_rut_historico_invalido_no_habilita_retiro(self):
        self.trabajador.rut = 'TOTAL'
        self.trabajador.save()
        res = self.client.get(f'/api/trabajadores/{self.trabajador.pk}/')
        self.assertFalse(res.data['habilitado_retiro'])
        self.assertEqual(self.salida().status_code, 400)
        self.assertEqual(self.stock(), 10)

    def test_trabajador_obligatorio_en_salida(self):
        self.assertEqual(self.salida(trabajador=None).status_code, 400)

    def test_devolucion_completa_repetible_sin_duplicar_stock(self):
        mov = self.salida().data
        url = f"/api/movimientos/{mov['id']}/"
        for _ in range(2):
            res = self.client.patch(url, {'estado_prestamo': 'DEVUELTO'}, format='json')
            self.assertEqual(res.status_code, 200, res.content)
            self.assertIsNotNone(res.data['fecha_devolucion'])
            self.assertEqual(self.stock(), 10)
        self.assertEqual(self.client.patch(url, {'estado_prestamo': 'PENDIENTE'}, format='json').status_code, 400)

    def test_consumible_no_es_prestamo_y_admite_retorno_sin_uso(self):
        self.articulo.tipo_control = 'CONSUMIBLE'
        self.articulo.save()
        mov = self.salida().data
        self.assertEqual(mov['estado_prestamo'], 'N/A')
        res = self.client.patch(f"/api/movimientos/{mov['id']}/", {'estado_prestamo': 'DEVUELTO'}, format='json')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(self.stock(), 10)

    def test_movimiento_inmutable_y_no_eliminable(self):
        mov = self.salida().data
        url = f"/api/movimientos/{mov['id']}/"
        for cambios in ({'cantidad': 1}, {'tipo_movimiento': 'ENTRADA'}, {'trabajador': None}):
            self.assertEqual(self.client.patch(url, cambios, format='json').status_code, 400)
        self.assertEqual(self.client.delete(url).status_code, 405)
        self.assertEqual(self.stock(), Decimal('7.50'))

    def test_devolucion_independiente_rechazada(self):
        self.assertEqual(self.salida(tipo_movimiento='DEVOLUCION').status_code, 400)
        self.assertEqual(self.stock(), 10)

    def test_entrada_baja_y_no_devolver_entrada(self):
        entrada = self.salida(tipo_movimiento='ENTRADA', trabajador=None, cantidad='1.25')
        self.assertEqual(entrada.status_code, 201, entrada.data)
        self.assertEqual(self.stock(), Decimal('11.25'))
        self.assertEqual(self.client.patch(f"/api/movimientos/{entrada.data['id']}/", {'estado_prestamo': 'DEVUELTO'}, format='json').status_code, 400)
        self.assertEqual(self.salida(tipo_movimiento='BAJA', trabajador=None, cantidad='0.25').status_code, 201)
        self.assertEqual(self.stock(), 11)

    def test_idempotencia_y_clave_con_otro_payload(self):
        clave = str(uuid.uuid4())
        primero = self.salida(clave_operacion=clave)
        repetido = self.salida(clave_operacion=clave)
        self.assertEqual(primero.status_code, 201)
        self.assertEqual(repetido.status_code, 200)
        self.assertEqual(primero.data['id'], repetido.data['id'])
        self.assertEqual(self.stock(), Decimal('7.50'))
        self.assertEqual(self.salida(clave_operacion=clave, cantidad=3).status_code, 400)

    def test_articulo_con_historial_protegido(self):
        self.salida()
        self.assertEqual(self.client.delete(f'/api/articulos/{self.articulo.pk}/').status_code, 409)
        self.assertEqual(self.client.delete(f'/api/trabajadores/{self.trabajador.pk}/').status_code, 409)
        self.assertEqual(self.client.patch(f'/api/articulos/{self.articulo.pk}/', {'tipo_control': 'CONSUMIBLE'}, format='json').status_code, 400)

    def test_articulo_sin_historial_eliminable(self):
        self.assertEqual(self.client.delete(f'/api/articulos/{self.articulo.pk}/').status_code, 204)

    def test_ajuste_stock_auditado_y_cero(self):
        url = f'/api/articulos/{self.articulo.pk}/'
        for cantidad, esperado in [('12.25', 'ENTRADA'), ('0', 'BAJA')]:
            res = self.client.patch(url, {'stock_actual': cantidad}, format='json')
            self.assertEqual(res.status_code, 200, res.content)
            self.assertEqual(self.stock(), Decimal(cantidad))
            self.assertEqual(Movimiento.objects.latest('id').tipo_movimiento, esperado)
        self.assertEqual(self.client.patch(url, {'stock_actual': '-1'}, format='json').status_code, 400)
        self.assertEqual(self.stock(), 0)

    def test_creacion_articulo_validaciones(self):
        payload = dict(nombre='Otra herramienta', codigo_interno='QA-002', categoria=self.categoria.pk, bodega=self.bodega.pk, tipo_control='RETORNABLE', stock_actual='1.25', stock_critico=0)
        res = self.client.post('/api/articulos/', payload, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        for cambios in ({'stock_actual': -1}, {'stock_critico': -1}, {'tipo_control': 'HERRAMIENTA'}, {'estado': 'INVALIDO'}, {'factor_conversion': 0}):
            self.assertEqual(self.client.post('/api/articulos/', {**payload, 'codigo_interno': 'QA-003', **cambios}, format='json').status_code, 400)

    def test_rut_normalizado_validado_y_no_duplicado(self):
        base = {'nombre_completo': 'QA', 'rut': '12.345.678-5'}
        self.assertEqual(self.client.post('/api/trabajadores/', base, format='json').status_code, 400)
        self.assertEqual(self.client.post('/api/trabajadores/', {**base, 'rut': '11111111-1'}, format='json').status_code, 201)
        self.assertEqual(self.client.post('/api/trabajadores/', {**base, 'rut': '12345678-0'}, format='json').status_code, 400)

    def test_jerarquia_valida(self):
        url = f'/api/trabajadores/{self.trabajador.pk}/'
        self.assertEqual(self.client.patch(url, {'capataz_asignado': self.trabajador.pk}, format='json').status_code, 400)

    def test_filtro_categoria(self):
        self.assertEqual(len(self.client.get('/api/articulos/', {'categoria': self.categoria.pk}).data), 1)
        self.assertEqual(self.client.get('/api/articulos/', {'categoria': 'texto'}).status_code, 400)

    def test_inicializacion_no_duplica(self):
        primero = self.client.post('/api/inicializar/').json()
        segundo = self.client.post('/api/inicializar/').json()
        self.assertEqual(primero, segundo)
        self.assertEqual(Bodega.objects.count(), 1)
        self.assertEqual(Categoria.objects.count(), 7)

    def test_rollback_si_falla_guardado_movimiento(self):
        with patch('django.db.models.Model.save', side_effect=RuntimeError('Falla de escritura')):
            with self.assertRaises(RuntimeError):
                Movimiento.objects.create(articulo=self.articulo, trabajador=self.trabajador, tipo_movimiento='SALIDA', cantidad=1, capataz_autoriza='QA', turno='DIA')
        self.assertEqual(self.stock(), 10)

    def respaldo(self):
        return json.loads(self.client.get('/api/respaldos/exportar/').content)

    def restaurar(self, datos):
        contenido = datos if isinstance(datos, bytes) else json.dumps(datos).encode()
        return self.client.post('/api/respaldos/importar/', {'archivo': SimpleUploadedFile('backup.json', contenido)}, format='multipart')

    def test_restauracion_exacta_sin_repetir_stock(self):
        self.salida()
        datos = self.respaldo()
        self.client.patch(f'/api/articulos/{self.articulo.pk}/', {'stock_actual': 20}, format='json')
        Categoria.objects.create(nombre='Registro posterior')
        res = self.restaurar(datos)
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(self.stock(), Decimal('7.50'))
        self.assertEqual(Movimiento.objects.count(), 1)
        self.assertEqual(Categoria.objects.count(), 1)

    def test_restauracion_preserva_turnos_historicos(self):
        self.trabajador.turno_asignado = 'AE'
        self.trabajador.save()
        datos = self.respaldo()
        self.assertEqual(self.restaurar(datos).status_code, 200)
        self.trabajador.refresh_from_db()
        self.assertEqual(self.trabajador.turno_asignado, 'AE')

    def test_respaldo_invalido_rollback(self):
        for datos in (b'no-json', [], [{'model': 'auth.user', 'pk': 1, 'fields': {}}]):
            self.assertEqual(self.restaurar(datos).status_code, 400)
            self.assertEqual(self.stock(), 10)
        datos = self.respaldo()
        next(r for r in datos if r['model'] == 'inventario.articulo')['fields']['stock_actual'] = '-1'
        self.assertEqual(self.restaurar(datos).status_code, 400)
        self.assertEqual(self.stock(), 10)
        datos = self.respaldo()
        next(r for r in datos if r['model'] == 'inventario.articulo')['fields']['bodega'] = 999
        self.assertEqual(self.restaurar(datos).status_code, 400)
        self.assertEqual(self.stock(), 10)

    def planilla(self, filas, nombre='tarja.xlsx'):
        libro = Workbook()
        libro.active.title = 'Portada'
        hoja = libro.create_sheet('Personal')
        hoja.append(['Tarja QA'])
        hoja.append(['RUT', 'NOMBRE', 'CARGO', 'CICLO', 'TURNO', 'TELÉFONO', 'HABITACIÓN'])
        for fila in filas: hoja.append(fila)
        out = BytesIO(); libro.save(out); libro.close()
        return SimpleUploadedFile(nombre, out.getvalue())

    def test_importacion_excel_actualiza_sin_duplicar(self):
        filas = [['12.345.678-5', 'Persona actualizada', 'CAPATAZ', 'A', '14x14', '123', 'H-1'], ['11.111.111-1', 'Nueva persona', 'Rigger', 'B', '7x7', '456', 'H-2']]
        for _ in range(2):
            res = self.client.post('/api/importar-tarja/', {'archivo': self.planilla(filas)}, format='multipart')
            self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(Trabajador.objects.count(), 2)
        self.trabajador.refresh_from_db()
        self.assertEqual(self.trabajador.turno_asignado, 'A')
        self.assertEqual(self.trabajador.sistema_turno, '14x14')
        self.assertEqual(self.trabajador.habitacion, 'H-1')

    def test_importacion_invalida_no_parcial(self):
        filas = [['11111111-1', 'Válido', 'Rigger', 'A'], ['12345678-0', 'Inválido', 'Rigger', 'B']]
        self.assertEqual(self.client.post('/api/importar-tarja/', {'archivo': self.planilla(filas)}, format='multipart').status_code, 400)
        self.assertEqual(Trabajador.objects.count(), 1)
        self.assertEqual(self.client.post('/api/importar-tarja/', {'archivo': self.planilla(filas, 'tarja.xls')}, format='multipart').status_code, 400)

    def test_importacion_duplicados_y_turno_invalido(self):
        for filas in ([['11111111-1', 'QA', 'Rigger', 'A']]*2, [['11111111-1', 'QA', 'Rigger', 'XX']]):
            self.assertEqual(self.client.post('/api/importar-tarja/', {'archivo': self.planilla(filas)}, format='multipart').status_code, 400)
            self.assertEqual(Trabajador.objects.count(), 1)

    def test_limites_directos_base_de_datos(self):
        with self.assertRaises(IntegrityError), transaction.atomic():
            Articulo.objects.filter(pk=self.articulo.pk).update(stock_actual=-1)
        self.assertEqual(self.stock(), 10)


class CargaHerramientasTests(APITestCase):
    def setUp(self):
        InventarioAPITests.setUp(self)

    def cargar(self, **opciones):
        from django.core.management import call_command
        from io import StringIO
        call_command('cargar_herramientas_bodega', stdout=StringIO(), **opciones)

    def test_carga_repetida_no_restablece_stock(self):
        self.cargar()
        articulo = Articulo.objects.get(codigo_interno='HMB-001')
        Movimiento.objects.create(articulo=articulo, tipo_movimiento='BAJA', cantidad=1, capataz_autoriza='QA', turno='DIA')
        self.cargar()
        articulo.refresh_from_db()
        self.assertEqual(articulo.stock_actual, 21)
        self.assertEqual(Articulo.objects.count(), 57)
        self.assertEqual(Movimiento.objects.count(), 49)

    def test_reemplazo_respalda_y_conserva_personal(self):
        from tempfile import TemporaryDirectory
        from pathlib import Path
        Movimiento.objects.create(articulo=self.articulo, tipo_movimiento='ENTRADA', cantidad=2, capataz_autoriza='QA', turno='DIA')
        with TemporaryDirectory() as carpeta:
            ruta = Path(carpeta) / 'respaldo.json'
            self.cargar(reemplazar=True, respaldo=str(ruta))
            datos = json.loads(ruta.read_text(encoding='utf-8'))
        anterior = next(r for r in datos if r['model'] == 'inventario.articulo')
        self.assertEqual(Decimal(anterior['fields']['stock_actual']), 12)
        self.assertEqual(sum(r['model'] == 'inventario.movimiento' for r in datos), 1)
        self.assertFalse(Articulo.objects.filter(pk=self.articulo.pk).exists())
        self.assertEqual(Articulo.objects.count(), 56)
        self.assertEqual(sum(a.stock_actual for a in Articulo.objects.all()), 375)
        self.assertEqual(Articulo.objects.filter(stock_actual=0).count(), 8)
        self.assertEqual(Movimiento.objects.count(), 48)
        self.assertEqual(Trabajador.objects.get(pk=self.trabajador.pk).rut, '12345678-5')

    def test_reemplazo_exige_respaldo_nuevo(self):
        from django.core.management.base import CommandError
        from tempfile import TemporaryDirectory
        from pathlib import Path
        with self.assertRaises(CommandError):
            self.cargar(reemplazar=True)
        with TemporaryDirectory() as carpeta:
            ruta = Path(carpeta) / 'existente.json'
            ruta.write_text('conservar', encoding='utf-8')
            with self.assertRaises(CommandError):
                self.cargar(reemplazar=True, respaldo=str(ruta))
            self.assertEqual(ruta.read_text(encoding='utf-8'), 'conservar')
        self.assertEqual(Articulo.objects.count(), 1)

    def test_error_en_reemplazo_revierte_todo(self):
        from tempfile import TemporaryDirectory
        from pathlib import Path
        with TemporaryDirectory() as carpeta:
            with patch('inventario.models.Movimiento.save', side_effect=RuntimeError('Fallo QA')):
                with self.assertRaises(RuntimeError):
                    self.cargar(reemplazar=True, respaldo=str(Path(carpeta) / 'respaldo.json'))
        self.assertEqual(Articulo.objects.count(), 1)
        self.assertEqual(Articulo.objects.get(pk=self.articulo.pk).stock_actual, 10)
        self.assertEqual(Movimiento.objects.count(), 0)


class CargaElectricasTests(APITestCase):
    def setUp(self):
        InventarioAPITests.setUp(self)
        self.electricas = Categoria.objects.create(nombre='Herramientas Eléctricas')

    def cargar(self):
        from django.core.management import call_command
        from io import StringIO
        call_command('cargar_herramientas_electricas', stdout=StringIO())

    def test_carga_preserva_inventario_y_reintento_preserva_stock(self):
        self.cargar()
        self.assertEqual(self.electricas.articulos.count(), 31)
        self.assertEqual(sum(a.stock_actual for a in self.electricas.articulos.all()), 94)
        self.assertEqual(Articulo.objects.get(pk=self.articulo.pk).stock_actual, 10)
        articulo = Articulo.objects.get(codigo_interno='HEB-001')
        Movimiento.objects.create(articulo=articulo, tipo_movimiento='BAJA', cantidad=1, capataz_autoriza='QA', turno='DIA')
        self.cargar()
        articulo.refresh_from_db()
        self.assertEqual(articulo.stock_actual, 12)
        self.assertEqual(Articulo.objects.count(), 32)
        self.assertEqual(Movimiento.objects.count(), 32)
        self.assertEqual(Trabajador.objects.count(), 1)

    def test_conflicto_de_codigo_revierte_carga_parcial(self):
        from django.core.management.base import CommandError
        self.articulo.codigo_interno = 'HEB-002'
        self.articulo.save()
        with self.assertRaises(CommandError):
            self.cargar()
        self.assertEqual(Articulo.objects.count(), 1)
        self.assertEqual(Movimiento.objects.count(), 0)


class ConcurrenciaTests(TransactionTestCase):
    def setUp(self):
        InventarioAPITests.setUp(self)

    def solicitudes_simultaneas(self, metodo, url, payload):
        from concurrent.futures import ThreadPoolExecutor
        from threading import Barrier
        from django.db import connections
        from rest_framework.test import APIClient
        barrera = Barrier(2)
        def enviar(_):
            try:
                barrera.wait(timeout=10)
                return getattr(APIClient(), metodo)(url, payload, format='json').status_code
            finally:
                connections.close_all()
        with ThreadPoolExecutor(max_workers=2) as pool:
            return sorted(pool.map(enviar, range(2)))

    def test_dos_salidas_no_sobrevenden(self):
        resultados = self.solicitudes_simultaneas('post', '/api/movimientos/', {**self.payload, 'cantidad': '7'})
        self.assertEqual(resultados, [201, 400])
        self.articulo.refresh_from_db()
        self.assertEqual(self.articulo.stock_actual, 3)
        self.assertEqual(Movimiento.objects.count(), 1)

    def test_dos_devoluciones_suman_una_vez(self):
        from rest_framework.test import APIClient
        res = APIClient().post('/api/movimientos/', self.payload, format='json')
        resultados = self.solicitudes_simultaneas('patch', f"/api/movimientos/{res.data['id']}/", {'estado_prestamo': 'DEVUELTO'})
        self.assertEqual(resultados, [200, 200])
        self.articulo.refresh_from_db()
        self.assertEqual(self.articulo.stock_actual, 10)

    def test_dos_posts_misma_clave_un_movimiento(self):
        resultados = self.solicitudes_simultaneas('post', '/api/movimientos/', {**self.payload, 'clave_operacion': str(uuid.uuid4())})
        self.assertEqual(resultados, [200, 201])
        self.assertEqual(Movimiento.objects.count(), 1)
