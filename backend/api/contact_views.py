from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework import status
from django.core.mail import EmailMultiAlternatives
from django.conf import settings


@api_view(['POST'])
@permission_classes([AllowAny])
def send_contact_email(request):
    """
    Endpoint para enviar emails de contacto desde el formulario web
    """
    try:
        # Obtener datos del formulario
        first_name = request.data.get('firstName', '')
        last_name = request.data.get('lastName', '')
        email = request.data.get('email', '')
        phone = request.data.get('phone', '')
        country = request.data.get('country', '')
        city = request.data.get('city', '')
        level = request.data.get('level', '')
        reason = request.data.get('reason', '')
        source = request.data.get('source', '')
        contact_method = request.data.get('contactMethod', '')
        
        # Validar campos requeridos
        if not all([first_name, last_name, email]):
            return Response({
                'success': False,
                'message': 'Por favor, completa todos los campos requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Preparar email
        subject = f'📬 Nueva Solicitud de Contacto - {first_name} {last_name}'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = ['the.languagess@gmail.com']  # Email donde recibirás las solicitudes
        
        # Contenido en texto plano
        text_content = f"""
Nueva solicitud de contacto desde La Lengua

Nombre: {first_name} {last_name}
Email: {email}
Teléfono: {phone}
País: {country}
Ciudad: {city}
Programa: {level}
Razón: {reason}
Se enteró por: {source}
Prefiere contacto por: {contact_method}
        """
        
        # Contenido HTML
        html_content = f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Solicitud - La Lengua</title>
    <style>
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }}
        .container {{
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }}
        .header {{
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px 30px;
            text-align: center;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .header p {{
            margin: 10px 0 0 0;
            font-size: 16px;
            opacity: 0.9;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .info-box {{
            background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
            padding: 20px;
            border-left: 4px solid #667eea;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .info-item {{
            margin: 15px 0;
            padding: 10px 0;
            border-bottom: 1px solid #e0e0e0;
        }}
        .info-item:last-child {{
            border-bottom: none;
        }}
        .info-label {{
            font-weight: 600;
            color: #667eea;
            display: block;
            margin-bottom: 5px;
        }}
        .info-value {{
            color: #333;
            font-size: 16px;
        }}
        .footer {{
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            color: #666;
            font-size: 14px;
            border-top: 1px solid #e0e0e0;
        }}
        .footer p {{
            margin: 5px 0;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 Nueva Solicitud de Contacto</h1>
            <p>Un usuario ha enviado sus datos</p>
        </div>
        
        <div class="content">
            <p style="font-size: 16px; color: #333;">
                Has recibido una nueva solicitud de contacto desde <strong>La Lengua</strong>.
            </p>
            
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">👤 Nombre:</span>
                    <span class="info-value">{first_name} {last_name}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">📧 Email:</span>
                    <span class="info-value">{email}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">📱 Teléfono:</span>
                    <span class="info-value">{phone}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">📚 Programa:</span>
                    <span class="info-value">{level}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">💡 Razón:</span>
                    <span class="info-value">{reason}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">📢 Medio:</span>
                    <span class="info-value">{source}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">💬 Contacto:</span>
                    <span class="info-value">{contact_method}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">🌍 País:</span>
                    <span class="info-value">{country}</span>
                </div>
                
                <div class="info-item">
                    <span class="info-label">🏙️ Ciudad:</span>
                    <span class="info-value">{city}</span>
                </div>
            </div>
            
            <p style="margin-top: 30px; color: #666;">
                <strong>Nota:</strong> Responde a este usuario lo antes posible para brindar un excelente servicio.
            </p>
        </div>
        
        <div class="footer">
            <p><strong>La Lengua</strong></p>
            <p>Tu plataforma de aprendizaje de inglés</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
                © 2025 La Lengua. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        # Crear y enviar email
        email_message = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email
        )
        email_message.attach_alternative(html_content, "text/html")
        email_message.send(fail_silently=False)
        
        print(f"✅ Email de contacto enviado desde: {email}")
        
        return Response({
            'success': True,
            'message': 'Email enviado correctamente. Nos pondremos en contacto contigo pronto.'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ Error al enviar email de contacto: {str(e)}")
        return Response({
            'success': False,
            'message': 'Error al enviar el email. Por favor, intenta nuevamente.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
