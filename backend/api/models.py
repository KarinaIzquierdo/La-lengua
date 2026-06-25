from django.db import models
from django.contrib.auth.models import AbstractUser


class CustomUser(AbstractUser):
    """
    Modelo de usuario personalizado para el sistema de aprendizaje de inglés
    """
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    country = models.CharField(max_length=50, blank=True, null=True)
    city = models.CharField(max_length=50, blank=True, null=True)
    level = models.CharField(max_length=20, blank=True, null=True)
    
    # Campos adicionales para información completa del usuario
    birth_date = models.DateField(blank=True, null=True)
    cedula = models.CharField(max_length=20, blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    emergency_contact = models.CharField(max_length=100, blank=True, null=True)
    emergency_phone = models.CharField(max_length=20, blank=True, null=True)
    english_level = models.CharField(max_length=30, blank=True, null=True)
    learning_goals = models.TextField(blank=True, null=True)
    profile_completed = models.BooleanField(default=False)
    
    # Campo para identificar si es profesor (mantener por compatibilidad)
    is_profesor = models.BooleanField(default=False)
    
    # Roles del sistema
    ROLE_CHOICES = [
        ('student', 'Estudiante'),
        ('profesor', 'Profesor'),
        ('admin', 'Administrador'),
        ('financiero', 'Financiero'),
    ]
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='student')
    
    # Especialización asignada (relación con modelo Especializacion)
    especializacion = models.ForeignKey('Especializacion', on_delete=models.SET_NULL, null=True, blank=True, related_name='estudiantes')
    
    # Correo personal para recuperación de contraseña
    correo_personal = models.EmailField(blank=True, null=True, help_text="Correo personal para recuperación de contraseña")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    total_dulces = models.IntegerField(default=0)
    total_xp = models.IntegerField(default=0)
    reto_racha_actual = models.IntegerField(default=0)
    reto_mejor_racha = models.IntegerField(default=0)
    reto_ultima_fecha = models.DateField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.username} - {self.first_name} {self.last_name}"


class Evaluacion(models.Model):
    """
    Modelo para las evaluaciones subidas por los profesores
    """
    TIPO_CHOICES = [
        ('quiz', 'Quiz'),
        ('examen', 'Examen'),
        ('tarea', 'Tarea'),
    ]
    
    ESTADO_CHOICES = [
        ('borrador', 'Borrador'),
        ('publicada', 'Publicada'),
        ('archivada', 'Archivada'),
    ]
    
    titulo = models.CharField(max_length=200)
    descripcion = models.TextField(blank=True, null=True)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES, default='quiz')
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='borrador')
    archivo = models.FileField(upload_to='evaluaciones/', null=True, blank=True)
    fecha_limite = models.DateTimeField(null=True, blank=True)
    
    # Relaciones
    profesor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='evaluaciones_creadas')
    estudiantes_asignados = models.ManyToManyField(CustomUser, related_name='evaluaciones_asignadas', blank=True)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Evaluación'
        verbose_name_plural = 'Evaluaciones'
    
    def __str__(self):
        return f"{self.titulo} - {self.profesor.username}"
    
    @property
    def estudiantes_count(self):
        return self.estudiantes_asignados.count()
    
    @property
    def completadas_count(self):
        # Aquí se podría agregar lógica para contar evaluaciones completadas
        return 0


class Profesor(models.Model):
    """
    Modelo para información específica de profesores
    """
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='profesor_profile')
    especialidad = models.CharField(max_length=100, blank=True, null=True)
    biografia = models.TextField(blank=True, null=True)
    experiencia_anos = models.IntegerField(default=0)
    certificaciones = models.JSONField(default=list, blank=True)
    telefono = models.CharField(max_length=20, blank=True, null=True)
    disponibilidad = models.JSONField(default=dict, blank=True)  # Horarios disponibles
    tarifa_por_hora = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Prof. {self.user.first_name} {self.user.last_name} - {self.especialidad}"


