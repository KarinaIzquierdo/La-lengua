# 🔧 Solución: Imágenes y Subida de Archivos en Galería

## 🚨 Problemas

1. **Error 400 al subir archivo**: `Bad Request: /api/media/`
2. **No se muestran las imágenes**: Solo aparece placeholder verde

---

## 🔍 Problema 1: Error 400 al Subir Archivo

### Causa Probable

El backend está rechazando la petición porque:
- ❌ Falta algún campo requerido
- ❌ El formato de los datos no es correcto
- ❌ El archivo no se está enviando correctamente

### Solución: Ver los Logs

He agregado logs en el backend. Ahora cuando intentes subir un archivo, verás en la consola:

```
==================================================
📸 CREAR ELEMENTO MULTIMEDIA
Data recibida: {...}
Files: {...}
==================================================
❌ ERRORES DE VALIDACIÓN:
{'field': ['error message']}
==================================================
```

### Campos Requeridos

El backend requiere:
- ✅ `type` - "video" o "image"
- ✅ `title` - Título (no puede estar vacío)
- ✅ `description` - Descripción
- ✅ `author` - Autor
- ✅ `category` - "Videos", "Infografías", o "Fotos"
- ⚠️ `url` O `file` - Al menos uno es obligatorio

### Verificar en Android

```kotlin
// En AddMediaScreen o CreateMediaViewModel
fun createMediaItem(...) {
    Log.d("GALLERY", "📤 Enviando datos:")
    Log.d("GALLERY", "  type: $type")
    Log.d("GALLERY", "  title: $title")
    Log.d("GALLERY", "  description: $description")
    Log.d("GALLERY", "  url: $url")
    Log.d("GALLERY", "  author: $author")
    Log.d("GALLERY", "  category: $category")
    
    val request = CreateMediaRequest(
        type = type,
        title = title,
        description = description,
        url = url,
        author = author,
        category = category
    )
    
    // Hacer la petición...
}
```

---

## 🖼️ Problema 2: No Se Muestran las Imágenes

### Causa

Las imágenes tienen URLs válidas pero no se están cargando en la UI.

### Verificar URLs

Revisa qué URLs están llegando:

```kotlin
// En MediaItemCard
@Composable
fun MediaItemCard(item: MediaItem) {
    val imageUrl = item.getThumbnailUrl() ?: item.getContentUrl()
    
    Log.d("GALLERY", "🖼️ Cargando imagen: $imageUrl")
    
    AsyncImage(
        model = imageUrl,
        contentDescription = item.title,
        modifier = Modifier.size(80.dp),
        error = painterResource(R.drawable.placeholder_image),
        placeholder = painterResource(R.drawable.placeholder_loading)
    )
}
```

### Solución 1: Usar Coil para Cargar Imágenes

Asegúrate de tener Coil configurado:

#### **build.gradle.kts (Module: app)**

```kotlin
dependencies {
    // Coil para cargar imágenes
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // ... otras dependencias
}
```

#### **En el Composable:**

```kotlin
import coil.compose.AsyncImage
import coil.request.ImageRequest
import androidx.compose.ui.platform.LocalContext

@Composable
fun MediaItemCard(item: MediaItem) {
    val context = LocalContext.current
    val imageUrl = item.getThumbnailUrl() ?: item.getContentUrl()
    
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Imagen con Coil
            AsyncImage(
                model = ImageRequest.Builder(context)
                    .data(imageUrl)
                    .crossfade(true)
                    .build(),
                contentDescription = item.title,
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop,
                error = painterResource(R.drawable.ic_placeholder_image),
                placeholder = painterResource(R.drawable.ic_loading)
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
            }
        }
    }
}
```

---

### Solución 2: Verificar Permisos de Internet

#### **AndroidManifest.xml**

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Permisos de Internet -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    
    <application
        android:usesCleartextTraffic="true"
        ...>
        ...
    </application>
</manifest>
```

**Nota:** `usesCleartextTraffic="true"` es necesario para cargar imágenes desde `http://` (localhost).

---

### Solución 3: Verificar las URLs en el Modelo

Asegúrate de que el modelo `MediaItem` tenga los métodos correctos:

```kotlin
@Serializable
data class MediaItem(
    val id: Int,
    val type: String,
    val title: String,
    val description: String,
    val url: String? = null,
    val file: String? = null,
    val thumbnail: String? = null,
    val author: String,
    val category: String,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String,
    @SerialName("is_active")
    val isActive: Boolean = true
) {
    /**
     * Obtener URL del contenido (prioriza file sobre url)
     */
    fun getContentUrl(): String? {
        return file ?: url
    }
    
    /**
     * Obtener URL del thumbnail
     */
    fun getThumbnailUrl(): String? {
        // Si hay thumbnail explícito, usarlo
        if (!thumbnail.isNullOrBlank()) return thumbnail
        
        // Si es una imagen, usar la URL del contenido
        if (type == "image") {
            return getContentUrl()
        }
        
        // Si es un video de YouTube, generar thumbnail
        if (type == "video" && url != null && url.contains("youtube")) {
            val videoId = extractYouTubeId(url)
            if (videoId != null) {
                return "https://img.youtube.com/vi/$videoId/maxresdefault.jpg"
            }
        }
        
        return null
    }
    
    private fun extractYouTubeId(url: String): String? {
        val patterns = listOf(
            """(?:youtube\.com/watch\?v=|youtu\.be/)([^&\s]+)""".toRegex(),
            """youtube\.com/embed/([^&\s]+)""".toRegex()
        )
        
        for (pattern in patterns) {
            val match = pattern.find(url)
            if (match != null) {
                return match.groupValues[1]
            }
        }
        
        return null
    }
}
```

