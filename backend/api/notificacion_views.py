from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from datetime import timedelta
from .models import CustomUser, Clase, Evaluacion, RespuestaEvaluacion, Notificacion
from .serializers import NotificacionSerializer


def generar_notificaciones_automaticas(profesor_id):
    """
    Genera notificaciones automáticas para un profesor basadas en datos reales
    """
    profesor = CustomUser.objects.get(id=profesor_id, role='profesor')
    notificaciones_creadas = []
    
    # 1. CLASES DE HOY
    hoy = timezone.now().date()
    clases_hoy = Clase.objects.filter(
        profesor=profesor.get_full_name(),
        fecha=hoy,
        estado='programada'
    )
    
    for clase in clases_hoy:
        # Verificar si ya existe notificación para esta clase hoy
        if not Notificacion.objects.filter(
            profesor=profesor,
            tipo='clase_hoy',
            clase_relacionada=clase,
            created_at__date=hoy
        ).exists():
            notif = Notificacion.objects.create(
                profesor=profesor,
                tipo='clase_hoy',
                titulo=f"Clase hoy: {clase.tema}",
                mensaje=f"Tienes una clase programada hoy a las {clase.hora}. Tema: {clase.tema}. {clase.estudiantes.count()} estudiante(s) asignados.",
                prioridad='alta',
                clase_relacionada=clase
            )
            notificaciones_creadas.append(notif)
    
    # 2. CLASES PRÓXIMAS (MAÑANA)
    manana = hoy + timedelta(days=1)
    clases_manana = Clase.objects.filter(
        profesor=profesor.get_full_name(),
        fecha=manana,
        estado='programada'
    )
    
    for clase in clases_manana:
        if not Notificacion.objects.filter(
            profesor=profesor,
            tipo='clase_proxima',
            clase_relacionada=clase,
            created_at__date=hoy
        ).exists():
            notif = Notificacion.objects.create(
                profesor=profesor,
                tipo='clase_proxima',
                titulo=f"Clase mañana: {clase.tema}",
                mensaje=f"Tienes una clase programada mañana a las {clase.hora}. Prepara el material para: {clase.tema}",
                prioridad='media',
                clase_relacionada=clase
            )
            notificaciones_creadas.append(notif)
    
    # 3. EVALUACIONES SUBIDAS POR ESTUDIANTES (últimas 24 horas)
    hace_24h = timezone.now() - timedelta(hours=24)
    evaluaciones_profesor = Evaluacion.objects.filter(profesor=profesor)
    
    respuestas_recientes = RespuestaEvaluacion.objects.filter(
        evaluacion__in=evaluaciones_profesor,
        fecha_envio__gte=hace_24h,
        completado=True
    )
    
    for respuesta in respuestas_recientes:
        if not Notificacion.objects.filter(
            profesor=profesor,
            tipo='evaluacion_subida',
            evaluacion_relacionada=respuesta.evaluacion,
            estudiante_relacionado=respuesta.estudiante,
            created_at__gte=hace_24h
        ).exists():
            notif = Notificacion.objects.create(
                profesor=profesor,
                tipo='evaluacion_subida',
                titulo=f"Nueva respuesta: {respuesta.evaluacion.titulo}",
                mensaje=f"{respuesta.estudiante.get_full_name()} ha enviado su respuesta para '{respuesta.evaluacion.titulo}'. Tiempo: {respuesta.tiempo_gastado//60} min.",
                prioridad='media',
                evaluacion_relacionada=respuesta.evaluacion,
                estudiante_relacionado=respuesta.estudiante
            )
            notificaciones_creadas.append(notif)
    
    # 4. EVALUACIONES PENDIENTES POR CALIFICAR
    for evaluacion in evaluaciones_profesor.filter(estado='publicada'):
        respuestas_sin_calificar = RespuestaEvaluacion.objects.filter(
            evaluacion=evaluacion,
            completado=True
        ).count()
        
        if respuestas_sin_calificar > 0:
            # Solo crear notificación si no existe una reciente
            if not Notificacion.objects.filter(
                profesor=profesor,
                tipo='evaluacion_pendiente',
                evaluacion_relacionada=evaluacion,
                created_at__date=hoy
            ).exists():
                notif = Notificacion.objects.create(
                    profesor=profesor,
                    tipo='evaluacion_pendiente',
                    titulo=f"Pendiente calificar: {evaluacion.titulo}",
                    mensaje=f"Tienes {respuestas_sin_calificar} respuesta(s) pendiente(s) por calificar en '{evaluacion.titulo}'",
                    prioridad='media',
                    evaluacion_relacionada=evaluacion
                )
                notificaciones_creadas.append(notif)
    
    # 5. ESTUDIANTES SIN EVALUAR (evaluaciones vencidas)
    evaluaciones_vencidas = evaluaciones_profesor.filter(
        fecha_limite__lt=timezone.now(),
        estado='publicada'
    )
    
    for evaluacion in evaluaciones_vencidas:
        estudiantes_asignados = evaluacion.estudiantes_asignados.count()
        respuestas_enviadas = RespuestaEvaluacion.objects.filter(
            evaluacion=evaluacion,
            completado=True
        ).count()
        
        estudiantes_faltantes = estudiantes_asignados - respuestas_enviadas
        
        if estudiantes_faltantes > 0:
            if not Notificacion.objects.filter(
                profesor=profesor,
                tipo='evaluacion_vencida',
                evaluacion_relacionada=evaluacion,
                created_at__date=hoy
            ).exists():
                notif = Notificacion.objects.create(
                    profesor=profesor,
                    tipo='evaluacion_vencida',
                    titulo=f"Evaluación vencida: {evaluacion.titulo}",
                    mensaje=f"{estudiantes_faltantes} estudiante(s) no enviaron '{evaluacion.titulo}' (vencida el {evaluacion.fecha_limite.strftime('%d/%m/%Y')})",
                    prioridad='alta',
                    evaluacion_relacionada=evaluacion
                )
                notificaciones_creadas.append(notif)
    
    return notificaciones_creadas


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def obtener_notificaciones(request):
    """
    Obtiene las notificaciones del profesor autenticado y genera nuevas automáticamente
    """
    # Verificar si el usuario es profesor o tiene permisos
    if not (request.user.role == 'profesor' or request.user.is_profesor):
        return Response({
            'success': False,
            'message': 'Solo los profesores pueden acceder a las notificaciones'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Generar notificaciones automáticas
        generar_notificaciones_automaticas(request.user.id)
        
        # Obtener todas las notificaciones del profesor (últimos 30 días)
        hace_30_dias = timezone.now() - timedelta(days=30)
        
        notificaciones = Notificacion.objects.filter(
            profesor=request.user,
            created_at__gte=hace_30_dias
        ).order_by('-created_at')
        
        serializer = NotificacionSerializer(notificaciones, many=True)
        
        # Contar no leídas
        no_leidas = notificaciones.filter(leida=False).count()
        
        return Response({
            'success': True,
            'notificaciones': serializer.data,
            'total': notificaciones.count(),
            'no_leidas': no_leidas
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener notificaciones: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_notificacion_leida(request, notificacion_id):
    """
    Marca una notificación como leída
    """
    try:
        notificacion = Notificacion.objects.get(
            id=notificacion_id,
            profesor=request.user
        )
        notificacion.leida = True
        notificacion.save()
        
        return Response({
            'success': True,
            'message': 'Notificación marcada como leída'
        }, status=status.HTTP_200_OK)
        
    except Notificacion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Notificación no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def marcar_todas_leidas(request):
    """
    Marca todas las notificaciones del profesor como leídas
    """
    try:
        count = Notificacion.objects.filter(
            profesor=request.user,
            leida=False
        ).update(leida=True)
        
        return Response({
            'success': True,
            'message': f'{count} notificaciones marcadas como leídas'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def crear_notificacion(request):
    """
    Crea una nueva notificación para un profesor específico
    """
    try:
        data = request.data
        profesor_id = data.get('profesor_id')
        titulo = data.get('titulo')
        mensaje = data.get('mensaje')
        tipo = data.get('tipo', 'asignacion_bloque')
        prioridad = data.get('prioridad', 'media')
        
        # Validar que el profesor existe
        try:
            profesor = CustomUser.objects.get(id=profesor_id, role='profesor')
        except CustomUser.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Profesor no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Crear la notificación
        notificacion = Notificacion.objects.create(
            profesor=profesor,
            tipo=tipo,
            titulo=titulo,
            mensaje=mensaje,
            prioridad=prioridad
        )
        
        serializer = NotificacionSerializer(notificacion)
        
        return Response({
            'success': True,
            'message': 'Notificación creada exitosamente',
            'notificacion': serializer.data
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al crear notificación: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
