# 📸 API de Galería para Android - The Language

## 🎯 Objetivo

Permitir que la app Android suba contenido multimedia (fotos, videos) a la galería del backend, y que este contenido se muestre automáticamente en el blog de la web.

---

## 📊 Modelo de Datos

### **MediaItem (Galería)**

```kotlin
@Serializable
data class MediaItem(
    val id: Int,
    val type: String,              // "video" o "image"
    val title: String,
    val description: String,
    val url: String? = null,       // URL externa (YouTube, etc.)
    @SerialName("file_url")
    val fileUrl: String? = null,   // URL del archivo subido
    val thumbnail: String? = null,
    val author: String,
    val category: String,          // "Videos", "Infografías", "Fotos"
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("is_active")
    val isActive: Boolean = true
)

@Serializable
data class GalleryResponse(
    val success: Boolean,
    val total: Int = 0,
    val items: List<MediaItem> = emptyList(),
    val message: String? = null
)
```

---

## 🔌 Endpoints Disponibles

### **1. Listar elementos de galería**

```kotlin
@GET("gallery/")
suspend fun getGalleryItems(): GalleryResponse
```

**Respuesta:**
```json
{
  "success": true,
  "total": 3,
  "items": [
    {
      "id": 1,
      "type": "image",
      "title": "Clase de conversación",
      "description": "Estudiantes practicando inglés",
      "url": null,
      "file_url": "http://10.0.2.2:8000/media/gallery/photo.jpg",
      "thumbnail": null,
      "author": "Profesor Juan",
      "category": "Fotos",
      "created_at": "2025-10-22T10:00:00Z",
      "is_active": true
    }
  ]
}
```

---

### **2. Subir nuevo elemento (Foto o Video)**

```kotlin
@Multipart
@POST("gallery/create/")
suspend fun uploadGalleryItem(
    @Header("Authorization") token: String,
    @Part("type") type: RequestBody,
    @Part("title") title: RequestBody,
    @Part("description") description: RequestBody,
    @Part("author") author: RequestBody,
    @Part("category") category: RequestBody,
    @Part file: MultipartBody.Part?
): GalleryResponse
```

**Parámetros:**

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| type | String | ✅ | "image" o "video" |
| title | String | ✅ | Título del elemento |
| description | String | ✅ | Descripción |
| author | String | ✅ | Nombre del autor |
| category | String | ✅ | "Videos", "Infografías" o "Fotos" |
| file | File | ✅ | Archivo de imagen o video |

**Ejemplo de uso:**

```kotlin
suspend fun uploadImage(
    imageUri: Uri,
    title: String,
    description: String,
    author: String,
    category: String
): Result<MediaItem> {
    return try {
        val token = sessionManager.getToken()
        if (token.isNullOrEmpty()) {
            return Result.Error("No hay token de autenticación")
        }

        // Preparar el archivo
        val file = File(imageUri.path!!)
        val requestFile = file.asRequestBody("image/*".toMediaType())
        val filePart = MultipartBody.Part.createFormData("file", file.name, requestFile)

        // Preparar otros campos
        val typeBody = "image".toRequestBody("text/plain".toMediaType())
        val titleBody = title.toRequestBody("text/plain".toMediaType())
        val descBody = description.toRequestBody("text/plain".toMediaType())
        val authorBody = author.toRequestBody("text/plain".toMediaType())
        val categoryBody = category.toRequestBody("text/plain".toMediaType())

        // Hacer la petición
        val response = apiService.uploadGalleryItem(
            token = "Bearer $token",
            type = typeBody,
            title = titleBody,
            description = descBody,
            author = authorBody,
            category = categoryBody,
            file = filePart
        )

        if (response.success && response.items.isNotEmpty()) {
            Result.Success(response.items.first())
        } else {
            Result.Error(response.message ?: "Error al subir imagen")
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error de conexión")
    }
}
```

---

