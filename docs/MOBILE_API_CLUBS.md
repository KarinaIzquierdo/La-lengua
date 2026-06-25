# 🎯 API de Clubs para Android

## ✅ Endpoint Implementado

### **GET** `/api/clubs/`

Endpoint para obtener los clubs asignados al estudiante autenticado, incluyendo los materiales de cada club.

---

## 🔐 Autenticación

**Requiere:** Token JWT en el header

```
Authorization: Bearer <token>
```

---

## 📥 Response (JSON)

### **Éxito (200 OK):**

```json
{
  "success": true,
  "total": 2,
  "clubs": [
    {
      "id": 1,
      "name": "Conversation Club",
      "description": "Club de conversación en inglés para nivel intermedio",
      "profesor": "María García",
      "total_students": 15,
      "materials": [
        {
          "id": 1,
          "week": "2025-W42",
          "title": "Week 42 - Business Vocabulary",
          "description": "Material sobre vocabulario de negocios",
          "resource_type": "file",
          "url": "",
          "file_url": "http://10.0.2.2:8000/media/clubs/vocabulary_week42.pdf",
          "created_at": "2025-10-15T10:00:00Z"
        },
        {
          "id": 2,
          "week": "2025-W41",
          "title": "Week 41 - Pronunciation Practice",
          "description": "Ejercicios de pronunciación",
          "resource_type": "url",
          "url": "https://www.youtube.com/watch?v=example",
          "file_url": "",
          "created_at": "2025-10-08T10:00:00Z"
        }
      ],
      "created_at": "2025-09-01T08:00:00Z"
    },
    {
      "id": 2,
      "name": "Grammar Workshop",
      "description": "Taller intensivo de gramática",
      "profesor": "John Smith",
      "total_students": 12,
      "materials": [
        {
          "id": 3,
          "week": "2025-W42",
          "title": "Present Perfect Exercises",
          "description": "Ejercicios de Present Perfect",
          "resource_type": "file",
          "url": "",
          "file_url": "http://10.0.2.2:8000/media/clubs/grammar_exercises.pdf",
          "created_at": "2025-10-14T14:00:00Z"
        }
      ],
      "created_at": "2025-09-01T08:00:00Z"
    }
  ]
}
```

### **Sin clubs (200 OK):**

```json
{
  "success": true,
  "total": 0,
  "clubs": []
}
```

### **Error (400 Bad Request):**

```json
{
  "success": false,
  "message": "Error al obtener clubs: [descripción del error]",
  "clubs": []
}
```

---

## 📊 Campos de Club

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID único del club |
| `name` | String | Nombre del club |
| `description` | String | Descripción del club |
| `profesor` | String | Nombre del profesor a cargo |
| `total_students` | Integer | Número total de estudiantes |
| `materials` | Array | Lista de materiales del club |
| `created_at` | String (ISO) | Fecha de creación |

## 📊 Campos de Material

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID único del material |
| `week` | String | Semana del material (formato: YYYY-WXX) |
| `title` | String | Título del material |
| `description` | String | Descripción del material |
| `resource_type` | String | "file" o "url" |
| `url` | String | URL externa (si es tipo "url") |
| `file_url` | String | URL del archivo (si es tipo "file") |
| `created_at` | String (ISO) | Fecha de creación |

---

## 🔧 Implementación en Android (Kotlin)

### **1. Crear modelos de datos:**

```kotlin
@Serializable
data class ClubMaterial(
    val id: Int,
    val week: String,
    val title: String,
    val description: String,
    @SerializedName("resource_type")
    val resourceType: String,
    val url: String,
    @SerializedName("file_url")
    val fileUrl: String,
    @SerializedName("created_at")
    val createdAt: String
)

@Serializable
data class Club(
    val id: Int,
    val name: String,
    val description: String,
    val profesor: String,
    @SerializedName("total_students")
    val totalStudents: Int,
    val materials: List<ClubMaterial>,
    @SerializedName("created_at")
    val createdAt: String
)

@Serializable
data class ClubsResponse(
    val success: Boolean,
    val total: Int,
    val clubs: List<Club>,
    val message: String? = null
)
```

### **2. Agregar función en ApiService.kt:**

