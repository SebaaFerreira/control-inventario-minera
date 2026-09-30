from django.core.exceptions import ValidationError
from django.db import IntegrityError, OperationalError
from django.db.models.deletion import ProtectedError
from rest_framework.response import Response
from rest_framework.views import exception_handler


def api_exception_handler(exc, context):
    if isinstance(exc, ValidationError):
        return Response(getattr(exc, 'message_dict', {'error': exc.messages}), status=400)
    if isinstance(exc, ProtectedError):
        return Response({'error': 'Este registro tiene historial o registros asociados. No se puede eliminar.'}, status=409)
    if isinstance(exc, IntegrityError):
        return Response({'error': 'La operación viola una restricción de los datos. Actualice la pantalla y revise los valores.'}, status=409)
    if isinstance(exc, OperationalError) and 'locked' in str(exc).lower():
        return Response({'error': 'La base de datos está ocupada. Vuelva a intentar la operación.'}, status=409)
    return exception_handler(exc, context)
