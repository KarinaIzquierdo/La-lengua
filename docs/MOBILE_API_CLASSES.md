# 📚 API de Clases Programadas para Android

## ✅ Endpoints Implementados

### **1. GET** `/api/classes/` - Listar clases del usuario

Endpoint para obtener todas las clases programadas del usuario autenticado.

### **2. POST** `/api/classes/create/` - Crear nueva clase (Admins y Profesores)

Endpoint para que admins y profesores creen nuevas clases desde la app móvil.

### **3. GET** `/api/professors/` - Listar profesores

Endpoint para obtener la lista de profesores (para que admin seleccione al programar).

### **4. GET** `/api/students/` - Listar estudiantes

Endpoint para obtener la lista de estudiantes disponibles para asignar a clases.

---

## 🔐 Autenticación

**Requiere:** Token JWT en el header

```
Authorization: Bearer <token>
```

---

## 📥 Response (JSON)

### **Éxito (200 OK):**

**Nota:** El endpoint ahora separa las clases en dos categorías y filtra automáticamente las clases pasadas.

```json
{
  "success": true,
  "total": 3,
  "proximas": [
    {
      "id": 25,
      "nombre": "Escritura Académica",
      "profesor": "Profesor Actual",
      "fecha": "2025-10-15",
      "hora": "13:43",
      "duracion": 60,
      "tema": "Business English",
      "descripcion": "Práctica de escritura académica",
      "tipo_clase": "individual",
      "modalidad": "virtual",
      "meet_link": "https://meet.google.com/abc-defg-hij",
      "estado": "programada",
      "created_at": "2025-10-01T08:00:00Z"
    }
  ],
  "completadas": [
    {
      "id": 7,
      "nombre": "descripcion",
      "profesor": "adrian",
      "fecha": "2025-09-11",
      "hora": "08:00",
      "duracion": 60,
      "tema": "",
      "descripcion": "",
      "tipo_clase": "individual",
      "modalidad": "virtual",
      "meet_link": "",
      "estado": "completada",
      "created_at": "2025-09-01T08:00:00Z"
    }
  ],
  "clases": [
    {
      "id": 1,
      "nombre": "English Conversation",
      "profesor": "Prof. María García",
      "fecha": "2025-10-15",
      "hora": "10:00",
      "duracion": 60,
      "tema": "Business English",
      "descripcion": "Práctica de conversación en contextos empresariales",
      "tipo_clase": "individual",
      "modalidad": "virtual",
      "meet_link": "https://meet.google.com/abc-defg-hij",
      "estado": "programada",
      "created_at": "2025-10-01T08:00:00Z"
    },
    {
      "id": 2,
      "nombre": "Grammar Workshop",
      "profesor": "Prof. John Smith",
      "fecha": "2025-10-16",
      "hora": "14:00",
      "duracion": 90,
      "tema": "Present Perfect Tense",
      "descripcion": "Taller intensivo de gramática",
      "tipo_clase": "grupal",
      "modalidad": "virtual",
      "meet_link": "https://meet.google.com/xyz-uvwx-yz",
      "estado": "programada",
      "created_at": "2025-10-01T08:00:00Z"
    },
    {
      "id": 3,
      "nombre": "Pronunciation Practice",
      "profesor": "Prof. Sarah Johnson",
      "fecha": "2025-10-17",
      "hora": "16:00",
      "duracion": 45,
      "tema": "American Accent",
      "descripcion": "Ejercicios de pronunciación",
      "tipo_clase": "individual",
      "modalidad": "presencial",
      "meet_link": "",
      "estado": "programada",
      "created_at": "2025-10-01T08:00:00Z"
    }
  ]
}
```

### **Sin clases (200 OK):**

```json
{
  "success": true,
  "total": 0,
  "clases": []
}
```

### **Error (400 Bad Request):**

```json
{
  "success": false,
  "message": "Error al obtener clases: [descripción del error]",
  "clases": []
}
```

### **Error de autenticación (401 Unauthorized):**

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 📊 Campos de Clase

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID único de la clase |
| `nombre` | String | Nombre de la clase |
| `profesor` | String | Nombre del profesor |
| `fecha` | String (ISO) | Fecha de la clase (YYYY-MM-DD) |
| `hora` | String | Hora de inicio (HH:MM) |
| `duracion` | Integer | Duración en minutos |
| `tema` | String | Tema específico de la clase |
| `descripcion` | String | Descripción detallada |
| `tipo_clase` | String | "individual" o "grupal" |
| `modalidad` | String | "virtual" o "presencial" |
| `meet_link` | String | URL de Google Meet (si es virtual) |
| `estado` | String | "programada", "activa" o "completada" |
| `created_at` | String (ISO) | Fecha de creación |

