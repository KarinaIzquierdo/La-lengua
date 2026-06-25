from rest_framework import serializers
from .models import Especializacion

class EspecializacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Especializacion
        fields = ['id', 'nombre', 'descripcion', 'duracion', 'precio', 'activa', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_nombre(self, value):
        """Validar que el nombre no esté vacío y sea único"""
        if not value.strip():
            raise serializers.ValidationError('El nombre no puede estar vacío.')
        
        # Verificar unicidad solo si es una nueva instancia o si el nombre cambió
        instance = getattr(self, 'instance', None)
        if instance is None or instance.nombre != value:
            if Especializacion.objects.filter(nombre__iexact=value.strip()).exists():
                raise serializers.ValidationError('Ya existe una especialización con este nombre.')
        
        return value.strip()

    def validate_precio(self, value):
        """Validar que el precio sea positivo"""
        if value < 0:
            raise serializers.ValidationError('El precio no puede ser negativo.')
        return value
