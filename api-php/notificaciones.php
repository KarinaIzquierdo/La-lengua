<?php
/**
 * API simple para notificaciones (tabla api_notificacion)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('notificaciones', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$segment1 = $parts[$index + 1] ?? null; // puede ser id, 'estudiante', 'crear', 'marcar-todas-leidas'
$segment2 = $parts[$index + 2] ?? null; // puede ser 'marcar-leida', 'marcar-todas-leidas'

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    if ($method === 'GET') {
        // /notificaciones/  -> listado general (profesor)
        // /notificaciones/estudiante/ -> listado para estudiante (por ahora vacío si no se especifica id)
        if ($segment1 === 'estudiante') {
            // opcionalmente ?estudiante_id=
            $estudianteId = isset($_GET['estudiante_id']) ? intval($_GET['estudiante_id']) : null;

            if ($estudianteId) {
                $stmt = $pdo->prepare('SELECT * FROM api_notificacion WHERE estudiante_relacionado_id = ?');
                $stmt->execute([$estudianteId]);
                $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $rows = [];
            }

            // Mapear columnas tipo COL X a nombres reales
            $mapped = [];
            foreach ($rows as $row) {
                if (isset($row['COL 1']) && $row['COL 1'] === 'id') {
                    continue;
                }
                if (isset($row['COL 1'])) {
                    $mapped[] = [
                        'id' => $row['COL 1'],
                        'tipo' => $row['COL 2'] ?? null,
                        'titulo' => $row['COL 3'] ?? null,
                        'mensaje' => $row['COL 4'] ?? null,
                        'prioridad' => $row['COL 5'] ?? null,
                        'leida' => $row['COL 6'] ?? null,
                        'created_at' => $row['COL 7'] ?? null,
                        'updated_at' => $row['COL 8'] ?? null,
                        'clase_relacionada_id' => $row['COL 9'] ?? null,
                        'estudiante_relacionado_id' => $row['COL 10'] ?? null,
                        'evaluacion_relacionada_id' => $row['COL 11'] ?? null,
                        'profesor_id' => $row['COL 12'] ?? null,
                    ];
                } else {
                    $mapped[] = $row;
                }
            }

            echo json_encode([
                'success' => true,
                'notificaciones' => $mapped,
                'total' => count($mapped)
            ]);
            return;
        }

        // Listado general (profesor)
        $stmt = $pdo->query('SELECT * FROM api_notificacion LIMIT 50');
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $mapped = [];
        foreach ($rows as $row) {
            if (isset($row['COL 1']) && $row['COL 1'] === 'id') {
                continue;
            }
            if (isset($row['COL 1'])) {
                $mapped[] = [
                    'id' => $row['COL 1'],
                    'tipo' => $row['COL 2'] ?? null,
                    'titulo' => $row['COL 3'] ?? null,
                    'mensaje' => $row['COL 4'] ?? null,
                    'prioridad' => $row['COL 5'] ?? null,
                    'leida' => $row['COL 6'] ?? null,
                    'created_at' => $row['COL 7'] ?? null,
                    'updated_at' => $row['COL 8'] ?? null,
                    'clase_relacionada_id' => $row['COL 9'] ?? null,
                    'estudiante_relacionado_id' => $row['COL 10'] ?? null,
                    'evaluacion_relacionada_id' => $row['COL 11'] ?? null,
                    'profesor_id' => $row['COL 12'] ?? null,
                ];
            } else {
                $mapped[] = $row;
            }
        }

        $noLeidas = array_reduce($mapped, function($c, $n) {
            return $c + ((isset($n['leida']) && !$n['leida']) ? 1 : 0);
        }, 0);

        echo json_encode([
            'success' => true,
            'notificaciones' => $mapped,
            'total' => count($mapped),
            'no_leidas' => $noLeidas
        ]);
        return;
    }

    if ($method === 'POST') {
        $inputRaw = file_get_contents('php://input');
        $input = $inputRaw ? json_decode($inputRaw, true) : [];

        // /notificaciones/crear/  -> crear notificación (desde profesorService)
        if ($segment1 === 'crear') {
            if (empty($input['profesor_id']) || empty($input['tipo']) || empty($input['titulo']) || empty($input['mensaje'])) {
                throw new Exception('Campos requeridos: profesor_id, tipo, titulo, mensaje');
            }

            $sql = 'INSERT INTO api_notificacion (tipo, titulo, mensaje, prioridad, leida, clase_relacionada_id, estudiante_relacionado_id, evaluacion_relacionada_id, profesor_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, 0, ?, ?, ?, ?, NOW(), NOW())';

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                $input['tipo'],
                $input['titulo'],
                $input['mensaje'],
                $input['prioridad'] ?? 'media',
                $input['clase_relacionada_id'] ?? null,
                $input['estudiante_relacionado_id'] ?? null,
                $input['evaluacion_relacionada_id'] ?? null,
                $input['profesor_id']
            ]);

            $newId = $pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM api_notificacion WHERE id = ?');
            $stmt->execute([$newId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            echo json_encode([
                'success' => true,
                'data' => $row,
                'message' => 'Notificación creada correctamente'
            ]);
            return;
        }

        // /notificaciones/marcar-todas-leidas/
        if ($segment1 === 'marcar-todas-leidas') {
            $pdo->exec('UPDATE api_notificacion SET leida = 1, updated_at = NOW() WHERE leida = 0');
            echo json_encode([
                'success' => true,
                'message' => 'Todas las notificaciones marcadas como leídas'
            ]);
            return;
        }

        // /notificaciones/{id}/marcar-leida/
        if (is_numeric($segment1) && $segment2 === 'marcar-leida') {
            $id = intval($segment1);
            $stmt = $pdo->prepare('UPDATE api_notificacion SET leida = 1, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$id]);
            echo json_encode([
                'success' => true,
                'message' => 'Notificación marcada como leída'
            ]);
            return;
        }

        // /notificaciones/estudiante/marcar-todas-leidas/ y similares
        if ($segment1 === 'estudiante') {
            if ($segment2 === 'marcar-todas-leidas') {
                $estudianteId = isset($input['estudiante_id']) ? intval($input['estudiante_id']) : null;
                if ($estudianteId) {
                    $stmt = $pdo->prepare('UPDATE api_notificacion SET leida = 1, updated_at = NOW() WHERE estudiante_relacionado_id = ?');
                    $stmt->execute([$estudianteId]);
                }
                echo json_encode(['success' => true, 'message' => 'Notificaciones del estudiante marcadas como leídas']);
                return;
            }

            if (is_numeric($segment2) && ($parts[$index + 3] ?? null) === 'marcar-leida') {
                $notifId = intval($segment2);
                $stmt = $pdo->prepare('UPDATE api_notificacion SET leida = 1, updated_at = NOW() WHERE id = ?');
                $stmt->execute([$notifId]);
                echo json_encode(['success' => true, 'message' => 'Notificación del estudiante marcada como leída']);
                return;
            }
        }

        http_response_code(400);
        echo json_encode([
            'success' => false,
            'message' => 'Acción no reconocida en notificaciones'
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
