#!/usr/bin/env python
"""
Script para crear respuestas de evaluación con archivos de ejemplo
"""
import os
import sys
import django
from datetime import datetime, timedelta
from django.utils import timezone
from django.core.files.base import ContentFile

# Configurar Django
sys.path.append('/Users/sena/Desktop/The Language/La_lengua/backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser, Evaluacion, RespuestaEvaluacion

def crear_archivos_ejemplo():
    """Crear archivos de ejemplo para las respuestas"""
    
    # Crear contenido de ejemplo para diferentes tipos de archivo
    contenidos_ejemplo = {
        'essay_pedro.txt': """
My Future Plans Essay
By Pedro Martinez

In the next five years, I plan to complete my English studies and pursue a career in international business. 
I believe that mastering English will open many doors for me professionally.

First, I will focus on improving my conversation skills through practice with native speakers. 
Second, I want to obtain an international certification like TOEFL or IELTS.
Finally, I hope to study abroad for at least one semester to immerse myself completely in the language.

These goals will help me achieve my dream of working for a multinational company where I can use English daily.
        """.strip(),
        
        'homework_maria.txt': """
Past Tense Review Homework
Student: Maria Lopez

Exercise 1: Complete with the correct past tense form
1. Yesterday I (go) went to the supermarket.
2. She (study) studied English for three hours.
3. They (play) played soccer in the park.
4. We (watch) watched a movie last night.
5. He (eat) ate pizza for dinner.

Exercise 2: Write sentences using past tense
1. Last week I visited my grandmother in the countryside.
2. My friends and I traveled to the beach last summer.
3. I finished my homework before dinner yesterday.
4. She called me at 9 PM last night.
5. We celebrated my birthday with a big party.
        """.strip(),
        
        'quiz_answers.txt': """
Present Perfect Quiz - Student Answers

1. I have lived in this city for five years.
2. She has never been to Europe.
3. They have just finished their homework.
4. We have known each other since childhood.
5. He has worked here for two months.
6. Have you ever visited Japan?
7. I haven't seen that movie yet.
8. She has already completed the project.
9. We have been friends for a long time.
10. They have recently moved to a new house.
        """.strip()
    }
    
    return contenidos_ejemplo

def crear_respuestas_con_archivos():
    print("Creando respuestas de evaluación con archivos de ejemplo...")
    
    # Obtener profesor y estudiantes
    try:
        profesor = CustomUser.objects.get(username='profesor_test')
        estudiantes = CustomUser.objects.filter(username__startswith='estudiante_')
        
        if not estudiantes.exists():
            print("❌ No se encontraron estudiantes de prueba. Ejecuta primero create_test_data.py")
            return
            
        print(f"✓ Encontrado profesor: {profesor.username}")
        print(f"✓ Encontrados {estudiantes.count()} estudiantes")
        
    except CustomUser.DoesNotExist:
        print("❌ No se encontró el profesor de prueba. Ejecuta primero create_test_data.py")
        return
    
    # Obtener evaluaciones del profesor
    evaluaciones = Evaluacion.objects.filter(profesor=profesor)
    
    if not evaluaciones.exists():
        print("❌ No se encontraron evaluaciones. Ejecuta primero create_test_data.py")
        return
        
    print(f"✓ Encontradas {evaluaciones.count()} evaluaciones")
    
    # Crear archivos de ejemplo
    contenidos = crear_archivos_ejemplo()
    
    # Crear respuestas con archivos para diferentes evaluaciones
    respuestas_creadas = 0
    
    for i, estudiante in enumerate(estudiantes[:3]):  # Solo primeros 3 estudiantes
        for j, evaluacion in enumerate(evaluaciones[:2]):  # Solo primeras 2 evaluaciones
            
            # Verificar si ya existe una respuesta
            respuesta_existente = RespuestaEvaluacion.objects.filter(
                estudiante=estudiante,
                evaluacion=evaluacion
            ).first()
            
            if respuesta_existente:
                # Actualizar respuesta existente con archivo
                if not respuesta_existente.archivo_respuesta:
                    
                    # Seleccionar contenido apropiado
                    if 'Essay' in evaluacion.titulo:
                        contenido_key = 'essay_pedro.txt'
                        nombre_archivo = f'essay_{estudiante.username}.txt'
                    elif 'Quiz' in evaluacion.titulo:
                        contenido_key = 'quiz_answers.txt'
                        nombre_archivo = f'quiz_{estudiante.username}.txt'
                    else:
                        contenido_key = 'homework_maria.txt'
                        nombre_archivo = f'homework_{estudiante.username}.txt'
                    
                    # Crear archivo con contenido personalizado
                    contenido = contenidos[contenido_key].replace('Pedro Martinez', estudiante.get_full_name())
                    contenido = contenido.replace('Maria Lopez', estudiante.get_full_name())
                    
                    archivo_content = ContentFile(contenido.encode('utf-8'))
                    respuesta_existente.archivo_respuesta.save(
                        nombre_archivo,
                        archivo_content,
                        save=True
                    )
                    
                    respuestas_creadas += 1
                    print(f"✓ Archivo agregado a respuesta de {estudiante.get_full_name()} para '{evaluacion.titulo}'")
            
            else:
                # Crear nueva respuesta con archivo
                if 'Essay' in evaluacion.titulo:
                    contenido_key = 'essay_pedro.txt'
                    nombre_archivo = f'essay_{estudiante.username}.txt'
                elif 'Quiz' in evaluacion.titulo:
                    contenido_key = 'quiz_answers.txt'
                    nombre_archivo = f'quiz_{estudiante.username}.txt'
                else:
                    contenido_key = 'homework_maria.txt'
                    nombre_archivo = f'homework_{estudiante.username}.txt'
                
                # Crear archivo con contenido personalizado
                contenido = contenidos[contenido_key].replace('Pedro Martinez', estudiante.get_full_name())
                contenido = contenido.replace('Maria Lopez', estudiante.get_full_name())
                
                archivo_content = ContentFile(contenido.encode('utf-8'))
                
                # Crear nueva respuesta
                respuesta = RespuestaEvaluacion.objects.create(
                    estudiante=estudiante,
                    evaluacion=evaluacion,
                    respuestas_json={'respuesta_texto': f'Ver archivo adjunto - {nombre_archivo}'},
                    completado=True,
                    tiempo_gastado=1800  # 30 minutos
                )
                
                respuesta.archivo_respuesta.save(
                    nombre_archivo,
                    archivo_content,
                    save=True
                )
                
                respuestas_creadas += 1
                print(f"✓ Nueva respuesta con archivo creada para {estudiante.get_full_name()} - '{evaluacion.titulo}'")
    
    print(f"\n🎉 Proceso completado!")
    print(f"✓ {respuestas_creadas} respuestas actualizadas/creadas con archivos")
    print(f"✓ Total respuestas en sistema: {RespuestaEvaluacion.objects.count()}")
    print(f"✓ Respuestas con archivos: {RespuestaEvaluacion.objects.exclude(archivo_respuesta='').count()}")
    
    print("\n📋 Resumen de archivos creados:")
    respuestas_con_archivos = RespuestaEvaluacion.objects.exclude(archivo_respuesta='')
    for respuesta in respuestas_con_archivos:
        print(f"  - {respuesta.estudiante.get_full_name()}: {respuesta.evaluacion.titulo}")
        print(f"    Archivo: {respuesta.archivo_respuesta.name}")
    
    print("\n🔍 Para ver los archivos, ve a 'Calificar Evaluaciones' en el dashboard del profesor.")

if __name__ == '__main__':
    crear_respuestas_con_archivos()
