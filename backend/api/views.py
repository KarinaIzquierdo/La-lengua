from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from django.http import HttpResponse
from django.shortcuts import render
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from datetime import date, timedelta
from .models import CustomUser, Profesor, Clase, Evaluation, MediaItem, Club, ClubMaterial, Especializacion, Evaluacion, Notificacion, NotificacionEstudiante, RespuestaEvaluacion, DailyChallengeQuestion, RegistroEliminacion, Asistencia, Suscripcion
from .serializers import (
    UserSerializer, LoginSerializer, ChangePasswordSerializer, ClaseSerializer,
    UserRegisterSerializer, EvaluationSerializer, MediaItemSerializer,
    ClubSerializer, ClubMaterialSerializer, EvaluacionSerializer, NotificacionSerializer,
    DailyChallengeQuestionSerializer,
)
from .especializacion_serializer import EspecializacionSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.db import connection
from django.db.models import Sum, Count, Q
from django.db.models.functions import TruncMonth

def home_view(request):
    """
    Página de inicio del API de Lengua
    """
    html_content = """
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Lengua API</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 0;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .container {
                text-align: center;
                max-width: 800px;
                padding: 40px 20px;
            }
            .logo {
                font-size: 3rem;
                font-weight: bold;
                margin-bottom: 20px;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .subtitle {
                font-size: 1.2rem;
                margin-bottom: 40px;
                opacity: 0.9;
            }
            .api-info {
                background: rgba(255,255,255,0.1);
                border-radius: 15px;
                padding: 30px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
            }
            .endpoint {
                background: rgba(255,255,255,0.2);
                padding: 15px;
                margin: 10px 0;
                border-radius: 8px;
                font-family: monospace;
                font-size: 0.9rem;
            }
            .status {
                display: inline-block;
                background: #28a745;
                padding: 5px 15px;
                border-radius: 20px;
                font-size: 0.8rem;
                margin-bottom: 20px;
            }
            .footer {
                margin-top: 40px;
                opacity: 0.7;
                font-size: 0.9rem;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="logo">📚 Lengua API</div>
            <div class="subtitle">Sistema de Aprendizaje de Inglés</div>
            <div class="status">🟢 API Funcionando</div>
            
            <div class="api-info">
                <h3>🔗 Endpoints Principales</h3>
                <div class="endpoint">POST /api/login/ - Login móvil</div>
                <div class="endpoint">POST /api/auth/login/ - Login web</div>
                <div class="endpoint">GET /api/auth/profile/ - Perfil usuario</div>
                <div class="endpoint">GET /api/clases/ - Lista de clases</div>
                <div class="endpoint">GET /api/mobile/info/ - Info para móviles</div>
            </div>
            
            <div class="api-info">
                <h3>📱 Plataformas Soportadas</h3>
                <p>✅ Aplicación Web React</p>
                <p>✅ Aplicación Móvil Android</p>
                <p>✅ APIs REST completas</p>
            </div>
            
            <div class="footer">
                <p>© 2025 Lengua - Sistema de Aprendizaje</p>
                <p>Desarrollado con Django REST Framework</p>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)

def favicon_view(request):
    """
    Favicon simple para evitar errores 404
    """
    # SVG favicon simple
    svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" fill="#667eea"/>
        <text x="50" y="60" font-family="Arial" font-size="40" fill="white" text-anchor="middle">L</text>
    </svg>'''
    return HttpResponse(svg_content, content_type="image/svg+xml")

@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """
    Endpoint unificado para autenticar usuarios de todos los roles y generar tokens JWT
    """
    print(f"Login request data: {request.data}")  # Debug
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Serializar datos del usuario con rol incluido
        user_serializer = UserSerializer(user)
        user_data = user_serializer.data
        
        # Asegurar que el rol esté correctamente asignado
        if user.is_profesor and user.role == 'student':
            user.role = 'profesor'
            user.save()
        
        return Response({
            'success': True,
            'token': str(access_token),
            'refresh': str(refresh),
            'user': user_data,
            'message': 'Login exitoso'
        }, status=status.HTTP_200_OK)
    
    print(f"Login validation errors: {serializer.errors}")  # Debug
    return Response({
        'success': False,
        'message': 'Credenciales inválidas',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def mobile_login_view(request):
    """
    Endpoint específico para aplicaciones móviles Android
    Acepta username/password y devuelve solo el token
    """
    print(f"Mobile login request data: {request.data}")  # Debug
    
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username y password son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    # Buscar usuario por correo_personal (username es el correo personal)
    try:
        user = CustomUser.objects.get(correo_personal__iexact=username)
        if user.check_password(password):
            if user.is_active:
                # Generar token JWT
                refresh = RefreshToken.for_user(user)
                access_token = refresh.access_token
                
                # Respuesta con token y rol para Android
                return Response({
                    'token': str(access_token),
                    'role': user.role if hasattr(user, 'role') else 'student'
                }, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': 'Cuenta desactivada'
                }, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_400_BAD_REQUEST)
    except CustomUser.DoesNotExist:
        return Response({
            'error': 'Credenciales inválidas'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mobile_profile_view(request):
    """
    Endpoint específico para obtener perfil de usuario en aplicaciones móviles
    Devuelve formato simple y directo
    """
    user = request.user
    
    # Asegurar que TODOS los campos sean strings, nunca None/null
    first_name = user.first_name if user.first_name else ''
    last_name = user.last_name if user.last_name else ''
    full_name = f"{first_name} {last_name}".strip()
    if not full_name:
        full_name = user.username if user.username else ''
    
    return Response({
        'id': user.id,
        'username': user.username if user.username else '',
        'email': user.email if user.email else '',
        'first_name': first_name,
        'last_name': last_name,
        'phone': user.phone if user.phone else '',
        'country': user.country if user.country else '',
        'city': user.city if user.city else '',
        'role': user.role if user.role else 'student',
        'english_level': user.english_level if user.english_level else '',
        'full_name': full_name,
        
        # Campos adicionales para perfil completo - NUNCA null
        'birth_date': user.birth_date.isoformat() if user.birth_date else '',
        'address': user.address if user.address else '',
        'learning_goals': user.learning_goals if user.learning_goals else '',
        'profile_completed': user.profile_completed if user.profile_completed is not None else False,
        'bloque_asignado': getattr(user, 'bloque_asignado', '') or '',
        'created_at': user.created_at.isoformat() if user.created_at else '',
        'correo_personal': user.correo_personal if user.correo_personal else ''
    }, status=status.HTTP_200_OK)

@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def mobile_update_profile_view(request):
    """
    Endpoint específico para actualizar perfil desde aplicaciones móviles
    Acepta formato simple con snake_case
    """
    user = request.user
    data = request.data
    
    try:
        # Actualizar campos - Soportar snake_case (formato móvil)
        if 'first_name' in data:
            user.first_name = data.get('first_name', '')
        
        if 'last_name' in data:
            user.last_name = data.get('last_name', '')
        
        if 'phone' in data:
            user.phone = data.get('phone', '')
        
        if 'country' in data:
            user.country = data.get('country', '')
        
        if 'city' in data:
            user.city = data.get('city', '')
        
        if 'english_level' in data:
            user.english_level = data.get('english_level', '')
        
        if 'birth_date' in data:
            birth_value = data.get('birth_date')
            if birth_value:
                user.birth_date = birth_value
        
        if 'cedula' in data:
            user.cedula = data.get('cedula', '')
        
        if 'address' in data:
            user.address = data.get('address', '')
        
        if 'emergency_contact' in data:
            user.emergency_contact = data.get('emergency_contact', '')
        
        if 'emergency_phone' in data:
            user.emergency_phone = data.get('emergency_phone', '')
        
        if 'learning_goals' in data:
            user.learning_goals = data.get('learning_goals', '')
        
        if 'correo_personal' in data:
            user.correo_personal = data.get('correo_personal', '')
        
        # Marcar perfil como completado
        user.profile_completed = True
        user.save()
        
        # Devolver el perfil actualizado
        first_name = user.first_name if user.first_name else ''
        last_name = user.last_name if user.last_name else ''
        full_name = f"{first_name} {last_name}".strip()
        if not full_name:
            full_name = user.username if user.username else ''
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente',
            'user': {
                'id': user.id,
                'username': user.username if user.username else '',
                'email': user.email if user.email else '',
                'first_name': first_name,
                'last_name': last_name,
                'phone': user.phone if user.phone else '',
                'country': user.country if user.country else '',
                'city': user.city if user.city else '',
                'role': user.role if user.role else 'student',
                'english_level': user.english_level if user.english_level else '',
                'full_name': full_name,
                'birth_date': user.birth_date.isoformat() if user.birth_date else '',
                'address': user.address if user.address else '',
                'learning_goals': user.learning_goals if user.learning_goals else '',
                'profile_completed': user.profile_completed if user.profile_completed is not None else False,
                'bloque_asignado': getattr(user, 'bloque_asignado', '') or '',
                'created_at': user.created_at.isoformat() if user.created_at else '',
                'correo_personal': user.correo_personal if user.correo_personal else ''
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar perfil: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mobile_classes_view(request):
    """
    Endpoint para obtener las clases del usuario autenticado
    Formato optimizado para aplicaciones móviles
    Filtra clases futuras y separa por estado
    """
    user = request.user
    
    try:
        from datetime import date
        hoy = date.today()
        
        # Obtener todas las clases del usuario
        todas_clases = user.clases.all().order_by('fecha', 'hora')
        
        # Separar clases por estado y fecha
        clases_proximas = []
        clases_completadas = []
        
        for clase in todas_clases:
            clase_data = {
                'id': clase.id,
                'nombre': clase.nombre,
                'profesor': clase.profesor,
                'fecha': clase.fecha.isoformat(),
                'hora': clase.hora,
                'duracion': clase.duracion,
                'tema': clase.tema if clase.tema else '',
                'descripcion': clase.descripcion if clase.descripcion else '',
                'tipo_clase': clase.tipo_clase,
                'modalidad': clase.modalidad,
                'meet_link': clase.meet_link if clase.meet_link else '',
                'estado': clase.estado,
                'created_at': clase.created_at.isoformat() if clase.created_at else ''
            }
            
            # Clasificar según estado y fecha
            if clase.estado == 'completada':
                clases_completadas.append(clase_data)
            elif clase.estado in ['programada', 'activa'] and clase.fecha >= hoy:
                # Solo clases futuras o de hoy
                clases_proximas.append(clase_data)
            elif clase.estado == 'programada' and clase.fecha < hoy:
                # Clases pasadas que quedaron como "programada" -> marcarlas como completadas
                clase_data['estado'] = 'completada'
                clases_completadas.append(clase_data)
            else:
                # Cualquier otro caso (clases pasadas)
                clases_completadas.append(clase_data)
        
        return Response({
            'success': True,
            'total': len(clases_proximas) + len(clases_completadas),
            'proximas': clases_proximas,
            'completadas': clases_completadas,
            'clases': clases_proximas + clases_completadas  # Mantener compatibilidad
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al obtener clases: {str(e)}',
            'clases': []
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def mobile_create_class_view(request):
    """
    Endpoint para crear una nueva clase desde aplicaciones móviles
    Admins y profesores pueden crear clases
    """
    user = request.user
    
    print(f"📝 CREATE CLASS - Usuario: {user.username} (Role: {getattr(user, 'role', 'N/A')})")
    print(f"📋 Datos recibidos: {request.data}")
    
    # Verificar que el usuario sea admin o profesor
    user_role = getattr(user, 'role', None)
    if user_role not in ['admin', 'profesor']:
        return Response({
            'success': False,
            'message': 'Solo los administradores y profesores pueden crear clases'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        # Extraer datos del request
        data = request.data.copy()
        
        # Validar campos requeridos
        required_fields = ['nombre', 'fecha', 'hora', 'duracion', 'tema', 'modalidad']
        missing_fields = [field for field in required_fields if not data.get(field)]
        
        if missing_fields:
            return Response({
                'success': False,
                'message': f'Campos requeridos faltantes: {", ".join(missing_fields)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Si es admin, puede especificar el profesor. Si es profesor, usa su propio nombre
        if user_role == 'admin':
            # Admin puede especificar el profesor en el request, o usar su propio nombre
            if 'profesor' not in data or not data['profesor']:
                data['profesor'] = f"{user.first_name} {user.last_name}" if user.first_name else user.username
            # Si el admin envió 'profesor', se usa ese valor
        else:
            # Si es profesor, siempre usa su propio nombre
            data['profesor'] = f"{user.first_name} {user.last_name}" if user.first_name else user.username
        
        # Crear la clase usando el serializer
        serializer = ClaseSerializer(data=data, context={'request': request})
        
        if serializer.is_valid():
            clase = serializer.save()
            
            # Asignar estudiantes si se proporcionaron
            if 'estudiantes' in data and data['estudiantes']:
                estudiante_ids = data['estudiantes']
                if isinstance(estudiante_ids, str):
                    estudiante_ids = [int(id.strip()) for id in estudiante_ids.split(',')]
                
                estudiantes = CustomUser.objects.filter(id__in=estudiante_ids)
                clase.estudiantes.set(estudiantes)
                print(f"✅ Asignados {estudiantes.count()} estudiantes a la clase")
            
            print(f"✅ Clase creada: {clase.nombre} (ID: {clase.id})")
            
            return Response({
                'success': True,
                'message': 'Clase creada exitosamente',
                'clase': ClaseSerializer(clase, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        
        print(f"❌ Error de validación: {serializer.errors}")
        return Response({
            'success': False,
            'message': 'Error de validación',
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
        
    except Exception as e:
        print(f"❌ Error al crear clase: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al crear clase: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mobile_professors_list_view(request):
    """
    Endpoint para obtener la lista de profesores
    Para uso en selección de profesor al programar clases (admin)
    """
    user = request.user
    
    print(f"👨‍🏫 PROFESSORS LIST - Usuario: {user.username}")
    
    try:
        # Obtener todos los profesores (usuarios con role='profesor')
        profesores = CustomUser.objects.filter(role='profesor').order_by('first_name', 'last_name')
        
        profesores_data = []
        for profesor in profesores:
            profesores_data.append({
                'id': profesor.id,
                'username': profesor.username,
                'email': profesor.email,
                'first_name': profesor.first_name or '',
                'last_name': profesor.last_name or '',
                'full_name': f"{profesor.first_name} {profesor.last_name}".strip() or profesor.username
            })
        
        print(f"✅ Total profesores encontrados: {len(profesores_data)}")
        
        return Response({
            'success': True,
            'total': len(profesores_data),
            'professors': profesores_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error al obtener profesores: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al obtener profesores: {str(e)}',
            'professors': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mobile_students_list_view(request):
    """
    Endpoint para obtener la lista de estudiantes
    Para uso en selección de estudiantes al programar clases
    """
    user = request.user
    
    print(f"👥 STUDENTS LIST - Usuario: {user.username}")
    
    try:
        # Obtener todos los estudiantes (usuarios con role='student')
        estudiantes = CustomUser.objects.filter(role='student').order_by('first_name', 'last_name')
        
        estudiantes_data = []
        for estudiante in estudiantes:
            estudiantes_data.append({
                'id': estudiante.id,
                'username': estudiante.username,
                'email': estudiante.email,
                'first_name': estudiante.first_name or '',
                'last_name': estudiante.last_name or '',
                'full_name': f"{estudiante.first_name} {estudiante.last_name}".strip() or estudiante.username
            })
        
        print(f"✅ Total estudiantes encontrados: {len(estudiantes_data)}")
        
        return Response({
            'success': True,
            'total': len(estudiantes_data),
            'students': estudiantes_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error al obtener estudiantes: {str(e)}")
        return Response({
            'success': False,
            'message': f'Error al obtener estudiantes: {str(e)}',
            'students': []
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mobile_clubs_view(request):
    """
    Endpoint para obtener los clubs del estudiante autenticado con sus materiales
    Formato optimizado para aplicaciones móviles
    """
    # Verificar si hay token en el header
    auth_header = request.headers.get('Authorization', 'NO AUTH HEADER')
    print(f"🔑 Authorization Header: {auth_header[:50]}..." if len(auth_header) > 50 else f"🔑 Authorization Header: {auth_header}")
    
    user = request.user
    print(f"🔍 MOBILE CLUBS - Usuario: {user.username} (ID: {user.id}) - Email: {user.email}")
    
    try:
        # Obtener clubs donde el usuario es estudiante o profesor
        from django.db.models import Q
        clubs = Club.objects.filter(Q(students=user) | Q(profesor=user)).distinct()
        
        print(f"📚 Total clubs encontrados: {clubs.count()}")
        if clubs.count() > 0:
            for club in clubs:
                print(f"  - Club ID {club.id}: {club.name}")
        else:
            print(f"⚠️ El usuario {user.email} NO tiene clubs asignados")
        
        # Formatear los clubs para móvil
        clubs_data = []
        for club in clubs:
            # Obtener materiales activos del club
            materiales = club.materials.filter(is_active=True).order_by('-created_at')[:10]  # Últimos 10
            
            materiales_data = []
            for material in materiales:
                # Construir URL del archivo de forma segura
                file_url = ''
                if material.file:
                    try:
                        file_url = request.build_absolute_uri(material.file.url)
                    except Exception:
                        file_url = material.file.url if material.file.url else ''
                
                materiales_data.append({
                    'id': material.id,
                    'week': material.week,
                    'title': material.title,
                    'description': material.description if material.description else '',
                    'resource_type': material.resource_type,
                    'url': material.url if material.url else '',
                    'file_url': file_url,
                    'created_at': material.created_at.isoformat() if material.created_at else ''
                })
            
            # Obtener nombre del profesor
            profesor_nombre = f"{club.profesor.first_name} {club.profesor.last_name}".strip()
            if not profesor_nombre:
                profesor_nombre = club.profesor.username
            
            clubs_data.append({
                'id': club.id,
                'name': club.name,
                'description': club.description if club.description else '',
                'profesor': profesor_nombre,
                'total_students': club.students.count(),
                'materials': materiales_data,
                'created_at': club.created_at.isoformat() if club.created_at else ''
            })
        
        print(f"✅ Enviando {len(clubs_data)} clubs al cliente")
        
        return Response({
            'success': True,
            'total': len(clubs_data),
            'clubs': clubs_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ ERROR en mobile_clubs_view: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'message': f'Error al obtener clubs: {str(e)}',
            'clubs': []
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def mobile_evaluations_view(request):
    """
    Endpoint para obtener las evaluaciones asignadas al estudiante autenticado
    Formato optimizado para aplicaciones móviles
    """
    user = request.user
    print(f"🔍 MOBILE EVALUATIONS - Usuario: {user.username} (ID: {user.id})")
    
    try:
        # Obtener todas las evaluaciones asignadas al usuario
        # Soportar ambos estados: 'publicada' y 'published' (por inconsistencia en BD)
        from django.db.models import Q
        evaluaciones = user.evaluaciones_asignadas.filter(
            Q(estado='publicada') | Q(estado='published')
        ).order_by('-fecha_limite')
        
        print(f"📚 Total evaluaciones encontradas: {evaluaciones.count()}")
        
        # Formatear las evaluaciones para móvil
        evaluaciones_data = []
        for evaluacion in evaluaciones:
            # Verificar si el estudiante ya entregó la evaluación
            respuesta = evaluacion.respuestas.filter(estudiante=user).first()
            
            # Determinar estado de la evaluación para el estudiante
            if respuesta and respuesta.completado:
                estado_estudiante = 'entregada'
                fecha_entrega = respuesta.fecha_envio.isoformat() if respuesta.fecha_envio else ''
                calificacion = float(respuesta.calificacion) if respuesta.calificacion else None
            else:
                estado_estudiante = 'pendiente'
                fecha_entrega = ''
                calificacion = None
            
            # Obtener nombre completo del profesor
            profesor_nombre = f"{evaluacion.profesor.first_name} {evaluacion.profesor.last_name}".strip()
            if not profesor_nombre:
                profesor_nombre = evaluacion.profesor.username
            
            # Construir URL del archivo de forma segura
            archivo_url = ''
            if evaluacion.archivo:
                try:
                    archivo_url = request.build_absolute_uri(evaluacion.archivo.url)
                except Exception:
                    # Si falla build_absolute_uri, usar URL relativa
                    archivo_url = evaluacion.archivo.url if evaluacion.archivo.url else ''
            
            evaluaciones_data.append({
                'id': evaluacion.id,
                'titulo': evaluacion.titulo,
                'descripcion': evaluacion.descripcion if evaluacion.descripcion else '',
                'tipo': evaluacion.tipo,
                'profesor': profesor_nombre,
                'fecha_limite': evaluacion.fecha_limite.isoformat() if evaluacion.fecha_limite else '',
                'archivo_url': archivo_url,
                'estado_estudiante': estado_estudiante,
                'fecha_entrega': fecha_entrega,
                'calificacion': calificacion,
                'created_at': evaluacion.created_at.isoformat() if evaluacion.created_at else ''
            })
        
        print(f"✅ Enviando {len(evaluaciones_data)} evaluaciones al cliente")
        
        return Response({
            'success': True,
            'total': len(evaluaciones_data),
            'evaluaciones': evaluaciones_data
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ ERROR en mobile_evaluations_view: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'success': False,
            'message': f'Error al obtener evaluaciones: {str(e)}',
            'evaluaciones': []
        }, status=status.HTTP_400_BAD_REQUEST)

# ==================== RESET DE CONTRASEÑA (PÚBLICO) ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def request_password_reset_view(request):
    """
    Solicita un restablecimiento de contraseña enviando un token.
    - Entrada: { email }
    - Salida: { success, message, reset_link? } (reset_link incluido solo en dev para conveniencia)
    """
    email = (request.data.get('email') or '').strip().lower()
    # Respuesta genérica para evitar enumeración de usuarios
    generic_response = Response({
        'success': True,
        'message': 'Si el correo existe, se han enviado instrucciones.'
    }, status=status.HTTP_200_OK)

    if not email:
        return Response({
            'success': False,
            'message': 'Email requerido'
        }, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Buscar PRIMERO por correo personal (ahora es el campo principal de login)
        user = CustomUser.objects.get(correo_personal__iexact=email)
    except CustomUser.DoesNotExist:
        try:
            # Buscar por email institucional como fallback
            user = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            # Intentar mapear por parte local a dominios institucionales
            try:
                local_part = email.split('@')[0]
                candidate_emails = [
                    f"{local_part}@thelanguage.co",
                    f"{local_part}@soy.thelanguage.co",
                ]
                user = CustomUser.objects.filter(email__in=candidate_emails).first()
                if not user:
                    return generic_response
            except Exception:
                return generic_response

    try:
        from .email_utils import send_password_reset_email
        
        token_generator = PasswordResetTokenGenerator()
        uid = urlsafe_base64_encode(force_bytes(user.pk))
        token = token_generator.make_token(user)
        # Formato token combinado para el frontend: uid.token
        combined = f"{uid}.{token}"
        
        # Determinar el correo de destino (SIEMPRE correo personal primero)
        email_destino = user.correo_personal if user.correo_personal else user.email
        
        # Link completo para el frontend
        reset_link = f"http://localhost:5173/new-password?token={combined}"
        
        # Nombre del usuario
        user_name = f"{user.first_name} {user.last_name}".strip() or user.username
        
        # Enviar email usando la utilidad de Django
        try:
            send_password_reset_email(
                user_email=email_destino,
                user_name=user_name,
                reset_link=reset_link
            )
            return Response({
                'success': True,
                'message': 'Se han enviado instrucciones a tu correo.',
                'reset_link': reset_link  # Solo para desarrollo/testing
            }, status=status.HTTP_200_OK)
        except Exception as email_error:
            # Si falla el envío, devolver el token para desarrollo
            print(f"⚠️ Error al enviar email de recuperación: {str(email_error)}")
            return Response({
                'success': True,
                'message': 'Se han enviado instrucciones a tu correo.',
                'token': combined,  # Solo para desarrollo
                'reset_link': reset_link,  # Solo para desarrollo
                'email_error': str(email_error)  # Solo para desarrollo
            }, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({
            'success': False,
            'message': f'No se pudo generar el token: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def reset_password_view(request):
    """
    Confirma el restablecimiento con token y nueva contraseña.
    - Entrada: { token: "<uid>.<token>", new_password }
    """
    combined = (request.data.get('token') or '').strip()
    new_password = request.data.get('new_password') or ''

    if not combined or '.' not in combined:
        return Response({ 'success': False, 'message': 'Token inválido' }, status=status.HTTP_400_BAD_REQUEST)
    if not new_password or len(new_password) < 8:
        return Response({ 'success': False, 'message': 'Contraseña inválida (mínimo 8 caracteres)' }, status=status.HTTP_400_BAD_REQUEST)

    uidb64, token = combined.split('.', 1)
    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = CustomUser.objects.get(pk=uid)
    except Exception:
        return Response({ 'success': False, 'message': 'Token inválido' }, status=status.HTTP_400_BAD_REQUEST)

    token_generator = PasswordResetTokenGenerator()
    if not token_generator.check_token(user, token):
        return Response({ 'success': False, 'message': 'Token inválido o expirado' }, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({ 'success': True, 'message': 'Contraseña actualizada correctamente.' }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_token_view(request):
    """
    Endpoint para verificar si el token JWT es válido
    """
    user_serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """
    Endpoint para cambiar la contraseña del usuario autenticado
    """
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Error al cambiar contraseña',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_profile_view(request):
    """
    Endpoint para obtener el perfil del usuario autenticado
    """
    user_serializer = UserSerializer(request.user)
    return Response({
        'success': True,
        'user': user_serializer.data
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    """
    Endpoint para actualizar la información adicional del usuario
    """
    user = request.user
    data = request.data
    
    try:
        # Actualizar campos del usuario - Soportar camelCase y snake_case
        # Nombre
        if 'firstName' in data or 'first_name' in data:
            user.first_name = data.get('firstName') or data.get('first_name', '')
        
        # Apellido
        if 'lastName' in data or 'last_name' in data:
            user.last_name = data.get('lastName') or data.get('last_name', '')
        
        # Fecha de nacimiento
        if 'birthDate' in data or 'birth_date' in data:
            birth_value = data.get('birthDate') or data.get('birth_date')
            if birth_value:
                user.birth_date = birth_value
        
        # Cédula
        if 'cedula' in data:
            user.cedula = data.get('cedula', '')
        
        # Teléfono
        if 'phone' in data:
            user.phone = data.get('phone', '')
        
        # Dirección
        if 'address' in data:
            user.address = data.get('address', '')
        
        # Ciudad
        if 'city' in data:
            user.city = data.get('city', '')
        
        # País
        if 'country' in data:
            user.country = data.get('country', '')
        
        # Contacto de emergencia
        if 'emergencyContact' in data or 'emergency_contact' in data:
            user.emergency_contact = data.get('emergencyContact') or data.get('emergency_contact', '')
        
        # Teléfono de emergencia
        if 'emergencyPhone' in data or 'emergency_phone' in data:
            user.emergency_phone = data.get('emergencyPhone') or data.get('emergency_phone', '')
        
        # ✅ NIVEL DE INGLÉS - Soportar ambos formatos
        if 'englishLevel' in data or 'english_level' in data:
            user.english_level = data.get('englishLevel') or data.get('english_level', '')
        
        # ✅ OBJETIVOS DE APRENDIZAJE - Soportar ambos formatos
        if 'learningGoals' in data or 'learning_goals' in data:
            user.learning_goals = data.get('learningGoals') or data.get('learning_goals', '')
        
        # ✅ CORREO PERSONAL - Agregar soporte
        if 'correoPersonal' in data or 'correo_personal' in data:
            user.correo_personal = data.get('correoPersonal') or data.get('correo_personal', '')
        
        # Marcar perfil como completado
        user.profile_completed = True
        user.save()
        
        return Response({
            'success': True,
            'message': 'Perfil actualizado exitosamente'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'success': False,
            'message': f'Error al actualizar perfil: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


# ==================== ENDPOINTS PARA PROFESORES ====================

@api_view(['POST'])
@permission_classes([AllowAny])
def profesor_login_view(request):
    """
    Endpoint para autenticar profesores y generar tokens JWT
    """
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        
        # Verificar que el usuario sea profesor
        if not user.is_profesor:
            return Response({
                'success': False,
                'message': 'Este usuario no tiene permisos de profesor'
            }, status=status.HTTP_403_FORBIDDEN)
        
        # Generar tokens JWT
        refresh = RefreshToken.for_user(user)
        access_token = refresh.access_token
        
        # Obtener información del profesor
        try:
            profesor_profile = user.profesor_profile
            profesor_data = {
                'id': str(user.id),
                'email': user.email,
                'nombre': f"{user.first_name} {user.last_name}",
                'especialidad': profesor_profile.especialidad,
                'is_profesor': True,
                'telefono': profesor_profile.telefono,
                'biografia': profesor_profile.biografia,
                'experiencia': profesor_profile.experiencia_anos,
                'certificaciones': profesor_profile.certificaciones
            }
        except Profesor.DoesNotExist:
            profesor_data = {
                'id': str(user.id),
                'email': user.email,
                'nombre': f"{user.first_name} {user.last_name}",
                'especialidad': 'No especificada',
                'is_profesor': True
            }
        
        return Response({
            'success': True,
            'access': str(access_token),
            'refresh': str(refresh),
            'user': profesor_data,
            'message': 'Login de profesor exitoso'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Credenciales inválidas',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profesor_verify_token_view(request):
    """
    Endpoint para verificar si el token JWT de profesor es válido
    """
    user = request.user
    
    if not user.is_profesor:
        return Response({
            'success': False,
            'message': 'Token no válido para profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    return Response({
        'success': True,
        'user': {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'is_profesor': True
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def profesor_profile_view(request):
    """
    Endpoint para obtener el perfil del profesor autenticado
    """
    user = request.user
    
    if not user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    try:
        profesor_profile = user.profesor_profile
        profesor_data = {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'especialidad': profesor_profile.especialidad,
            'biografia': profesor_profile.biografia,
            'experiencia_anos': profesor_profile.experiencia_anos,
            'certificaciones': profesor_profile.certificaciones,
            'telefono': profesor_profile.telefono,
            'disponibilidad': profesor_profile.disponibilidad,
            'tarifa_por_hora': str(profesor_profile.tarifa_por_hora),
            'is_profesor': True
        }
    except Profesor.DoesNotExist:
        profesor_data = {
            'id': str(user.id),
            'email': user.email,
            'nombre': f"{user.first_name} {user.last_name}",
            'especialidad': 'No especificada',
            'is_profesor': True
        }
    
    return Response({
        'success': True,
        'user': profesor_data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def daily_challenges_view(request):
    """Devuelve la lista de retos diarios configurados en el admin"""
    # Obtener preguntas activas
    challenges_qs = DailyChallengeQuestion.objects.filter(activo=True)

    # Convertir a lista para poder barajar
    challenges = list(challenges_qs)

    # Barajar para que no siempre salgan en el mismo orden
    try:
        import random
        random.shuffle(challenges)
    except Exception:
        pass

    # Limitar a un máximo razonable (por ejemplo 20)
    challenges = challenges[:20]

    data = []
    for ch in challenges:
        opciones = [
            ch.opcion_a,
            ch.opcion_b,
            ch.opcion_c,
            ch.opcion_d,
        ]
        # Filtrar opciones vacías
        opciones = [opt for opt in opciones if opt]

        # Mapear respuesta correcta a índice
        correct_index = 0
        mapa = {'A': 0, 'B': 1, 'C': 2, 'D': 3}
        if ch.respuesta_correcta in mapa:
            correct_index = mapa[ch.respuesta_correcta]

        data.append({
            'id': ch.id,
            'question': ch.pregunta,
            'options': opciones,
            'correct_answer': correct_index,
            'explanation': ch.explicacion or '',
            'category': ch.categoria,
            'level': ch.nivel or '',
        })

    return Response({
        'success': True,
        'data': data
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gamificacion_estado_view(request):
    user = request.user

    return Response({
        'success': True,
        'data': {
            'total_dulces': getattr(user, 'total_dulces', 0) or 0,
            'total_xp': getattr(user, 'total_xp', 0) or 0,
            'reto_racha_actual': getattr(user, 'reto_racha_actual', 0) or 0,
            'reto_mejor_racha': getattr(user, 'reto_mejor_racha', 0) or 0,
            'reto_ultima_fecha': user.reto_ultima_fecha.isoformat() if getattr(user, 'reto_ultima_fecha', None) else None,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gamificacion_reto_diario_view(request):
    user = request.user

    hoy = timezone.localdate()
    ultima_fecha = getattr(user, 'reto_ultima_fecha', None)
    racha_actual = getattr(user, 'reto_racha_actual', 0) or 0
    mejor_racha = getattr(user, 'reto_mejor_racha', 0) or 0

    if ultima_fecha == hoy:
        return Response({
            'success': False,
            'message': 'Ya reclamaste la recompensa del reto diario hoy',
            'data': {
                'total_dulces': user.total_dulces,
                'total_xp': user.total_xp,
                'reto_racha_actual': racha_actual,
                'reto_mejor_racha': mejor_racha,
                'reto_ultima_fecha': ultima_fecha.isoformat() if ultima_fecha else None,
            }
        }, status=status.HTTP_200_OK)

    if ultima_fecha == hoy - timedelta(days=1):
        racha_actual += 1
    else:
        racha_actual = 1

    if racha_actual > mejor_racha:
        mejor_racha = racha_actual

    dulces_base = 5
    xp_base = 15
    dulces_bonus = 0
    xp_bonus = 0
    completó_ciclo = False

    if racha_actual >= 15:
        dulces_bonus += 25
        xp_bonus += 80
        racha_actual = 0
        completó_ciclo = True

    user.total_dulces = (getattr(user, 'total_dulces', 0) or 0) + dulces_base + dulces_bonus
    user.total_xp = (getattr(user, 'total_xp', 0) or 0) + xp_base + xp_bonus
    user.reto_racha_actual = racha_actual
    user.reto_mejor_racha = mejor_racha
    user.reto_ultima_fecha = hoy
    user.save(update_fields=['total_dulces', 'total_xp', 'reto_racha_actual', 'reto_mejor_racha', 'reto_ultima_fecha'])

    return Response({
        'success': True,
        'message': 'Recompensa de reto diario aplicada',
        'data': {
            'total_dulces': user.total_dulces,
            'total_xp': user.total_xp,
            'reto_racha_actual': user.reto_racha_actual,
            'reto_mejor_racha': user.reto_mejor_racha,
            'reto_ultima_fecha': user.reto_ultima_fecha.isoformat() if user.reto_ultima_fecha else None,
            'dulces_ganados': dulces_base + dulces_bonus,
            'xp_ganado': xp_base + xp_bonus,
            'bonus_aplicado': completó_ciclo,
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def gamificacion_mision_view(request):
    user = request.user

    dulces_mision = 20
    xp_mision = 30

    user.total_dulces = (getattr(user, 'total_dulces', 0) or 0) + dulces_mision
    user.total_xp = (getattr(user, 'total_xp', 0) or 0) + xp_mision
    user.save(update_fields=['total_dulces', 'total_xp'])

    return Response({
        'success': True,
        'message': 'Recompensa de misión aplicada',
        'data': {
            'total_dulces': user.total_dulces,
            'total_xp': user.total_xp,
            'dulces_ganados': dulces_mision,
            'xp_ganado': xp_mision,
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def gamificacion_ranking_retos_view(request):
    """Ranking global de estudiantes por retos diarios.

    Permite filtrar por nivel de inglés usando ?nivel=A1, A1+, etc.
    Lee directamente de la tabla api_customuser para evitar depender
    de campos adicionales en el modelo CustomUser.
    """

    nivel = request.query_params.get('nivel') or request.query_params.get('level')

    params = ['student', True]
    nivel_filter_sql = ''
    if nivel:
        nivel_filter_sql = 'AND (english_level = %s)'  # nivel exacto
        params.append(nivel)

    with connection.cursor() as cursor:
        cursor.execute(
            f"""
            SELECT
                id,
                first_name,
                last_name,
                email,
                english_level,
                total_dulces,
                total_xp,
                reto_mejor_racha,
                COALESCE(reto_completados_total, 0) AS reto_completados_total,
                COALESCE(reto_fallidos_total, 0)   AS reto_fallidos_total
            FROM api_customuser
            WHERE role = %s
              AND is_active = %s
              {nivel_filter_sql}
            ORDER BY
              reto_completados_total DESC,
              reto_mejor_racha DESC,
              total_xp DESC,
              last_name ASC,
              first_name ASC
            LIMIT 100
            """,
            params,
        )

        columns = [col[0] for col in cursor.description]
        rows = [dict(zip(columns, row)) for row in cursor.fetchall()]

    # Normalizar datos para el frontend
    ranking = [
        {
            'id': row['id'],
            'full_name': f"{row.get('first_name') or ''} {row.get('last_name') or ''}".strip(),
            'email': row.get('email') or '',
            'nivel': row.get('english_level') or '',
            'total_dulces': row.get('total_dulces') or 0,
            'total_xp': row.get('total_xp') or 0,
            'reto_mejor_racha': row.get('reto_mejor_racha') or 0,
            'reto_completados_total': row.get('reto_completados_total') or 0,
            'reto_fallidos_total': row.get('reto_fallidos_total') or 0,
        }
        for row in rows
    ]

    return Response({
        'success': True,
        'data': ranking,
    }, status=status.HTTP_200_OK)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def daily_challenges_admin_list_create_view(request):
    """Lista y crea retos diarios (solo admins)."""
    if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
        return Response({
            'success': False,
            'message': 'Solo administradores pueden gestionar retos diarios'
        }, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        queryset = DailyChallengeQuestion.objects.all().order_by('-created_at')
        serializer = DailyChallengeQuestionSerializer(queryset, many=True)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)

    # POST - crear
    serializer = DailyChallengeQuestionSerializer(data=request.data)
    if serializer.is_valid():
        challenge = serializer.save()
        return Response({
            'success': True,
            'data': DailyChallengeQuestionSerializer(challenge).data
        }, status=status.HTTP_201_CREATED)

    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'PATCH', 'DELETE'])
@permission_classes([IsAuthenticated])
def daily_challenges_admin_detail_view(request, pk):
    """Detalle/actualización/eliminación de un reto diario (solo admins)."""
    if not (request.user.is_staff or getattr(request.user, 'role', None) == 'admin'):
        return Response({
            'success': False,
            'message': 'Solo administradores pueden gestionar retos diarios'
        }, status=status.HTTP_403_FORBIDDEN)

    try:
        challenge = DailyChallengeQuestion.objects.get(pk=pk)
    except DailyChallengeQuestion.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Reto no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = DailyChallengeQuestionSerializer(challenge)
        return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)

    if request.method in ['PUT', 'PATCH']:
        partial = request.method == 'PATCH'
        serializer = DailyChallengeQuestionSerializer(challenge, data=request.data, partial=partial)
        if serializer.is_valid():
            challenge = serializer.save()
            return Response({'success': True, 'data': DailyChallengeQuestionSerializer(challenge).data}, status=status.HTTP_200_OK)
        return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

    # DELETE
    challenge.delete()
    return Response({'success': True, 'message': 'Reto eliminado correctamente'}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def profesor_change_password_view(request):
    """
    Endpoint para cambiar la contraseña del profesor autenticado
    """
    if not request.user.is_profesor:
        return Response({
            'success': False,
            'message': 'Usuario no es profesor'
        }, status=status.HTTP_403_FORBIDDEN)
    
    serializer = ChangePasswordSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        user = request.user
        new_password = serializer.validated_data['new_password']
        
        # Cambiar contraseña
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'message': 'Error al cambiar contraseña',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


# ==================== ENDPOINTS PARA CLASES ====================

class ClaseViewSet(viewsets.ModelViewSet):
    queryset = Clase.objects.all()
    serializer_class = ClaseSerializer

    def get_queryset(self):
        usuario_id = self.request.query_params.get('usuario')
        if usuario_id:
            return Clase.objects.filter(estudiantes__id=usuario_id)
        return super().get_queryset().order_by('-created_at')
    
    def create(self, request, *args, **kwargs):
        """Crear clase asegurando asignación de estudiantes y enviar notificaciones."""
        # Hacer una copia mutable de los datos
        data = request.data.copy()

        # Compatibilidad: si solo viene "estudiantes" pero no "estudiantesSeleccionados",
        # mapearlo al campo que usa el serializer para poblar el ManyToMany
        if 'estudiantesSeleccionados' not in data and data.get('estudiantes'):
            data['estudiantesSeleccionados'] = data.get('estudiantes')

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        headers = self.get_success_headers(serializer.data)
        response = Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        # Si la creación fue exitosa, enviar notificaciones
        if response.status_code == status.HTTP_201_CREATED:
            clase = Clase.objects.get(id=response.data['id'])

            # Crear notificación para cada estudiante asignado
            for estudiante in clase.estudiantes.all():
                NotificacionEstudiante.objects.create(
                    estudiante=estudiante,
                    tipo='clase_programada',
                    mensaje=f'Nueva clase programada: {clase.tema} el {clase.fecha} a las {clase.hora}',
                    datos_adicionales={
                        'clase_id': clase.id,
                        'tema': clase.tema,
                        'fecha': str(clase.fecha),
                        'hora': clase.hora,
                        'meet_link': clase.meet_link
                    }
                )

        return response
    
    @action(detail=True, methods=['patch'])
    def cambiar_estado(self, request, pk=None):
        """
        Endpoint para cambiar el estado de una clase (programada -> activa -> completada)
        """
        clase = self.get_object()
        nuevo_estado = request.data.get('estado')
        
        if nuevo_estado not in ['programada', 'activa', 'completada']:
            return Response({'error': 'Estado inválido'}, status=status.HTTP_400_BAD_REQUEST)
        
        clase.estado = nuevo_estado
        clase.save()
        
        serializer = self.get_serializer(clase)
        return Response(serializer.data)


@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint para registrar un nuevo usuario (estudiante, profesor o admin)
    """
    from .serializers import MobileUserSerializer
    from .email_utils import send_welcome_email
    
    # Log para depuración
    print("=" * 50)
    print("📝 REGISTRO DE USUARIO - Datos recibidos:")
    print(f"Data: {request.data}")
    print("=" * 50)
    
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Enviar email de bienvenida al correo personal
        if user.correo_personal:
            try:
                # Mapeo de roles para mostrar en español
                role_names = {
                    'student': 'Estudiante',
                    'profesor': 'Profesor',
                    'admin': 'Administrador',
                    'financiero': 'Financiero'
                }
                user_role = role_names.get(user.role, user.role)
                user_name = f"{user.first_name} {user.last_name}".strip() or user.username
                
                # Obtener la contraseña del request (solo disponible en este momento)
                temporary_password = request.data.get('password', '')
                
                # Enviar email de bienvenida
                send_welcome_email(
                    user_email=user.correo_personal,
                    user_name=user_name,
                    user_role=user_role,
                    temporary_password=temporary_password,
                    login_url='http://localhost:5173'  # Cambiar en producción
                )
                print(f"📧 Email de bienvenida enviado a: {user.correo_personal}")
            except Exception as e:
                print(f"⚠️ No se pudo enviar el email de bienvenida: {str(e)}")
                # No fallar el registro si el email falla
        
        user_serializer = MobileUserSerializer(user)
        return Response({
            'success': True,
            'user': user_serializer.data,
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)
    else:
        print("❌ ERRORES DE VALIDACIÓN:")
        print(serializer.errors)
        print("=" * 50)
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def user_evaluations_view(request):
    """
    List evaluations/quizzes for the current user
    """
    evaluations = Evaluation.objects.filter(usuario=request.user)
    serializer = EvaluationSerializer(evaluations, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_user_active_view(request, user_id):
    """
    Endpoint para activar o desactivar un usuario por su id
    """
    try:
        user = CustomUser.objects.get(id=user_id)
        user.is_active = not user.is_active
        user.save()
        return Response({
            'success': True,
            'is_active': user.is_active,
            'message': f'Usuario {"activado" if user.is_active else "desactivado"} correctamente.'
        }, status=status.HTTP_200_OK)
    except CustomUser.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Usuario no encontrado.'
        }, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users_view(request):
    """
    Endpoint para listar todos los usuarios
    """
    from .serializers import MobileUserSerializer
    users = CustomUser.objects.all().order_by('-date_joined')
    serializer = MobileUserSerializer(users, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_stats_view(request):
    """Devuelve estadísticas generales para el dashboard del administrador"""
    user = request.user
    if not (getattr(user, 'role', None) == 'admin' or user.is_staff):
        return Response({
            'success': False,
            'message': 'Solo administradores pueden ver estas estadísticas'
        }, status=status.HTTP_403_FORBIDDEN)

    today = timezone.now().date()
    start_of_month = today.replace(day=1)

    # Total de estudiantes activos
    total_students = CustomUser.objects.filter(role='student', is_active=True).count()

    # Clases programadas (hoy en adelante) con estado programada o activa
    scheduled_classes = Clase.objects.filter(
        fecha__gte=today,
        estado__in=['programada', 'activa']
    ).count()

    # Ingresos del mes: ventas pagadas en el mes actual
    from .models import Venta
    ventas_mes = Venta.objects.filter(
        estado='pagado',
        fecha_venta__date__gte=start_of_month,
        fecha_venta__date__lte=today
    ).aggregate(total=Sum('precio_total'))

    monthly_revenue = float(ventas_mes['total'] or 0)

    return Response({
        'success': True,
        'data': {
            'total_students': total_students,
            'scheduled_classes': scheduled_classes,
            'monthly_revenue': monthly_revenue,
            'month_start': start_of_month.isoformat(),
            'today': today.isoformat(),
        }
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_dashboard_charts_view(request):
    """Devuelve datos agregados para las gráficas del dashboard admin"""
    user = request.user
    if not (getattr(user, 'role', None) == 'admin' or user.is_staff):
        return Response({
            'success': False,
            'message': 'Solo administradores pueden ver estas estadísticas'
        }, status=status.HTTP_403_FORBIDDEN)

    today = timezone.now().date()

    # ========== 1) NUEVOS ESTUDIANTES Y EGRESADOS POR MES ==========
    # Agrupar últimos 6 meses por month (date)
    new_qs = CustomUser.objects.filter(
        role='student',
        date_joined__isnull=False
    ).annotate(month=TruncMonth('date_joined')).values('month').annotate(count=Count('id')).order_by('month')

    removed_qs = RegistroEliminacion.objects.annotate(
        month=TruncMonth('fecha_eliminacion')
    ).values('month').annotate(count=Count('id')).order_by('month')

    months = sorted({e['month'] for e in new_qs} | {e['month'] for e in removed_qs})
    # Limitar a los últimos 6 meses
    months = months[-6:]

    def month_label(dt):
        return dt.strftime('%b %Y') if dt else ''

    new_map = {e['month']: e['count'] for e in new_qs}
    removed_map = {e['month']: e['count'] for e in removed_qs}

    students_monthly = {
        'labels': [month_label(m) for m in months],
        'new': [new_map.get(m, 0) for m in months],
        'removed': [removed_map.get(m, 0) for m in months],
    }

    # ========== 2) DISTRIBUCIÓN POR NIVEL ==========
    level_qs = CustomUser.objects.filter(role='student', is_active=True).values('english_level').annotate(count=Count('id')).order_by('english_level')

    level_distribution = {
        'labels': [e['english_level'] or 'Sin nivel' for e in level_qs],
        'counts': [e['count'] for e in level_qs],
    }

    # ========== 3) ASISTENCIA PROMEDIO POR MES ==========
    asistencia_qs = Asistencia.objects.annotate(month=TruncMonth('fecha')).values('month').annotate(
        total=Count('id'),
        presentes=Count('id', filter=Q(estado='presente')),
    ).order_by('month')

    months_att = [e['month'] for e in asistencia_qs][-6:]
    att_map = {e['month']: e for e in asistencia_qs}

    attendance_monthly_labels = []
    attendance_percentages = []
    for m in months_att:
        row = att_map[m]
        total = row['total'] or 0
        presentes = row['presentes'] or 0
        pct = round((presentes / total * 100), 1) if total > 0 else 0
        attendance_monthly_labels.append(month_label(m))
        attendance_percentages.append(pct)

    attendance_monthly = {
        'labels': attendance_monthly_labels,
        'percentage': attendance_percentages,
    }

    # ========== 4) PROGRESO PROMEDIO POR NIVEL ==========
    subs = Suscripcion.objects.select_related('estudiante')
    level_progress_map: dict[str, dict[str, float]] = {}

    for s in subs:
        level = getattr(s.estudiante, 'english_level', None) or 'Sin nivel'
        progreso = s.progreso_porcentaje
        if level not in level_progress_map:
            level_progress_map[level] = {'sum': 0.0, 'count': 0}
        level_progress_map[level]['sum'] += float(progreso)
        level_progress_map[level]['count'] += 1

    level_labels = []
    level_averages = []
    for level, agg in level_progress_map.items():
        level_labels.append(level)
        if agg['count'] > 0:
            level_averages.append(round(agg['sum'] / agg['count'], 1))
        else:
            level_averages.append(0)

    level_progress = {
        'labels': level_labels,
        'averages': level_averages,
    }

    return Response({
        'success': True,
        'data': {
            'students_monthly': students_monthly,
            'level_distribution': level_distribution,
            'attendance_monthly': attendance_monthly,
            'level_progress': level_progress,
        }
    }, status=status.HTTP_200_OK)


# ==================== ENDPOINTS PARA GALERÍA ====================

class MediaItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet para CRUD completo de elementos multimedia
    """
    queryset = MediaItem.objects.filter(is_active=True)
    serializer_class = MediaItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        """
        Solo lectura para todos, escritura solo para admin
        """
        if self.action in ['list', 'retrieve']:
            permission_classes = [AllowAny]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Guardar el elemento multimedia
        """
        print("=" * 50)
        print("📸 CREAR ELEMENTO MULTIMEDIA")
        print(f"Data recibida: {self.request.data}")
        print(f"Files: {self.request.FILES}")
        print("=" * 50)
        
        if not serializer.is_valid():
            print("❌ ERRORES DE VALIDACIÓN:")
            print(serializer.errors)
            print("=" * 50)
        
        serializer.save()
    
    def perform_destroy(self, instance):
        """
        Soft delete - marcar como inactivo en lugar de eliminar
        """
        instance.is_active = False
        instance.save()


@api_view(['GET'])
@permission_classes([AllowAny])
def gallery_list_view(request):
    """
    Endpoint público para obtener todos los elementos de la galería
    Formato optimizado para aplicaciones móviles
    """
    print(f"🖼️ GALLERY LIST - Obteniendo elementos de galería")
    
    media_items = MediaItem.objects.filter(is_active=True).order_by('-created_at')
    serializer = MediaItemSerializer(media_items, many=True, context={'request': request})
    
    print(f"📊 Total elementos encontrados: {media_items.count()}")
    
    return Response({
        'success': True,
        'total': media_items.count(),
        'items': serializer.data
    }, status=status.HTTP_200_OK)


# ==================== ENDPOINTS PARA CLUBS (CLB) ====================

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def clubs_list_view(request):
    """
    Listar clubs visibles para el usuario actual.
    - Si es profesor: clubs donde es profesor.
    - Si es estudiante: clubs a los que pertenece.
    - Si es admin: todos.
    """
    user = request.user
    if getattr(user, 'role', None) == 'admin':
        qs = Club.objects.all()
    elif getattr(user, 'is_profesor', False) or getattr(user, 'role', None) == 'profesor':
        qs = Club.objects.filter(profesor=user)
    else:
        qs = Club.objects.filter(students=user)

    serializer = ClubSerializer(qs.order_by('-updated_at'), many=True, context={'request': request})
    return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def club_create_view(request):
    """Crear club (solo admin o profesor)."""
    user = request.user
    data = request.data.copy()
    # Si es profesor, fijar profesor = user
    if getattr(user, 'role', None) != 'admin':
        data['profesor'] = str(user.id)

    serializer = ClubSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        club = serializer.save()
        return Response({'success': True, 'data': ClubSerializer(club, context={'request': request}).data}, status=status.HTTP_201_CREATED)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def club_update_view(request, club_id):
    """Actualizar datos de un club (nombre, descripción).

    Solo puede hacerlo el profesor dueño del club o un administrador.
    """
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ClubSerializer(club, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        club = serializer.save()
        return Response({'success': True, 'data': ClubSerializer(club, context={'request': request}).data}, status=status.HTTP_200_OK)
    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def club_delete_view(request, club_id):
    """Eliminar completamente un club.

    Solo el profesor dueño o un admin pueden eliminarlo.
    """
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    club.delete()
    return Response({'success': True, 'message': 'Club eliminado correctamente'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def club_students_list_view(request, club_id):
    """Listar estudiantes asignados a un club (profesor del club, admin o el propio estudiante podrá verse)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin' or user in club.students.all()):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    students = club.students.all()
    # Limitar campos en respuesta
    data = UserSerializer(students, many=True).data
    return Response({'success': True, 'data': data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def club_add_student_view(request, club_id):
    """Agregar estudiante por email al club (solo profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    user_id = request.data.get('user_id')
    email = request.data.get('email')
    student = None
    if user_id:
        try:
            student = CustomUser.objects.get(pk=int(user_id))
        except (ValueError, CustomUser.DoesNotExist):
            return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    elif email:
        try:
            student = CustomUser.objects.get(email__iexact=email)
        except CustomUser.DoesNotExist:
            return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response({'success': False, 'message': 'Debe proporcionar user_id o email'}, status=status.HTTP_400_BAD_REQUEST)

    club.students.add(student)
    return Response({'success': True, 'message': 'Estudiante agregado'}, status=status.HTTP_200_OK)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def club_remove_student_view(request, club_id, user_id):
    """Remover estudiante del club (solo profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    try:
        student = CustomUser.objects.get(pk=user_id)
    except CustomUser.DoesNotExist:
        return Response({'success': False, 'message': 'Usuario no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    club.students.remove(student)
    return Response({'success': True, 'message': 'Estudiante removido'}, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def club_materials_list_view(request, club_id):
    """Listar materiales activos de un club visible para el usuario."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    # Permisos básicos de lectura
    if not (user == club.profesor or user in club.students.all() or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    mats = club.materials.filter(is_active=True)
    serializer = ClubMaterialSerializer(mats, many=True, context={'request': request})
    return Response({'success': True, 'data': serializer.data}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def club_material_create_view(request, club_id):
    """Crear material en un club (profesor del club o admin)."""
    try:
        club = Club.objects.get(pk=club_id)
    except Club.DoesNotExist:
        return Response({'success': False, 'message': 'Club no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    # Construir el diccionario de datos manualmente
    data = {
        'club': str(club.id),
        'week': request.data.get('week'),
        'title': request.data.get('title'),
        'description': request.data.get('description'),
        'resource_type': request.data.get('resource_type'),
    }
    
    # Manejar URL o archivo según el tipo de recurso
    if data['resource_type'] == 'url':
        data['url'] = request.data.get('url')
    elif data['resource_type'] == 'file' and 'file' in request.FILES:
        data['file'] = request.FILES['file']
    
    serializer = ClubMaterialSerializer(data=data, context={'request': request})
    if serializer.is_valid():
        try:
            mat = serializer.save(created_by=user, is_active=True)
            return Response({
                'success': True, 
                'data': ClubMaterialSerializer(mat, context={'request': request}).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Error al guardar el material: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    return Response({
        'success': False, 
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def club_material_update_view(request, material_id):
    """Actualizar datos de un material de club.

    Permite editar semana, título, descripción y, para recursos de tipo URL,
    la propia URL. No cambia el archivo físico existente.
    """
    try:
        material = ClubMaterial.objects.get(pk=material_id)
    except ClubMaterial.DoesNotExist:
        return Response({'success': False, 'message': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == material.club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    data = request.data.copy()
    serializer = ClubMaterialSerializer(material, data=data, partial=True, context={'request': request})
    if serializer.is_valid():
        mat = serializer.save()
        return Response({
            'success': True,
            'data': ClubMaterialSerializer(mat, context={'request': request}).data
        }, status=status.HTTP_200_OK)

    return Response({'success': False, 'errors': serializer.errors}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def club_material_delete_view(request, material_id):
    """Eliminar (desactivar) un material de club.

    Se marca is_active = False para mantener historial, pero deja de mostrarse.
    """
    try:
        material = ClubMaterial.objects.get(pk=material_id)
    except ClubMaterial.DoesNotExist:
        return Response({'success': False, 'message': 'Material no encontrado'}, status=status.HTTP_404_NOT_FOUND)

    user = request.user
    if not (user == material.club.profesor or getattr(user, 'role', None) == 'admin'):
        return Response({'success': False, 'message': 'No autorizado'}, status=status.HTTP_403_FORBIDDEN)

    material.is_active = False
    material.save()
    return Response({'success': True, 'message': 'Material eliminado correctamente'}, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def gallery_create_view(request):
    """
    Endpoint para crear un nuevo elemento multimedia desde aplicaciones móviles
    """
    print(f"📤 GALLERY CREATE - Usuario: {request.user.username}")
    print(f"📋 Datos recibidos: {request.data}")
    
    serializer = MediaItemSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        # Asegurar que los nuevos elementos queden activos por defecto
        item = serializer.save(is_active=True)
        print(f"✅ Elemento creado: {item.title} (ID: {item.id})")
        
        return Response({
            'success': True,
            'total': 1,
            'items': [serializer.data],
            'message': 'Elemento creado exitosamente'
        }, status=status.HTTP_201_CREATED)
    
    print(f"❌ Error de validación: {serializer.errors}")
    return Response({
        'success': False,
        'message': 'Error de validación',
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def gallery_update_view(request, pk):
    """
    Endpoint para actualizar un elemento multimedia
    """
    try:
        media_item = MediaItem.objects.get(pk=pk, is_active=True)
    except MediaItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Elemento no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
    
    serializer = MediaItemSerializer(media_item, data=request.data, partial=True, context={'request': request})
    if serializer.is_valid():
        serializer.save()
        return Response({
            'success': True,
            'data': serializer.data,
            'message': 'Elemento actualizado exitosamente'
        }, status=status.HTTP_200_OK)
    
    return Response({
        'success': False,
        'errors': serializer.errors
    }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def gallery_delete_view(request, pk):
    """
    Endpoint para eliminar (soft delete) un elemento multimedia
    """
    try:
        media_item = MediaItem.objects.get(pk=pk, is_active=True)
        media_item.is_active = False
        media_item.save()
        return Response({
            'success': True,
            'message': 'Elemento eliminado exitosamente'
        }, status=status.HTTP_200_OK)
    except MediaItem.DoesNotExist:
        return Response({
            'success': False,
            'message': 'Elemento no encontrado'
        }, status=status.HTTP_404_NOT_FOUND)
