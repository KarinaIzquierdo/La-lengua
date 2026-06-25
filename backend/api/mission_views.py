from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.db import models

from .models import MissionExternalLink
from .serializers import MissionExternalLinkSerializer


def _active_queryset():
    now = timezone.now()
    return MissionExternalLink.objects.filter(
        is_active=True
    ).filter(
        # start_at nulo o ya iniciado
        models.Q(start_at__isnull=True) | models.Q(start_at__lte=now)
    ).filter(
        # sin expiración o no expirado
        models.Q(expires_at__isnull=True) | models.Q(expires_at__gte=now)
    )


@api_view(['GET'])
@permission_classes([AllowAny])
def mission_current_link_view(request, mission_key: str):
    """
    Devuelve el enlace vigente (activo y dentro de fechas) para una misión.
    Si no hay enlace vigente, retorna 204 No Content.
    """
    now = timezone.now()
    base = MissionExternalLink.objects.filter(mission_key=mission_key, is_active=True)
    base = base.filter(
        models.Q(start_at__isnull=True) | models.Q(start_at__lte=now)
    ).filter(
        models.Q(expires_at__isnull=True) | models.Q(expires_at__gte=now)
    )

    user_id = request.query_params.get('user_id')

    obj = None
    # 1) Prioridad por estudiante
    if user_id:
        obj = base.filter(audience_type='student', user_id=user_id).order_by('-start_at', '-created_at').first()

    # 2) Finalmente global (bloques deshabilitados)
    if not obj:
        obj = base.filter(audience_type='global').order_by('-start_at', '-created_at').first()

    if not obj:
        return Response(status=status.HTTP_204_NO_CONTENT)
    return Response(MissionExternalLinkSerializer(obj).data)


@api_view(['GET'])
@permission_classes([AllowAny])
def missions_available_view(request):
    """
    Devuelve la lista de misiones disponibles (distinct mission_key) para el usuario/bloque.
    Query params: user_id, bloque
    Retorna: [{ mission_key, title, description, platform, xp }, ...]
    """
    now = timezone.now()
    base = MissionExternalLink.objects.filter(is_active=True)
    base = base.filter(
        models.Q(start_at__isnull=True) | models.Q(start_at__lte=now)
    ).filter(
        models.Q(expires_at__isnull=True) | models.Q(expires_at__gte=now)
    )

    user_id = request.query_params.get('user_id')

    # Prioridad: student > global (bloques deshabilitados)
    qs_student = base.filter(audience_type='student', user_id=user_id) if user_id else base.none()
    qs_global = base.filter(audience_type='global')

    # Combinar con prioridad
    combined = qs_student | qs_global
    # Obtener mission_keys únicos
    mission_keys = combined.values_list('mission_key', flat=True).distinct()

    # Construir respuesta con metadata
    result = []
    for mk in mission_keys:
        # Tomar el primer enlace vigente para ese mission_key (ya priorizados)
        obj = combined.filter(mission_key=mk).order_by('-start_at', '-created_at').first()
        if obj:
            result.append({
                'mission_key': obj.mission_key,
                'title': obj.mission_key.replace('_', ' ').title(),  # Convertir slug a título legible
                'description': obj.notes or 'Completa esta misión para avanzar en tu aprendizaje',
                'platform': obj.platform,
                'xp': 25,  # Valor por defecto, puedes agregar campo en modelo si lo deseas
            })

    return Response(result)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def mission_links_list_create_view(request):
    # Check admin privilege: either Django staff or custom role 'admin'
    user = request.user
    if not (getattr(user, 'is_staff', False) or getattr(user, 'role', '') == 'admin'):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        mission_key = request.query_params.get('mission_key')
        qs = MissionExternalLink.objects.all().order_by('-created_at')
        if mission_key:
            qs = qs.filter(mission_key=mission_key)
        return Response(MissionExternalLinkSerializer(qs, many=True).data)

    # POST
    serializer = MissionExternalLinkSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def mission_link_detail_view(request, pk: int):
    # Check admin privilege
    user = request.user
    if not (getattr(user, 'is_staff', False) or getattr(user, 'role', '') == 'admin'):
        return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

    obj = get_object_or_404(MissionExternalLink, pk=pk)

    if request.method == 'GET':
        return Response(MissionExternalLinkSerializer(obj).data)

    if request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = MissionExternalLinkSerializer(obj, data=request.data, partial=partial)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    obj.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)
