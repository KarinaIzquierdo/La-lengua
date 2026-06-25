# 🔧 Solución: Error de Serialización en Galería

## 🚨 Error

```
Error al cargar la galería: Error de conexión al obtener la galería: 
Unexpected JSON token at offset 0: Expected start of the object '{', 
but had '[' instead at path: $
JSON input: [{"id":7,"type":"image","title".....
```

---

## 🔍 Causa del Problema

Android está llamando al endpoint **`/api/media/`** que devuelve un **array directo**:

```json
[
  {
    "id": 1,
    "type": "video",
    "title": "..."
  }
]
```

Pero el modelo `GalleryResponse` espera un **objeto** con esta estructura:

```json
{
  "success": true,
  "total": 5,
  "items": [...]
}
```

---

## ✅ Solución

### Opción 1: Usar el Endpoint Correcto (RECOMENDADO)

Cambiar de `/api/media/` a `/api/gallery/` en Android.

#### **En ApiService.kt:**

```kotlin
interface ApiService {
    
    // ❌ INCORRECTO - Devuelve array directo
    // @GET("media/")
    
    // ✅ CORRECTO - Devuelve objeto con success, total, items
    @GET("gallery/")
    suspend fun getGalleryItems(): Response<GalleryResponse>
    
    // Para crear, seguir usando media/
    @POST("media/")
    suspend fun createMediaItem(
        @Header("Authorization") token: String,
        @Body request: CreateMediaRequest
    ): Response<MediaItem>
    
    // Para eliminar, seguir usando media/
    @DELETE("media/{id}/")
    suspend fun deleteMediaItem(
        @Header("Authorization") token: String,
        @Path("id") itemId: Int
    ): Response<Unit>
}
```

---

### Opción 2: Cambiar el Modelo (NO RECOMENDADO)

Si por alguna razón no puedes cambiar el endpoint, puedes hacer que el modelo acepte un array directo:

```kotlin
// En ApiService.kt
@GET("media/")
suspend fun getGalleryItems(): Response<List<MediaItem>>

// En GalleryRepository.kt
suspend fun getGalleryItems(): Result<List<MediaItem>> = withContext(Dispatchers.IO) {
    try {
        val response = apiService.getGalleryItems()
        
        if (response.isSuccessful && response.body() != null) {
            Result.Success(response.body()!!)
        } else {
            Result.Error("Error: ${response.code()}")
        }
    } catch (e: Exception) {
        Result.Error("Error de conexión: ${e.localizedMessage}")
    }
}
```

**Pero esto significa que no tendrás el campo `success` ni `total`.**

---

## 📊 Comparación de Endpoints

### `/api/media/` (ViewSet - Array directo)

**Request:**
```http
GET /api/media/ HTTP/1.1
```

**Response:**
```json
[
  {
    "id": 1,
    "type": "video",
    "title": "Clase de Pronunciación",
    "description": "...",
    "url": "https://www.youtube.com/embed/...",
    "thumbnail": "...",
    "author": "Prof. María González",
    "category": "Videos",
    "created_at": "2025-09-08T15:55:17.775943Z",
    "is_active": true
  }
]
```

---

### `/api/gallery/` (Vista personalizada - Objeto con metadata)

**Request:**
```http
GET /api/gallery/ HTTP/1.1
```

**Response:**
```json
{
  "success": true,
  "total": 5,
  "items": [
    {
      "id": 1,
      "type": "video",
      "title": "Clase de Pronunciación",
      "description": "...",
      "url": "https://www.youtube.com/embed/...",
      "thumbnail": "...",
      "author": "Prof. María González",
      "category": "Videos",
      "created_at": "2025-09-08T15:55:17.775943Z",
      "is_active": true
    }
  ]
}
```

---

## 🧪 Probar los Endpoints

### Endpoint `/api/media/` (array directo):
```bash
curl -X GET http://localhost:8000/api/media/
```

### Endpoint `/api/gallery/` (objeto con metadata):
```bash
curl -X GET http://localhost:8000/api/gallery/
```

---

## ✅ Resumen de Cambios

### En Android - ApiService.kt:

```kotlin
interface ApiService {
    
    // Listar elementos - USAR /gallery/
    @GET("gallery/")
    suspend fun getGalleryItems(): Response<GalleryResponse>
    
    // Crear elemento - USAR /media/
    @POST("media/")
    suspend fun createMediaItem(
        @Header("Authorization") token: String,
        @Body request: CreateMediaRequest
    ): Response<MediaItem>
    
    // Eliminar elemento - USAR /media/{id}/
    @DELETE("media/{id}/")
    suspend fun deleteMediaItem(
        @Header("Authorization") token: String,
        @Path("id") itemId: Int
    ): Response<Unit>
}
```

### ¿Por qué usar diferentes endpoints?

- **`/api/gallery/`** (GET) - Devuelve formato optimizado con `success`, `total`, `items`
- **`/api/media/`** (POST/DELETE) - Endpoints del ViewSet para crear/eliminar

---

## 📝 Checklist

- [ ] Cambiar `@GET("media/")` a `@GET("gallery/")` en `ApiService`
- [ ] Verificar que `GalleryResponse` tenga los campos: `success`, `total`, `items`
- [ ] Recompilar la app
- [ ] Probar que la galería cargue correctamente

---

**Con este cambio, el error de serialización se solucionará.** ✅
