#!/usr/bin/env python3
"""
Script para crear bloques iniciales en la base de datos
Ejecutar desde el directorio backend: python3 crear_bloques_iniciales.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Bloque
from datetime import time

# Definir los bloques a crear
bloques_data = [
    # Nivel A1
    {'nombre': 'Mañana', 'nivel': 'A1', 'grupo_color': '#4CAF50', 'horario_inicio': time(8, 0), 'horario_fin': time(10, 0)},
    {'nombre': 'Tarde', 'nivel': 'A1', 'grupo_color': '#2196F3', 'horario_inicio': time(14, 0), 'horario_fin': time(16, 0)},
    {'nombre': 'Noche', 'nivel': 'A1', 'grupo_color': '#9C27B0', 'horario_inicio': time(18, 0), 'horario_fin': time(20, 0)},
    
    # Nivel A2
    {'nombre': 'Mañana', 'nivel': 'A2', 'grupo_color': '#4CAF50', 'horario_inicio': time(8, 0), 'horario_fin': time(10, 0)},
    {'nombre': 'Tarde', 'nivel': 'A2', 'grupo_color': '#2196F3', 'horario_inicio': time(14, 0), 'horario_fin': time(16, 0)},
    {'nombre': 'Noche', 'nivel': 'A2', 'grupo_color': '#9C27B0', 'horario_inicio': time(18, 0), 'horario_fin': time(20, 0)},
    
    # Nivel B1
    {'nombre': 'Mañana', 'nivel': 'B1', 'grupo_color': '#4CAF50', 'horario_inicio': time(8, 0), 'horario_fin': time(10, 0)},
    {'nombre': 'Tarde', 'nivel': 'B1', 'grupo_color': '#2196F3', 'horario_inicio': time(14, 0), 'horario_fin': time(16, 0)},
    {'nombre': 'Noche', 'nivel': 'B1', 'grupo_color': '#9C27B0', 'horario_inicio': time(18, 0), 'horario_fin': time(20, 0)},
    
    # Nivel B2
    {'nombre': 'Mañana', 'nivel': 'B2', 'grupo_color': '#4CAF50', 'horario_inicio': time(8, 0), 'horario_fin': time(10, 0)},
    {'nombre': 'Tarde', 'nivel': 'B2', 'grupo_color': '#2196F3', 'horario_inicio': time(14, 0), 'horario_fin': time(16, 0)},
    {'nombre': 'Noche', 'nivel': 'B2', 'grupo_color': '#9C27B0', 'horario_inicio': time(18, 0), 'horario_fin': time(20, 0)},
    
    # Nivel C1
    {'nombre': 'Mañana', 'nivel': 'C1', 'grupo_color': '#4CAF50', 'horario_inicio': time(8, 0), 'horario_fin': time(10, 0)},
    {'nombre': 'Tarde', 'nivel': 'C1', 'grupo_color': '#2196F3', 'horario_inicio': time(14, 0), 'horario_fin': time(16, 0)},
    {'nombre': 'Noche', 'nivel': 'C1', 'grupo_color': '#9C27B0', 'horario_inicio': time(18, 0), 'horario_fin': time(20, 0)},
    
    # Nivel C2
    {'nombre': 'Mañana', 'nivel': 'C2', 'grupo_color': '#4CAF50', 'horario_inicio': time(8, 0), 'horario_fin': time(10, 0)},
    {'nombre': 'Tarde', 'nivel': 'C2', 'grupo_color': '#2196F3', 'horario_inicio': time(14, 0), 'horario_fin': time(16, 0)},
    {'nombre': 'Noche', 'nivel': 'C2', 'grupo_color': '#9C27B0', 'horario_inicio': time(18, 0), 'horario_fin': time(20, 0)},
]

print("🚀 Creando bloques iniciales...")
print("=" * 50)

creados = 0
existentes = 0

for bloque_data in bloques_data:
    bloque, created = Bloque.objects.get_or_create(
        nombre=bloque_data['nombre'],
        nivel=bloque_data['nivel'],
        defaults={
            'grupo_color': bloque_data['grupo_color'],
            'horario_inicio': bloque_data['horario_inicio'],
            'horario_fin': bloque_data['horario_fin'],
            'estado': 'configurado',
            'cupo_maximo': 20,
            'activo': True
        }
    )
    
    if created:
        print(f"✅ Creado: {bloque.nivel} - {bloque.nombre}")
        creados += 1
    else:
        print(f"ℹ️  Ya existe: {bloque.nivel} - {bloque.nombre}")
        existentes += 1

print("=" * 50)
print(f"📊 Resumen:")
print(f"   - Bloques creados: {creados}")
print(f"   - Bloques existentes: {existentes}")
print(f"   - Total: {Bloque.objects.count()}")
print("\n✨ ¡Listo! Los bloques están disponibles en la API.")
