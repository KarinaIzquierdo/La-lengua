"""
Script para crear usuarios de prueba con el nuevo sistema de correo personal
"""
import os
import django

# Configurar Django
import sys
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser

def crear_usuarios_prueba():
    """Crea 3 usuarios de prueba: admin, profesor y estudiante"""
    
    usuarios_creados = []
    
    # 1. ADMIN
    print("\n📋 Creando usuario ADMIN...")
    try:
        admin = CustomUser.objects.filter(correo_personal='admin@gmail.com').first()
        if admin:
            print(f"⚠️  Admin ya existe: {admin.username}")
        else:
            admin = CustomUser.objects.create_user(
                username='admin@gmail.com',
                email='admin@thelanguage.co',
                correo_personal='admin@gmail.com',
                first_name='Admin',
                last_name='Sistema',
                role='admin',
                is_staff=True,
                is_superuser=True,
                is_active=True
            )
            admin.set_password('Admin123')
            admin.save()
            usuarios_creados.append(admin)
            print(f"✅ Admin creado exitosamente")
    except Exception as e:
        print(f"❌ Error creando admin: {e}")
    
    # 2. PROFESOR
    print("\n👨‍🏫 Creando usuario PROFESOR...")
    try:
        profesor = CustomUser.objects.filter(correo_personal='profesor@gmail.com').first()
        if profesor:
            print(f"⚠️  Profesor ya existe: {profesor.username}")
        else:
            profesor = CustomUser.objects.create_user(
                username='profesor@gmail.com',
                email='profesor@thelanguage.co',
                correo_personal='profesor@gmail.com',
                first_name='Carlos',
                last_name='Martínez',
                role='profesor',
                is_profesor=True,
                is_active=True
            )
            profesor.set_password('Profesor123')
            profesor.save()
            usuarios_creados.append(profesor)
            print(f"✅ Profesor creado exitosamente")
    except Exception as e:
        print(f"❌ Error creando profesor: {e}")
    
    # 3. ESTUDIANTE
    print("\n👨‍🎓 Creando usuario ESTUDIANTE...")
    try:
        estudiante = CustomUser.objects.filter(correo_personal='estudiante@gmail.com').first()
        if estudiante:
            print(f"⚠️  Estudiante ya existe: {estudiante.username}")
        else:
            estudiante = CustomUser.objects.create_user(
                username='estudiante@gmail.com',
                email='estudiante@thelanguage.co',
                correo_personal='estudiante@gmail.com',
                first_name='María',
                last_name='García',
                role='student',
                english_level='intermediate',
                is_active=True
            )
            estudiante.set_password('Estudiante123')
            estudiante.save()
            usuarios_creados.append(estudiante)
            print(f"✅ Estudiante creado exitosamente")
    except Exception as e:
        print(f"❌ Error creando estudiante: {e}")
    
    # Resumen
    print("\n" + "="*60)
    print("📊 RESUMEN DE USUARIOS CREADOS")
    print("="*60)
    
    if usuarios_creados:
        for user in usuarios_creados:
            print(f"\n👤 {user.role.upper()}")
            print(f"   Nombre: {user.first_name} {user.last_name}")
            print(f"   Correo Personal (Login): {user.correo_personal}")
            print(f"   Correo Institucional: {user.email}")
            print(f"   Contraseña: {user.role.capitalize()}123")
    
    print("\n" + "="*60)
    print("🔐 CREDENCIALES PARA LOGIN:")
    print("="*60)
    print("\n1️⃣  ADMIN:")
    print("   Email: admin@gmail.com")
    print("   Password: Admin123")
    
    print("\n2️⃣  PROFESOR:")
    print("   Email: profesor@gmail.com")
    print("   Password: Profesor123")
    
    print("\n3️⃣  ESTUDIANTE:")
    print("   Email: estudiante@gmail.com")
    print("   Password: Estudiante123")
    
    print("\n✅ Todos los usuarios están listos para usar!")
    print("="*60 + "\n")

if __name__ == '__main__':
    crear_usuarios_prueba()
