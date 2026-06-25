# 🔧 Solución: Error de Serialización en Especializaciones

## 🚨 Error

```
Error de conexión: Field 'precio_adicional' is required for type with serial name 
'com.example.lengua.data.model.Especializacion', 
but it was missing at path: $.data[0]
```

---

## 🔍 Causa

El modelo de Android tiene `precio_adicional` como campo **requerido**, pero el backend puede enviar `null` o no incluir el campo.

---

## ✅ Solución

### Opción 1: Hacer el campo opcional en Android (RECOMENDADO)

Actualiza el modelo `Especializacion.kt`:

```kotlin
@Serializable
data class Especializacion(
    val id: Int,
    val nombre: String,
    val descripcion: String? = null,  // ← Opcional
    @SerialName("precio_adicional")
    val precioAdicional: String? = null,  // ← Hacer opcional con valor por defecto
    val activa: Boolean = true  // ← Opcional con valor por defecto
)
```

### Cambios realizados:
- ✅ `descripcion: String? = null` - Ahora es opcional
- ✅ `precioAdicional: String? = null` - Ahora es opcional
- ✅ `activa: Boolean = true` - Ahora es opcional con valor por defecto

---

## 📊 Formato de Respuesta del Backend

El backend devuelve:

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
      "nombre": "Sin especialización",
      "descripcion": null,
      "precio_adicional": null,
      "activa": true
    }
  ]
}
```

Como algunos campos pueden ser `null`, el modelo debe aceptar valores opcionales.

---

## 🔧 Código Completo Corregido

### **Especializacion.kt**

```kotlin
package com.example.lalengua.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Especializacion(
    val id: Int,
    val nombre: String,
    val descripcion: String? = null,
    @SerialName("precio_adicional")
    val precioAdicional: String? = null,
    val activa: Boolean = true
)

@Serializable
data class EspecializacionesResponse(
    val success: Boolean,
    val data: List<Especializacion>
)
```

---

## 🧪 Probar

Después de hacer este cambio:

1. Recompila la app
2. Abre el formulario de crear usuario
3. El dropdown de especializaciones debería cargar correctamente

---

## ✅ Resultado Esperado

Deberías ver en el dropdown:

- Sin especialización
- Inglés Técnico - 12 semanas
- Inglés para Call Center - 6 semanas
- Inglés para Finanzas - 8 semanas
- Inglés para Negocios - 10 semanas
- Inglés para Viajes - 6 semanas

---

## 📝 Resumen

| Campo | Antes | Después |
|-------|-------|---------|
| `descripcion` | `String` | `String? = null` |
| `precioAdicional` | `String` | `String? = null` |
| `activa` | `Boolean` | `Boolean = true` |

**Todos los campos opcionales deben tener `?` y un valor por defecto.**

---

**¡Con este cambio debería funcionar!** 🎉
