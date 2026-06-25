#!/usr/bin/env python3
import os
import sys
import django
from datetime import datetime

# Configurar Django
sys.path.append('/Users/sena/Desktop/The Language/La_lengua/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser

# Crear usuario específico para probar onboarding
try:
    # Generar username único con timestamp
    timestamp = datetime.now().strftime("%H%M%S")
    username = f'newuser{timestamp}'
    
    user = CustomUser.objects.create_user(
        username=username,
        email=f'{username}@thelanguage.com',
        password='onboarding123',
        first_name='Nuevo',
        last_name='Usuario',
        phone='+57 300 555 0000',
        country='Colombia',
        city='Medellín',
        level='nivel1'
    )
    print("=" * 50)
    print("🎉 USUARIO PARA ONBOARDING CREADO")
    print("=" * 50)
    print(f"👤 Usuario: {user.username}")
    print(f"📧 Email: {user.email}")
    print(f"🔑 Contraseña: onboarding123")
    print("=" * 50)
    print("✨ Este usuario NO ha visto el onboarding")
    print("🚀 Úsalo para probar el tour guiado")
    print("=" * 50)
except Exception as e:
    print(f"❌ Error al crear usuario: {e}")
