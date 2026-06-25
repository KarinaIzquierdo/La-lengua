# 📱 API de Galería - Aplicación Móvil Android

## 📋 Resumen

La galería permite gestionar contenido multimedia (videos, imágenes, infografías) que los usuarios pueden ver en la app.

---

## 📌 Endpoints Disponibles

| Endpoint | Método | Autenticación | Descripción |
|----------|--------|---------------|-------------|
| `/api/media/` | GET | ❌ No requerida | Listar todos los elementos |
| `/api/media/` | POST | ✅ Requerida | Crear nuevo elemento |
| `/api/media/{id}/` | GET | ❌ No requerida | Ver detalle de un elemento |
| `/api/media/{id}/` | PUT | ✅ Requerida | Actualizar elemento |
| `/api/media/{id}/` | DELETE | ✅ Requerida | Eliminar elemento (soft delete) |

---

## 🔍 Endpoint: Listar Elementos de Galería

### **GET /api/media/**

Obtiene todos los elementos activos de la galería.

#### **Request:**
```http
GET /api/media/ HTTP/1.1
Host: localhost:8000
```

#### **Response (200 OK):**
```json
{
  "success": true,
  "total": 5,
  "items": [
    {
      "id": 1,
      "type": "video",
      "title": "Phrasal Verbs Más Comunes",
      "description": "Colección visual de los phrasal verbs más utilizados en inglés cotidiano con ejemplos contextualizados.",
      "url": "https://www.youtube.com/watch?v=abc123",
      "file": null,
      "thumbnail": "https://img.youtube.com/vi/abc123/maxresdefault.jpg",
      "author": "Admin",
      "category": "Infografías",
      "created_at": "2025-09-08T10:30:00Z",
      "updated_at": "2025-09-08T10:30:00Z",
      "is_active": true
    },
    {
      "id": 2,
      "type": "image",
      "title": "Título del Elemento",
      "description": "Descripción del contenido",
      "url": null,
      "file": "http://localhost:8000/media/gallery/imagen.jpg",
      "thumbnail": null,
      "author": "Admin",
      "category": "Fotos",
      "created_at": "2025-10-27T15:00:00Z",
      "updated_at": "2025-10-27T15:00:00Z",
      "is_active": true
    }
  ]
}
```

---

## ➕ Endpoint: Crear Elemento

### **POST /api/media/**

Crea un nuevo elemento en la galería.

#### **Autenticación:**
- ✅ Requerida
- 📝 Header: `Authorization: Bearer {token}`

#### **Request Body:**
```json
{
  "type": "video",
  "title": "Nuevo Video Educativo",
  "description": "Descripción del video",
  "url": "https://www.youtube.com/watch?v=xyz789",
  "thumbnail": "https://img.youtube.com/vi/xyz789/maxresdefault.jpg",
  "author": "Admin",
  "category": "Videos"
}
```

#### **Campos:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| `type` | string | ✅ | "video" o "image" |
| `title` | string | ✅ | Título del elemento |
| `description` | string | ✅ | Descripción |
| `url` | string | ⚠️ | URL (requerido si no hay file) |
| `file` | file | ⚠️ | Archivo (requerido si no hay url) |
| `thumbnail` | string | ❌ | URL del thumbnail |
| `author` | string | ✅ | Autor del contenido |
| `category` | string | ✅ | "Videos", "Infografías", o "Fotos" |

**Nota:** Debes proporcionar `url` O `file`, al menos uno es obligatorio.

#### **Response (201 Created):**
```json
{
  "id": 3,
  "type": "video",
  "title": "Nuevo Video Educativo",
  "description": "Descripción del video",
  "url": "https://www.youtube.com/watch?v=xyz789",
  "file": null,
  "thumbnail": "https://img.youtube.com/vi/xyz789/maxresdefault.jpg",
  "author": "Admin",
  "category": "Videos",
  "created_at": "2025-10-28T10:17:00Z",
  "updated_at": "2025-10-28T10:17:00Z",
  "is_active": true
}
```

---

## 🗑️ Endpoint: Eliminar Elemento

### **DELETE /api/media/{id}/**

Elimina (desactiva) un elemento de la galería.

#### **Request:**
```http
DELETE /api/media/3/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
```

#### **Response (204 No Content):**
Sin contenido. El elemento se marca como `is_active: false`.

---

## 📦 Modelos de Datos para Android

### **MediaItem.kt**

