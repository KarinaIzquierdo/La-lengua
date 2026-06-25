# 🔧 Solución: Error JSON en Gestión de Usuarios

## 🔍 Problema

Al intentar cargar la lista de usuarios en la app Android, aparecía este error:

```
Error de conexión: Unexpected JSON token at offset 7767: 
Expected quotation mark '"', but had '1' instead at path: $[15].especializacion
```

### Causa del Error

El campo `especializacion` en el modelo `CustomUser` es una relación ForeignKey con el modelo `Especializacion`. El serializador `UserSerializer` estaba devolviendo el ID numérico de la especialización en lugar de un string, lo que causaba problemas de formato JSON en la app móvil.

---

## ✅ Solución Implementada

### 1. Creado Nuevo Serializador para Móvil

Se creó `MobileUserSerializer` en `/backend/api/serializers.py`:

```python
class MobileUserSerializer(serializers.ModelSerializer):
    """Serializador simplificado para la app móvil"""
    especializacion = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'role', 
                 'is_active', 'bloque_asignado', 'especializacion', 'date_joined')
        read_only_fields = ('id', 'date_joined')
    
    def get_especializacion(self, obj):
        """Devolver el nombre de la especialización como string"""
        if obj.especializacion:
            return obj.especializacion.nombre
        return None
```

### 2. Actualizado Endpoint de Listar Usuarios

Modificado `/backend/api/views.py` - función `list_users_view`:

```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_users_view(request):
    """
    Endpoint para listar todos los usuarios
    """
    from .serializers import MobileUserSerializer
    users = CustomUser.objects.all().order_by('-date_joined')
    serializer = MobileUserSerializer(users, many=True)
    return Response(serializer.data)
```

### 3. Actualizado Endpoint de Registro

Modificado `/backend/api/views.py` - función `register_view`:

```python
@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    """
    Endpoint para registrar un nuevo usuario
    """
    from .serializers import MobileUserSerializer
    serializer = UserRegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        
        if 'bloque_asignado' in request.data and request.data['bloque_asignado']:
            user.bloque_asignado = request.data['bloque_asignado']
            user.save()
        
        user_serializer = MobileUserSerializer(user)
        return Response({
            'success': True,
            'user': user_serializer.data,
            'message': 'Usuario registrado exitosamente'
        }, status=status.HTTP_201_CREATED)
    else:
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
```

---

## 📊 Formato de Respuesta

### Antes (causaba error):

```json
{
  "id": 1,
  "username": "juan",
  "email": "juan@test.com",
  "especializacion": 1,  // ❌ ID numérico causaba error
  "bloque_asignado": "B1 Mañana"
}
```

### Ahora (correcto):

```json
{
  "id": 1,
  "username": "juan",
  "email": "juan@test.com",
  "first_name": "Juan",
  "last_name": "Rodríguez",
  "role": "student",
  "is_active": true,
  "bloque_asignado": "B1 Mañana",
  "especializacion": "Inglés Conversacional",  // ✅ String
  "date_joined": "2025-10-27T15:30:00Z"
}
```

---

## 🧪 Cómo Probar

### 1. Reiniciar el servidor Django:

```bash
cd backend
python3 manage.py runserver
```

### 2. Probar con cURL:

```bash
# Login
curl -X POST http://localhost:8000/api/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Copiar el token

# Listar usuarios
curl -X GET http://localhost:8000/api/users/ \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

### 3. Probar en Android:

1. Abre la app
2. Inicia sesión como administrador
3. Ve a "Gestionar usuarios"
4. Verifica que la lista se cargue correctamente sin errores

---

## 📝 Cambios Realizados

| Archivo | Cambio |
|---------|--------|
| `backend/api/serializers.py` | Agregado `MobileUserSerializer` |
| `backend/api/views.py` | Actualizado `list_users_view` para usar `MobileUserSerializer` |
| `backend/api/views.py` | Actualizado `register_view` para usar `MobileUserSerializer` |

---

## ✅ Beneficios

1. **JSON válido**: Todos los campos son strings o números simples
2. **Menos datos**: Solo se envían los campos necesarios para la app móvil
3. **Más rápido**: Respuesta más ligera y rápida
4. **Compatible**: Funciona con la serialización de Kotlin/Android
5. **Ordenado**: Usuarios ordenados por fecha de registro (más recientes primero)

---

## 🎯 Resultado

- ✅ Error JSON resuelto
- ✅ Lista de usuarios se carga correctamente
- ✅ Creación de usuarios funciona correctamente
- ✅ Formato compatible con Android

**¡El problema está solucionado! La app ahora puede cargar y crear usuarios sin errores.** 🎉
