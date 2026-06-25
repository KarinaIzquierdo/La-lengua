<?php
/**
 * API para calificaciones y respuestas de evaluaciones
 * Basado en los endpoints de Django:
 * - /calificaciones/panel/
 * - /calificaciones/panel/calificar/
 * - /calificaciones/por-calificar/
 * - /calificaciones/calificadas/
 * - /calificaciones/{id}/
 * - /calificaciones/{id}/calificar/
 * - /calificaciones/{id}/actualizar/
 * - /student/respuestas/
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

function calificaciones_verificar_jwt() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
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

function calificaciones_map_respuesta($row) {
    if (!$row) return null;

    // Decodificar JSON de respuestas si existe
    $respuestasJson = [];
    if (isset($row['respuestas_json']) && $row['respuestas_json'] !== null && $row['respuestas_json'] !== '') {
        $decoded = json_decode($row['respuestas_json'], true);
        if (is_array($decoded)) {
            $respuestasJson = $decoded;
        }
    }

    // Construir URL pública para archivo_respuesta si solo tenemos ruta relativa
    $archivoUrl = null;
    if (!empty($row['archivo_respuesta'])) {
        $filePath = $row['archivo_respuesta'];
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        $baseUrl = $scheme . '://' . $host;

        if ($filePath[0] !== '/') {
            // Exponer archivos bajo /api/
            $filePath = '/api/' . ltrim($filePath, '/');
        }
        $archivoUrl = $baseUrl . $filePath;
    }

    return [
        'id' => isset($row['id']) ? (int)$row['id'] : null,
        'evaluacion' => isset($row['evaluacion_id']) ? (int)$row['evaluacion_id'] : null,
        'evaluacion_titulo' => $row['evaluacion_titulo'] ?? null,
        'evaluacion_tipo' => $row['evaluacion_tipo'] ?? null,
        'estudiante' => isset($row['estudiante_id']) ? (int)$row['estudiante_id'] : null,
        'estudiante_nombre' => $row['estudiante_nombre'] ?? null,
        'archivo_respuesta' => $archivoUrl,
        'respuestas_json' => $respuestasJson,
        'tiempo_gastado' => isset($row['tiempo_gastado']) ? (int)$row['tiempo_gastado'] : 0,
        'advertencias' => isset($row['advertencias']) ? (int)$row['advertencias'] : 0,
        'completado' => !empty($row['completado']),
        'fecha_envio' => $row['fecha_envio'] ?? null,
        'calificacion' => isset($row['calificacion']) && $row['calificacion'] !== null ? (float)$row['calificacion'] : null,
        'comentarios_profesor' => $row['comentarios_profesor'] ?? null,
        'fecha_calificacion' => $row['fecha_calificacion'] ?? null,
        'calificado_por' => isset($row['calificado_por_id']) ? (int)$row['calificado_por_id'] : null,
        'calificado_por_nombre' => $row['calificado_por_nombre'] ?? null,
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$uriPath = $_SERVER['REQUEST_URI'];
$parts = explode('/', trim($uriPath, '/'));

// Localizar los segmentos relevantes dentro de la ruta completa
$studentIndex = array_search('student', $parts);
$califIndex = array_search('calificaciones', $parts);

$root = '';
$seg1 = null; // para /calificaciones/... es panel, por-calificar, id, etc.
$seg2 = null;

if ($studentIndex !== false) {
    // Rutas tipo /api/index.php/student/respuestas/
    $root = 'student';
    $seg1 = $parts[$studentIndex + 1] ?? null;
    $seg2 = $parts[$studentIndex + 2] ?? null;
} elseif ($califIndex !== false) {
    // Rutas tipo /api/index.php/calificaciones/panel/
    $root = 'calificaciones';
    $seg1 = $parts[$califIndex + 1] ?? null;
    $seg2 = $parts[$califIndex + 2] ?? null;
} else {
    // Fallback defensivo: usar los primeros segmentos por si acaso
    $root = $parts[0] ?? '';
    $seg1 = $parts[1] ?? null;
    $seg2 = $parts[2] ?? null;
}

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $user = calificaciones_verificar_jwt();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit();
    }

    // === RUTA: /student/respuestas/ ===
    if ($root === 'student' && $seg1 === 'respuestas') {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
            exit();
        }

        $studentId = isset($user->user_id) ? (int)$user->user_id : 0;
        if ($studentId <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Usuario inválido en token']);
            exit();
        }

        $sql = 'SELECT r.*, e.titulo AS evaluacion_titulo, e.tipo AS evaluacion_tipo,
                       u.first_name, u.last_name, u.username
                FROM api_respuestaevaluacion r
                INNER JOIN api_evaluacion e ON r.evaluacion_id = e.id
                INNER JOIN api_customuser u ON r.estudiante_id = u.id
                WHERE r.estudiante_id = ?
                ORDER BY r.fecha_envio DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$studentId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = [];
        foreach ($rows as $row) {
            $nombre = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if ($nombre === '') {
                $nombre = $row['username'] ?? '';
            }
            $row['estudiante_nombre'] = $nombre;
            $data[] = calificaciones_map_respuesta($row);
        }

        echo json_encode([
            'success' => true,
            'data' => $data,
        ]);
        exit();
    }

    // A partir de aquí esperamos rutas /calificaciones/...
    if ($root !== 'calificaciones') {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado en calificaciones']);
        exit();
    }

    $esProfesor = (isset($user->role) && $user->role === 'profesor') || !empty($user->is_profesor);

    // === GET /calificaciones/panel/ ===
    if ($method === 'GET' && $seg1 === 'panel' && $seg2 === null) {
        if (!$esProfesor) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los profesores pueden acceder a esta función']);
            exit();
        }

        $profId = (int)($user->user_id ?? 0);
        $sql = 'SELECT 
                    e.id AS evaluacion_id,
                    e.titulo AS evaluacion_titulo,
                    e.tipo AS evaluacion_tipo,
                    m.customuser_id AS estudiante_id,
                    u.first_name, u.last_name, u.username,
                    r.id AS respuesta_id,
                    r.completado,
                    r.calificacion,
                    r.comentarios_profesor,
                    r.fecha_envio,
                    r.archivo_respuesta
                FROM api_evaluacion e
                INNER JOIN api_evaluacion_estudiantes_asignados m ON m.evaluacion_id = e.id
                INNER JOIN api_customuser u ON u.id = m.customuser_id
                LEFT JOIN api_respuestaevaluacion r 
                    ON r.evaluacion_id = e.id AND r.estudiante_id = u.id
                WHERE e.profesor_id = ? AND e.estado = "publicada"';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$profId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($rows as $row) {
            $nombre = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if ($nombre === '') {
                $nombre = $row['username'] ?? '';
            }

            $respuestaId = $row['respuesta_id'] !== null ? (int)$row['respuesta_id'] : null;
            $calificacion = $row['calificacion'] !== null ? (float)$row['calificacion'] : null;
            $tieneRespuesta = $respuestaId !== null && !empty($row['completado']);

            // Construir URL para archivo_respuesta si existe
            $archivoUrl = null;
            if (!empty($row['archivo_respuesta'])) {
                $filePath = $row['archivo_respuesta'];
                $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
                $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
                $baseUrl = $scheme . '://' . $host;
                if ($filePath[0] !== '/') {
                    $filePath = '/api/' . ltrim($filePath, '/');
                }
                $archivoUrl = $baseUrl . $filePath;
            }

            $items[] = [
                'evaluacion_id' => (int)$row['evaluacion_id'],
                'evaluacion_titulo' => $row['evaluacion_titulo'],
                'evaluacion_tipo' => $row['evaluacion_tipo'],
                'estudiante_id' => (int)$row['estudiante_id'],
                'estudiante_nombre' => $nombre,
                'respuesta_id' => $respuestaId,
                'tiene_respuesta' => $tieneRespuesta,
                'calificacion' => $calificacion,
                'comentarios_profesor' => $row['comentarios_profesor'] ?? null,
                'fecha_envio' => $row['fecha_envio'],
                'archivo_respuesta_url' => $archivoUrl,
            ];
        }

        echo json_encode([
            'success' => true,
            'items' => $items,
            'total' => count($items),
        ]);
        exit();
    }

    // === POST /calificaciones/panel/calificar/ ===
    if ($method === 'POST' && $seg1 === 'panel' && $seg2 === 'calificar') {
        if (!$esProfesor) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los profesores pueden calificar evaluaciones']);
            exit();
        }

        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $evaluacionId = isset($body['evaluacion_id']) ? (int)$body['evaluacion_id'] : 0;
        $estudianteId = isset($body['estudiante_id']) ? (int)$body['estudiante_id'] : 0;
        $calificacion = $body['calificacion'] ?? null;
        $comentarios = $body['comentarios_profesor'] ?? '';

        if (!$evaluacionId || !$estudianteId) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'evaluacion_id y estudiante_id son requeridos']);
            exit();
        }
        if ($calificacion === null) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'La calificación es requerida']);
            exit();
        }

        try {
            $calVal = (float)$calificacion;
            if ($calVal < 0 || $calVal > 100) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'La calificación debe estar entre 0 y 100']);
                exit();
            }
        } catch (Throwable $t) {
            http_response_code(400);
            echo json_encode(['success' => false, 'error' => 'La calificación debe ser un número válido']);
            exit();
        }

        // Verificar evaluación y estudiante
        $profId = (int)$user->user_id;
        $stmtEval = $pdo->prepare('SELECT id FROM api_evaluacion WHERE id = ? AND profesor_id = ?');
        $stmtEval->execute([$evaluacionId, $profId]);
        $evalRow = $stmtEval->fetch(PDO::FETCH_ASSOC);
        if (!$evalRow) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Evaluación no encontrada o sin permisos']);
            exit();
        }

        $stmtUser = $pdo->prepare('SELECT id FROM api_customuser WHERE id = ?');
        $stmtUser->execute([$estudianteId]);
        if (!$stmtUser->fetch(PDO::FETCH_ASSOC)) {
            http_response_code(404);
            echo json_encode(['success' => false, 'error' => 'Estudiante no encontrado']);
            exit();
        }

        // Crear o actualizar respuesta
        $stmt = $pdo->prepare('SELECT * FROM api_respuestaevaluacion WHERE evaluacion_id = ? AND estudiante_id = ?');
        $stmt->execute([$evaluacionId, $estudianteId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        $now = date('Y-m-d H:i:s');
        if ($row) {
            $upd = $pdo->prepare('UPDATE api_respuestaevaluacion 
                                   SET calificacion = ?, comentarios_profesor = ?, fecha_calificacion = ?, calificado_por_id = ?
                                   WHERE id = ?');
            $upd->execute([$calVal, $comentarios, $now, $profId, (int)$row['id']]);
            $respuestaId = (int)$row['id'];
        } else {
            $ins = $pdo->prepare('INSERT INTO api_respuestaevaluacion 
                (estudiante_id, evaluacion_id, archivo_respuesta, respuestas_json, tiempo_gastado, advertencias, completado, fecha_envio, calificacion, comentarios_profesor, fecha_calificacion, calificado_por_id)
                VALUES (?, ?, NULL, ?, 0, 0, 0, ?, ?, ?, ?, ?)' );
            $json = json_encode([]);
            $ins->execute([$estudianteId, $evaluacionId, $json, $now, $calVal, $comentarios, $now, $profId]);
            $respuestaId = (int)$pdo->lastInsertId();
        }

        // Devolver respuesta actualizada
        $stmtOut = $pdo->prepare('SELECT r.*, e.titulo AS evaluacion_titulo, e.tipo AS evaluacion_tipo,
                                         u.first_name, u.last_name, u.username,
                                         cp.first_name AS cp_first, cp.last_name AS cp_last, cp.username AS cp_username
                                  FROM api_respuestaevaluacion r
                                  INNER JOIN api_evaluacion e ON r.evaluacion_id = e.id
                                  INNER JOIN api_customuser u ON r.estudiante_id = u.id
                                  LEFT JOIN api_customuser cp ON r.calificado_por_id = cp.id
                                  WHERE r.id = ?');
        $stmtOut->execute([$respuestaId]);
        $respRow = $stmtOut->fetch(PDO::FETCH_ASSOC);

        if ($respRow) {
            $nombreEst = trim(($respRow['first_name'] ?? '') . ' ' . ($respRow['last_name'] ?? ''));
            if ($nombreEst === '') $nombreEst = $respRow['username'] ?? '';
            $respRow['estudiante_nombre'] = $nombreEst;

            $nombreCP = trim(($respRow['cp_first'] ?? '') . ' ' . ($respRow['cp_last'] ?? ''));
            if ($nombreCP === '') $nombreCP = $respRow['cp_username'] ?? '';
            $respRow['calificado_por_nombre'] = $nombreCP;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Evaluación calificada exitosamente',
            'respuesta' => $respRow ? calificaciones_map_respuesta($respRow) : null,
        ]);
        exit();
    }

    // === GET /calificaciones/por-calificar/ ===
    if ($method === 'GET' && $seg1 === 'por-calificar') {
        if (!$esProfesor) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los profesores pueden acceder a esta función']);
            exit();
        }

        $profId = (int)$user->user_id;
        $sql = 'SELECT r.*, e.titulo AS evaluacion_titulo, e.tipo AS evaluacion_tipo,
                       u.first_name, u.last_name, u.username
                FROM api_respuestaevaluacion r
                INNER JOIN api_evaluacion e ON r.evaluacion_id = e.id
                INNER JOIN api_customuser u ON r.estudiante_id = u.id
                WHERE e.profesor_id = ? AND r.completado = 1 AND r.calificacion IS NULL
                ORDER BY r.fecha_envio DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$profId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($rows as $row) {
            $nombre = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if ($nombre === '') $nombre = $row['username'] ?? '';
            $row['estudiante_nombre'] = $nombre;
            $items[] = calificaciones_map_respuesta($row);
        }

        echo json_encode([
            'success' => true,
            'respuestas' => $items,
            'total' => count($items),
        ]);
        exit();
    }

    // === GET /calificaciones/calificadas/ ===
    if ($method === 'GET' && $seg1 === 'calificadas') {
        if (!$esProfesor) {
            http_response_code(403);
            echo json_encode(['success' => false, 'error' => 'Solo los profesores pueden acceder a esta función']);
            exit();
        }

        $profId = (int)$user->user_id;
        $sql = 'SELECT r.*, e.titulo AS evaluacion_titulo, e.tipo AS evaluacion_tipo,
                       u.first_name, u.last_name, u.username,
                       cp.first_name AS cp_first, cp.last_name AS cp_last, cp.username AS cp_username
                FROM api_respuestaevaluacion r
                INNER JOIN api_evaluacion e ON r.evaluacion_id = e.id
                INNER JOIN api_customuser u ON r.estudiante_id = u.id
                LEFT JOIN api_customuser cp ON r.calificado_por_id = cp.id
                WHERE e.profesor_id = ? AND r.completado = 1 AND r.calificacion IS NOT NULL
                ORDER BY r.fecha_calificacion DESC';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$profId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $items = [];
        foreach ($rows as $row) {
            $nombre = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if ($nombre === '') $nombre = $row['username'] ?? '';
            $row['estudiante_nombre'] = $nombre;

            $nombreCP = trim(($row['cp_first'] ?? '') . ' ' . ($row['cp_last'] ?? ''));
            if ($nombreCP === '') $nombreCP = $row['cp_username'] ?? '';
            $row['calificado_por_nombre'] = $nombreCP;

            $items[] = calificaciones_map_respuesta($row);
        }

        echo json_encode([
            'success' => true,
            'respuestas' => $items,
            'total' => count($items),
        ]);
        exit();
    }

    // A partir de aquí: rutas con ID de respuesta, por ejemplo /calificaciones/{id}/...
    if ($seg1 !== null && ctype_digit($seg1)) {
        $respuestaId = (int)$seg1;
        $accion = $seg2; // puede ser null, 'calificar', 'actualizar'

        // GET /calificaciones/{id}/ - detalle
        if ($method === 'GET' && $accion === null) {
            if (!$esProfesor) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Solo los profesores pueden acceder a esta función']);
                exit();
            }

            $sql = 'SELECT r.*, e.titulo AS evaluacion_titulo, e.tipo AS evaluacion_tipo,
                           u.first_name, u.last_name, u.username,
                           cp.first_name AS cp_first, cp.last_name AS cp_last, cp.username AS cp_username
                    FROM api_respuestaevaluacion r
                    INNER JOIN api_evaluacion e ON r.evaluacion_id = e.id
                    INNER JOIN api_customuser u ON r.estudiante_id = u.id
                    LEFT JOIN api_customuser cp ON r.calificado_por_id = cp.id
                    WHERE r.id = ?';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([$respuestaId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Respuesta no encontrada']);
                exit();
            }

            // Verificar que la evaluación pertenece al profesor actual
            $profId = (int)$user->user_id;
            $stmtChk = $pdo->prepare('SELECT profesor_id FROM api_evaluacion WHERE id = ?');
            $stmtChk->execute([(int)$row['evaluacion_id']]);
            $ev = $stmtChk->fetch(PDO::FETCH_ASSOC);
            if (!$ev || (int)$ev['profesor_id'] !== $profId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'No tienes permiso para ver esta respuesta']);
                exit();
            }

            $nombre = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));
            if ($nombre === '') $nombre = $row['username'] ?? '';
            $row['estudiante_nombre'] = $nombre;

            $nombreCP = trim(($row['cp_first'] ?? '') . ' ' . ($row['cp_last'] ?? ''));
            if ($nombreCP === '') $nombreCP = $row['cp_username'] ?? '';
            $row['calificado_por_nombre'] = $nombreCP;

            echo json_encode([
                'success' => true,
                'respuesta' => calificaciones_map_respuesta($row),
            ]);
            exit();
        }

        // POST /calificaciones/{id}/calificar/ - calificar_respuesta
        if ($method === 'POST' && $accion === 'calificar') {
            if (!$esProfesor) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Solo los profesores pueden calificar evaluaciones']);
                exit();
            }

            $body = json_decode(file_get_contents('php://input'), true) ?: [];
            $calificacion = $body['calificacion'] ?? null;
            $comentarios = $body['comentarios_profesor'] ?? '';

            if ($calificacion === null) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'La calificación es requerida']);
                exit();
            }
            try {
                $calVal = (float)$calificacion;
                if ($calVal < 0 || $calVal > 100) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'La calificación debe estar entre 0 y 100']);
                    exit();
                }
            } catch (Throwable $t) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'La calificación debe ser un número válido']);
                exit();
            }

            $stmt = $pdo->prepare('SELECT * FROM api_respuestaevaluacion WHERE id = ?');
            $stmt->execute([$respuestaId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Respuesta no encontrada']);
                exit();
            }

            // Verificar profesor de la evaluación
            $profId = (int)$user->user_id;
            $stmtChk = $pdo->prepare('SELECT profesor_id FROM api_evaluacion WHERE id = ?');
            $stmtChk->execute([(int)$row['evaluacion_id']]);
            $ev = $stmtChk->fetch(PDO::FETCH_ASSOC);
            if (!$ev || (int)$ev['profesor_id'] !== $profId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'No tienes permiso para calificar esta evaluación']);
                exit();
            }

            $now = date('Y-m-d H:i:s');
            $upd = $pdo->prepare('UPDATE api_respuestaevaluacion 
                                   SET calificacion = ?, comentarios_profesor = ?, fecha_calificacion = ?, calificado_por_id = ?
                                   WHERE id = ?');
            $upd->execute([$calVal, $comentarios, $now, $profId, $respuestaId]);

            // Devolver detalle actualizado
            $sql = 'SELECT r.*, e.titulo AS evaluacion_titulo, e.tipo AS evaluacion_tipo,
                           u.first_name, u.last_name, u.username,
                           cp.first_name AS cp_first, cp.last_name AS cp_last, cp.username AS cp_username
                    FROM api_respuestaevaluacion r
                    INNER JOIN api_evaluacion e ON r.evaluacion_id = e.id
                    INNER JOIN api_customuser u ON r.estudiante_id = u.id
                    LEFT JOIN api_customuser cp ON r.calificado_por_id = cp.id
                    WHERE r.id = ?';
            $stmt2 = $pdo->prepare($sql);
            $stmt2->execute([$respuestaId]);
            $row2 = $stmt2->fetch(PDO::FETCH_ASSOC);

            if ($row2) {
                $nombre = trim(($row2['first_name'] ?? '') . ' ' . ($row2['last_name'] ?? ''));
                if ($nombre === '') $nombre = $row2['username'] ?? '';
                $row2['estudiante_nombre'] = $nombre;

                $nombreCP = trim(($row2['cp_first'] ?? '') . ' ' . ($row2['cp_last'] ?? ''));
                if ($nombreCP === '') $nombreCP = $row2['cp_username'] ?? '';
                $row2['calificado_por_nombre'] = $nombreCP;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Evaluación calificada exitosamente',
                'respuesta' => $row2 ? calificaciones_map_respuesta($row2) : null,
            ]);
            exit();
        }

        // PUT /calificaciones/{id}/actualizar/ - actualizar_calificacion
        if ($method === 'PUT' && $accion === 'actualizar') {
            if (!$esProfesor) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'Solo los profesores pueden actualizar calificaciones']);
                exit();
            }

            $body = json_decode(file_get_contents('php://input'), true) ?: [];
            $nuevaCalificacion = $body['calificacion'] ?? null;
            $nuevosComentarios = $body['comentarios_profesor'] ?? null;

            $stmt = $pdo->prepare('SELECT * FROM api_respuestaevaluacion WHERE id = ?');
            $stmt->execute([$respuestaId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'error' => 'Respuesta no encontrada']);
                exit();
            }

            $profId = (int)$user->user_id;
            $stmtChk = $pdo->prepare('SELECT profesor_id FROM api_evaluacion WHERE id = ?');
            $stmtChk->execute([(int)$row['evaluacion_id']]);
            $ev = $stmtChk->fetch(PDO::FETCH_ASSOC);
            if (!$ev || (int)$ev['profesor_id'] !== $profId) {
                http_response_code(403);
                echo json_encode(['success' => false, 'error' => 'No tienes permiso para actualizar esta calificación']);
                exit();
            }

            if ($row['calificacion'] === null) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Esta respuesta no ha sido calificada aún']);
                exit();
            }

            $setParts = [];
            $params = [];

            if ($nuevaCalificacion !== null) {
                try {
                    $calVal = (float)$nuevaCalificacion;
                    if ($calVal < 0 || $calVal > 100) {
                        http_response_code(400);
                        echo json_encode(['success' => false, 'error' => 'La calificación debe estar entre 0 y 100']);
                        exit();
                    }
                    $setParts[] = 'calificacion = ?';
                    $params[] = $calVal;
                } catch (Throwable $t) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'error' => 'La calificación debe ser un número válido']);
                    exit();
                }
            }

            if ($nuevosComentarios !== null) {
                $setParts[] = 'comentarios_profesor = ?';
                $params[] = $nuevosComentarios;
            }

            $setParts[] = 'fecha_calificacion = ?';
            $params[] = date('Y-m-d H:i:s');
            $setParts[] = 'calificado_por_id = ?';
            $params[] = $profId;

            $sqlUpd = 'UPDATE api_respuestaevaluacion SET ' . implode(', ', $setParts) . ' WHERE id = ?';
            $params[] = $respuestaId;
            $upd = $pdo->prepare($sqlUpd);
            $upd->execute($params);

            // Devolver detalle actualizado
            $sql = 'SELECT r.*, e.titulo AS evaluacion_titulo, e.tipo AS evaluacion_tipo,
                           u.first_name, u.last_name, u.username,
                           cp.first_name AS cp_first, cp.last_name AS cp_last, cp.username AS cp_username
                    FROM api_respuestaevaluacion r
                    INNER JOIN api_evaluacion e ON r.evaluacion_id = e.id
                    INNER JOIN api_customuser u ON r.estudiante_id = u.id
                    LEFT JOIN api_customuser cp ON r.calificado_por_id = cp.id
                    WHERE r.id = ?';
            $stmt2 = $pdo->prepare($sql);
            $stmt2->execute([$respuestaId]);
            $row2 = $stmt2->fetch(PDO::FETCH_ASSOC);

            if ($row2) {
                $nombre = trim(($row2['first_name'] ?? '') . ' ' . ($row2['last_name'] ?? ''));
                if ($nombre === '') $nombre = $row2['username'] ?? '';
                $row2['estudiante_nombre'] = $nombre;

                $nombreCP = trim(($row2['cp_first'] ?? '') . ' ' . ($row2['cp_last'] ?? ''));
                if ($nombreCP === '') $nombreCP = $row2['cp_username'] ?? '';
                $row2['calificado_por_nombre'] = $nombreCP;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Calificación actualizada exitosamente',
                'respuesta' => $row2 ? calificaciones_map_respuesta($row2) : null,
            ]);
            exit();
        }
    }

    // Si llegó aquí, no se reconoció la ruta
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Ruta de calificaciones no encontrada']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error interno del servidor en calificaciones',
        'error' => $e->getMessage(),
    ]);
}
