<?php
/**
 * API para planes (tabla api_plan)
 */

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

function planes_verify_jwt() {
    if (!function_exists('getallheaders')) return null;
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) return null;
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    $payload = jwt_decode_simple($token);
    if (!$payload) return null;
    return is_array($payload) ? (object)$payload : $payload;
}

function planes_map_row($row) {
    if (!$row) return null;
    $caracts = [];
    if (isset($row['caracteristicas']) && $row['caracteristicas'] !== null && $row['caracteristicas'] !== '') {
        $decoded = json_decode($row['caracteristicas'], true);
        if (is_array($decoded)) $caracts = $decoded; else $caracts = [$row['caracteristicas']];
    }
    return [
        'id' => (int)$row['id'],
        'nombre' => $row['nombre'],
        'tipo' => $row['tipo'],
        'descripcion' => $row['descripcion'],
        'precio_base' => (float)$row['precio_base'],
        'duracion_meses' => (int)$row['duracion_meses'],
        'caracteristicas' => $caracts,
        'activo' => (bool)$row['activo'],
        'color_tema' => $row['color_tema'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));
$index = array_search('planes', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$idSeg = $parts[$index + 1] ?? null; // puede ser ID o palabra
$extra = $parts[$index + 2] ?? null; // update/delete/toggle

try {
    $pdo = getConnection();
    if (!$pdo) throw new Exception('Error de conexión a la base de datos');

    // LISTADO PÚBLICO: GET /planes/public/ -> solo planes activos, sin JWT
    if ($method === 'GET' && $idSeg === 'public') {
        $stmt = $pdo->prepare('SELECT * FROM api_plan WHERE activo = 1 ORDER BY precio_base ASC');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $planes = [];
        foreach ($rows as $row) {
            $mapped = planes_map_row($row);
            if ($mapped) $planes[] = $mapped;
        }
        echo json_encode(['success' => true, 'data' => $planes]);
        return;
    }

    $user = planes_verify_jwt();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit();
    }

    // LISTAR: GET /planes/
    if ($method === 'GET' && ($idSeg === null || $idSeg === '')) {
        $stmt = $pdo->prepare('SELECT * FROM api_plan ORDER BY precio_base ASC');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $planes = [];
        foreach ($rows as $row) {
            $mapped = planes_map_row($row);
            if ($mapped) $planes[] = $mapped;
        }
        echo json_encode(['success' => true, 'data' => $planes]);
        return;
    }

    // CREAR: POST /planes/create/
    if ($method === 'POST' && $idSeg === 'create') {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) $data = [];

        $nombre = trim((string)($data['nombre'] ?? ''));
        $tipo = trim((string)($data['tipo'] ?? ''));
        $descripcion = (string)($data['descripcion'] ?? '');
        $precio_base = isset($data['precio_base']) ? (float)$data['precio_base'] : 0.0;
        $duracion_meses = isset($data['duracion_meses']) ? (int)$data['duracion_meses'] : 1;
        $caracteristicas = $data['caracteristicas'] ?? [];
        $activo = isset($data['activo']) ? (bool)$data['activo'] : true;
        $color_tema = trim((string)($data['color_tema'] ?? '#2563eb'));

        $errors = [];
        if ($nombre === '') $errors['nombre'] = 'El nombre es obligatorio.';
        if ($tipo === '') $errors['tipo'] = 'El tipo es obligatorio.';
        if ($descripcion === '') $errors['descripcion'] = 'La descripción es obligatoria.';
        if ($precio_base <= 0) $errors['precio_base'] = 'El precio base debe ser mayor a 0.';

        if (!empty($errors)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Errores de validación', 'errors' => $errors]);
            return;
        }

        if (!is_array($caracteristicas)) $caracteristicas = [];
        $caractsJson = json_encode($caracteristicas, JSON_UNESCAPED_UNICODE);

        $sql = 'INSERT INTO api_plan (nombre, tipo, descripcion, precio_base, duracion_meses, caracteristicas, activo, color_tema, created_at, updated_at)
                VALUES (:nombre, :tipo, :descripcion, :precio_base, :duracion_meses, :caracteristicas, :activo, :color_tema, NOW(), NOW())';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':nombre' => $nombre,
            ':tipo' => $tipo,
            ':descripcion' => $descripcion,
            ':precio_base' => $precio_base,
            ':duracion_meses' => $duracion_meses,
            ':caracteristicas' => $caractsJson,
            ':activo' => $activo ? 1 : 0,
            ':color_tema' => $color_tema,
        ]);

        $newId = (int)$pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM api_plan WHERE id = ?');
        $stmt->execute([$newId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $plan = planes_map_row($row);

        echo json_encode(['success' => true, 'data' => $plan, 'message' => 'Plan creado exitosamente']);
        return;
    }

    // A partir de aquí esperamos ID numérico
    $planId = ($idSeg !== null && ctype_digit($idSeg)) ? (int)$idSeg : null;

    if ($planId === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de plan inválido']);
        return;
    }

    // ACTUALIZAR: PUT /planes/{id}/update/
    if ($method === 'PUT' && $extra === 'update') {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data) || empty($data)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Nada que actualizar']);
            return;
        }

        $fields = [];
        $params = [];
        $allowed = ['nombre', 'tipo', 'descripcion', 'precio_base', 'duracion_meses', 'caracteristicas', 'activo', 'color_tema'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                if ($field === 'caracteristicas') {
                    $value = $data[$field];
                    if (!is_array($value)) $value = [];
                    $fields[] = 'caracteristicas = ?';
                    $params[] = json_encode($value, JSON_UNESCAPED_UNICODE);
                } elseif ($field === 'activo') {
                    $fields[] = 'activo = ?';
                    $params[] = $data[$field] ? 1 : 0;
                } else {
                    $fields[] = "$field = ?";
                    $params[] = $data[$field];
                }
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Sin campos válidos para actualizar']);
            return;
        }

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE api_plan SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $planId;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT * FROM api_plan WHERE id = ?');
        $stmt->execute([$planId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
            return;
        }

        $plan = planes_map_row($row);
        echo json_encode(['success' => true, 'data' => $plan, 'message' => 'Plan actualizado exitosamente']);
        return;
    }

    // ELIMINAR: DELETE /planes/{id}/delete/
    if ($method === 'DELETE' && $extra === 'delete') {
        $stmt = $pdo->prepare('DELETE FROM api_plan WHERE id = ?');
        $stmt->execute([$planId]);
        if ($stmt->rowCount() === 0) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
            return;
        }
        echo json_encode(['success' => true, 'message' => 'Plan eliminado exitosamente']);
        return;
    }

    // TOGGLE: POST /planes/{id}/toggle/
    if ($method === 'POST' && $extra === 'toggle') {
        $stmt = $pdo->prepare('SELECT activo FROM api_plan WHERE id = ?');
        $stmt->execute([$planId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
            return;
        }
        $nuevo = $row['activo'] ? 0 : 1;
        $stmt = $pdo->prepare('UPDATE api_plan SET activo = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([$nuevo, $planId]);

        $stmt = $pdo->prepare('SELECT * FROM api_plan WHERE id = ?');
        $stmt->execute([$planId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        $plan = planes_map_row($row);
        echo json_encode([
            'success' => true,
            'data' => $plan,
            'message' => $nuevo ? 'Plan activado exitosamente' : 'Plan desactivado exitosamente',
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido en /planes']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de planes',
        'error' => $e->getMessage(),
    ]);
}
