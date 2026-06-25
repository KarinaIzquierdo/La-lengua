from django.contrib import admin
from django.utils.html import format_html
from .models import MissionExternalLink, RegistroEliminacion, Asistencia, Clase, Suscripcion, DailyChallengeQuestion


@admin.register(MissionExternalLink)
class MissionExternalLinkAdmin(admin.ModelAdmin):
    list_display = (
        'mission_key', 'platform', 'short_url', 'is_active', 'start_at', 'expires_at', 'status', 'created_at'
    )
    list_filter = ('platform', 'is_active')
    search_fields = ('mission_key', 'url', 'notes')
    ordering = ('mission_key', '-created_at')

    def short_url(self, obj):
        return (obj.url[:60] + '…') if len(obj.url) > 60 else obj.url
    short_url.short_description = 'URL'


@admin.register(RegistroEliminacion)
class RegistroEliminacionAdmin(admin.ModelAdmin):
    list_display = (
        'nombre_completo', 'email', 'razon', 'tiempo_registrado', 
        'fecha_eliminacion', 'eliminado_por'
    )
    list_filter = ('razon', 'fecha_eliminacion', 'nivel')
    search_fields = ('first_name', 'last_name', 'email', 'username', 'cedula')
    readonly_fields = (
        'username', 'email', 'first_name', 'last_name', 'phone', 'cedula',
        'nivel', 'bloque_asignado', 'especializacion', 'fecha_registro',
        'fecha_eliminacion', 'dias_registrado', 'created_at'
    )
    ordering = ('-fecha_eliminacion',)
    
    fieldsets = (
        ('Información del Estudiante', {
            'fields': ('username', 'email', 'first_name', 'last_name', 'phone', 'cedula')
        }),
        ('Información Académica', {
            'fields': ('nivel', 'bloque_asignado', 'especializacion')
        }),
        ('Fechas y Duración', {
            'fields': ('fecha_registro', 'fecha_eliminacion', 'dias_registrado')
        }),
        ('Razón de Eliminación', {
            'fields': ('razon', 'descripcion_adicional', 'eliminado_por', 'notas')
        }),
        ('Información Financiera', {
            'fields': ('plan_activo', 'deuda_pendiente')
        }),
    )
    
    def nombre_completo(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    nombre_completo.short_description = 'Nombre Completo'
    
    def tiempo_registrado(self, obj):
        return obj.tiempo_registrado_str
    tiempo_registrado.short_description = 'Tiempo Registrado'


@admin.register(Asistencia)
class AsistenciaAdmin(admin.ModelAdmin):
    list_display = (
        'estudiante', 'fecha', 'estado', 'clase', 'created_at'
    )
    list_filter = ('estado', 'fecha')
    search_fields = ('estudiante__username', 'estudiante__first_name', 'estudiante__last_name')
    ordering = ('-fecha', 'estudiante')
    date_hierarchy = 'fecha'
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('estudiante', 'clase', 'fecha', 'estado')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
    )


