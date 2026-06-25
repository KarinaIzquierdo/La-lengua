<?php
/**
 * API para bloques (tabla api_bloque)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'jwt-simple.php';

function bloques_verify_jwt()
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

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('bloques', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$idSeg = $parts[$index + 1] ?? null; // Actualmente solo usamos listado general

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    // Requerir JWT válido para acceder a bloques
    $user = bloques_verify_jwt();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        return;
    }

    // LISTAR TODOS LOS BLOQUES: GET /bloques/
    if ($method === 'GET' && ($idSeg === null || $idSeg === '')) {
        $sql = 'SELECT id, nombre, nivel, estado, grupo_color, horario_inicio, horario_fin,
                       cupo_maximo, activo, created_at, updated_at
                FROM api_bloque
                ORDER BY nivel, nombre';
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $bloques = [];
        foreach ($rows as $row) {
            $bloques[] = [
                'id' => (int)$row['id'],
                'nombre' => $row['nombre'],
                'nivel' => $row['nivel'],
                'estado' => $row['estado'],
                'grupo_color' => $row['grupo_color'],
                'horario_inicio' => $row['horario_inicio'],
                'horario_fin' => $row['horario_fin'],
                'cupo_maximo' => isset($row['cupo_maximo']) ? (int)$row['cupo_maximo'] : 0,
                'activo' => (bool)$row['activo'],
                'created_at' => $row['created_at'],
                'updated_at' => $row['updated_at'],
            ];
        }

        echo json_encode([
            'success' => true,
            'total' => count($bloques),
            'data' => $bloques,
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido en /bloques',
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de bloques',
        'error' => $e->getMessage(),
    ]);
}