---

## 🔧 Implementación en Android (Kotlin)

### **1. Crear modelo de datos:**

```kotlin
data class Clase(
    val id: Int,
    val nombre: String,
    val profesor: String,
    val fecha: String,
    val hora: String,
    val duracion: Int,
    val tema: String,
    val descripcion: String,
    @SerializedName("tipo_clase")
    val tipoClase: String,
    val modalidad: String,
    @SerializedName("meet_link")
    val meetLink: String,
    val estado: String,
    @SerializedName("created_at")
    val createdAt: String
)

data class ClassesResponse(
    val success: Boolean,
    val total: Int,
    val clases: List<Clase>
)
```

### **2. Agregar función en ApiService.kt:**

```kotlin
interface ApiService {
    // ... otros endpoints
    
    @GET("classes/")
    suspend fun getUserClasses(
        @Header("Authorization") token: String
    ): ClassesResponse
}
```

### **3. Implementar en Repository:**

```kotlin
class ClassesRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun getUserClasses(): Result<List<Clase>> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }
            
            val response = apiService.getUserClasses("Bearer $token")
            
            if (response.success) {
                Result.Success(response.clases)
            } else {
                Result.Error("Error al obtener clases")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error de conexión")
        }
    }
}
```

### **4. Crear ViewModel:**

```kotlin
class ClassesViewModel(
    private val classesRepository: ClassesRepository
) : ViewModel() {
    
    private val _classes = MutableStateFlow<List<Clase>>(emptyList())
    val classes: StateFlow<List<Clase>> = _classes.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        loadClasses()
    }
    
    fun loadClasses() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            when (val result = classesRepository.getUserClasses()) {
                is Result.Success -> {
                    _classes.value = result.data
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            
            _isLoading.value = false
        }
    }
    
    fun refresh() {
        loadClasses()
    }
}
```

### **5. Implementar UI en ClassesScreen.kt:**

```kotlin
@Composable
fun ClassesScreen(
    viewModel: ClassesViewModel = hiltViewModel()
) {
    val classes by viewModel.classes.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Clases Programadas") }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when {
                isLoading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                error != null -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = error ?: "Error desconocido",
                            color = MaterialTheme.colorScheme.error
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.refresh() }) {
                            Text("Reintentar")
                        }
                    }
                }
                classes.isEmpty() -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.EventBusy,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "No tienes clases programadas",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(classes) { clase ->
                            ClassCard(clase = clase)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ClassCard(clase: Clase) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Nombre de la clase
            Text(
                text = clase.nombre,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Profesor
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = clase.profesor,
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Fecha y hora
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${clase.fecha} - ${clase.hora}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Tema
            if (clase.tema.isNotEmpty()) {
                Text(
                    text = "Tema: ${clase.tema}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Badges
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                // Tipo de clase
                Badge(text = clase.tipoClase)
                
                // Modalidad
                Badge(text = clase.modalidad)
                
                // Estado
                Badge(
                    text = clase.estado,
                    containerColor = when (clase.estado) {
                        "programada" -> Color(0xFF2196F3)
                        "activa" -> Color(0xFF4CAF50)
                        "completada" -> Color(0xFF9E9E9E)
                        else -> Color.Gray
                    }
                )
            }
            
            // Link de Meet (si existe)
            if (clase.meetLink.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = { /* Abrir link */ },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.VideoCall,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Unirse a la clase")
                }
            }
        }
    }
}

@Composable
fun Badge(
    text: String,
    containerColor: Color = MaterialTheme.colorScheme.primaryContainer
) {
    Surface(
        color = containerColor,
        shape = RoundedCornerShape(12.dp)
    ) {
        Text(
            text = text,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall
        )
    }
}
```

---

## 🧪 Probar con cURL

