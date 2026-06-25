#!/usr/bin/env python3
"""
Script para crear respuestas con archivos para el profesor actualmente autenticado
"""
import os
import sys
import django
from django.core.files.base import ContentFile
from django.utils import timezone
from datetime import timedelta
import random

# Configurar Django
sys.path.append('.')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import CustomUser, Evaluacion, RespuestaEvaluacion

def main():
    print("🔍 Identificando profesores disponibles...")
    
    # Obtener todos los profesores
    profesores = CustomUser.objects.filter(role='profesor')
    print(f"Profesores encontrados: {profesores.count()}")
    
    for profesor in profesores:
        print(f"- {profesor.get_full_name()} ({profesor.username}) - ID: {profesor.id}")
    
    # Usar el primer profesor que no sea profesor_test
    profesor_actual = profesores.exclude(username='profesor_test').first()
    
    if not profesor_actual:
        print("❌ No se encontró un profesor válido")
        return
    
    print(f"\n✅ Usando profesor: {profesor_actual.get_full_name()} ({profesor_actual.username})")
    
    # Obtener estudiantes
    estudiantes = CustomUser.objects.filter(role='estudiante')[:3]
    if estudiantes.count() == 0:
        print("❌ No hay estudiantes disponibles")
        return
    
    print(f"📚 Estudiantes disponibles: {estudiantes.count()}")
    
    # Crear evaluaciones si no existen
    evaluaciones_data = [
        {
            'titulo': 'Essay - My Future Plans',
            'descripcion': 'Write a 300-word essay about your future plans and goals.',
            'tipo': 'tarea'
        },
        {
            'titulo': 'Homework - Past Tense Review',
            'descripcion': 'Complete the exercises about past tense usage.',
            'tipo': 'tarea'
        },
        {
            'titulo': 'Quiz - Present Perfect',
            'descripcion': 'Answer questions about present perfect tense.',
            'tipo': 'quiz'
        }
    ]
    
    evaluaciones_creadas = []
    
    for eval_data in evaluaciones_data:
        evaluacion, created = Evaluacion.objects.get_or_create(
            titulo=eval_data['titulo'],
            profesor=profesor_actual,
            defaults={
                'descripcion': eval_data['descripcion'],
                'tipo': eval_data['tipo'],
                'estado': 'publicada',
                'fecha_limite': timezone.now() + timedelta(days=7)
            }
        )
        
        if created:
            print(f"✅ Evaluación creada: {evaluacion.titulo}")
        else:
            print(f"📋 Evaluación existente: {evaluacion.titulo}")
        
        # Asignar estudiantes
        evaluacion.estudiantes_asignados.set(estudiantes)
        evaluaciones_creadas.append(evaluacion)
    
    # Crear respuestas con archivos
    contenidos_archivos = {
        'Essay - My Future Plans': [
            """My Future Plans

My name is {nombre} and I want to share my future plans with you. In the next five years, I have several important goals that I want to achieve.

First, I want to improve my English skills significantly. Learning English is very important for my career and personal development. I believe that speaking English fluently will open many doors for me in the future.

Second, I plan to advance in my current job or find a better position. I want to take on more responsibilities and learn new skills that will help me grow professionally. I am particularly interested in working with international teams.

Third, I would like to travel to English-speaking countries to practice my language skills and learn about different cultures. I think this experience would be very valuable for my personal growth.

Finally, I want to help other people learn English by sharing my knowledge and experience. Maybe I could become a tutor or volunteer teacher in my community.

These are my main goals for the future. I know it will require hard work and dedication, but I am confident that I can achieve them with persistence and the right mindset.

Thank you for reading about my future plans.

Best regards,
{nombre}""",
            
            """Future Goals Essay

Hello, my name is {nombre} and I am excited to share my future aspirations with you.

Education is my top priority. I want to continue learning English and maybe pursue higher education in an English-speaking university. This would give me better opportunities in my career.

Career-wise, I dream of working in an international company where I can use my English skills daily. I am particularly interested in business development or marketing roles that involve communication with people from different countries.

Personal development is also very important to me. I want to become more confident when speaking English and overcome my fear of making mistakes. I believe practice makes perfect, so I plan to join conversation clubs and online language exchange programs.

In terms of travel, I hope to visit the United States, Canada, or the United Kingdom within the next three years. This would be an amazing opportunity to immerse myself in English-speaking environments and improve my pronunciation and listening skills.

Long-term, I see myself as a successful professional who can communicate effectively in English. I also want to inspire others to learn languages and show them that it's possible to achieve their dreams with determination.

These goals motivate me every day to study harder and practice more. I know the journey won't be easy, but I am committed to making these dreams come true.

Sincerely,
{nombre}"""
        ],
        
        'Homework - Past Tense Review': [
            """Past Tense Homework - {nombre}

Exercise 1: Complete with the correct past tense form

1. Yesterday, I (go) WENT to the supermarket with my family.
2. Last week, we (study) STUDIED English grammar for three hours.
3. She (finish) FINISHED her homework before dinner.
4. They (watch) WATCHED a movie last night.
5. He (call) CALLED his mother yesterday morning.

Exercise 2: Write sentences using past tense

1. Last summer, I traveled to the beach with my friends and we had a wonderful time.
2. Two years ago, I started learning English because I wanted to improve my career opportunities.
3. Yesterday, I cooked dinner for my family and everyone enjoyed the meal.
4. Last month, I bought a new book about English grammar and started reading it immediately.
5. When I was a child, I played soccer every weekend with my neighbors.

Exercise 3: Correct the mistakes

Original: I go to school yesterday.
Corrected: I went to school yesterday.

Original: She study English last night.
Corrected: She studied English last night.

Original: We was happy about the news.
Corrected: We were happy about the news.

Exercise 4: Tell a story using past tense (minimum 100 words)

Last Saturday was a very special day for me. I woke up early because I planned to visit my grandmother. I prepared breakfast quickly and left the house at 9 AM. 

When I arrived at her house, she was very happy to see me. We talked for hours about many things. She told me stories about her youth and I shared my experiences at school.

In the afternoon, we cooked together. She taught me how to make her famous apple pie. It was delicious! We also looked at old photo albums and she explained who the people in the pictures were.

I returned home in the evening feeling very grateful for the time we spent together. It was a perfect day that I will always remember.

Student: {nombre}
Date: {fecha}""",
            
            """Past Tense Review Assignment - {nombre}

Part A: Regular and Irregular Verbs

Regular verbs (add -ed):
- work → worked: I worked late yesterday.
- play → played: The children played in the park.
- study → studied: We studied for the exam last week.
- cook → cooked: My mother cooked a delicious dinner.

Irregular verbs (different forms):
- go → went: They went to the cinema last Friday.
- see → saw: I saw my teacher at the mall.
- eat → ate: We ate pizza for lunch yesterday.
- come → came: She came to the party late.

Part B: Questions and Negatives

Questions:
- Did you finish your homework? Yes, I finished it last night.
- Where did they go yesterday? They went to the museum.
- What time did she arrive? She arrived at 3 PM.

Negatives:
- I didn't watch TV yesterday because I was busy.
- He didn't call me last week.
- We didn't go to school on Monday because it was a holiday.

Part C: Story Writing

My Best Day Last Year

Last December was my birthday, and it became the best day of the year for me. I woke up excited because my family planned a surprise party for me.

In the morning, my parents gave me a beautiful gift - a new bicycle that I wanted for months. I was so happy that I almost cried. After breakfast, we went to the park where I tested my new bike.

In the afternoon, my friends arrived for the party. We played games, listened to music, and ate cake. Everyone brought presents and cards with nice messages. My best friend gave me a book about adventures that I really wanted to read.

The party lasted until evening. When everyone left, I felt tired but extremely happy. It was a day full of love, friendship, and joy that I will never forget.

Completed by: {nombre}
Submission date: {fecha}"""
        ]
    }
    
    print(f"\n📝 Creando respuestas con archivos...")
    
    respuestas_creadas = 0
    for evaluacion in evaluaciones_creadas:
        if evaluacion.titulo in contenidos_archivos:
            contenidos = contenidos_archivos[evaluacion.titulo]
            
            for i, estudiante in enumerate(estudiantes):
                # Verificar si ya existe una respuesta
                respuesta_existente = RespuestaEvaluacion.objects.filter(
                    estudiante=estudiante,
                    evaluacion=evaluacion
                ).first()
                
                if respuesta_existente:
                    print(f"📋 Respuesta existente: {estudiante.get_full_name()} - {evaluacion.titulo}")
                    continue
                
                # Seleccionar contenido
                contenido_idx = i % len(contenidos)
                contenido = contenidos[contenido_idx].format(
                    nombre=estudiante.get_full_name(),
                    fecha=timezone.now().strftime('%Y-%m-%d')
                )
                
                # Crear archivo
                if 'Essay' in evaluacion.titulo:
                    filename = f"essay_{estudiante.username}.txt"
                    respuesta_texto = "Ver archivo adjunto - essay completo"
                elif 'Homework' in evaluacion.titulo:
                    filename = f"homework_{estudiante.username}.txt"
                    respuesta_texto = "Ver archivo adjunto - tarea completada"
                else:
                    filename = f"quiz_{estudiante.username}.txt"
                    respuesta_texto = "Respuestas en archivo adjunto"
                
                archivo_content = ContentFile(contenido.encode('utf-8'))
                archivo_content.name = filename
                
                # Crear respuesta
                respuesta = RespuestaEvaluacion.objects.create(
                    estudiante=estudiante,
                    evaluacion=evaluacion,
                    archivo_respuesta=archivo_content,
                    respuestas_json={'respuesta_texto': respuesta_texto},
                    tiempo_gastado=random.randint(1200, 2400),  # 20-40 minutos
                    advertencias=random.randint(0, 2),
                    completado=True,
                    fecha_envio=timezone.now() - timedelta(hours=random.randint(1, 48))
                )
                
                print(f"✅ Respuesta creada: {estudiante.get_full_name()} - {evaluacion.titulo} - {filename}")
                respuestas_creadas += 1
    
    print(f"\n🎉 ¡Proceso completado!")
    print(f"📊 Respuestas con archivos creadas: {respuestas_creadas}")
    print(f"👨‍🏫 Profesor: {profesor_actual.get_full_name()}")
    print(f"📚 Evaluaciones: {len(evaluaciones_creadas)}")
    
    # Mostrar resumen
    print(f"\n📋 Resumen de respuestas por calificar:")
    respuestas_sin_calificar = RespuestaEvaluacion.objects.filter(
        evaluacion__profesor=profesor_actual,
        calificacion__isnull=True
    )
    
    for respuesta in respuestas_sin_calificar:
        archivo_info = "📎 Con archivo" if respuesta.archivo_respuesta else "📝 Solo texto"
        print(f"- {respuesta.estudiante.get_full_name()} - {respuesta.evaluacion.titulo} - {archivo_info}")

if __name__ == '__main__':
    main()
