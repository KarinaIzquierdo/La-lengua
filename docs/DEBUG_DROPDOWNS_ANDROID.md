# 🔍 Debug: Dropdowns Siguen Mostrando Datos Hardcodeados

## 🚨 Problema

Android dice que ya implementó la carga desde el backend, pero los dropdowns siguen mostrando solo:
- **Bloques**: "Nivel A1", "Nivel A2"
- **Especializaciones**: "Inglés Técnico"

---

## ✅ Checklist de Verificación

### 1. ¿Los endpoints están siendo llamados?

**Qué revisar en Android:**

```kotlin
// En CreateUserScreen o CreateUserViewModel
LaunchedEffect(Unit) {
    viewModel.loadBloques()           // ¿Esta línea existe?
    viewModel.loadEspecializaciones() // ¿Esta línea existe?
}
```

**Cómo verificar:**
- Agregar logs en el ViewModel:

```kotlin
fun loadBloques() {
    viewModelScope.launch {
        Log.d("CreateUser", "🔵 Cargando bloques desde backend...")
        _bloquesState.value = Result.Loading()
        val result = formDataRepository.getBloques()
        _bloquesState.value = result
        
        when (result) {
            is Result.Success -> {
                Log.d("CreateUser", "✅ Bloques cargados: ${result.data.size} bloques")
                result.data.forEach { bloque ->
                    Log.d("CreateUser", "  - ${bloque.nivel} ${bloque.nombre}")
                }
            }
            is Result.Error -> {
                Log.e("CreateUser", "❌ Error al cargar bloques: ${result.message}")
            }
        }
    }
}
```

**Si no ves estos logs:** Los métodos no se están llamando.

---

### 2. ¿El Repository está haciendo la petición correcta?

**Qué revisar:**

```kotlin
class FormDataRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    suspend fun getBloques(): Result<List<Bloque>> = withContext(Dispatchers.IO) {
        try {
            val token = sessionManager.getToken()
            Log.d("Repository", "🔑 Token: ${token?.take(20)}...")
            
            val response = apiService.getBloques("Bearer $token")
            Log.d("Repository", "📡 Response code: ${response.code()}")
            Log.d("Repository", "📦 Response body: ${response.body()}")
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success) {
                    Log.d("Repository", "✅ ${body.bloques.size} bloques recibidos")
                    Result.Success(body.bloques)
                } else {
                    Log.e("Repository", "❌ Success = false")
                    Result.Error("Error al obtener bloques")
                }
            } else {
                Log.e("Repository", "❌ Response no exitoso: ${response.code()}")
                Result.Error("Error: ${response.code()}")
            }
        } catch (e: Exception) {
            Log.e("Repository", "❌ Excepción: ${e.message}", e)
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
}
```

**Posibles problemas:**
- ❌ Token es null → No hay sesión activa
- ❌ Response code 401 → Token expirado
- ❌ Response code 404 → URL incorrecta
- ❌ Exception → Error de red o serialización

---

### 3. ¿El ApiService tiene la URL correcta?

**Qué revisar:**

```kotlin
interface ApiService {
    @GET("bloques/")  // ✅ Debe ser "bloques/" no "bloques" ni "/bloques"
    suspend fun getBloques(
        @Header("Authorization") token: String
    ): Response<BloquesResponse>
    
    @GET("especializaciones/activas/")  // ✅ Debe ser "especializaciones/activas/"
    suspend fun getEspecializaciones(
        @Header("Authorization") token: String
    ): Response<EspecializacionesResponse>
}
```

**Verificar la BASE_URL:**

```kotlin
object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:8000/api/"  // ✅ Para emulador
    // private const val BASE_URL = "http://localhost:8000/api/"  // ❌ NO funciona en emulador
    // private const val BASE_URL = "http://192.168.x.x:8000/api/"  // ✅ Para dispositivo físico
}
```

---

### 4. ¿Los modelos están correctos?

**Qué revisar:**

```kotlin
@Serializable
data class BloquesResponse(
    val success: Boolean,
    val total: Int,
    val bloques: List<Bloque>  // ✅ Debe coincidir con el backend
)

@Serializable
data class Bloque(
    val id: Int,
    val nombre: String,
    val nivel: String,
    val estado: String,
    @SerialName("grupo_color")
    val grupoColor: String,
    @SerialName("horario_inicio")
    val horarioInicio: String,
    @SerialName("horario_fin")
    val horarioFin: String,
    @SerialName("cupo_maximo")
    val cupoMaximo: Int,
    val activo: Boolean,
    @SerialName("estudiantes_count")
    val estudiantesCount: Int
)
```

**Si hay error de serialización:** Los nombres de campos no coinciden con el backend.

---

### 5. ¿El dropdown está usando los datos del estado?

**Qué revisar en CreateUserScreen:**

```kotlin
// ❌ INCORRECTO - Lista hardcodeada
val bloques = listOf("Nivel A1", "Nivel A2")
bloques.forEach { bloque ->
    DropdownMenuItem(
        text = { Text(bloque) },
        onClick = { /* ... */ }
    )
}

// ✅ CORRECTO - Datos del backend
when (val state = bloquesState) {
    is Result.Loading -> {
        CircularProgressIndicator()
    }
    is Result.Success -> {
        state.data.forEach { bloque ->  // ← Debe usar state.data
            DropdownMenuItem(
                text = { Text("${bloque.nivel} ${bloque.nombre}") },
                onClick = { /* ... */ }
            )
        }
    }
    is Result.Error -> {
        Text("Error: ${state.message}")
    }
}
```

**Problema común:** El código sigue usando la lista hardcodeada en lugar de `state.data`.