@admin.register(Clase)
class ClaseAdmin(admin.ModelAdmin):
    list_display = (
        'nombre', 'profesor', 'fecha', 'hora', 'duracion', 'estado_badge', 'tipo_clase', 'modalidad', 'created_at'
    )
    list_filter = ('estado', 'tipo_clase', 'modalidad', 'fecha')
    search_fields = ('nombre', 'profesor', 'tema')
    ordering = ('-fecha', '-created_at')
    date_hierarchy = 'fecha'
    filter_horizontal = ('estudiantes',)
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'profesor', 'tema', 'descripcion')
        }),
        ('Fecha y Hora', {
            'fields': ('fecha', 'hora', 'duracion')
        }),
        ('Configuración', {
            'fields': ('tipo_clase', 'modalidad', 'meet_link')
        }),
        ('Estado de la Clase', {
            'fields': ('estado',),
            'description': '⚠️ IMPORTANTE: Deja en "Programada" para clases nuevas. Solo cambia a "Completada" cuando la clase haya finalizado.'
        }),
        ('Estudiantes', {
            'fields': ('estudiantes',)
        }),
    )
    
    def estado_badge(self, obj):
        colors = {
            'programada': '#3b82f6',
            'activa': '#f59e0b',
            'completada': '#10b981'
        }
        color = colors.get(obj.estado, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def get_readonly_fields(self, request, obj=None):
        # Hacer created_at y updated_at de solo lectura si existen
        if obj:
            return ['created_at', 'updated_at']
        return []
    
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        # Asegurar que el estado por defecto sea 'programada' para nuevas clases
        if not obj and 'estado' in form.base_fields:
            form.base_fields['estado'].initial = 'programada'
        return form


@admin.register(Suscripcion)
class SuscripcionAdmin(admin.ModelAdmin):
    list_display = (
        'estudiante', 'plan', 'fecha_inicio', 'fecha_fin', 'estado_badge', 
        'clases_progreso', 'dias_restantes_display', 'created_at'
    )
    list_filter = ('estado', 'plan', 'fecha_inicio', 'fecha_fin')
    search_fields = ('estudiante__username', 'estudiante__first_name', 'estudiante__last_name', 'plan__nombre')
    ordering = ('-fecha_inicio', '-created_at')
    date_hierarchy = 'fecha_inicio'
    readonly_fields = ('venta', 'dias_restantes', 'clases_restantes', 'progreso_porcentaje', 'created_at', 'updated_at')
    
    fieldsets = (
        ('Información Principal', {
            'fields': ('venta', 'estudiante', 'plan')
        }),
        ('Vigencia', {
            'fields': ('fecha_inicio', 'fecha_fin', 'estado', 'dias_restantes')
        }),
        ('Progreso de Clases', {
            'fields': ('clases_totales', 'clases_tomadas', 'clases_restantes', 'progreso_porcentaje')
        }),
        ('Recordatorios', {
            'fields': ('recordatorio_enviado', 'fecha_recordatorio')
        }),
        ('Fechas de Control', {
            'fields': ('created_at', 'updated_at')
        }),
    )
    
    def estado_badge(self, obj):
        colors = {
            'activa': '#10b981',
            'por_vencer': '#f59e0b',
            'vencida': '#ef4444',
            'cancelada': '#6b7280'
        }
        color = colors.get(obj.estado, '#6b7280')
        return format_html(
            '<span style="background-color: {}; color: white; padding: 4px 12px; border-radius: 12px; font-weight: 600;">{}</span>',
            color,
            obj.get_estado_display()
        )
    estado_badge.short_description = 'Estado'
    
    def clases_progreso(self, obj):
        porcentaje = obj.progreso_porcentaje
        color = '#10b981' if porcentaje < 80 else '#f59e0b' if porcentaje < 100 else '#ef4444'
        return format_html(
            '<div style="display: flex; align-items: center; gap: 8px;">'
            '<div style="flex: 1; background: #e5e7eb; border-radius: 10px; height: 20px; overflow: hidden;">'
            '<div style="background: {}; width: {}%; height: 100%;"></div>'
            '</div>'
            '<span style="font-weight: 600;">{}/{}</span>'
            '</div>',
            color, porcentaje, obj.clases_tomadas, obj.clases_totales
        )
    clases_progreso.short_description = 'Progreso'
    
    def dias_restantes_display(self, obj):
        dias = obj.dias_restantes
        if dias > 7:
            color = '#10b981'
        elif dias > 0:
            color = '#f59e0b'
        else:
            color = '#ef4444'
        return format_html(
            '<span style="color: {}; font-weight: 600;">{} días</span>',
            color, dias
        )
    dias_restantes_display.short_description = 'Días Restantes'
    
    actions = ['actualizar_estados']
    
    def actualizar_estados(self, request, queryset):
        count = 0
        for suscripcion in queryset:
            suscripcion.actualizar_estado()
            count += 1
        self.message_user(request, f'{count} suscripciones actualizadas.')
    actualizar_estados.short_description = 'Actualizar estados de suscripciones'


@admin.register(DailyChallengeQuestion)
class DailyChallengeQuestionAdmin(admin.ModelAdmin):
    list_display = ('pregunta_resumida', 'categoria', 'nivel', 'respuesta_correcta', 'activo', 'created_at')
    list_filter = ('categoria', 'nivel', 'activo')
    search_fields = ('pregunta', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d')
    list_editable = ('activo',)

    fieldsets = (
        ('Pregunta', {
            'fields': ('pregunta', 'categoria', 'nivel', 'activo')
        }),
        ('Opciones', {
            'fields': ('opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'respuesta_correcta')
        }),
        ('Explicación', {
            'fields': ('explicacion',)
        }),
    )

    def pregunta_resumida(self, obj):
        return (obj.pregunta[:60] + '…') if len(obj.pregunta) > 60 else obj.pregunta
    pregunta_resumida.short_description = 'Pregunta'
