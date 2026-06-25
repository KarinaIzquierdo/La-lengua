# 📝 API de Evaluaciones para Android

## ✅ Endpoint Implementado

### **GET** `/api/evaluations/`

Endpoint para obtener todas las evaluaciones asignadas al estudiante autenticado.

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
  "total": 3,
  "evaluaciones": [
    {
      "id": 1,
      "titulo": "Quiz de Gramática - Present Perfect",
      "descripcion": "Evaluación sobre el uso del Present Perfect en diferentes contextos",
      "tipo": "quiz",
      "profesor": "María García",
      "fecha_limite": "2025-10-20T23:59:59Z",
      "archivo_url": "http://localhost:8000/media/evaluaciones/quiz_grammar.pdf",
      "estado_estudiante": "pendiente",
      "fecha_entrega": "",
      "calificacion": null,
      "created_at": "2025-10-01T10:00:00Z"
    },
    {
      "id": 2,
      "titulo": "Examen Final - Business English",
      "descripcion": "Examen comprehensivo de inglés de negocios",
      "tipo": "examen",
      "profesor": "John Smith",
      "fecha_limite": "2025-10-25T18:00:00Z",
      "archivo_url": "http://localhost:8000/media/evaluaciones/final_exam.pdf",
      "estado_estudiante": "entregada",
      "fecha_entrega": "2025-10-18T14:30:00Z",
      "calificacion": 85.5,
      "created_at": "2025-10-01T10:00:00Z"
    },
    {
      "id": 3,
      "titulo": "Tarea - Vocabulario Técnico",
      "descripcion": "Completar ejercicios de vocabulario técnico",
      "tipo": "tarea",
      "profesor": "Sarah Johnson",
      "fecha_limite": "2025-10-22T23:59:59Z",
      "archivo_url": "http://localhost:8000/media/evaluaciones/vocab_homework.pdf",
      "estado_estudiante": "pendiente",
      "fecha_entrega": "",
      "calificacion": null,
      "created_at": "2025-10-05T08:00:00Z"
    }
  ]
}
```

### **Sin evaluaciones (200 OK):**

```json
{
  "success": true,
  "total": 0,
  "evaluaciones": []
}
```

### **Error (400 Bad Request):**

```json
{
  "success": false,
  "message": "Error al obtener evaluaciones: [descripción del error]",
  "evaluaciones": []
}
```

### **Error de autenticación (401 Unauthorized):**

```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## 📊 Campos de Evaluación

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | Integer | ID único de la evaluación |
| `titulo` | String | Título de la evaluación |
| `descripcion` | String | Descripción detallada |
| `tipo` | String | "quiz", "examen" o "tarea" |
| `profesor` | String | Nombre del profesor que creó la evaluación |
| `fecha_limite` | String (ISO) | Fecha y hora límite de entrega |
| `archivo_url` | String | URL para descargar el archivo de la evaluación |
| `estado_estudiante` | String | "pendiente" o "entregada" |
| `fecha_entrega` | String (ISO) | Fecha de entrega (vacío si no se ha entregado) |
| `calificacion` | Float/null | Calificación sobre 100 (null si no está calificada) |
| `created_at` | String (ISO) | Fecha de creación |

---

## 🔧 Implementación en Android (Kotlin)

### **1. Crear modelo de datos:**

```kotlin
data class Evaluation(
    val id: Int,
    val titulo: String,
    val descripcion: String,
    val tipo: String,
    val profesor: String,
    @SerializedName("fecha_limite")
    val fechaLimite: String,
    @SerializedName("archivo_url")
    val archivoUrl: String,
    @SerializedName("estado_estudiante")
    val estadoEstudiante: String,
    @SerializedName("fecha_entrega")
    val fechaEntrega: String,
    val calificacion: Float?,
    @SerializedName("created_at")
    val createdAt: String
)

data class EvaluationsResponse(
    val success: Boolean,
    val total: Int,
    val evaluaciones: List<Evaluation>
)
```

### **2. Agregar función en ApiService.kt:**

```kotlin
interface ApiService {
    // ... otros endpoints
    
    @GET("evaluations/")
    suspend fun getUserEvaluations(
        @Header("Authorization") token: String
    ): EvaluationsResponse
}
```

### **3. Implementar en Repository:**

```kotlin
class EvaluationsRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun getUserEvaluations(): Result<List<Evaluation>> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }
            
            val response = apiService.getUserEvaluations("Bearer $token")
            
            if (response.success) {
                Result.Success(response.evaluaciones)
            } else {
                Result.Error("Error al obtener evaluaciones")
            }
        } catch (e: Exception) {
            Result.Error(e.message ?: "Error de conexión")
        }
    }
}
```

### **4. Crear ViewModel:**

```kotlin
class EvaluationsViewModel(
    private val evaluationsRepository: EvaluationsRepository
) : ViewModel() {
    
    private val _evaluations = MutableStateFlow<List<Evaluation>>(emptyList())
    val evaluations: StateFlow<List<Evaluation>> = _evaluations.asStateFlow()
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()
    
    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()
    
    init {
        loadEvaluations()
    }
    
    fun loadEvaluations() {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            
            when (val result = evaluationsRepository.getUserEvaluations()) {
                is Result.Success -> {
                    _evaluations.value = result.data
                }
                is Result.Error -> {
                    _error.value = result.message
                }
            }
            
            _isLoading.value = false
        }
    }
    
    fun refresh() {
        loadEvaluations()
    }
    
    // Filtrar evaluaciones pendientes
    fun getPendingEvaluations(): List<Evaluation> {
        return _evaluations.value.filter { it.estadoEstudiante == "pendiente" }
    }
    
    // Filtrar evaluaciones entregadas
    fun getSubmittedEvaluations(): List<Evaluation> {
        return _evaluations.value.filter { it.estadoEstudiante == "entregada" }
    }
}
```

