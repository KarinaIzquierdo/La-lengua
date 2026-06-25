from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Plan, Venta, CustomUser, Especializacion
from .serializers import PlanSerializer, VentaSerializer

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def planes_list_view(request):
    """
    Obtener lista de todos los planes
    """
    try:
        planes = Plan.objects.all().order_by('precio_base')
        serializer = PlanSerializer(planes, many=True)
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener planes: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def plan_create_view(request):
    """
    Crear nuevo plan
    """
    try:
        serializer = PlanSerializer(data=request.data)
        if serializer.is_valid():
            plan = serializer.save()
            return Response({
                'success': True,
                'data': PlanSerializer(plan).data,
                'message': 'Plan creado exitosamente'
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al crear plan: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def plan_update_view(request, pk):
    """
    Actualizar plan existente
    """
    try:
        plan = get_object_or_404(Plan, pk=pk)
        serializer = PlanSerializer(plan, data=request.data, partial=True)
        if serializer.is_valid():
            plan = serializer.save()
            return Response({
                'success': True,
                'data': PlanSerializer(plan).data,
                'message': 'Plan actualizado exitosamente'
            }, status=status.HTTP_200_OK)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar plan: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def plan_delete_view(request, pk):
    """
    Eliminar plan
    """
    try:
        plan = get_object_or_404(Plan, pk=pk)
        plan.delete()
        return Response({
            'success': True,
            'message': 'Plan eliminado exitosamente'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al eliminar plan: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def plan_toggle_view(request, pk):
    """
    Activar/desactivar plan
    """
    try:
        plan = get_object_or_404(Plan, pk=pk)
        plan.activo = not plan.activo
        plan.save()
        return Response({
            'success': True,
            'data': PlanSerializer(plan).data,
            'message': f'Plan {"activado" if plan.activo else "desactivado"} exitosamente'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al cambiar estado del plan: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def ventas_list_view(request):
    """
    Obtener lista de todas las ventas con filtros opcionales
    """
    try:
        ventas = Venta.objects.all().select_related('estudiante', 'plan', 'especializacion', 'vendido_por')
        
        # Filtros opcionales
        estado = request.GET.get('estado')
        metodo_pago = request.GET.get('metodo_pago')
        fecha_desde = request.GET.get('fecha_desde')
        fecha_hasta = request.GET.get('fecha_hasta')
        
        if estado and estado != 'todos':
            ventas = ventas.filter(estado=estado)
        if metodo_pago and metodo_pago != 'todos':
            ventas = ventas.filter(metodo_pago=metodo_pago)
        if fecha_desde:
            ventas = ventas.filter(fecha_venta__gte=fecha_desde)
        if fecha_hasta:
            ventas = ventas.filter(fecha_venta__lte=fecha_hasta)
            
        ventas = ventas.order_by('-fecha_venta')
        serializer = VentaSerializer(ventas, many=True)
        
        return Response({
            'success': True,
            'data': serializer.data
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener ventas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def venta_create_view(request):
    """
    Crear nueva venta
    """
    try:
        serializer = VentaSerializer(data=request.data)
        if serializer.is_valid():
            venta = serializer.save()
            return Response({
                'success': True,
                'data': VentaSerializer(venta).data,
                'message': 'Venta registrada exitosamente'
            }, status=status.HTTP_201_CREATED)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al registrar venta: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def venta_update_view(request, pk):
    """
    Actualizar venta existente
    """
    try:
        venta = get_object_or_404(Venta, pk=pk)
        serializer = VentaSerializer(venta, data=request.data, partial=True)
        if serializer.is_valid():
            venta = serializer.save()
            return Response({
                'success': True,
                'data': VentaSerializer(venta).data,
                'message': 'Venta actualizada exitosamente'
            }, status=status.HTTP_200_OK)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar venta: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estadisticas_financieras_view(request):
    """
    Obtener estadísticas financieras generales
    """
    try:
        from django.db.models import Sum, Count
        from datetime import datetime, timedelta
        
        # Estadísticas generales
        total_ventas = Venta.objects.count()
        ventas_pagadas = Venta.objects.filter(estado='pagado')
        ingresos_totales = ventas_pagadas.aggregate(total=Sum('precio_total'))['total'] or 0
        ventas_pendientes = Venta.objects.filter(estado='pendiente').count()
        
        # Ingresos del mes actual
        inicio_mes = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        ingresos_mes = ventas_pagadas.filter(fecha_venta__gte=inicio_mes).aggregate(total=Sum('precio_total'))['total'] or 0
        
        # Tasa de conversión
        conversion_rate = (ventas_pagadas.count() / total_ventas * 100) if total_ventas > 0 else 0
        
        # Planes más vendidos
        planes_populares = Venta.objects.values('plan__nombre').annotate(
            count=Count('id'),
            ingresos=Sum('precio_total')
        ).order_by('-count')[:5]
        
        return Response({
            'success': True,
            'data': {
                'total_ventas': total_ventas,
                'ingresos_totales': float(ingresos_totales),
                'ingresos_mes': float(ingresos_mes),
                'ventas_pendientes': ventas_pendientes,
                'conversion_rate': round(conversion_rate, 2),
                'planes_populares': list(planes_populares)
            }
        }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener estadísticas: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
