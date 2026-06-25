from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import CustomUser
from .serializers import UserSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profesores_list(request):
    """
    Obtiene la lista de todos los profesores registrados en el sistema
    """
    try:
        # Filtrar usuarios que son profesores
        profesores = CustomUser.objects.filter(role='profesor', is_active=True)
        
        # Serializar los datos
        serializer = UserSerializer(profesores, many=True)
        
        # Formatear respuesta con datos relevantes
        profesores_data = []
        for profesor in serializer.data:
            profesores_data.append({
                'id': profesor['id'],
                'username': profesor['username'],
                'first_name': profesor['first_name'],
                'last_name': profesor['last_name'],
                'email': profesor['email'],
                'full_name': f"{profesor['first_name']} {profesor['last_name']}" if profesor['first_name'] and profesor['last_name'] else profesor['username']
            })
        
        return Response({
            'success': True,
            'profesores': profesores_data,
            'count': len(profesores_data)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener profesores: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