```bash
# 1. Hacer login y obtener token
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "adrian@thelanguage.co", "password": "12345678"}'

# 2. Obtener clases (usa el token del paso 1)
curl -X GET http://localhost:8000/api/classes/ \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

---

## 📝 Notas importantes

1. **Las clases se ordenan** por fecha y hora (más próximas primero)
2. **Solo se devuelven las clases del usuario autenticado**
3. **El campo `meet_link` puede estar vacío** si la clase es presencial
4. **El estado puede ser:** "programada", "activa" o "completada"
5. **Implementa pull-to-refresh** para actualizar la lista

---

## 🎯 Funcionalidades sugeridas

- ✅ **Mostrar lista de clases** ordenadas por fecha
- ✅ **Filtrar por estado** (programadas, completadas)
- ✅ **Botón para unirse** a clases virtuales (abrir Meet link)
- ✅ **Pull to refresh** para actualizar
- ✅ **Notificaciones** antes de cada clase
- ✅ **Calendario visual** de clases

---

# 📝 CREAR NUEVA CLASE (Solo Profesores)

## **POST** `/api/classes/create/`

Endpoint para que admins y profesores creen nuevas clases desde la app móvil.

**Diferencias por rol:**
- **Admin:** Puede especificar qué profesor se asigna a la clase
- **Profesor:** La clase se asigna automáticamente a él

---

## 🔐 Autenticación

**Requiere:** Token JWT de un usuario con role="admin" o role="profesor"

```
Authorization: Bearer <token>
```

---

## 📤 Request Body (JSON)

### **Ejemplo para Admin (especifica profesor):**

```json
{
  "nombre": "English Conversation",
  "fecha": "2025-10-25",
  "hora": "10:00",
  "duracion": 60,
  "tema": "Business English",
  "modalidad": "virtual",
  "profesor": "María González",
  "descripcion": "Práctica de conversación en contextos empresariales",
  "tipo_clase": "individual",
  "meet_link": "https://meet.google.com/abc-defg-hij",
  "estudiantes": [18, 19, 20]
}
```

### **Ejemplo para Profesor (no especifica profesor):**

```json
{
  "nombre": "English Conversation",
  "fecha": "2025-10-25",
  "hora": "10:00",
  "duracion": 60,
  "tema": "Business English",
  "modalidad": "virtual",
  "descripcion": "Práctica de conversación en contextos empresariales",
  "tipo_clase": "individual",
  "meet_link": "https://meet.google.com/abc-defg-hij",
  "estudiantes": [18, 19, 20]
}
```

### **Descripción de campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `nombre` | String | ✅ | Nombre de la clase |
| `fecha` | String | ✅ | Fecha (YYYY-MM-DD) |
| `hora` | String | ✅ | Hora (HH:MM) |
| `duracion` | Integer | ✅ | Duración en minutos |
| `tema` | String | ✅ | Tema de la clase |
| `modalidad` | String | ✅ | "virtual" o "presencial" |
| `profesor` | String | ❌ | Nombre del profesor (solo admin) |
| `descripcion` | String | ❌ | Descripción detallada |
| `tipo_clase` | String | ❌ | "individual" o "grupal" (default: "individual") |
| `meet_link` | String | ❌ | URL de Google Meet (solo si es virtual) |
| `estudiantes` | Array[Int] | ❌ | IDs de estudiantes a asignar |

---

## 📥 Response (JSON)

### **Éxito (201 Created):**

```json
{
  "success": true,
  "message": "Clase creada exitosamente",
  "clase": {
    "id": 26,
    "nombre": "English Conversation",
    "profesor": "María González",
    "fecha": "2025-10-25",
    "hora": "10:00",
    "duracion": 60,
    "tema": "Business English",
    "descripcion": "Práctica de conversación en contextos empresariales",
    "tipo_clase": "individual",
    "modalidad": "virtual",
    "meet_link": "https://meet.google.com/abc-defg-hij",
    "estado": "programada",
    "created_at": "2025-10-23T15:30:00Z"
  }
}
```

### **Error - No autorizado (403 Forbidden):**

```json
{
  "success": false,
  "message": "Solo los administradores y profesores pueden crear clases"
}
```

### **Error - Campos faltantes (400 Bad Request):**

```json
{
  "success": false,
  "message": "Campos requeridos faltantes: nombre, fecha, hora"
}
```

### **Error - Validación (400 Bad Request):**

```json
{
  "success": false,
  "message": "Error de validación",
  "errors": {
    "fecha": ["Enter a valid date."],
    "hora": ["This field is required."]
  }
}
```

---

## 🔧 Implementación en Android (Kotlin)

### **1. Modelo de datos para crear clase:**

```kotlin
@Serializable
data class CreateClassRequest(
    val nombre: String,
    val fecha: String,  // "YYYY-MM-DD"
    val hora: String,   // "HH:MM"
    val duracion: Int,
    val tema: String,
    val modalidad: String,  // "virtual" o "presencial"
    val descripcion: String = "",
    @SerialName("tipo_clase")
    val tipoClase: String = "individual",
    @SerialName("meet_link")
    val meetLink: String = "",
    val estudiantes: List<Int> = emptyList()
)