## 📱 Implementación Completa en Android

### **1. ApiService.kt**

```kotlin
interface ApiService {
    // ... otros endpoints

    @GET("gallery/")
    suspend fun getGalleryItems(): GalleryResponse

    @Multipart
    @POST("gallery/create/")
    suspend fun uploadGalleryItem(
        @Header("Authorization") token: String,
        @Part("type") type: RequestBody,
        @Part("title") title: RequestBody,
        @Part("description") description: RequestBody,
        @Part("author") author: RequestBody,
        @Part("category") category: RequestBody,
        @Part file: MultipartBody.Part?
    ): GalleryResponse
}
```

---

### **2. GalleryRepository.kt**

```kotlin
package com.example.lengua.data.repository

import android.net.Uri
import android.util.Log
import com.example.lengua.network.ApiService
import com.example.lengua.network.MediaItem
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.asRequestBody
import okhttp3.RequestBody.Companion.toRequestBody
import java.io.File

class GalleryRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    
    /**
     * Obtener todos los elementos de la galería
     */
    suspend fun getGalleryItems(): Result<List<MediaItem>> {
        return try {
            Log.d("GalleryRepository", "🔍 Obteniendo elementos de galería...")
            
            val response = apiService.getGalleryItems()
            
            Log.d("GalleryRepository", "✅ Success: ${response.success}")
            Log.d("GalleryRepository", "📊 Total: ${response.total}")
            
            if (response.success) {
                Result.Success(response.items)
            } else {
                Result.Error(response.message ?: "Error al obtener galería")
            }
        } catch (e: Exception) {
            Log.e("GalleryRepository", "❌ Error: ${e.message}", e)
            Result.Error(e.message ?: "Error de conexión")
        }
    }
    
    /**
     * Subir una imagen a la galería
     */
    suspend fun uploadImage(
        file: File,
        title: String,
        description: String,
        author: String,
        category: String
    ): Result<MediaItem> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }

            Log.d("GalleryRepository", "📤 Subiendo imagen: $title")
            Log.d("GalleryRepository", "📁 Archivo: ${file.name} (${file.length()} bytes)")

            // Preparar el archivo
            val requestFile = file.asRequestBody("image/*".toMediaType())
            val filePart = MultipartBody.Part.createFormData("file", file.name, requestFile)

            // Preparar otros campos
            val typeBody = "image".toRequestBody("text/plain".toMediaType())
            val titleBody = title.toRequestBody("text/plain".toMediaType())
            val descBody = description.toRequestBody("text/plain".toMediaType())
            val authorBody = author.toRequestBody("text/plain".toMediaType())
            val categoryBody = category.toRequestBody("text/plain".toMediaType())

            // Hacer la petición
            val response = apiService.uploadGalleryItem(
                token = "Bearer $token",
                type = typeBody,
                title = titleBody,
                description = descBody,
                author = authorBody,
                category = categoryBody,
                file = filePart
            )

            Log.d("GalleryRepository", "✅ Respuesta recibida")
            Log.d("GalleryRepository", "Success: ${response.success}")

            if (response.success && response.items.isNotEmpty()) {
                Result.Success(response.items.first())
            } else {
                Result.Error(response.message ?: "Error al subir imagen")
            }
        } catch (e: Exception) {
            Log.e("GalleryRepository", "❌ Error: ${e.message}", e)
            Result.Error(e.message ?: "Error de conexión")
        }
    }
    
    /**
     * Subir un video a la galería
     */
    suspend fun uploadVideo(
        file: File,
        title: String,
        description: String,
        author: String,
        category: String
    ): Result<MediaItem> {
        return try {
            val token = sessionManager.getToken()
            if (token.isNullOrEmpty()) {
                return Result.Error("No hay token de autenticación")
            }

            Log.d("GalleryRepository", "📤 Subiendo video: $title")

            // Preparar el archivo
            val requestFile = file.asRequestBody("video/*".toMediaType())
            val filePart = MultipartBody.Part.createFormData("file", file.name, requestFile)

            // Preparar otros campos
            val typeBody = "video".toRequestBody("text/plain".toMediaType())
            val titleBody = title.toRequestBody("text/plain".toMediaType())
            val descBody = description.toRequestBody("text/plain".toMediaType())
            val authorBody = author.toRequestBody("text/plain".toMediaType())
            val categoryBody = category.toRequestBody("text/plain".toMediaType())

            // Hacer la petición
            val response = apiService.uploadGalleryItem(
                token = "Bearer $token",
                type = typeBody,
                title = titleBody,
                description = descBody,
                author = authorBody,
                category = categoryBody,
                file = filePart
            )

            if (response.success && response.items.isNotEmpty()) {
                Result.Success(response.items.first())
            } else {
                Result.Error(response.message ?: "Error al subir video")
            }
        } catch (e: Exception) {
            Log.e("GalleryRepository", "❌ Error: ${e.message}", e)
            Result.Error(e.message ?: "Error de conexión")
        }
    }
}
```

