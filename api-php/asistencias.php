<?php
/**
 * API para asistencias (tabla api_asistencia)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('asistencias', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$idSegment = $parts[$index + 1] ?? null;
$id = (is_numeric($idSegment) ? intval($idSegment) : null);

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    if ($method === 'GET') {
        // GET /asistencias/ -> listar con filtros opcionales
        // ?estudiante=ID, ?clase=ID
        $where = [];
        $params = [];

        if (isset($_GET['estudiante']) && is_numeric($_GET['estudiante'])) {
            $where[] = 'estudiante_id = ?';
            $params[] = intval($_GET['estudiante']);
        }

        if (isset($_GET['clase']) && is_numeric($_GET['clase'])) {
            $where[] = 'clase_id = ?';
            $params[] = intval($_GET['clase']);
        }

        // Si se pide por ID específico /asistencias/{id}/
        if ($id !== null) {
            $where = ['id = ?'];
            $params = [$id];
        }

        $sql = 'SELECT a.*, u.first_name, u.last_name
                FROM api_asistencia a
                LEFT JOIN api_customuser u ON a.estudiante_id = u.id';
        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }
        $sql .= ' ORDER BY a.fecha DESC, a.id DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Añadir campo estudiante_nombre para comodidad del frontend
        foreach ($rows as &$row) {
            $first = isset($row['first_name']) ? $row['first_name'] : '';
            $last = isset($row['last_name']) ? $row['last_name'] : '';
            $row['estudiante_nombre'] = trim($first . ' ' . $last);
        }

        echo json_encode($rows);
        return;
    }

    if ($method === 'POST') {
        // Registrar nueva asistencia: { estudiante_id, clase_id?, fecha, estado, observaciones? }
        $inputRaw = file_get_contents('php://input');
        $data = $inputRaw ? json_decode($inputRaw, true) : [];

        if (empty($data['estudiante_id']) || empty($data['fecha']) || empty($data['estado'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Campos requeridos: estudiante_id, fecha, estado'
            ]);
            return;
        }

        $sql = 'INSERT INTO api_asistencia (fecha, estado, observaciones, created_at, updated_at, clase_id, estudiante_id)
                VALUES (?, ?, ?, NOW(), NOW(), ?, ?)';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            $data['fecha'],
            $data['estado'],
            $data['observaciones'] ?? null,
            $data['clase_id'] ?? null,
            $data['estudiante_id'],
        ]);

        $newId = $pdo->lastInsertId();
        $stmt = $pdo->prepare('SELECT * FROM api_asistencia WHERE id = ?');
        $stmt->execute([$newId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $row,
            'message' => 'Asistencia registrada correctamente'
        ]);
        return;
    }

    if ($method === 'PATCH') {
        // Actualizar asistencia existente: /asistencias/{id}/
        if ($id === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'ID de asistencia requerido']);
            return;
        }

        $inputRaw = file_get_contents('php://input');
        $data = $inputRaw ? json_decode($inputRaw, true) : [];

        if (empty($data['estado']) && empty($data['fecha']) && empty($data['observaciones'])) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'Nada que actualizar'
            ]);
            return;
        }

        $fields = [];
        $params = [];

        if (isset($data['estado'])) {
            $fields[] = 'estado = ?';
            $params[] = $data['estado'];
        }
        if (isset($data['fecha'])) {
            $fields[] = 'fecha = ?';
            $params[] = $data['fecha'];
        }
        if (array_key_exists('observaciones', $data)) {
            $fields[] = 'observaciones = ?';
            $params[] = $data['observaciones'];
        }

        $fields[] = 'updated_at = NOW()';

        $sql = 'UPDATE api_asistencia SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $id;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT * FROM api_asistencia WHERE id = ?');
        $stmt->execute([$id]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        echo json_encode([
            'success' => true,
            'data' => $row,
            'message' => 'Asistencia actualizada correctamente'
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}
