<?php
/**
 * API para especializaciones (tabla api_especializacion)
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

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('especializaciones', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$next = $parts[$index + 1] ?? '';

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    if ($method === 'GET') {
        // GET /especializaciones/activas/ -> solo activas
        if ($next === 'activas') {
            $stmt = $pdo->prepare('SELECT id, nombre, descripcion, duracion, precio, activa, created_at, updated_at FROM api_especializacion WHERE activa = 1 ORDER BY nombre');
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $rows,
            ]);
            return;
        }

        // GET /especializaciones/ -> todas
        $stmt = $pdo->prepare('SELECT id, nombre, descripcion, duracion, precio, activa, created_at, updated_at FROM api_especializacion ORDER BY nombre');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $rows,
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido',
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
