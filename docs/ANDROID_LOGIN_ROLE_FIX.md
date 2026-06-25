# 🔧 Solución: Error "Unresolved reference 'token'" en LoginScreen

## 🔍 Problema

El error ocurre porque se intenta decodificar un `token` que no está definido en el contexto actual.

---

## ✅ Solución Correcta

### **Opción 1: Obtener el rol del backend (RECOMENDADO)**

El backend ya devuelve el rol del usuario en el endpoint `/api/profile/`. Es más simple y seguro obtenerlo de ahí.

#### **1. Actualizar LoginResponse.kt:**

```kotlin
@Serializable
data class LoginResponse(
    val token: String,
    val role: String? = null  // ✅ Agregar este campo
)
```

#### **2. Actualizar el backend para incluir el rol en el login:**

Modifica `/backend/api/views.py` en la función `mobile_login_view`:

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def mobile_login_view(request):
    """
    Login endpoint para aplicaciones móviles
    """
    username = request.data.get('username')
    password = request.data.get('password')
    
    if not username or not password:
        return Response({
            'error': 'Username and password are required'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if user is not None:
        refresh = RefreshToken.for_user(user)
        return Response({
            'token': str(refresh.access_token),
            'role': user.role  # ✅ Agregar el rol aquí
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'error': 'Invalid credentials'
        }, status=status.HTTP_401_UNAUTHORIZED)
```

#### **3. Actualizar LoginScreen.kt:**

```kotlin
// En el bloque when del login exitoso:
is Result.Success -> {
    val token = it.data.token
    val role = it.data.role ?: "student"  // ✅ Obtener rol del response
    
    // Guardar token
    sessionManager.saveToken(token)
    
    // Redirigir según rol
    when (role) {
        "profesor" -> {
            navController.navigate("teacher_dashboard") {
                popUpTo("login") { inclusive = true }
            }
        }
        "student" -> {
            navController.navigate("home") {
                popUpTo("login") { inclusive = true }
            }
        }
        else -> {
            navController.navigate("home") {
                popUpTo("login") { inclusive = true }
            }
        }
    }
}
```

---

## ✅ Opción 2: Decodificar el token JWT (Alternativa)

Si prefieres decodificar el token en Android:

### **1. Agregar dependencia en build.gradle:**

```gradle
implementation 'com.auth0.android:jjwt:0.9.1'
```

### **2. Función para decodificar el token:**

```kotlin
import android.util.Base64
import org.json.JSONObject

private fun getRoleFromToken(token: String): String? {
    return try {
        // El token JWT tiene 3 partes separadas por puntos: header.payload.signature
        val parts = token.split(".")
        if (parts.size == 3) {
            // Decodificar la parte del payload (segunda parte)
            val payload = String(
                Base64.decode(parts[1], Base64.URL_SAFE or Base64.NO_WRAP),
                Charsets.UTF_8
            )
            // Extraer el rol del JSON
            val json = JSONObject(payload)
            json.optString("role", "student")
        } else {
            null
        }
    } catch (e: Exception) {
        Log.e("LoginScreen", "Error decodificando token: ${e.message}")
        null
    }
}
```

### **3. Usar la función en LoginScreen:**

```kotlin
is Result.Success -> {
    val token = it.data.token
    
    // Guardar token
    sessionManager.saveToken(token)
    
    // Obtener rol del token
    val role = getRoleFromToken(token) ?: "student"
    
    // Redirigir según rol
    when (role) {
        "profesor" -> {
            navController.navigate("teacher_dashboard") {
                popUpTo("login") { inclusive = true }
            }
        }
        else -> {
            navController.navigate("home") {
                popUpTo("login") { inclusive = true }
            }
        }
    }
}
```

---

## 🎯 Recomendación

**Usa la Opción 1** (obtener rol del backend) porque:
- ✅ Más simple
- ✅ Más seguro
- ✅ No requiere dependencias adicionales
- ✅ El backend ya tiene la información

---

## 🧪 Probar la solución

### **1. Reiniciar el servidor Django:**

```bash
cd backend
python3 manage.py runserver
```

### **2. Probar el login:**

```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "adrian@thelanguage.co", "password": "12345678"}'
```

**Debería devolver:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "role": "student"
}
```

### **3. Probar con un profesor:**

```bash
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "profesor@thelanguage.com", "password": "Profesor123"}'
```

**Debería devolver:**
```json
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "role": "profesor"
}
```

---

## 📝 Resumen de cambios

| Archivo | Cambio |
|---------|--------|
| `backend/api/views.py` | Agregar `'role': user.role` en respuesta de login |
| `LoginResponse.kt` | Agregar campo `val role: String? = null` |
| `LoginScreen.kt` | Usar `it.data.role` en lugar de decodificar token |

---

## ⚠️ Importante

- El campo `role` en el modelo `CustomUser` debe tener valores: `"student"` o `"profesor"`
- Asegúrate de que todos los usuarios tengan un rol asignado
- Si un usuario no tiene rol, usa `"student"` por defecto

---

## 🔄 Flujo completo

1. Usuario ingresa credenciales
2. Android envía POST a `/api/login/`
3. Backend valida y devuelve `{token, role}`
4. Android guarda token en SessionManager
5. Android lee el `role` del response
6. Android redirige según el rol:
   - `"profesor"` → `teacher_dashboard`
   - `"student"` → `home`

**¡Listo! El sistema de roles funcionará correctamente.** 🎉
