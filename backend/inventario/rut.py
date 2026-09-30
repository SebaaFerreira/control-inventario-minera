import re
from django.core.exceptions import ValidationError


def normalizar_rut(valor):
    rut = str(valor).strip().upper().replace('.', '').replace(' ', '')
    if not re.fullmatch(r'\d{7,8}-[0-9K]', rut):
        raise ValidationError('Ingrese un RUT con formato 12345678-5.')
    cuerpo, dv = rut.split('-')
    total = sum(int(digito) * (2 + i % 6) for i, digito in enumerate(reversed(cuerpo)))
    esperado = 11 - total % 11
    esperado = '0' if esperado == 11 else 'K' if esperado == 10 else str(esperado)
    if dv != esperado:
        raise ValidationError('El dígito verificador del RUT no es válido.')
    return rut
