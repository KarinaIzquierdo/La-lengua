from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.conf import settings

@api_view(['GET'])
@permission_classes([AllowAny])
def api_info_view(request):
    """
    Endpoint para obtener información de la API para aplicaciones móviles
    """
    api_info = {
        "app_name": "Lengua API",
        "mobile_app_name": "Lengua",
        "version": "1.0.0",
        "base_url": request.build_absolute_uri('/api/'),
        "endpoints": {
            "authentication": {
                "login": "/api/login/",  # Endpoint específico para móviles (POST)
                "profile": "/api/profile/",  # Obtener perfil móvil (GET)
                "update_profile_mobile": "/api/profile/update/",  # Actualizar perfil móvil (PUT/PATCH)
                "classes": "/api/classes/",  # Obtener clases programadas del usuario (GET)
                "evaluations": "/api/evaluations/",  # Obtener evaluaciones asignadas (GET)
                "web_login": "/api/auth/login/",  # Endpoint para web
                "web_profile": "/api/auth/profile/",  # Endpoint complejo para web
                "web_update_profile": "/api/auth/update-profile/",  # Actualizar perfil web (POST)
                "register": "/api/auth/register/",
                "verify_token": "/api/auth/verify-token/",
                "change_password": "/api/auth/change-password/"
            },
            "classes": {
                "list": "/api/clases/",
                "create": "/api/clases/",
                "detail": "/api/clases/{id}/",
                "update": "/api/clases/{id}/",
                "delete": "/api/clases/{id}/"
            },
            "evaluations": {
                "student_evaluations": "/api/student/evaluaciones/",
                "download": "/api/evaluaciones/{id}/download/",
                "upload_response": "/api/evaluaciones/{id}/upload-respuesta/",
                "student_responses": "/api/student/respuestas/"
            },
            "notifications": {
                "list": "/api/notificaciones/",
                "mark_read": "/api/notificaciones/{id}/marcar-leida/",
                "mark_all_read": "/api/notificaciones/marcar-todas-leidas/"
            },
            "gallery": {
                "list": "/api/gallery/",
                "create": "/api/gallery/create/"
            },
            "specializations": {
                "list": "/api/especializaciones/",
                "active": "/api/especializaciones/activas/"
            }
        },
        "authentication_method": "JWT Bearer Token",
        "token_header": "Authorization: Bearer <token>",
        "content_type": "application/json"
    }
    
    return Response(api_info, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([AllowAny])
def mobile_config_view(request):
    """
    Configuración específica para aplicaciones móviles
    """
    config = {
        "server_status": "online",
        "supported_file_types": ["pdf", "doc", "docx", "txt", "jpg", "png"],
        "max_file_size_mb": 10,
        "pagination_size": 20,
        "app_features": {
            "push_notifications": True,
            "offline_mode": False,
            "file_upload": True,
            "video_streaming": True
        },
        "contact_info": {
            "whatsapp": "+573164844819",
            "email": "the.languagess@gmail.com",
            "support_hours": "8:00 AM - 6:00 PM COT"
        }
    }
    
    return Response(config, status=status.HTTP_200_OK)
