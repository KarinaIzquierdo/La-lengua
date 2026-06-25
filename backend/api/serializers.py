from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import CustomUser, Clase, Evaluation, MediaItem, Club, ClubMaterial, Especializacion, Evaluacion, RespuestaEvaluacion, Notificacion, NotificacionEstudiante, Plan, Venta, MissionExternalLink, Suscripcion, DailyChallengeQuestion

class UserSerializer(serializers.ModelSerializer):
    especializacion_nombre = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone', 'country', 'city', 'level', 
                 'birth_date', 'cedula', 'address', 'emergency_contact', 'emergency_phone', 
                 'english_level', 'learning_goals', 'profile_completed', 'role', 'is_profesor', 'is_active', 
                 'especializacion', 'especializacion_nombre', 'correo_personal')
        read_only_fields = ('id',)
    
    def get_especializacion_nombre(self, obj):
        if obj.especializacion:
            return obj.especializacion.nombre
        return None


class MobileUserSerializer(serializers.ModelSerializer):
    """Serializador simplificado para la app móvil"""
    especializacion = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 
                 'is_active', 'especializacion', 'date_joined', 'correo_personal', 'english_level')
        read_only_fields = ('id', 'date_joined')
    
    def get_especializacion(self, obj):
        """Devolver el nombre de la especialización como string"""
        if obj.especializacion:
            return obj.especializacion.nombre
        return None

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    username = serializers.CharField(required=False)
    password = serializers.CharField()

    def validate(self, data):
        # Aceptar tanto email como username para compatibilidad con Android
        email = data.get('email')
        username = data.get('username')
        password = data.get('password')

        # Si viene username, usarlo como email (para Android)
        if username and not email:
            email = username

        if email and password:
            # Buscar usuario por correo_personal (case insensitive)
            user = None
            try:
                user = CustomUser.objects.get(correo_personal__iexact=email)
            except CustomUser.DoesNotExist:
                # Si no se encuentra por correo_personal, intentar por email institucional
                try:
                    user = CustomUser.objects.get(email__iexact=email)
                except CustomUser.DoesNotExist:
                    user = None

            if not user:
                raise serializers.ValidationError('Email o contraseña incorrectos.')

            # Verificar contraseña
            if user.check_password(password):
                if user.is_active:
                    data['user'] = user
                else:
                    raise serializers.ValidationError('La cuenta de usuario está desactivada.')
            else:
                raise serializers.ValidationError('Email o contraseña incorrectos.')
        else:
            raise serializers.ValidationError('Debe proporcionar email/username y contraseña.')

        return data


