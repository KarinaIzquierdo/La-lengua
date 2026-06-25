# 🔐 Credenciales de Usuarios de Prueba

## Sistema actualizado: Login con Correo Personal

El sistema ahora utiliza **correos personales** (Gmail, Outlook, etc.) para el login en lugar de correos institucionales.

---

## 👥 Usuarios Creados

### 1️⃣ ADMINISTRADOR
- **Correo Personal (Login):** `adminprueba@gmail.com`
- **Contraseña:** `Admin123`
- **Correo Institucional:** `adminprueba@thelanguage.co` (generado automáticamente)
- **Nombre:** Admin Prueba
- **Rol:** Admin
- **Permisos:** Acceso completo al sistema

---

### 2️⃣ PROFESOR
- **Correo Personal (Login):** `profesorprueba@gmail.com`
- **Contraseña:** `Profesor123`
- **Correo Institucional:** `profesorprueba@thelanguage.co` (generado automáticamente)
- **Nombre:** Carlos Martínez
- **Rol:** Profesor
- **Permisos:** Gestión de clases, evaluaciones y estudiantes

---

### 3️⃣ ESTUDIANTE
- **Correo Personal (Login):** `estudianteprueba@gmail.com`
- **Contraseña:** `Estudiante123`
- **Correo Institucional:** `estudianteprueba@thelanguage.co` (generado automáticamente)
- **Nombre:** María García
- **Rol:** Estudiante
- **Nivel de Inglés:** Intermediate

---

## 🚀 Cómo Probar

1. **Iniciar el backend:**
   ```bash
   cd backend
   python3 manage.py runserver
   ```

2. **Iniciar el frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Acceder a la aplicación:**
   - Abrir: `http://localhost:5173`
   - Hacer clic en "Login"
   - Ingresar uno de los correos personales y su contraseña

---

## ✨ Características del Nuevo Sistema

### Para el Admin:
- Al crear un usuario, solo necesita ingresar el **correo personal** del usuario
- El sistema genera automáticamente el correo institucional
- Ejemplo: `juan@gmail.com` → genera → `juan@thelanguage.co`

### Para los Usuarios:
- Inician sesión con su **correo personal** (Gmail, Outlook, etc.)
- Ya no necesitan recordar el correo institucional
- Pueden cambiar su contraseña desde su perfil

### Recuperación de Contraseña:
- Usa el correo personal del usuario
- Envía el enlace de recuperación al correo personal

---

## 📝 Notas Importantes

- ✅ El campo `correo_personal` es **obligatorio** al crear usuarios
- ✅ El campo `email` (institucional) es **opcional** y se genera automáticamente
- ✅ El login funciona **solo con correo personal**
- ✅ Compatible con cualquier proveedor de correo (Gmail, Outlook, Yahoo, etc.)

---

## 🔄 Flujo de Creación de Usuario

1. Admin accede a "Gestión de Usuarios"
2. Hace clic en "Agregar Usuario"
3. Completa el formulario:
   - Nombres
   - Apellidos
   - **Correo Personal** (obligatorio) ← Este es el que usará para login
   - Contraseña temporal
   - Rol
   - Bloque (opcional)
   - Especialización (opcional)
4. El sistema genera automáticamente el correo institucional
5. Usuario puede iniciar sesión con su correo personal

---

**Fecha de creación:** 29 de Octubre, 2025
**Estado:** ✅ Sistema completamente funcional
