# Manual de Usuario – La Lengua

## 1. Información General

- **Requisitos del sistema**
  - Navegador recomendado: Google Chrome o Microsoft Edge (última versión).
  - Resolución mínima: 1366x768.
  - Cookies y `localStorage` habilitados.
  - Backend accesible en `http://localhost:8000/api` (por defecto en entorno local).

- **Acceso a la plataforma**
  - URL del frontend (entorno local por defecto): `http://localhost:5173`.
  - Autenticación: usuario y contraseña proporcionados por el Admin, o por registro si está habilitado.

- **Roles y vistas**
  - Estudiante: Dashboard con misiones, clases, material de clubs y evaluaciones asignadas.
  - Profesor: programación de clases y publicación de material de clubs (según permisos/backend).
  - Admin: gestión de usuarios, asignación de bloques y especializaciones.

## 2. Inicio de Sesión y Perfil

- **Iniciar sesión**
  - Accede a la URL del frontend.
  - Introduce email y contraseña.
  - El sistema guarda el token en `localStorage` como `authToken` y `token` (compatibilidad) usando `frontend/src/services/authService.ts`.

- **Recuperación de sesión**
  - Si la sesión expira, vuelve a iniciar sesión.
  - El backend verifica el token en `GET /auth/profile/`.

- **Cierre de sesión**
  - Desde la barra superior (navegación), usa la opción de cerrar sesión. Esto limpia `authToken`, `token` y `user` del `localStorage`.

- **Datos de perfil**
  - El Dashboard obtiene el perfil con `authService.getUserProfile()`.
  - Si el perfil ya trae un bloque asignado, el Dashboard sincroniza esa asignación en `localStorage` para garantizar que Misiones y Clases carguen correctamente.

### 2.1 Recuperar contraseña

- **¿Olvidaste tu contraseña?**
  1. En el modal de inicio de sesión, haz clic en "¿Olvidaste tu contraseña?".
  2. Ingresa tu email y pulsa "Enviar correo".
  3. Recibirás un email con un enlace directo de restablecimiento.
  4. Haz clic en el enlace; se abrirá la página "Nueva contraseña" (`/new-password?token=...`).
  5. Escribe y confirma tu nueva contraseña.

- **Notas**
  - Si el enlace expiró o es inválido, repite el proceso para generar uno nuevo.
  - Si no te llega el correo, revisa tu carpeta de spam.

## 3. Catálogo de Bloques y Sincronización

- **¿Qué son los bloques?**
  - Combinaciones de nivel (A1–C2) y turno (Mañana, Tarde, Noche). Cada bloque contiene:
    - Profesores (nombres)
    - Clases (temas base)
    - Misiones (temas/retos)
    - Horarios (rangos)

- **Poblado de bloques**
  - Seeding en `frontend/src/utils/createBloques.js` con 18 bloques (A1–C2 × 3 turnos).
  - En el arranque, `frontend/src/main.tsx` garantiza que si `bloques_data` está incompleto, se fusiona lo existente con los defaults, sin borrar datos actuales.

- **Sincronización con el usuario**
  - El Admin asigna el bloque al crear/editar un Estudiante en `frontend/src/Componentes/DashboardAdmin/FormularioUsuarios.tsx`.
  - El Dashboard del Estudiante rehidrata la asignación desde el backend si `localStorage` estaba vacío.

## 4. Manual para Administrador

- **Acceso a la vista de Admin**
  - Inicia sesión con rol Admin.
  - Vista principal: `frontend/src/Componentes/DashboardAdmin/FormularioUsuarios.tsx` (Gestión de Usuarios).

- **Crear usuario**
  1. Clic en "Agregar Usuario".
  2. Completa los campos obligatorios:
     - Nombres, Apellidos, Correo, Rol, Contraseña (mín. 8 caracteres).
  3. Para Estudiante, asigna opcionalmente:
     - Bloque Asignado (A1–C2 y turno).
     - Especialización (si está habilitada en el backend).
  4. Guardar:
     - Se envía al backend con `userService.register()`.
     - Se refresca la lista de usuarios desde backend.
     - Se sincroniza `localStorage.user_blocks_assignment` con `bloqueService.assignBloqueToUser(userId, bloqueId)` para que el Dashboard del estudiante muestre Misiones y Clases de inmediato.

- **Editar usuario**
  1. En la tabla de usuarios, clic en "Editar".
  2. Puedes cambiar bloque y especialización.
  3. Guardar:
     - Se refresca la lista desde backend.
     - Se actualiza la asignación de bloque en `localStorage`. Si el bloque queda vacío, se elimina su asignación local.

- **Activar/Desactivar usuario**
  - Botón de toggle (Activo/Inactivo) por usuario.
  - Llama `userService.toggleActive(userId)` y refresca la lista.

- **Notas y validaciones**
  - El correo se ajusta según rol al escribir:
    - Estudiante: `@thelanguage.co`
    - Profesor: `@soy.thelanguage.co`
    - Admin: `@thelanguage.co`
  - Al crear, la contraseña es obligatoria (mín. 8). Al editar, no es obligatoria.

## 5. Manual para Profesor

- **Programar clases**
  - Vista: `frontend/src/Componentes/DashboardProfesor/ProgramarClase.tsx` (si aplica).
  - Crear clase con:
    - Título/tema, fecha, hora, enlace Meet (opcional), lista de estudiantes (IDs).
  - Publicar para que aparezca en el Dashboard de los estudiantes asignados.

- **Publicar material de clubs**
  - Vista de clubs (según configuración). Permite crear recursos con título, semana, descripción y URL.
  - El Estudiante los verá en "Material del Club".

