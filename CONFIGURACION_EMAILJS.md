# 📧 Configuración de Plantillas EmailJS

## Resumen de Cambios

Hemos implementado dos sistemas de email automáticos:

1. **Email de Bienvenida**: Se envía automáticamente cuando se crea un nuevo usuario
2. **Recuperación de Contraseña Mejorada**: Ahora busca y envía al correo personal primero

---

## 🎯 Plantillas Necesarias en EmailJS

### 1. Plantilla de Bienvenida (NUEVA)

**Template ID:** `template_welcome` (debes crear esta plantilla)

#### Variables de la Plantilla:
```
{{to_email}}          - Correo del destinatario
{{to_name}}           - Nombre completo del usuario
{{user_email}}        - Email para login (correo personal)
{{user_password}}     - Contraseña temporal
{{user_role}}         - Rol del usuario (Estudiante, Profesor, Admin)
{{login_url}}         - URL para iniciar sesión
{{app_name}}          - Nombre de la aplicación (The Language)
```

#### Contenido Sugerido para la Plantilla:

**Subject:** Bienvenido a {{app_name}} - Tus credenciales de acceso

**Body (HTML):**
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f9f9f9;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
        }
        .content {
            background: white;
            padding: 30px;
            border-radius: 0 0 10px 10px;
        }
        .credentials {
            background: #f0f4ff;
            padding: 20px;
            border-left: 4px solid #667eea;
            margin: 20px 0;
        }
        .button {
            display: inline-block;
            padding: 12px 30px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-decoration: none;
            border-radius: 5px;
            margin: 20px 0;
        }
        .footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 12px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🦩 ¡Bienvenido a {{app_name}}!</h1>
        </div>
        <div class="content">
            <p>Hola <strong>{{to_name}}</strong>,</p>
            
            <p>¡Nos alegra tenerte con nosotros! Tu cuenta ha sido creada exitosamente con el rol de <strong>{{user_role}}</strong>.</p>
            
            <div class="credentials">
                <h3>📋 Tus Credenciales de Acceso:</h3>
                <p><strong>Correo Personal (Login):</strong> {{user_email}}</p>
                <p><strong>Contraseña Temporal:</strong> {{user_password}}</p>
            </div>
            
            <p>⚠️ <strong>Importante:</strong> Por tu seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez.</p>
            
            <center>
                <a href="{{login_url}}" class="button">Iniciar Sesión Ahora</a>
            </center>
            
            <h3>🚀 Próximos Pasos:</h3>
            <ol>
                <li>Haz clic en el botón de arriba para acceder a la plataforma</li>
                <li>Inicia sesión con tu correo personal y contraseña temporal</li>
                <li>Completa tu perfil con tu información personal</li>
                <li>Cambia tu contraseña desde tu perfil</li>
            </ol>
            
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos.</p>
            
            <p>¡Que tengas un excelente día! 🌟</p>
            
            <p>Saludos,<br>
            <strong>El equipo de {{app_name}}</strong></p>
        </div>
        <div class="footer">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>© 2025 {{app_name}}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
```

---

### 2. Plantilla de Recuperación de Contraseña (YA EXISTE)

**Template ID:** `template_c5au9og` (ya configurada)

#### Variables:
```
{{to_email}}          - Correo del destinatario
{{reset_link}}        - Enlace para restablecer contraseña
```

**✅ Esta plantilla ya está configurada y funcionando correctamente.**

---

## 🔧 Pasos para Configurar en EmailJS

### Paso 1: Acceder a EmailJS
1. Ve a [https://dashboard.emailjs.com/](https://dashboard.emailjs.com/)
2. Inicia sesión con tu cuenta

### Paso 2: Crear la Plantilla de Bienvenida
1. En el menú lateral, haz clic en **"Email Templates"**
2. Haz clic en **"Create New Template"**
3. Asigna el **Template ID:** `template_welcome`
4. Copia y pega el contenido HTML proporcionado arriba
5. Configura las variables en el panel derecho:
   - `to_email`
   - `to_name`
   - `user_email`
   - `user_password`
   - `user_role`
   - `login_url`
   - `app_name`
6. Haz clic en **"Save"**

### Paso 3: Probar la Plantilla
1. Usa el botón **"Test It"** en EmailJS
2. Completa los valores de prueba:
   ```
   to_email: tu_correo@gmail.com
   to_name: Juan Pérez
   user_email: juan@gmail.com
   user_password: Temporal123
   user_role: Estudiante
   login_url: http://localhost:5173
   app_name: The Language
   ```
3. Envía el email de prueba

---

## 📊 Flujos Implementados

### Flujo 1: Registro de Usuario
```
1. Admin crea usuario en "Gestión de Usuarios"
   ├─ Ingresa: Nombre, Apellidos, Correo Personal, Contraseña
   └─ Selecciona: Rol, Bloque, Especialización

