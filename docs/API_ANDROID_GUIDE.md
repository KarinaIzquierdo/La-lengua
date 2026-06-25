# The Language - Guía de Integración API para Android

## 📱 Información General

**Base URL:** `http://tu-servidor:8000/api/`  
**Autenticación:** JWT Bearer Token  
**Content-Type:** `application/json`

## 🔧 Configuración Inicial

### 1. Dependencias Android (build.gradle)
```gradle
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
implementation 'com.squareup.retrofit2:converter-gson:2.9.0'
implementation 'com.squareup.okhttp3:logging-interceptor:4.9.0'
```

### 2. Permisos en AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

### 3. Configuración de Red (network_security_config.xml)
```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config cleartextTrafficPermitted="true">
        <domain includeSubdomains="true">tu-servidor.com</domain>
        <domain includeSubdomains="true">localhost</domain>
        <domain includeSubdomains="true">10.0.2.2</domain>
    </domain-config>
</network-security-config>
```

## 🔐 Autenticación

### Login
```http
POST /api/auth/login/
Content-Type: application/json

{
    "email": "estudiante@thelanguage.com",
    "password": "password123"
}
```

**Respuesta:**
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "user": {
        "id": 1,
        "email": "estudiante@thelanguage.com",
        "first_name": "Juan",
        "last_name": "Pérez",
        "role": "student"
    }
}
```

### Verificar Token
```http
POST /api/auth/verify-token/
Authorization: Bearer <token>
Content-Type: application/json

{
    "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

### Perfil de Usuario
```http
GET /api/auth/profile/
Authorization: Bearer <token>
```

## 📚 Endpoints Principales

### 1. Clases
```http
# Obtener clases del usuario
GET /api/clases/
Authorization: Bearer <token>

# Crear nueva clase (solo profesores)
POST /api/clases/
Authorization: Bearer <token>
Content-Type: application/json

{
    "titulo": "Clase de Gramática",
    "descripcion": "Presente simple y continuo",
    "fecha": "2025-10-15",
    "hora": "14:00:00",
    "modalidad": "virtual",
    "meet_link": "https://meet.google.com/abc-defg-hij"
}
```

### 2. Evaluaciones
```http
# Evaluaciones del estudiante
GET /api/student/evaluaciones/
Authorization: Bearer <token>

# Subir respuesta a evaluación
POST /api/evaluaciones/{id}/upload-respuesta/
Authorization: Bearer <token>
Content-Type: multipart/form-data

archivo: [archivo]
comentarios: "Mi respuesta a la evaluación"
```

### 3. Notificaciones
```http
# Obtener notificaciones
GET /api/notificaciones/
Authorization: Bearer <token>

# Marcar como leída
POST /api/notificaciones/{id}/marcar-leida/
Authorization: Bearer <token>
```

### 4. Galería
```http
# Obtener contenido multimedia
GET /api/gallery/
Authorization: Bearer <token>

# Subir contenido
POST /api/gallery/create/
Authorization: Bearer <token>
Content-Type: multipart/form-data

titulo: "Mi video"
descripcion: "Descripción del contenido"
tipo: "video"
categoria: "Videos"
archivo: [archivo]
```

## 🛠️ Código de Ejemplo Android

### ApiService.java
```java
public interface ApiService {
    @POST("auth/login/")
    Call<LoginResponse> login(@Body LoginRequest request);
    
    @GET("auth/profile/")
    Call<UserProfile> getProfile(@Header("Authorization") String token);
    
    @GET("clases/")
    Call<List<Clase>> getClases(@Header("Authorization") String token);
    
    @GET("student/evaluaciones/")
    Call<List<Evaluacion>> getEvaluaciones(@Header("Authorization") String token);
    
    @Multipart
    @POST("evaluaciones/{id}/upload-respuesta/")
    Call<ResponseBody> uploadRespuesta(
        @Path("id") int evaluacionId,
        @Header("Authorization") String token,
        @Part MultipartBody.Part archivo,
        @Part("comentarios") RequestBody comentarios
    );
    
    @GET("notificaciones/")
    Call<List<Notificacion>> getNotificaciones(@Header("Authorization") String token);
}
```

### RetrofitClient.java
```java
public class RetrofitClient {
    private static final String BASE_URL = "http://tu-servidor:8000/api/";
    private static Retrofit retrofit;
    
    public static Retrofit getRetrofitInstance() {
        if (retrofit == null) {
            OkHttpClient client = new OkHttpClient.Builder()
                .addInterceptor(new HttpLoggingInterceptor()
                    .setLevel(HttpLoggingInterceptor.Level.BODY))
                .build();
                
            retrofit = new Retrofit.Builder()
                .baseUrl(BASE_URL)
                .client(client)
                .addConverterFactory(GsonConverterFactory.create())
                .build();
        }
        return retrofit;
    }
}
```

### AuthManager.java
```java
public class AuthManager {
    private static final String PREF_NAME = "TheLanguagePrefs";
    private static final String TOKEN_KEY = "access_token";
    
    public static void saveToken(Context context, String token) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(TOKEN_KEY, token).apply();
    }
    
    public static String getToken(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
        return prefs.getString(TOKEN_KEY, null);
    }
    
    public static String getAuthHeader(Context context) {
        String token = getToken(context);
        return token != null ? "Bearer " + token : null;
    }
}
```

## 📋 Modelos de Datos

### LoginRequest.java
```java
public class LoginRequest {
    private String email;
    private String password;
    
    // Constructores, getters y setters
}
```

### LoginResponse.java
```java
public class LoginResponse {
    private String access;
    private String refresh;
    private User user;
    
    // Getters y setters
}
```

### Clase.java
```java
public class Clase {
    private int id;
    private String titulo;
    private String descripcion;
    private String fecha;
    private String hora;
    private String modalidad;
    private String meet_link;
    private String estado;
    
    // Getters y setters
}
```

## 🔍 Endpoints de Información

### Información de la API
```http
GET /api/mobile/info/
```

### Configuración para Móviles
```http
GET /api/mobile/config/
```

## ⚠️ Consideraciones Importantes

1. **Tokens JWT:** Expiran en 24 horas, implementa refresh automático
2. **Archivos:** Tamaño máximo 10MB
3. **Formatos soportados:** PDF, DOC, DOCX, TXT, JPG, PNG
4. **Paginación:** 20 elementos por página
5. **CORS:** Configurado para permitir todas las conexiones en desarrollo

## 🚀 Flujo de Autenticación Recomendado

1. **Login:** Usuario ingresa credenciales
2. **Guardar Token:** Almacenar en SharedPreferences
3. **Interceptor:** Agregar token automáticamente a todas las requests
4. **Refresh:** Renovar token antes de que expire
5. **Logout:** Limpiar tokens almacenados

## 📞 Soporte

- **WhatsApp:** +573164844819
- **Email:** the.languagess@gmail.com
- **Horario:** 8:00 AM - 6:00 PM COT

---

**Nota:** Esta documentación está basada en el backend actual de The Language. Asegúrate de que el servidor esté ejecutándose en el puerto 8000 para las pruebas de desarrollo.
