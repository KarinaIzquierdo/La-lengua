from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import RespuestaEvaluacion, Evaluacion, CustomUser
from .serializers import RespuestaEvaluacionSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_respuestas_por_calificar(request):
    """
    Obtiene todas las respuestas de evaluaciones que necesitan calificación
    para las evaluaciones creadas por el profesor autenticado
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden acceder a esta función'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Obtener evaluaciones del profesor
    evaluaciones_profesor = Evaluacion.objects.filter(profesor=request.user)
    
    # Obtener respuestas sin calificar
    respuestas_sin_calificar = RespuestaEvaluacion.objects.filter(
        evaluacion__in=evaluaciones_profesor,
        completado=True,
        calificacion__isnull=True
    ).select_related('evaluacion', 'estudiante').order_by('-fecha_envio')
    
    serializer = RespuestaEvaluacionSerializer(respuestas_sin_calificar, many=True)
    
    return Response({
        'success': True,
        'respuestas': serializer.data,
        'total': respuestas_sin_calificar.count()
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_respuestas_calificadas(request):
    """
    Obtiene todas las respuestas ya calificadas por el profesor
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden acceder a esta función'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    # Obtener evaluaciones del profesor
    evaluaciones_profesor = Evaluacion.objects.filter(profesor=request.user)
    
    # Obtener respuestas calificadas
    respuestas_calificadas = RespuestaEvaluacion.objects.filter(
        evaluacion__in=evaluaciones_profesor,
        completado=True,
        calificacion__isnull=False
    ).select_related('evaluacion', 'estudiante', 'calificado_por').order_by('-fecha_calificacion')
    
    serializer = RespuestaEvaluacionSerializer(respuestas_calificadas, many=True)
    
    return Response({
        'success': True,
        'respuestas': serializer.data,
        'total': respuestas_calificadas.count()
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calificar_respuesta(request, respuesta_id):
    """
    Califica una respuesta específica de evaluación
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden calificar evaluaciones'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        respuesta = get_object_or_404(RespuestaEvaluacion, id=respuesta_id)
        
        # Verificar que la evaluación pertenece al profesor
        if respuesta.evaluacion.profesor != request.user:
            return Response({'error': 'No tienes permiso para calificar esta evaluación'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Obtener datos de calificación
        calificacion = request.data.get('calificacion')
        comentarios = request.data.get('comentarios_profesor', '')
        
        # Validar calificación
        if calificacion is None:
            return Response({'error': 'La calificación es requerida'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        try:
            calificacion = float(calificacion)
            if calificacion < 0 or calificacion > 100:
                return Response({'error': 'La calificación debe estar entre 0 y 100'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({'error': 'La calificación debe ser un número válido'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar la respuesta con la calificación
        respuesta.calificacion = calificacion
        respuesta.comentarios_profesor = comentarios
        respuesta.fecha_calificacion = timezone.now()
        respuesta.calificado_por = request.user
        respuesta.save()
        
        serializer = RespuestaEvaluacionSerializer(respuesta)
        
        return Response({
            'success': True,
            'message': 'Evaluación calificada exitosamente',
            'respuesta': serializer.data
        })
        
    except Exception as e:
        return Response({'error': f'Error al calificar: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def actualizar_calificacion(request, respuesta_id):
    """
    Actualiza una calificación existente
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden actualizar calificaciones'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        respuesta = get_object_or_404(RespuestaEvaluacion, id=respuesta_id)
        
        # Verificar que la evaluación pertenece al profesor
        if respuesta.evaluacion.profesor != request.user:
            return Response({'error': 'No tienes permiso para actualizar esta calificación'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        # Verificar que ya está calificada
        if respuesta.calificacion is None:
            return Response({'error': 'Esta respuesta no ha sido calificada aún'}, 
                           status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener nuevos datos
        nueva_calificacion = request.data.get('calificacion')
        nuevos_comentarios = request.data.get('comentarios_profesor', respuesta.comentarios_profesor)
        
        # Validar nueva calificación
        if nueva_calificacion is not None:
            try:
                nueva_calificacion = float(nueva_calificacion)
                if nueva_calificacion < 0 or nueva_calificacion > 100:
                    return Response({'error': 'La calificación debe estar entre 0 y 100'}, 
                                   status=status.HTTP_400_BAD_REQUEST)
                respuesta.calificacion = nueva_calificacion
            except (ValueError, TypeError):
                return Response({'error': 'La calificación debe ser un número válido'}, 
                               status=status.HTTP_400_BAD_REQUEST)
        
        # Actualizar comentarios
        respuesta.comentarios_profesor = nuevos_comentarios
        respuesta.fecha_calificacion = timezone.now()  # Actualizar fecha de modificación
        respuesta.save()
        
        serializer = RespuestaEvaluacionSerializer(respuesta)
        
        return Response({
            'success': True,
            'message': 'Calificación actualizada exitosamente',
            'respuesta': serializer.data
        })
        
    except Exception as e:
        return Response({'error': f'Error al actualizar calificación: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_detalle_respuesta(request, respuesta_id):
    """
    Obtiene el detalle completo de una respuesta para calificar
    """
    if request.user.role != 'profesor':
        return Response({'error': 'Solo los profesores pueden acceder a esta función'}, 
                       status=status.HTTP_403_FORBIDDEN)
    
    try:
        respuesta = get_object_or_404(RespuestaEvaluacion, id=respuesta_id)
        
        # Verificar que la evaluación pertenece al profesor
        if respuesta.evaluacion.profesor != request.user:
            return Response({'error': 'No tienes permiso para ver esta respuesta'}, 
                           status=status.HTTP_403_FORBIDDEN)
        
        serializer = RespuestaEvaluacionSerializer(respuesta)
        
        return Response({
            'success': True,
            'respuesta': serializer.data
        })
        
    except Exception as e:
        return Response({'error': f'Error al obtener respuesta: {str(e)}'}, 
                       status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def panel_calificaciones_view(request):
    """Panel de calificaciones para el profesor.

    Devuelve una lista plana donde cada elemento representa el par
    (estudiante, evaluación) para las evaluaciones PUBLICADAS creadas
    por el profesor autenticado y los estudiantes asignados desde
    DriveEvaluaciones.

    Si existe una RespuestaEvaluacion, se incluye información de
    calificación y fecha de envío; si no, los campos de respuesta
    van en blanco pero igualmente aparece la fila.
    """

    # Restringir solo a profesores (por rol o flag is_profesor)
    user_role = getattr(request.user, 'role', None)
    is_profesor_flag = getattr(request.user, 'is_profesor', False)
    if user_role != 'profesor' and not is_profesor_flag:
        return Response(
            {'error': 'Solo los profesores pueden acceder a esta función'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Evaluaciones publicadas creadas por el profesor
    evaluaciones = (
        Evaluacion.objects
        .filter(profesor=request.user, estado='publicada')
        .prefetch_related('estudiantes_asignados', 'respuestas')
    )

    items = []

    for evaluacion in evaluaciones:
        # Mapear respuestas por estudiante para acceso rápido
        respuestas_por_estudiante = {
            r.estudiante_id: r for r in evaluacion.respuestas.all()
        }

        for estudiante in evaluacion.estudiantes_asignados.all():
            respuesta = respuestas_por_estudiante.get(estudiante.id)

            # Nombre amigable del estudiante
            nombre_estudiante = (
                estudiante.get_full_name()
                if hasattr(estudiante, 'get_full_name') and estudiante.get_full_name()
                else (estudiante.username or estudiante.email)
            )

            item = {
                'evaluacion_id': evaluacion.id,
                'evaluacion_titulo': evaluacion.titulo,
                'evaluacion_tipo': evaluacion.tipo,
                'estudiante_id': estudiante.id,
                'estudiante_nombre': nombre_estudiante,
                'respuesta_id': respuesta.id if respuesta else None,
                'tiene_respuesta': bool(respuesta and respuesta.completado),
                'calificacion': float(respuesta.calificacion)
                if respuesta and respuesta.calificacion is not None
                else None,
                'comentarios_profesor': respuesta.comentarios_profesor if respuesta else None,
                'fecha_envio': (
                    respuesta.fecha_envio.isoformat()
                    if respuesta and respuesta.fecha_envio
                    else None
                ),
                'archivo_respuesta_url': (
                    request.build_absolute_uri(respuesta.archivo_respuesta.url)
                    if respuesta and respuesta.archivo_respuesta
                    else None
                ),
            }

            items.append(item)

    return Response({
        'success': True,
        'items': items,
        'total': len(items),
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def calificar_desde_panel(request):
    """Permite calificar directamente desde el panel usando evaluacion_id y estudiante_id.

    Si no existe una RespuestaEvaluacion previa, se crea automáticamente y se asigna
    la calificación indicada. Esto permite que el profesor ponga nota aunque el
    estudiante no haya subido archivo.
    """

    user_role = getattr(request.user, 'role', None)
    is_profesor_flag = getattr(request.user, 'is_profesor', False)
    if user_role != 'profesor' and not is_profesor_flag:
        return Response(
            {'error': 'Solo los profesores pueden calificar evaluaciones'},
            status=status.HTTP_403_FORBIDDEN
        )

    evaluacion_id = request.data.get('evaluacion_id')
    estudiante_id = request.data.get('estudiante_id')
    calificacion = request.data.get('calificacion')
    comentarios = request.data.get('comentarios_profesor', '')

    if not evaluacion_id or not estudiante_id:
        return Response(
            {'error': 'evaluacion_id y estudiante_id son requeridos'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if calificacion is None:
        return Response(
            {'error': 'La calificación es requerida'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        calificacion_val = float(calificacion)
        if calificacion_val < 0 or calificacion_val > 100:
            return Response(
                {'error': 'La calificación debe estar entre 0 y 100'},
                status=status.HTTP_400_BAD_REQUEST
            )
    except (ValueError, TypeError):
        return Response(
            {'error': 'La calificación debe ser un número válido'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        evaluacion = get_object_or_404(Evaluacion, id=evaluacion_id, profesor=request.user)
        estudiante = get_object_or_404(CustomUser, id=estudiante_id)

        # Crear o recuperar la respuesta del estudiante para esta evaluación
        respuesta, created = RespuestaEvaluacion.objects.get_or_create(
            evaluacion=evaluacion,
            estudiante=estudiante,
            defaults={
                'completado': False,
                'respuestas_json': {},
                'tiempo_gastado': 0,
                'advertencias': 0,
            }
        )

        respuesta.calificacion = calificacion_val
        respuesta.comentarios_profesor = comentarios
        respuesta.fecha_calificacion = timezone.now()
        respuesta.calificado_por = request.user
        respuesta.save()

        serializer = RespuestaEvaluacionSerializer(respuesta)

        return Response({
            'success': True,
            'message': 'Evaluación calificada exitosamente',
            'respuesta': serializer.data
        })

    except Exception as e:
        return Response(
            {'error': f'Error al calificar desde panel: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