---

### **3. GalleryViewModel.kt**

```kotlin
package com.example.lengua.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.lengua.data.repository.GalleryRepository
import com.example.lengua.data.repository.Result
import com.example.lengua.network.MediaItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.io.File

data class GalleryState(
    val items: List<MediaItem> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val uploadSuccess: Boolean = false
)

class GalleryViewModel(
    private val repository: GalleryRepository
) : ViewModel() {

    private val _state = MutableStateFlow(GalleryState())
    val state: StateFlow<GalleryState> = _state

    fun loadGallery() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            
            when (val result = repository.getGalleryItems()) {
                is Result.Success -> {
                    _state.value = _state.value.copy(
                        items = result.data,
                        isLoading = false
                    )
                }
                is Result.Error -> {
                    _state.value = _state.value.copy(
                        error = result.message,
                        isLoading = false
                    )
                }
            }
        }
    }

    fun uploadImage(
        file: File,
        title: String,
        description: String,
        author: String,
        category: String
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, uploadSuccess = false)
            
            when (val result = repository.uploadImage(file, title, description, author, category)) {
                is Result.Success -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        uploadSuccess = true
                    )
                    // Recargar la galería
                    loadGallery()
                }
                is Result.Error -> {
                    _state.value = _state.value.copy(
                        error = result.message,
                        isLoading = false,
                        uploadSuccess = false
                    )
                }
            }
        }
    }

    fun uploadVideo(
        file: File,
        title: String,
        description: String,
        author: String,
        category: String
    ) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null, uploadSuccess = false)
            
            when (val result = repository.uploadVideo(file, title, description, author, category)) {
                is Result.Success -> {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        uploadSuccess = true
                    )
                    // Recargar la galería
                    loadGallery()
                }
                is Result.Error -> {
                    _state.value = _state.value.copy(
                        error = result.message,
                        isLoading = false,
                        uploadSuccess = false
                    )
                }
            }
        }
    }

    fun clearUploadSuccess() {
        _state.value = _state.value.copy(uploadSuccess = false)
    }
}
```

---

### **4. GalleryScreen.kt (UI)**

