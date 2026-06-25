# 📚 API de Bloques - Documentación para Android

## 🎯 Resumen

Sistema completo de gestión de bloques con sincronización en tiempo real entre web y Android.

---

## 🔗 Endpoints Disponibles

### 1. **GET** `/api/bloques/`
Obtener todos los bloques

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "total": 18,
  "bloques": [
    {
      "id": 1,
      "nombre": "Mañana",
      "nivel": "A1",
      "estado": "configurado",
      "grupo_color": "#4CAF50",
      "horario_inicio": "08:00:00",
      "horario_fin": "10:00:00",
      "cupo_maximo": 20,
      "activo": true,
      "estudiantes_count": 5,
      "created_at": "2025-10-17T13:35:00Z",
      "updated_at": "2025-10-17T13:35:00Z"
    }
  ]
}
```

---

### 2. **POST** `/api/bloques/create/`
Crear un nuevo bloque (solo admin)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body:**
```json
{
  "nombre": "Mañana",
  "nivel": "A1",
  "grupo_color": "#FFC107",
  "horario_inicio": "08:00:00",
  "horario_fin": "10:00:00",
  "cupo_maximo": 20,
  "estado": "configurado",
  "activo": true
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Bloque creado exitosamente",
  "bloque": {
    "id": 19,
    "nombre": "Mañana",
    "nivel": "A1",
    ...
  }
}
```

**Errores:**
- **403**: No tienes permisos (no eres admin)
- **400**: Ya existe un bloque con ese nombre y nivel

---

### 3. **GET** `/api/bloques/{id}/`
Obtener detalle de un bloque específico

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "bloque": {
    "id": 1,
    "nombre": "Mañana",
    "nivel": "A1",
    ...
  }
}
```

---

### 4. **PUT/PATCH** `/api/bloques/{id}/update/`
Actualizar un bloque existente (solo admin)

**Headers:**
```
Authorization: Bearer {token}
Content-Type: application/json
```

**Body (todos los campos son opcionales en PATCH):**
```json
{
  "nombre": "Tarde",
  "grupo_color": "#2196F3",
  "cupo_maximo": 25
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Bloque actualizado exitosamente",
  "bloque": {
    "id": 1,
    ...
  }
}
```

---

### 5. **DELETE** `/api/bloques/{id}/delete/`
Eliminar un bloque (solo admin)

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Bloque eliminado exitosamente"
}
```

**Error (400):**
```json
{
  "success": false,
  "message": "No se puede eliminar. Hay 5 estudiante(s) asignado(s) a este bloque."
}
```

---

### 6. **GET** `/api/bloques/{id}/estudiantes/`
Obtener estudiantes asignados a un bloque

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "bloque": "A1 - Mañana",
  "total": 5,
  "estudiantes": [
    {
      "id": 1,
      "nombre": "Juan Pérez",
      "email": "juan@thelanguage.co",
      "phone": "3001234567",
      "english_level": "beginner"
    }
  ]
}
```

---

### 7. **POST** `/api/bloques/{id}/toggle/`
Activar/desactivar un bloque (solo admin)

**Headers:**
```
Authorization: Bearer {token}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Bloque activado exitosamente",
  "bloque": {
    "id": 1,
    "activo": true,
    ...
  }
}
```

---

## 📱 Modelos de Datos para Android

### Modelo Bloque (Kotlin)
```kotlin
@Serializable
data class Bloque(
    val id: Int,
    val nombre: String,              // "Mañana", "Tarde", "Noche"
    val nivel: String,                // "A1", "A2", "B1", "B2", "C1", "C2"
    val estado: String,               // "configurado"
    @SerialName("grupo_color")
    val grupoColor: String,           // "#FFC107"
    @SerialName("horario_inicio")
    val horarioInicio: String?,       // "08:00:00"
    @SerialName("horario_fin")
    val horarioFin: String?,          // "10:00:00"
    @SerialName("cupo_maximo")
    val cupoMaximo: Int,              // 20
    val activo: Boolean,              // true/false
    @SerialName("estudiantes_count")
    val estudiantesCount: Int,        // 5
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("updated_at")
    val updatedAt: String
)

@Serializable
data class BloquesResponse(
    val success: Boolean,
    val total: Int,
    val bloques: List<Bloque>
)

@Serializable
data class BloqueDetailResponse(
    val success: Boolean,
    val bloque: Bloque
)

@Serializable
data class BloqueCreateRequest(
    val nombre: String,
    val nivel: String,
    @SerialName("grupo_color")
    val grupoColor: String,
    @SerialName("horario_inicio")
    val horarioInicio: String? = null,
    @SerialName("horario_fin")
    val horarioFin: String? = null,
    @SerialName("cupo_maximo")
    val cupoMaximo: Int = 20,
    val estado: String = "configurado",
    val activo: Boolean = true
)
```