### **5. Implementar UI en EvaluationsScreen.kt:**

```kotlin
@Composable
fun EvaluationsScreen(
    viewModel: EvaluationsViewModel = hiltViewModel()
) {
    val evaluations by viewModel.evaluations.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()
    
    var selectedTab by remember { mutableStateOf(0) }
    val tabs = listOf("Todas", "Pendientes", "Entregadas")
    
    Scaffold(
        topBar = {
            Column {
                TopAppBar(
                    title = { Text("Evaluaciones") }
                )
                TabRow(selectedTabIndex = selectedTab) {
                    tabs.forEachIndexed { index, title ->
                        Tab(
                            selected = selectedTab == index,
                            onClick = { selectedTab = index },
                            text = { Text(title) }
                        )
                    }
                }
            }
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
                else -> {
                    val filteredEvaluations = when (selectedTab) {
                        0 -> evaluations
                        1 -> viewModel.getPendingEvaluations()
                        2 -> viewModel.getSubmittedEvaluations()
                        else -> evaluations
                    }
                    
                    if (filteredEvaluations.isEmpty()) {
                        Column(
                            modifier = Modifier.align(Alignment.Center),
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            Icon(
                                imageVector = Icons.Default.Assignment,
                                contentDescription = null,
                                modifier = Modifier.size(64.dp),
                                tint = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Spacer(modifier = Modifier.height(16.dp))
                            Text(
                                text = "No hay evaluaciones",
                                style = MaterialTheme.typography.bodyLarge
                            )
                        }
                    } else {
                        LazyColumn(
                            modifier = Modifier.fillMaxSize(),
                            contentPadding = PaddingValues(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            items(filteredEvaluations) { evaluation ->
                                EvaluationCard(
                                    evaluation = evaluation,
                                    onDownloadClick = { /* Implementar descarga */ }
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun EvaluationCard(
    evaluation: Evaluation,
    onDownloadClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            // Título
            Text(
                text = evaluation.titulo,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            // Descripción
            if (evaluation.descripcion.isNotEmpty()) {
                Text(
                    text = evaluation.descripcion,
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
                    text = "Profesor: ${evaluation.profesor}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            
            Spacer(modifier = Modifier.height(4.dp))
            
            // Fecha límite
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = Icons.Default.CalendarToday,
                    contentDescription = null,
                    modifier = Modifier.size(16.dp)
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    text = "Fecha límite: ${formatDate(evaluation.fechaLimite)}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
            
            Spacer(modifier = Modifier.height(12.dp))
            
            // Badges y estado
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    // Tipo
                    Badge(
                        text = evaluation.tipo,
                        containerColor = when (evaluation.tipo) {
                            "quiz" -> Color(0xFF2196F3)
                            "examen" -> Color(0xFFF44336)
                            "tarea" -> Color(0xFF4CAF50)
                            else -> Color.Gray
                        }
                    )
                    
                    // Estado
                    Badge(
                        text = evaluation.estadoEstudiante,
                        containerColor = when (evaluation.estadoEstudiante) {
                            "pendiente" -> Color(0xFFFF9800)
                            "entregada" -> Color(0xFF4CAF50)
                            else -> Color.Gray
                        }
                    )
                }
                
                // Calificación (si existe)
                if (evaluation.calificacion != null) {
                    Text(
                        text = "${evaluation.calificacion}/100",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            
            // Botón de descarga
            if (evaluation.archivoUrl.isNotEmpty()) {
                Spacer(modifier = Modifier.height(12.dp))
                Button(
                    onClick = onDownloadClick,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Icon(
                        imageVector = Icons.Default.Download,
                        contentDescription = null
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Descargar Evaluación")
                }
            }
        }
    }
}

fun formatDate(isoDate: String): String {
    // Implementar formateo de fecha
    return isoDate.split("T")[0]
}
```

---

## 🧪 Probar con cURL

```bash
# 1. Hacer login y obtener token
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "adrian@thelanguage.co", "password": "12345678"}'

# 2. Obtener evaluaciones (usa el token del paso 1)
curl -X GET http://localhost:8000/api/evaluations/ \
  -H "Authorization: Bearer <TOKEN_AQUI>"
```

---

## 📝 Notas importantes

1. **Solo evaluaciones publicadas** - No se muestran borradores
2. **Estado automático** - El backend calcula si está pendiente o entregada
3. **Calificación opcional** - Puede ser null si el profesor no ha calificado
4. **Ordenamiento** - Por fecha límite (más próximas primero)
5. **URL absoluta** - El archivo_url incluye el dominio completo

---

## 🎯 Funcionalidades sugeridas

- ✅ **Tabs para filtrar** (Todas, Pendientes, Entregadas)
- ✅ **Descargar archivo** de evaluación
- ✅ **Subir respuesta** (endpoint adicional necesario)
- ✅ **Notificaciones** antes de la fecha límite
- ✅ **Indicador visual** de evaluaciones vencidas
- ✅ **Pull to refresh** para actualizar

---

## 🔄 Estados de evaluación

- **pendiente**: El estudiante no ha entregado
- **entregada**: El estudiante ya entregó (puede o no tener calificación)

---

## 🎨 Colores sugeridos para tipos

- **Quiz**: Azul (#2196F3)
- **Examen**: Rojo (#F44336)
- **Tarea**: Verde (#4CAF50)