```kotlin
package com.example.lalengua.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class MediaItem(
    val id: Int,
    val type: String,  // "video" o "image"
    val title: String,
    val description: String,
    val url: String? = null,
    val file: String? = null,
    val thumbnail: String? = null,
    val author: String,
    val category: String,  // "Videos", "Infografías", "Fotos"
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String,
    @SerialName("is_active")
    val isActive: Boolean = true
) {
    // Obtener la URL del contenido (prioriza file sobre url)
    fun getContentUrl(): String? {
        return file ?: url
    }
    
    // Obtener thumbnail o generar uno para YouTube
    fun getThumbnailUrl(): String? {
        if (thumbnail != null) return thumbnail
        
        // Si es un video de YouTube, generar thumbnail
        if (url != null && url.contains("youtube.com")) {
            val videoId = extractYouTubeId(url)
            if (videoId != null) {
                return "https://img.youtube.com/vi/$videoId/maxresdefault.jpg"
            }
        }
        
        return null
    }
    
    private fun extractYouTubeId(url: String): String? {
        val regex = """(?:youtube\.com/watch\?v=|youtu\.be/)([^&\s]+)""".toRegex()
        return regex.find(url)?.groupValues?.get(1)
    }
}

@Serializable
data class GalleryResponse(
    val success: Boolean,
    val total: Int,
    val items: List<MediaItem>
)

@Serializable
data class CreateMediaRequest(
    val type: String,
    val title: String,
    val description: String,
    val url: String? = null,
    val thumbnail: String? = null,
    val author: String,
    val category: String
)
```

---

## 🔧 Implementación en Android

### **1. ApiService.kt**

```kotlin
interface ApiService {
    
    /**
     * Obtener lista de elementos de galería
     */
    @GET("media/")
    suspend fun getGalleryItems(): Response<GalleryResponse>
    
    /**
     * Crear nuevo elemento en galería
     */
    @POST("media/")
    suspend fun createMediaItem(
        @Header("Authorization") token: String,
        @Body request: CreateMediaRequest
    ): Response<MediaItem>
    
    /**
     * Eliminar elemento de galería
     */
    @DELETE("media/{id}/")
    suspend fun deleteMediaItem(
        @Header("Authorization") token: String,
        @Path("id") itemId: Int
    ): Response<Unit>
    
    // ... otros métodos
}
```

---

### **2. GalleryRepository.kt**

```kotlin
package com.example.lalengua.data.repository

import com.example.lalengua.data.model.*
import com.example.lalengua.data.network.ApiService
import com.example.lalengua.util.Result
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class GalleryRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    
    /**
     * Obtener lista de elementos de galería
     */
    suspend fun getGalleryItems(): Result<List<MediaItem>> = withContext(Dispatchers.IO) {
        try {
            val response = apiService.getGalleryItems()
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success) {
                    Result.Success(body.items)
                } else {
                    Result.Error("Error al obtener galería")
                }
            } else {
                Result.Error("Error: ${response.code()}")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
    
    /**
     * Crear nuevo elemento en galería
     */
    suspend fun createMediaItem(request: CreateMediaRequest): Result<MediaItem> = withContext(Dispatchers.IO) {
        try {
            val token = sessionManager.getToken() ?: return@withContext Result.Error("No hay sesión")
            val response = apiService.createMediaItem("Bearer $token", request)
            
            if (response.isSuccessful && response.body() != null) {
                Result.Success(response.body()!!)
            } else {
                Result.Error("Error al crear elemento: ${response.code()}")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
    
    /**
     * Eliminar elemento de galería
     */
    suspend fun deleteMediaItem(itemId: Int): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            val token = sessionManager.getToken() ?: return@withContext Result.Error("No hay sesión")
            val response = apiService.deleteMediaItem("Bearer $token", itemId)
            
            if (response.isSuccessful) {
                Result.Success(Unit)
            } else {
                Result.Error("Error al eliminar: ${response.code()}")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
    
    /**
     * Obtener estadísticas de la galería
     */
    suspend fun getGalleryStats(): Result<GalleryStats> = withContext(Dispatchers.IO) {
        try {
            val result = getGalleryItems()
            
            if (result is Result.Success) {
                val items = result.data
                val stats = GalleryStats(
                    totalImages = items.count { it.type == "image" },
                    totalVideos = items.count { it.type == "video" },
                    total = items.size
                )
                Result.Success(stats)
            } else {
                Result.Error("Error al obtener estadísticas")
            }
        } catch (e: Exception) {
            Result.Error("Error: ${e.localizedMessage}")
        }
    }
}

data class GalleryStats(
    val totalImages: Int,
    val totalVideos: Int,
    val total: Int
)
```

