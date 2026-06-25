from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import NotificacionEstudiante
from .serializers import NotificacionEstudianteSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def notificaciones_estudiante_view(request):
    """
    Obtiene todas las notificaciones del estudiante autenticado
    """
    try:
        estudiante = request.user
        notificaciones = NotificacionEstudiante.objects.filter(
            estudiante=estudiante
        ).order_by('-fecha_creacion')[:20]  # Últimas 20 notificaciones
        
        serializer = NotificacionEstudianteSerializer(notificaciones, many=True)
        return Response({
            'success': True,
            'notificaciones': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_notificacion_leida_view(request, notificacion_id):
    """
    Marca una notificación como leída
    """
    try:
        notificacion = NotificacionEstudiante.objects.get(
            id=notificacion_id,
            estudiante=request.user
        )
        notificacion.leida = True
        notificacion.save()
        
        return Response({
            'success': True,
            'message': 'Notificación marcada como leída'
        }, status=status.HTTP_200_OK)
        
    except NotificacionEstudiante.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notificación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al marcar notificación: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_todas_leidas_view(request):
    """
    Marca todas las notificaciones del estudiante como leídas
    """
    try:
        NotificacionEstudiante.objects.filter(
            estudiante=request.user,
            leida=False
        ).update(leida=True)
        
        return Response({
            'success': True,
            'message': 'Todas las notificaciones marcadas como leídas'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al marcar notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def contador_no_leidas_view(request):
    """
    Obtiene el contador de notificaciones no leídas
    """
    try:
        count = NotificacionEstudiante.objects.filter(
            estudiante=request.user,
            leida=False
        ).count()
        
        return Response({
            'success': True,
            'count': count
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener contador: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