@Serializable
data class CreateClassResponse(
    val success: Boolean,
    val message: String? = null,
    val clase: Clase? = null,
    val errors: Map<String, List<String>>? = null
)
```

### **2. Agregar en ApiService.kt:**

```kotlin
interface ApiService {
    // ... otros endpoints
    
    @POST("classes/create/")
    suspend fun createClass(
        @Header("Authorization") token: String,
        @Body request: CreateClassRequest
    ): CreateClassResponse
}
```

### **3. Implementar en Repository:**

```kotlin
class ClassesRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun createClass(
        nombre: String,
        fecha: String,
        hora: String,
        duracion: Int,
        tema: String,
        modalidad: String,
        descripcion: String = "",
        tipoClase: String = "individual",
        meetLink: String = "",
        estudiantesIds: List<Int> = emptyList()
    ): Result<Clase> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }
            
            Log.d("ClassesRepository", "📝 Creando clase: $nombre")
            
            val request = CreateClassRequest(
                nombre = nombre,
                fecha = fecha,
                hora = hora,
                duracion = duracion,
                tema = tema,
                modalidad = modalidad,
                descripcion = descripcion,
                tipoClase = tipoClase,
                meetLink = meetLink,
                estudiantes = estudiantesIds
            )
            
            val response = apiService.createClass("Bearer $token", request)
            
            Log.d("ClassesRepository", "✅ Respuesta: ${response.success}")
            
            if (response.success && response.clase != null) {
                Result.Success(response.clase)
            } else {
                Result.Error(response.message ?: "Error al crear clase")
            }
        } catch (e: Exception) {
            Log.e("ClassesRepository", "❌ Error: ${e.message}", e)
            Result.Error(e.message ?: "Error de conexión")
        }
    }
}
```

### **4. ViewModel:**

```kotlin
class CreateClassViewModel(
    private val classesRepository: ClassesRepository
) : ViewModel() {
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    private val _success = MutableStateFlow(false)
    val success: StateFlow<Boolean> = _success.asStateFlow()
    
    fun createClass(
        nombre: String,
        fecha: String,
        hora: String,
        duracion: Int,
        tema: String,
        modalidad: String,
        descripcion: String = "",
        tipoClase: String = "individual",
        meetLink: String = "",
        estudiantesIds: List<Int> = emptyList()
    ) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            _success.value = false
            
            when (val result = classesRepository.createClass(
                nombre, fecha, hora, duracion, tema, modalidad,
                descripcion, tipoClase, meetLink, estudiantesIds
            )) {
                is Result.Success -> {
                    _success.value = true
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            
            _isLoading.value = false
        }
    }
}
```

---

# 👨‍🏫 LISTAR PROFESORES

## **GET** `/api/professors/`

Endpoint para obtener la lista de profesores (para que admin seleccione al programar clases).

---

## 📥 Response (JSON)

### **Éxito (200 OK):**

```json
{
  "success": true,
  "total": 3,
  "professors": [
    {
      "id": 20,
      "username": "profesor@thelanguage.com",
      "email": "profesor@thelanguage.com",
      "first_name": "María",
      "last_name": "González",
      "full_name": "María González"
    },
    {
      "id": 21,
      "username": "john@thelanguage.com",
      "email": "john@thelanguage.com",
      "first_name": "John",
      "last_name": "Smith",
      "full_name": "John Smith"
    }
  ]
}
```

---

## 🔧 Implementación en Android

### **1. Modelo de datos:**

```kotlin
@Serializable
data class Professor(
    val id: Int,
    val username: String,
    val email: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    @SerialName("full_name")
    val fullName: String
)

