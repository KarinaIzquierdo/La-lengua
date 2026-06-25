# 📋 Resumen: Bloques y Especializaciones en Android

## 🔍 Problema

En la app Android, los dropdowns solo muestran **datos hardcodeados**:
- **Bloques**: Solo 2 opciones ("Nivel A1", "Nivel A2")
- **Especializaciones**: Solo 1 opción ("Inglés Técnico")

Pero en el backend hay:
- **Bloques**: 19+ opciones (A1 Mañana, A1 Tarde, A1 Noche, A2 Mañana, B1 Tarde, etc.)
- **Especializaciones**: 5 opciones (Inglés Técnico, Call Center, Finanzas, Negocios, Viajes)

---

## ✅ Solución

### Backend: **YA ESTÁ LISTO** ✅

Los endpoints ya existen y funcionan:

| Endpoint | Método | Descripción |
|----------|--------|-------------|
| `/api/bloques/` | GET | Lista todos los bloques |
| `/api/especializaciones/activas/` | GET | Lista especializaciones activas |

### Android: **Necesita Implementar** 📱

Android debe **dejar de usar datos hardcodeados** y llamar a estos endpoints.

---

## 🎯 Lo que Android debe hacer

### 1. Crear Modelos
```kotlin
// Bloque.kt
data class Bloque(
    val id: Int,
    val nombre: String,
    val nivel: String
) {
    fun getDisplayName() = "$nivel $nombre"  // "A1 Mañana"
}

// Especializacion.kt
data class Especializacion(
    val id: Int,
    val nombre: String
)
```

### 2. Agregar en ApiService
```kotlin
@GET("bloques/")
suspend fun getBloques(@Header("Authorization") token: String): Response<BloquesResponse>

@GET("especializaciones/activas/")
suspend fun getEspecializaciones(@Header("Authorization") token: String): Response<EspecializacionesResponse>
```

### 3. Cargar al abrir el formulario
```kotlin
LaunchedEffect(Unit) {
    viewModel.loadBloques()
    viewModel.loadEspecializaciones()
}
```

### 4. Mostrar en dropdowns
```kotlin
// En lugar de lista hardcodeada:
val bloques = listOf("Nivel A1", "Nivel A2")  // ❌ ELIMINAR ESTO

// Usar datos del backend:
when (val state = bloquesState) {
    is Result.Success -> {
        state.data.forEach { bloque ->
            DropdownMenuItem(
                text = { Text(bloque.getDisplayName()) },
                onClick = { /* seleccionar */ }
            )
        }
    }
}
```

---

## 🧪 Probar que el Backend Funciona

```bash
# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Ver bloques (copiar token del login)
curl -X GET http://localhost:8000/api/bloques/ \
  -H "Authorization: Bearer TU_TOKEN"

# Ver especializaciones
curl -X GET http://localhost:8000/api/especializaciones/activas/ \
  -H "Authorization: Bearer TU_TOKEN"
```

Deberías ver todos los bloques y especializaciones en la respuesta.

---

## 📚 Documentación Completa

Para implementación detallada, ver:
- **`MOBILE_API_BLOQUES_ESPECIALIZACIONES.md`** - Guía completa con código

---

## ✅ Checklist

- [ ] Crear modelos `Bloque.kt` y `Especializacion.kt`
- [ ] Agregar métodos en `ApiService`
- [ ] Crear `FormDataRepository`
- [ ] Actualizar `CreateUserViewModel`
- [ ] Actualizar `CreateUserScreen` para cargar datos del backend
- [ ] Eliminar listas hardcodeadas
- [ ] Probar que los dropdowns muestren todos los datos

---

**El backend ya está listo. Solo falta que Android llame a los endpoints.** 🚀