```kotlin
interface ApiService {
    // ... otros endpoints
    
    @GET("clubs/")
    suspend fun getUserClubs(
        @Header("Authorization") token: String
    ): ClubsResponse
}
```

### **3. Implementar en Repository:**

```kotlin
class ClubsRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun getUserClubs(): Result<List<Club>> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }
            
            val response = apiService.getUserClubs("Bearer $token")
            
            if (response.success) {
                Result.Success(response.clubs)
            } else {
                Result.Error(response.message ?: "Error al obtener clubs")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error de conexión")
        }
    }
}
```

### **4. Crear ViewModel:**

```kotlin
class ClubsViewModel(
    private val clubsRepository: ClubsRepository
) : ViewModel() {
    
    private val _clubs = MutableStateFlow<List<Club>>(emptyList())
    val clubs: StateFlow<List<Club>> = _clubs.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        loadClubs()
    }
    
    fun loadClubs() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            when (val result = clubsRepository.getUserClubs()) {
                is Result.Success -> {
                    _clubs.value = result.data
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            
            _isLoading.value = false
        }
    }
    
    fun refresh() {
        loadClubs()
    }
}
```

### **5. Implementar UI en ClubScreen.kt:**

```kotlin
@Composable
fun ClubScreen(
    viewModel: ClubsViewModel = hiltViewModel()
) {
    val clubs by viewModel.clubs.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Mis Clubs") }
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
                clubs.isEmpty() -> {
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(
                            imageVector = Icons.Default.Groups,
                            contentDescription = null,
                            modifier = Modifier.size(64.dp),
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "No estás asignado a ningún club",
                            style = MaterialTheme.typography.bodyLarge
                        )
                    }
                }
                else -> {
                    LazyColumn(
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(16.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        items(clubs) { club ->
                            ClubCard(club = club)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun ClubCard(club: Club) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Nombre del club
            Text(
                text = club.name,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Descripción
            if (club.description.isNotEmpty()) {
                Text(
                    text = club.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Spacer(modifier = Modifier.height(8.dp))
            }
            
            // Profesor
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Person,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Profesor: ${club.profesor}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Estudiantes
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.Groups,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "${club.totalStudents} estudiantes",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            
            // Materiales
            if (club.materials.isNotEmpty()) {
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Materiales Recientes",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                club.materials.forEach { material ->
                    MaterialItem(material = material)
                    Spacer(modifier = Modifier.height(8.dp))
                }
            }
        }
    }
}

@Composable
fun MaterialItem(material: ClubMaterial) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icono según tipo
            Icon(
                imageVector = if (material.resourceType == "file") 
                    Icons.Default.Description 
                else 
                    Icons.Default.Link,
                contentDescription = null,
                modifier = Modifier.size(24.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = material.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Medium
                )
                Text(
                    text = "Semana: ${material.week}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            // Botón de acción
            IconButton(
                onClick = { 
                    // Abrir URL o descargar archivo
                }
            ) {
                Icon(
                    imageVector = if (material.resourceType == "file")
                        Icons.Default.Download
                    else
                        Icons.Default.OpenInNew,
                    contentDescription = "Abrir"
                )
            }
        }
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

# 2. Obtener clubs (usa el token del paso 1)
curl -X GET http://localhost:8000/api/clubs/ \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

---

## 📝 Notas importantes

1. **Materiales limitados** - El endpoint devuelve los últimos 10 materiales activos por club
2. **Dos tipos de recursos:**
   - `file`: Material descargable (PDF, documento, etc.)
   - `url`: Enlace externo (YouTube, sitio web, etc.)
3. **Formato de semana** - `YYYY-WXX` (ejemplo: `2025-W42`)
4. **Solo materiales activos** - No se muestran materiales desactivados

---

## 🎯 Funcionalidades sugeridas

- ✅ **Lista de clubs** con información del profesor
- ✅ **Materiales por club** con tipo (archivo/URL)
- ✅ **Descargar archivos** o abrir enlaces externos
- ✅ **Pull to refresh** para actualizar
- ✅ **Indicador de nuevos materiales**
- ✅ **Búsqueda de materiales** por semana o título

---

## 🎨 Tipos de recursos

| Tipo | Descripción | Acción |
|------|-------------|--------|
| `file` | Archivo descargable | Descargar usando `file_url` |
| `url` | Enlace externo | Abrir en navegador usando `url` |
