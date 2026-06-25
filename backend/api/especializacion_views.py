from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .models import Especializacion
from .especializacion_serializer import EspecializacionSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def especializaciones_list_view(request):
    """
    Endpoint para listar todas las especializaciones
    """
    especializaciones = Especializacion.objects.all().order_by('nombre')
    serializer = EspecializacionSerializer(especializaciones, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def especializaciones_activas_view(request):
    """
    Endpoint para listar solo las especializaciones activas
    """
    especializaciones = Especializacion.objects.filter(activa=True).order_by('nombre')
    serializer = EspecializacionSerializer(especializaciones, many=True)
    return Response({
        'success': True,
        'data': serializer.data
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def especializaciones_create_view(request):
    """
    Endpoint para crear una nueva especialización
    """
    serializer = EspecializacionSerializer(data=request.data)
    if serializer.is_valid():
        especializacion = serializer.save()
        return Response({
            'success': True,
            'data': EspecializacionSerializer(especializacion).data,
            'message': 'Especialización creada exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def especializaciones_update_view(request, pk):
    """
    Endpoint para actualizar una especialización
    """
    try:
        especializacion = Especializacion.objects.get(pk=pk)
        serializer = EspecializacionSerializer(especializacion, data=request.data, partial=True)
        if serializer.is_valid():
            especializacion = serializer.save()
            return Response({
                'success': True,
                'data': EspecializacionSerializer(especializacion).data,
                'message': 'Especialización actualizada exitosamente'
            }, status=status.HTTP_200_OK)
        
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    except Especializacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Especialización no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def especializaciones_delete_view(request, pk):
    """
    Endpoint para eliminar una especialización
    """
    try:
        especializacion = Especializacion.objects.get(pk=pk)
        especializacion.delete()
        return Response({
            'success': True,
            'message': 'Especialización eliminada exitosamente'
        }, status=status.HTTP_200_OK)
    except Especializacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Especialización no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAuthenticated])
def especializaciones_toggle_view(request, pk):
    """
    Endpoint para activar/desactivar una especialización
    """
    try:
        especializacion = Especializacion.objects.get(pk=pk)
        especializacion.activa = not especializacion.activa
        especializacion.save()
        
        return Response({
            'success': True,
            'data': EspecializacionSerializer(especializacion).data,
            'message': f'Especialización {"activada" if especializacion.activa else "desactivada"} exitosamente'
        }, status=status.HTTP_200_OK)
    
    except Especializacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Especialización no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
