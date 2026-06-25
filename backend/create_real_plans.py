#!/usr/bin/env python3
import os
import sys
import django

# Configurar Django
sys.path.insert(0, '/Users/sena/Desktop/The Language/La_lengua/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Plan

def create_real_plans():
    # Limpiar planes existentes
    Plan.objects.all().delete()
    print("🗑️ Planes anteriores eliminados")
    
    # Plan Básico - Para estudiantes principiantes
    plan_basico = Plan.objects.create(
        nombre='Plan Básico',
        tipo='basico',
        descripcion='Perfecto para comenzar tu aprendizaje de inglés desde cero',
        precio_base=180000,
        duracion_meses=1,
        caracteristicas=[
            'Acceso a 20 clases básicas',
            'Material de estudio digital',
            'Evaluaciones semanales',
            'Soporte por chat',
            'Certificado de participación'
        ],
        activo=True,
        color_tema='#3b82f6'
    )
    
    # Plan Intermedio - Para estudiantes con conocimientos previos
    plan_intermedio = Plan.objects.create(
        nombre='Plan Intermedio',
        tipo='basico',
        descripcion='Ideal para estudiantes con conocimientos básicos que quieren avanzar',
        precio_base=280000,
        duracion_meses=1,
        caracteristicas=[
            'Acceso a 35 clases (básicas + intermedias)',
            'Material digital y físico',
            'Evaluaciones personalizadas',
            'Soporte prioritario',
            'Sesiones de conversación grupales',
            'Acceso a biblioteca digital'
        ],
        activo=True,
        color_tema='#10b981'
    )
    
    # Plan Premium - Para estudiantes avanzados
    plan_premium = Plan.objects.create(
        nombre='Plan Premium',
        tipo='premium',
        descripcion='La experiencia completa con tutorías personalizadas y acceso total',
        precio_base=450000,
        duracion_meses=1,
        caracteristicas=[
            'Acceso ilimitado a todas las clases',
            'Material premium completo',
            'Tutorías individuales (2 por mes)',
            'Soporte 24/7',
            'Sesiones de conversación privadas',
            'Preparación para exámenes internacionales',
            'Certificado oficial',
            'Acceso a eventos exclusivos'
        ],
        activo=True,
        color_tema='#f59e0b'
    )
    
    # Plan Empresarial - Para empresas
    plan_empresarial = Plan.objects.create(
        nombre='Plan Empresarial',
        tipo='premium',
        descripcion='Solución completa para capacitación empresarial en inglés',
        precio_base=800000,
        duracion_meses=1,
        caracteristicas=[
            'Acceso para hasta 10 empleados',
            'Contenido especializado en inglés de negocios',
            'Reportes de progreso empresarial',
            'Tutor dedicado para la empresa',
            'Horarios flexibles',
            'Certificaciones corporativas',
            'Soporte técnico prioritario'
        ],
        activo=True,
        color_tema='#8b5cf6'
    )
    
    print(f"✅ {plan_basico.nombre} - ${plan_basico.precio_base:,}")
    print(f"✅ {plan_intermedio.nombre} - ${plan_intermedio.precio_base:,}")
    print(f"✅ {plan_premium.nombre} - ${plan_premium.precio_base:,}")
    print(f"✅ {plan_empresarial.nombre} - ${plan_empresarial.precio_base:,}")
    print(f"\n🎉 Se crearon {Plan.objects.count()} planes reales exitosamente!")

if __name__ == '__main__':
    create_real_plans()
