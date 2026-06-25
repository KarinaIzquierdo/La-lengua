from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime
from .models import CustomUser, RegistroEliminacion

@api_view(['DELETE', 'PATCH'])
@permission_classes([IsAuthenticated])
def delete_user_view(request, user_id):
    """
    Eliminar o actualizar usuario por ID
    """
    user = get_object_or_404(CustomUser, id=user_id)
    
    if request.method == 'DELETE':
        try:
            # Obtener datos de la razón de eliminación
            razon = request.data.get('razon', 'otro')
            descripcion_adicional = request.data.get('descripcion_adicional', '')
            deuda_pendiente = request.data.get('deuda_pendiente', 0.00)
            plan_activo = request.data.get('plan_activo', '')
            notas = request.data.get('notas', '')
            
            # Calcular días registrado
            fecha_registro = user.created_at if hasattr(user, 'created_at') else timezone.now()
            dias_registrado = (timezone.now() - fecha_registro).days
            
            # Crear registro de eliminación ANTES de eliminar el usuario
            registro = RegistroEliminacion.objects.create(
                username=user.username,
                email=user.email,
                first_name=user.first_name or '',
                last_name=user.last_name or '',
                phone=user.phone or '',
                cedula=user.cedula or '',
                nivel=user.level or user.english_level or '',
                bloque_asignado=getattr(user, 'bloque_asignado', '') or '',
                especializacion=user.especializacion.nombre if user.especializacion else '',
                fecha_registro=fecha_registro,
                dias_registrado=dias_registrado,
                razon=razon,
                descripcion_adicional=descripcion_adicional,
                plan_activo=plan_activo,
                deuda_pendiente=deuda_pendiente,
                eliminado_por=request.user,
                notas=notas
            )
            
            # Ahora sí eliminar el usuario
            user.delete()
            
            return Response({
                'success': True,
                'message': 'Usuario eliminado exitosamente',
                'registro_id': registro.id
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error al eliminar usuario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    elif request.method == 'PATCH':
        try:
            data = request.data
            
            # Actualizar campos permitidos
            if 'first_name' in data:
                user.first_name = data['first_name']
            if 'last_name' in data:
                user.last_name = data['last_name']
            if 'correo_personal' in data:
                user.correo_personal = data['correo_personal']
            if 'english_level' in data:
                user.english_level = data['english_level']
            if 'is_active' in data:
                user.is_active = data['is_active']
            
            user.save()
            
            return Response({
                'success': True,
                'message': 'Usuario actualizado exitosamente',
                'user': {
                    'id': user.id,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'email': user.email,
                    'correo_personal': user.correo_personal,
                    'bloque_asignado': getattr(user, 'bloque_asignado', '') or '',
                    'english_level': user.english_level,
                    'is_active': user.is_active,
                }
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error al actualizar usuario: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
