# 🔧 Solución: Evaluaciones no se muestran en Android

## 🔍 Problema Identificado

El backend está devolviendo las evaluaciones correctamente, pero Android no las está mostrando. El problema está en cómo Android maneja la respuesta del servidor.

---

## ✅ Estructura de Respuesta del Backend

El endpoint `/api/evaluations/` **SIEMPRE** devuelve un objeto JSON con esta estructura:

```json
{
  "success": true,
  "total": 4,
  "evaluaciones": [
    {
      "id": 13,
      "titulo": "quiz",
      "descripcion": "",
      "tipo": "quiz",
      "profesor": "wegerw",
      "fecha_limite": "2025-09-25T00:00:00",
      "archivo_url": "http://10.0.2.2:8000/media/evaluaciones/quiz.pdf",
      "estado_estudiante": "pendiente",
      "fecha_entrega": "",
      "calificacion": null,
      "created_at": "2024-09-11T00:00:00"
    }
  ]
}
```

**NUNCA devuelve un array vacío `[]`**

---

## 🔧 Corrección en Android

### **1. Actualizar ApiService.kt**

El endpoint debe devolver **SIEMPRE** un objeto `EvaluationsResponse`:

```kotlin
interface ApiService {
    @GET("evaluations/")
    suspend fun getUserEvaluations(
        @Header("Authorization") token: String
    ): EvaluationsResponse  // ✅ SIEMPRE un objeto, NUNCA JsonElement
}
```

### **2. Simplificar AuthRepository.kt**

**ELIMINAR** toda la lógica compleja que intenta manejar arrays vacíos:

```kotlin
// ❌ ELIMINAR ESTO:
suspend fun getUserEvaluations(): Result<List<Evaluation>> {
    val token = sessionManager.getToken() ?: return Result.Error("No hay token")
    return try {
        val jsonElement = apiService.getUserEvaluations("Bearer $token")
        
        // ❌ NO HACER ESTO - Es innecesario y causa problemas
        when (jsonElement) {
            is JsonObject -> {
                val response = Json.decodeFromJsonElement<EvaluationsResponse>(jsonElement)
                if (response.success) {
                    Result.Success(response.evaluaciones)
                } else {
                    Result.Error(response.message ?: "Error")
                }
            }
            is JsonArray -> {
                Result.Success(emptyList())
            }
            else -> Result.Error("Formato inesperado")
        }
    } catch (e: Exception) {
        Result.Error(e.message ?: "Error")
    }
}
```

**✅ REEMPLAZAR CON ESTO (Simple y robusto):**

```kotlin
suspend fun getUserEvaluations(): Result<List<Evaluation>> {
    val token = sessionManager.getToken() 
        ?: return Result.Error("No hay token de autenticación")
    
    return try {
        Log.d(APP_TAG, "📚 Solicitando evaluaciones...")
        
        val response = apiService.getUserEvaluations("Bearer $token")
        
        Log.d(APP_TAG, "✅ Respuesta recibida: success=${response.success}, total=${response.total}")
        
        if (response.success) {
            Log.d(APP_TAG, "📝 Evaluaciones: ${response.evaluaciones.size}")
            Result.Success(response.evaluaciones)
        } else {
            Log.e(APP_TAG, "❌ Error del servidor: ${response.message}")
            Result.Error(response.message ?: "Error al obtener evaluaciones")
        }
    } catch (e: Exception) {
        Log.e(APP_TAG, "❌ Excepción: ${e.message}", e)
        Result.Error(e.message ?: "Error de conexión")
    }
}
```

### **3. Verificar EvaluationsResponse.kt**

Debe tener esta estructura exacta:

```kotlin
@Serializable
data class EvaluationsResponse(
    val success: Boolean,
    val total: Int,
    val evaluaciones: List<Evaluation>,
    val message: String? = null
)

@Serializable
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
```