## 6. Manual para Estudiante

- **Dashboard general**
  - Ruta: `frontend/src/Componentes/DashboardUsu/Dashboard_Usuario.tsx`.
  - Secciones:
    - Misiones Actuales
    - Clases Programadas
    - Material del Club
    - Reto Diario (streaks, dulces, XP)

- **Misiones Actuales**
  - Fuente: `bloqueService.getUserBloqueInfo(userId)` → campo `misiones`.
  - Si no hay bloque asignado, se muestran misiones por defecto.

- **Clases Programadas**
  - Híbrido:
    - Clases base del bloque (temas/horarios/profesores).
    - Clases reales programadas por profesores desde el backend (filtradas por tu ID).
  - Acceder a clase:
    - Si la clase tiene `meet_link` o `meetLink`, se abre en una pestaña nueva.

- **Material del Club**
  - Selector para elegir tu club.
  - Listado de recursos con título, semana, descripción y fecha.

- **Reto Diario**
  - Completa el reto, gana dulces y XP.
  - Streaks: 7 días seguidos otorgan bonus y suben nivel de racha.
  - Persistencia por usuario en `localStorage`:
    - `challengeProgress_{userId}`, `streakLevel_{userId}`, `lastCompletedDate_{userId}`.

## 7. Comunicación y Contacto (EmailJS)

- **Configuración** (`frontend/src/services/emailService.ts`)
  - Destinatario: `the.languagess@gmail.com`
  - Service ID: `service_yypcyqc`
  - Template ID: `template_kqcqa2b`
  - Public Key: `5IX1jA4A1wE1BoI8J`

- **Uso**
  - `sendContactEmail(formData)` valida y envía el correo.
  - Manejo de errores con mensajes amigables.

- **Recomendaciones**
  - Para producción, usar variables de entorno/secretos (no hardcodear claves públicas en repos públicos).
  - Alinear los campos del template en EmailJS con los usados por el frontend.

## 8. Preguntas Frecuentes (FAQ)

- **No veo todos los bloques A1–C2 en el Admin**
  - Forzar recarga (Ctrl+Shift+R).
  - `main.tsx` completa faltantes; si persiste, borra `bloques_data` en `localStorage` para reseeding.

- **Asigné un bloque pero el estudiante no ve misiones**
  - El Admin sincroniza localmente y el Dashboard rehidrata desde backend. Pide recargar al estudiante.
  - Verifica en `localStorage` la clave `user_blocks_assignment` con el id del estudiante.

- **El enlace Meet no abre**
  - Asegura que la clase tenga `meet_link`. Si no, se muestra un aviso informativo.

- **No aparecen materiales de club**
  - Verifica que el estudiante pertenezca a al menos un club.
  - Revisa la conexión al backend (`clbService`).

- **Error de autenticación**
  - Inicia sesión nuevamente. Verifica que el backend esté en `http://localhost:8000/api` y CORS permitido.

## 9. Solución de Problemas

- **Limpieza de datos locales**
  - En `localStorage`:
    - Quitar `bloques_data` para rehacer el seeding.
    - Quitar `user_blocks_assignment` para limpiar asignaciones locales.

- **Verificación rápida**
  - DevTools → Application → Local Storage:
    - `bloques_data`: ~18 entradas.
    - `user_blocks_assignment`: `{ userId: bloqueId }` (ej.: `{"42": "A2_Tarde"}`).

- **Logs útiles**
  - En el Dashboard del Estudiante (consola):
    - `=== DEBUG BLOQUE INFO ===`
    - Asignaciones en `localStorage`.
    - Bloques disponibles.

## 10. Seguridad y Privacidad

- **Tokens**
  - `authToken` y `token` se guardan en `localStorage`. No compartir.

- **Datos sensibles**
  - En producción, usar secretos/variables de entorno para credenciales de terceros (EmailJS).

- **Roles y permisos**
  - Admin: creación/edición/estado de usuarios.
  - Profesor: programación de clases y material (según permisos).
  - Estudiante: consumo de contenidos y actividades.

## 11. Glosario

- **Bloque**: combinación de nivel y turno con su set de clases/misiones/horarios.
- **Misión**: actividad temática (quiz/ejercicio/juego).
- **Clase**: sesión programada (del bloque o creada por profesor).
- **Club**: agrupación con materiales compartidos.

## 12. Anexos Técnicos (Referencia)

- **Archivos clave frontend**
  - `frontend/src/Componentes/DashboardAdmin/FormularioUsuarios.tsx`
  - `frontend/src/Componentes/DashboardUsu/Dashboard_Usuario.tsx`
  - `frontend/src/services/bloqueService.ts`
  - `frontend/src/utils/createBloques.js`
  - `frontend/src/main.tsx`
  - `frontend/src/services/userService.ts`
  - `frontend/src/services/authService.ts`
  - `frontend/src/services/claseService.ts` (si aplica)
  - `frontend/src/services/clbService.ts` (si aplica)
  - `frontend/src/services/emailService.ts`

- **Endpoints referenciales**
  - `POST /auth/login/`
  - `GET /auth/profile/`
  - `POST /auth/register/`
  - `GET /users/`
  - `POST /users/{id}/toggle-active/`

## 13. Checklist de Publicación (para Admin/Equipo)

- Revisar que existan 18 bloques A1–C2 × 3 turnos.
- Crear un Estudiante con bloque asignado.
- Ingresar como Estudiante y validar que Misiones/Clases aparecen.
- Programar una Clase desde Profesor y verificar que aparece al Estudiante.
- Probar envío de correo con EmailJS (si aplica).