class Clase(models.Model):
    ESTADO_CHOICES = [
        ('programada', 'Programada'),
        ('activa', 'Activa'),
        ('completada', 'Completada'),
    ]
    
    nombre = models.CharField(max_length=100)
    profesor = models.CharField(max_length=100)
    fecha = models.DateField()
    hora = models.CharField(max_length=20, default='08:00')
    duracion = models.IntegerField(default=60, help_text="Duración en minutos")
    tema = models.CharField(max_length=200, blank=True)
    descripcion = models.TextField(blank=True)
    tipo_clase = models.CharField(max_length=20, choices=[('individual', 'Individual'), ('grupal', 'Grupal')], default='individual')
    modalidad = models.CharField(max_length=20, choices=[('virtual', 'Virtual'), ('presencial', 'Presencial')], default='virtual')
    meet_link = models.URLField(blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='programada')
    estudiantes = models.ManyToManyField(CustomUser, related_name='clases', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombre} - {self.profesor} ({self.fecha})"


class Evaluation(models.Model):
    usuario = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='evaluations')
    tipo = models.CharField(max_length=30)  # e.g. 'vocabulary', 'grammar', 'comprehension'
    score = models.IntegerField(default=0)
    intentos = models.IntegerField(default=0)
    fecha = models.DateTimeField(auto_now_add=True)
    detalles = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.usuario.username} - {self.tipo} ({self.score}%)"


class MediaItem(models.Model):
    """
    Modelo para elementos multimedia de la galería
    """
    TYPE_CHOICES = [
        ('video', 'Video'),
        ('image', 'Imagen'),
    ]
    
    CATEGORY_CHOICES = [
        ('Videos', 'Videos'),
        ('Infografías', 'Infografías'),
        ('Fotos', 'Fotos'),
    ]
    
    type = models.CharField(max_length=10, choices=TYPE_CHOICES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    url = models.URLField(blank=True, null=True)
    # Archivo físico opcional; si se proporciona, podremos derivar la URL pública
    file = models.FileField(upload_to='gallery/', blank=True, null=True)
    thumbnail = models.URLField(blank=True, null=True)
    author = models.CharField(max_length=100)
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Elemento Multimedia'
        verbose_name_plural = 'Elementos Multimedia'
    
    def __str__(self):
        return f"{self.title} ({self.type}) - {self.author}"


class Club(models.Model):
    """
    Club dirigido por un profesor con lista de estudiantes asignados
    """
    name = models.CharField(max_length=120)
    description = models.TextField(blank=True, null=True)
    profesor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='clubs_dirigidos')
    students = models.ManyToManyField(CustomUser, related_name='clubs', blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} (Prof: {self.profesor.get_full_name() or self.profesor.username})"


class ClubMaterial(models.Model):
    """
    Material semanal para un club. Puede ser URL o archivo subido
    """
    club = models.ForeignKey(Club, on_delete=models.CASCADE, related_name='materials')
    week = models.CharField(max_length=16)  # p.ej. 2025-W37
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    resource_type = models.CharField(max_length=10, choices=[('url', 'URL'), ('file', 'Archivo')])
    url = models.URLField(blank=True, null=True)
    file = models.FileField(upload_to='clubs/', blank=True, null=True)
    created_by = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, related_name='materials_created')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.week}"


