# 🔍 Guía de Debug: Problema de Token en Clubs

## 🎯 Objetivo

Identificar por qué la pantalla de Clubs no está recibiendo o usando el token correctamente.

---

## 📋 Paso 1: Verificar logs en Android

### **Abrir Logcat:**

1. En Android Studio, click en la pestaña **"Logcat"** (parte inferior)
2. Click en el icono de **basura 🗑️** para limpiar logs antiguos
3. En la barra de búsqueda, escribe: `ClubsRepository` o `AuthRepo`

### **Ejecutar la app:**

1. Hacer login con: `adrian@thelanguage.co` / `12345678`
2. Ir a la pantalla "Mis Clubs"
3. Observar los logs

### **Logs esperados:**

```
D/AuthRepository: 🔑 Token guardado después del login: eyJ0eXAiOiJKV1QiLCJhbGc...
D/ClubsRepository: 🔍 Solicitando clubs...
D/ClubsRepository: 🔑 Token recuperado: eyJ0eXAiOiJKV1QiLCJhbGc...
D/ClubsRepository: ✅ Success: true
D/ClubsRepository: 📊 Total: 2
D/ClubsRepository: 📚 Clubs: 2
```

### **Logs de error comunes:**

#### **Error 1: Token null**
```
D/ClubsRepository: 🔑 Token recuperado: null
E/ClubsRepository: ❌ Error: No hay token de autenticación
```
**Causa:** El token no se guardó después del login.

#### **Error 2: Token diferente**
```
D/AuthRepository: 🔑 Token guardado: eyJ0eXAiOiJKV1Qi...ABC
D/ClubsRepository: 🔑 Token recuperado: eyJ0eXAiOiJKV1Qi...XYZ
```
**Causa:** Se está usando un SessionManager diferente.

#### **Error 3: Success false**
```
D/ClubsRepository: ✅ Success: false
D/ClubsRepository: ❌ Error: Unauthorized
```
**Causa:** Token inválido o expirado.

---

## 📋 Paso 2: Verificar logs en el servidor Django

### **En la terminal del servidor, deberías ver:**

```
🔑 Authorization Header: Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...
🔍 MOBILE CLUBS - Usuario: adrian@thelanguage.co (ID: 18) - Email: adrian@thelanguage.co
📚 Total clubs encontrados: 2
  - Club ID 2: 36u356u
  - Club ID 1: isnpusibgnpuig
✅ Enviando 2 clubs al cliente
```

### **Si NO ves estos logs:**

La petición no está llegando al servidor. Verificar:
- ¿El servidor está corriendo? (`python3 manage.py runserver`)
- ¿La URL es correcta? (`http://10.0.2.2:8000/api/clubs/`)

### **Si ves "NO AUTH HEADER":**

```
🔑 Authorization Header: NO AUTH HEADER
```

Android no está enviando el token. El problema está en el código de Android.

---

## 🔧 Solución 1: Verificar SessionManager

### **Problema común: Múltiples instancias de SessionManager**

Si el login usa un `SessionManager` y Clubs usa otro diferente, el token no se comparte.

### **Solución: Usar una instancia única**

**En RetrofitInstance.kt:**

```kotlin
object RetrofitInstance {
    private const val BASE_URL = "http://10.0.2.2:8000/api/"

    private val json = Json {
        ignoreUnknownKeys = true
        coerceInputValues = true
    }

    private val retrofit by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(json.asConverterFactory("application/json".toMediaType()))
            .build()
    }

    val api: ApiService by lazy {
        retrofit.create(ApiService::class.java)
    }

    // ✅ SessionManager único
    @Volatile
    private var sessionManager: SessionManager? = null

    fun getSessionManager(context: Context): SessionManager {
        return sessionManager ?: synchronized(this) {
            val newManager = SessionManager(context.applicationContext)
            sessionManager = newManager
            newManager
        }
    }

    // ✅ AuthRepository único
    @Volatile
    private var authRepository: AuthRepository? = null

    fun getAuthRepository(context: Context): AuthRepository {
        return authRepository ?: synchronized(this) {
            val newRepo = AuthRepository(api, getSessionManager(context))
            authRepository = newRepo
            newRepo
        }
    }

    // ✅ ClubsRepository único
    @Volatile
    private var clubsRepository: ClubsRepository? = null

    fun getClubsRepository(context: Context): ClubsRepository {
        return clubsRepository ?: synchronized(this) {
            val newRepo = ClubsRepository(api, getSessionManager(context))
            clubsRepository = newRepo
            newRepo
        }
    }
}
```

---

## 🔧 Solución 2: Agregar logs en AuthRepository

**En AuthRepository.kt, función login:**

```kotlin
suspend fun login(username: String, password: String): Result<LoginResponse> {
    return try {
        Log.d("AuthRepository", "🔐 Intentando login con: $username")
        
        val response = apiService.login(LoginRequest(username, password))
        
        Log.d("AuthRepository", "✅ Login exitoso")
        Log.d("AuthRepository", "🔑 Token recibido: ${response.token.take(20)}...")
        
        // Guardar token
        sessionManager.saveToken(response.token)
        
        // Verificar que se guardó
        val savedToken = sessionManager.getToken()
        Log.d("AuthRepository", "✅ Token guardado verificado: ${savedToken?.take(20)}...")
        
        Result.Success(response)
    } catch (e: Exception) {
        Log.e("AuthRepository", "❌ Error en login: ${e.message}", e)
        Result.Error(e.message ?: "Error de conexión")
    }
}
```

