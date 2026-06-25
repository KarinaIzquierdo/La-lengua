from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from .models import Asistencia, CustomUser, Clase
from datetime import datetime

@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def asistencias_list_create(request):
    """
    GET: Lista asistencias (filtrar por estudiante o clase)
    POST: Crea o actualiza una asistencia
    """
    if request.method == 'GET':
        asistencias = Asistencia.objects.all()
        
        # Filtrar por estudiante
        estudiante_id = request.GET.get('estudiante')
        if estudiante_id:
            asistencias = asistencias.filter(estudiante_id=estudiante_id)
        
        # Filtrar por clase
        clase_id = request.GET.get('clase')
        if clase_id:
            asistencias = asistencias.filter(clase_id=clase_id)
        
        # Filtrar por fecha
        fecha = request.GET.get('fecha')
        if fecha:
            asistencias = asistencias.filter(fecha=fecha)
        
        # Serializar datos
        data = []
        for asistencia in asistencias:
            data.append({
                'id': asistencia.id,
                'estudiante_id': asistencia.estudiante.id,
                'estudiante_nombre': f"{asistencia.estudiante.first_name} {asistencia.estudiante.last_name}",
                'clase_id': asistencia.clase.id if asistencia.clase else None,
                'fecha': asistencia.fecha.isoformat(),
                'estado': asistencia.estado,
                'observaciones': asistencia.observaciones,
                'created_at': asistencia.created_at.isoformat(),
            })
        
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        try:
            estudiante_id = request.data.get('estudiante_id')
            fecha = request.data.get('fecha')
            estado_asistencia = request.data.get('estado')
            clase_id = request.data.get('clase_id')
            observaciones = request.data.get('observaciones', '')
            
            # Validar datos requeridos
            if not estudiante_id or not fecha or not estado_asistencia:
                return Response(
                    {'error': 'estudiante_id, fecha y estado son requeridos'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Obtener estudiante
            estudiante = get_object_or_404(CustomUser, id=estudiante_id, role='student')
            
            # Obtener clase si se proporciona
            clase = None
            if clase_id:
                clase = get_object_or_404(Clase, id=clase_id)
            
            # Convertir fecha si es string
            if isinstance(fecha, str):
                fecha = datetime.strptime(fecha, '%Y-%m-%d').date()
            
            # Crear o actualizar asistencia
            asistencia, created = Asistencia.objects.update_or_create(
                estudiante=estudiante,
                fecha=fecha,
                defaults={
                    'estado': estado_asistencia,
                    'clase': clase,
                    'observaciones': observaciones
                }
            )
            
            return Response({
                'id': asistencia.id,
                'estudiante_id': asistencia.estudiante.id,
                'fecha': asistencia.fecha.isoformat(),
                'estado': asistencia.estado,
                'created': created,
                'message': 'Asistencia registrada correctamente'
            }, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def asistencia_detail(request, pk):
    """
    GET: Obtiene una asistencia específica
    PATCH: Actualiza una asistencia
    DELETE: Elimina una asistencia
    """
    asistencia = get_object_or_404(Asistencia, pk=pk)
    
    if request.method == 'GET':
        data = {
            'id': asistencia.id,
            'estudiante_id': asistencia.estudiante.id,
            'estudiante_nombre': f"{asistencia.estudiante.first_name} {asistencia.estudiante.last_name}",
            'clase_id': asistencia.clase.id if asistencia.clase else None,
            'fecha': asistencia.fecha.isoformat(),
            'estado': asistencia.estado,
            'observaciones': asistencia.observaciones,
        }
        return Response(data, status=status.HTTP_200_OK)
    
    elif request.method == 'PATCH':
        # Actualizar solo los campos proporcionados
        if 'estado' in request.data:
            asistencia.estado = request.data['estado']
        if 'observaciones' in request.data:
            asistencia.observaciones = request.data['observaciones']
        
        asistencia.save()
        
        return Response({
            'id': asistencia.id,
            'estado': asistencia.estado,
            'message': 'Asistencia actualizada correctamente'
        }, status=status.HTTP_200_OK)
    
    elif request.method == 'DELETE':
        asistencia.delete()
        return Response(
            {'message': 'Asistencia eliminada correctamente'},
            status=status.HTTP_204_NO_CONTENT
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_asistencia(request, estudiante_id):
    """
    Obtiene estadísticas de asistencia de un estudiante
    """
    estudiante = get_object_or_404(CustomUser, id=estudiante_id, role='student')
    asistencias = Asistencia.objects.filter(estudiante=estudiante)
    
    total = asistencias.count()
    presentes = asistencias.filter(estado='presente').count()
    ausentes = asistencias.filter(estado='ausente').count()
    tardanzas = asistencias.filter(estado='tardanza').count()
    justificados = asistencias.filter(estado='justificado').count()
    
    porcentaje = round((presentes / total * 100), 2) if total > 0 else 0
    
    return Response({
        'estudiante_id': estudiante_id,
        'total': total,
        'presentes': presentes,
        'ausentes': ausentes,
        'tardanzas': tardanzas,
        'justificados': justificados,
        'porcentaje': porcentaje
    }, status=status.HTTP_200_OK)
