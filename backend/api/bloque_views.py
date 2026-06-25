from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Bloque, CustomUser
from .serializers import BloqueSerializer
from django.shortcuts import get_object_or_404


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bloques_list_view(request):
    """
    GET /api/bloques/
    Obtener todos los bloques
    """
    bloques = Bloque.objects.all()
    serializer = BloqueSerializer(bloques, many=True)
    return Response({
        'success': True,
        'total': bloques.count(),
        'bloques': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bloque_create_view(request):
    """
    POST /api/bloques/
    Crear un nuevo bloque
    Body: { "nombre": "Mañana", "nivel": "A1", "grupo_color": "#FFC107", ... }
    """
    # Verificar que el usuario sea admin
    if request.user.role != 'admin':
        return Response({
            'success': False,
            'message': 'No tienes permisos para crear bloques'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = BloqueSerializer(data=request.data)
    if serializer.is_valid():
        bloque = serializer.save()
        return Response({
            'success': True,
            'message': 'Bloque creado exitosamente',
            'bloque': serializer.data
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'message': 'Error al crear bloque',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bloque_detail_view(request, pk):
    """
    GET /api/bloques/{id}/
    Obtener detalle de un bloque específico
    """
    bloque = get_object_or_404(Bloque, pk=pk)
    serializer = BloqueSerializer(bloque)
    return Response({
        'success': True,
        'bloque': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def bloque_update_view(request, pk):
    """
    PUT/PATCH /api/bloques/{id}/
    Actualizar un bloque existente
    """
    # Verificar que el usuario sea admin
    if request.user.role != 'admin':
        return Response({
            'success': False,
            'message': 'No tienes permisos para actualizar bloques'
        }, status=status.HTTP_403_FORBIDDEN)
    
    bloque = get_object_or_404(Bloque, pk=pk)
    serializer = BloqueSerializer(bloque, data=request.data, partial=True)
    
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'message': 'Bloque actualizado exitosamente',
            'bloque': serializer.data
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Error al actualizar bloque',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def bloque_delete_view(request, pk):
    """
    DELETE /api/bloques/{id}/
    Eliminar un bloque
    """
    # Verificar que el usuario sea admin
    if request.user.role != 'admin':
        return Response({
            'success': False,
            'message': 'No tienes permisos para eliminar bloques'
        }, status=status.HTTP_403_FORBIDDEN)
    
    bloque = get_object_or_404(Bloque, pk=pk)
    
    # Verificar si hay estudiantes asignados
    estudiantes_count = CustomUser.objects.filter(bloque_asignado=str(bloque)).count()
    if estudiantes_count > 0:
        return Response({
            'success': False,
            'message': f'No se puede eliminar. Hay {estudiantes_count} estudiante(s) asignado(s) a este bloque.'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    bloque.delete()
    return Response({
        'success': True,
        'message': 'Bloque eliminado exitosamente'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bloque_estudiantes_view(request, pk):
    """
    GET /api/bloques/{id}/estudiantes/
    Obtener lista de estudiantes asignados a un bloque
    """
    bloque = get_object_or_404(Bloque, pk=pk)
    estudiantes = CustomUser.objects.filter(bloque_asignado=str(bloque))
    
    estudiantes_data = []
    for estudiante in estudiantes:
        estudiantes_data.append({
            'id': estudiante.id,
            'nombre': f"{estudiante.first_name} {estudiante.last_name}",
            'email': estudiante.email,
            'phone': estudiante.phone or '',
            'english_level': estudiante.english_level or '',
        })
    
    return Response({
        'success': True,
        'bloque': str(bloque),
        'total': len(estudiantes_data),
        'estudiantes': estudiantes_data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def bloque_toggle_view(request, pk):
    """
    POST /api/bloques/{id}/toggle/
    Activar/desactivar un bloque
    """
    # Verificar que el usuario sea admin
    if request.user.role != 'admin':
        return Response({
            'success': False,
            'message': 'No tienes permisos para modificar bloques'
        }, status=status.HTTP_403_FORBIDDEN)
    
    bloque = get_object_or_404(Bloque, pk=pk)
    bloque.activo = not bloque.activo
    bloque.save()
    
    serializer = BloqueSerializer(bloque)
    return Response({
        'success': True,
        'message': f'Bloque {"activado" if bloque.activo else "desactivado"} exitosamente',
        'bloque': serializer.data
    }, status=status.HTTP_200_OK)