---

## 🔧 Solución 3: Agregar logs en ClubsRepository

**En ClubsRepository.kt:**

```kotlin
suspend fun getUserClubs(): Result<List<Club>> {
    return try {
        Log.d("ClubsRepository", "🔍 Solicitando clubs...")
        
        val token = sessionManager.getToken()
        Log.d("ClubsRepository", "🔑 Token recuperado: ${token?.take(20)}...")
        
        if (token.isNullOrEmpty()) {
            Log.e("ClubsRepository", "❌ Token es null o vacío")
            return Result.Error("No hay token de autenticación")
        }
        
        Log.d("ClubsRepository", "📡 Haciendo petición a /api/clubs/")
        val response = apiService.getUserClubs("Bearer $token")
        
        Log.d("ClubsRepository", "✅ Respuesta recibida")
        Log.d("ClubsRepository", "Success: ${response.success}")
        Log.d("ClubsRepository", "Total: ${response.total}")
        Log.d("ClubsRepository", "Clubs: ${response.clubs.size}")
        
        if (response.success) {
            Result.Success(response.clubs)
        } else {
            Log.e("ClubsRepository", "❌ Error del servidor: ${response.message}")
            Result.Error(response.message ?: "Error al obtener clubs")
        }
    } catch (e: Exception) {
        Log.e("ClubsRepository", "❌ Excepción: ${e.message}", e)
        Result.Error(e.message ?: "Error de conexión")
    }
}
```

---

## 🔧 Solución 4: Verificar SessionManager

**En SessionManager.kt:**

```kotlin
class SessionManager(context: Context) {
    private val prefs = context.getSharedPreferences("lengua_prefs", Context.MODE_PRIVATE)
    
    companion object {
        private const val KEY_TOKEN = "auth_token"
    }
    
    fun saveToken(token: String) {
        Log.d("SessionManager", "💾 Guardando token: ${token.take(20)}...")
        prefs.edit().putString(KEY_TOKEN, token).apply()
        
        // Verificar que se guardó
        val saved = prefs.getString(KEY_TOKEN, null)
        Log.d("SessionManager", "✅ Token guardado verificado: ${saved?.take(20)}...")
    }
    
    fun getToken(): String? {
        val token = prefs.getString(KEY_TOKEN, null)
        Log.d("SessionManager", "📖 Recuperando token: ${token?.take(20) ?: "NULL"}...")
        return token
    }
    
    fun clearToken() {
        Log.d("SessionManager", "🗑️ Eliminando token")
        prefs.edit().remove(KEY_TOKEN).apply()
    }
}
```

---

## 📊 Checklist de Debug

- [ ] Logs agregados en AuthRepository
- [ ] Logs agregados en ClubsRepository
- [ ] Logs agregados en SessionManager
- [ ] Servidor Django corriendo
- [ ] Logcat filtrado y limpio
- [ ] Login realizado con adrian@thelanguage.co
- [ ] Navegado a pantalla de Clubs
- [ ] Logs del servidor revisados
- [ ] Logs de Android revisados

---

## 🎯 Diagnóstico según logs

### **Escenario 1: Token se guarda pero no se recupera**

**Logs:**
```
D/AuthRepository: ✅ Token guardado: eyJ0eXAi...
D/ClubsRepository: 🔑 Token recuperado: null
```

**Causa:** SessionManager diferente entre Login y Clubs.

**Solución:** Usar instancia única de SessionManager (ver Solución 1).

---

### **Escenario 2: Token no se guarda**

**Logs:**
```
D/AuthRepository: ✅ Login exitoso
(No hay log de "Token guardado")
D/ClubsRepository: 🔑 Token recuperado: null
```

**Causa:** No se está llamando a `sessionManager.saveToken()`.

**Solución:** Verificar que después del login exitoso se guarde el token.

---

### **Escenario 3: Token se guarda y recupera, pero servidor dice "Unauthorized"**

**Logs Android:**
```
D/AuthRepository: ✅ Token guardado: eyJ0eXAi...
D/ClubsRepository: 🔑 Token recuperado: eyJ0eXAi...
E/ClubsRepository: ❌ Error: Unauthorized
```

**Logs Servidor:**
```
🔑 Authorization Header: Bearer eyJ0eXAi...
❌ Error: Invalid token
```

**Causa:** Token expirado o inválido.

**Solución:** Hacer login nuevamente.

---

### **Escenario 4: Todo funciona pero clubs está vacío**

**Logs Android:**
```
D/ClubsRepository: ✅ Success: true
D/ClubsRepository: 📊 Total: 0
D/ClubsRepository: 📚 Clubs: 0
```

**Logs Servidor:**
```
🔍 MOBILE CLUBS - Usuario: otro@email.com (ID: 99)
📚 Total clubs encontrados: 0
⚠️ El usuario otro@email.com NO tiene clubs asignados
```

**Causa:** Token de otro usuario (no adrian@thelanguage.co).

**Solución:** Cerrar sesión y hacer login con adrian@thelanguage.co.

---

## 🆘 Si nada funciona

Comparte:
1. **Logs completos de Logcat** (desde login hasta clubs)
2. **Logs del servidor Django**
3. **Código de SessionManager.kt**
4. **Código de ClubsRepository.kt**
5. **Código de LoginScreen.kt** (parte del login exitoso)

Con esta información podremos identificar el problema exacto.