---

## 🔧 Configuración en Retrofit

```kotlin
interface ApiService {
    // Obtener todos los bloques
    @GET("bloques/")
    suspend fun getBloques(): BloquesResponse
    
    // Crear bloque
    @POST("bloques/create/")
    suspend fun createBloque(@Body bloque: BloqueCreateRequest): BloqueDetailResponse
    
    // Obtener detalle
    @GET("bloques/{id}/")
    suspend fun getBloqueDetail(@Path("id") id: Int): BloqueDetailResponse
    
    // Actualizar bloque
    @PATCH("bloques/{id}/update/")
    suspend fun updateBloque(@Path("id") id: Int, @Body bloque: BloqueCreateRequest): BloqueDetailResponse
    
    // Eliminar bloque
    @DELETE("bloques/{id}/delete/")
    suspend fun deleteBloque(@Path("id") id: Int): Response<Unit>
    
    // Obtener estudiantes del bloque
    @GET("bloques/{id}/estudiantes/")
    suspend fun getBloqueEstudiantes(@Path("id") id: Int): EstudiantesResponse
    
    // Toggle activo/inactivo
    @POST("bloques/{id}/toggle/")
    suspend fun toggleBloque(@Path("id") id: Int): BloqueDetailResponse
}
```

---

## 🎨 Colores Disponibles

- **Verde** (#4CAF50) - Mañana
- **Azul** (#2196F3) - Tarde  
- **Morado** (#9C27B0) - Noche
- **Amarillo** (#FFC107) - Por defecto

---

## 📊 Bloques Iniciales Creados

Ya hay **18 bloques** creados en la base de datos:

| Nivel | Mañana | Tarde | Noche |
|-------|--------|-------|-------|
| A1    | ✅     | ✅    | ✅    |
| A2    | ✅     | ✅    | ✅    |
| B1    | ✅     | ✅    | ✅    |
| B2    | ✅     | ✅    | ✅    |
| C1    | ✅     | ✅    | ✅    |
| C2    | ✅     | ✅    | ✅    |

---

## ✅ Sincronización Web-Android

**Cómo funciona:**

1. **Crear en Android** → Se guarda en BD → Aparece en Web
2. **Modificar en Web** → Se actualiza en BD → Android lo ve al refrescar
3. **Eliminar en cualquiera** → Se borra de BD → Desaparece en ambos

**No hay conflictos** porque todo se guarda en la misma base de datos SQLite del backend Django.

---

## 🚀 Ejemplo de Uso en Android

```kotlin
// En tu ViewModel
class AdminBlocksViewModel : ViewModel() {
    private val _bloques = MutableStateFlow<List<Bloque>>(emptyList())
    val bloques: StateFlow<List<Bloque>> = _bloques.asStateFlow()
    
    fun loadBloques() {
        viewModelScope.launch {
            try {
                val response = RetrofitInstance.api.getBloques()
                if (response.success) {
                    _bloques.value = response.bloques
                }
            } catch (e: Exception) {
                // Manejar error
            }
        }
    }
    
    fun createBloque(nombre: String, nivel: String, color: String) {
        viewModelScope.launch {
            try {
                val request = BloqueCreateRequest(
                    nombre = nombre,
                    nivel = nivel,
                    grupoColor = color
                )
                val response = RetrofitInstance.api.createBloque(request)
                if (response.success) {
                    loadBloques() // Recargar lista
                }
            } catch (e: Exception) {
                // Manejar error
            }
        }
    }
}
```

---

## 🔐 Permisos

- **Listar bloques**: Cualquier usuario autenticado
- **Ver detalle**: Cualquier usuario autenticado
- **Crear/Editar/Eliminar**: Solo usuarios con `role = "admin"`

---

## 📝 Notas Importantes

1. Todos los endpoints requieren **autenticación JWT**
2. El campo `estudiantes_count` se calcula automáticamente
3. No se puede eliminar un bloque si tiene estudiantes asignados
4. El formato de horarios es `"HH:MM:SS"` (24 horas)
5. Los colores deben estar en formato hexadecimal `"#RRGGBB"`

---

¿Necesitas ayuda con la implementación? ¡Pregúntame! 🚀