```kotlin
package com.example.lengua.screen

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import coil.compose.AsyncImage
import com.example.lengua.viewmodel.GalleryViewModel
import java.io.File

@Composable
fun GalleryScreen(
    viewModel: GalleryViewModel = viewModel()
) {
    val state by viewModel.state.collectAsState()
    
    var showUploadDialog by remember { mutableStateOf(false) }
    var selectedImageUri by remember { mutableStateOf<Uri?>(null) }
    
    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        selectedImageUri = uri
        if (uri != null) {
            showUploadDialog = true
        }
    }

    LaunchedEffect(Unit) {
        viewModel.loadGallery()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Galería") }
            )
        },
        floatingActionButton = {
            FloatingActionButton(
                onClick = { imagePickerLauncher.launch("image/*") }
            ) {
                Text("+")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (state.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.padding(16.dp)
                )
            }

            state.error?.let { error ->
                Text(
                    text = error,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(16.dp)
                )
            }

            LazyColumn {
                items(state.items) { item ->
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            if (item.fileUrl != null) {
                                AsyncImage(
                                    model = item.fileUrl,
                                    contentDescription = item.title,
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .height(200.dp)
                                )
                            }
                            
                            Spacer(modifier = Modifier.height(8.dp))
                            
                            Text(
                                text = item.title,
                                style = MaterialTheme.typography.titleMedium
                            )
                            
                            Text(
                                text = item.description,
                                style = MaterialTheme.typography.bodyMedium
                            )
                            
                            Text(
                                text = "Por: ${item.author}",
                                style = MaterialTheme.typography.bodySmall
                            )
                            
                            Text(
                                text = item.category,
                                style = MaterialTheme.typography.labelSmall
                            )
                        }
                    }
                }
            }
        }
    }

    if (showUploadDialog && selectedImageUri != null) {
        UploadDialog(
            imageUri = selectedImageUri!!,
            onDismiss = { showUploadDialog = false },
            onUpload = { title, description, author, category ->
                // Convertir Uri a File y subir
                // viewModel.uploadImage(file, title, description, author, category)
                showUploadDialog = false
            }
        )
    }
}

@Composable
fun UploadDialog(
    imageUri: Uri,
    onDismiss: () -> Unit,
    onUpload: (String, String, String, String) -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var author by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("Fotos") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Subir imagen") },
        text = {
            Column {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Título") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Descripción") },
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(8.dp))
                
                OutlinedTextField(
                    value = author,
                    onValueChange = { author = it },
                    label = { Text("Autor") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onUpload(title, description, author, category)
                }
            ) {
                Text("Subir")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}
```

---

## 🔐 Permisos necesarios

### **AndroidManifest.xml:**

```xml
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />
<uses-permission android:name="android.permission.READ_MEDIA_VIDEO" />
```

---

## 🧪 Pruebas

### **1. Listar galería:**

```bash
curl http://localhost:8000/api/gallery/
```

### **2. Subir imagen:**

```bash
curl -X POST http://localhost:8000/api/gallery/create/ \
  -H "Authorization: Bearer <TOKEN>" \
  -F "type=image" \
  -F "title=Mi foto" \
  -F "description=Descripción de la foto" \
  -F "author=Juan Pérez" \
  -F "category=Fotos" \
  -F "file=@/ruta/a/imagen.jpg"
```

---

## 📊 Flujo completo

1. **Usuario abre la app** → Ve la galería existente
2. **Click en botón "+"** → Selecciona una imagen
3. **Llena el formulario** → Título, descripción, autor
4. **Click en "Subir"** → Se envía al backend
5. **Backend guarda** → En `/media/gallery/`
6. **Web muestra automáticamente** → En el blog

---

## ✅ Checklist

- [ ] Agregar `GalleryResponse` y `MediaItem` en modelos
- [ ] Agregar endpoints en `ApiService.kt`
- [ ] Crear `GalleryRepository.kt`
- [ ] Crear `GalleryViewModel.kt`
- [ ] Crear `GalleryScreen.kt`
- [ ] Agregar permisos en `AndroidManifest.xml`
- [ ] Probar subida de imagen
- [ ] Verificar que aparece en el blog web

---

## 🆘 Troubleshooting

### **Error: "Permission denied"**
- Verificar permisos en AndroidManifest.xml
- Solicitar permisos en runtime (Android 13+)

### **Error: "File too large"**
- Verificar tamaño máximo en Django settings
- Comprimir imagen antes de subir

### **Error: "Unauthorized"**
- Verificar que el token sea válido
- Hacer login nuevamente si expiró
