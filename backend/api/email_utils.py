"""
Utilidades para envío de emails con Django
"""
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.conf import settings
from django.utils.html import strip_tags


def send_welcome_email(user_email, user_name, user_role, temporary_password, login_url='http://localhost:5173'):
    """
    Envía un email de bienvenida al usuario recién registrado
    
    Args:
        user_email (str): Correo personal del usuario
        user_name (str): Nombre completo del usuario
        user_role (str): Rol del usuario (Estudiante, Profesor, Admin, etc.)
        temporary_password (str): Contraseña temporal asignada
        login_url (str): URL para iniciar sesión
    
    Returns:
        bool: True si el email se envió correctamente, False en caso contrario
    """
    try:
        # Contexto para las plantillas
        context = {
            'user_name': user_name,
            'user_email': user_email,
            'user_role': user_role,
            'user_password': temporary_password,
            'login_url': login_url,
        }
        
        # Renderizar plantillas HTML y texto
        html_content = render_to_string('emails/welcome_email.html', context)
        text_content = render_to_string('emails/welcome_email.txt', context)
        
        # Crear el email
        subject = '¡Bienvenido a La Lengua! - Tus credenciales de acceso'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user_email]
        
        # Crear mensaje con ambas versiones (HTML y texto plano)
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email
        )
        email.attach_alternative(html_content, "text/html")
        
        # Enviar email
        email.send(fail_silently=False)
        
        print(f"✅ Email de bienvenida enviado exitosamente a: {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error al enviar email de bienvenida a {user_email}: {str(e)}")
        return False


def send_password_reset_email(user_email, user_name, reset_link):
    """
    Envía un email con el enlace para restablecer la contraseña
    
    Args:
        user_email (str): Correo personal del usuario
        user_name (str): Nombre del usuario
        reset_link (str): Enlace completo para restablecer contraseña
    
    Returns:
        bool: True si el email se envió correctamente, False en caso contrario
    """
    try:
        subject = '🔐 Recuperación de Contraseña - La Lengua'
        from_email = settings.DEFAULT_FROM_EMAIL
        to_email = [user_email]
        
        # Contenido del email en texto plano
        text_content = f"""
Hola {user_name},

Has solicitado recuperar tu contraseña para La Lengua.

Haz clic en el siguiente enlace para crear una nueva contraseña:
{reset_link}

Este enlace expirará en 1 hora por seguridad.

Si no solicitaste este cambio, puedes ignorar este correo.

Saludos,
El equipo de La Lengua
        """
        
        # Contenido HTML
        html_content = f"""
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperar Contraseña - La Lengua</title>
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
        .logo {{
            width: 100px;
            height: auto;
            margin-bottom: 15px;
        }}
        .header h1 {{
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }}
        .lock-icon {{
            font-size: 48px;
            margin-bottom: 10px;
        }}
        .content {{
            padding: 40px 30px;
        }}
        .greeting {{
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }}
        .message-box {{
            background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%);
            padding: 25px;
            border-left: 4px solid #667eea;
            border-radius: 5px;
            margin: 25px 0;
        }}
        .message-box p {{
            margin: 0;
            color: #4a5568;
            line-height: 1.8;
        }}
        .button {{
            display: inline-block;
            padding: 15px 40px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 50px;
            margin: 25px 0;
            font-weight: 600;
            font-size: 16px;
            transition: transform 0.2s;
        }}
        .button:hover {{
            transform: translateY(-2px);
        }}
        .warning-box {{
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 5px;
        }}
        .warning-box strong {{
            color: #856404;
        }}
        .security-tips {{
            background: #f8f9fa;
            padding: 20px;
            border-radius: 5px;
            margin: 20px 0;
        }}
        .security-tips h3 {{
            color: #667eea;
            margin-top: 0;
        }}
        .security-tips ul {{
            margin: 10px 0;
            padding-left: 20px;
        }}
        .security-tips li {{
            margin: 10px 0;
            color: #555;
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
        .social-links {{
            margin: 15px 0;
        }}
        .social-links a {{
            color: #667eea;
            text-decoration: none;
            margin: 0 10px;
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="lock-icon">🔐</div>
            <h1>Recuperar Contraseña</h1>
        </div>
        
        <div class="content">
            <p class="greeting">Hola <strong>{user_name}</strong>,</p>
            
            <div class="message-box">
                <p>
                    Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en <strong>La Lengua</strong>.
                    Si fuiste tú quien solicitó este cambio, haz clic en el botón de abajo para crear una nueva contraseña.
                </p>
            </div>
            
            <center>
                <a href="{reset_link}" class="button">Restablecer mi Contraseña</a>
            </center>
            
            <div class="warning-box">
                <strong>⚠️ Importante:</strong> Este enlace expirará en 1 hora por razones de seguridad.
                Si el enlace expira, deberás solicitar uno nuevo.
            </div>
            
            <div class="security-tips">
                <h3>🛡️ Consejos de Seguridad</h3>
                <ul>
                    <li>Nunca compartas tu contraseña con nadie</li>
                    <li>Usa una contraseña fuerte con letras, números y símbolos</li>
                    <li>No uses la misma contraseña en diferentes sitios</li>
                    <li>Si no solicitaste este cambio, ignora este correo</li>
                </ul>
            </div>
            
            <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este correo de forma segura. Tu contraseña actual seguirá siendo válida.</p>
            
            <p style="margin-top: 30px;">
                Saludos cordiales,<br>
                <strong>El equipo de La Lengua</strong>
            </p>
        </div>
        
        <div class="footer">
            <p><strong>La Lengua</strong></p>
            <p>Tu camino hacia el dominio del inglés</p>
            <div class="social-links">
                <a href="#">Instagram</a> | 
                <a href="#">Facebook</a> | 
                <a href="#">WhatsApp</a>
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">
                Este es un correo automático, por favor no respondas a este mensaje.
            </p>
            <p style="font-size: 12px; color: #999;">
                © 2025 La Lengua. Todos los derechos reservados.
            </p>
        </div>
    </div>
</body>
</html>
        """
        
        # Crear mensaje con ambas versiones
        email = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=to_email
        )
        email.attach_alternative(html_content, "text/html")
        
        # Enviar email
        email.send(fail_silently=False)
        
        print(f"✅ Email de recuperación enviado exitosamente a: {user_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error al enviar email de recuperación a {user_email}: {str(e)}")
        return False