---

### **3. GalleryViewModel.kt**

```kotlin
package com.example.lalengua.ui.gallery

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.lalengua.data.model.*
import com.example.lalengua.data.repository.GalleryRepository
import com.example.lalengua.util.Result
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

class GalleryViewModel(
    private val galleryRepository: GalleryRepository
) : ViewModel() {
    
    // Estado de la lista de elementos
    private val _galleryState = MutableStateFlow<Result<List<MediaItem>>>(Result.Loading())
    val galleryState: StateFlow<Result<List<MediaItem>>> = _galleryState.asStateFlow()
    
    // Estado de estadísticas
    private val _statsState = MutableStateFlow<Result<GalleryStats>?>(null)
    val statsState: StateFlow<Result<GalleryStats>?> = _statsState.asStateFlow()
    
    // Estado de creación
    private val _createState = MutableStateFlow<Result<MediaItem>?>(null)
    val createState: StateFlow<Result<MediaItem>?> = _createState.asStateFlow()
    
    /**
     * Cargar elementos de galería
     */
    fun loadGallery() {
        viewModelScope.launch {
            _galleryState.value = Result.Loading()
            _galleryState.value = galleryRepository.getGalleryItems()
            
            // Cargar estadísticas también
            _statsState.value = galleryRepository.getGalleryStats()
        }
    }
    
    /**
     * Crear nuevo elemento
     */
    fun createMediaItem(
        type: String,
        title: String,
        description: String,
        url: String?,
        thumbnail: String?,
        author: String,
        category: String
    ) {
        viewModelScope.launch {
            _createState.value = Result.Loading()
            
            val request = CreateMediaRequest(
                type = type,
                title = title,
                description = description,
                url = url,
                thumbnail = thumbnail,
                author = author,
                category = category
            )
            
            _createState.value = galleryRepository.createMediaItem(request)
            
            // Si fue exitoso, recargar galería
            if (_createState.value is Result.Success) {
                loadGallery()
            }
        }
    }
    
    /**
     * Eliminar elemento
     */
    fun deleteMediaItem(itemId: Int) {
        viewModelScope.launch {
            val result = galleryRepository.deleteMediaItem(itemId)
            
            // Si fue exitoso, recargar galería
            if (result is Result.Success) {
                loadGallery()
            }
        }
    }
    
    /**
     * Filtrar por categoría
     */
    fun filterByCategory(category: String): List<MediaItem> {
        val currentState = _galleryState.value
        if (currentState is Result.Success) {
            return currentState.data.filter { it.category == category }
        }
        return emptyList()
    }
    
    /**
     * Resetear estado de creación
     */
    fun resetCreateState() {
        _createState.value = null
    }
}
```

---

### **4. GalleryScreen.kt (Vista Principal)**

```kotlin
@Composable
fun GalleryScreen(
    viewModel: GalleryViewModel = viewModel(),
    onAddClick: () -> Unit
) {
    val galleryState by viewModel.galleryState.collectAsState()
    val statsState by viewModel.statsState.collectAsState()
    
    LaunchedEffect(Unit) {
        viewModel.loadGallery()
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Gestión de galería") },
                navigationIcon = {
                    IconButton(onClick = { /* navegar atrás */ }) {
                        Icon(Icons.Default.Menu, contentDescription = "Menu")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = onAddClick,
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Agregar")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Estadísticas
            statsState?.let { state ->
                when (state) {
                    is Result.Success -> {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceEvenly
                        ) {
                            StatsCard(
                                count = state.data.totalImages,
                                label = "Imágenes",
                                color = Color(0xFFB2EBF2)
                            )
                            StatsCard(
                                count = state.data.totalVideos,
                                label = "Videos",
                                color = Color(0xFFE1BEE7)
                            )
                            StatsCard(
                                count = state.data.total,
                                label = "Total",
                                color = Color(0xFFC8E6C9)
                            )
                        }
                    }
                    else -> {}
                }
            }
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Lista de elementos
            when (val state = galleryState) {
                is Result.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                is Result.Success -> {
                    LazyColumn(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(state.data) { item ->
                            MediaItemCard(
                                item = item,
                                onDelete = { viewModel.deleteMediaItem(item.id) }
                            )
                        }
                    }
                }
                is Result.Error -> {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
fun StatsCard(count: Int, label: String, color: Color) {
    Card(
        modifier = Modifier.size(100.dp),
        colors = CardDefaults.cardColors(containerColor = color)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(8.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = count.toString(),
                style = MaterialTheme.typography.headlineMedium,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = label,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
fun MediaItemCard(
    item: MediaItem,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Thumbnail o placeholder
            AsyncImage(
                model = item.getThumbnailUrl(),
                contentDescription = item.title,
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop,
                error = painterResource(R.drawable.placeholder_image)
            )
            
            Spacer(modifier = Modifier.width(12.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = item.title,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = item.description,
                    style = MaterialTheme.typography.bodySmall,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = "Por ${item.author}",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                
                // Badge de categoría
                Chip(
                    label = { Text(item.category) },
                    colors = ChipDefaults.chipColors(
                        containerColor = when (item.category) {
                            "Videos" -> Color(0xFFE1BEE7)
                            "Infografías" -> Color(0xFFC8E6C9)
                            "Fotos" -> Color(0xFFB2EBF2)
                            else -> Color.Gray
                        }
                    )
                )
            }
            
            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Eliminar",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
}
```