---

## 🧪 Debugging Paso a Paso

### Paso 1: Ver qué URLs llegan del backend

```kotlin
LaunchedEffect(Unit) {
    viewModel.loadGallery()
}

LaunchedEffect(galleryState) {
    if (galleryState is Result.Success) {
        Log.d("GALLERY", "✅ ${galleryState.data.size} elementos cargados")
        galleryState.data.forEach { item ->
            Log.d("GALLERY", "  📦 ${item.title}")
            Log.d("GALLERY", "     URL: ${item.url}")
            Log.d("GALLERY", "     File: ${item.file}")
            Log.d("GALLERY", "     Thumbnail: ${item.thumbnail}")
            Log.d("GALLERY", "     Content URL: ${item.getContentUrl()}")
            Log.d("GALLERY", "     Thumbnail URL: ${item.getThumbnailUrl()}")
        }
    }
}
```

### Paso 2: Ver si Coil está intentando cargar

```kotlin
AsyncImage(
    model = ImageRequest.Builder(context)
        .data(imageUrl)
        .crossfade(true)
        .listener(
            onStart = { Log.d("GALLERY", "🔄 Cargando: $imageUrl") },
            onSuccess = { _, _ -> Log.d("GALLERY", "✅ Cargada: $imageUrl") },
            onError = { _, result -> Log.e("GALLERY", "❌ Error: ${result.throwable.message}") }
        )
        .build(),
    contentDescription = item.title,
    ...
)
```

### Paso 3: Probar una URL directamente

```kotlin
// Probar con una URL conocida que funcione
AsyncImage(
    model = "https://picsum.photos/200",
    contentDescription = "Test",
    modifier = Modifier.size(80.dp)
)
```

Si esta imagen se carga, el problema es con las URLs del backend.

---

## 🔧 Solución para Subir Archivos

### Problema: Android no soporta subir archivos aún

Tu formulario dice: **"La subida de archivos se implementará más adelante"**

Por ahora, solo puedes usar **URLs**:

```kotlin
@Composable
fun AddMediaScreen(...) {
    var useUrl by remember { mutableStateOf(true) }
    var url by remember { mutableStateOf("") }
    
    // Radio buttons
    Row {
        RadioButton(
            selected = useUrl,
            onClick = { useUrl = true }
        )
        Text("Usar URL")
        
        RadioButton(
            selected = !useUrl,
            onClick = { useUrl = false }
        )
        Text("Subir archivo")
    }
    
    if (useUrl) {
        OutlinedTextField(
            value = url,
            onValueChange = { url = it },
            label = { Text("URL del contenido") },
            modifier = Modifier.fillMaxWidth()
        )
    } else {
        Text(
            text = "La subida de archivos se implementará más adelante.",
            style = MaterialTheme.typography.bodySmall,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
```

### Para implementar subida de archivos:

Necesitarás usar **Multipart** en Retrofit:

```kotlin
// En ApiService
@Multipart
@POST("media/")
suspend fun uploadMediaFile(
    @Header("Authorization") token: String,
    @Part("type") type: RequestBody,
    @Part("title") title: RequestBody,
    @Part("description") description: RequestBody,
    @Part("author") author: RequestBody,
    @Part("category") category: RequestBody,
    @Part file: MultipartBody.Part
): Response<MediaItem>
```

Pero esto es más complejo y requiere permisos de almacenamiento.

---

## 📋 Checklist

### Para el Error 400:
- [ ] Agregar logs en Android para ver qué datos se envían
- [ ] Verificar que todos los campos requeridos estén presentes
- [ ] Ver los logs del backend para identificar el error exacto
- [ ] Asegurarse de que `url` no esté vacío si no se sube archivo

### Para las Imágenes:
- [ ] Verificar que Coil esté en las dependencias
- [ ] Agregar permisos de Internet en AndroidManifest
- [ ] Agregar `usesCleartextTraffic="true"` para localhost
- [ ] Verificar que `getThumbnailUrl()` devuelva URLs válidas
- [ ] Agregar logs para ver qué URLs se están cargando
- [ ] Probar con una URL de prueba conocida

---

## 🎯 Próximos Pasos

1. **Intenta subir un elemento con URL** (no archivo) y copia los logs del backend
2. **Verifica que las imágenes tengan URLs válidas** con los logs de Android
3. **Comparte los logs** para que pueda ayudarte con el problema específico

---

**Con los logs podré decirte exactamente qué está fallando.** 🔍
