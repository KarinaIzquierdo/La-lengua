#!/usr/bin/env python3
"""
Script para probar el endpoint de evaluaciones móviles
"""
import os
import django
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser
from api.views import mobile_evaluations_view
from rest_framework.test import APIRequestFactory
from rest_framework_simplejwt.tokens import RefreshToken

# Crear factory
factory = APIRequestFactory()

# Obtener usuario
user = CustomUser.objects.get(email='adrian@thelanguage.co')
print(f"✅ Usuario: {user.username}")
print(f"✅ Email: {user.email}")

# Verificar evaluaciones en BD
print(f"\n📚 Evaluaciones en BD:")
evals = user.evaluaciones_asignadas.all()
print(f"   Total: {evals.count()}")
for ev in evals:
    print(f"   - ID: {ev.id}, Titulo: {ev.titulo}, Estado: {ev.estado}")

# Crear token
token = RefreshToken.for_user(user)
access_token = str(token.access_token)
print(f"\n✅ Token generado")

# Crear request
request = factory.get('/api/evaluations/', HTTP_AUTHORIZATION=f'Bearer {access_token}')
request.user = user

# Llamar a la vista
response = mobile_evaluations_view(request)

print(f"\n📊 Status Code: {response.status_code}")
print(f"\n📊 Response completa:")
print(json.dumps(response.data, indent=2, default=str))