---

### 6. ¿El estado se está observando correctamente?

**Qué revisar:**

```kotlin
@Composable
fun CreateUserScreen(
    viewModel: CreateUserViewModel = viewModel()
) {
    // ✅ CORRECTO - Observar el estado
    val bloquesState by viewModel.bloquesState.collectAsState()
    val especializacionesState by viewModel.especializacionesState.collectAsState()
    
    // ❌ INCORRECTO - No observar el estado
    // val bloques = listOf("Nivel A1", "Nivel A2")
    
    LaunchedEffect(Unit) {
        viewModel.loadBloques()
        viewModel.loadEspecializaciones()
    }
    
    // Usar bloquesState y especializacionesState en los dropdowns
}
```

---

## 🧪 Prueba Paso a Paso

### Paso 1: Verificar que el backend funciona

```bash
# Terminal 1: Asegúrate de que el servidor esté corriendo
cd backend
python3 manage.py runserver

# Terminal 2: Probar el endpoint
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Copiar el token

curl -X GET http://localhost:8000/api/bloques/ \
  -H "Authorization: Bearer TU_TOKEN"
```

**Deberías ver:** JSON con 19+ bloques.

---

### Paso 2: Agregar logs en Android

```kotlin
// En CreateUserViewModel
fun loadBloques() {
    viewModelScope.launch {
        Log.d("DEBUG", "========================================")
        Log.d("DEBUG", "🔵 INICIANDO CARGA DE BLOQUES")
        Log.d("DEBUG", "========================================")
        
        _bloquesState.value = Result.Loading()
        val result = formDataRepository.getBloques()
        _bloquesState.value = result
        
        when (result) {
            is Result.Success -> {
                Log.d("DEBUG", "✅ BLOQUES CARGADOS: ${result.data.size}")
                result.data.forEach { bloque ->
                    Log.d("DEBUG", "  📦 ${bloque.nivel} ${bloque.nombre}")
                }
            }
            is Result.Error -> {
                Log.e("DEBUG", "❌ ERROR: ${result.message}")
            }
            is Result.Loading -> {
                Log.d("DEBUG", "⏳ Cargando...")
            }
        }
        Log.d("DEBUG", "========================================")
    }
}
```

---

### Paso 3: Ver los logs en Android Studio

1. Abre **Logcat** en Android Studio
2. Filtra por "DEBUG"
3. Abre el formulario de crear usuario
4. Busca los logs que agregaste

**Deberías ver:**
```
🔵 INICIANDO CARGA DE BLOQUES
🔑 Token: eyJhbGciOiJIUzI1NiIs...
📡 Response code: 200
✅ BLOQUES CARGADOS: 19
  📦 A1 Mañana
  📦 A1 Tarde
  📦 A1 Noche
  ...
```

---

## 🔧 Soluciones Comunes

### Problema 1: No se llama a loadBloques()

**Solución:**
```kotlin
LaunchedEffect(Unit) {
    viewModel.loadBloques()
    viewModel.loadEspecializaciones()
}
```

### Problema 2: Token es null

**Solución:**
```kotlin
// Verificar que el usuario esté logueado
val token = sessionManager.getToken()
if (token == null) {
    Log.e("DEBUG", "❌ No hay token, usuario no logueado")
    return@withContext Result.Error("No hay sesión activa")
}
```

### Problema 3: URL incorrecta

**Solución:**
```kotlin
// Para emulador Android
private const val BASE_URL = "http://10.0.2.2:8000/api/"

// Para dispositivo físico (reemplazar con tu IP local)
private const val BASE_URL = "http://192.168.1.100:8000/api/"
```

### Problema 4: Dropdown usa lista hardcodeada

**Solución:**
```kotlin
// ❌ ELIMINAR ESTO
// val bloques = listOf("Nivel A1", "Nivel A2")

// ✅ USAR ESTO
when (val state = bloquesState) {
    is Result.Success -> {
        state.data.forEach { bloque ->
            DropdownMenuItem(...)
        }
    }
}
```

### Problema 5: Error de serialización

**Solución:**
```kotlin
// Verificar que los nombres coincidan con el backend
@Serializable
data class BloquesResponse(
    val success: Boolean,  // ← Debe coincidir exactamente
    val total: Int,        // ← Debe coincidir exactamente
    val bloques: List<Bloque>  // ← Debe coincidir exactamente
)
```

---

## 📋 Checklist Final

Pídele a Android que verifique:

- [ ] ¿Se llama a `loadBloques()` y `loadEspecializaciones()` en `LaunchedEffect`?
- [ ] ¿Los logs muestran que se está haciendo la petición?
- [ ] ¿El token no es null?
- [ ] ¿El response code es 200?
- [ ] ¿Se reciben datos del backend (no lista vacía)?
- [ ] ¿El dropdown usa `state.data` en lugar de lista hardcodeada?
- [ ] ¿Se observa el estado con `collectAsState()`?
- [ ] ¿La BASE_URL es correcta para emulador/dispositivo?

---

## 🎯 Siguiente Paso

**Pídele a Android que:**

1. Agregue los logs de debug que mostré arriba
2. Ejecute la app
3. Abra el formulario de crear usuario
4. Copie y pegue los logs de Logcat

Con esos logs podré decirte exactamente qué está fallando.

---

**Sin ver los logs, es imposible saber si el problema es:**
- ❌ No se está llamando al backend
- ❌ El backend devuelve error
- ❌ Los datos llegan pero no se muestran
- ❌ Hay un error de serialización

**Los logs nos dirán exactamente dónde está el problema.** 🔍
