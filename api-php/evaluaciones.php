<?php
/**
 * API Endpoints para Evaluaciones
 * Maneja todas las operaciones CRUD para la tabla api_evaluacion
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';
require_once 'jwt-simple.php';

// Función para verificar JWT usando las funciones simples usadas en auth-simple.php
function verificarJWT() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (!isset($headers['Authorization']) && isset($headers['authorization'])) {
        $headers['Authorization'] = $headers['authorization'];
    }
    if (!isset($headers['Authorization'])) {
        return null;
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);

    // auth-simple.php genera tokens con jwt_encode_simple, por lo que aquí usamos jwt_decode_simple
    $payload = jwt_decode_simple($token);
    if ($payload === false || $payload === null) {
        return null;
    }

    // Devolver como objeto para compatibilidad con el código existente ($user->user_id, $user->role)
    return (object) $payload;
}

// Helper: obtener IDs de estudiantes asignados a una evaluación (many-to-many)
function obtenerEstudiantesAsignados($pdo, $evaluacionId) {
    $stmt = $pdo->prepare("SELECT customuser_id FROM api_evaluacion_estudiantes_asignados WHERE evaluacion_id = ?");
    $stmt->execute([$evaluacionId]);
    $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
    $ids = [];
    foreach ($rows as $sid) {
        $sidInt = intval($sid);
        if ($sidInt > 0) {
            $ids[$sidInt] = $sidInt; // usar ID como clave para evitar duplicados
        }
    }
    return array_values($ids);
}

// Helper: sincronizar estudiantes_asignados para una evaluación
function sincronizarEstudiantesAsignados($pdo, $evaluacionId, $estudiantesIds) {
    if (!is_array($estudiantesIds)) {
        return;
    }

    $idsLimpios = [];
    foreach ($estudiantesIds as $sid) {
        $sidInt = intval($sid);
        if ($sidInt > 0) {
            $idsLimpios[$sidInt] = $sidInt;
        }
    }

    // Borrar asignaciones actuales
    $del = $pdo->prepare('DELETE FROM api_evaluacion_estudiantes_asignados WHERE evaluacion_id = ?');
    $del->execute([$evaluacionId]);

    if (empty($idsLimpios)) {
        return;
    }

    // Insertar nuevas asignaciones
    $ins = $pdo->prepare('INSERT INTO api_evaluacion_estudiantes_asignados (evaluacion_id, customuser_id) VALUES (?, ?)');
    foreach ($idsLimpios as $sidInt) {
        $ins->execute([$evaluacionId, $sidInt]);
    }
}

// Obtener método y ruta
$method = $_SERVER['REQUEST_METHOD'];
 $path = $_SERVER['REQUEST_URI'];
 $path_parts = explode('/', trim($path, '/'));

 // Buscar 'evaluaciones' en la ruta
 $evaluaciones_index = array_search('evaluaciones', $path_parts);
 if ($evaluaciones_index === false) {
     http_response_code(404);
     echo json_encode(['error' => 'Endpoint no encontrado']);
     exit();
 }

 // Determinar si la ruta viene con prefijo /student/evaluaciones/
 $isStudentContext = ($evaluaciones_index > 0 && $path_parts[$evaluaciones_index - 1] === 'student');

 // El segmento inmediatamente después de "evaluaciones" puede ser un ID o una palabra (students, etc.)
 $rawId = $path_parts[$evaluaciones_index + 1] ?? null;
 $id = ($rawId !== null && ctype_digit($rawId)) ? intval($rawId) : null;

 // Posible acción adicional o sufijo, por ejemplo: /evaluaciones/{id}/publish/ o /evaluaciones/{id}/update/ o /evaluaciones/{id}/delete/
 $action = $path_parts[$evaluaciones_index + 2] ?? null;

// Normalizar acciones "update" y "delete" para que el backend acepte las rutas del frontend
if ($action === 'update') {
    // El frontend usa /evaluaciones/{id}/update/ con PUT, lo mapeamos internamente como simple PUT /evaluaciones/{id}
    $action = null;
}
if ($action === 'delete') {
    // El frontend usa /evaluaciones/{id}/delete/ con DELETE, lo mapeamos a DELETE /evaluaciones/{id}
    $action = null;
}

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    switch ($method) {
        case 'GET':
            // /student/evaluaciones/ -> evaluaciones asignadas al estudiante autenticado
            if ($isStudentContext && !$id && !$action) {
                $user = verificarJWT();
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token inválido']);
                    exit();
                }

                $studentId = intval($user->user_id ?? 0);
                if ($studentId <= 0) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Usuario inválido en token']);
                    exit();
                }

                // Obtener solo evaluaciones "publicadas" asignadas a este estudiante
                $sql = "SELECT e.*
                        FROM api_evaluacion e
                        INNER JOIN api_evaluacion_estudiantes_asignados m
                            ON m.evaluacion_id = e.id
                        WHERE m.customuser_id = ?
                          AND e.estado = 'publicada'
                        ORDER BY e.created_at DESC";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$studentId]);
                $evaluaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'data' => $evaluaciones
                ]);
                break;
            }

            // GET /evaluaciones/{id}/download/ - Descargar archivo de evaluación para estudiante autenticado
            if ($id && $action === 'download') {
                $user = verificarJWT();
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token inválido']);
                    exit();
                }

                $studentId = intval($user->user_id ?? 0);
                if ($studentId <= 0) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Usuario inválido en token']);
                    exit();
                }

                // Verificar que la evaluación existe, está publicada y asignada al estudiante
                $sql = "SELECT e.archivo
                        FROM api_evaluacion e
                        INNER JOIN api_evaluacion_estudiantes_asignados m
                            ON m.evaluacion_id = e.id
                        WHERE e.id = ?
                          AND m.customuser_id = ?
                          AND e.estado = 'publicada'
                        LIMIT 1";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $studentId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$row) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Evaluación no encontrada o sin acceso']);
                    exit();
                }

                if (empty($row['archivo'])) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Esta evaluación no tiene archivo adjunto']);
                    exit();
                }

                $relativePath = $row['archivo'];
                $filePath = __DIR__ . '/' . ltrim($relativePath, '/');

                if (!file_exists($filePath)) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Archivo no encontrado en el servidor']);
                    exit();
                }

                $filename = basename($filePath);

                // Sobrescribir Content-Type para enviar archivo binario
                if (function_exists('header_remove')) {
                    @header_remove('Content-Type');
                }
                header('Content-Type: application/octet-stream');
                header('Content-Disposition: attachment; filename="' . $filename . '"');
                header('Content-Length: ' . filesize($filePath));

                readfile($filePath);
                exit();
            }

            if ($id) {
                // GET /evaluaciones/{id} - Obtener una evaluación específica
                $stmt = $pdo->prepare("SELECT * FROM api_evaluacion WHERE id = ?");
                $stmt->execute([$id]);
                $evaluacion = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($evaluacion) {
                    // Adjuntar IDs de estudiantes asignados similar a Django
                    if (isset($evaluacion['id'])) {
                        $evaluacion['estudiantes_asignados'] = obtenerEstudiantesAsignados($pdo, (int)$evaluacion['id']);
                    } else {
                        $evaluacion['estudiantes_asignados'] = [];
                    }

                    echo json_encode([
                        'success' => true,
                        'data' => $evaluacion
                    ]);
                } else {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Evaluación no encontrada'
                    ]);
                }
            } else {
                // GET /evaluaciones - Listar todas las evaluaciones
                $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
                $limit = isset($_GET['limit']) ? min(100, max(1, intval($_GET['limit']))) : 10;
                $offset = ($page - 1) * $limit;
                
                // Filtros opcionales
                $where = [];
                $params = [];
                
                if (isset($_GET['tipo'])) {
                    $where[] = "tipo = ?";
                    $params[] = $_GET['tipo'];
                }
                
                if (isset($_GET['estado'])) {
                    $where[] = "estado = ?";
                    $params[] = $_GET['estado'];
                }
                
                if (isset($_GET['profesor_id'])) {
                    $where[] = "profesor_id = ?";
                    $params[] = intval($_GET['profesor_id']);
                }
                
                $where_clause = $where ? 'WHERE ' . implode(' AND ', $where) : '';
                
                // Contar total
                $count_sql = "SELECT COUNT(*) as total FROM api_evaluacion $where_clause";
                $count_stmt = $pdo->prepare($count_sql);
                $count_stmt->execute($params);
                $total = $count_stmt->fetch(PDO::FETCH_ASSOC)['total'];
                
                // Obtener datos
                $sql = "SELECT * FROM api_evaluacion $where_clause ORDER BY created_at DESC LIMIT $limit OFFSET $offset";
                $stmt = $pdo->prepare($sql);
                $stmt->execute($params);
                $evaluaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);

                // Adjuntar estudiantes_asignados para cada evaluación
                foreach ($evaluaciones as &$ev) {
                    if (isset($ev['id'])) {
                        $ev['estudiantes_asignados'] = obtenerEstudiantesAsignados($pdo, (int)$ev['id']);
                    } else {
                        $ev['estudiantes_asignados'] = [];
                    }
                }
                unset($ev);

                echo json_encode([
                    'success' => true,
                    'data' => $evaluaciones,
                    'pagination' => [
                        'page' => $page,
                        'limit' => $limit,
                        'total' => intval($total),
                        'pages' => ceil($total / $limit)
                    ]
                ]);
            }
            break;
            
        case 'POST':
            // POST /evaluaciones/{id}/publish/ -> publicar / despublicar
            if ($id && $action === 'publish') {
                $user = verificarJWT();
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token inválido']);
                    exit();
                }

                // Obtener la evaluación
                $stmt = $pdo->prepare("SELECT * FROM api_evaluacion WHERE id = ?");
                $stmt->execute([$id]);
                $evaluacion = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$evaluacion) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Evaluación no encontrada']);
                    exit();
                }

                // Verificar permisos: solo admin o profesor pueden publicar/cambiar estado
                if (!isset($user->role) || !in_array($user->role, ['admin', 'profesor'], true)) {
                    http_response_code(403);
                    echo json_encode(['success' => false, 'message' => 'Sin permisos para publicar esta evaluación']);
                    exit();
                }

                // Toggle de estado: borrador/publicada
                $nuevoEstado = ($evaluacion['estado'] === 'publicada') ? 'borrador' : 'publicada';

                // Determinar el profesor propietario cuando se publica/despublica
                // Regla: si quien publica es profesor, la evaluación pasa a ser suya
                //        si es admin, se mantiene el profesor_id actual
                $profesorId = isset($evaluacion['profesor_id']) ? (int)$evaluacion['profesor_id'] : 0;
                if (isset($user->role) && $user->role === 'profesor') {
                    $profesorId = isset($user->user_id) ? (int)$user->user_id : $profesorId;
                }

                $stmt = $pdo->prepare("UPDATE api_evaluacion SET estado = ?, profesor_id = ?, updated_at = NOW() WHERE id = ?");
                $stmt->execute([$nuevoEstado, $profesorId, $id]);

                // Devolver evaluación actualizada
                $stmt = $pdo->prepare("SELECT * FROM api_evaluacion WHERE id = ?");
                $stmt->execute([$id]);
                $evaluacion_actualizada = $stmt->fetch(PDO::FETCH_ASSOC);

                echo json_encode([
                    'success' => true,
                    'message' => 'Estado actualizado correctamente',
                    'data' => $evaluacion_actualizada
                ]);
                break;
            }

            // POST /evaluaciones/{id}/upload-respuesta/ -> subir respuesta/tarea del estudiante
            if ($id && $action === 'upload-respuesta') {
                $user = verificarJWT();
                if (!$user) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token inválido']);
                    exit();
                }

                $studentId = intval($user->user_id ?? 0);
                if ($studentId <= 0) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Usuario inválido en token']);
                    exit();
                }

                // Verificar que la evaluación esté publicada y asignada al estudiante
                $sql = "SELECT e.id
                        FROM api_evaluacion e
                        INNER JOIN api_evaluacion_estudiantes_asignados m
                            ON m.evaluacion_id = e.id
                        WHERE e.id = ?
                          AND m.customuser_id = ?
                          AND e.estado = 'publicada'
                        LIMIT 1";
                $stmt = $pdo->prepare($sql);
                $stmt->execute([$id, $studentId]);
                $evalRow = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$evalRow) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Evaluación no encontrada o sin acceso']);
                    exit();
                }

                $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
                $comentarios = '';

                if (stripos($contentType, 'multipart/form-data') !== false) {
                    $comentarios = $_POST['comentarios'] ?? ($_POST['comentarios_profesor'] ?? '');
                } else {
                    $body = json_decode(file_get_contents('php://input'), true) ?: [];
                    if (is_array($body)) {
                        $comentarios = $body['comentarios'] ?? ($body['comentarios_profesor'] ?? '');
                    }
                }

                $uploadedPath = null;
                if (!empty($_FILES['archivo_respuesta']) && isset($_FILES['archivo_respuesta']['error']) && $_FILES['archivo_respuesta']['error'] === UPLOAD_ERR_OK) {
                    $tmpName = $_FILES['archivo_respuesta']['tmp_name'];
                    $origName = basename($_FILES['archivo_respuesta']['name']);
                    $ext = pathinfo($origName, PATHINFO_EXTENSION);
                    $safeName = uniqid('resp_', true) . ($ext ? ('.' . $ext) : '');

                    $uploadDir = __DIR__ . '/uploads/respuestas/';
                    if (!is_dir($uploadDir)) {
                        @mkdir($uploadDir, 0775, true);
                    }

                    $destPath = $uploadDir . $safeName;
                    if (!move_uploaded_file($tmpName, $destPath)) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'No se pudo guardar el archivo de respuesta']);
                        exit();
                    }

                    $uploadedPath = 'uploads/respuestas/' . $safeName;
                }

                // Buscar si ya existe una respuesta para esta evaluación y estudiante
                $stmt = $pdo->prepare('SELECT * FROM api_respuestaevaluacion WHERE evaluacion_id = ? AND estudiante_id = ?');
                $stmt->execute([$id, $studentId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);

                $now = date('Y-m-d H:i:s');

                if ($row) {
                    $fields = [];
                    $params = [];

                    if ($uploadedPath !== null) {
                        $fields[] = 'archivo_respuesta = ?';
                        $params[] = $uploadedPath;
                    }

                    if ($comentarios !== '') {
                        $fields[] = 'comentarios_profesor = ?';
                        $params[] = $comentarios;
                    }

                    $fields[] = 'completado = 1';
                    $fields[] = 'fecha_envio = ?';
                    $params[] = $now;

                    if (!empty($fields)) {
                        $sqlUpd = 'UPDATE api_respuestaevaluacion SET ' . implode(', ', $fields) . ' WHERE id = ?';
                        $params[] = (int)$row['id'];
                        $upd = $pdo->prepare($sqlUpd);
                        $upd->execute($params);
                    }

                    $respuestaId = (int)$row['id'];
                } else {
                    $sqlIns = 'INSERT INTO api_respuestaevaluacion (
                                    estudiante_id, evaluacion_id, archivo_respuesta,
                                    respuestas_json, tiempo_gastado, advertencias,
                                    completado, fecha_envio, calificacion,
                                    comentarios_profesor, fecha_calificacion, calificado_por_id
                                ) VALUES (
                                    ?, ?, ?, ?, 0, 0, 1, ?, NULL, ?, NULL, NULL
                                )';
                    $json = json_encode([]);
                    $ins = $pdo->prepare($sqlIns);
                    $ins->execute([
                        $studentId,
                        $id,
                        $uploadedPath,
                        $json,
                        $now,
                        $comentarios,
                    ]);

                    $respuestaId = (int)$pdo->lastInsertId();
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Respuesta subida exitosamente',
                    'respuesta_id' => $respuestaId,
                ]);
                break;
            }

            // POST /evaluaciones - Crear nueva evaluación
            $user = verificarJWT();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Token inválido']);
                exit();
            }

            $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
            $input = null;
            $archivoPath = null;
            $estudiantesAsignados = null;

            if (stripos($contentType, 'multipart/form-data') !== false) {
                // FormData: leer desde $_POST y $_FILES
                $titulo = isset($_POST['titulo']) ? trim((string)$_POST['titulo']) : '';
                $descripcion = isset($_POST['descripcion']) ? (string)$_POST['descripcion'] : null;
                $tipo = isset($_POST['tipo']) ? (string)$_POST['tipo'] : 'quiz';
                $estado = isset($_POST['estado']) ? (string)$_POST['estado'] : 'borrador';
                $fecha_limite = isset($_POST['fecha_limite']) && $_POST['fecha_limite'] !== '' ? (string)$_POST['fecha_limite'] : null;

                // Subida de archivo de evaluación si se envía
                if (!empty($_FILES['archivo']) && isset($_FILES['archivo']['error']) && $_FILES['archivo']['error'] === UPLOAD_ERR_OK) {
                    $tmpName = $_FILES['archivo']['tmp_name'];
                    $origName = basename($_FILES['archivo']['name']);
                    $ext = pathinfo($origName, PATHINFO_EXTENSION);
                    $safeName = uniqid('eval_', true) . ($ext ? ('.' . $ext) : '');

                    $uploadDir = __DIR__ . '/uploads/evaluaciones/';
                    if (!is_dir($uploadDir)) {
                        @mkdir($uploadDir, 0775, true);
                    }

                    $destPath = $uploadDir . $safeName;
                    if (!move_uploaded_file($tmpName, $destPath)) {
                        http_response_code(500);
                        echo json_encode(['success' => false, 'message' => 'No se pudo guardar el archivo de evaluación']);
                        exit();
                    }

                    // Ruta relativa para guardar en la BD
                    $archivoPath = 'uploads/evaluaciones/' . $safeName;
                }

                // estudiantes_asignados puede venir como JSON en un solo campo
                if (isset($_POST['estudiantes_asignados'])) {
                    $raw = $_POST['estudiantes_asignados'];
                    $decoded = json_decode($raw, true);
                    if (is_array($decoded)) {
                        $estudiantesAsignados = $decoded;
                    }
                }

                $input = [
                    'titulo' => $titulo,
                    'descripcion' => $descripcion,
                    'tipo' => $tipo,
                    'estado' => $estado,
                    'archivo' => $archivoPath,
                    'fecha_limite' => $fecha_limite,
                    'estudiantes_asignados' => $estudiantesAsignados,
                ];
            } else {
                // JSON clásico
                $input = json_decode(file_get_contents('php://input'), true);
            }

            if (!$input || empty($input['titulo'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El título es requerido']);
                exit();
            }

            $stmt = $pdo->prepare("
                INSERT INTO api_evaluacion (titulo, descripcion, tipo, estado, archivo, fecha_limite, created_at, updated_at, profesor_id) 
                VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
            ");

            $stmt->execute([
                $input['titulo'],
                $input['descripcion'] ?? null,
                $input['tipo'] ?? 'quiz',
                $input['estado'] ?? 'borrador',
                $input['archivo'] ?? $archivoPath,
                $input['fecha_limite'] ?? null,
                $user->user_id
            ]);

            $new_id = (int)$pdo->lastInsertId();

            // Si vienen estudiantes_asignados, sincronizar la tabla puente
            if (isset($input['estudiantes_asignados']) && is_array($input['estudiantes_asignados'])) {
                sincronizarEstudiantesAsignados($pdo, $new_id, $input['estudiantes_asignados']);
            }

            // Obtener la evaluación creada con estudiantes_asignados
            $stmt = $pdo->prepare("SELECT * FROM api_evaluacion WHERE id = ?");
            $stmt->execute([$new_id]);
            $nueva_evaluacion = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($nueva_evaluacion && isset($nueva_evaluacion['id'])) {
                $nueva_evaluacion['estudiantes_asignados'] = obtenerEstudiantesAsignados($pdo, (int)$nueva_evaluacion['id']);
            }

            http_response_code(201);
            echo json_encode([
                'success' => true,
                'message' => 'Evaluación creada exitosamente',
                'data' => $nueva_evaluacion
            ]);
            break;
            
        case 'PUT':
            // PUT /evaluaciones/{id} - Actualizar evaluación
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requerido']);
                exit();
            }
            
            $user = verificarJWT();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Token inválido']);
                exit();
            }
            
            $input = json_decode(file_get_contents('php://input'), true);
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Datos inválidos']);
                exit();
            }
            
            // Verificar que la evaluación existe
            $stmt = $pdo->prepare("SELECT * FROM api_evaluacion WHERE id = ?");
            $stmt->execute([$id]);
            $evaluacion = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$evaluacion) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Evaluación no encontrada']);
                exit();
            }
            
            // Verificar permisos: solo admin o profesor pueden editar
            if (!isset($user->role) || !in_array($user->role, ['admin', 'profesor'], true)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Sin permisos para editar esta evaluación']);
                exit();
            }

            // Determinar el profesor propietario de la evaluación después de la edición
            // Regla: si quien edita es un profesor, esa evaluación pasa a ser suya (profesor_id = user_id)
            //       si es admin, se mantiene el profesor_id existente
            $profesorId = isset($evaluacion['profesor_id']) ? (int)$evaluacion['profesor_id'] : 0;
            if (isset($user->role) && $user->role === 'profesor') {
                $profesorId = isset($user->user_id) ? (int)$user->user_id : $profesorId;
            }

            $stmt = $pdo->prepare("
                UPDATE api_evaluacion 
                SET titulo = ?, descripcion = ?, tipo = ?, estado = ?, archivo = ?, fecha_limite = ?, profesor_id = ?, updated_at = NOW()
                WHERE id = ?
            ");
            
            $stmt->execute([
                $input['titulo'] ?? $evaluacion['titulo'],
                $input['descripcion'] ?? $evaluacion['descripcion'],
                $input['tipo'] ?? $evaluacion['tipo'],
                $input['estado'] ?? $evaluacion['estado'],
                $input['archivo'] ?? $evaluacion['archivo'],
                $input['fecha_limite'] ?? $evaluacion['fecha_limite'],
                $profesorId,
                $id
            ]);

            // Si se envían estudiantes_asignados en el body, sincronizar la tabla puente
            if (isset($input['estudiantes_asignados'])) {
                sincronizarEstudiantesAsignados($pdo, $id, $input['estudiantes_asignados']);
            }
            
            // Obtener la evaluación actualizada con estudiantes_asignados
            $stmt = $pdo->prepare("SELECT * FROM api_evaluacion WHERE id = ?");
            $stmt->execute([$id]);
            $evaluacion_actualizada = $stmt->fetch(PDO::FETCH_ASSOC);
            if ($evaluacion_actualizada && isset($evaluacion_actualizada['id'])) {
                $evaluacion_actualizada['estudiantes_asignados'] = obtenerEstudiantesAsignados($pdo, (int)$evaluacion_actualizada['id']);
            }
            
            echo json_encode([
                'success' => true,
                'message' => 'Evaluación actualizada exitosamente',
                'data' => $evaluacion_actualizada
            ]);
            break;
            
        case 'DELETE':
            // DELETE /evaluaciones/{id} - Eliminar evaluación
            if (!$id) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'ID requerido']);
                exit();
            }
            
            $user = verificarJWT();
            if (!$user) {
                http_response_code(401);
                echo json_encode(['success' => false, 'message' => 'Token inválido']);
                exit();
            }
            
            // Verificar que la evaluación existe
            $stmt = $pdo->prepare("SELECT * FROM api_evaluacion WHERE id = ?");
            $stmt->execute([$id]);
            $evaluacion = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$evaluacion) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Evaluación no encontrada']);
                exit();
            }
            
            // Verificar permisos: solo admin o profesor pueden eliminar
            if (!isset($user->role) || !in_array($user->role, ['admin', 'profesor'], true)) {
                http_response_code(403);
                echo json_encode(['success' => false, 'message' => 'Sin permisos para eliminar esta evaluación']);
                exit();
            }
            
            $stmt = $pdo->prepare("DELETE FROM api_evaluacion WHERE id = ?");
            $stmt->execute([$id]);
            
            echo json_encode([
                'success' => true,
                'message' => 'Evaluación eliminada exitosamente'
            ]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Método no permitido']);
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
