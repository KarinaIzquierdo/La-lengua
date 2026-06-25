from django.urls import path
from rest_framework import routers
from . import views
from .views import ClaseViewSet, MediaItemViewSet
from . import especializacion_views
from . import evaluacion_views
from . import notificacion_views
from . import notificacion_estudiante_views
from . import calificacion_views
from . import mission_views
from . import profesor_views
from . import user_views
from . import mobile_views
from . import registro_eliminacion_views
from . import contact_views
from . import asistencia_views
from .plan_views import (
    planes_list_view, plan_create_view, plan_update_view, plan_delete_view, plan_toggle_view,
    ventas_list_view, venta_create_view, venta_update_view, estadisticas_financieras_view
)
from .subscription_views import (
    asignar_plan_usuario_view, usuarios_sin_plan_view, planes_por_vencer_view,
    suscripciones_activas_view, enviar_recordatorio_pago_view, renovar_plan_view,
    cancelar_suscripcion_view
)

router = routers.DefaultRouter()
router.register(r'clases', ClaseViewSet)
router.register(r'media', MediaItemViewSet)

urlpatterns = [
    # Endpoints para estudiantes
    path('auth/login/', views.login_view, name='login'),
    path('auth/verify-token/', views.verify_token_view, name='verify_token'),
    path('auth/change-password/', views.change_password_view, name='change_password'),
    path('auth/request-password-reset/', views.request_password_reset_view, name='request_password_reset'),
    path('auth/reset-password/', views.reset_password_view, name='reset_password'),
    path('auth/profile/', views.user_profile_view, name='user_profile'),
    path('auth/update-profile/', views.update_profile_view, name='update_profile'),
    path('auth/register/', views.register_view, name='register'),
    # path('evaluations/', views.user_evaluations_view, name='user_evaluations'),  # ❌ OBSOLETO - Conflicto con endpoint móvil
    
    # Endpoints para profesores
    path('auth/profesor/login/', views.profesor_login_view, name='profesor_login'),
    path('auth/profesor/verify-token/', views.profesor_verify_token_view, name='profesor_verify_token'),
    path('auth/profesor/profile/', views.profesor_profile_view, name='profesor_profile'),
    path('auth/profesor/change-password/', views.profesor_change_password_view, name='profesor_change_password'),
    path('profesores/list/', profesor_views.get_profesores_list, name='profesores_list'),
    path('users/<int:user_id>/toggle-active/', views.toggle_user_active_view, name='toggle_user_active'),
    path('users/', views.list_users_view, name='list_users'),
    path('users/<int:user_id>/', user_views.delete_user_view, name='delete_user'),
    path('admin/dashboard-stats/', views.admin_dashboard_stats_view, name='admin_dashboard_stats'),
    path('admin/dashboard-charts/', views.admin_dashboard_charts_view, name='admin_dashboard_charts'),
    
    # Endpoints para galería
    path('gallery/', views.gallery_list_view, name='gallery_list'),
    path('gallery/create/', views.gallery_create_view, name='gallery_create'),
    path('gallery/<int:pk>/update/', views.gallery_update_view, name='gallery_update'),
    path('gallery/<int:pk>/delete/', views.gallery_delete_view, name='gallery_delete'),

    # Endpoints para misiones (enlaces externos administrables)
    path('missions/available/', mission_views.missions_available_view, name='missions_available'),
    path('missions/<str:mission_key>/link/', mission_views.mission_current_link_view, name='mission_current_link'),
    path('missions/links/', mission_views.mission_links_list_create_view, name='mission_links_list_create'),
    path('missions/links/<int:pk>/', mission_views.mission_link_detail_view, name='mission_link_detail'),

    # Endpoints para Clubs (CLB)
    # path('clubs/', views.clubs_list_view, name='clubs_list'),  # ❌ Comentado - Conflicto con endpoint móvil
    path('clubs/create/', views.club_create_view, name='club_create'),
    path('clubs/<int:club_id>/update/', views.club_update_view, name='club_update'),
    path('clubs/<int:club_id>/delete/', views.club_delete_view, name='club_delete'),
    path('clubs/<int:club_id>/materials/', views.club_materials_list_view, name='club_materials_list'),
    path('clubs/<int:club_id>/materials/create/', views.club_material_create_view, name='club_material_create'),
    path('clubs/materials/<int:material_id>/update/', views.club_material_update_view, name='club_material_update'),
    path('clubs/materials/<int:material_id>/delete/', views.club_material_delete_view, name='club_material_delete'),
    # Students management in clubs
    path('clubs/<int:club_id>/students/', views.club_students_list_view, name='club_students_list'),
    path('clubs/<int:club_id>/students/add/', views.club_add_student_view, name='club_student_add'),
    path('clubs/<int:club_id>/students/<int:user_id>/remove/', views.club_remove_student_view, name='club_student_remove'),
    
    # Endpoints para especializaciones
    path('especializaciones/', especializacion_views.especializaciones_list_view, name='especializaciones_list'),
    path('especializaciones/activas/', especializacion_views.especializaciones_activas_view, name='especializaciones_activas'),
    path('especializaciones/create/', especializacion_views.especializaciones_create_view, name='especializaciones_create'),
    path('especializaciones/<int:pk>/update/', especializacion_views.especializaciones_update_view, name='especializaciones_update'),
    path('especializaciones/<int:pk>/delete/', especializacion_views.especializaciones_delete_view, name='especializaciones_delete'),
    path('especializaciones/<int:pk>/toggle/', especializacion_views.especializaciones_toggle_view, name='especializaciones_toggle'),
    
    # Endpoints para evaluaciones
    path('evaluaciones/', evaluacion_views.evaluaciones_list_view, name='evaluaciones_list'),
    path('evaluaciones/create/', evaluacion_views.evaluacion_create_view, name='evaluacion_create'),
    path('evaluaciones/<int:pk>/update/', evaluacion_views.evaluacion_update_view, name='evaluacion_update'),
    path('evaluaciones/<int:pk>/delete/', evaluacion_views.evaluacion_delete_view, name='evaluacion_delete'),
    path('evaluaciones/<int:pk>/publish/', evaluacion_views.evaluacion_publish_view, name='evaluacion_publish'),
    path('evaluaciones/students/', evaluacion_views.students_list_view, name='students_list'),
    path('student/evaluaciones/', evaluacion_views.student_evaluaciones_view, name='student_evaluaciones'),
    
    # Endpoints para descarga y subida de respuestas
    path('evaluaciones/<int:pk>/download/', evaluacion_views.download_evaluacion_view, name='download_evaluacion'),
    path('evaluaciones/<int:pk>/upload-respuesta/', evaluacion_views.upload_respuesta_view, name='upload_respuesta'),
    # Evaluaciones - Exámenes seguros
    path('evaluaciones/<int:pk>/examen-data/', evaluacion_views.examen_data_view, name='examen_data'),
    path('evaluaciones/<int:pk>/enviar-respuestas/', evaluacion_views.enviar_respuestas_view, name='enviar_respuestas'),
    path('student/respuestas/', evaluacion_views.student_respuestas_view, name='student_respuestas'),
    path('evaluaciones/<int:pk>/respuestas/', evaluacion_views.profesor_respuestas_view, name='profesor_respuestas'),
    path('reportes/progreso/', evaluacion_views.reportes_progreso_view, name='reportes_progreso'),
    
    # Endpoints para notificaciones
    path('notificaciones/', notificacion_views.obtener_notificaciones, name='obtener_notificaciones'),
    path('notificaciones/crear/', notificacion_views.crear_notificacion, name='crear_notificacion'),
    path('notificaciones/<int:notificacion_id>/marcar-leida/', notificacion_views.marcar_notificacion_leida, name='marcar_notificacion_leida'),
    path('notificaciones/marcar-todas-leidas/', notificacion_views.marcar_todas_leidas, name='marcar_todas_leidas'),
    
    # Endpoints para calificación
    path('calificaciones/panel/', calificacion_views.panel_calificaciones_view, name='panel_calificaciones'),
    path('calificaciones/panel/calificar/', calificacion_views.calificar_desde_panel, name='calificar_desde_panel'),
    path('calificaciones/por-calificar/', calificacion_views.obtener_respuestas_por_calificar, name='respuestas_por_calificar'),
    path('calificaciones/calificadas/', calificacion_views.obtener_respuestas_calificadas, name='respuestas_calificadas'),
    path('calificaciones/<int:respuesta_id>/', calificacion_views.obtener_detalle_respuesta, name='detalle_respuesta'),
    path('calificaciones/<int:respuesta_id>/calificar/', calificacion_views.calificar_respuesta, name='calificar_respuesta'),
    path('calificaciones/<int:respuesta_id>/actualizar/', calificacion_views.actualizar_calificacion, name='actualizar_calificacion'),
    
    # Endpoints para sistema financiero
    path('planes/', planes_list_view, name='planes_list'),
    path('planes/create/', plan_create_view, name='plan_create'),
    path('planes/<int:pk>/update/', plan_update_view, name='plan_update'),
    path('planes/<int:pk>/delete/', plan_delete_view, name='plan_delete'),
    path('planes/<int:pk>/toggle/', plan_toggle_view, name='plan_toggle'),
    path('ventas/', ventas_list_view, name='ventas_list'),
    path('ventas/create/', venta_create_view, name='venta_create'),
    path('ventas/<int:pk>/update/', venta_update_view, name='venta_update'),
    path('estadisticas/financieras/', estadisticas_financieras_view, name='estadisticas_financieras'),
    
    # Endpoints para gestión de suscripciones
    path('suscripciones/asignar-plan/', asignar_plan_usuario_view, name='asignar_plan'),
    path('suscripciones/usuarios-sin-plan/', usuarios_sin_plan_view, name='usuarios_sin_plan'),
    path('suscripciones/planes-por-vencer/', planes_por_vencer_view, name='planes_por_vencer'),
    path('suscripciones/activas/', suscripciones_activas_view, name='suscripciones_activas'),
    path('suscripciones/recordatorio/', enviar_recordatorio_pago_view, name='recordatorio_pago'),
    path('suscripciones/renovar/', renovar_plan_view, name='renovar_plan'),
    path('suscripciones/<int:suscripcion_id>/cancelar/', cancelar_suscripcion_view, name='cancelar_suscripcion'),
    
    # Endpoints específicos para móviles
    path('mobile/info/', mobile_views.api_info_view, name='mobile_api_info'),
    path('mobile/config/', mobile_views.mobile_config_view, name='mobile_config'),
    path('login/', views.mobile_login_view, name='mobile_login'),  # Endpoint para Android
    path('profile/', views.mobile_profile_view, name='mobile_profile'),  # Perfil para Android
    path('profile/update/', views.mobile_update_profile_view, name='mobile_update_profile'),  # Actualizar perfil desde Android
    path('classes/', views.mobile_classes_view, name='mobile_classes'),  # Clases programadas del usuario
    path('classes/create/', views.mobile_create_class_view, name='mobile_create_class'),  # Crear clase desde móvil
    path('professors/', views.mobile_professors_list_view, name='mobile_professors_list'),  # Lista de profesores
    path('students/', views.mobile_students_list_view, name='mobile_students_list'),  # Lista de estudiantes
    path('evaluations/', views.mobile_evaluations_view, name='mobile_evaluations'),  # Evaluaciones asignadas al usuario
    path('clubs/', views.mobile_clubs_view, name='mobile_clubs'),  # Clubs y materiales del usuario
    
    # Endpoints para registros de eliminación
    path('registros-eliminacion/', registro_eliminacion_views.get_registros_eliminacion, name='registros_eliminacion'),
    path('registros-eliminacion/estadisticas/', registro_eliminacion_views.get_estadisticas_eliminacion, name='estadisticas_eliminacion'),
    
    # Endpoint para formulario de contacto
    path('contact/', contact_views.send_contact_email, name='send_contact_email'),
    
    # Endpoints para asistencias
    path('asistencias/', asistencia_views.asistencias_list_create, name='asistencias_list_create'),
    path('asistencias/<int:pk>/', asistencia_views.asistencia_detail, name='asistencia_detail'),
    path('asistencias/estadisticas/<int:estudiante_id>/', asistencia_views.estadisticas_asistencia, name='estadisticas_asistencia'),
    
    # Endpoints para notificaciones de estudiantes
    path('notificaciones/estudiante/', notificacion_estudiante_views.notificaciones_estudiante_view, name='notificaciones_estudiante'),
    path('notificaciones/estudiante/<int:notificacion_id>/marcar-leida/', notificacion_estudiante_views.marcar_notificacion_leida_view, name='marcar_notificacion_leida_estudiante'),
    path('notificaciones/estudiante/marcar-todas-leidas/', notificacion_estudiante_views.marcar_todas_leidas_view, name='marcar_todas_leidas_estudiante'),
    path('notificaciones/estudiante/contador-no-leidas/', notificacion_estudiante_views.contador_no_leidas_view, name='contador_no_leidas_estudiante'),
    
    # Endpoints de gamificación (dulces, XP, retos diarios y misiones)
    path('gamificacion/estado/', views.gamificacion_estado_view, name='gamificacion_estado'),
    path('gamificacion/reto-diario/', views.gamificacion_reto_diario_view, name='gamificacion_reto_diario'),
    path('gamificacion/mision/', views.gamificacion_mision_view, name='gamificacion_mision'),
    path('gamificacion/ranking-retos/', views.gamificacion_ranking_retos_view, name='gamificacion_ranking_retos'),
    
    # Endpoints para retos diarios (Daily Challenge)
    path('daily-challenges/', views.daily_challenges_view, name='daily_challenges'),  # Para estudiantes (solo lectura)
    path('daily-challenges/admin/', views.daily_challenges_admin_list_create_view, name='daily_challenges_admin_list_create'),
    path('daily-challenges/admin/<int:pk>/', views.daily_challenges_admin_detail_view, name='daily_challenges_admin_detail'),
]

urlpatterns += router.urls
