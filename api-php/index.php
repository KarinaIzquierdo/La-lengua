<?php
/**
 * Router principal de la API La Lengua
 */

// Incluir configuración CORS
require_once 'config/cors.php';
require_once 'config/database.php';
require_once 'jwt-simple.php';

// Obtener la ruta solicitada
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Obtener la ruta desde diferentes fuentes (compatible con LiteSpeed)
$path = '';

// Método 1: PATH_INFO
if (isset($_SERVER['PATH_INFO']) && !empty($_SERVER['PATH_INFO'])) {
    $path = trim($_SERVER['PATH_INFO'], '/');
}
// Método 2: Query parameter 'route' 
elseif (isset($_GET['route'])) {
    $path = trim($_GET['route'], '/');
}
// Método 3: REQUEST_URI parsing
else {
    $uri_path = parse_url($request_uri, PHP_URL_PATH);
    $path = str_replace('/api', '', $uri_path);
    $path = str_replace('/index.php', '', $path);
    $path = trim($path, '/');
}
// Normalizar separadores de directorio en la ruta capturada
$normalizedPath = str_replace('\\', '/', $path);

// Atender directamente archivos subidos: /api/uploads/... (por ejemplo PDFs de clubs)
if (strpos($normalizedPath, 'uploads/') === 0) {
    $relativePath = substr($normalizedPath, strlen('uploads/'));
    $relativePath = urldecode($relativePath);
    $relativePath = str_replace('..', '', $relativePath); // evitar path traversal

    $candidates = [];
    $candidates[] = __DIR__ . '/uploads/' . $relativePath;

    // Fallback: algunas instalaciones guardan el archivo en /uploads/ aunque el path incluya clubs/
    if (strpos($relativePath, 'clubs/') === 0) {
        $altRelativePath = substr($relativePath, strlen('clubs/'));
        $candidates[] = __DIR__ . '/uploads/' . $altRelativePath;
    }

    // Resolver el primer candidato existente (o buscar por extensión si no hay)
    $resolved = null;
    foreach ($candidates as $candidate) {
        if (file_exists($candidate) && is_file($candidate)) {
            $resolved = $candidate;
            break;
        }

        $ext = pathinfo($candidate, PATHINFO_EXTENSION);
        if ($ext === '') {
            // 1) Intento rápido con .pdf
            $pdfPath = $candidate . '.pdf';
            if (file_exists($pdfPath) && is_file($pdfPath)) {
                $resolved = $pdfPath;
                break;
            }

            // 2) Buscar cualquier extensión (pdf, docx, jpg, etc.) con el mismo basename
            $dir = dirname($candidate);
            $base = basename($candidate);
            $matches = glob($dir . '/' . $base . '.*') ?: [];
            foreach ($matches as $m) {
                if (file_exists($m) && is_file($m)) {
                    $resolved = $m;
                    break 2;
                }
            }

            // 3) Fallback tolerante: buscar por prefijo (manejar nombres recortados / variaciones)
            $matches2 = glob($dir . '/' . $base . '*') ?: [];
            foreach ($matches2 as $m2) {
                if (file_exists($m2) && is_file($m2)) {
                    $resolved = $m2;
                    break 2;
                }
            }
        }
    }

    if ($resolved === null) {
        http_response_code(404);
        echo 'File not found: uploads/' . $relativePath;
        exit();
    }

    $filePath = $resolved;

    $mimeType = function_exists('mime_content_type') ? mime_content_type($filePath) : 'application/octet-stream';
    if (!$mimeType) {
        $mimeType = 'application/octet-stream';
    }

    header('Content-Type: ' . $mimeType);
    header('Content-Length: ' . filesize($filePath));
    header('Content-Disposition: attachment; filename="' . basename($filePath) . '"');
    readfile($filePath);
    exit();
}

// Debug: mostrar la ruta capturada
error_log("DEBUG - Ruta capturada: '$path' - REQUEST_URI: $request_uri");

// Dividir la ruta en segmentos
$segments = explode('/', $path);

// Router básico
try {
    switch ($segments[0]) {
        case 'auth':
            if (isset($segments[1]) && $segments[1] == 'profile') {
                require_once 'profile-simple.php';
            } else {
                require_once 'auth-simple.php';
            }
            break;
            
        case 'users':
            require_once 'users.php';
            break;
            
        case 'evaluaciones':
            require_once 'evaluaciones.php';  // Versión completa con CRUD y JWT
            break;

        case 'calificaciones':
            // Rutas de calificaciones y respuestas de evaluaciones
            require_once 'calificaciones.php';
            break;

        case 'student':
            // Rutas tipo /student/evaluaciones/ y /student/respuestas/
            if (isset($segments[1]) && $segments[1] === 'respuestas') {
                // Listado de respuestas del estudiante autenticado
                require_once 'calificaciones.php';
            } else {
                // Evaluaciones asignadas al estudiante
                require_once 'evaluaciones.php';
            }
            break;

        case 'clases':
            // Usar la nueva implementación con soporte de estudiantes (many-to-many)
            if (file_exists(__DIR__ . '/clases_v2.php')) {
                require_once 'clases_v2.php';
            } else {
                require_once 'clases.php';
            }
            break;

        case 'planes':
            require_once 'planes.php';
            break;

        case 'ventas':
        case 'estadisticas':
            require_once 'financial.php';
            break;

        case 'suscripciones':
            require_once 'suscripciones.php';
            break;

        case 'missions':
            require_once 'missions.php';
            break;

        case 'gamificacion':
            require_once 'gamificacion.php';
            break;

        case 'daily-challenges':
            require_once 'daily_challenges.php';
            break;

        case 'admin':
            require_once 'admin_dashboard.php';
            break;

        case 'contact':
            require_once 'contact.php';
            break;

        case 'notificaciones':
            require_once 'notificaciones.php';
            break;

        case 'clubs':
            require_once 'clubs.php';
            break;

        case 'asistencias':
            require_once 'asistencias.php';
            break;

        case 'registros-eliminacion':
            require_once 'registros-eliminacion.php';
            break;

        case 'gallery':
            require_once 'gallery.php';
            break;

        case 'especializaciones':
            require_once 'especializaciones.php';
            break;
            
        case 'test':
            // Endpoint de prueba
            echo json_encode([
                'success' => true,
                'message' => 'API La Lengua funcionando correctamente',
                'timestamp' => date('Y-m-d H:i:s'),
                'path' => $path,
                'method' => $request_method
            ]);
            break;
            
        default:
            http_response_code(404);
            echo json_encode([
                'success' => false,
                'message' => 'Endpoint no encontrado',
                'path' => $path
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor',
        'error' => $e->getMessage()
    ]);
}
?>
