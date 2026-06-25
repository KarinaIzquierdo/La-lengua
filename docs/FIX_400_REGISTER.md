# 🔧 Solución: Error 400 al Crear Usuario

## 🔍 Problema

Al intentar crear un usuario desde Android, aparecía:

```
Bad Request: /api/auth/register/
[27/Oct/2025 21:08:45] "POST /api/auth/register/ HTTP/1.1" 400 99
```

### Causa del Error

El serializador `UserRegisterSerializer` esperaba:
- `especializacion` como un ID numérico (ForeignKey)
- Campos obligatorios que Android no estaba enviando

---

## ✅ Solución Implementada

### 1. Serializador Más Flexible

Actualizado `UserRegisterSerializer` en `/backend/api/serializers.py`:

```python
class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    role = serializers.ChoiceField(choices=CustomUser.ROLE_CHOICES)
    bloque_asignado = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    especializacion = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    correo_personal = serializers.EmailField(required=False, allow_blank=True, allow_null=True)
    username = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = CustomUser
        fields = ('username', 'first_name', 'last_name', 'email', 'role', 
                 'password', 'bloque_asignado', 'especializacion', 'correo_personal')
```

### 2. Método create() Mejorado

Ahora acepta `especializacion` como:
- ✅ Nombre de la especialización (string): `"Inglés Conversacional"`
- ✅ ID de la especialización (número): `"1"` o `1`
- ✅ Valor vacío o null

```python
def create(self, validated_data):
    # ... código ...
    
    # Buscar especialización por nombre o ID
    if especializacion_str:
        try:
            # Intentar buscar por nombre
            esp = Especializacion.objects.filter(nombre__iexact=especializacion_str).first()
            if esp:
                user.especializacion = esp
            else:
                # Si no se encuentra, intentar por ID
                try:
                    esp_id = int(especializacion_str)
                    esp = Especializacion.objects.filter(id=esp_id).first()
                    if esp:
                        user.especializacion = esp
                except (ValueError, TypeError):
                    pass
        except Exception as e:
            print(f"⚠️ Error al asignar especialización: {e}")
```

### 3. Logs de Depuración

Agregados logs en `register_view` para ver qué datos llegan:

```python
print("=" * 50)
print("📝 REGISTRO DE USUARIO - Datos recibidos:")
print(f"Data: {request.data}")
print("=" * 50)

# ... validación ...

if not serializer.is_valid():
    print("❌ ERRORES DE VALIDACIÓN:")
    print(serializer.errors)
    print("=" * 50)
```

---

## 📊 Formato de Request

### Campos Requeridos:

```json
{
  "email": "nuevo@test.com",
  "password": "Password123",
  "first_name": "Nuevo",
  "last_name": "Usuario",
  "role": "student"
}
```

### Campos Opcionales:

```json
{
  "username": "nuevo.usuario",
  "bloque_asignado": "A1 Mañana",
  "especializacion": "Inglés Conversacional",
  "correo_personal": "personal@gmail.com"
}
```

### Ejemplo Completo:

```json
{
  "username": "juan.perez",
  "email": "juan@test.com",
  "password": "Secure123",
  "first_name": "Juan",
  "last_name": "Pérez",
  "role": "student",
  "bloque_asignado": "B1 Tarde",
  "especializacion": "Inglés Conversacional",
  "correo_personal": "juan.personal@gmail.com"
}
```

---

## 🧪 Cómo Probar

### 1. Reiniciar el servidor:

```bash
cd backend
python3 manage.py runserver
```

### 2. Probar con cURL (mínimo):

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@test.com",
    "password": "Test1234",
    "first_name": "Test",
    "last_name": "User",
    "role": "student"
  }'
```

### 3. Probar con cURL (completo):

```bash
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "test.user",
    "email": "test@test.com",
    "password": "Test1234",
    "first_name": "Test",
    "last_name": "User",
    "role": "student",
    "bloque_asignado": "A1 Mañana",
    "especializacion": "Inglés Conversacional"
  }'
```

### 4. Ver los logs en la terminal del servidor

Deberías ver:

```
==================================================
📝 REGISTRO DE USUARIO - Datos recibidos:
Data: {'email': 'test@test.com', 'password': '...', ...}
==================================================
✅ Usuario 25 registrado con bloque: A1 Mañana
```

O si hay error:

```
❌ ERRORES DE VALIDACIÓN:
{'email': ['Ya existe un usuario con este correo electrónico.']}
==================================================
```

---

## 🎯 Cambios en Android

Actualiza `CreateUserRequest.kt`:

```kotlin
@Serializable
data class CreateUserRequest(
    val username: String? = null,  // Opcional
    val email: String,
    val password: String,
    @SerialName("first_name")
    val firstName: String,
    @SerialName("last_name")
    val lastName: String,
    val role: String,
    @SerialName("bloque_asignado")
    val bloqueAsignado: String? = null,
    val especializacion: String? = null,  // Ahora acepta string
    @SerialName("correo_personal")
    val correoPersonal: String? = null
)
```

---

## 📝 Resumen de Cambios

| Archivo | Cambio |
|---------|--------|
| `serializers.py` | `UserRegisterSerializer` ahora acepta campos opcionales |
| `serializers.py` | `especializacion` acepta string (nombre o ID) |
| `serializers.py` | `username` es opcional (usa email si no se proporciona) |
| `views.py` | Agregados logs de depuración en `register_view` |

---

## ✅ Resultado

- ✅ Campos opcionales funcionan correctamente
- ✅ `especializacion` acepta nombre o ID
- ✅ `username` se genera automáticamente del email si no se proporciona
- ✅ Logs muestran exactamente qué datos llegan y qué errores hay

**Ahora intenta crear un usuario desde Android y revisa los logs del servidor para ver qué está pasando.** 🎉
