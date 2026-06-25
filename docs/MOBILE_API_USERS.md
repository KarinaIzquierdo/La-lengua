# 📱 API de Gestión de Usuarios - Aplicación Móvil Android

## 📋 Índice

1. [Resumen de Endpoints](#resumen-de-endpoints)
2. [Endpoint: Listar Usuarios](#endpoint-listar-usuarios)
3. [Endpoint: Crear Usuario](#endpoint-crear-usuario)
4. [Endpoint: Activar/Desactivar Usuario](#endpoint-activardesactivar-usuario)
5. [Modelos de Datos para Android](#modelos-de-datos-para-android)
6. [Implementación en Android](#implementación-en-android)
7. [Resumen de Integración](#resumen-de-integración)

---

## 📌 Resumen de Endpoints

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/api/users/` | GET | ✅ Admin | Listar todos los usuarios |
| `/api/auth/register/` | POST | ✅ Admin | Crear nuevo usuario |
| `/api/users/{id}/toggle-active/` | POST | ✅ Admin | Activar/Desactivar usuario |

---

## 🔍 Endpoint: Listar Usuarios

### **GET /api/users/**

Obtiene la lista completa de usuarios del sistema.

#### **Autenticación**
- ✅ Requerida
- 🔐 Solo administradores
- 📝 Header: `Authorization: Bearer {token}`

#### **Request**

```http
GET /api/users/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### **Response (200 OK)**

```json
[
  {
    "id": 1,
    "username": "juan.rodriguez",
    "email": "juan@thelanguage.co",
    "first_name": "Juan",
    "last_name": "Rodríguez",
    "role": "student",
    "bloque_asignado": "A1 Mañana",
    "especializacion": "Inglés Conversacional",
    "is_active": true,
    "date_joined": "2025-01-15T10:30:00Z"
  }
]
```

---

## ➕ Endpoint: Crear Usuario

### **POST /api/auth/register/**

Crea un nuevo usuario en el sistema.

#### **Request Body**

```json
{
  "username": "nuevo.usuario",
  "email": "nuevo@thelanguage.co",
  "password": "ContraseñaSegura123",
  "first_name": "Nuevo",
  "last_name": "Usuario",
  "role": "student",
  "bloque_asignado": "A1 Mañana",
  "especializacion": "Inglés Conversacional"
}
```

#### **Response (201 Created)**

```json
{
  "success": true,
  "user": {
    "id": 25,
    "username": "nuevo.usuario",
    "email": "nuevo@thelanguage.co",
    "first_name": "Nuevo",
    "last_name": "Usuario",
    "role": "student",
    "is_active": true
  },
  "message": "Usuario registrado exitosamente"
}
```

---

## 📦 Modelos de Datos para Android

### **User.kt**

```kotlin
@Serializable
data class User(
    val id: Int,
    val username: String,
    val email: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    val role: String,
    @SerialName("bloque_asignado")
    val bloqueAsignado: String? = null,
    val especializacion: String? = null,
    @SerialName("is_active")
    val isActive: Boolean = true
)
```

### **CreateUserRequest.kt**

```kotlin
@Serializable
data class CreateUserRequest(
    val username: String,
    val email: String,
    val password: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    val role: String,
    @SerialName("bloque_asignado")
    val bloqueAsignado: String? = null,
    val especializacion: String? = null
)
```

---

## 🔧 Implementación en Android

### **1. ApiService.kt**

```kotlin
interface ApiService {
    @GET("users/")
    suspend fun getUsers(
        @Header("Authorization") token: String
    ): Response<List<User>>
    
    @POST("auth/register/")
    suspend fun createUser(
        @Header("Authorization") token: String,
        @Body request: CreateUserRequest
    ): Response<CreateUserResponse>
}
```

### **2. UserRepository.kt**

```kotlin
class UserRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun getUsers(): Result<List<User>> = withContext(Dispatchers.IO) {
        try {
            val token = sessionManager.getToken() ?: return@withContext Result.Error("No hay sesión")
            val response = apiService.getUsers("Bearer $token")
            
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("Error al obtener usuarios")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
    
    suspend fun createUser(request: CreateUserRequest): Result<User> = withContext(Dispatchers.IO) {
        try {
            val token = sessionManager.getToken() ?: return@withContext Result.Error("No hay sesión")
            val response = apiService.createUser("Bearer $token", request)
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success && body.user != null) {
                    Result.Success(body.user)
                } else {
                    Result.Error("Error al crear usuario")
                }
            } else {
                Result.Error("Error: ${response.code()}")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión")
        }
    }
}
```

### **3. UserViewModel.kt**

```kotlin
class UserViewModel(private val userRepository: UserRepository) : ViewModel() {
    
    private val _usersState = MutableStateFlow<Result<List<User>>>(Result.Loading())
    val usersState: StateFlow<Result<List<User>>> = _usersState.asStateFlow()
    
    private val _createUserState = MutableStateFlow<Result<User>?>(null)
    val createUserState: StateFlow<Result<User>?> = _createUserState.asStateFlow()
    
    fun loadUsers() {
        viewModelScope.launch {
            _usersState.value = Result.Loading()
            _usersState.value = userRepository.getUsers()
        }
    }
    
    fun createUser(
        username: String,
        email: String,
        password: String,
        firstName: String,
        lastName: String,
        role: String,
        bloqueAsignado: String? = null,
        especializacion: String? = null
    ) {
        viewModelScope.launch {
            _createUserState.value = Result.Loading()
            
            val request = CreateUserRequest(
                username = username,
                email = email,
                password = password,
                firstName = firstName,
                lastName = lastName,
                role = role,
                bloqueAsignado = bloqueAsignado,
                especializacion = especializacion
            )
            
            _createUserState.value = userRepository.createUser(request)
            
            if (_createUserState.value is Result.Success) {
                loadUsers()
            }
        }
    }
}
```

---

## 📝 Resumen de Integración

### **Checklist Backend** ✅

- ✅ Endpoint `/api/users/` (GET) - Ya existe
- ✅ Endpoint `/api/auth/register/` (POST) - Ya existe
- ✅ Autenticación JWT configurada
- ✅ Permisos de administrador implementados

### **Checklist Android**

- [ ] Crear modelos: `User`, `CreateUserRequest`, `CreateUserResponse`
- [ ] Agregar métodos en `ApiService`
- [ ] Crear `UserRepository`
- [ ] Crear `UserViewModel`
- [ ] Implementar `AdminUsersScreen` (lista)
- [ ] Implementar `CreateUserScreen` (formulario)
- [ ] Probar flujo completo

### **Flujo Completo**

1. Admin abre la app → Login
2. Navega a "Gestionar Usuarios" → Carga lista
3. Click "Agregar Usuario" → Abre formulario
4. Llena y envía → POST a backend
5. Backend crea usuario → Devuelve datos
6. App recarga lista → Muestra nuevo usuario

---

## 🧪 Pruebas con cURL

```bash
# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Listar usuarios
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer TOKEN_AQUI"

# Crear usuario
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Authorization: Bearer TOKEN_AQUI" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test",
    "email": "test@test.com",
    "password": "Test123",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }'
```

---

**¡El backend ya está listo! Ahora solo necesitas implementar el código Android siguiendo esta guía.** 🎉
