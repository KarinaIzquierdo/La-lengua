<?php
/**
 * API para gestión de usuarios (tabla api_customuser)
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

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('users', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$idSegment = $parts[$index + 1] ?? null;      // puede ser ID o vacío
$extra1    = $parts[$index + 2] ?? null;      // por ejemplo 'toggle-active'

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    // LISTAR USUARIOS: GET /users/
    if ($method === 'GET' && ($idSegment === null || $idSegment === '')) {
        $query = "SELECT 
                    u.id,
                    u.username,
                    u.email,
                    u.first_name,
                    u.last_name,
                    u.role,
                    u.is_profesor,
                    u.is_active,
                    u.correo_personal,
                    u.bloque_asignado,
                    u.english_level,
                    u.date_joined,
                    u.especializacion AS especializacion_id,
                    e.nombre AS especializacion
                  FROM api_customuser u
                  LEFT JOIN api_especializacion e ON u.especializacion = e.id
                  ORDER BY u.id";
        $stmt = $pdo->prepare($query);
        $stmt->execute();
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        // Asegurar claves esperadas por el frontend
        foreach ($users as &$u) {
            $u['correo_personal'] = $u['correo_personal'] ?? null;
            $u['bloque_asignado'] = $u['bloque_asignado'] ?? null;
            $u['english_level']   = $u['english_level'] ?? null;
            $u['date_joined']     = $u['date_joined'] ?? null;
            // Especialización no se guarda en esta BD, mantener null
            if (!isset($u['especializacion'])) {
                $u['especializacion'] = null;
            }
        }

        echo json_encode([
            'success'       => true,
            'message'       => 'Usuarios encontrados: ' . count($users),
            'users'         => $users,
            // Campo de depuración para asegurarnos de que esta versión está en producción
            'debug_version' => 'users_v2_2025-11-21',
            'debug_method'  => $method,
            'debug_uri'     => $uri,
        ]);
        return;
    }

    // A partir de aquí esperamos un ID numérico en la URL
    $userId = (is_numeric($idSegment) ? (int)$idSegment : null);
    if ($userId === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de usuario inválido']);
        return;
    }

    // TOGGLE ACTIVE: POST /users/{id}/toggle-active/
    if ($method === 'POST' && $extra1 === 'toggle-active') {
        $stmt = $pdo->prepare('SELECT is_active FROM api_customuser WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }

        $newStatus = ($row['is_active'] ? 0 : 1);
        // No usar updated_at para compatibilidad con BDs que no tengan esta columna
        $stmt = $pdo->prepare('UPDATE api_customuser SET is_active = ? WHERE id = ?');
        $stmt->execute([$newStatus, $userId]);

        echo json_encode([
            'success'   => true,
            'is_active' => (bool)$newStatus,
            'message'   => $newStatus ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.',
        ]);
        return;
    }

    // ACTUALIZAR: PATCH /users/{id}/
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

        $allowed = ['first_name', 'last_name', 'correo_personal', 'bloque_asignado', 'english_level', 'is_active'];
        foreach ($allowed as $field) {
            if (array_key_exists($field, $data)) {
                $fields[] = "$field = ?";
                $params[] = $data[$field];
            }
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Sin campos válidos para actualizar']);
            return;
        }

        $sql = 'UPDATE api_customuser SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $userId;

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);

        $stmt = $pdo->prepare('SELECT id, username, email, first_name, last_name, role, is_profesor, is_active,
                                      correo_personal, bloque_asignado, english_level, date_joined
                               FROM api_customuser WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            $user['especializacion'] = $user['especializacion'] ?? null;
        }

        echo json_encode([
            'success' => true,
            'message' => 'Usuario actualizado correctamente',
            'user'    => $user,
        ]);
        return;
    }

    // ELIMINAR: DELETE /users/{id}/
    if ($method === 'DELETE') {
        // Leer datos enviados por el frontend (razon, descripcion_adicional, plan_activo, deuda_pendiente, notas)
        $rawBody = file_get_contents('php://input');
        $elimData = $rawBody ? json_decode($rawBody, true) : [];
        if (!is_array($elimData)) {
            $elimData = [];
        }

        // Intentar obtener el admin que elimina desde el token JWT (si existe)
        $eliminadoPorId = null;
        if (function_exists('getallheaders')) {
            $headers = getallheaders();
            if (isset($headers['Authorization'])) {
                $token = str_replace('Bearer ', '', $headers['Authorization']);
                try {
                    $payload = jwt_decode_simple($token);
                    if (is_array($payload) && isset($payload['user_id'])) {
                        $eliminadoPorId = (int)$payload['user_id'];
                    } elseif (is_object($payload) && isset($payload->user_id)) {
                        $eliminadoPorId = (int)$payload->user_id;
                    }
                } catch (Exception $e) {
                    // Si falla el token, simplemente dejamos eliminado_por_id como null
                    error_log('Error decodificando JWT en users DELETE: ' . $e->getMessage());
                }
            }
        }

        // Obtener datos completos del usuario ANTES de eliminarlo
        $stmt = $pdo->prepare('SELECT * FROM api_customuser WHERE id = ?');
        $stmt->execute([$userId]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(404);
            echo json_encode([
                'success'       => false,
                'message'       => 'Usuario no encontrado',
                'deleted_id'    => $userId,
                'deleted_rows'  => 0,
                'debug_version' => 'users_delete_v3_2025-11-21',
            ]);
            return;
        }

        // Calcular fecha_registro y dias_registrado (similar a Django: created_at o date_joined)
        $fechaRegistro = null;
        if (!empty($user['created_at'])) {
            $fechaRegistro = $user['created_at'];
        } elseif (!empty($user['date_joined'])) {
            $fechaRegistro = $user['date_joined'];
        } else {
            $fechaRegistro = date('Y-m-d H:i:s');
        }

        $fechaEliminacion = date('Y-m-d H:i:s');

        $nowTs = time();
        $regTs = strtotime($fechaRegistro);
        if ($regTs === false) {
            $regTs = $nowTs;
        }
        $diasRegistrado = (int) floor(($nowTs - $regTs) / 86400);
        if ($diasRegistrado < 0) {
            $diasRegistrado = 0;
        }

        // Determinar nivel (usar english_level o level)
        $nivel = null;
        if (!empty($user['english_level'])) {
            $nivel = $user['english_level'];
        } elseif (!empty($user['level'])) {
            $nivel = $user['level'];
        }

        // Datos adicionales desde el modal
        $razon = isset($elimData['razon']) ? (string)$elimData['razon'] : 'otro';
        $descripcionAdicional = isset($elimData['descripcion_adicional']) ? (string)$elimData['descripcion_adicional'] : '';
        $planActivo = isset($elimData['plan_activo']) ? (string)$elimData['plan_activo'] : '';
        $deudaPendiente = isset($elimData['deuda_pendiente']) ? (float)$elimData['deuda_pendiente'] : 0.0;
        $notas = isset($elimData['notas']) ? (string)$elimData['notas'] : '';

        // Crear registro de eliminación en api_registroeliminacion (similar al modelo Django)
        $registroId = null;
        try {
            $sqlReg = 'INSERT INTO api_registroeliminacion (
                            username, email, first_name, last_name, phone, cedula,
                            nivel, bloque_asignado, especializacion,
                            fecha_registro, fecha_eliminacion, dias_registrado,
                            razon, descripcion_adicional,
                            plan_activo, deuda_pendiente,
                            notas, created_at, eliminado_por_id
                        ) VALUES (
                            :username, :email, :first_name, :last_name, :phone, :cedula,
                            :nivel, :bloque_asignado, :especializacion,
                            :fecha_registro, :fecha_eliminacion, :dias_registrado,
                            :razon, :descripcion_adicional,
                            :plan_activo, :deuda_pendiente,
                            :notas, :created_at, :eliminado_por_id
                        )';

            $stmtReg = $pdo->prepare($sqlReg);
            $stmtReg->execute([
                ':username'           => $user['username'],
                ':email'              => $user['email'],
                ':first_name'         => $user['first_name'],
                ':last_name'          => $user['last_name'],
                ':phone'              => $user['phone'] ?? null,
                ':cedula'             => $user['cedula'] ?? null,
                ':nivel'              => $nivel,
                ':bloque_asignado'    => $user['bloque_asignado'] ?? null,
                ':especializacion'    => null, // Por simplicidad, no resolvemos el nombre de la especialización aquí
                ':fecha_registro'     => $fechaRegistro,
                ':fecha_eliminacion'  => $fechaEliminacion,
                ':dias_registrado'    => $diasRegistrado,
                ':razon'              => $razon,
                ':descripcion_adicional' => $descripcionAdicional,
                ':plan_activo'        => $planActivo,
                ':deuda_pendiente'    => $deudaPendiente,
                ':notas'              => $notas,
                ':created_at'         => $fechaEliminacion,
                ':eliminado_por_id'   => $eliminadoPorId !== null ? (string)$eliminadoPorId : null,
            ]);

            $registroId = (int)$pdo->lastInsertId();
        } catch (Exception $e) {
            // No bloquear la eliminación si falla el registro, pero dejar trazas en el log
            error_log('Error creando registro de eliminación: ' . $e->getMessage());
        }

        // Ahora sí eliminar al usuario real
        $stmtDel = $pdo->prepare('DELETE FROM api_customuser WHERE id = ?');
        $stmtDel->execute([$userId]);

        $deletedRows = $stmtDel->rowCount();
        if ($deletedRows === 0) {
            http_response_code(404);
            echo json_encode([
                'success'       => false,
                'message'       => 'Usuario no encontrado o ya eliminado',
                'deleted_id'    => $userId,
                'deleted_rows'  => $deletedRows,
                'debug_version' => 'users_delete_v3_2025-11-21',
                'registro_eliminacion_id' => $registroId,
            ]);
            return;
        }

        echo json_encode([
            'success'       => true,
            'message'       => 'Usuario eliminado correctamente',
            'deleted_id'    => $userId,
            'deleted_rows'  => $deletedRows,
            'debug_version' => 'users_delete_v3_2025-11-21',
            'registro_eliminacion_id' => $registroId,
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método no permitido para este endpoint']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de usuarios',
        'error'   => $e->getMessage(),
    ]);
}