@Serializable
data class ProfessorsResponse(
    val success: Boolean,
    val total: Int,
    val professors: List<Professor>
)
```

### **2. ApiService:**

```kotlin
@GET("professors/")
suspend fun getProfessors(
    @Header("Authorization") token: String
): ProfessorsResponse
```

### **3. Repository:**

```kotlin
suspend fun getProfessors(): Result<List<Professor>> {
    return try {
        val token = sessionManager.getToken()
        if (token.isNullOrEmpty()) {
            return Result.Error("No hay token de autenticación")
        }
        
        val response = apiService.getProfessors("Bearer $token")
        
        if (response.success) {
            Result.Success(response.professors)
        } else {
            Result.Error("Error al obtener profesores")
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de conexión")
    }
}
```

---

# 👥 LISTAR ESTUDIANTES

## **GET** `/api/students/`

Endpoint para obtener la lista de estudiantes disponibles para asignar a clases.

---

## 📥 Response (JSON)

### **Éxito (200 OK):**

```json
{
  "success": true,
  "total": 5,
  "students": [
    {
      "id": 18,
      "username": "adrian@thelanguage.co",
      "email": "adrian@thelanguage.co",
      "first_name": "Adrian",
      "last_name": "Pérez",
      "full_name": "Adrian Pérez"
    },
    {
      "id": 19,
      "username": "maria@example.com",
      "email": "maria@example.com",
      "first_name": "María",
      "last_name": "García",
      "full_name": "María García"
    }
  ]
}
```

---

## 🔧 Implementación en Android

### **1. Modelo de datos:**

```kotlin
@Serializable
data class Student(
    val id: Int,
    val username: String,
    val email: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    @SerialName("full_name")
    val fullName: String
)

@Serializable
data class StudentsResponse(
    val success: Boolean,
    val total: Int,
    val students: List<Student>
)
```

### **2. ApiService:**

```kotlin
@GET("students/")
suspend fun getStudents(
    @Header("Authorization") token: String
): StudentsResponse
```

### **3. Repository:**

```kotlin
suspend fun getStudents(): Result<List<Student>> {
    return try {
        val token = sessionManager.getToken()
        if (token.isNullOrEmpty()) {
            return Result.Error("No hay token de autenticación")
        }
        
        val response = apiService.getStudents("Bearer $token")
        
        if (response.success) {
            Result.Success(response.students)
        } else {
            Result.Error("Error al obtener estudiantes")
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de conexión")
    }
}
```

---

## 🧪 Probar con cURL

### **1. Crear clase:**

```bash
curl -X POST http://localhost:8000/api/classes/create/ \
  -H "Authorization: Bearer <TOKEN_PROFESOR>" \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "English Conversation",
    "fecha": "2025-10-25",
    "hora": "10:00",
    "duracion": 60,
    "tema": "Business English",
    "modalidad": "virtual",
    "descripcion": "Práctica de conversación",
    "tipo_clase": "individual",
    "meet_link": "https://meet.google.com/abc-defg-hij",
    "estudiantes": [18, 19]
  }'
```

### **2. Listar estudiantes:**

```bash
curl -X GET http://localhost:8000/api/students/ \
  -H "Authorization: Bearer <TOKEN>"
```

---

## ✅ Resumen de lo que necesitas

### **Para Android:**

1. **Modelos de datos:**
   - `CreateClassRequest`
   - `CreateClassResponse`
   - `Professor`
   - `ProfessorsResponse`
   - `Student`
   - `StudentsResponse`

2. **Endpoints en ApiService:**
   - `POST classes/create/`
   - `GET professors/`
   - `GET students/`

3. **Repository:**
   - `createClass()`
   - `getProfessors()`
   - `getStudents()`

4. **ViewModel:**
   - `CreateClassViewModel`

5. **UI:**
   - Formulario con todos los campos
   - **Selector de profesor** (solo si es admin)
   - Selector de estudiantes (multi-select)
   - Validación de campos
   - Botón "Programar Clase"

### **Backend ya está listo:**
- ✅ Endpoint `/api/classes/create/` funcionando (admins y profesores)
- ✅ Endpoint `/api/professors/` funcionando
- ✅ Endpoint `/api/students/` funcionando
- ✅ Validación de permisos (admins y profesores)
- ✅ Logs para debug
- ✅ Admin puede asignar profesor a la clase

---

## 🎯 Flujo completo:

### **Para Admin:**
```
1. Admin abre "Programar Clases"
2. Llena formulario:
   - Nombre, fecha, hora, duración, tema
   - Selecciona PROFESOR del dropdown
   - Selecciona estudiantes del dropdown
   - Modalidad (virtual/presencial)
   - Meet link (si es virtual)
3. Click en "Programar Clase"
4. Backend crea la clase asignada al profesor seleccionado
5. Clase aparece en:
   - Dashboard del profesor asignado (Web)
   - Dashboard de estudiantes asignados (Web + Android)
```

### **Para Profesor:**
```
1. Profesor abre "Programar Clases"
2. Llena formulario:
   - Nombre, fecha, hora, duración, tema
   - Selecciona estudiantes del dropdown
   - Modalidad (virtual/presencial)
   - Meet link (si es virtual)
3. Click en "Programar Clase"
4. Backend crea la clase asignada automáticamente a él
5. Clase aparece en:
   - Su propio dashboard (Web)
   - Dashboard de estudiantes asignados (Web + Android)
```
