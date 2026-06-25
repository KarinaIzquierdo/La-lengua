<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'jwt-simple.php';

function gallery_verificar_jwt() {
    if (!function_exists('getallheaders')) {
        return null;
    }
    $headers = getallheaders();

    // Normalizar posible header en minúsculas, como en otros endpoints
    if (!isset($headers['Authorization']) && isset($headers['authorization'])) {
        $headers['Authorization'] = $headers['authorization'];
    }

    if (!isset($headers['Authorization'])) {
        return null;
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    $payload = jwt_decode_simple($token);
    if ($payload === false || $payload === null) {
        return null;
    }
    if (is_array($payload)) {
        return (object)$payload;
    }
    return $payload;
}

function gallery_map_media_item($row) {
    if (!$row) {
        return null;
    }
    $url = $row['url'];
    if ((!$url || $url === '') && !empty($row['file'])) {
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $baseUrl = $scheme . '://' . $host;
        $filePath = $row['file'];
        if ($filePath[0] !== '/') {
            $filePath = '/api/' . ltrim($filePath, '/');
        }
        $url = $baseUrl . $filePath;
    }

    return [
        'id' => (int)$row['id'],
        'type' => $row['type'],
        'title' => $row['title'],
        'description' => $row['description'],
        'url' => $url,
        'file' => $row['file'],
        'thumbnail' => $row['thumbnail'],
        'author' => $row['author'],
        'category' => $row['category'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
        'is_active' => (bool)$row['is_active'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('gallery', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$idSegment = $parts[$index + 1] ?? null; // puede ser ID, 'create', o vacio
$extra     = $parts[$index + 2] ?? null; // puede ser 'update' o 'delete'

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    // LISTAR: GET /gallery/
    if ($method === 'GET' && ($idSegment === null || $idSegment === '')) {
        $stmt = $pdo->prepare('SELECT * FROM api_mediaitem WHERE is_active = 1 ORDER BY created_at DESC');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($rows as $row) {
            $mapped = gallery_map_media_item($row);
            if ($mapped !== null) {
                $items[] = $mapped;
            }
        }

        echo json_encode([
            'success' => true,
            'total' => count($items),
            'items' => $items,
        ]);
        return;
    }

    // CREAR: POST /gallery/create/
    if ($method === 'POST' && $idSegment === 'create') {
        $user = gallery_verificar_jwt();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token inválido']);
            return;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $data = [];
        if (stripos($contentType, 'application/json') !== false) {
            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data)) {
                $data = [];
            }
        } else {
            $data = $_POST;
        }

        $type = isset($data['type']) ? trim((string)$data['type']) : '';
        $title = isset($data['title']) ? trim((string)$data['title']) : '';
        $description = isset($data['description']) ? (string)$data['description'] : '';
        $url = isset($data['url']) ? trim((string)$data['url']) : '';
        $thumbnail = isset($data['thumbnail']) ? trim((string)$data['thumbnail']) : '';
        $author = isset($data['author']) ? trim((string)$data['author']) : '';
        $category = isset($data['category']) ? trim((string)$data['category']) : '';

        $errors = [];
        if ($type === '') {
            $errors['type'] = 'El tipo es obligatorio.';
        }
        if ($title === '') {
            $errors['title'] = 'El título es obligatorio.';
        }
        if ($description === '') {
            $errors['description'] = 'La descripción es obligatoria.';
        }
        if ($author === '') {
            $errors['author'] = 'El autor es obligatorio.';
        }
        if ($category === '') {
            $errors['category'] = 'La categoría es obligatoria.';
        }

        $uploadedPath = null;
        if (!empty($_FILES['file']) && isset($_FILES['file']['error']) && $_FILES['file']['error'] === UPLOAD_ERR_OK) {
            $tmpName = $_FILES['file']['tmp_name'];
            $origName = basename($_FILES['file']['name']);
            $ext = pathinfo($origName, PATHINFO_EXTENSION);
            $safeName = uniqid('media_', true) . ($ext ? ('.' . $ext) : '');

            $uploadDir = __DIR__ . '/uploads/gallery/';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0775, true);
            }
            $destPath = $uploadDir . $safeName;
            if (move_uploaded_file($tmpName, $destPath)) {
                $uploadedPath = 'uploads/gallery/' . $safeName;

                $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $baseUrl = $scheme . '://' . $host;
                $publicUrl = $baseUrl . '/api/' . $uploadedPath;

                if ($url === '') {
                    $url = $publicUrl;
                }
            } else {
                $errors['file'] = 'Error al guardar el archivo subido.';
            }
        }

        if ($url === '' && $uploadedPath === null) {
            $errors['url'] = 'Debe proporcionar una URL o un archivo.';
        }

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Errores de validación',
                'errors' => $errors,
            ]);
            return;
        }

        $sql = 'INSERT INTO api_mediaitem (
                    type, title, description, url, file, thumbnail, author, category, created_at, updated_at, is_active
                ) VALUES (
                    :type, :title, :description, :url, :file, :thumbnail, :author, :category, NOW(), NOW(), 1
                )';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':type' => $type,
            ':title' => $title,
            ':description' => $description,
            ':url' => $url,
            ':file' => $uploadedPath,
            ':thumbnail' => $thumbnail !== '' ? $thumbnail : null,
            ':author' => $author,
            ':category' => $category,
        ]);

        $newId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM api_mediaitem WHERE id = ?');
        $stmt->execute([$newId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $item = gallery_map_media_item($row);

        echo json_encode([
            'success' => true,
            'total' => 1,
            'items' => [$item],
            'message' => 'Elemento creado exitosamente',
        ]);
        return;
    }

    // ACTUALIZAR: PUT /gallery/{id}/update/
    if ($method === 'PUT' && $idSegment !== null && ctype_digit($idSegment) && $extra === 'update') {
        $user = gallery_verificar_jwt();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token inválido']);
            return;
        }

        $id = (int)$idSegment;

        $stmt = $pdo->prepare('SELECT * FROM api_mediaitem WHERE id = ? AND is_active = 1');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Elemento no encontrado']);
            return;
        }

        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $fields = [];
        $params = [];
        $allowed = ['type', 'title', 'description', 'url', 'thumbnail', 'author', 'category'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nada que actualizar']);
            return;
        }

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE api_mediaitem SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $id;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT * FROM api_mediaitem WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $item = gallery_map_media_item($row);

        echo json_encode([
            'success' => true,
            'data' => $item,
            'message' => 'Elemento actualizado exitosamente',
        ]);
        return;
    }

    // ELIMINAR DEFINITIVO: DELETE /gallery/{id}/delete/
    if ($method === 'DELETE' && $idSegment !== null && ctype_digit($idSegment) && $extra === 'delete') {
        $user = gallery_verificar_jwt();
        if (!$user) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token inválido']);
            return;
        }

        $id = (int)$idSegment;

        // Obtener registro actual para conocer la ruta del archivo
        $stmt = $pdo->prepare('SELECT * FROM api_mediaitem WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Elemento no encontrado']);
            return;
        }

        // Intentar borrar el archivo físico si existe
        if (!empty($row['file'])) {
            $filePath = $row['file'];
            $absolutePath = __DIR__ . '/' . ltrim($filePath, '/');
            if (file_exists($absolutePath) && is_file($absolutePath)) {
                @unlink($absolutePath);
            }
        }

        // Eliminar definitivamente el registro de la tabla
        $stmt = $pdo->prepare('DELETE FROM api_mediaitem WHERE id = ?');
        $stmt->execute([$id]);

        echo json_encode([
            'success' => true,
            'message' => 'Elemento eliminado definitivamente',
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido o ruta inválida',
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de galería',
        'error' => $e->getMessage(),
    ]);
}
