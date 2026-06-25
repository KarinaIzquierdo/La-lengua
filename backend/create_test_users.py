#!/usr/bin/env python3
"""
Script para crear usuarios de prueba con diferentes roles
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser, Profesor

def create_test_users():
    """Crear usuarios de prueba con diferentes roles"""
    
    # Usuario estudiante
    student_user, created = CustomUser.objects.get_or_create(
        email='estudiante@thelanguage.com',
        defaults={
            'username': 'estudiante_test',
            'first_name': 'Ana',
            'last_name': 'García',
            'role': 'student',
            'is_profesor': False,
            'profile_completed': True
        }
    )
    if created:
        student_user.set_password('Estudiante123')
        student_user.save()
        print(f"✅ Usuario estudiante creado: {student_user.email}")
    else:
        # Actualizar rol si ya existe
        student_user.role = 'student'
        student_user.save()
        print(f"✅ Usuario estudiante actualizado: {student_user.email}")
    
    # Usuario profesor
    profesor_user, created = CustomUser.objects.get_or_create(
        email='profesor@thelanguage.com',
        defaults={
            'username': 'profesor_test',
            'first_name': 'Carlos',
            'last_name': 'Rodríguez',
            'role': 'profesor',
            'is_profesor': True,
            'profile_completed': True
        }
    )
    if created:
        profesor_user.set_password('Profesor123')
        profesor_user.save()
        print(f"✅ Usuario profesor creado: {profesor_user.email}")
    else:
        # Actualizar rol si ya existe
        profesor_user.role = 'profesor'
        profesor_user.is_profesor = True
        profesor_user.save()
        print(f"✅ Usuario profesor actualizado: {profesor_user.email}")
    
    # Crear perfil de profesor si no existe
    profesor_profile, created = Profesor.objects.get_or_create(
        user=profesor_user,
        defaults={
            'especialidad': 'Inglés General',
            'biografia': 'Profesor con 5 años de experiencia en enseñanza de inglés',
            'experiencia_anos': 5,
            'telefono': '+57 300 123 4567'
        }
    )
    if created:
        print(f"✅ Perfil de profesor creado para: {profesor_user.email}")
    
    # Usuario administrador
    admin_user, created = CustomUser.objects.get_or_create(
        email='admin@thelanguage.com',
        defaults={
            'username': 'admin_test',
            'first_name': 'María',
            'last_name': 'López',
            'role': 'admin',
            'is_profesor': False,
            'is_staff': True,
            'is_superuser': True,
            'profile_completed': True
        }
    )
    if created:
        admin_user.set_password('Admin123')
        admin_user.save()
        print(f"✅ Usuario administrador creado: {admin_user.email}")
    else:
        # Actualizar rol si ya existe
        admin_user.role = 'admin'
        admin_user.is_staff = True
        admin_user.is_superuser = True
        admin_user.save()
        print(f"✅ Usuario administrador actualizado: {admin_user.email}")
    
    print("\n🎉 Usuarios de prueba creados exitosamente!")
    print("\n📋 Credenciales de acceso:")
    print("👨‍🎓 Estudiante: estudiante@thelanguage.com / Estudiante123")
    print("👨‍🏫 Profesor: profesor@thelanguage.com / Profesor123")
    print("👨‍💼 Administrador: admin@thelanguage.com / Admin123")

if __name__ == '__main__':
    create_test_users()
