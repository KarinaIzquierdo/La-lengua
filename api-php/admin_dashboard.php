<?php
/**
 * API para estadísticas y gráficas del dashboard admin
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

function admin_verify_jwt()
{
    if (!function_exists('getallheaders')) {
        return null;
    }
    $headers = getallheaders();
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

function admin_month_label($monthString)
{
    if (!$monthString) {
        return '';
    }
    $ts = strtotime($monthString);
    if ($ts === false) {
        return $monthString;
    }
    return date('M Y', $ts); // Ej: "Jan 2025"
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('admin', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint admin no encontrado']);
    exit();
}

$seg1 = $parts[$index + 1] ?? null; // "dashboard-stats" o "dashboard-charts"

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $user = admin_verify_jwt();
    if (!$user || !isset($user->role) || $user->role !== 'admin') {
        http_response_code(403);
        echo json_encode(['success' => false, 'message' => 'Solo administradores pueden ver estas estadísticas']);
        exit();
    }

    // ===================== /admin/dashboard-stats/ =====================
    if ($method === 'GET' && $seg1 === 'dashboard-stats') {
        $today = date('Y-m-d');
        $startOfMonth = date('Y-m-01', strtotime($today));

        // Total de estudiantes activos
        $stmt = $pdo->prepare("SELECT COUNT(*) AS total FROM api_customuser WHERE role IN ('student', 'estudiante') AND is_active = 1");
        $stmt->execute();
        $totalStudents = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Clases programadas (hoy en adelante) con estado programada o activa
        $sqlClasses = "SELECT COUNT(*) AS total FROM api_clase WHERE fecha >= ? AND estado IN ('programada', 'activa')";
        $stmt = $pdo->prepare($sqlClasses);
        $stmt->execute([$today]);
        $scheduledClasses = (int)$stmt->fetch(PDO::FETCH_ASSOC)['total'];

        // Ingresos del mes: ventas pagadas en el mes actual
        $sqlVentas = "SELECT SUM(precio_total) AS total FROM api_venta WHERE estado = 'pagado' AND DATE(fecha_venta) >= ? AND DATE(fecha_venta) <= ?";
        $stmt = $pdo->prepare($sqlVentas);
        $stmt->execute([$startOfMonth, $today]);
        $ventasMes = $stmt->fetch(PDO::FETCH_ASSOC);
        $monthlyRevenue = isset($ventasMes['total']) ? (float)$ventasMes['total'] : 0.0;

        echo json_encode([
            'success' => true,
            'data' => [
                'total_students' => $totalStudents,
                'scheduled_classes' => $scheduledClasses,
                'monthly_revenue' => $monthlyRevenue,
                'month_start' => $startOfMonth,
                'today' => $today,
            ],
        ]);
        exit();
    }

    // ===================== /admin/dashboard-charts/ =====================
    if ($method === 'GET' && $seg1 === 'dashboard-charts') {
        // 1) Nuevos y egresados por mes (últimos 6 meses)
        $sqlNew = "SELECT DATE_FORMAT(date_joined, '%Y-%m-01') AS month, COUNT(*) AS count
                    FROM api_customuser
                    WHERE role IN ('student', 'estudiante') AND date_joined IS NOT NULL
                    GROUP BY month
                    ORDER BY month";
        $stmt = $pdo->prepare($sqlNew);
        $stmt->execute();
        $newRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $sqlRemoved = "SELECT DATE_FORMAT(fecha_eliminacion, '%Y-%m-01') AS month, COUNT(*) AS count
                        FROM api_registroeliminacion
                        GROUP BY month
                        ORDER BY month";
        $stmt = $pdo->prepare($sqlRemoved);
        $stmt->execute();
        $removedRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $monthsSet = [];
        foreach ($newRows as $row) {
            if (!empty($row['month'])) {
                $monthsSet[$row['month']] = $row['month'];
            }
        }
        foreach ($removedRows as $row) {
            if (!empty($row['month'])) {
                $monthsSet[$row['month']] = $row['month'];
            }
        }

        $months = array_values($monthsSet);
        sort($months);
        if (count($months) > 6) {
            $months = array_slice($months, -6);
        }

        $newMap = [];
        foreach ($newRows as $row) {
            $newMap[$row['month']] = (int)$row['count'];
        }
        $removedMap = [];
        foreach ($removedRows as $row) {
            $removedMap[$row['month']] = (int)$row['count'];
        }

        $studentsMonthlyLabels = [];
        $studentsNew = [];
        $studentsRemoved = [];
        foreach ($months as $m) {
            $studentsMonthlyLabels[] = admin_month_label($m);
            $studentsNew[] = $newMap[$m] ?? 0;
            $studentsRemoved[] = $removedMap[$m] ?? 0;
        }

        $studentsMonthly = [
            'labels' => $studentsMonthlyLabels,
            'new' => $studentsNew,
            'removed' => $studentsRemoved,
        ];

        // 2) Distribución por nivel
        $sqlLevel = "SELECT english_level, COUNT(*) AS count
                      FROM api_customuser
                      WHERE role IN ('student', 'estudiante') AND is_active = 1
                      GROUP BY english_level
                      ORDER BY english_level";
        $stmt = $pdo->prepare($sqlLevel);
        $stmt->execute();
        $levelRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $levelLabels = [];
        $levelCounts = [];
        foreach ($levelRows as $row) {
            $label = $row['english_level'];
            if ($label === null || $label === '') {
                $label = 'Sin nivel';
            }
            $levelLabels[] = $label;
            $levelCounts[] = (int)$row['count'];
        }

        $levelDistribution = [
            'labels' => $levelLabels,
            'counts' => $levelCounts,
        ];

        // 3) Asistencia promedio por mes
        $sqlAtt = "SELECT DATE_FORMAT(fecha, '%Y-%m-01') AS month,
                           COUNT(*) AS total,
                           SUM(CASE WHEN estado = 'presente' THEN 1 ELSE 0 END) AS presentes
                    FROM api_asistencia
                    GROUP BY month
                    ORDER BY month";
        $stmt = $pdo->prepare($sqlAtt);
        $stmt->execute();
        $attRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $monthsAtt = [];
        foreach ($attRows as $row) {
            if (!empty($row['month'])) {
                $monthsAtt[] = $row['month'];
            }
        }
        sort($monthsAtt);
        if (count($monthsAtt) > 6) {
            $monthsAtt = array_slice($monthsAtt, -6);
        }

        $attMap = [];
        foreach ($attRows as $row) {
            $attMap[$row['month']] = $row;
        }

        $attendanceLabels = [];
        $attendancePercentages = [];
        foreach ($monthsAtt as $m) {
            $row = $attMap[$m];
            $total = (int)($row['total'] ?? 0);
            $presentes = (int)($row['presentes'] ?? 0);
            $pct = $total > 0 ? round(($presentes / $total) * 100, 1) : 0.0;
            $attendanceLabels[] = admin_month_label($m);
            $attendancePercentages[] = $pct;
        }

        $attendanceMonthly = [
            'labels' => $attendanceLabels,
            'percentage' => $attendancePercentages,
        ];

        // 4) Progreso promedio por nivel a partir de suscripciones
        $sqlSubs = "SELECT s.clases_totales, s.clases_tomadas, u.english_level
                     FROM api_suscripcion s
                     JOIN api_customuser u ON s.estudiante_id = u.id";
        $stmt = $pdo->prepare($sqlSubs);
        $stmt->execute();
        $subsRows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $levelProgressMap = [];
        foreach ($subsRows as $row) {
            $level = $row['english_level'];
            if ($level === null || $level === '') {
                $level = 'Sin nivel';
            }
            $clasesTotales = isset($row['clases_totales']) ? (int)$row['clases_totales'] : 0;
            $clasesTomadas = isset($row['clases_tomadas']) ? (int)$row['clases_tomadas'] : 0;
            $progreso = $clasesTotales > 0 ? ($clasesTomadas / max(1, $clasesTotales) * 100.0) : 0.0;

            if (!isset($levelProgressMap[$level])) {
                $levelProgressMap[$level] = ['sum' => 0.0, 'count' => 0];
            }
            $levelProgressMap[$level]['sum'] += $progreso;
            $levelProgressMap[$level]['count'] += 1;
        }

        $lpLabels = [];
        $lpAverages = [];
        foreach ($levelProgressMap as $level => $agg) {
            $lpLabels[] = $level;
            if ($agg['count'] > 0) {
                $lpAverages[] = round($agg['sum'] / $agg['count'], 1);
            } else {
                $lpAverages[] = 0.0;
            }
        }

        $levelProgress = [
            'labels' => $lpLabels,
            'averages' => $lpAverages,
        ];

        echo json_encode([
            'success' => true,
            'data' => [
                'students_monthly' => $studentsMonthly,
                'level_distribution' => $levelDistribution,
                'attendance_monthly' => $attendanceMonthly,
                'level_progress' => $levelProgress,
            ],
        ]);
        exit();
    }

    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Ruta admin no encontrada']);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de dashboard admin',
        'error' => $e->getMessage(),
    ]);
}
