from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone
from datetime import datetime, timedelta
from decimal import Decimal
from .models import CustomUser, Plan, Venta, Notificacion, Suscripcion, Especializacion, NotificacionEstudiante
from .serializers import VentaSerializer, UserSerializer, SuscripcionSerializer
import json

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def asignar_plan_usuario_view(request):
    """
    Asigna un plan a un usuario específico
    """
    try:
        print("=== INICIO ASIGNAR PLAN ===")
        print(f"Request data: {request.data}")
        
        user_id = request.data.get('user_id')
        plan_id = request.data.get('plan_id')
        especializacion_id = request.data.get('especializacion_id', None)
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        descuento = request.data.get('descuento', 0)
        notas = request.data.get('notas', '')
        
        print(f"user_id: {user_id}, plan_id: {plan_id}")
        
        # Validar datos requeridos
        if not user_id or not plan_id:
            return Response({
                'success': False,
                'message': 'user_id y plan_id son requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener usuario y plan
        print("Obteniendo usuario y plan...")
        usuario = get_object_or_404(CustomUser, id=user_id)
        plan = get_object_or_404(Plan, id=plan_id)
        print(f"Usuario: {usuario.username}, Plan: {plan.nombre}")
        
        # Calcular fechas
        fecha_inicio = timezone.now().date()
        fecha_fin = fecha_inicio + timedelta(days=plan.duracion_meses * 30)
        
        # Calcular precios
        precio_plan = plan.precio_base
        precio_especializacion = Decimal('0')
        
        if especializacion_id:
            # Aquí puedes agregar lógica para especializaciones si las tienes
            precio_especializacion = Decimal('50000')  # Precio base de especialización
        
        # Convertir descuento a Decimal
        descuento_decimal = Decimal(str(descuento))
        precio_total = precio_plan + precio_especializacion - descuento_decimal
        
        # Extraer número de clases del plan según características
        clases_totales = 9  # Default
        if 'Plan Individual' in plan.nombre or 'Plan Dupla' in plan.nombre or 'Plan Trío' in plan.nombre or 'Plan Grupal' in plan.nombre:
            clases_totales = 9
        elif 'Cero a Héroe' in plan.nombre or 'Kids' in plan.nombre:
            clases_totales = 8
        
        # Obtener especialización si existe
        print("Verificando especialización...")
        especializacion = None
        if especializacion_id:
            try:
                especializacion = Especializacion.objects.get(id=especializacion_id)
                print(f"Especialización encontrada: {especializacion}")
            except Especializacion.DoesNotExist:
                print("Especialización no encontrada")
                pass
        
        # Crear la venta/asignación
        print("Creando venta...")
        print(f"Datos venta: estudiante={usuario.id}, plan={plan.id}, precio_total={precio_total}")
        
        try:
            venta = Venta.objects.create(
                estudiante=usuario,
                plan=plan,
                especializacion=especializacion,
                precio_plan=precio_plan,
                precio_especializacion=precio_especializacion,
                descuento=descuento_decimal,
                precio_total=precio_total,
                metodo_pago=metodo_pago,
                estado='pagado',
                notas=notas,
                vendido_por=request.user,
                fecha_pago=timezone.now(),
                fecha_inicio_plan=fecha_inicio,
                fecha_fin_plan=fecha_fin
            )
            print(f"Venta creada exitosamente: ID {venta.id}")
        except Exception as e:
            print(f"ERROR al crear venta: {str(e)}")
            print(f"Tipo de error: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            raise
        
        # Crear suscripción automáticamente
        print("Creando suscripción...")
        try:
            suscripcion = Suscripcion.objects.create(
                venta=venta,
                estudiante=usuario,
                plan=plan,
                fecha_inicio=fecha_inicio,
                fecha_fin=fecha_fin,
                estado='activa',
                clases_totales=clases_totales,
                clases_tomadas=0
            )
            print(f"Suscripción creada exitosamente: ID {suscripcion.id}")
        except Exception as e:
            print(f"ERROR al crear suscripción: {str(e)}")
            print(f"Tipo de error: {type(e).__name__}")
            import traceback
            traceback.print_exc()
            raise
        
        # Crear notificación para el estudiante
        print("Creando notificación para el estudiante...")
        try:
            NotificacionEstudiante.objects.create(
                estudiante=usuario,
                tipo='plan_vencimiento',
                mensaje=f'¡Bienvenido! Se te ha asignado el plan {plan.nombre}. Tienes {clases_totales} clases disponibles hasta el {fecha_fin.strftime("%d/%m/%Y")}.',
                datos_adicionales={
                    'venta_id': venta.id,
                    'suscripcion_id': suscripcion.id,
                    'plan_nombre': plan.nombre,
                    'fecha_inicio': str(fecha_inicio),
                    'fecha_fin': str(fecha_fin),
                    'clases_totales': clases_totales
                }
            )
            print("Notificación creada exitosamente")
        except Exception as e:
            print(f"Error al crear notificación (no crítico): {str(e)}")
        
        return Response({
            'success': True,
            'message': f'Plan {plan.nombre} asignado exitosamente a {usuario.first_name} {usuario.last_name}',
            'venta_id': venta.id,
            'suscripcion_id': suscripcion.id,
            'fecha_inicio': fecha_inicio,
            'fecha_fin': fecha_fin,
            'precio_total': precio_total,
            'clases_totales': clases_totales
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        print(f"=== ERROR GENERAL ===")
        print(f"Error: {str(e)}")
        print(f"Tipo: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'message': f'Error al asignar plan: {str(e)}',
            'error_type': type(e).__name__
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def usuarios_sin_plan_view(request):
    """
    Lista usuarios que no tienen un plan activo
    """
    try:
        # Obtener todos los estudiantes
        todos_estudiantes = CustomUser.objects.filter(role='estudiante')
        
        # Obtener IDs de estudiantes con suscripciones activas o por vencer
        estudiantes_con_plan = Suscripcion.objects.filter(
            estado__in=['activa', 'por_vencer']
        ).values_list('estudiante_id', flat=True).distinct()
        
        # Filtrar estudiantes sin plan activo
        usuarios_sin_plan = todos_estudiantes.exclude(id__in=estudiantes_con_plan)
        
        serializer = UserSerializer(usuarios_sin_plan, many=True)
        return Response({
            'success': True,
            'usuarios': serializer.data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener usuarios: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def planes_por_vencer_view(request):
    """
    Lista planes que están por vencer en los próximos días
    También crea notificaciones automáticas para estudiantes
    """
    try:
        dias_aviso = int(request.GET.get('dias', 7))  # Por defecto 7 días
        fecha_limite = timezone.now().date() + timedelta(days=dias_aviso)
        
        planes_por_vencer = Venta.objects.filter(
            estado='pagado',
            fecha_fin_plan__lte=fecha_limite,
            fecha_fin_plan__gte=timezone.now().date()
        ).select_related('estudiante', 'plan')
        
        # Crear notificaciones para estudiantes con planes por vencer
        for venta in planes_por_vencer:
            # Verificar si ya existe una notificación reciente (últimas 24 horas)
            notificacion_existente = NotificacionEstudiante.objects.filter(
                estudiante=venta.estudiante,
                tipo='plan_vencimiento',
                fecha_creacion__gte=timezone.now() - timedelta(hours=24)
            ).exists()
            
            if not notificacion_existente:
                dias_restantes = (venta.fecha_fin_plan - timezone.now().date()).days
                NotificacionEstudiante.objects.create(
                    estudiante=venta.estudiante,
                    tipo='plan_vencimiento',
                    mensaje=f'Tu plan {venta.plan.nombre} vence en {dias_restantes} días. Renueva pronto para continuar con tus clases.',
                    datos_adicionales={
                        'venta_id': venta.id,
                        'plan_nombre': venta.plan.nombre,
                        'fecha_fin': str(venta.fecha_fin_plan),
                        'dias_restantes': dias_restantes
                    }
                )
        
        serializer = VentaSerializer(planes_por_vencer, many=True)
        return Response({
            'success': True,
            'planes_por_vencer': serializer.data,
            'total': planes_por_vencer.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener planes por vencer: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def suscripciones_activas_view(request):
    """
    Lista todas las suscripciones activas con información detallada
    """
    try:
        # Actualizar estados solo de suscripciones que no están canceladas
        suscripciones = Suscripcion.objects.exclude(estado='cancelada')
        for suscripcion in suscripciones:
            suscripcion.actualizar_estado()
        
        # Filtrar suscripciones activas (excluyendo canceladas explícitamente)
        suscripciones_activas = Suscripcion.objects.filter(
            estado__in=['activa', 'por_vencer']
        ).exclude(estado='cancelada').select_related('estudiante', 'plan', 'venta').order_by('fecha_fin')
        
        serializer = SuscripcionSerializer(suscripciones_activas, many=True)
        return Response({
            'success': True,
            'suscripciones': serializer.data,
            'total': suscripciones_activas.count()
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener suscripciones activas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def enviar_recordatorio_pago_view(request):
    """
    Envía recordatorio de pago a usuarios con planes por vencer
    """
    try:
        venta_id = request.data.get('venta_id')
        mensaje_personalizado = request.data.get('mensaje', '')
        
        venta = get_object_or_404(Venta, id=venta_id)
        
        # Calcular días restantes
        dias_restantes = (venta.fecha_fin_plan - timezone.now().date()).days
        
        # Crear notificación
        mensaje_default = f'Tu plan {venta.plan.nombre} vence en {dias_restantes} días ({venta.fecha_fin_plan}). ¡Renueva para continuar aprendiendo!'
        mensaje_final = mensaje_personalizado if mensaje_personalizado else mensaje_default
        
        Notificacion.objects.create(
            usuario=venta.estudiante,
            titulo='Recordatorio de Renovación',
            mensaje=mensaje_final,
            tipo='recordatorio_pago',
            leida=False
        )
        
        return Response({
            'success': True,
            'message': f'Recordatorio enviado a {venta.estudiante.first_name} {venta.estudiante.last_name}'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al enviar recordatorio: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def renovar_plan_view(request):
    """
    Renueva un plan existente
    """
    try:
        venta_id = request.data.get('venta_id')
        nuevo_plan_id = request.data.get('nuevo_plan_id', None)
        metodo_pago = request.data.get('metodo_pago', 'efectivo')
        descuento = request.data.get('descuento', 0)
        
        venta_anterior = get_object_or_404(Venta, id=venta_id)
        
        # Usar el mismo plan o uno nuevo
        plan = get_object_or_404(Plan, id=nuevo_plan_id) if nuevo_plan_id else venta_anterior.plan
        
        # Calcular nuevas fechas (desde el fin del plan anterior)
        fecha_inicio = venta_anterior.fecha_fin_plan
        if fecha_inicio < timezone.now().date():
            fecha_inicio = timezone.now().date()
        
        fecha_fin = fecha_inicio + timedelta(days=plan.duracion_meses * 30)
        
        # Crear nueva venta/renovación
        nueva_venta = Venta.objects.create(
            estudiante=venta_anterior.estudiante,
            plan=plan,
            especializacion=venta_anterior.especializacion,
            precio_plan=plan.precio_base,
            precio_especializacion=venta_anterior.precio_especializacion,
            descuento=descuento,
            precio_total=plan.precio_base + venta_anterior.precio_especializacion - float(descuento),
            metodo_pago=metodo_pago,
            estado='pagado',
            notas=f'Renovación del plan anterior (ID: {venta_anterior.id})',
            vendido_por=request.user,
            fecha_venta=timezone.now(),
            fecha_pago=timezone.now(),
            fecha_inicio_plan=fecha_inicio,
            fecha_fin_plan=fecha_fin
        )
        
        # Notificar al usuario
        Notificacion.objects.create(
            usuario=venta_anterior.estudiante,
            titulo='Plan Renovado',
            mensaje=f'Tu plan {plan.nombre} ha sido renovado. Válido hasta {fecha_fin}. ¡Continúa aprendiendo!',
            tipo='plan_renovado',
            leida=False
        )
        
        return Response({
            'success': True,
            'message': 'Plan renovado exitosamente',
            'nueva_venta_id': nueva_venta.id,
            'fecha_fin': fecha_fin
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al renovar plan: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancelar_suscripcion_view(request, suscripcion_id):
    """
    Cancela una suscripción activa
    """
    try:
        # Obtener la suscripción
        suscripcion = get_object_or_404(Suscripcion, id=suscripcion_id)
        
        # Verificar que la suscripción esté activa
        if suscripcion.estado == 'cancelada':
            return Response({
                'success': False,
                'message': 'Esta suscripción ya está cancelada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cambiar estado a cancelada
        suscripcion.estado = 'cancelada'
        suscripcion.save()
        
        # Opcional: También cancelar la venta relacionada
        if suscripcion.venta:
            suscripcion.venta.estado = 'cancelado'
            suscripcion.venta.save()
        
        return Response({
            'success': True,
            'message': f'Suscripción cancelada exitosamente para {suscripcion.estudiante.first_name} {suscripcion.estudiante.last_name}'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al cancelar suscripción: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
