# 📋 Resumen: Implementación de Gestión de Usuarios en Android

## ✅ Estado del Backend

El backend **YA ESTÁ LISTO** y funcionando. No necesitas hacer cambios en Django.

### Endpoints Disponibles:

| Endpoint | Método | Estado | Descripción |
|----------|--------|--------|-------------|
| `/api/users/` | GET | ✅ Listo | Listar todos los usuarios |
| `/api/auth/register/` | POST | ✅ Listo | Crear nuevo usuario |
| `/api/users/{id}/toggle-active/` | POST | ✅ Listo | Activar/desactivar usuario |

---

## 🎯 Lo que necesitas hacer en Android

### Paso 1: Crear los Modelos de Datos

Crea estos archivos en `data/model/`:

#### **User.kt**
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

#### **CreateUserRequest.kt**
```kotlin
@Serializable
data class CreateUserRequest(
    val username: String? = null,  // Opcional, se usa email si no se proporciona
    val email: String,
    val password: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    val role: String,
    @SerialName("bloque_asignado")
    val bloqueAsignado: String? = null,
    val especializacion: String? = null,  // Puede ser nombre o ID
    @SerialName("correo_personal")
    val correoPersonal: String? = null
)
```

#### **CreateUserResponse.kt**
```kotlin
@Serializable
data class CreateUserResponse(
    val success: Boolean,
    val user: User? = null,
    val message: String? = null,
    val errors: Map<String, List<String>>? = null
)
```

---

### Paso 2: Actualizar ApiService

Agrega estos métodos a tu `ApiService.kt`:

```kotlin
@GET("users/")
suspend fun getUsers(
    @Header("Authorization") token: String
): Response<List<User>>

@POST("auth/register/")
suspend fun createUser(
    @Header("Authorization") token: String,
    @Body request: CreateUserRequest
): Response<CreateUserResponse>

@POST("users/{id}/toggle-active/")
suspend fun toggleUserActive(
    @Header("Authorization") token: String,
    @Path("id") userId: Int
): Response<ApiResponse<User>>
```

---

### Paso 3: Crear UserRepository

Crea `UserRepository.kt` en `data/repository/`:

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
                Result.Error("Error al obtener usuarios: ${response.code()}")
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
                    val errorMsg = body.errors?.entries?.joinToString("\n") { (field, errors) ->
                        "$field: ${errors.joinToString(", ")}"
                    } ?: "Error al crear usuario"
                    Result.Error(errorMsg)
                }
            } else {
                Result.Error("Error: ${response.code()}")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
}
```

---

### Paso 4: Crear UserViewModel

Crea `UserViewModel.kt`:

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
            
            // Si fue exitoso, recargar la lista
            if (_createUserState.value is Result.Success) {
                loadUsers()
            }
        }
    }
    
    fun resetCreateUserState() {
        _createUserState.value = null
    }
}
```

---

### Paso 5: Actualizar tus Pantallas

#### **AdminUsersScreen.kt** (Lista de usuarios)

```kotlin
@Composable
fun AdminUsersScreen(
    viewModel: UserViewModel = viewModel(),
    onCreateUserClick: () -> Unit
) {
    val usersState by viewModel.usersState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadUsers()
    }
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        Button(
            onClick = onCreateUserClick,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("+ Agregar usuario")
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        when (val state = usersState) {
            is Result.Loading -> CircularProgressIndicator()
            is Result.Success -> {
                LazyColumn {
                    items(state.data) { user ->
                        UserCard(user = user)
                    }
                }
            }
            is Result.Error -> Text(state.message, color = Color.Red)
        }
    }
}
```

#### **CreateUserScreen.kt** (Formulario)

```kotlin
@Composable
fun CreateUserScreen(
    viewModel: UserViewModel = viewModel(),
    onUserCreated: () -> Unit
) {
    var firstName by remember { mutableStateOf("") }
    var lastName by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var role by remember { mutableStateOf("student") }
    
    val createUserState by viewModel.createUserState.collectAsState()
    
    LaunchedEffect(createUserState) {
        if (createUserState is Result.Success) {
            onUserCreated()
            viewModel.resetCreateUserState()
        }
    }
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        OutlinedTextField(
            value = firstName,
            onValueChange = { firstName = it },
            label = { Text("Nombre *") },
            modifier = Modifier.fillMaxWidth()
        )
        
        OutlinedTextField(
            value = lastName,
            onValueChange = { lastName = it },
            label = { Text("Apellidos *") },
            modifier = Modifier.fillMaxWidth()
        )
        
        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("Correo Electrónico *") },
            modifier = Modifier.fillMaxWidth()
        )
        
        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Contraseña *") },
            modifier = Modifier.fillMaxWidth()
        )
        
        // Selector de rol
        ExposedDropdownMenuBox(...) {
            // Implementar dropdown para rol
        }
        
        Button(
            onClick = {
                viewModel.createUser(
                    username = email.substringBefore("@"),
                    email = email,
                    password = password,
                    firstName = firstName,
                    lastName = lastName,
                    role = role
                )
            },
            enabled = firstName.isNotBlank() && 
                     lastName.isNotBlank() && 
                     email.isNotBlank() && 
                     password.isNotBlank()
        ) {
            Text("CREAR USUARIO")
        }
    }
}
```

---

## 🧪 Cómo Probar

### 1. Probar el Backend (desde terminal)

```bash
# Login como admin
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Copiar el token de la respuesta

# Listar usuarios
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Crear usuario
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI" \
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

### 2. Probar en Android

1. Inicia sesión como administrador
2. Navega a "Gestionar Usuarios"
3. Verifica que se cargue la lista de usuarios
4. Click en "Agregar Usuario"
5. Llena el formulario y envía
6. Verifica que el nuevo usuario aparezca en la lista

---

## 📚 Documentación Completa

Para más detalles, consulta: `docs/MOBILE_API_USERS.md`

---

## ✅ Checklist de Implementación

- [ ] Crear modelos: `User.kt`, `CreateUserRequest.kt`, `CreateUserResponse.kt`
- [ ] Actualizar `ApiService.kt` con los nuevos métodos
- [ ] Crear `UserRepository.kt`
- [ ] Crear `UserViewModel.kt`
- [ ] Actualizar `AdminUsersScreen.kt` para usar datos reales
- [ ] Actualizar `CreateUserScreen.kt` para enviar datos al backend
- [ ] Probar flujo completo de creación
- [ ] Probar flujo completo de listado
- [ ] Manejar errores correctamente

---

**¡El backend ya está listo! Solo necesitas implementar el código Android siguiendo estos pasos.** 🚀
