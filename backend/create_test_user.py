#!/usr/bin/env python3
import os
import sys
import django

# Configurar Django
sys.path.append('/Users/sena/Desktop/The Language/La_lengua/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser

# Crear usuario de prueba
try:
    user = CustomUser.objects.create_user(
        username='testuser',
        email='test@thelanguage.com',
        password='password123',
        first_name='Usuario',
        last_name='Prueba',
        phone='+57 300 123 4567',
        country='Colombia',
        city='Bogotá',
        level='nivel1'
    )
    print(f"Usuario creado exitosamente: {user.username}")
    print(f"Email: {user.email}")
    print("Contraseña: password123")
except Exception as e:
    print(f"Error al crear usuario: {e}")
