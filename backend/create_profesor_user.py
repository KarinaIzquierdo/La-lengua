#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('/Users/sena/Desktop/The Language/La_lengua/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser, Profesor

def create_profesor_user():
    """
    Crear un usuario profesor de prueba
    """
    try:
        # Verificar si ya existe
        if CustomUser.objects.filter(email='profesor@thelanguage.com').exists():
            print("El usuario profesor ya existe.")
            user = CustomUser.objects.get(email='profesor@thelanguage.com')
        else:
            # Crear usuario profesor
            user = CustomUser.objects.create_user(
                username='profesor',
                email='profesor@thelanguage.com',
                password='Profesor123',
                first_name='María',
                last_name='García',
                is_profesor=True,
                profile_completed=True
            )
            print("Usuario profesor creado exitosamente.")
        
        # Crear o actualizar perfil de profesor
        profesor_profile, created = Profesor.objects.get_or_create(
            user=user,
            defaults={
                'especialidad': 'Inglés Conversacional',
                'biografia': 'Profesora con más de 5 años de experiencia enseñando inglés a estudiantes de habla hispana.',
                'experiencia_anos': 5,
                'certificaciones': ['TESOL', 'Cambridge CELTA', 'IELTS Examiner'],
                'telefono': '+57 305 555 0124',
                'disponibilidad': {
                    'lunes': ['09:00-12:00', '14:00-18:00'],
                    'martes': ['09:00-12:00', '14:00-18:00'],
                    'miercoles': ['09:00-12:00', '14:00-18:00'],
                    'jueves': ['09:00-12:00', '14:00-18:00'],
                    'viernes': ['09:00-12:00', '14:00-17:00']
                },
                'tarifa_por_hora': 25000.00
            }
        )
        
        if created:
            print("Perfil de profesor creado exitosamente.")
        else:
            print("Perfil de profesor ya existía.")
        
        print("\n=== CREDENCIALES DE PROFESOR ===")
        print(f"Email: {user.email}")
        print("Contraseña: Profesor123")
        print(f"Nombre: {user.first_name} {user.last_name}")
        print(f"Especialidad: {profesor_profile.especialidad}")
        print("=====================================")
        
        return True
        
    except Exception as e:
        print(f"Error creando usuario profesor: {str(e)}")
        return False

if __name__ == '__main__':
    create_profesor_user()