2. Sistema crea el usuario en la base de datos
   └─ Genera automáticamente el correo institucional

3. Sistema envía email de bienvenida
   ├─ Destinatario: Correo Personal del usuario
   ├─ Contenido: Credenciales de acceso
   └─ Plantilla: template_welcome

4. Usuario recibe email con:
   ├─ Correo personal para login
   ├─ Contraseña temporal
   └─ Botón para iniciar sesión
```

### Flujo 2: Recuperación de Contraseña
```
1. Usuario hace clic en "¿Olvidaste tu contraseña?"

2. Ingresa su correo personal

3. Backend busca usuario:
   ├─ PRIMERO: Por correo_personal
   ├─ SEGUNDO: Por email institucional (fallback)
   └─ TERCERO: Por mapeo de dominio

4. Sistema envía email de recuperación
   ├─ Destinatario: Correo Personal del usuario
   ├─ Contenido: Enlace para restablecer contraseña
   └─ Plantilla: template_c5au9og

5. Usuario recibe email con:
   ├─ Enlace seguro con token
   └─ Instrucciones para cambiar contraseña
```

---

## 🔐 Configuración de Seguridad

### Variables de Entorno (si es necesario)
```env
EMAILJS_SERVICE_ID=service_yypcyqc
EMAILJS_PUBLIC_KEY=5IX1jA4A1wE1BoI8J
EMAILJS_TEMPLATE_CONTACT=template_kqcqa2b
EMAILJS_TEMPLATE_PASSWORD_RESET=template_c5au9og
EMAILJS_TEMPLATE_WELCOME=template_welcome
```

---

## ✅ Checklist de Implementación

- [x] Función `sendWelcomeEmail` creada en `emailService.ts`
- [x] Función `sendPasswordResetEmail` ya existente
- [x] `request_password_reset_view` actualizado para buscar por correo_personal primero
- [x] `FormularioUsuarios` actualizado para enviar email de bienvenida
- [x] Email de bienvenida se envía al correo personal
- [x] Email de recuperación se envía al correo personal
- [ ] **PENDIENTE:** Crear plantilla `template_welcome` en EmailJS
- [ ] **PENDIENTE:** Probar email de bienvenida
- [ ] **PENDIENTE:** Probar recuperación de contraseña con correo personal

---

## 🧪 Cómo Probar

### Probar Email de Bienvenida:
1. Iniciar backend y frontend
2. Login como Admin: `adminprueba@gmail.com` / `Admin123`
3. Ir a "Gestión de Usuarios"
4. Crear un nuevo usuario con TU correo personal real
5. Verificar que llegue el email de bienvenida

### Probar Recuperación de Contraseña:
1. En el login, hacer clic en "¿Olvidaste tu contraseña?"
2. Ingresar el correo personal de un usuario existente
3. Verificar que llegue el email con el enlace de recuperación
4. Hacer clic en el enlace y cambiar la contraseña

---

## 📝 Notas Importantes

1. **Correo Personal es Obligatorio**: Todos los usuarios DEBEN tener un correo personal configurado
2. **Emails Automáticos**: Los emails se envían automáticamente, no requieren intervención manual
3. **Fallback**: Si falla el envío de email, el usuario se crea de todas formas (no bloquea el flujo)
4. **Seguridad**: Las contraseñas se envían solo en el email de bienvenida inicial
5. **Plantilla Pendiente**: Debes crear la plantilla `template_welcome` en EmailJS para que funcione

---

**Fecha:** 29 de Octubre, 2025  
**Estado:** ✅ Código implementado - ⏳ Plantilla EmailJS pendiente
