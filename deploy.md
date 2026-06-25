# 🚀 Guía de Despliegue - The Language

## 📋 Requisitos Previos
- ✅ Dominio comprado
- ✅ Hosting con soporte PHP/Python
- ✅ Acceso FTP (FileZilla)
- ✅ Base de datos MySQL/PostgreSQL

## 🔧 Paso 1: Configurar Variables de Entorno

### Frontend (.env.production)
```env
VITE_API_BASE_URL=https://tu-dominio.com/api
VITE_APP_ENV=production
```

### Backend (settings.py)
```python
ALLOWED_HOSTS = ['tu-dominio.com', 'www.tu-dominio.com']
DEBUG = False
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio.com",
    "https://www.tu-dominio.com",
]
```

## 🏗️ Paso 2: Construir el Frontend

```bash
cd frontend
npm install
npm run build
```

Esto creará la carpeta `dist/` con todos los archivos estáticos.

## 📁 Paso 3: Estructura de Archivos para Subir

```
public_html/
├── index.html              # Desde dist/
├── assets/                 # Desde dist/assets/
├── favicon.ico            # Desde dist/
└── api/                   # Backend Django
    ├── manage.py
    ├── requirements.txt
    ├── backend/
    └── api/
```

## 🔄 Paso 4: Configurar el Backend

### 4.1 Crear requirements.txt completo
```txt
django==4.2.23
djangorestframework==3.14.0
djangorestframework-simplejwt==5.3.1
django-cors-headers==4.4.0
gunicorn==21.2.0
whitenoise==6.6.0
python-decouple==3.8
```

### 4.2 Configurar settings.py para producción
```python
import os
from decouple import config

DEBUG = config('DEBUG', default=False, cast=bool)
ALLOWED_HOSTS = ['tu-dominio.com', 'www.tu-dominio.com']

# Base de datos
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',  # o postgresql
        'NAME': config('DB_NAME'),
        'USER': config('DB_USER'),
        'PASSWORD': config('DB_PASSWORD'),
        'HOST': config('DB_HOST', default='localhost'),
        'PORT': config('DB_PORT', default='3306'),
    }
}

# Archivos estáticos
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# CORS
CORS_ALLOWED_ORIGINS = [
    "https://tu-dominio.com",
    "https://www.tu-dominio.com",
]
```

### 4.3 Crear .env para el backend
```env
DEBUG=False
SECRET_KEY=tu-clave-secreta-super-segura
DB_NAME=nombre_base_datos
DB_USER=usuario_db
DB_PASSWORD=password_db
DB_HOST=localhost
DB_PORT=3306
```

## 📤 Paso 5: Subir Archivos por FTP

### 5.1 Configurar FileZilla
- **Host:** ftp.tu-dominio.com
- **Usuario:** tu-usuario-ftp
- **Contraseña:** tu-password-ftp
- **Puerto:** 21

### 5.2 Subir Frontend
1. Conectar a FTP
2. Ir a `/public_html/`
3. Subir todo el contenido de `dist/`

### 5.3 Subir Backend
1. Crear carpeta `/public_html/api/`
2. Subir todo el backend Django
3. Instalar dependencias en el servidor

## 🗄️ Paso 6: Configurar Base de Datos

### 6.1 Crear base de datos en el hosting
- Acceder al panel de control
- Crear nueva base de datos MySQL/PostgreSQL
- Anotar credenciales

### 6.2 Migrar datos
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic
python manage.py createsuperuser
```

## 🔧 Paso 7: Configurar Servidor Web

### 7.1 Archivo .htaccess (para Apache)
```apache
RewriteEngine On
RewriteBase /

# Manejar rutas de React
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/api/
RewriteRule . /index.html [L]

# Proxy para API Django
RewriteCond %{REQUEST_URI} ^/api/(.*)$
RewriteRule ^api/(.*)$ http://localhost:8000/api/$1 [P,L]
```

## ✅ Paso 8: Verificar Despliegue

1. **Frontend:** https://tu-dominio.com
2. **API:** https://tu-dominio.com/api/
3. **Admin:** https://tu-dominio.com/api/admin/

## 🚨 Problemas Comunes

### CORS Errors
- Verificar `CORS_ALLOWED_ORIGINS` en Django
- Asegurar HTTPS en producción

### 404 en rutas de React
- Configurar `.htaccess` correctamente
- Verificar `BrowserRouter` vs `HashRouter`

### API no responde
- Verificar configuración del servidor
- Revisar logs del servidor
- Confirmar base de datos conectada

## 📞 Soporte
Si necesitas ayuda específica con tu hosting, comparte:
- Nombre del proveedor de hosting
- Panel de control que usas (cPanel, Plesk, etc.)
- Tipo de servidor (Apache, Nginx)
- Soporte de Python/Django
