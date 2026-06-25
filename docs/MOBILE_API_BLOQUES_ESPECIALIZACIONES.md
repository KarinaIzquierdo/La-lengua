# 📱 API de Bloques y Especializaciones - Android

## 🎯 Problema

En la app Android, los dropdowns de **Bloque Asignado** y **Especialización** solo muestran 2-3 opciones hardcodeadas, cuando en realidad hay muchas más en el backend.

### Lo que muestra Android actualmente:
- **Bloques**: Solo "Nivel A1" y "Nivel A2"
- **Especializaciones**: Solo "Inglés Técnico"

### Lo que hay en el backend:
- **Bloques**: 19+ bloques (A1 Mañana, A1 Tarde, A1 Noche, A2 Mañana, etc.)
- **Especializaciones**: 5 especializaciones (Inglés Técnico, Call Center, Finanzas, Negocios, Viajes)

---

## ✅ Solución: Obtener Datos del Backend

El backend **YA TIENE** los endpoints necesarios. Solo necesitas llamarlos desde Android.

---

## 📌 Endpoints Disponibles

### 1. Listar Bloques

**GET /api/bloques/**

#### Request:
```http
GET /api/bloques/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
```

#### Response (200 OK):
```json
{
  "success": true,
  "total": 19,
  "bloques": [
    {
      "id": 1,
      "nombre": "Mañana",
      "nivel": "A1",
      "estado": "activo",
      "grupo_color": "#4CAF50",
      "horario_inicio": "08:00:00",
      "horario_fin": "10:00:00",
      "cupo_maximo": 15,
      "activo": true,
      "estudiantes_count": 8
    },
    {
      "id": 2,
      "nombre": "Tarde",
      "nivel": "A1",
      "estado": "activo",
      "grupo_color": "#2196F3",
      "horario_inicio": "14:00:00",
      "horario_fin": "16:00:00",
      "cupo_maximo": 15,
      "activo": true,
      "estudiantes_count": 12
    }
    // ... más bloques
  ]
}
```

### 2. Listar Especializaciones Activas

**GET /api/especializaciones/activas/**

#### Request:
```http
GET /api/especializaciones/activas/ HTTP/1.1
Host: localhost:8000
Authorization: Bearer {token}
```

#### Response (200 OK):
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Inglés Técnico - 12 semanas",
      "descripcion": "Inglés especializado para profesionales técnicos",
      "precio_adicional": "150000.00",
      "activa": true
    },
    {
      "id": 2,
      "nombre": "Inglés para Call Center - 6 semanas",
      "descripcion": "Inglés enfocado en atención al cliente",
      "precio_adicional": "100000.00",
      "activa": true
    },
    {
      "id": 3,
      "nombre": "Inglés para Finanzas - 8 semanas",
      "descripcion": "Inglés para el sector financiero",
      "precio_adicional": "120000.00",
      "activa": true
    },
    {
      "id": 4,
      "nombre": "Inglés para Negocios - 10 semanas",
      "descripcion": "Inglés corporativo y de negocios",
      "precio_adicional": "130000.00",
      "activa": true
    },
    {
      "id": 5,
      "nombre": "Inglés para Viajes - 6 semanas",
      "descripcion": "Inglés práctico para viajeros",
      "precio_adicional": "90000.00",
      "activa": true
    }
  ]
}
```

---

## 🔧 Implementación en Android

### Paso 1: Crear Modelos de Datos

#### **Bloque.kt**
```kotlin
package com.example.lalengua.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

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
) {
    // Formato para mostrar en el dropdown
    fun getDisplayName(): String {
        return "$nivel $nombre"
    }
}

@Serializable
data class BloquesResponse(
    val success: Boolean,
    val total: Int,
    val bloques: List<Bloque>
)
```

#### **Especializacion.kt**
```kotlin
package com.example.lalengua.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Especializacion(
    val id: Int,
    val nombre: String,
    val descripcion: String,
    @SerialName("precio_adicional")
    val precioAdicional: String,
    val activa: Boolean
)

@Serializable
data class EspecializacionesResponse(
    val success: Boolean,
    val data: List<Especializacion>
)
```

---

### Paso 2: Agregar Métodos en ApiService

```kotlin
interface ApiService {
    
    /**
     * Obtener lista de bloques
     */
    @GET("bloques/")
    suspend fun getBloques(
        @Header("Authorization") token: String
    ): Response<BloquesResponse>
    
    /**
     * Obtener lista de especializaciones activas
     */
    @GET("especializaciones/activas/")
    suspend fun getEspecializaciones(
        @Header("Authorization") token: String
    ): Response<EspecializacionesResponse>
    
    // ... otros métodos
}
```

---

### Paso 3: Crear Repository

```kotlin
package com.example.lalengua.data.repository

