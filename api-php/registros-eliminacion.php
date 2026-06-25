<?php
/**
 * API para registros de eliminación (tabla api_registroeliminacion)
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

function registros_verificar_jwt()
{
    $headers = getallheaders();
    if (!isset($headers['Authorization'])) {
        return null;
    }

    $token = str_replace('Bearer ', '', $headers['Authorization']);
    $payload = jwt_decode_simple($token);
    if ($payload === false || $payload === null) {
        return null;
    }

    return (object)$payload;
}

function registros_razon_choices()
{
    return [
        'termino_clases'   => 'Terminó sus clases',
        'no_pago'          => 'No realizó el pago',
        'abandono'         => 'Abandonó el curso',
        'solicitud_propia' => 'Solicitud del estudiante',
        'comportamiento'   => 'Problemas de comportamiento',
        'cambio_horario'   => 'No se adaptó al horario',
        'otro'             => 'Otra razón',
    ];
}

function registros_tiempo_registrado_str($dias)
{
    $dias = (int)$dias;
    if ($dias < 30) {
        return $dias . ' días';
    } elseif ($dias < 365) {
        $meses = intdiv($dias, 30);
        return $meses . ' ' . ($meses === 1 ? 'mes' : 'meses');
    } else {
        $anos = intdiv($dias, 365);
        $meses = intdiv($dias % 365, 30);
        return $anos . ' ' . ($anos === 1 ? 'año' : 'años') . ' y ' . $meses . ' ' . ($meses === 1 ? 'mes' : 'meses');
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('registros-eliminacion', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$extra1 = $parts[$index + 1] ?? null; // puede ser 'estadisticas' o null

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $user = registros_verificar_jwt();
    if (!$user) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit();
    }

    if (!in_array($user->role, ['admin', 'financiero'], true)) {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'No tienes permisos para ver esta información']);
        exit();
    }

    $razonMap = registros_razon_choices();

    // LISTAR REGISTROS: GET /registros-eliminacion/
    if ($method === 'GET' && ($extra1 === null || $extra1 === '')) {
        $razon = isset($_GET['razon']) && $_GET['razon'] !== '' ? $_GET['razon'] : null;
        $search = isset($_GET['search']) && $_GET['search'] !== '' ? $_GET['search'] : null;

        $sql = "SELECT re.*, 
                       u.id AS eliminado_por_id,
                       u.username AS eliminado_por_username,
                       u.first_name AS eliminado_por_first_name,
                       u.last_name AS eliminado_por_last_name
                FROM api_registroeliminacion re
                LEFT JOIN api_customuser u ON re.eliminado_por_id = u.id";

        $where = [];
        $params = [];

        if ($razon) {
            $where[] = 're.razon = ?';
            $params[] = $razon;
        }

        if ($search) {
            $where[] = '(re.first_name LIKE ? OR re.last_name LIKE ? OR re.email LIKE ? OR re.username LIKE ? OR re.cedula LIKE ?)';
            $searchLike = '%' . $search . '%';
            for ($i = 0; $i < 5; $i++) {
                $params[] = $searchLike;
            }
        }

        if (!empty($where)) {
            $sql .= ' WHERE ' . implode(' AND ', $where);
        }

        $sql .= ' ORDER BY re.fecha_eliminacion DESC';

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $data = [];
        foreach ($rows as $row) {
            $dias = isset($row['dias_registrado']) ? (int)$row['dias_registrado'] : 0;
            $nombreCompleto = trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? ''));

            $eliminadoPorNombre = null;
            if (!empty($row['eliminado_por_first_name']) || !empty($row['eliminado_por_last_name'])) {
                $eliminadoPorNombre = trim(($row['eliminado_por_first_name'] ?? '') . ' ' . ($row['eliminado_por_last_name'] ?? ''));
            }

            $data[] = [
                'id' => (int)$row['id'],
                'username' => $row['username'],
                'email' => $row['email'],
                'first_name' => $row['first_name'],
                'last_name' => $row['last_name'],
                'nombre_completo' => $nombreCompleto,
                'phone' => $row['phone'],
                'cedula' => $row['cedula'],
                'nivel' => $row['nivel'],
                'bloque_asignado' => $row['bloque_asignado'],
                'especializacion' => $row['especializacion'],
                'fecha_registro' => $row['fecha_registro'],
                'fecha_eliminacion' => $row['fecha_eliminacion'],
                'dias_registrado' => $dias,
                'tiempo_registrado_str' => registros_tiempo_registrado_str($dias),
                'razon' => $row['razon'],
                'razon_display' => $razonMap[$row['razon']] ?? $row['razon'],
                'descripcion_adicional' => $row['descripcion_adicional'],
                'plan_activo' => $row['plan_activo'],
                'deuda_pendiente' => (string)$row['deuda_pendiente'],
                'eliminado_por' => [
                    'id' => $row['eliminado_por_id'] !== null ? (int)$row['eliminado_por_id'] : null,
                    'username' => $row['eliminado_por_username'] ?? null,
                    'nombre' => $eliminadoPorNombre,
                ],
                'notas' => $row['notas'],
            ];
        }

        echo json_encode([
            'success' => true,
            'registros' => $data,
            'total' => count($data),
        ]);
        return;
    }

    // ESTADÍSTICAS: GET /registros-eliminacion/estadisticas/
    if ($method === 'GET' && $extra1 === 'estadisticas') {
        $stmt = $pdo->prepare('SELECT razon, dias_registrado, deuda_pendiente FROM api_registroeliminacion');
        $stmt->execute();
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $total = count($rows);
        $totalDias = 0;
        $totalDeuda = 0.0;

        $razonesCount = [];
        foreach ($razonMap as $key => $display) {
            $razonesCount[$key] = [
                'count' => 0,
                'display' => $display,
            ];
        }

        foreach ($rows as $row) {
            $r = $row['razon'];
            if (!isset($razonesCount[$r])) {
                $razonesCount[$r] = [
                    'count' => 0,
                    'display' => $r,
                ];
            }

            $razonesCount[$r]['count']++;
            $totalDias += (int)$row['dias_registrado'];
            $totalDeuda += (float)$row['deuda_pendiente'];
        }

        $promedioDias = $total > 0 ? round($totalDias / $total, 2) : 0.0;
        $totalDeuda = round($totalDeuda, 2);

        echo json_encode([
            'success' => true,
            'estadisticas' => [
                'total_eliminaciones' => $total,
                'por_razon' => $razonesCount,
                'promedio_dias_registrado' => $promedioDias,
                'total_deuda_pendiente' => $totalDeuda,
            ],
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
        'message' => 'Error en el servidor de registros de eliminación',
        'error' => $e->getMessage(),
    ]);
}
