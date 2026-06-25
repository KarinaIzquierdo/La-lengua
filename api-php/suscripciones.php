<?php
/**
 * API para gestión de suscripciones (tabla api_suscripcion) y utilidades relacionadas
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
require_once 'jwt-simple.php';

function subs_verify_jwt()
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

function subs_map_suscripcion_activa_row($row)
{
    if (!$row) {
        return null;
    }

    $estudianteNombre = trim(($row['estudiante_first_name'] ?? '') . ' ' . ($row['estudiante_last_name'] ?? ''));

    $hoy = new DateTime(date('Y-m-d'));
    $fin = new DateTime($row['fecha_fin']);
    $diffDays = (int)$hoy->diff($fin)->format('%r%a');

    $clasesTotales = isset($row['clases_totales']) ? (int)$row['clases_totales'] : 0;
    $clasesTomadas = isset($row['clases_tomadas']) ? (int)$row['clases_tomadas'] : 0;
    $clasesRestantes = max(0, $clasesTotales - $clasesTomadas);
    $progreso = $clasesTotales > 0 ? round(($clasesTomadas / $clasesTotales) * 100, 1) : 0;

    return [
        'id' => (int)$row['id'],
        'venta' => isset($row['venta_id']) ? (int)$row['venta_id'] : null,
        'estudiante_nombre' => $estudianteNombre,
        'plan_nombre' => $row['plan_nombre'],
        'fecha_inicio' => $row['fecha_inicio'],
        'fecha_fin' => $row['fecha_fin'],
        'estado' => $row['estado'],
        'clases_totales' => $clasesTotales,
        'clases_tomadas' => $clasesTomadas,
        'dias_restantes' => $diffDays,
        'clases_restantes' => $clasesRestantes,
        'progreso_porcentaje' => $progreso,
    ];
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('suscripciones', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$seg1 = $parts[$index + 1] ?? null;
$seg2 = $parts[$index + 2] ?? null;

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $user = subs_verify_jwt();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit();
    }

    /* ===================== USUARIOS SIN PLAN ===================== */
    if ($method === 'GET' && $seg1 === 'usuarios-sin-plan') {
        $stmt = $pdo->prepare("SELECT id, first_name, last_name, email, date_joined, role FROM api_customuser WHERE role IN ('student', 'estudiante')");
        $stmt->execute();
        $todos = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $stmt2 = $pdo->prepare("SELECT DISTINCT estudiante_id FROM api_suscripcion WHERE estado IN ('activa', 'por_vencer')");
        $stmt2->execute();
        $idsConPlan = $stmt2->fetchAll(PDO::FETCH_COLUMN, 0);

        $sinPlan = [];
        foreach ($todos as $u) {
            if (!in_array($u['id'], $idsConPlan)) {
                $sinPlan[] = [
                    'id' => (int)$u['id'],
                    'first_name' => $u['first_name'],
                    'last_name' => $u['last_name'],
                    'email' => $u['email'],
                    'date_joined' => $u['date_joined'],
                    'role' => $u['role'],
                ];
            }
        }

        echo json_encode([
            'success' => true,
            'usuarios' => $sinPlan,
        ]);
        return;
    }

    /* ===================== PLANES POR VENCER ===================== */
    if ($method === 'GET' && $seg1 === 'planes-por-vencer') {
        $dias = isset($_GET['dias']) ? (int)$_GET['dias'] : 7;
        if ($dias <= 0) {
            $dias = 7;
        }

        $hoy = date('Y-m-d');
        $fecha_limite = date('Y-m-d', strtotime('+' . $dias . ' days'));

        $sql = "SELECT v.id, v.fecha_inicio_plan, v.fecha_fin_plan,
                       est.first_name AS estudiante_first_name,
                       est.last_name AS estudiante_last_name,
                       p.nombre AS plan_nombre
                FROM api_venta v
                JOIN api_customuser est ON v.estudiante_id = est.id
                JOIN api_plan p ON v.plan_id = p.id
                WHERE v.estado = 'pagado'
                  AND v.fecha_fin_plan >= ?
                  AND v.fecha_fin_plan <= ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$hoy, $fecha_limite]);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $planes = [];
        foreach ($rows as $row) {
            $estudianteNombre = trim(($row['estudiante_first_name'] ?? '') . ' ' . ($row['estudiante_last_name'] ?? ''));
            $planes[] = [
                'id' => (int)$row['id'],
                'estudiante_nombre' => $estudianteNombre,
                'plan_nombre' => $row['plan_nombre'],
                'fecha_inicio_plan' => $row['fecha_inicio_plan'],
                'fecha_fin_plan' => $row['fecha_fin_plan'],
            ];
        }

        echo json_encode([
            'success' => true,
            'planes_por_vencer' => $planes,
            'total' => count($planes),
        ]);
        return;
    }

    /* ===================== SUSCRIPCIONES ACTIVAS ===================== */
    if ($method === 'GET' && $seg1 === 'activas') {
        $stmt = $pdo->prepare("SELECT id, fecha_fin, estado FROM api_suscripcion WHERE estado <> 'cancelada'");
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $hoy = new DateTime(date('Y-m-d'));
        foreach ($rows as $row) {
            $estado = $row['estado'];
            if (empty($row['fecha_fin'])) {
                continue;
            }
            $fin = new DateTime($row['fecha_fin']);
            $diffDays = (int)$hoy->diff($fin)->format('%r%a');
            $nuevoEstado = $estado;
            if ($fin < $hoy) {
                $nuevoEstado = 'vencida';
            } elseif ($diffDays <= 7) {
                $nuevoEstado = 'por_vencer';
            } else {
                $nuevoEstado = 'activa';
            }

            if ($nuevoEstado !== $estado) {
                $upd = $pdo->prepare('UPDATE api_suscripcion SET estado = ?, updated_at = NOW() WHERE id = ?');
                $upd->execute([$nuevoEstado, $row['id']]);
            }
        }

        $sql = "SELECT s.*, 
                       u.first_name AS estudiante_first_name,
                       u.last_name AS estudiante_last_name,
                       p.nombre AS plan_nombre
                FROM api_suscripcion s
                JOIN api_customuser u ON s.estudiante_id = u.id
                JOIN api_plan p ON s.plan_id = p.id
                WHERE s.estado IN ('activa', 'por_vencer')
                ORDER BY s.fecha_fin ASC";
        $stmt = $pdo->prepare($sql);
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $suscripciones = [];
        foreach ($rows as $row) {
            $mapped = subs_map_suscripcion_activa_row($row);
            if ($mapped !== null) {
                $suscripciones[] = $mapped;
            }
        }

        echo json_encode([
            'success' => true,
            'suscripciones' => $suscripciones,
            'total' => count($suscripciones),
        ]);
        return;
    }

    /* ===================== ASIGNAR PLAN (VENTA + SUSCRIPCION) ===================== */
    if ($method === 'POST' && $seg1 === 'asignar-plan') {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $user_id = isset($data['user_id']) ? (int)$data['user_id'] : 0;
        $plan_id = isset($data['plan_id']) ? (int)$data['plan_id'] : 0;
        $especializacion_id = isset($data['especializacion_id']) ? (int)$data['especializacion_id'] : null;
        $metodo_pago = isset($data['metodo_pago']) ? (string)$data['metodo_pago'] : 'efectivo';
        $descuento = isset($data['descuento']) ? (float)$data['descuento'] : 0.0;
        $notas = $data['notas'] ?? '';

        if ($user_id <= 0 || $plan_id <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'user_id y plan_id son requeridos',
            ]);
            return;
        }

        $stmt = $pdo->prepare('SELECT id, first_name, last_name FROM api_customuser WHERE id = ?');
        $stmt->execute([$user_id]);
        $usuario = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$usuario) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }

        $stmt = $pdo->prepare('SELECT id, nombre, precio_base, duracion_meses FROM api_plan WHERE id = ?');
        $stmt->execute([$plan_id]);
        $plan = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$plan) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
            return;
        }

        $precio_plan = (float)$plan['precio_base'];
        $precio_especializacion = 0.0;
        if ($especializacion_id) {
            $precio_especializacion = 50000.0;
        }

        $precio_total = $precio_plan + $precio_especializacion - $descuento;

        $fecha_inicio = new DateTime(date('Y-m-d')); 
        $fecha_fin = clone $fecha_inicio;
        $duracion_meses = (int)$plan['duracion_meses'];
        if ($duracion_meses <= 0) {
            $duracion_meses = 1;
        }
        $fecha_fin->modify('+' . ($duracion_meses * 30) . ' days');

        $clases_totales = 9;
        $nombrePlan = $plan['nombre'];
        if (strpos($nombrePlan, 'Cero a Héroe') !== false || strpos($nombrePlan, 'Kids') !== false) {
            $clases_totales = 8;
        }

        $vendido_por_id = isset($user->user_id) ? (int)$user->user_id : null;

        $pdo->beginTransaction();

        $sqlVenta = 'INSERT INTO api_venta (
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

        $stmt = $pdo->prepare($sqlVenta);
        $stmt->execute([
            ':estudiante_id' => $user_id,
            ':plan_id' => $plan_id,
            ':especializacion_id' => $especializacion_id,
            ':precio_plan' => $precio_plan,
            ':precio_especializacion' => $precio_especializacion,
            ':descuento' => $descuento,
            ':precio_total' => $precio_total,
            ':metodo_pago' => $metodo_pago,
            ':referencia_pago' => null,
            ':estado' => 'pagado',
            ':notas' => $notas,
            ':vendido_por_id' => $vendido_por_id,
            ':fecha_inicio_plan' => $fecha_inicio->format('Y-m-d'),
            ':fecha_fin_plan' => $fecha_fin->format('Y-m-d'),
        ]);

        $ventaId = (int)$pdo->lastInsertId();

        $sqlSub = 'INSERT INTO api_suscripcion (
                        venta_id, estudiante_id, plan_id,
                        fecha_inicio, fecha_fin, estado,
                        clases_totales, clases_tomadas,
                        recordatorio_enviado, fecha_recordatorio,
                        created_at, updated_at
                   ) VALUES (
                        :venta_id, :estudiante_id, :plan_id,
                        :fecha_inicio, :fecha_fin, :estado,
                        :clases_totales, :clases_tomadas,
                        0, NULL,
                        NOW(), NOW()
                   )';
        $stmt = $pdo->prepare($sqlSub);
        $stmt->execute([
            ':venta_id' => $ventaId,
            ':estudiante_id' => $user_id,
            ':plan_id' => $plan_id,
            ':fecha_inicio' => $fecha_inicio->format('Y-m-d'),
            ':fecha_fin' => $fecha_fin->format('Y-m-d'),
            ':estado' => 'activa',
            ':clases_totales' => $clases_totales,
            ':clases_tomadas' => 0,
        ]);

        $suscripcionId = (int)$pdo->lastInsertId();

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Plan asignado exitosamente',
            'venta_id' => $ventaId,
            'suscripcion_id' => $suscripcionId,
            'fecha_inicio' => $fecha_inicio->format('Y-m-d'),
            'fecha_fin' => $fecha_fin->format('Y-m-d'),
            'precio_total' => $precio_total,
            'clases_totales' => $clases_totales,
        ]);
        return;
    }

    /* ===================== ENVIAR RECORDATORIO (NO CREA NOTIFICACIÓN ESTUDIANTE AÚN) ===================== */
    if ($method === 'POST' && $seg1 === 'recordatorio') {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $venta_id = isset($data['venta_id']) ? (int)$data['venta_id'] : 0;
        $mensaje = isset($data['mensaje']) ? (string)$data['mensaje'] : '';

        if ($venta_id <= 0) {
            http_response_code(400);
            echo json_encode([
                'success' => false,
                'message' => 'venta_id es requerido',
            ]);
            return;
        }

        $stmt = $pdo->prepare('SELECT v.*, u.first_name, u.last_name FROM api_venta v JOIN api_customuser u ON v.estudiante_id = u.id WHERE v.id = ?');
        $stmt->execute([$venta_id]);
        $venta = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$venta) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Venta no encontrada']);
            return;
        }

        $diasRestantes = null;
        if (!empty($venta['fecha_fin_plan'])) {
            $hoy = new DateTime(date('Y-m-d'));
            $fin = new DateTime($venta['fecha_fin_plan']);
            $diasRestantes = (int)$hoy->diff($fin)->format('%r%a');
        }

        if ($mensaje === '') {
            $mensaje = 'Tu plan vence pronto. Por favor, realiza tu renovación para continuar con tus clases.';
        }

        $stmt = $pdo->prepare('UPDATE api_suscripcion SET recordatorio_enviado = 1, fecha_recordatorio = NOW() WHERE venta_id = ?');
        $stmt->execute([$venta_id]);

        echo json_encode([
            'success' => true,
            'message' => 'Recordatorio registrado correctamente',
            'dias_restantes' => $diasRestantes,
        ]);
        return;
    }

    /* ===================== RENOVAR PLAN ===================== */
    if ($method === 'POST' && $seg1 === 'renovar') {
        $raw = file_get_contents('php://input');
        $data = $raw ? json_decode($raw, true) : [];
        if (!is_array($data)) {
            $data = [];
        }

        $venta_id = isset($data['venta_id']) ? (int)$data['venta_id'] : 0;
        $nuevo_plan_id = isset($data['nuevo_plan_id']) ? (int)$data['nuevo_plan_id'] : null;
        $metodo_pago = isset($data['metodo_pago']) ? (string)$data['metodo_pago'] : 'efectivo';
        $descuento = isset($data['descuento']) ? (float)$data['descuento'] : 0.0;

        if ($venta_id <= 0) {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'venta_id es requerido']);
            return;
        }

        $stmt = $pdo->prepare('SELECT * FROM api_venta WHERE id = ?');
        $stmt->execute([$venta_id]);
        $ventaAnterior = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$ventaAnterior) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Venta no encontrada']);
            return;
        }

        $planId = $nuevo_plan_id ?: (int)$ventaAnterior['plan_id'];

        $stmt = $pdo->prepare('SELECT id, nombre, precio_base, duracion_meses FROM api_plan WHERE id = ?');
        $stmt->execute([$planId]);
        $plan = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$plan) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Plan no encontrado']);
            return;
        }

        $fecha_inicio = !empty($ventaAnterior['fecha_fin_plan']) ? new DateTime($ventaAnterior['fecha_fin_plan']) : new DateTime(date('Y-m-d'));
        $hoy = new DateTime(date('Y-m-d'));
        if ($fecha_inicio < $hoy) {
            $fecha_inicio = $hoy;
        }

        $duracion_meses = (int)$plan['duracion_meses'];
        if ($duracion_meses <= 0) {
            $duracion_meses = 1;
        }

        $fecha_fin = clone $fecha_inicio;
        $fecha_fin->modify('+' . ($duracion_meses * 30) . ' days');

        $precio_plan = (float)$plan['precio_base'];
        $precio_especializacion = (float)$ventaAnterior['precio_especializacion'];
        $precio_total = $precio_plan + $precio_especializacion - $descuento;

        $vendido_por_id = isset($user->user_id) ? (int)$user->user_id : null;

        $pdo->beginTransaction();

        $sqlVenta = 'INSERT INTO api_venta (
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

        $stmt = $pdo->prepare($sqlVenta);
        $stmt->execute([
            ':estudiante_id' => $ventaAnterior['estudiante_id'],
            ':plan_id' => $planId,
            ':especializacion_id' => $ventaAnterior['especializacion_id'],
            ':precio_plan' => $precio_plan,
            ':precio_especializacion' => $precio_especializacion,
            ':descuento' => $descuento,
            ':precio_total' => $precio_total,
            ':metodo_pago' => $metodo_pago,
            ':referencia_pago' => null,
            ':estado' => 'pagado',
            ':notas' => 'Renovación del plan anterior (ID: ' . $ventaAnterior['id'] . ')',
            ':vendido_por_id' => $vendido_por_id,
            ':fecha_inicio_plan' => $fecha_inicio->format('Y-m-d'),
            ':fecha_fin_plan' => $fecha_fin->format('Y-m-d'),
        ]);

        $nuevaVentaId = (int)$pdo->lastInsertId();

        $sqlSub = 'INSERT INTO api_suscripcion (
                        venta_id, estudiante_id, plan_id,
                        fecha_inicio, fecha_fin, estado,
                        clases_totales, clases_tomadas,
                        recordatorio_enviado, fecha_recordatorio,
                        created_at, updated_at
                   ) VALUES (
                        :venta_id, :estudiante_id, :plan_id,
                        :fecha_inicio, :fecha_fin, :estado,
                        :clases_totales, :clases_tomadas,
                        0, NULL,
                        NOW(), NOW()
                   )';
        $stmt = $pdo->prepare($sqlSub);
        $stmt->execute([
            ':venta_id' => $nuevaVentaId,
            ':estudiante_id' => $ventaAnterior['estudiante_id'],
            ':plan_id' => $planId,
            ':fecha_inicio' => $fecha_inicio->format('Y-m-d'),
            ':fecha_fin' => $fecha_fin->format('Y-m-d'),
            ':estado' => 'activa',
            ':clases_totales' => 9,
            ':clases_tomadas' => 0,
        ]);

        $nuevaSuscripcionId = (int)$pdo->lastInsertId();

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Plan renovado exitosamente',
            'nueva_venta_id' => $nuevaVentaId,
            'nueva_suscripcion_id' => $nuevaSuscripcionId,
            'fecha_fin' => $fecha_fin->format('Y-m-d'),
        ]);
        return;
    }

    /* ===================== CANCELAR SUSCRIPCION ===================== */
    if ($method === 'POST' && $seg1 !== null && ctype_digit($seg1) && $seg2 === 'cancelar') {
        $suscripcionId = (int)$seg1;

        $stmt = $pdo->prepare('SELECT * FROM api_suscripcion WHERE id = ?');
        $stmt->execute([$suscripcionId]);
        $suscripcion = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$suscripcion) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Suscripción no encontrada']);
            return;
        }

        if ($suscripcion['estado'] === 'cancelada') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Esta suscripción ya está cancelada']);
            return;
        }

        $stmt = $pdo->prepare("UPDATE api_suscripcion SET estado = 'cancelada', updated_at = NOW() WHERE id = ?");
        $stmt->execute([$suscripcionId]);

        if (!empty($suscripcion['venta_id'])) {
            $stmt = $pdo->prepare("UPDATE api_venta SET estado = 'cancelado', updated_at = NOW() WHERE id = ?");
            $stmt->execute([$suscripcion['venta_id']]);
        }

        echo json_encode([
            'success' => true,
            'message' => 'Suscripción cancelada exitosamente',
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido en /suscripciones',
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de suscripciones',
        'error' => $e->getMessage(),
    ]);
}