class FormDataRepository(
    private val apiService: ApiService,
    private val sessionManager: SessionManager
) {
    
    suspend fun getBloques(): Result<List<Bloque>> = withContext(Dispatchers.IO) {
        try {
            val token = sessionManager.getToken() ?: return@withContext Result.Error("No hay sesión")
            val response = apiService.getBloques("Bearer $token")
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success) {
                    Result.Success(body.bloques)
                } else {
                    Result.Error("Error al obtener bloques")
                }
            } else {
                Result.Error("Error: ${response.code()}")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
    
    suspend fun getEspecializaciones(): Result<List<Especializacion>> = withContext(Dispatchers.IO) {
        try {
            val token = sessionManager.getToken() ?: return@withContext Result.Error("No hay sesión")
            val response = apiService.getEspecializaciones("Bearer $token")
            
            if (response.isSuccessful && response.body() != null) {
                val body = response.body()!!
                if (body.success) {
                    Result.Success(body.data)
                } else {
                    Result.Error("Error al obtener especializaciones")
                }
            } else {
                Result.Error("Error: ${response.code()}")
            }
        } catch (e: Exception) {
            Result.Error("Error de conexión: ${e.localizedMessage}")
        }
    }
}
```

---

### Paso 4: Actualizar CreateUserViewModel

```kotlin
class CreateUserViewModel(
    private val userRepository: UserRepository,
    private val formDataRepository: FormDataRepository
) : ViewModel() {
    
    // Estados para bloques
    private val _bloquesState = MutableStateFlow<Result<List<Bloque>>>(Result.Loading())
    val bloquesState: StateFlow<Result<List<Bloque>>> = _bloquesState.asStateFlow()
    
    // Estados para especializaciones
    private val _especializacionesState = MutableStateFlow<Result<List<Especializacion>>>(Result.Loading())
    val especializacionesState: StateFlow<Result<List<Especializacion>>> = _especializacionesState.asStateFlow()
    
    /**
     * Cargar bloques desde el backend
     */
    fun loadBloques() {
        viewModelScope.launch {
            _bloquesState.value = Result.Loading()
            _bloquesState.value = formDataRepository.getBloques()
        }
    }
    
    /**
     * Cargar especializaciones desde el backend
     */
    fun loadEspecializaciones() {
        viewModelScope.launch {
            _especializacionesState.value = Result.Loading()
            _especializacionesState.value = formDataRepository.getEspecializaciones()
        }
    }
    
    // ... resto del código
}
```

---

### Paso 5: Actualizar CreateUserScreen

```kotlin
@Composable
fun CreateUserScreen(
    viewModel: CreateUserViewModel = viewModel()
) {
    val bloquesState by viewModel.bloquesState.collectAsState()
    val especializacionesState by viewModel.especializacionesState.collectAsState()
    
    var bloqueSeleccionado by remember { mutableStateOf<String?>(null) }
    var especializacionSeleccionada by remember { mutableStateOf<String?>(null) }
    
    // Cargar datos al iniciar
    LaunchedEffect(Unit) {
        viewModel.loadBloques()
        viewModel.loadEspecializaciones()
    }
    
    Column(modifier = Modifier.fillMaxSize().padding(16.dp)) {
        
        // ... otros campos ...
        
        // Dropdown de Bloques
        Text("Bloque Asignado", style = MaterialTheme.typography.labelMedium)
        
        when (val state = bloquesState) {
            is Result.Loading -> CircularProgressIndicator()
            is Result.Success -> {
                var expandedBloques by remember { mutableStateOf(false) }
                
                ExposedDropdownMenuBox(
                    expanded = expandedBloques,
                    onExpandedChange = { expandedBloques = !expandedBloques }
                ) {
                    OutlinedTextField(
                        value = bloqueSeleccionado ?: "Sin asignar",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Seleccionar bloque") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedBloques) },
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expandedBloques,
                        onDismissRequest = { expandedBloques = false }
                    ) {
                        // Opción "Sin asignar"
                        DropdownMenuItem(
                            text = { Text("Sin asignar") },
                            onClick = {
                                bloqueSeleccionado = null
                                expandedBloques = false
                            }
                        )
                        
                        // Bloques del backend
                        state.data.forEach { bloque ->
                            DropdownMenuItem(
                                text = { Text(bloque.getDisplayName()) },
                                onClick = {
                                    bloqueSeleccionado = bloque.getDisplayName()
                                    expandedBloques = false
                                }
                            )
                        }
                    }
                }
            }
            is Result.Error -> {
                Text(
                    text = "Error al cargar bloques: ${state.message}",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Dropdown de Especializaciones
        Text("Especialización", style = MaterialTheme.typography.labelMedium)
        
        when (val state = especializacionesState) {
            is Result.Loading -> CircularProgressIndicator()
            is Result.Success -> {
                var expandedEsp by remember { mutableStateOf(false) }
                
                ExposedDropdownMenuBox(
                    expanded = expandedEsp,
                    onExpandedChange = { expandedEsp = !expandedEsp }
                ) {
                    OutlinedTextField(
                        value = especializacionSeleccionada ?: "Sin especialización",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Seleccionar especialización") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedEsp) },
                        modifier = Modifier.fillMaxWidth().menuAnchor()
                    )
                    
                    ExposedDropdownMenu(
                        expanded = expandedEsp,
                        onDismissRequest = { expandedEsp = false }
                    ) {
                        // Opción "Sin especialización"
                        DropdownMenuItem(
                            text = { Text("Sin especialización") },
                            onClick = {
                                especializacionSeleccionada = null
                                expandedEsp = false
                            }
                        )
                        
                        // Especializaciones del backend
                        state.data.forEach { esp ->
                            DropdownMenuItem(
                                text = { Text(esp.nombre) },
                                onClick = {
                                    especializacionSeleccionada = esp.nombre
                                    expandedEsp = false
                                }
                            )
                        }
                    }
                }
            }
            is Result.Error -> {
                Text(
                    text = "Error al cargar especializaciones: ${state.message}",
                    color = MaterialTheme.colorScheme.error,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
        
        // ... resto del formulario ...
    }
}
```

---

## 🧪 Probar los Endpoints

### Con cURL:

```bash
# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Copiar el token

# Listar bloques
curl -X GET http://localhost:8000/api/bloques/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI"

# Listar especializaciones
curl -X GET http://localhost:8000/api/especializaciones/activas/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## 📝 Resumen

### Backend: ✅ Listo
- Endpoint `/api/bloques/` - Devuelve todos los bloques
- Endpoint `/api/especializaciones/activas/` - Devuelve especializaciones activas

### Android: Necesita implementar
1. Crear modelos `Bloque` y `Especializacion`
2. Agregar métodos en `ApiService`
3. Crear `FormDataRepository`
4. Actualizar `CreateUserViewModel` para cargar datos
5. Actualizar `CreateUserScreen` para mostrar dropdowns dinámicos

---

## ✅ Resultado Esperado

Después de implementar esto, los dropdowns mostrarán:

**Bloque Asignado:**
- Sin asignar
- A1 Mañana
- A1 Tarde
- A1 Noche
- A2 Mañana
- A2 Tarde
- ... (todos los bloques del backend)

**Especialización:**
- Sin especialización
- Inglés Técnico - 12 semanas
- Inglés para Call Center - 6 semanas
- Inglés para Finanzas - 8 semanas
- Inglés para Negocios - 10 semanas
- Inglés para Viajes - 6 semanas

**¡Los datos se cargarán automáticamente del backend!** 🎉
