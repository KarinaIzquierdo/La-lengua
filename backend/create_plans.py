#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
sys.path.append('/Users/sena/Desktop/The Language/La_lengua/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Plan

# Crear planes base
planes_data = [
    {
        'nombre': 'Plan Básico',
        'tipo': 'basico',
        'descripcion': 'Plan básico de inglés con acceso a contenido fundamental',
        'precio_base': 150000,
        'duracion_meses': 1,
        'caracteristicas': [
            'Acceso a clases básicas',
            'Material de estudio digital',
            'Evaluaciones mensuales',
            'Soporte por chat'
        ],
        'activo': True,
        'color_tema': '#2563eb'
    },
    {
        'nombre': 'Plan Intermedio',
        'tipo': 'basico',
        'descripcion': 'Plan intermedio con más recursos y práctica',
        'precio_base': 250000,
        'duracion_meses': 1,
        'caracteristicas': [
            'Acceso a clases básicas e intermedias',
            'Material de estudio digital y físico',
            'Evaluaciones semanales',
            'Soporte por chat y email',
            'Sesiones de práctica grupal'
        ],
        'activo': True,
        'color_tema': '#059669'
    },
    {
        'nombre': 'Plan Premium',
        'tipo': 'premium',
        'descripcion': 'Plan premium con acceso completo y tutorías personalizadas',
        'precio_base': 400000,
        'duracion_meses': 1,
        'caracteristicas': [
            'Acceso completo a todas las clases',
            'Material premium digital y físico',
            'Evaluaciones personalizadas',
            'Soporte 24/7',
            'Tutorías individuales',
            'Certificación oficial',
            'Acceso a eventos exclusivos'
        ],
        'activo': True,
        'color_tema': '#dc2626'
    }
]

# Eliminar planes existentes (opcional)
Plan.objects.all().delete()

# Crear los nuevos planes
for plan_data in planes_data:
    plan = Plan.objects.create(**plan_data)
    print(f"Plan creado: {plan.nombre} - ${plan.precio_base}")

print(f"\n✅ Se crearon {len(planes_data)} planes exitosamente")
