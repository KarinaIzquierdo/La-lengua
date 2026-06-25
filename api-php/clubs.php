<?php
/**
 * API para Clubs (CLB) usando tablas api_club, api_clubmaterial y api_club_students
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

function clubs_verificarJWT() {
    $headers = function_exists('getallheaders') ? getallheaders() : [];
    if (!isset($headers['Authorization']) && isset($headers['authorization'])) {
        $headers['Authorization'] = $headers['authorization'];
    }
    if (!isset($headers['Authorization'])) {
        return null;
    }
    $token = str_replace('Bearer ', '', $headers['Authorization']);
    $payload = jwt_decode_simple($token);
    if ($payload === false || $payload === null) return null;
    return (object)$payload; // { user_id, role, is_profesor, ... }
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('clubs', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$seg1 = $parts[$index + 1] ?? null; // id o 'create'
$seg2 = $parts[$index + 2] ?? null; // 'students' o 'materials'
$seg3 = $parts[$index + 3] ?? null; // 'add', user_id, 'create', 'remove'
$seg4 = $parts[$index + 4] ?? null; // 'remove'

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $user = clubs_verificarJWT();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit();
    }

    // Helper: obtener nombre del profesor
    $profesorNombre = null;
    $stmtUser = $pdo->prepare('SELECT first_name, last_name, username FROM api_customuser WHERE id = ?');
    $stmtUser->execute([$user->user_id]);
    $urow = $stmtUser->fetch(PDO::FETCH_ASSOC);
    if ($urow) {
        $profesorNombre = trim(($urow['first_name'] ?? '') . ' ' . ($urow['last_name'] ?? ''));
        if ($profesorNombre === '') $profesorNombre = $urow['username'] ?? '';
    }

    // Endpoints a nivel de material: /clubs/materials/{material_id}/update|delete/
    if ($seg1 === 'materials' && is_numeric($seg2)) {
        $materialId = intval($seg2);

        $stmtMat = $pdo->prepare('SELECT m.*, c.profesor_id FROM api_clubmaterial m JOIN api_club c ON m.club_id = c.id WHERE m.id = ?');
        $stmtMat->execute([$materialId]);
        $matRow = $stmtMat->fetch(PDO::FETCH_ASSOC);
        if (!$matRow) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Material no encontrado']);
            return;
        }

        $esAdmin = isset($user->role) && $user->role === 'admin';
        $esProfesorClub = (int)$matRow['profesor_id'] === (int)$user->user_id;
        if (!$esAdmin && !$esProfesorClub) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        if (($method === 'POST' || $method === 'PUT') && $seg3 === 'update') {
            $body = json_decode(file_get_contents('php://input'), true) ?: [];

            $fields = [];
            $params = [];

            if (array_key_exists('week', $body)) {
                $week = trim($body['week']);
                if ($week === '') {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'La semana no puede estar vacía']);
                    return;
                }
                $fields[] = 'week = ?';
                $params[] = $week;
            }

            if (array_key_exists('title', $body)) {
                $title = trim($body['title']);
                if ($title === '') {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'El título no puede estar vacío']);
                    return;
                }
                $fields[] = 'title = ?';
                $params[] = $title;
            }

            if (array_key_exists('description', $body)) {
                $description = $body['description'];
                $fields[] = 'description = ?';
                $params[] = $description;
            }

            if (array_key_exists('url', $body) && $matRow['resource_type'] === 'url') {
                $url = $body['url'];
                $fields[] = 'url = ?';
                $params[] = $url;
            }

            if (empty($fields)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $sql = 'UPDATE api_clubmaterial SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $params[] = $materialId;

            $stmtUpd = $pdo->prepare($sql);
            $stmtUpd->execute($params);

            $stmtGet = $pdo->prepare('SELECT * FROM api_clubmaterial WHERE id = ?');
            $stmtGet->execute([$materialId]);
            $mat = $stmtGet->fetch(PDO::FETCH_ASSOC);

            echo json_encode(['success' => true, 'data' => $mat]);
            return;
        }

        if ($method === 'DELETE' && $seg3 === 'delete') {
            $stmtDel = $pdo->prepare('UPDATE api_clubmaterial SET is_active = 0, updated_at = NOW() WHERE id = ?');
            $stmtDel->execute([$materialId]);

            echo json_encode(['success' => true, 'message' => 'Material eliminado correctamente']);
            return;
        }

        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Ruta o método no soportado para materials']);
        return;
    }

    if ($method === 'GET' && ($seg1 === null || $seg1 === '')) {
        // GET /clubs/  -> listar clubs del usuario actual
        $params = [];
        if (isset($user->role) && $user->role === 'admin') {
            // Admin: ve todos los clubs
            $sql = 'SELECT 
                        c.id AS club_id,
                        c.name AS club_name,
                        c.description AS club_description,
                        c.profesor_id AS profesor_id,
                        u.first_name,
                        u.last_name,
                        u.username
                    FROM api_club c
                    LEFT JOIN api_customuser u ON c.profesor_id = u.id
                    ORDER BY c.updated_at DESC LIMIT 100';
        } elseif (isset($user->role) && $user->role === 'student') {
            // Estudiante: clubs donde está inscrito (tabla api_club_students)
            $sql = 'SELECT 
                        c.id AS club_id,
                        c.name AS club_name,
                        c.description AS club_description,
                        c.profesor_id AS profesor_id,
                        u.first_name,
                        u.last_name,
                        u.username
                    FROM api_club c
                    INNER JOIN api_club_students cs ON cs.club_id = c.id
                    LEFT JOIN api_customuser u ON c.profesor_id = u.id
                    WHERE cs.customuser_id = ?
                    ORDER BY c.updated_at DESC LIMIT 100';
            $params[] = $user->user_id;
        } else {
            // Profesor: clubs donde es profesor
            $sql = 'SELECT 
                        c.id AS club_id,
                        c.name AS club_name,
                        c.description AS club_description,
                        c.profesor_id AS profesor_id,
                        u.first_name,
                        u.last_name,
                        u.username
                    FROM api_club c
                    LEFT JOIN api_customuser u ON c.profesor_id = u.id
                    WHERE c.profesor_id = ?
                    ORDER BY c.updated_at DESC LIMIT 100';
            $params[] = $user->user_id;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $clubs = [];
        foreach ($rows as $r) {
            $nombreProf = trim(($r['first_name'] ?? '') . ' ' . ($r['last_name'] ?? ''));
            if ($nombreProf === '') $nombreProf = $r['username'] ?? '';

            $clubId = (int)($r['club_id'] ?? 0);
            if ($clubId === 0 && isset($r['id'])) {
                $clubId = (int)$r['id'];
            }

            if ($clubId === 0) {
                $nombreClub = $r['club_name'] ?? ($r['name'] ?? ($r['nombre'] ?? ''));
                $profId = isset($r['profesor_id']) ? (int)$r['profesor_id'] : (int)$user->user_id;
                $stmtFix = $pdo->prepare('SELECT id FROM api_club WHERE name = ? AND profesor_id = ? ORDER BY id DESC LIMIT 1');
                $stmtFix->execute([$nombreClub, $profId]);
                $fixRow = $stmtFix->fetch(PDO::FETCH_ASSOC);
                if ($fixRow && isset($fixRow['id'])) {
                    $clubId = (int)$fixRow['id'];
                }
            }

            $clubs[] = [
                'id' => $clubId,
                'name' => $r['club_name'] ?? ($r['name'] ?? ($r['nombre'] ?? '')),
                'description' => $r['club_description'] ?? ($r['description'] ?? null),
                'profesor' => (int)($r['profesor_id'] ?? 0),
                'profesor_name' => $nombreProf,
                'debug_version' => 'php-clubs-v3',
            ];
        }

        echo json_encode($clubs);
        return;
    }

    if ($method === 'POST' && $seg1 === 'create') {
        // POST /clubs/create/  -> crear club
        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $name = trim($body['name'] ?? '');
        $description = $body['description'] ?? null;
        if ($name === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
            return;
        }

        // Solo admin o profesor
        if (!isset($user->role) || ($user->role !== 'admin' && empty($user->is_profesor))) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado para crear clubs']);
            return;
        }

        $profesorId = $user->user_id;

        $stmt = $pdo->prepare('INSERT INTO api_club (name, description, profesor_id, created_at, updated_at) VALUES (?, ?, ?, NOW(), NOW())');
        $stmt->execute([$name, $description, $profesorId]);

        // Recuperar el club recién creado de forma robusta.
        // No confiamos solo en lastInsertId(), porque en algunos entornos puede devolver 0.
        $stmt2 = $pdo->prepare('SELECT * FROM api_club WHERE profesor_id = ? ORDER BY id DESC LIMIT 1');
        $stmt2->execute([$profesorId]);
        $club = $stmt2->fetch(PDO::FETCH_ASSOC);

        if ($club) {
            $newId = (int)$club['id'];
            $nameOut = $club['name'] ?? $name;
            $descOut = $club['description'] ?? $description;
        } else {
            // Fallback muy defensivo: usar lastInsertId y los datos enviados
            $newId = (int)$pdo->lastInsertId();
            $nameOut = $name;
            $descOut = $description;
        }

        echo json_encode([
            'success' => true,
            'data' => [
                'id' => $newId,
                'name' => $nameOut,
                'description' => $descOut,
                'profesor' => (int)$profesorId,
                'profesor_name' => $profesorNombre,
            ]
        ]);
        return;
    }

    // A partir de aquí se espera un ID de club numérico en seg1
    $clubId = (is_numeric($seg1) ? intval($seg1) : null);

    // Solo consideramos inválido cuando NO es numérico (null). El ID 0 se permite
    // por compatibilidad con datos existentes.
    if ($clubId === null) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'ID de club inválido']);
        return;
    }

    // Helper: verificar que el usuario es profesor del club o admin
    $stmtClub = $pdo->prepare('SELECT * FROM api_club WHERE id = ?');
    $stmtClub->execute([$clubId]);
    $clubRow = $stmtClub->fetch(PDO::FETCH_ASSOC);
    if (!$clubRow) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Club no encontrado']);
        return;
    }

    $esAdmin = isset($user->role) && $user->role === 'admin';
    $esProfesorClub = (int)$clubRow['profesor_id'] === (int)$user->user_id;

    // Actualizar club: /clubs/{id}/update/
    if (($method === 'POST' || $method === 'PUT') && $seg2 === 'update') {
        if (!$esAdmin && !$esProfesorClub) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?: [];

        $fields = [];
        $params = [];

        if (array_key_exists('name', $body)) {
            $name = trim($body['name']);
            if ($name === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'El nombre es obligatorio']);
                return;
            }
            $fields[] = 'name = ?';
            $params[] = $name;
        }

        if (array_key_exists('description', $body)) {
            $description = $body['description'];
            $fields[] = 'description = ?';
            $params[] = $description;
        }

        if (empty($fields)) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'No hay campos para actualizar']);
            return;
        }

        $fields[] = 'updated_at = NOW()';
        $sql = 'UPDATE api_club SET ' . implode(', ', $fields) . ' WHERE id = ?';
        $params[] = $clubId;

        $stmtUpd = $pdo->prepare($sql);
        $stmtUpd->execute($params);

        $stmtGet = $pdo->prepare('SELECT c.*, u.first_name, u.last_name, u.username FROM api_club c LEFT JOIN api_customuser u ON c.profesor_id = u.id WHERE c.id = ?');
        $stmtGet->execute([$clubId]);
        $c = $stmtGet->fetch(PDO::FETCH_ASSOC);
        if (!$c) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Club no encontrado tras actualizar']);
            return;
        }

        $nombreProf = trim(($c['first_name'] ?? '') . ' ' . ($c['last_name'] ?? ''));
        if ($nombreProf === '') $nombreProf = $c['username'] ?? '';

        echo json_encode([
            'success' => true,
            'data' => [
                'id' => (int)$c['id'],
                'name' => $c['name'],
                'description' => $c['description'],
                'profesor' => (int)$c['profesor_id'],
                'profesor_name' => $nombreProf,
            ],
        ]);
        return;
    }

    // Eliminar club: /clubs/{id}/delete/
    if ($method === 'DELETE' && $seg2 === 'delete') {
        if (!$esAdmin && !$esProfesorClub) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $stmtDel = $pdo->prepare('DELETE FROM api_club WHERE id = ?');
        $stmtDel->execute([$clubId]);

        echo json_encode(['success' => true, 'message' => 'Club eliminado correctamente']);
        return;
    }

    if ($method === 'GET' && $seg2 === 'students') {
        // GET /clubs/{id}/students/
        if (!$esAdmin && !$esProfesorClub) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        // Relación muchos-a-muchos generada por Django: api_club_students (club_id, customuser_id)
        $sql = 'SELECT u.id, u.username, u.email, u.first_name, u.last_name, u.role
                FROM api_customuser u
                INNER JOIN api_club_students cs ON cs.customuser_id = u.id
                WHERE cs.club_id = ?';
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$clubId]);
        $students = $stmt->fetchAll(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $students]);
        return;
    }

    if ($method === 'POST' && $seg2 === 'students' && $seg3 === 'add') {
        // POST /clubs/{id}/students/add/
        if (!$esAdmin && !$esProfesorClub) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $body = json_decode(file_get_contents('php://input'), true) ?: [];
        $userId = isset($body['user_id']) ? intval($body['user_id']) : null;
        $email = isset($body['email']) ? trim($body['email']) : '';

        if (!$userId && $email === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Debe proporcionar user_id o email']);
            return;
        }

        if ($userId) {
            $stmtU = $pdo->prepare('SELECT id FROM api_customuser WHERE id = ?');
            $stmtU->execute([$userId]);
        } else {
            $stmtU = $pdo->prepare('SELECT id FROM api_customuser WHERE email = ?');
            $stmtU->execute([$email]);
        }
        $u = $stmtU->fetch(PDO::FETCH_ASSOC);
        if (!$u) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }
        $studentId = (int)$u['id'];

        // Verificar si ya existe
        $check = $pdo->prepare('SELECT id FROM api_club_students WHERE club_id = ? AND customuser_id = ?');
        $check->execute([$clubId, $studentId]);
        if (!$check->fetch(PDO::FETCH_ASSOC)) {
            $ins = $pdo->prepare('INSERT INTO api_club_students (club_id, customuser_id) VALUES (?, ?)');
            $ins->execute([$clubId, $studentId]);
        }

        echo json_encode(['success' => true, 'message' => 'Estudiante agregado']);
        return;
    }

    if ($method === 'DELETE' && $seg2 === 'students' && is_numeric($seg3) && $seg4 === 'remove') {
        // DELETE /clubs/{id}/students/{user_id}/remove/
        if (!$esAdmin && !$esProfesorClub) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $studentId = intval($seg3);
        $del = $pdo->prepare('DELETE FROM api_club_students WHERE club_id = ? AND customuser_id = ?');
        $del->execute([$clubId, $studentId]);

        echo json_encode(['success' => true, 'message' => 'Estudiante removido']);
        return;
    }

    if ($method === 'GET' && $seg2 === 'materials') {
        // GET /clubs/{id}/materials/
        // Evitar duplicados: devolver solo el último material por (week, title) para este club
        $sql = 'SELECT m.*
                FROM api_clubmaterial m
                INNER JOIN (
                    SELECT week, title, MAX(id) AS max_id
                    FROM api_clubmaterial
                    WHERE club_id = ? AND (is_active = 1 OR is_active IS NULL)
                    GROUP BY week, title
                ) latest ON latest.max_id = m.id
                WHERE m.club_id = ?
                ORDER BY m.created_at DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute([$clubId, $clubId]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode(['success' => true, 'data' => $rows]);
        return;
    }

    if ($method === 'POST' && $seg2 === 'materials' && $seg3 === 'create') {
        // POST /clubs/{id}/materials/create/
        if (!$esAdmin && !$esProfesorClub) {
            http_response_code(403);
            echo json_encode(['success' => false, 'message' => 'No autorizado']);
            return;
        }

        $contentType = $_SERVER['CONTENT_TYPE'] ?? '';
        $isMultipart = stripos($contentType, 'multipart/form-data') !== false;

        if ($isMultipart) {
            // Manejo básico: solo soportaremos por ahora resource_type = 'file' subiendo archivo
            $week = $_POST['week'] ?? '';
            $title = $_POST['title'] ?? '';
            $description = $_POST['description'] ?? null;
            $resourceType = $_POST['resource_type'] ?? 'file';

            if ($week === '' || $title === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Semana y título son obligatorios']);
                return;
            }

            if ($resourceType !== 'file' || !isset($_FILES['file'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Subida de archivo no válida']);
                return;
            }

            // Guardar archivo dentro de api-php/uploads/clubs (o fallback a api-php/uploads si no es escribible)
            $relativeFolder = 'uploads/clubs/';
            $uploadDir = __DIR__ . '/uploads/clubs/';
            if (!is_dir($uploadDir)) {
                @mkdir($uploadDir, 0775, true);
            }
            if (!is_dir($uploadDir) || !is_writable($uploadDir)) {
                $relativeFolder = 'uploads/';
                $uploadDir = __DIR__ . '/uploads/';
                if (!is_dir($uploadDir)) {
                    @mkdir($uploadDir, 0775, true);
                }
            }

            $original = basename($_FILES['file']['name']);
            $filename = preg_replace('/[^A-Za-z0-9._-]+/', '_', $original);
            $filename = trim($filename, '._-');
            if ($filename === '') {
                $filename = 'archivo';
            }
            $filename = time() . '_' . $filename;

            $targetPath = $uploadDir . $filename;
            if (!move_uploaded_file($_FILES['file']['tmp_name'], $targetPath)) {
                http_response_code(500);
                echo json_encode(['success' => false, 'message' => 'No se pudo guardar el archivo']);
                return;
            }

            // Guardar ruta relativa
            $filePath = $relativeFolder . $filename;

            $stmt = $pdo->prepare('INSERT INTO api_clubmaterial (club_id, week, title, description, resource_type, url, file, created_by_id, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, NOW(), NOW(), 1)');
            $createdBy = $user->user_id;
            $stmt->execute([$clubId, $week, $title, $description, 'file', $filePath, $createdBy]);
        } else {
            // JSON: esperamos recurso tipo URL
            $body = json_decode(file_get_contents('php://input'), true) ?: [];
            $week = trim($body['week'] ?? '');
            $title = trim($body['title'] ?? '');
            $description = $body['description'] ?? null;
            $resourceType = $body['resource_type'] ?? 'url';
            $url = $body['url'] ?? '';

            if ($week === '' || $title === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Semana y título son obligatorios']);
                return;
            }

            if ($resourceType !== 'url' || $url === '') {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Solo se soporta resource_type="url" con un URL válido en esta ruta JSON']);
                return;
            }

            $stmt = $pdo->prepare('INSERT INTO api_clubmaterial (club_id, week, title, description, resource_type, url, file, created_by_id, created_at, updated_at, is_active) VALUES (?, ?, ?, ?, ?, ?, NULL, ?, NOW(), NOW(), 1)');
            $createdBy = $user->user_id;
            $stmt->execute([$clubId, $week, $title, $description, 'url', $url, $createdBy]);
        }

        $newId = (int)$pdo->lastInsertId();
        $stmt2 = $pdo->prepare('SELECT * FROM api_clubmaterial WHERE id = ?');
        $stmt2->execute([$newId]);
        $mat = $stmt2->fetch(PDO::FETCH_ASSOC);

        echo json_encode(['success' => true, 'data' => $mat]);
        return;
    }

    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Ruta o método no soportado en clubs']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => $e->getMessage()]);
}
