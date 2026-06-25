#!/usr/bin/env python3
"""
Script para crear las especializaciones iniciales en la base de datos
"""
import os
import sys
import django

# Configurar Django
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Especializacion

def create_especializaciones():
    """Crear especializaciones iniciales"""
    
    especializaciones_data = [
        {
            'nombre': 'Inglés para Finanzas',
            'descripcion': 'Especialización en terminología financiera, presentaciones de negocios y comunicación corporativa.',
            'duracion': '8 semanas',
            'precio': 299.00,
            'activa': True
        },
        {
            'nombre': 'Inglés para Negocios',
            'descripcion': 'Enfoque en reuniones de trabajo, negociaciones y correspondencia empresarial.',
            'duracion': '10 semanas',
            'precio': 349.00,
            'activa': True
        },
        {
            'nombre': 'Inglés para Viajes',
            'descripcion': 'Vocabulario y frases esenciales para turismo, hoteles, aeropuertos y situaciones de viaje.',
            'duracion': '6 semanas',
            'precio': 199.00,
            'activa': True
        },
        {
            'nombre': 'Inglés Técnico',
            'descripcion': 'Terminología especializada para profesionales de IT, ingeniería y ciencias.',
            'duracion': '12 semanas',
            'precio': 399.00,
            'activa': False
        },
        {
            'nombre': 'Inglés para Call Center',
            'descripcion': 'Comunicación telefónica efectiva, atención al cliente y resolución de problemas en inglés.',
            'duracion': '6 semanas',
            'precio': 249.00,
            'activa': True
        }
    ]
    
    created_count = 0
    
    for esp_data in especializaciones_data:
        especializacion, created = Especializacion.objects.get_or_create(
            nombre=esp_data['nombre'],
            defaults=esp_data
        )
        
        if created:
            print(f"✅ Creada: {especializacion.nombre}")
            created_count += 1
        else:
            print(f"⚠️  Ya existe: {especializacion.nombre}")
    
    print(f"\n🎉 Proceso completado. {created_count} especializaciones creadas.")
    print(f"📊 Total de especializaciones en la base de datos: {Especializacion.objects.count()}")

if __name__ == '__main__':
    print("🚀 Creando especializaciones iniciales...")
    create_especializaciones()
