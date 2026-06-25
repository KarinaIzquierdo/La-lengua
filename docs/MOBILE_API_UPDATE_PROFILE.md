# 📱 API de Actualización de Perfil para Android

## ✅ Endpoint Implementado

### **PUT/PATCH** `/api/profile/update/`

Endpoint específico para que la aplicación Android pueda actualizar el perfil del usuario.

---

## 🔐 Autenticación

**Requiere:** Token JWT en el header

```
Authorization: Bearer <token>
```

---

## 📤 Request Body (JSON)

Envía solo los campos que quieres actualizar. Todos los campos son opcionales.

```json
{
  "first_name": "Juan",
  "last_name": "Pérez",
  "phone": "3125278094",
  "country": "Colombia",
  "city": "Bogotá",
  "english_level": "intermediate",
  "birth_date": "1995-08-15",
  "cedula": "1234567890",
  "address": "Calle 123 #45-67",
  "emergency_contact": "María Pérez",
  "emergency_phone": "3001234567",
  "learning_goals": "Mejorar mi fluidez en conversaciones",
  "correo_personal": "juan.personal@gmail.com"
}
```

---

## 📥 Response (JSON)

### **Éxito (200 OK):**

```json
{
  "success": true,
  "message": "Perfil actualizado exitosamente",
  "user": {
    "id": 1,
    "username": "juan@thelanguage.co",
    "email": "juan@thelanguage.co",
    "first_name": "Juan",
    "last_name": "Pérez",
    "full_name": "Juan Pérez",
    "phone": "3125278094",
    "country": "Colombia",
    "city": "Bogotá",
    "role": "student",
    "english_level": "intermediate",
    "birth_date": "1995-08-15",
    "address": "Calle 123 #45-67",
    "learning_goals": "Mejorar mi fluidez en conversaciones",
    "profile_completed": true,
    "bloque_asignado": "",
    "created_at": "2024-01-01T00:00:00",
    "correo_personal": "juan.personal@gmail.com"
  }
}
```

### **Error (400 Bad Request):**

```json
{
  "success": false,
  "message": "Error al actualizar perfil: [descripción del error]"
}
```

### **Error de autenticación (401 Unauthorized):**

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 🔧 Implementación en Android (Kotlin)

### **1. Agregar función en ApiService.kt:**

```kotlin
interface ApiService {
    // ... otros endpoints
    
    @PUT("profile/update/")
    suspend fun updateUserProfile(
        @Header("Authorization") token: String,
        @Body profileData: Map<String, Any>
    ): UpdateProfileResponse
}
```

### **2. Crear modelo de respuesta:**

```kotlin
data class UpdateProfileResponse(
    val success: Boolean,
    val message: String,
    val user: User?
)
```

### **3. Implementar en AuthRepository:**

```kotlin
class AuthRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun updateUserProfile(profileData: Map<String, Any>): Result<User> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }
            
            val response = apiService.updateUserProfile(
                token = "Bearer $token",
                profileData = profileData
            )
            
            if (response.success && response.user != null) {
                Result.Success(response.user)
            } else {
                Result.Error(response.message)
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error al actualizar perfil")
        }
    }
}
```

### **4. Usar en ViewModel:**

```kotlin
class EditProfileViewModel(
    private val authRepository: AuthRepository
) : ViewModel() {
    
    fun saveProfile(
        firstName: String,
        lastName: String,
        phone: String,
        country: String,
        city: String,
        englishLevel: String
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            
            val profileData = mapOf(
                "first_name" to firstName,
                "last_name" to lastName,
                "phone" to phone,
                "country" to country,
                "city" to city,
                "english_level" to englishLevel
            )
            
            when (val result = authRepository.updateUserProfile(profileData)) {
                is Result.Success -> {
                    _successMessage.value = "Perfil actualizado exitosamente"
                    // Navegar de regreso o actualizar UI
                }
                is Result.Error -> {
                    _errorMessage.value = result.message
                }
            }
            
            _isLoading.value = false
        }
    }
}
```

---

## 🔄 Flujo completo

1. **Usuario edita campos** en la pantalla de perfil
2. **App envía PUT** a `/api/profile/update/` con los datos
3. **Backend guarda** en la base de datos
4. **Backend responde** con el perfil actualizado
5. **App actualiza** la UI con los nuevos datos
6. **Web también verá** los cambios (porque leen de la misma BD)

---

## ✨ Ventajas de este endpoint

- ✅ **Formato simple:** Usa `snake_case` (estándar para móviles)
- ✅ **Flexible:** Envía solo los campos que cambias
- ✅ **Seguro:** Requiere autenticación JWT
- ✅ **Completo:** Devuelve el perfil actualizado
- ✅ **Sincronizado:** Los cambios se ven en web y app

---

## 🧪 Probar con cURL

```bash
curl -X PUT http://localhost:8000/api/profile/update/ \
  -H "Authorization: Bearer <tu-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Juan",
    "last_name": "Pérez",
    "phone": "3125278094"
  }'
```

---

## 📝 Notas importantes

1. **Todos los campos son opcionales** - Envía solo lo que cambió
2. **Los strings vacíos se guardan como vacíos** - No como null
3. **`profile_completed` se marca automáticamente** como `true`
4. **Los cambios son inmediatos** - Se ven en web y app al instante
5. **Usa PUT o PATCH** - Ambos funcionan igual

---

## 🎯 Siguiente paso

Implementa la pantalla `EditProfileScreen` en Android con:
- TextFields para cada campo
- Botón "Guardar" que llame a `updateUserProfile()`
- Manejo de estados de carga y error
- Navegación de regreso después de guardar
