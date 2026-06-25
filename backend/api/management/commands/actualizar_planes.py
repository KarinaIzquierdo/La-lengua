from django.core.management.base import BaseCommand
from api.models import Plan

class Command(BaseCommand):
    help = 'Actualiza los planes con la información real de The Language'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('🔄 Actualizando planes...'))
        
        # Eliminar planes existentes
        Plan.objects.all().delete()
        self.stdout.write(self.style.WARNING('🗑️  Planes anteriores eliminados'))
        
        # Crear planes reales
        planes = [
            {
                'nombre': 'Plan Individual',
                'tipo': 'premium',
                'descripcion': 'Este es nuestro plan premium y más efectivo. Recibes 9 clases de gramática totalmente personalizadas (1:1), lo que garantiza que el docente se centre exclusivamente en tus debilidades y objetivos.',
                'precio_base': 430000,
                'duracion_meses': 1,
                'caracteristicas': [
                    '9 clases de gramática personalizadas (1:1)',
                    '3 Clubs de Conversación',
                    'Material de estudio digital',
                    'Quizes de progreso',
                    'Atención personalizada exclusiva',
                    'Enfoque en tus debilidades específicas'
                ],
                'activo': True,
                'color_tema': '#f59e0b'  # Naranja/Dorado para premium
            },
            {
                'nombre': 'Plan Cero a Héroe',
                'tipo': 'premium',
                'descripcion': 'Diseñado para una inmersión intensiva y constante. Ofrece 8 clases personalizadas al mes (una por semana) más un Club de Conversación cada semana, además de todos los materiales y quizes.',
                'precio_base': 200000,
                'duracion_meses': 1,
                'caracteristicas': [
                    '8 clases personalizadas al mes',
                    '1 Club de Conversación por semana',
                    'Material de estudio completo',
                    'Quizes de progreso',
                    'Inmersión intensiva',
                    'Resultados rápidos garantizados'
                ],
                'activo': True,
                'color_tema': '#8b5cf6'  # Morado para intensivo
            },
            {
                'nombre': 'Plan Dupla / Couple',
                'tipo': 'basico',
                'descripcion': 'Perfecto para dos amigos o pareja. Reciben el mismo contenido de alta calidad (9 clases de gramática compartidas, 3 Clubs, materiales y quizes) por una fracción del costo individual.',
                'precio_base': 300000,
                'duracion_meses': 1,
                'caracteristicas': [
                    '9 clases de gramática compartidas',
                    '3 Clubs de Conversación',
                    'Material de estudio digital',
                    'Quizes de progreso',
                    'Para 2 personas',
                    'Aprendizaje colaborativo'
                ],
                'activo': True,
                'color_tema': '#10b981'  # Verde para grupal
            },
            {
                'nombre': 'Plan Trío',
                'tipo': 'basico',
                'descripcion': 'La opción ideal para un grupo pequeño. Obtienen el mismo paquete de 9 clases y 3 Clubs, maximizando la práctica entre compañeros y optimizando la inversión.',
                'precio_base': 200000,
                'duracion_meses': 1,
                'caracteristicas': [
                    '9 clases de gramática compartidas',
                    '3 Clubs de Conversación',
                    'Material de estudio digital',
                    'Quizes de progreso',
                    'Para 3 personas',
                    'Práctica grupal dinámica'
                ],
                'activo': True,
                'color_tema': '#3b82f6'  # Azul para trío
            },
            {
                'nombre': 'Plan Grupal (4 Personas)',
                'tipo': 'basico',
                'descripcion': 'Es la alternativa más asequible. Disfruten del mismo programa completo con el valor adicional de practicar en un grupo dinámico, ideal para simular interacciones sociales amplias.',
                'precio_base': 150000,
                'duracion_meses': 1,
                'caracteristicas': [
                    '9 clases de gramática compartidas',
                    '3 Clubs de Conversación',
                    'Material de estudio digital',
                    'Quizes de progreso',
                    'Para 4 personas',
                    'Interacciones sociales amplias'
                ],
                'activo': True,
                'color_tema': '#06b6d4'  # Cyan para grupal grande
            },
            {
                'nombre': 'Plan Kids',
                'tipo': 'especializado',
                'descripcion': 'Enfocado en los más pequeños. Ofrece 8 clases personalizadas al mes diseñadas con una metodología totalmente lúdica. Incluye materiales, quizes y juegos interactivos para construir confianza y vocabulario.',
                'precio_base': 200000,  # Precio temporal, ajustar según necesidad
                'duracion_meses': 1,
                'caracteristicas': [
                    '8 clases personalizadas al mes',
                    'Metodología 100% lúdica',
                    'Material didáctico infantil',
                    'Juegos interactivos',
                    'Actividades de desarrollo temprano',
                    'Construcción de confianza y vocabulario'
                ],
                'activo': True,
                'color_tema': '#ec4899'  # Rosa para kids
            }
        ]
        
        # Crear cada plan
        for plan_data in planes:
            plan = Plan.objects.create(**plan_data)
            self.stdout.write(
                self.style.SUCCESS(f'✅ Plan creado: {plan.nombre} - ${plan.precio_base:,.0f} COP')
            )
        
        self.stdout.write(self.style.SUCCESS(f'\n🎉 ¡{len(planes)} planes actualizados exitosamente!'))