class Especializacion(models.Model):
    """
    Modelo para las especializaciones de inglés disponibles
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField()
    duracion = models.CharField(max_length=50)  # ej: "8 semanas", "3 meses"
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    activa = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['nombre']
        verbose_name = 'Especialización'
        verbose_name_plural = 'Especializaciones'
    
    def __str__(self):
        return f"{self.nombre} - {self.duracion}"


class RespuestaEvaluacion(models.Model):
    """
    Modelo para almacenar las respuestas de los estudiantes a las evaluaciones
    """
    estudiante = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='respuestas_evaluacion')
    evaluacion = models.ForeignKey(Evaluacion, on_delete=models.CASCADE, related_name='respuestas')
    archivo_respuesta = models.FileField(upload_to='respuestas/', null=True, blank=True)
    respuestas_json = models.JSONField(default=dict)
    tiempo_gastado = models.IntegerField(default=0, help_text="Tiempo en segundos")
    advertencias = models.IntegerField(default=0)
    completado = models.BooleanField(default=False)
    fecha_envio = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    # Campos para calificación del profesor
    calificacion = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, help_text="Calificación sobre 100")
    comentarios_profesor = models.TextField(blank=True, null=True, help_text="Comentarios del profesor")
    fecha_calificacion = models.DateTimeField(null=True, blank=True)
    calificado_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='calificaciones_realizadas')

    class Meta:
        unique_together = ('estudiante', 'evaluacion')
        verbose_name = 'Respuesta de Evaluación'

    def __str__(self):
        return f"Respuesta de {self.estudiante.username} para {self.evaluacion.titulo}"


class Notificacion(models.Model):
    """
    Modelo para notificaciones del sistema dirigidas a profesores
    """
    TIPO_CHOICES = [
        ('clase_proxima', 'Clase Próxima'),
        ('evaluacion_subida', 'Evaluación Subida'),
        ('evaluacion_pendiente', 'Evaluación Pendiente'),
        ('estudiante_sin_evaluar', 'Estudiante Sin Evaluar'),
        ('clase_hoy', 'Clase Hoy'),
        ('evaluacion_vencida', 'Evaluación Vencida'),
    ]
    
    PRIORIDAD_CHOICES = [
        ('baja', 'Baja'),
        ('media', 'Media'),
        ('alta', 'Alta'),
        ('urgente', 'Urgente'),
    ]
    
    profesor = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notificaciones')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    titulo = models.CharField(max_length=200)
    mensaje = models.TextField()
    prioridad = models.CharField(max_length=10, choices=PRIORIDAD_CHOICES, default='media')
    leida = models.BooleanField(default=False)
    
    # Referencias opcionales a objetos relacionados
    clase_relacionada = models.ForeignKey(Clase, on_delete=models.CASCADE, null=True, blank=True)
    evaluacion_relacionada = models.ForeignKey(Evaluacion, on_delete=models.CASCADE, null=True, blank=True)
    estudiante_relacionado = models.ForeignKey(CustomUser, on_delete=models.CASCADE, null=True, blank=True, related_name='notificaciones_sobre_mi')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
    
    def __str__(self):
        return f"{self.titulo} - {self.profesor.username}"


class NotificacionEstudiante(models.Model):
    """
    Modelo para notificaciones dirigidas a estudiantes
    """
    TIPO_CHOICES = [
        ('plan_vencimiento', 'Plan por Vencer'),
        ('plan_vencido', 'Plan Vencido'),
        ('clase_programada', 'Clase Programada'),
        ('evaluacion_disponible', 'Evaluación Disponible'),
        ('logro_desbloqueado', 'Logro Desbloqueado'),
        ('mensaje_profesor', 'Mensaje del Profesor'),
        ('recordatorio_pago', 'Recordatorio de Pago'),
    ]
    
    estudiante = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='notificaciones_estudiante')
    tipo = models.CharField(max_length=30, choices=TIPO_CHOICES)
    mensaje = models.TextField()
    leida = models.BooleanField(default=False)
    datos_adicionales = models.JSONField(null=True, blank=True)  # Para datos extra como IDs, enlaces, etc.
    
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Notificación de Estudiante'
        verbose_name_plural = 'Notificaciones de Estudiantes'
    
    def __str__(self):
        return f"{self.tipo} - {self.estudiante.username}"


class MissionExternalLink(models.Model):
    """
    Enlace externo administrable para misiones (Gimkit, Kahoot, Quizizz, etc.)
    Permite manejar ventanas de vigencia y activar/desactivar sin tocar código.
    """
    PLATFORM_CHOICES = [
        ('gimkit', 'Gimkit'),
        ('kahoot', 'Kahoot'),
        ('quizizz', 'Quizizz'),
        ('custom', 'Custom'),
    ]

    # Identificador estable usado por el frontend: p.ej. 'comunicacion_magistral'
    mission_key = models.SlugField(max_length=60, db_index=True)
    platform = models.CharField(max_length=16, choices=PLATFORM_CHOICES, default='custom')
    url = models.URLField()
    start_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    notes = models.TextField(blank=True, null=True)

    # Audiencia (segmentación)
    AUDIENCE_CHOICES = [
        ('global', 'Global'),
        ('bloque', 'Por Bloque'),
        ('student', 'Por Estudiante'),
    ]
    audience_type = models.CharField(max_length=10, choices=AUDIENCE_CHOICES, default='global')
    audience_value = models.CharField(max_length=80, blank=True, null=True, help_text="Bloque (p.ej. B2_Mañana) cuando audience=bloque")
    user = models.ForeignKey('CustomUser', on_delete=models.CASCADE, null=True, blank=True, help_text="Usuario específico cuando audience=student")

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['mission_key', '-created_at']
        indexes = [
            models.Index(fields=['mission_key', 'is_active']),
            models.Index(fields=['mission_key', 'audience_type']),
        ]
        verbose_name = 'Enlace de Misión'
        verbose_name_plural = 'Enlaces de Misiones'

    def __str__(self):
        return f"{self.mission_key} -> {self.platform}"

    @property
    def status(self):
        from django.utils import timezone
        now = timezone.now()
        if not self.is_active:
            return 'inactive'
        if self.start_at and now < self.start_at:
            return 'upcoming'
        if self.expires_at and now > self.expires_at:
            return 'expired'
        return 'active'

class Plan(models.Model):
    """
    Modelo para los planes de precios disponibles
    """
    TIPO_CHOICES = [
        ('basico', 'Plan Básico'),
        ('especializado', 'Plan con Especialización'),
        ('premium', 'Plan Premium'),
    ]
    
    nombre = models.CharField(max_length=100)
    tipo = models.CharField(max_length=20, choices=TIPO_CHOICES)
    descripcion = models.TextField()
    precio_base = models.DecimalField(max_digits=10, decimal_places=2)
    duracion_meses = models.IntegerField(default=1)
    caracteristicas = models.JSONField(default=list)  # Lista de características incluidas
    activo = models.BooleanField(default=True)
    color_tema = models.CharField(max_length=7, default='#2563eb')  # Color hex para la tarjeta
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['precio_base']
        verbose_name = 'Plan'
        verbose_name_plural = 'Planes'
    
    def __str__(self):
        return f"{self.nombre} - ${self.precio_base}"


class Venta(models.Model):
    """
    Modelo para registrar las ventas realizadas
    """
    ESTADO_CHOICES = [
        ('pendiente', 'Pendiente'),
        ('pagado', 'Pagado'),
        ('cancelado', 'Cancelado'),
        ('reembolsado', 'Reembolsado'),
    ]
    
    METODO_PAGO_CHOICES = [
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
        ('tarjeta', 'Tarjeta'),
        ('paypal', 'PayPal'),
        ('otro', 'Otro'),
    ]
    
    # Información del cliente
    estudiante = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='ventas')
    
    # Información del plan
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='ventas')
    especializacion = models.ForeignKey(Especializacion, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventas')
    
    # Información financiera
    precio_plan = models.DecimalField(max_digits=10, decimal_places=2)
    precio_especializacion = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    descuento = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    precio_total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Información de pago
    metodo_pago = models.CharField(max_length=20, choices=METODO_PAGO_CHOICES)
    referencia_pago = models.CharField(max_length=100, blank=True, null=True)
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='pendiente')
    
    # Información adicional
    notas = models.TextField(blank=True, null=True)
    vendido_por = models.ForeignKey(CustomUser, on_delete=models.SET_NULL, null=True, blank=True, related_name='ventas_realizadas')
    
    # Fechas
    fecha_venta = models.DateTimeField(auto_now_add=True)
    fecha_pago = models.DateTimeField(null=True, blank=True)
    fecha_inicio_plan = models.DateField(null=True, blank=True)
    fecha_fin_plan = models.DateField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Venta'
        verbose_name_plural = 'Ventas'
    
    def __str__(self):
        return f"Venta #{self.id} - {self.estudiante.username} - ${self.precio_total}"
    
    @property
    def dias_restantes(self):
        """Calcula los días restantes del plan"""
        if self.fecha_fin_plan:
            from datetime import date
            return (self.fecha_fin_plan - date.today()).days
        return None


class Suscripcion(models.Model):
    """
    Modelo para gestionar las suscripciones activas de los estudiantes
    Se crea automáticamente cuando una venta es marcada como 'pagado'
    """
    ESTADO_CHOICES = [
        ('activa', 'Activa'),
        ('por_vencer', 'Por Vencer'),
        ('vencida', 'Vencida'),
        ('cancelada', 'Cancelada'),
    ]
    
    # Relación con venta y usuario
    venta = models.OneToOneField(Venta, on_delete=models.CASCADE, related_name='suscripcion')
    estudiante = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='suscripciones')
    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name='suscripciones')
    
    # Fechas de vigencia
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    
    # Estado
    estado = models.CharField(max_length=20, choices=ESTADO_CHOICES, default='activa')
    
    # Información adicional
    clases_totales = models.IntegerField(default=0, help_text="Total de clases incluidas en el plan")
    clases_tomadas = models.IntegerField(default=0, help_text="Clases ya tomadas")
    
    # Recordatorios
    recordatorio_enviado = models.BooleanField(default=False)
    fecha_recordatorio = models.DateTimeField(null=True, blank=True)
    
    # Fechas de control
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fecha_inicio']
        verbose_name = 'Suscripción'
        verbose_name_plural = 'Suscripciones'
    
    def __str__(self):
        return f"{self.estudiante.username} - {self.plan.nombre} ({self.estado})"
    
    @property
    def dias_restantes(self):
        """Calcula los días restantes de la suscripción"""
        from datetime import date
        if self.fecha_fin:
            dias = (self.fecha_fin - date.today()).days
            return max(0, dias)
        return 0
    
    @property
    def clases_restantes(self):
        """Calcula las clases restantes"""
        return max(0, self.clases_totales - self.clases_tomadas)
    
    @property
    def progreso_porcentaje(self):
        """Calcula el porcentaje de progreso"""
        if self.clases_totales > 0:
            return round((self.clases_tomadas / self.clases_totales) * 100, 1)
        return 0
    
    def actualizar_estado(self):
        """Actualiza el estado de la suscripción basado en la fecha"""
        from datetime import date, timedelta
        hoy = date.today()
        
        if self.fecha_fin < hoy:
            self.estado = 'vencida'
        elif self.fecha_fin <= hoy + timedelta(days=7):
            self.estado = 'por_vencer'
        else:
            self.estado = 'activa'
        
        self.save()
        return self.estado


class RegistroEliminacion(models.Model):
    """
    Modelo para registrar estudiantes eliminados del sistema
    Guarda información histórica y razón de eliminación
    """
    RAZON_CHOICES = [
        ('termino_clases', 'Terminó sus clases'),
        ('no_pago', 'No realizó el pago'),
        ('abandono', 'Abandonó el curso'),
        ('solicitud_propia', 'Solicitud del estudiante'),
        ('comportamiento', 'Problemas de comportamiento'),
        ('cambio_horario', 'No se adaptó al horario'),
        ('otro', 'Otra razón'),
    ]
    
    # Información del estudiante eliminado
    username = models.CharField(max_length=150, help_text="Nombre de usuario")
    email = models.EmailField(help_text="Correo electrónico")
    first_name = models.CharField(max_length=30, blank=True, null=True)
    last_name = models.CharField(max_length=30, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    cedula = models.CharField(max_length=20, blank=True, null=True)
    
    # Información académica
    nivel = models.CharField(max_length=20, blank=True, null=True, help_text="Nivel en el que estaba")
    bloque_asignado = models.CharField(max_length=50, blank=True, null=True)
    especializacion = models.CharField(max_length=100, blank=True, null=True)
    
    # Fechas y duración
    fecha_registro = models.DateTimeField(help_text="Fecha en que se registró originalmente")
    fecha_eliminacion = models.DateTimeField(auto_now_add=True, help_text="Fecha de eliminación")
    dias_registrado = models.IntegerField(default=0, help_text="Días que estuvo registrado")
    
    # Razón de eliminación
    razon = models.CharField(max_length=50, choices=RAZON_CHOICES, default='otro')
    descripcion_adicional = models.TextField(blank=True, null=True, help_text="Detalles adicionales")
    
    # Información financiera
    plan_activo = models.CharField(max_length=100, blank=True, null=True)
    deuda_pendiente = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    
    # Quién realizó la eliminación
    eliminado_por = models.ForeignKey(
        CustomUser, 
        on_delete=models.SET_NULL, 
        null=True, 
        related_name='eliminaciones_realizadas',
        help_text="Administrador que realizó la eliminación"
    )
    
    # Metadata
    notas = models.TextField(blank=True, null=True, help_text="Notas adicionales del administrador")
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-fecha_eliminacion']
        verbose_name = 'Registro de Eliminación'
        verbose_name_plural = 'Registros de Eliminación'
    
    def __str__(self):
        return f"{self.first_name} {self.last_name} - {self.get_razon_display()} ({self.fecha_eliminacion.strftime('%Y-%m-%d')})"
    
    @property
    def tiempo_registrado_str(self):
        """Retorna el tiempo registrado en formato legible"""
        if self.dias_registrado < 30:
            return f"{self.dias_registrado} días"
        elif self.dias_registrado < 365:
            meses = self.dias_registrado // 30
            return f"{meses} {'mes' if meses == 1 else 'meses'}"
        else:
            años = self.dias_registrado // 365
            meses = (self.dias_registrado % 365) // 30
            return f"{años} {'año' if años == 1 else 'años'} y {meses} {'mes' if meses == 1 else 'meses'}"


class Asistencia(models.Model):
    """
    Modelo para registrar la asistencia de estudiantes a clases
    """
    ESTADO_CHOICES = [
        ('presente', 'Presente'),
        ('ausente', 'Ausente'),
        ('tardanza', 'Tardanza'),
        ('justificado', 'Justificado'),
    ]
    
    estudiante = models.ForeignKey(
        CustomUser, 
        on_delete=models.CASCADE, 
        related_name='asistencias',
        limit_choices_to={'role': 'student'}
    )
    clase = models.ForeignKey(
        'Clase', 
        on_delete=models.CASCADE, 
        related_name='asistencias',
        null=True,
        blank=True
    )
    fecha = models.DateField(help_text="Fecha de la asistencia")
    estado = models.CharField(
        max_length=20, 
        choices=ESTADO_CHOICES, 
        default='ausente'
    )
    observaciones = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-fecha', 'estudiante']
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'
        # Un estudiante solo puede tener una asistencia por fecha
        unique_together = ['estudiante', 'fecha']
    
    def __str__(self):
        return f"{self.estudiante.username} - {self.fecha} - {self.estado}"


class DailyChallengeQuestion(models.Model):
    """Preguntas configurables para los retos diarios del dashboard de estudiante"""

    CATEGORY_CHOICES = [
        ('vocabulary', 'Vocabulario'),
        ('grammar', 'Gramática'),
        ('conversation', 'Conversación'),
        ('general', 'General'),
    ]

    pregunta = models.TextField()
    categoria = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='general')
    nivel = models.CharField(max_length=50, blank=True, null=True, help_text="Nivel sugerido (A1, A2, B1, etc.)")

    opcion_a = models.CharField(max_length=255)
    opcion_b = models.CharField(max_length=255)
    opcion_c = models.CharField(max_length=255, blank=True, null=True)
    opcion_d = models.CharField(max_length=255, blank=True, null=True)

    RESPUESTA_CHOICES = [
        ('A', 'Opción A'),
        ('B', 'Opción B'),
        ('C', 'Opción C'),
        ('D', 'Opción D'),
    ]
    respuesta_correcta = models.CharField(max_length=1, choices=RESPUESTA_CHOICES)

    explicacion = models.TextField(blank=True, null=True)
    activo = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Reto Diario'
        verbose_name_plural = 'Retos Diarios'
        ordering = ['-created_at']

    def __str__(self):
        return self.pregunta[:60]