### **4. Verificar EvaluationsViewModel.kt**

Debe llamar al repository correctamente:

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
            
            Log.d("LENGUA_APP", "🔄 Cargando evaluaciones...")
            
            when (val result = evaluationsRepository.getUserEvaluations()) {
                is Result.Success -> {
                    Log.d("LENGUA_APP", "✅ ${result.data.size} evaluaciones cargadas")
                    _evaluations.value = result.data
                }
                is Result.Error -> {
                    Log.e("LENGUA_APP", "❌ Error: ${result.message}")
                    _error.value = result.message
                }
            }
            
            _isLoading.value = false
        }
    }
    
    fun refresh() {
        loadEvaluations()
    }
}
```

---

## 🧪 Pasos para Probar

### **1. Limpiar y reconstruir:**

```bash
./gradlew clean
./gradlew build
```

### **2. Verificar logs en Logcat:**

Busca estos mensajes:

```
✅ CORRECTO:
📚 Solicitando evaluaciones...
✅ Respuesta recibida: success=true, total=4
📝 Evaluaciones: 4
✅ 4 evaluaciones cargadas

❌ INCORRECTO:
❌ Error: Formato inesperado
❌ Excepción: ...
```

### **3. Probar el endpoint manualmente:**

Usa Postman o cURL para verificar que el backend funciona:

```bash
# 1. Login
curl -X POST http://10.0.2.2:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "adrian@thelanguage.co", "password": "12345678"}'

# 2. Copiar el token y probar evaluaciones
curl -X GET http://10.0.2.2:8000/api/evaluations/ \
  -H "Authorization: Bearer <TOKEN>"
```

**Debe devolver:**
```json
{
  "success": true,
  "total": 4,
  "evaluaciones": [...]
}
```

---

## 📊 Verificación en el Backend

El backend ahora tiene logs de debug. Cuando Android haga la petición, verás en la consola del servidor:

```
🔍 MOBILE EVALUATIONS - Usuario: adrian@thelanguage.co (ID: 1)
📚 Total evaluaciones encontradas: 4
✅ Enviando 4 evaluaciones al cliente
```

Si ves esto, el backend está funcionando correctamente.

---

## 🎯 Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `ApiService.kt` | Cambiar retorno a `EvaluationsResponse` (no `JsonElement`) |
| `AuthRepository.kt` | Simplificar lógica - eliminar manejo de `JsonArray` |
| `EvaluationsViewModel.kt` | Agregar logs de debug |
| Backend | Agregar logs y manejo robusto de errores |

---

## ⚠️ Errores Comunes

### **Error 1: "Formato inesperado"**
- **Causa:** Intentando manejar la respuesta como `JsonElement`
- **Solución:** Usar directamente `EvaluationsResponse`

### **Error 2: "Lista vacía siempre"**
- **Causa:** Lógica que detecta `JsonArray` y devuelve lista vacía
- **Solución:** Eliminar esa lógica - el backend NUNCA devuelve array

### **Error 3: "Datos de ejemplo se muestran"**
- **Causa:** ViewModel no está llamando al repository
- **Solución:** Verificar que `init { loadEvaluations() }` existe

---

## ✅ Checklist Final

- [ ] `ApiService.kt` devuelve `EvaluationsResponse` (no `JsonElement`)
- [ ] `AuthRepository.kt` simplificado (sin manejo de `JsonArray`)
- [ ] Logs de debug agregados en ViewModel
- [ ] Probado con Postman/cURL (backend funciona)
- [ ] Limpiado y reconstruido el proyecto
- [ ] Verificado logs en Logcat
- [ ] Evaluaciones se muestran en la app

---

## 🆘 Si Aún No Funciona

1. **Compartir logs de Logcat** (filtrar por "LENGUA_APP")
2. **Compartir código de `AuthRepository.kt`** (función `getUserEvaluations`)
3. **Verificar que el token es válido** (probar login primero)
