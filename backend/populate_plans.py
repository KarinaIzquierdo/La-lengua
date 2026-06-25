import os
import django
import sys

# Add the project directory to Python path
project_path = '/Users/sena/Desktop/The Language/La_lengua/backend'
sys.path.append(project_path)

# Set up Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import Plan

def create_plans():
    # Eliminar planes existentes
    Plan.objects.all().delete()
    
    # Crear Plan Básico
    plan_basico = Plan.objects.create(
        nombre='Plan Básico',
        tipo='basico',
        descripcion='Plan básico de inglés con acceso a contenido fundamental',
        precio_base=150000.00,
        duracion_meses=1,
        caracteristicas=[
            'Acceso a clases básicas',
            'Material de estudio digital',
            'Evaluaciones mensuales',
            'Soporte por chat'
        ],
        activo=True,
        color_tema='#2563eb'
    )
    
    # Crear Plan Intermedio
    plan_intermedio = Plan.objects.create(
        nombre='Plan Intermedio',
        tipo='basico',
        descripcion='Plan intermedio con más recursos y práctica',
        precio_base=250000.00,
        duracion_meses=1,
        caracteristicas=[
            'Acceso a clases básicas e intermedias',
            'Material de estudio digital y físico',
            'Evaluaciones semanales',
            'Soporte por chat y email',
            'Sesiones de práctica grupal'
        ],
        activo=True,
        color_tema='#059669'
    )
    
    # Crear Plan Premium
    plan_premium = Plan.objects.create(
        nombre='Plan Premium',
        tipo='premium',
        descripcion='Plan premium con acceso completo y tutorías personalizadas',
        precio_base=400000.00,
        duracion_meses=1,
        caracteristicas=[
            'Acceso completo a todas las clases',
            'Material premium digital y físico',
            'Evaluaciones personalizadas',
            'Soporte 24/7',
            'Tutorías individuales',
            'Certificación oficial',
            'Acceso a eventos exclusivos'
        ],
        activo=True,
        color_tema='#dc2626'
    )
    
    print(f"✅ Plan creado: {plan_basico.nombre} - ${plan_basico.precio_base}")
    print(f"✅ Plan creado: {plan_intermedio.nombre} - ${plan_intermedio.precio_base}")
    print(f"✅ Plan creado: {plan_premium.nombre} - ${plan_premium.precio_base}")
    print(f"\n🎉 Se crearon 3 planes exitosamente!")

if __name__ == '__main__':
    create_plans()
