from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .models import RegistroEliminacion


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_registros_eliminacion(request):
    """
    Obtener todos los registros de eliminación con filtros opcionales
    """
    try:
        # Verificar que el usuario sea admin
        if request.user.role not in ['admin', 'financiero']:
            return Response({
                'success': False,
                'message': 'No tienes permisos para ver esta información'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Obtener parámetros de filtro
        razon = request.GET.get('razon', None)
        search = request.GET.get('search', None)
        
        # Query base
        registros = RegistroEliminacion.objects.all()
        
        # Aplicar filtros
        if razon:
            registros = registros.filter(razon=razon)
        
        if search:
            registros = registros.filter(
                Q(first_name__icontains=search) |
                Q(last_name__icontains=search) |
                Q(email__icontains=search) |
                Q(username__icontains=search) |
                Q(cedula__icontains=search)
            )
        
        # Serializar datos
        data = []
        for registro in registros:
            data.append({
                'id': registro.id,
                'username': registro.username,
                'email': registro.email,
                'first_name': registro.first_name,
                'last_name': registro.last_name,
                'nombre_completo': f"{registro.first_name} {registro.last_name}",
                'phone': registro.phone,
                'cedula': registro.cedula,
                'nivel': registro.nivel,
                'bloque_asignado': registro.bloque_asignado,
                'especializacion': registro.especializacion,
                'fecha_registro': registro.fecha_registro.strftime('%Y-%m-%d %H:%M:%S'),
                'fecha_eliminacion': registro.fecha_eliminacion.strftime('%Y-%m-%d %H:%M:%S'),
                'dias_registrado': registro.dias_registrado,
                'tiempo_registrado_str': registro.tiempo_registrado_str,
                'razon': registro.razon,
                'razon_display': registro.get_razon_display(),
                'descripcion_adicional': registro.descripcion_adicional,
                'plan_activo': registro.plan_activo,
                'deuda_pendiente': str(registro.deuda_pendiente),
                'eliminado_por': {
                    'id': registro.eliminado_por.id if registro.eliminado_por else None,
                    'username': registro.eliminado_por.username if registro.eliminado_por else None,
                    'nombre': f"{registro.eliminado_por.first_name} {registro.eliminado_por.last_name}" if registro.eliminado_por else None
                },
                'notas': registro.notas
            })
        
        return Response({
            'success': True,
            'registros': data,
            'total': len(data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener registros: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_estadisticas_eliminacion(request):
    """
    Obtener estadísticas de eliminaciones
    """
    try:
        # Verificar que el usuario sea admin
        if request.user.role not in ['admin', 'financiero']:
            return Response({
                'success': False,
                'message': 'No tienes permisos para ver esta información'
            }, status=status.HTTP_403_FORBIDDEN)
        
        registros = RegistroEliminacion.objects.all()
        
        # Contar por razón
        razones_count = {}
        for razon, display in RegistroEliminacion.RAZON_CHOICES:
            count = registros.filter(razon=razon).count()
            razones_count[razon] = {
                'count': count,
                'display': display
            }
        
        # Calcular promedio de días registrado
        total_dias = sum([r.dias_registrado for r in registros])
        promedio_dias = total_dias / len(registros) if len(registros) > 0 else 0
        
        # Total de deuda pendiente
        total_deuda = sum([float(r.deuda_pendiente) for r in registros])
        
        return Response({
            'success': True,
            'estadisticas': {
                'total_eliminaciones': len(registros),
                'por_razon': razones_count,
                'promedio_dias_registrado': round(promedio_dias, 2),
                'total_deuda_pendiente': round(total_deuda, 2)
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener estadísticas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
