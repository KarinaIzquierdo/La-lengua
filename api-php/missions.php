<?php
/**
 * API para enlaces de misiones (tabla api_missionexternallink)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'jwt-simple.php';

function missions_verify_jwt()
{
    if (!function_exists('getallheaders')) {
        return null;
    }
    $headers = getallheaders();
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

function missions_map_link_row($row)
{
    if (!$row) {
        return null;
    }

    $now = new DateTime('now');
    $status = 'inactive';
    $isActive = !empty($row['is_active']);

    if ($isActive) {
        $start = !empty($row['start_at']) ? new DateTime($row['start_at']) : null;
        $expires = !empty($row['expires_at']) ? new DateTime($row['expires_at']) : null;

        if ($start && $now < $start) {
            $status = 'upcoming';
        } elseif ($expires && $now > $expires) {
            $status = 'expired';
        } else {
            $status = 'active';
        }
    }

    return [
        'id' => (int)$row['id'],
        'mission_key' => $row['mission_key'],
        'platform' => $row['platform'],
        'url' => $row['url'],
        'start_at' => $row['start_at'],
        'expires_at' => $row['expires_at'],
        'is_active' => (bool)$row['is_active'],
        'notes' => $row['notes'],
        'audience_type' => $row['audience_type'],
        'audience_value' => $row['audience_value'],
        'user' => $row['user_id'] !== null ? (int)$row['user_id'] : null,
        'status' => $status,
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

function missions_normalize_datetime($value)
{
    if ($value === null || $value === '') {
        return null;
    }
    try {
        $dt = new DateTime($value);
        return $dt->format('Y-m-d H:i:s');
    } catch (Exception $e) {
        return null;
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('missions', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$seg1 = $parts[$index + 1] ?? null; // "available", "links" o mission_key
$seg2 = $parts[$index + 2] ?? null; // "link" o id

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    // ================== ENDPOINTS PÚBLICOS (SIN JWT) ==================

    // GET /missions/available/?user_id=&bloque=
    if ($method === 'GET' && $seg1 === 'available') {
        $now = date('Y-m-d H:i:s');
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        $bloque = isset($_GET['bloque']) ? trim((string)$_GET['bloque']) : null;

        $baseWhere = 'is_active = 1 AND (start_at IS NULL OR start_at <= ?) AND (expires_at IS NULL OR expires_at >= ?)';
        $baseParams = [$now, $now];

        // Student
        $qsStudent = [];
        if ($userId && $userId > 0) {
            $sqlS = 'SELECT * FROM api_missionexternallink WHERE ' . $baseWhere . ' AND audience_type = ? AND user_id = ? ORDER BY start_at DESC, created_at DESC';
            $stmt = $pdo->prepare($sqlS);
            $stmt->execute(array_merge($baseParams, ['student', $userId]));
            $qsStudent = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        // Bloque
        $qsBloque = [];
        if ($bloque !== null && $bloque !== '') {
            $sqlB = 'SELECT * FROM api_missionexternallink WHERE ' . $baseWhere . ' AND audience_type = ? AND audience_value = ? ORDER BY start_at DESC, created_at DESC';
            $stmt = $pdo->prepare($sqlB);
            $stmt->execute(array_merge($baseParams, ['bloque', $bloque]));
            $qsBloque = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        // Global
        $sqlG = 'SELECT * FROM api_missionexternallink WHERE ' . $baseWhere . ' AND audience_type = ? ORDER BY start_at DESC, created_at DESC';
        $stmt = $pdo->prepare($sqlG);
        $stmt->execute(array_merge($baseParams, ['global']));
        $qsGlobal = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Prioridad: student > bloque > global
        $combined = array_merge($qsStudent, $qsBloque, $qsGlobal);
        $byKey = [];
        foreach ($combined as $row) {
            $key = $row['mission_key'];
            if (!isset($byKey[$key])) {
                $byKey[$key] = $row;
            }
        }

        $result = [];
        foreach ($byKey as $row) {
            $result[] = [
                'mission_key' => $row['mission_key'],
                'title' => ucwords(str_replace('_', ' ', $row['mission_key'])),
                'description' => $row['notes'] ?? 'Completa esta misión para avanzar en tu aprendizaje',
                'platform' => $row['platform'],
                'xp' => 25,
            ];
        }

        echo json_encode($result);
        return;
    }

    // GET /missions/{mission_key}/link/?user_id=&bloque=
    if ($method === 'GET' && $seg1 !== null && $seg1 !== 'links' && $seg2 === 'link') {
        $missionKey = $seg1;
        $now = date('Y-m-d H:i:s');
        $userId = isset($_GET['user_id']) ? (int)$_GET['user_id'] : null;
        $bloque = isset($_GET['bloque']) ? trim((string)$_GET['bloque']) : null;

        $baseWhere = 'mission_key = ? AND is_active = 1 AND (start_at IS NULL OR start_at <= ?) AND (expires_at IS NULL OR expires_at >= ?)';
        $baseParams = [$missionKey, $now, $now];

        $row = null;

        // 1) Student
        if ($userId && $userId > 0) {
            $sqlS = 'SELECT * FROM api_missionexternallink WHERE ' . $baseWhere . ' AND audience_type = ? AND user_id = ? ORDER BY start_at DESC, created_at DESC LIMIT 1';
            $stmt = $pdo->prepare($sqlS);
            $stmt->execute(array_merge($baseParams, ['student', $userId]));
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        // 2) Bloque
        if (!$row && $bloque !== null && $bloque !== '') {
            $sqlB = 'SELECT * FROM api_missionexternallink WHERE ' . $baseWhere . ' AND audience_type = ? AND audience_value = ? ORDER BY start_at DESC, created_at DESC LIMIT 1';
            $stmt = $pdo->prepare($sqlB);
            $stmt->execute(array_merge($baseParams, ['bloque', $bloque]));
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        // 3) Global
        if (!$row) {
            $sqlG = 'SELECT * FROM api_missionexternallink WHERE ' . $baseWhere . ' AND audience_type = ? ORDER BY start_at DESC, created_at DESC LIMIT 1';
            $stmt = $pdo->prepare($sqlG);
            $stmt->execute(array_merge($baseParams, ['global']));
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
        }

        if (!$row) {
            http_response_code(204); // No Content
            return;
        }

        $mapped = missions_map_link_row($row);
        echo json_encode($mapped);
        return;
    }

    // ================== ENDPOINTS PROTEGIDOS (ADMIN / PROFESOR) ==================

    $user = missions_verify_jwt();
    if (!$user || !isset($user->role) || !in_array($user->role, ['admin', 'profesor'], true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No autorizado']);
        return;
    }

    // LISTAR / CREAR: /missions/links/
    if ($seg1 === 'links' && ($seg2 === null || $seg2 === '')) {
        if ($method === 'GET') {
            $missionKey = isset($_GET['mission_key']) ? trim((string)$_GET['mission_key']) : null;

            $sql = 'SELECT * FROM api_missionexternallink';
            $params = [];
            if ($missionKey !== null && $missionKey !== '') {
                $sql .= ' WHERE mission_key = ?';
                $params[] = $missionKey;
            }
            $sql .= ' ORDER BY created_at DESC';

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $result = [];
            foreach ($rows as $row) {
                $mapped = missions_map_link_row($row);
                if ($mapped !== null) {
                    $result[] = $mapped;
                }
            }

            echo json_encode($result);
            return;
        }

        if ($method === 'POST') {
            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data)) {
                $data = [];
            }

            $mission_key = trim((string)($data['mission_key'] ?? ''));
            $platform = (string)($data['platform'] ?? 'custom');
            $url = trim((string)($data['url'] ?? ''));
            $start_at = missions_normalize_datetime($data['start_at'] ?? null);
            $expires_at = missions_normalize_datetime($data['expires_at'] ?? null);
            $is_active = isset($data['is_active']) ? ((bool)$data['is_active'] ? 1 : 0) : 1;
            $notes = $data['notes'] ?? null;
            $audience_type = (string)($data['audience_type'] ?? 'global');
            $audience_value = $data['audience_value'] ?? null;
            $user_id = isset($data['user']) ? (int)$data['user'] : null;

            $errors = [];
            if ($mission_key === '') {
                $errors['mission_key'] = 'mission_key es obligatorio';
            }
            if ($url === '') {
                $errors['url'] = 'url es obligatoria';
            }

            if (!empty($errors)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Errores de validación', 'errors' => $errors]);
                return;
            }

            $sql = 'INSERT INTO api_missionexternallink (
                        mission_key, platform, url, start_at, expires_at,
                        is_active, notes, audience_type, audience_value, user_id,
                        created_at, updated_at
                    ) VALUES (
                        :mission_key, :platform, :url, :start_at, :expires_at,
                        :is_active, :notes, :audience_type, :audience_value, :user_id,
                        NOW(), NOW()
                    )';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':mission_key' => $mission_key,
                ':platform' => $platform,
                ':url' => $url,
                ':start_at' => $start_at,
                ':expires_at' => $expires_at,
                ':is_active' => $is_active,
                ':notes' => $notes,
                ':audience_type' => $audience_type,
                ':audience_value' => $audience_value,
                ':user_id' => $user_id,
            ]);

            $newId = (int)$pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM api_missionexternallink WHERE id = ?');
            $stmt->execute([$newId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $mapped = missions_map_link_row($row);

            echo json_encode($mapped);
            return;
        }

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido en /missions/links']);
        return;
    }

    // DETALLE / ACTUALIZACIÓN / ELIMINACIÓN: /missions/links/{id}/
    if ($seg1 === 'links' && $seg2 !== null && ctype_digit($seg2)) {
        $linkId = (int)$seg2;

        if ($method === 'PATCH') {
            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data) || empty($data)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nada que actualizar']);
                return;
            }

            $fields = [];
            $params = [];

            $allowed = ['mission_key', 'platform', 'url', 'start_at', 'expires_at', 'is_active', 'notes', 'audience_type', 'audience_value', 'user'];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    if ($field === 'start_at' || $field === 'expires_at') {
                        $value = missions_normalize_datetime($data[$field]);
                        $fields[] = "$field = ?";
                        $params[] = $value;
                    } elseif ($field === 'is_active') {
                        $fields[] = 'is_active = ?';
                        $params[] = $data[$field] ? 1 : 0;
                    } elseif ($field === 'user') {
                        $fields[] = 'user_id = ?';
                        $params[] = $data[$field] !== null ? (int)$data[$field] : null;
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
            $sql = 'UPDATE api_missionexternallink SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $params[] = $linkId;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $stmt = $pdo->prepare('SELECT * FROM api_missionexternallink WHERE id = ?');
            $stmt->execute([$linkId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Enlace no encontrado']);
                return;
            }

            $mapped = missions_map_link_row($row);
            echo json_encode($mapped);
            return;
        }

        if ($method === 'DELETE') {
            $stmt = $pdo->prepare('DELETE FROM api_missionexternallink WHERE id = ?');
            $stmt->execute([$linkId]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Enlace no encontrado']);
                return;
            }

            echo json_encode(['success' => true, 'message' => 'Enlace eliminado exitosamente']);
            return;
        }

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido en /missions/links/{id}']);
        return;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido en /missions']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de misiones',
        'error' => $e->getMessage(),
    ]);
}
