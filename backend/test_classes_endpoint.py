#!/usr/bin/env python3
"""
Script para probar el endpoint de clases móviles
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser
from api.views import mobile_classes_view
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

# Crear factory
factory = APIRequestFactory()

# Obtener usuario
user = CustomUser.objects.get(email='adrian@thelanguage.co')
print(f"✅ Usuario: {user.username}")
print(f"✅ Email: {user.email}")

# Crear token
token = RefreshToken.for_user(user)
access_token = str(token.access_token)
print(f"✅ Token generado")

# Crear request
request = factory.get('/api/classes/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
request.user = user

# Llamar a la vista
response = mobile_classes_view(request)

print(f"\n📊 Status Code: {response.status_code}")
print(f"📊 Response Data:")
print(f"   - Success: {response.data.get('success')}")
print(f"   - Total: {response.data.get('total')}")
print(f"   - Clases count: {len(response.data.get('clases', []))}")

print(f"\n📚 Clases devueltas:")
for clase in response.data.get('clases', []):
    print(f"   - ID: {clase['id']}, Nombre: {clase['nombre']}, Profesor: {clase['profesor']}, Fecha: {clase['fecha']}, Estado: {clase['estado']}")
