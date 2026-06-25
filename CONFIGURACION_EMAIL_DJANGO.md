# 📧 Configuración de Emails con Django

## ✅ Sistema Implementado Completamente

Hemos migrado el sistema de emails de EmailJS a Django Email para tener:
- ✅ Sin límites de plantillas
- ✅ Mayor control y seguridad
- ✅ Plantillas HTML profesionales
- ✅ No depende de servicios externos de terceros

---

## 📋 Archivos Creados

### Backend:
1. **`api/email_utils.py`** - Funciones para enviar emails
2. **`api/templates/emails/welcome_email.html`** - Plantilla HTML de bienvenida
3. **`api/templates/emails/welcome_email.txt`** - Plantilla texto de bienvenida
4. **`api/views.py`** - Actualizado para enviar emails automáticamente

---

## 🔧 Configuración Requerida

### Paso 1: Configurar Gmail para enviar emails

Para usar Gmail como servidor SMTP, necesitas crear una **Contraseña de Aplicación**:

#### 1.1. Habilitar Verificación en 2 Pasos
1. Ve a tu cuenta de Google: https://myaccount.google.com/
2. Seguridad → Verificación en 2 pasos
3. Actívala si no la tienes

#### 1.2. Crear Contraseña de Aplicación
1. Ve a: https://myaccount.google.com/apppasswords
2. Selecciona "Correo" y "Otro (nombre personalizado)"
3. Escribe: "The Language Django"
4. Haz clic en "Generar"
5. **Copia la contraseña de 16 caracteres** (sin espacios)

### Paso 2: Configurar Variables de Entorno

1. **Crea el archivo `.env`** en `/backend/`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. **Edita el archivo `.env`** y completa:
   ```env
   # Django
   SECRET_KEY=django-insecure-c$_jrh4xhq&ux#(40!%5nlhd7&68!&qgnl$ek_o+mb@0o(z#5&
   DEBUG=True

   # Email Configuration
   EMAIL_HOST_USER=the.languagess@gmail.com
   EMAIL_HOST_PASSWORD=tu_contraseña_de_aplicacion_aqui
   ```

   **Reemplaza:**
   - `EMAIL_HOST_USER`: El correo de Gmail desde el que se enviarán los emails
   - `EMAIL_HOST_PASSWORD`: La contraseña de aplicación de 16 caracteres que generaste

---

## 📧 Emails Implementados

### 1. Email de Bienvenida 🦩

**Se envía automáticamente cuando:**
- El admin crea un nuevo usuario desde "Gestión de Usuarios"

**Contenido:**
- Saludo personalizado con nombre del usuario
- Rol asignado (Estudiante, Profesor, Admin, etc.)
- Credenciales de acceso:
  - Correo personal (para login)
  - Contraseña temporal
- Botón para iniciar sesión
- Instrucciones de próximos pasos
- Diseño profesional con colores de The Language

**Destinatario:**
- Correo personal del usuario

---

### 2. Email de Recuperación de Contraseña 🔐

**Se envía cuando:**
- Usuario hace clic en "¿Olvidaste tu contraseña?"
- Ingresa su correo personal

**Contenido:**
- Saludo personalizado
- Enlace seguro para restablecer contraseña
- Advertencia de expiración (1 hora)
- Botón destacado para restablecer
- Diseño profesional

**Destinatario:**
- Correo personal del usuario

---

## 🎯 Flujo Completo

### Flujo de Registro:
```
1. Admin accede a "Gestión de Usuarios"
2. Crea nuevo usuario:
   - Nombres: Juan
   - Apellidos: Pérez
   - Correo Personal: juan@gmail.com
   - Contraseña: Temporal123
   - Rol: Estudiante
3. Sistema crea usuario en BD
4. 📧 Django envía email automáticamente a juan@gmail.com
5. Juan recibe email con credenciales
6. Juan hace clic en "Iniciar Sesión"
7. Juan ingresa con juan@gmail.com / Temporal123
8. Juan cambia su contraseña desde su perfil
```

### Flujo de Recuperación:
```
1. Usuario hace clic en "¿Olvidaste tu contraseña?"
2. Ingresa su correo personal: juan@gmail.com
3. Backend busca usuario por correo_personal
4. Genera token seguro
5. 📧 Django envía email con enlace de recuperación
6. Usuario recibe email
7. Hace clic en "Restablecer Contraseña"
8. Crea nueva contraseña
9. ✅ Contraseña actualizada
```

---

## 🧪 Cómo Probar

### Probar Email de Bienvenida:

1. **Configurar el email en `.env`**
2. **Reiniciar el servidor Django:**
   ```bash
   cd backend
   python3 manage.py runserver
   ```

3. **Crear un usuario de prueba:**
   - Login como Admin: `adminprueba@gmail.com` / `Admin123`
   - Ir a "Gestión de Usuarios"
   - Crear usuario con **TU correo personal real**
   - Ejemplo:
     - Nombres: Test
     - Apellidos: Usuario
     - Correo Personal: **tu_correo@gmail.com** ← Usa tu correo real
     - Contraseña: Test123
     - Rol: Estudiante

4. **Verificar:**
   - ✅ Revisa tu bandeja de entrada
   - ✅ Deberías recibir el email de bienvenida
   - ✅ Verifica que el diseño se vea bien
   - ✅ Prueba el botón "Iniciar Sesión"

### Probar Recuperación de Contraseña:

1. **En el login, clic en "¿Olvidaste tu contraseña?"**
2. **Ingresar el correo personal** del usuario creado
3. **Verificar:**
   - ✅ Revisa tu bandeja de entrada
   - ✅ Deberías recibir el email de recuperación
   - ✅ Haz clic en "Restablecer Contraseña"
   - ✅ Cambia la contraseña
   - ✅ Inicia sesión con la nueva contraseña

---

## 🔍 Solución de Problemas

### Problema: No llegan los emails

**Verificar:**
1. ✅ Archivo `.env` existe y tiene las credenciales correctas
2. ✅ EMAIL_HOST_USER es un correo de Gmail válido
3. ✅ EMAIL_HOST_PASSWORD es la contraseña de aplicación (16 caracteres)
4. ✅ Verificación en 2 pasos está activada en Gmail
5. ✅ El correo personal del usuario está configurado

**Ver logs en la consola del backend:**
```bash
# Deberías ver mensajes como:
✅ Email de bienvenida enviado exitosamente a: usuario@gmail.com
📧 Email de bienvenida enviado a: usuario@gmail.com
```

### Problema: Error de autenticación SMTP

**Solución:**
1. Regenera la contraseña de aplicación en Gmail
2. Copia la nueva contraseña (sin espacios)
3. Actualiza `.env`
4. Reinicia el servidor Django

### Problema: Email va a spam

**Solución:**
1. Marca el email como "No es spam"
2. Agrega `noreply@thelanguage.co` a tus contactos
3. En producción, configura SPF, DKIM y DMARC

---

## 📝 Notas Importantes

### Desarrollo vs Producción:

**Desarrollo (localhost):**
- URL de login: `http://localhost:5173`
- URL de reset: `http://localhost:5173/new-password?token=...`

**Producción:**
- Cambiar URLs en:
  - `api/views.py` línea 1265: `login_url='https://thelanguage.co'`
  - `api/views.py` línea 813: `reset_link = f"https://thelanguage.co/new-password?token={combined}"`

### Seguridad:

- ✅ Las contraseñas se envían **solo una vez** en el email de bienvenida
- ✅ Los tokens de recuperación expiran en 1 hora
- ✅ Las contraseñas están hasheadas en la base de datos
- ✅ El archivo `.env` está en `.gitignore` (no se sube a Git)

### Límites de Gmail:

- **Límite diario:** 500 emails/día (cuenta gratuita)
- **Límite por hora:** ~100 emails/hora
- Para más volumen, considera:
  - Gmail Workspace (Google Workspace)
  - SendGrid
  - Amazon SES
  - Mailgun

---

## 🎨 Personalización

### Cambiar el diseño del email:

Edita los archivos:
- `backend/api/templates/emails/welcome_email.html`
- `backend/api/templates/emails/welcome_email.txt`

### Cambiar el remitente:

Edita `backend/backend/settings.py`:
```python
DEFAULT_FROM_EMAIL = 'The Language <noreply@thelanguage.co>'
```

---

## ✅ Checklist Final

- [ ] Verificación en 2 pasos activada en Gmail
- [ ] Contraseña de aplicación generada
- [ ] Archivo `.env` creado con credenciales
- [ ] Servidor Django reiniciado
- [ ] Email de bienvenida probado
- [ ] Email de recuperación probado
- [ ] Emails llegan correctamente
- [ ] Diseño se ve bien en Gmail/Outlook

---

**Fecha:** 29 de Octubre, 2025  
**Estado:** ✅ Sistema completamente implementado con Django Email  
**Próximo paso:** Configurar credenciales de Gmail en `.env`
