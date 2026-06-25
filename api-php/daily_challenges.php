<?php
/**
 * API para Retos Diarios (tabla api_dailychallengequestion)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'jwt-simple.php';

function daily_verify_jwt()
{
    if (!function_exists('getallheaders')) {
        return null;
    }
    $headers = getallheaders();
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

    return is_array($payload) ? (object)$payload : $payload;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('daily-challenges', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$seg1 = $parts[$index + 1] ?? null; // "admin" o null
$seg2 = $parts[$index + 2] ?? null; // id opcional

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    // =================== ENDPOINT PÚBLICO PARA ESTUDIANTES ===================
    // GET /daily-challenges/
    if ($method === 'GET' && ($seg1 === null || $seg1 === '')) {
        $stmt = $pdo->prepare("SELECT * FROM api_dailychallengequestion WHERE activo = 1 ORDER BY created_at DESC");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Barajar y limitar a 20 como en Django
        shuffle($rows);
        $rows = array_slice($rows, 0, 20);

        $data = [];
        foreach ($rows as $ch) {
            $opciones = [
                $ch['opcion_a'],
                $ch['opcion_b'],
                $ch['opcion_c'],
                $ch['opcion_d'],
            ];
            $opciones = array_values(array_filter($opciones, function ($opt) {
                return $opt !== null && $opt !== '';
            }));

            $correctIndex = 0;
            $mapa = ['A' => 0, 'B' => 1, 'C' => 2, 'D' => 3];
            if (isset($ch['respuesta_correcta']) && isset($mapa[$ch['respuesta_correcta']])) {
                $correctIndex = $mapa[$ch['respuesta_correcta']];
            }

            $data[] = [
                'id' => (int)$ch['id'],
                'question' => $ch['pregunta'],
                'options' => $opciones,
                'correct_answer' => $correctIndex,
                'explanation' => $ch['explicacion'] ?? '',
                'category' => $ch['categoria'],
                'level' => $ch['nivel'] ?? '',
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $data,
        ]);
        return;
    }

    // =================== ENDPOINTS ADMIN (CRUD) ===================
    // Antes solo se permitía rol 'admin'. Ahora permitimos a cualquier usuario autenticado
    // gestionar los retos diarios (crear/editar/eliminar), manteniendo la verificación de token.
    $user = daily_verify_jwt();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        return;
    }

    // LISTAR / CREAR: /daily-challenges/admin/
    if ($seg1 === 'admin' && ($seg2 === null || $seg2 === '')) {
        if ($method === 'GET') {
            $stmt = $pdo->prepare('SELECT * FROM api_dailychallengequestion ORDER BY created_at DESC');
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $rows,
            ]);
            return;
        }

        if ($method === 'POST') {
            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data)) {
                $data = [];
            }

            $pregunta = trim((string)($data['pregunta'] ?? ''));
            $categoria = (string)($data['categoria'] ?? 'general');
            $nivel = $data['nivel'] ?? null;
            $opcion_a = trim((string)($data['opcion_a'] ?? ''));
            $opcion_b = trim((string)($data['opcion_b'] ?? ''));
            $opcion_c = $data['opcion_c'] ?? null;
            $opcion_d = $data['opcion_d'] ?? null;
            $respuesta_correcta = (string)($data['respuesta_correcta'] ?? 'A');
            $explicacion = $data['explicacion'] ?? null;
            $activo = isset($data['activo']) ? (bool)$data['activo'] : true;

            $errors = [];
            if ($pregunta === '') {
                $errors['pregunta'] = 'La pregunta es obligatoria';
            }
            if ($opcion_a === '' || $opcion_b === '') {
                $errors['opciones'] = 'Las opciones A y B son obligatorias';
            }
            if (!in_array($respuesta_correcta, ['A', 'B', 'C', 'D'], true)) {
                $errors['respuesta_correcta'] = 'Respuesta correcta inválida';
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

            $sql = 'INSERT INTO api_dailychallengequestion (
                        pregunta, categoria, nivel,
                        opcion_a, opcion_b, opcion_c, opcion_d,
                        respuesta_correcta, explicacion, activo,
                        created_at
                    ) VALUES (
                        :pregunta, :categoria, :nivel,
                        :opcion_a, :opcion_b, :opcion_c, :opcion_d,
                        :respuesta_correcta, :explicacion, :activo,
                        NOW()
                    )';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':pregunta' => $pregunta,
                ':categoria' => $categoria,
                ':nivel' => $nivel,
                ':opcion_a' => $opcion_a,
                ':opcion_b' => $opcion_b,
                ':opcion_c' => $opcion_c,
                ':opcion_d' => $opcion_d,
                ':respuesta_correcta' => $respuesta_correcta,
                ':explicacion' => $explicacion,
                ':activo' => $activo ? 1 : 0,
            ]);

            $newId = (int)$pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM api_dailychallengequestion WHERE id = ?');
            $stmt->execute([$newId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $row,
            ]);
            return;
        }

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido en /daily-challenges/admin/']);
        return;
    }

    // DETALLE / ACTUALIZACIÓN / ELIMINACIÓN: /daily-challenges/admin/{id}/
    if ($seg1 === 'admin' && $seg2 !== null && ctype_digit($seg2)) {
        $id = (int)$seg2;

        $stmt = $pdo->prepare('SELECT * FROM api_dailychallengequestion WHERE id = ?');
        $stmt->execute([$id]);
        $challenge = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$challenge) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Reto no encontrado']);
            return;
        }

        if ($method === 'GET') {
            echo json_encode([
                'success' => true,
                'data' => $challenge,
            ]);
            return;
        }

        if ($method === 'PUT' || $method === 'PATCH') {
            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data)) {
                $data = [];
            }

            $fields = [];
            $params = [];
            $allowed = ['pregunta', 'categoria', 'nivel', 'opcion_a', 'opcion_b', 'opcion_c', 'opcion_d', 'respuesta_correcta', 'explicacion', 'activo'];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    if ($field === 'activo') {
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
                echo json_encode(['success' => false, 'message' => 'Nada que actualizar']);
                return;
            }

            $sql = 'UPDATE api_dailychallengequestion SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $params[] = $id;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $stmt = $pdo->prepare('SELECT * FROM api_dailychallengequestion WHERE id = ?');
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $row,
            ]);
            return;
        }

        if ($method === 'DELETE') {
            $stmt = $pdo->prepare('DELETE FROM api_dailychallengequestion WHERE id = ?');
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Reto eliminado correctamente',
            ]);
            return;
        }

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
        return;
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Ruta de retos diarios no encontrada']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de retos diarios',
        'error' => $e->getMessage(),
    ]);
}
