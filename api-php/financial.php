<?php
/**
 * API financiera: planes, ventas y estadísticas financieras
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

function financial_verify_jwt()
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

function financial_map_plan_row($row)
{
    if (!$row) {
        return null;
    }

    $caracteristicas = [];
    if (isset($row['caracteristicas']) && $row['caracteristicas'] !== null && $row['caracteristicas'] !== '') {
        $decoded = json_decode($row['caracteristicas'], true);
        if (is_array($decoded)) {
            $caracteristicas = $decoded;
        } else {
            $caracteristicas = [$row['caracteristicas']];
        }
    }

    return [
        'id' => (int)$row['id'],
        'nombre' => $row['nombre'],
        'tipo' => $row['tipo'],
        'descripcion' => $row['descripcion'],
        'precio_base' => (float)$row['precio_base'],
        'duracion_meses' => (int)$row['duracion_meses'],
        'caracteristicas' => $caracteristicas,
        'activo' => (bool)$row['activo'],
        'color_tema' => $row['color_tema'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

function financial_map_venta_row($row)
{
    if (!$row) {
        return null;
    }

    $estudianteNombre = trim(($row['estudiante_first_name'] ?? '') . ' ' . ($row['estudiante_last_name'] ?? ''));
    $vendidoPorNombre = null;
    if (!empty($row['vendido_por_first_name']) || !empty($row['vendido_por_last_name'])) {
        $vendidoPorNombre = trim(($row['vendido_por_first_name'] ?? '') . ' ' . ($row['vendido_por_last_name'] ?? ''));
    }

    return [
        'id' => (int)$row['id'],
        'estudiante' => (int)$row['estudiante_id'],
        'estudiante_nombre' => $estudianteNombre,
        'plan' => (int)$row['plan_id'],
        'plan_nombre' => $row['plan_nombre'],
        'especializacion' => $row['especializacion_id'] !== null ? (int)$row['especializacion_id'] : null,
        'especializacion_nombre' => $row['especializacion_nombre'],
        'precio_plan' => (float)$row['precio_plan'],
        'precio_especializacion' => (float)$row['precio_especializacion'],
        'descuento' => (float)$row['descuento'],
        'precio_total' => (float)$row['precio_total'],
        'metodo_pago' => $row['metodo_pago'],
        'referencia_pago' => $row['referencia_pago'],
        'estado' => $row['estado'],
        'notas' => $row['notas'],
        'vendido_por' => $row['vendido_por_id'] !== null ? (int)$row['vendido_por_id'] : null,
        'vendido_por_nombre' => $vendidoPorNombre,
        'fecha_venta' => $row['fecha_venta'],
        'fecha_pago' => $row['fecha_pago'],
        'fecha_inicio_plan' => $row['fecha_inicio_plan'],
        'fecha_fin_plan' => $row['fecha_fin_plan'],
        'created_at' => $row['created_at'],
        'updated_at' => $row['updated_at'],
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$root = null;
$rootIndex = null;
foreach (['planes', 'ventas', 'estadisticas'] as $name) {
    $idx = array_search($name, $parts);
    if ($idx !== false) {
        $root = $name;
        $rootIndex = $idx;
        break;
    }
}

if ($root === null) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$seg1 = $parts[$rootIndex + 1] ?? null;
$seg2 = $parts[$rootIndex + 2] ?? null;

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $user = financial_verify_jwt();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit();
    }

    /* ===================== PLANES ===================== */
    if ($root === 'planes') {
        // LISTAR PLANES: GET /planes/
        if ($method === 'GET' && ($seg1 === null || $seg1 === '')) {
            $stmt = $pdo->prepare('SELECT * FROM api_plan ORDER BY precio_base ASC');
            $stmt->execute();
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $planes = [];
            foreach ($rows as $row) {
                $mapped = financial_map_plan_row($row);
                if ($mapped !== null) {
                    $planes[] = $mapped;
                }
            }

            echo json_encode([
                'success' => true,
                'data' => $planes,
            ]);
            return;
        }

        // CREAR PLAN: POST /planes/create/
        if ($method === 'POST' && $seg1 === 'create') {
            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data)) {
                $data = [];
            }

            $nombre = trim((string)($data['nombre'] ?? ''));
            $tipo = trim((string)($data['tipo'] ?? ''));
            $descripcion = (string)($data['descripcion'] ?? '');
            $precio_base = isset($data['precio_base']) ? (float)$data['precio_base'] : 0.0;
            $duracion_meses = isset($data['duracion_meses']) ? (int)$data['duracion_meses'] : 1;
            $caracteristicas = $data['caracteristicas'] ?? [];
            $activo = isset($data['activo']) ? (bool)$data['activo'] : true;
            $color_tema = trim((string)($data['color_tema'] ?? '#2563eb'));

            $errors = [];
            if ($nombre === '') {
                $errors['nombre'] = 'El nombre es obligatorio.';
            }
            if ($tipo === '') {
                $errors['tipo'] = 'El tipo es obligatorio.';
            }
            if ($descripcion === '') {
                $errors['descripcion'] = 'La descripción es obligatoria.';
            }
            if ($precio_base <= 0) {
                $errors['precio_base'] = 'El precio base debe ser mayor a 0.';
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

            if (!is_array($caracteristicas)) {
                $caracteristicas = [];
            }
            $caracteristicasJson = json_encode($caracteristicas, JSON_UNESCAPED_UNICODE);

            $sql = 'INSERT INTO api_plan (
                        nombre, tipo, descripcion, precio_base, duracion_meses,
                        caracteristicas, activo, color_tema, created_at, updated_at
                    ) VALUES (
                        :nombre, :tipo, :descripcion, :precio_base, :duracion_meses,
                        :caracteristicas, :activo, :color_tema, NOW(), NOW()
                    )';
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':nombre' => $nombre,
                ':tipo' => $tipo,
                ':descripcion' => $descripcion,
                ':precio_base' => $precio_base,
                ':duracion_meses' => $duracion_meses,
                ':caracteristicas' => $caracteristicasJson,
                ':activo' => $activo ? 1 : 0,
                ':color_tema' => $color_tema,
            ]);

            $newId = (int)$pdo->lastInsertId();
            $stmt = $pdo->prepare('SELECT * FROM api_plan WHERE id = ?');
            $stmt->execute([$newId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $plan = financial_map_plan_row($row);

            echo json_encode([
                'success' => true,
                'data' => $plan,
                'message' => 'Plan creado exitosamente',
            ]);
            return;
        }

        // ACTUALIZAR PLAN: PUT /planes/{id}/update/
        if ($method === 'PUT' && $seg1 !== null && ctype_digit($seg1) && $seg2 === 'update') {
            $planId = (int)$seg1;

            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data) || empty($data)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nada que actualizar']);
                return;
            }

            $fields = [];
            $params = [];
            $allowed = ['nombre', 'tipo', 'descripcion', 'precio_base', 'duracion_meses', 'caracteristicas', 'activo', 'color_tema'];
            foreach ($allowed as $field) {
                if (array_key_exists($field, $data)) {
                    if ($field === 'caracteristicas') {
                        $value = $data[$field];
                        if (!is_array($value)) {
                            $value = [];
                        }
                        $value = json_encode($value, JSON_UNESCAPED_UNICODE);
                        $fields[] = 'caracteristicas = ?';
                        $params[] = $value;
                    } elseif ($field === 'activo') {
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
                echo json_encode(['success' => false, 'message' => 'Sin campos válidos para actualizar']);
                return;
            }

            $fields[] = 'updated_at = NOW()';
            $sql = 'UPDATE api_plan SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $params[] = $planId;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            $stmt = $pdo->prepare('SELECT * FROM api_plan WHERE id = ?');
            $stmt->execute([$planId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
                return;
            }

            $plan = financial_map_plan_row($row);

            echo json_encode([
                'success' => true,
                'data' => $plan,
                'message' => 'Plan actualizado exitosamente',
            ]);
            return;
        }

        // ELIMINAR PLAN: DELETE /planes/{id}/delete/
        if ($method === 'DELETE' && $seg1 !== null && ctype_digit($seg1) && $seg2 === 'delete') {
            $planId = (int)$seg1;
            $stmt = $pdo->prepare('DELETE FROM api_plan WHERE id = ?');
            $stmt->execute([$planId]);

            if ($stmt->rowCount() === 0) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
                return;
            }

            echo json_encode([
                'success' => true,
                'message' => 'Plan eliminado exitosamente',
            ]);
            return;
        }

        // TOGGLE PLAN: POST /planes/{id}/toggle/
        if ($method === 'POST' && $seg1 !== null && ctype_digit($seg1) && $seg2 === 'toggle') {
            $planId = (int)$seg1;
            $stmt = $pdo->prepare('SELECT activo FROM api_plan WHERE id = ?');
            $stmt->execute([$planId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
                return;
            }

            $nuevoEstado = $row['activo'] ? 0 : 1;
            $stmt = $pdo->prepare('UPDATE api_plan SET activo = ?, updated_at = NOW() WHERE id = ?');
            $stmt->execute([$nuevoEstado, $planId]);

            $stmt = $pdo->prepare('SELECT * FROM api_plan WHERE id = ?');
            $stmt->execute([$planId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $plan = financial_map_plan_row($row);

            echo json_encode([
                'success' => true,
                'data' => $plan,
                'message' => $nuevoEstado ? 'Plan activado exitosamente' : 'Plan desactivado exitosamente',
            ]);
            return;
        }

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido para /planes']);
        return;
    }

    /* ===================== VENTAS ===================== */
    if ($root === 'ventas') {
        // LISTAR VENTAS: GET /ventas/
        if ($method === 'GET' && ($seg1 === null || $seg1 === '')) {
            $baseSql = 'SELECT v.*, 
                               est.first_name AS estudiante_first_name,
                               est.last_name AS estudiante_last_name,
                               p.nombre AS plan_nombre,
                               esp.nombre AS especializacion_nombre,
                               vp.id AS vendido_por_id,
                               vp.first_name AS vendido_por_first_name,
                               vp.last_name AS vendido_por_last_name
                        FROM api_venta v
                        JOIN api_customuser est ON v.estudiante_id = est.id
                        JOIN api_plan p ON v.plan_id = p.id
                        LEFT JOIN api_especializacion esp ON v.especializacion_id = esp.id
                        LEFT JOIN api_customuser vp ON v.vendido_por_id = vp.id';

            $where = [];
            $params = [];

            if (isset($_GET['estado']) && $_GET['estado'] !== '' && $_GET['estado'] !== 'todos') {
                $where[] = 'v.estado = ?';
                $params[] = $_GET['estado'];
            }
            if (isset($_GET['metodo_pago']) && $_GET['metodo_pago'] !== '' && $_GET['metodo_pago'] !== 'todos') {
                $where[] = 'v.metodo_pago = ?';
                $params[] = $_GET['metodo_pago'];
            }
            if (isset($_GET['fecha_desde']) && $_GET['fecha_desde'] !== '') {
                $where[] = 'v.fecha_venta >= ?';
                $params[] = $_GET['fecha_desde'];
            }
            if (isset($_GET['fecha_hasta']) && $_GET['fecha_hasta'] !== '') {
                $where[] = 'v.fecha_venta <= ?';
                $params[] = $_GET['fecha_hasta'];
            }

            if (!empty($where)) {
                $baseSql .= ' WHERE ' . implode(' AND ', $where);
            }

            $baseSql .= ' ORDER BY v.fecha_venta DESC';

            $stmt = $pdo->prepare($baseSql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $ventas = [];
            foreach ($rows as $row) {
                $mapped = financial_map_venta_row($row);
                if ($mapped !== null) {
                    $ventas[] = $mapped;
                }
            }

            echo json_encode([
                'success' => true,
                'data' => $ventas,
            ]);
            return;
        }

        // CREAR VENTA: POST /ventas/create/
        if ($method === 'POST' && $seg1 === 'create') {
            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data)) {
                $data = [];
            }

            $estudiante_id = isset($data['estudiante']) ? (int)$data['estudiante'] : 0;
            $plan_id = isset($data['plan']) ? (int)$data['plan'] : 0;
            $especializacion_id = isset($data['especializacion']) ? (int)$data['especializacion'] : null;
            $precio_plan = isset($data['precio_plan']) ? (float)$data['precio_plan'] : 0.0;
            $precio_especializacion = isset($data['precio_especializacion']) ? (float)$data['precio_especializacion'] : 0.0;
            $descuento = isset($data['descuento']) ? (float)$data['descuento'] : 0.0;
            $metodo_pago = isset($data['metodo_pago']) ? (string)$data['metodo_pago'] : 'efectivo';
            $referencia_pago = $data['referencia_pago'] ?? null;
            $estado = isset($data['estado']) ? (string)$data['estado'] : 'pagado';
            $notas = $data['notas'] ?? null;

            $errors = [];
            if ($estudiante_id <= 0) {
                $errors['estudiante'] = 'El estudiante es obligatorio.';
            }
            if ($plan_id <= 0) {
                $errors['plan'] = 'El plan es obligatorio.';
            }
            if ($precio_plan <= 0) {
                $errors['precio_plan'] = 'El precio del plan debe ser mayor a 0.';
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

            $precio_total = $precio_plan + $precio_especializacion - $descuento;

            // Determinar fechas de plan basadas en la duración del plan
            $stmt = $pdo->prepare('SELECT duracion_meses FROM api_plan WHERE id = ?');
            $stmt->execute([$plan_id]);
            $planRow = $stmt->fetch(PDO::FETCH_ASSOC);
            $duracion_meses = $planRow ? (int)$planRow['duracion_meses'] : 1;

            $fecha_inicio = new DateTime();
            $fecha_fin = clone $fecha_inicio;
            $fecha_fin->modify('+' . ($duracion_meses * 30) . ' days');

            $vendido_por_id = isset($user->user_id) ? (int)$user->user_id : null;

            $sql = 'INSERT INTO api_venta (
                        estudiante_id, plan_id, especializacion_id,
                        precio_plan, precio_especializacion, descuento, precio_total,
                        metodo_pago, referencia_pago, estado, notas,
                        vendido_por_id, fecha_venta, fecha_pago,
                        fecha_inicio_plan, fecha_fin_plan,
                        created_at, updated_at
                    ) VALUES (
                        :estudiante_id, :plan_id, :especializacion_id,
                        :precio_plan, :precio_especializacion, :descuento, :precio_total,
                        :metodo_pago, :referencia_pago, :estado, :notas,
                        :vendido_por_id, NOW(), NOW(),
                        :fecha_inicio_plan, :fecha_fin_plan,
                        NOW(), NOW()
                    )';

            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':estudiante_id' => $estudiante_id,
                ':plan_id' => $plan_id,
                ':especializacion_id' => $especializacion_id,
                ':precio_plan' => $precio_plan,
                ':precio_especializacion' => $precio_especializacion,
                ':descuento' => $descuento,
                ':precio_total' => $precio_total,
                ':metodo_pago' => $metodo_pago,
                ':referencia_pago' => $referencia_pago,
                ':estado' => $estado,
                ':notas' => $notas,
                ':vendido_por_id' => $vendido_por_id,
                ':fecha_inicio_plan' => $fecha_inicio->format('Y-m-d'),
                ':fecha_fin_plan' => $fecha_fin->format('Y-m-d'),
            ]);

            $newId = (int)$pdo->lastInsertId();

            // Obtener venta completa con joins para devolver al frontend
            $sqlSel = 'SELECT v.*, 
                               est.first_name AS estudiante_first_name,
                               est.last_name AS estudiante_last_name,
                               p.nombre AS plan_nombre,
                               esp.nombre AS especializacion_nombre,
                               vp.id AS vendido_por_id,
                               vp.first_name AS vendido_por_first_name,
                               vp.last_name AS vendido_por_last_name
                        FROM api_venta v
                        JOIN api_customuser est ON v.estudiante_id = est.id
                        JOIN api_plan p ON v.plan_id = p.id
                        LEFT JOIN api_especializacion esp ON v.especializacion_id = esp.id
                        LEFT JOIN api_customuser vp ON v.vendido_por_id = vp.id
                        WHERE v.id = ?';
            $stmt = $pdo->prepare($sqlSel);
            $stmt->execute([$newId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $venta = financial_map_venta_row($row);

            echo json_encode([
                'success' => true,
                'data' => $venta,
                'message' => 'Venta registrada exitosamente',
            ]);
            return;
        }

        // ACTUALIZAR VENTA: PUT /ventas/{id}/update/
        if ($method === 'PUT' && $seg1 !== null && ctype_digit($seg1) && $seg2 === 'update') {
            $ventaId = (int)$seg1;

            $raw = file_get_contents('php://input');
            $data = $raw ? json_decode($raw, true) : [];
            if (!is_array($data) || empty($data)) {
                http_response_code(400);
                echo json_encode(['success' => false, 'message' => 'Nada que actualizar']);
                return;
            }

            $fields = [];
            $params = [];
            $allowed = ['precio_plan', 'precio_especializacion', 'descuento', 'precio_total', 'metodo_pago', 'referencia_pago', 'estado', 'notas', 'fecha_pago'];

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

            // Si no se envía precio_total pero sí precios, recalcular
            if (!array_key_exists('precio_total', $data) && (array_key_exists('precio_plan', $data) || array_key_exists('precio_especializacion', $data) || array_key_exists('descuento', $data))) {
                $stmt = $pdo->prepare('SELECT precio_plan, precio_especializacion, descuento FROM api_venta WHERE id = ?');
                $stmt->execute([$ventaId]);
                $row = $stmt->fetch(PDO::FETCH_ASSOC);
                if ($row) {
                    $precio_plan = array_key_exists('precio_plan', $data) ? (float)$data['precio_plan'] : (float)$row['precio_plan'];
                    $precio_esp = array_key_exists('precio_especializacion', $data) ? (float)$data['precio_especializacion'] : (float)$row['precio_especializacion'];
                    $descuento = array_key_exists('descuento', $data) ? (float)$data['descuento'] : (float)$row['descuento'];
                    $precio_total = $precio_plan + $precio_esp - $descuento;
                    $fields[] = 'precio_total = ?';
                    $params[] = $precio_total;
                }
            }

            $fields[] = 'updated_at = NOW()';
            $sql = 'UPDATE api_venta SET ' . implode(', ', $fields) . ' WHERE id = ?';
            $params[] = $ventaId;

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            // Devolver venta actualizada
            $sqlSel = 'SELECT v.*, 
                               est.first_name AS estudiante_first_name,
                               est.last_name AS estudiante_last_name,
                               p.nombre AS plan_nombre,
                               esp.nombre AS especializacion_nombre,
                               vp.id AS vendido_por_id,
                               vp.first_name AS vendido_por_first_name,
                               vp.last_name AS vendido_por_last_name
                        FROM api_venta v
                        JOIN api_customuser est ON v.estudiante_id = est.id
                        JOIN api_plan p ON v.plan_id = p.id
                        LEFT JOIN api_especializacion esp ON v.especializacion_id = esp.id
                        LEFT JOIN api_customuser vp ON v.vendido_por_id = vp.id
                        WHERE v.id = ?';
            $stmt = $pdo->prepare($sqlSel);
            $stmt->execute([$ventaId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            if (!$row) {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Venta no encontrada']);
                return;
            }

            $venta = financial_map_venta_row($row);

            echo json_encode([
                'success' => true,
                'data' => $venta,
                'message' => 'Venta actualizada exitosamente',
            ]);
            return;
        }

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido para /ventas']);
        return;
    }

    /* ===================== ESTADÍSTICAS FINANCIERAS ===================== */
    if ($root === 'estadisticas') {
        if ($method === 'GET' && $seg1 === 'financieras') {
            // total_ventas
            $stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM api_venta');
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $total_ventas = (int)($row['total'] ?? 0);

            // ingresos_totales (ventas pagadas)
            $stmt = $pdo->prepare("SELECT SUM(precio_total) AS total FROM api_venta WHERE estado = 'pagado'");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $ingresos_totales = (float)($row['total'] ?? 0);

            // ventas_pendientes
            $stmt = $pdo->prepare("SELECT COUNT(*) AS total FROM api_venta WHERE estado = 'pendiente'");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $ventas_pendientes = (int)($row['total'] ?? 0);

            // ingresos del mes actual
            $inicio_mes = date('Y-m-01 00:00:00');
            $stmt = $pdo->prepare("SELECT SUM(precio_total) AS total FROM api_venta WHERE estado = 'pagado' AND fecha_venta >= ?");
            $stmt->execute([$inicio_mes]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $ingresos_mes = (float)($row['total'] ?? 0);

            // tasa de conversión
            $ventas_pagadas_count = 0;
            $stmt = $pdo->prepare("SELECT COUNT(*) AS total FROM api_venta WHERE estado = 'pagado'");
            $stmt->execute();
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $ventas_pagadas_count = (int)($row['total'] ?? 0);

            $conversion_rate = $total_ventas > 0 ? round(($ventas_pagadas_count / $total_ventas) * 100, 2) : 0.0;

            // Planes más vendidos
            $stmt = $pdo->prepare('SELECT p.nombre AS plan__nombre, COUNT(v.id) AS count, SUM(v.precio_total) AS ingresos
                                   FROM api_venta v
                                   JOIN api_plan p ON v.plan_id = p.id
                                   GROUP BY p.nombre
                                   ORDER BY count DESC
                                   LIMIT 5');
            $stmt->execute();
            $planes_populares = [];
            while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
                $planes_populares[] = [
                    'plan__nombre' => $row['plan__nombre'],
                    'count' => (int)$row['count'],
                    'ingresos' => (float)($row['ingresos'] ?? 0),
                ];
            }

            echo json_encode([
                'success' => true,
                'data' => [
                    'total_ventas' => $total_ventas,
                    'ingresos_totales' => $ingresos_totales,
                    'ingresos_mes' => $ingresos_mes,
                    'ventas_pendientes' => $ventas_pendientes,
                    'conversion_rate' => $conversion_rate,
                    'planes_populares' => $planes_populares,
                ],
            ]);
            return;
        }

        http_response_code(405);
        echo json_encode(['success' => false, 'message' => 'Método no permitido para /estadisticas']);
        return;
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Ruta financiera no encontrada']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor financiero',
        'error' => $e->getMessage(),
    ]);
}