---

### **5. AddMediaScreen.kt (Formulario)**

```kotlin
@Composable
fun AddMediaScreen(
    viewModel: GalleryViewModel = viewModel(),
    onSuccess: () -> Unit,
    onCancel: () -> Unit
) {
    var type by remember { mutableStateOf("video") }
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Videos") }
    var url by remember { mutableStateOf("") }
    var thumbnail by remember { mutableStateOf("") }
    var author by remember { mutableStateOf("Admin") }
    
    val createState by viewModel.createState.collectAsState()
    
    LaunchedEffect(createState) {
        if (createState is Result.Success) {
            onSuccess()
            viewModel.resetCreateState()
        }
    }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Agregar a Galería") },
                navigationIcon = {
                    IconButton(onClick = onCancel) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = "Agregar Contenido a la Galería",
                style = MaterialTheme.typography.headlineSmall
            )
            
            // Tipo de contenido
            ExposedDropdownMenuBox(...) {
                // Dropdown con opciones: Video, Imagen
            }
            
            // Título
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Título *") },
                modifier = Modifier.fillMaxWidth()
            )
            
            // Descripción
            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Descripción") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )
            
            // Categoría
            ExposedDropdownMenuBox(...) {
                // Dropdown con opciones: Videos, Infografías, Fotos
            }
            
            // URL
            OutlinedTextField(
                value = url,
                onValueChange = { url = it },
                label = { Text("URL del contenido") },
                modifier = Modifier.fillMaxWidth()
            )
            
            // Thumbnail (opcional)
            OutlinedTextField(
                value = thumbnail,
                onValueChange = { thumbnail = it },
                label = { Text("URL del thumbnail (opcional)") },
                modifier = Modifier.fillMaxWidth()
            )
            
            // Mostrar error si existe
            if (createState is Result.Error) {
                Text(
                    text = (createState as Result.Error).message,
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            // Botones
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedButton(
                    onClick = onCancel,
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Cancelar")
                }
                
                Button(
                    onClick = {
                        viewModel.createMediaItem(
                            type = type,
                            title = title,
                            description = description,
                            url = url.ifBlank { null },
                            thumbnail = thumbnail.ifBlank { null },
                            author = author,
                            category = category
                        )
                    },
                    modifier = Modifier.weight(1f),
                    enabled = createState !is Result.Loading &&
                            title.isNotBlank() &&
                            url.isNotBlank()
                ) {
                    if (createState is Result.Loading) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(20.dp),
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                    } else {
                        Text("AGREGAR")
                    }
                }
            }
        }
    }
}
```

---

## 🧪 Probar con cURL

```bash
# Listar elementos
curl -X GET http://localhost:8000/api/media/

# Crear elemento (necesitas token)
curl -X POST http://localhost:8000/api/media/ \
  -H "Authorization: Bearer TU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "video",
    "title": "Nuevo Video",
    "description": "Descripción",
    "url": "https://www.youtube.com/watch?v=abc123",
    "author": "Admin",
    "category": "Videos"
  }'
```

---

## ✅ Checklist de Implementación

- [ ] Crear modelos: `MediaItem`, `GalleryResponse`, `CreateMediaRequest`
- [ ] Agregar métodos en `ApiService`
- [ ] Crear `GalleryRepository`
- [ ] Crear `GalleryViewModel`
- [ ] Implementar `GalleryScreen` (lista)
- [ ] Implementar `AddMediaScreen` (formulario)
- [ ] Agregar navegación entre pantallas
- [ ] Probar flujo completo

---

**¡El backend ya está listo! Solo necesitas implementar el código Android.** 🎉
