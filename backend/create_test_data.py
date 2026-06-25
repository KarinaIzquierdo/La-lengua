#!/usr/bin/env python
"""
Script para crear datos de prueba para el sistema de notificaciones
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone

# Configurar Django
sys.path.append('/Users/sena/Desktop/The Language/La_lengua/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser, Clase, Evaluacion, RespuestaEvaluacion

def crear_datos_prueba():
    print("Creando datos de prueba para el sistema de notificaciones...")
    
    # Obtener o crear profesor de prueba
    profesor, created = CustomUser.objects.get_or_create(
        username='profesor_test',
        defaults={
            'email': 'profesor@test.com',
            'first_name': 'María',
            'last_name': 'García',
            'role': 'profesor',
            'especialidad': 'Inglés Avanzado'
        }
    )
    if created:
        profesor.set_password('test123')
        profesor.save()
        print(f"✓ Profesor creado: {profesor.get_full_name()}")
    else:
        print(f"✓ Profesor existente: {profesor.get_full_name()}")
    
    # Crear estudiantes de prueba
    estudiantes = []
    for i in range(5):
        estudiante, created = CustomUser.objects.get_or_create(
            username=f'estudiante_{i+1}',
            defaults={
                'email': f'estudiante{i+1}@test.com',
                'first_name': f'Estudiante',
                'last_name': f'{i+1}',
                'role': 'estudiante'
            }
        )
        if created:
            estudiante.set_password('test123')
            estudiante.save()
        estudiantes.append(estudiante)
    
    print(f"✓ {len(estudiantes)} estudiantes creados/verificados")
    
    # Crear clases de prueba
    hoy = timezone.now().date()
    manana = hoy + timedelta(days=1)
    
    # Clase para hoy
    clase_hoy, created = Clase.objects.get_or_create(
        profesor=profesor.get_full_name(),
        fecha=hoy,
        hora='10:00',
        defaults={
            'tema': 'Conversación Avanzada - Present Perfect',
            'descripcion': 'Práctica de conversación usando present perfect continuous',
            'estado': 'programada',
            'meet_link': 'https://meet.google.com/abc-defg-hij'
        }
    )
    if created:
        clase_hoy.estudiantes.set(estudiantes[:3])
        print(f"✓ Clase creada para hoy: {clase_hoy.tema}")
    
    # Clase para mañana
    clase_manana, created = Clase.objects.get_or_create(
        profesor=profesor.get_full_name(),
        fecha=manana,
        hora='14:30',
        defaults={
            'tema': 'Gramática - Conditional Sentences',
            'descripcion': 'Estudio de oraciones condicionales tipo 1, 2 y 3',
            'estado': 'programada',
            'meet_link': 'https://meet.google.com/xyz-uvwx-rst'
        }
    )
    if created:
        clase_manana.estudiantes.set(estudiantes[2:])
        print(f"✓ Clase creada para mañana: {clase_manana.tema}")
    
    # Crear evaluaciones de prueba
    evaluacion1, created = Evaluacion.objects.get_or_create(
        titulo='Quiz - Present Perfect',
        defaults={
            'descripcion': 'Evaluación sobre el uso del present perfect',
            'tipo': 'quiz',
            'estado': 'publicada',
            'fecha_limite': timezone.now() + timedelta(days=3),
            'profesor': profesor
        }
    )
    if created:
        evaluacion1.estudiantes_asignados.set(estudiantes[:4])
        print(f"✓ Evaluación creada: {evaluacion1.titulo}")
    
    evaluacion2, created = Evaluacion.objects.get_or_create(
        titulo='Essay - My Future Plans',
        defaults={
            'descripcion': 'Ensayo sobre planes futuros usando will y going to',
            'tipo': 'tarea',
            'estado': 'publicada',
            'fecha_limite': timezone.now() + timedelta(days=1),
            'profesor': profesor
        }
    )
    if created:
        evaluacion2.estudiantes_asignados.set(estudiantes[1:])
        print(f"✓ Evaluación creada: {evaluacion2.titulo}")
    
    # Crear algunas respuestas de evaluación
    for i, estudiante in enumerate(estudiantes[:2]):
        respuesta, created = RespuestaEvaluacion.objects.get_or_create(
            evaluacion=evaluacion1,
            estudiante=estudiante,
            defaults={
                'respuestas_json': {'pregunta1': f'Respuesta del estudiante {estudiante.first_name}'},
                'completado': True,
                'tiempo_gastado': 1200  # 20 minutos
            }
        )
        if created:
            print(f"✓ Respuesta creada para {estudiante.first_name}")
    
    # Crear una respuesta que necesita calificación urgente (vencida)
    evaluacion_vencida, created = Evaluacion.objects.get_or_create(
        titulo='Homework - Past Tense Review',
        defaults={
            'descripcion': 'Tarea sobre tiempos pasados',
            'tipo': 'tarea',
            'estado': 'publicada',
            'fecha_limite': timezone.now() - timedelta(days=2),  # Vencida
            'profesor': profesor
        }
    )
    if created:
        evaluacion_vencida.estudiantes_asignados.set(estudiantes[:3])
        
        # Crear respuesta sin calificar para evaluación vencida
        RespuestaEvaluacion.objects.get_or_create(
            evaluacion=evaluacion_vencida,
            estudiante=estudiantes[0],
            defaults={
                'respuestas_json': {'tarea': 'Tarea completada sobre past tense'},
                'completado': True,
                'tiempo_gastado': 1800  # 30 minutos
            }
        )
        print(f"✓ Evaluación vencida creada: {evaluacion_vencida.titulo}")
    
    print("\n🎉 Datos de prueba creados exitosamente!")
    print("\nResumen:")
    print(f"- Profesor: {profesor.username} (password: test123)")
    print(f"- Estudiantes: estudiante_1 a estudiante_5 (password: test123)")
    print(f"- Clases: {Clase.objects.filter(profesor=profesor.get_full_name()).count()}")
    print(f"- Evaluaciones: {Evaluacion.objects.filter(profesor=profesor).count()}")
    print(f"- Respuestas: {RespuestaEvaluacion.objects.count()}")
    
    print("\nPara generar notificaciones, inicia sesión como 'profesor_test' y visita la sección de notificaciones.")

if __name__ == '__main__':
    crear_datos_prueba()