class ClubSerializer(serializers.ModelSerializer):
    profesor_name = serializers.SerializerMethodField()

    class Meta:
        model = Club
        fields = ['id', 'name', 'description', 'profesor', 'profesor_name', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_profesor_name(self, obj):
        return obj.profesor.get_full_name() or obj.profesor.username


class ClubMaterialSerializer(serializers.ModelSerializer):
    class Meta:
        model = ClubMaterial
        fields = ['id', 'club', 'week', 'title', 'description', 'resource_type', 'url', 'file', 'created_by', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at', 'is_active']

    def validate(self, attrs):
        rtype = attrs.get('resource_type')
        url = attrs.get('url')
        file = attrs.get('file')
        if rtype == 'url' and not url:
            raise serializers.ValidationError({'url': ['Requerida cuando el recurso es URL.']})
        if rtype == 'file' and not file:
            raise serializers.ValidationError({'file': ['Requerido cuando el recurso es Archivo.']})
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get('resource_type') == 'file' and not data.get('url') and getattr(instance, 'file', None):
            request = self.context.get('request') if hasattr(self, 'context') else None
            if request:
                data['url'] = request.build_absolute_uri(instance.file.url)
            else:
                data['url'] = getattr(instance.file, 'url', '')
        return data

class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField()
    new_password = serializers.CharField(min_length=8)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value

    def validate_new_password(self, value):
        # Aquí puedes agregar validaciones adicionales para la nueva contraseña
        if len(value) < 8:
            raise serializers.ValidationError('La nueva contraseña debe tener al menos 8 caracteres.')
        return value

class ClaseSerializer(serializers.ModelSerializer):
    estudiantes = serializers.PrimaryKeyRelatedField(many=True, queryset=CustomUser.objects.all(), required=False)
    estudiantesSeleccionados = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    
    class Meta:
        model = Clase
        fields = ['id', 'nombre', 'profesor', 'fecha', 'hora', 'duracion', 'tema', 'descripcion', 
                 'tipo_clase', 'modalidad', 'meet_link', 'estado', 'estudiantes', 'estudiantesSeleccionados', 
                 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Debug: Ver qué datos están llegando
        print("=" * 50)
        print("📝 CREANDO CLASE - Datos validados:")
        print(f"Estado recibido: {validated_data.get('estado', 'NO ESPECIFICADO')}")
        print(f"Todos los datos: {validated_data}")
        print("=" * 50)
        
        estudiantes_ids = validated_data.pop('estudiantesSeleccionados', [])
        
        # Asegurar que el estado sea 'programada' si no se especifica
        if 'estado' not in validated_data or not validated_data['estado']:
            validated_data['estado'] = 'programada'
            print("⚠️ Estado no especificado, usando default: 'programada'")
        
        clase = super().create(validated_data)
        
        print(f"✅ Clase creada con estado: {clase.estado}")
        
        # Asignar estudiantes por ID
        if estudiantes_ids:
            estudiantes = CustomUser.objects.filter(id__in=estudiantes_ids)
            clase.estudiantes.set(estudiantes)
        
        return clase

class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)
    especializacion = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    correo_personal = serializers.EmailField(required=True)  # Ahora es obligatorio
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False)  # Email institucional opcional

    class Meta:
        model = CustomUser
        fields = ('username', 'first_name', 'last_name', 'email', 'role', 'password', 'especializacion', 'correo_personal')

    def validate_correo_personal(self, value):
        """Validar que el correo personal sea único"""
        if CustomUser.objects.filter(correo_personal__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este correo personal.')
        return value
    
    def validate_email(self, value):
        """Validar email institucional si se proporciona"""
        if value and CustomUser.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con este correo electrónico.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        especializacion_str = validated_data.pop('especializacion', None)
        correo_personal = validated_data.get('correo_personal')  # Ya no lo sacamos, está en validated_data
        username = validated_data.pop('username', None)
        
        # Si no se proporcionó email institucional, generarlo automáticamente
        if not validated_data.get('email'):
            # Generar email institucional basado en el correo personal
            local_part = correo_personal.split('@')[0]
            validated_data['email'] = f"{local_part}@thelanguage.co"
        
        # Crear usuario
        user = CustomUser(**validated_data)
        
        # Establecer username (usar el proporcionado o el correo personal)
        user.username = username if username else correo_personal
        
        # Establecer contraseña
        user.set_password(password)
        
        # Establecer is_profesor si el rol es profesor
        if validated_data.get('role') == 'profesor':
            user.is_profesor = True
        
        # Buscar y asignar especialización si se proporciona
        if especializacion_str:
            try:
                # Intentar buscar por nombre
                esp = Especializacion.objects.filter(nombre__iexact=especializacion_str).first()
                if esp:
                    user.especializacion = esp
                else:
                    # Si no se encuentra, intentar por ID
                    try:
                        esp_id = int(especializacion_str)
                        esp = Especializacion.objects.filter(id=esp_id).first()
                        if esp:
                            user.especializacion = esp
                    except (ValueError, TypeError):
                        pass
            except Exception as e:
                print(f"⚠️ Error al asignar especialización: {e}")
        
        user.save()
        return user

class EvaluationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Evaluation
        fields = ['id', 'usuario', 'tipo', 'score', 'intentos', 'fecha', 'detalles']
        read_only_fields = ['id', 'usuario', 'fecha']


class MediaItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = MediaItem
        fields = ['id', 'type', 'title', 'description', 'url', 'file', 'thumbnail', 'author', 'category', 'created_at', 'updated_at', 'is_active']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate(self, attrs):
        """Exigir al menos uno: url o file"""
        url = attrs.get('url')
        file = attrs.get('file')
        if not url and not file:
            raise serializers.ValidationError({'non_field_errors': ['Debe proporcionar una URL o un archivo.']})
        return attrs

    def validate_title(self, value):
        """Validar que el título no esté vacío"""
        if not value.strip():
            raise serializers.ValidationError('El título no puede estar vacío.')
        return value.strip()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        # Si no hay url pero hay archivo, construir URL absoluta del archivo
        if not data.get('url') and getattr(instance, 'file', None):
            request = self.context.get('request') if hasattr(self, 'context') else None
            if request:
                data['url'] = request.build_absolute_uri(instance.file.url)
            else:
                data['url'] = getattr(instance.file, 'url', '')
        return data


class EvaluacionSerializer(serializers.ModelSerializer):
    estudiantes_asignados = serializers.PrimaryKeyRelatedField(many=True, queryset=CustomUser.objects.all(), required=False)
    profesor_nombre = serializers.CharField(source='profesor.get_full_name', read_only=True)
    estudiantes_count = serializers.SerializerMethodField()
    completadas_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Evaluacion
        fields = ['id', 'titulo', 'descripcion', 'tipo', 'estado', 'archivo', 'fecha_limite', 
                 'profesor', 'profesor_nombre', 'estudiantes_asignados', 'estudiantes_count', 
                 'completadas_count', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_estudiantes_count(self, obj):
        return obj.estudiantes_asignados.count()
    
    def get_completadas_count(self, obj):
        # This would need to be implemented based on your completion tracking logic
        # For now, returning 0 as placeholder
        return 0
    
    def create(self, validated_data):
        estudiantes_data = validated_data.pop('estudiantes_asignados', [])
        evaluacion = Evaluacion.objects.create(**validated_data)
        evaluacion.estudiantes_asignados.set(estudiantes_data)
        return evaluacion
    
    def update(self, instance, validated_data):
        estudiantes_data = validated_data.pop('estudiantes_asignados', None)
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        if estudiantes_data is not None:
            instance.estudiantes_asignados.set(estudiantes_data)
        
        return instance


class RespuestaEvaluacionSerializer(serializers.ModelSerializer):
    evaluacion_titulo = serializers.CharField(source='evaluacion.titulo', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    calificado_por_nombre = serializers.CharField(source='calificado_por.get_full_name', read_only=True)
    evaluacion_tipo = serializers.CharField(source='evaluacion.tipo', read_only=True)
    
    class Meta:
        model = RespuestaEvaluacion
        fields = ['id', 'evaluacion', 'evaluacion_titulo', 'evaluacion_tipo', 'estudiante', 'estudiante_nombre', 
                 'archivo_respuesta', 'respuestas_json', 'tiempo_gastado', 'advertencias',
                 'completado', 'fecha_envio', 'calificacion', 'comentarios_profesor', 
                 'fecha_calificacion', 'calificado_por', 'calificado_por_nombre']
        read_only_fields = ['id', 'estudiante', 'fecha_envio', 'fecha_calificacion', 'calificado_por_nombre']
    
    def create(self, validated_data):
        # Establecer automáticamente el estudiante desde el request
        validated_data['estudiante'] = self.context['request'].user
        return super().create(validated_data)


class MissionExternalLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = MissionExternalLink
        fields = ['id', 'mission_key', 'platform', 'url', 'start_at', 'expires_at', 'is_active', 'notes',
                  'audience_type', 'audience_value', 'user', 'status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'status', 'created_at', 'updated_at']


class NotificacionSerializer(serializers.ModelSerializer):
    profesor_nombre = serializers.CharField(source='profesor.get_full_name', read_only=True)
    clase_nombre = serializers.CharField(source='clase_relacionada.tema', read_only=True)
    evaluacion_titulo = serializers.CharField(source='evaluacion_relacionada.titulo', read_only=True)
    estudiante_nombre = serializers.CharField(source='estudiante_relacionado.get_full_name', read_only=True)
    tiempo_transcurrido = serializers.SerializerMethodField()
    
    class Meta:
        model = Notificacion
        fields = ['id', 'tipo', 'titulo', 'mensaje', 'prioridad', 'leida', 
                 'profesor_nombre', 'clase_nombre', 'evaluacion_titulo', 'estudiante_nombre',
                 'tiempo_transcurrido', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_tiempo_transcurrido(self, obj):
        from django.utils import timezone
        from datetime import timedelta
        
        now = timezone.now()
        diff = now - obj.created_at
        
        if diff.days > 0:
            return f"hace {diff.days} día{'s' if diff.days > 1 else ''}"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"hace {hours} hora{'s' if hours > 1 else ''}"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"hace {minutes} minuto{'s' if minutes > 1 else ''}"
        else:
            return "hace unos segundos"


class NotificacionEstudianteSerializer(serializers.ModelSerializer):
    class Meta:
        model = NotificacionEstudiante
        fields = ['id', 'tipo', 'mensaje', 'leida', 'datos_adicionales', 'fecha_creacion']
        read_only_fields = ['id', 'fecha_creacion']


class EspecializacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especializacion
        fields = ['id', 'nombre', 'descripcion', 'precio_adicional', 'activo', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = ['id', 'nombre', 'tipo', 'descripcion', 'precio_base', 'duracion_meses', 
                 'caracteristicas', 'activo', 'color_tema', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class VentaSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.CharField(source='estudiante.get_full_name', read_only=True)
    plan_nombre = serializers.CharField(source='plan.nombre', read_only=True)
    especializacion_nombre = serializers.CharField(source='especializacion.nombre', read_only=True)
    vendido_por_nombre = serializers.CharField(source='vendido_por.get_full_name', read_only=True)
    
    class Meta:
        model = Venta
        fields = ['id', 'estudiante', 'estudiante_nombre', 'plan', 'plan_nombre', 
                 'especializacion', 'especializacion_nombre', 'precio_plan', 'precio_especializacion',
                 'descuento', 'precio_total', 'metodo_pago', 'referencia_pago', 'estado',
                 'notas', 'vendido_por', 'vendido_por_nombre', 'fecha_venta', 'fecha_pago',
                 'fecha_inicio_plan', 'fecha_fin_plan', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def create(self, validated_data):
        # Calcular precio total automáticamente
        precio_plan = validated_data.get('precio_plan', 0)
        precio_especializacion = validated_data.get('precio_especializacion', 0)
        descuento = validated_data.get('descuento', 0)
        validated_data['precio_total'] = precio_plan + precio_especializacion - descuento
        
        return super().create(validated_data)


class SuscripcionSerializer(serializers.ModelSerializer):
    estudiante_nombre = serializers.SerializerMethodField()
    plan_nombre = serializers.SerializerMethodField()
    dias_restantes = serializers.ReadOnlyField()
    clases_restantes = serializers.ReadOnlyField()
    progreso_porcentaje = serializers.ReadOnlyField()
    
    class Meta:
        model = Suscripcion
        fields = ['id', 'venta', 'estudiante', 'estudiante_nombre', 'plan', 'plan_nombre',
                 'fecha_inicio', 'fecha_fin', 'estado', 'clases_totales', 'clases_tomadas',
                 'dias_restantes', 'clases_restantes', 'progreso_porcentaje',
                 'recordatorio_enviado', 'fecha_recordatorio', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def get_estudiante_nombre(self, obj):
        return f"{obj.estudiante.first_name} {obj.estudiante.last_name}"
    
    def get_plan_nombre(self, obj):
        return obj.plan.nombre


class DailyChallengeQuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = DailyChallengeQuestion
        fields = [
            'id', 'pregunta', 'categoria', 'nivel',
            'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d',
            'respuesta_correcta', 'explicacion', 'activo', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']
