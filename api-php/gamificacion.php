<?php
/**
 * API de Gamificación (dulces, XP, reto diario y misiones)
 * Usa la tabla api_customuser y los campos:
 * - total_dulces INT
 * - total_xp INT
 * - reto_racha_actual INT
 * - reto_mejor_racha INT
 * - reto_ultima_fecha DATE (YYYY-MM-DD)
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

function gamif_verify_jwt()
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

    if (is_array($payload)) {
        return (object)$payload;
    }
    return $payload;
}

/**
 * Determina el título del estudiante según su XP total.
 * Devuelve un arreglo con:
 *  - code: identificador interno
 *  - name: nombre visible del título
 *  - next_xp: XP necesario para el siguiente título (o null si es el máximo)
 */
function gamif_get_title_for_xp($xp)
{
    $xp = (int)$xp;

    if ($xp < 100) {
        return [
            'code' => 'alphabet_explorer',
            'name' => 'Alphabet Explorer',
            'next_xp' => 100,
        ];
    } elseif ($xp < 250) {
        return [
            'code' => 'word_builder',
            'name' => 'Word Builder',
            'next_xp' => 250,
        ];
    } elseif ($xp < 500) {
        return [
            'code' => 'grammar_adventurer',
            'name' => 'Grammar Adventurer',
            'next_xp' => 500,
        ];
    } elseif ($xp < 1000) {
        return [
            'code' => 'conversation_starter',
            'name' => 'Conversation Starter',
            'next_xp' => 1000,
        ];
    } elseif ($xp < 2000) {
        return [
            'code' => 'fluent_traveler',
            'name' => 'Fluent Traveler',
            'next_xp' => 2000,
        ];
    }

    return [
        'code' => 'english_master',
        'name' => 'English Master',
        'next_xp' => null,
    ];
}

/**
 * Devuelve todos los logros desbloqueados según dulces totales y mejor racha.
 * No persiste nada, solo calcula en base a los valores actuales.
 */
function gamif_get_achievements($totalDulces, $mejorRacha)
{
    $totalDulces = (int)$totalDulces;
    $mejorRacha = (int)$mejorRacha;

    $achievements = [];

    // Logros por dulces (deben coincidir con los premios del frontend)
    $candyThresholds = [
        50  => ['code' => 'candies_50',  'name' => 'Explorador Novato'],
        100 => ['code' => 'candies_100', 'name' => 'Coleccionista de Palabras'],
        200 => ['code' => 'candies_200', 'name' => 'Maestro de Gramática'],
        350 => ['code' => 'candies_350', 'name' => 'Conversador Experto'],
        500 => ['code' => 'candies_500', 'name' => 'Guía de Lingo'],
        750 => ['code' => 'candies_750', 'name' => 'Leyenda del Aprendizaje'],
    ];

    foreach ($candyThresholds as $threshold => $info) {
        if ($totalDulces >= $threshold) {
            $achievements[] = [
                'code' => $info['code'],
                'name' => $info['name'],
                'type' => 'candies',
                'threshold' => $threshold,
            ];
        }
    }

    // Logros por mejor racha
    $streakThresholds = [
        3  => ['code' => 'streak_3',  'name' => 'Racha Temprana'],
        7  => ['code' => 'streak_7',  'name' => 'Racha de 7 días'],
        14 => ['code' => 'streak_14', 'name' => 'Héroe de los Retos'],
        30 => ['code' => 'streak_30', 'name' => 'Maratonista del Inglés'],
    ];

    foreach ($streakThresholds as $threshold => $info) {
        if ($mejorRacha >= $threshold) {
            $achievements[] = [
                'code' => $info['code'],
                'name' => $info['name'],
                'type' => 'streak',
                'threshold' => $threshold,
            ];
        }
    }

    return $achievements;
}

/**
 * Devuelve los nuevos logros desbloqueados comparando valores antiguos vs nuevos
 */
function gamif_get_new_achievements($oldDulces, $oldMejorRacha, $newDulces, $newMejorRacha)
{
    $oldDulces = (int)$oldDulces;
    $oldMejorRacha = (int)$oldMejorRacha;
    $newDulces = (int)$newDulces;
    $newMejorRacha = (int)$newMejorRacha;

    $newAchievements = [];

    // Candies
    $candyThresholds = [
        50  => ['code' => 'candies_50',  'name' => 'Explorador Novato'],
        100 => ['code' => 'candies_100', 'name' => 'Coleccionista de Palabras'],
        200 => ['code' => 'candies_200', 'name' => 'Maestro de Gramática'],
        350 => ['code' => 'candies_350', 'name' => 'Conversador Experto'],
        500 => ['code' => 'candies_500', 'name' => 'Guía de Lingo'],
        750 => ['code' => 'candies_750', 'name' => 'Leyenda del Aprendizaje'],
    ];

    foreach ($candyThresholds as $threshold => $info) {
        if ($oldDulces < $threshold && $newDulces >= $threshold) {
            $newAchievements[] = [
                'code' => $info['code'],
                'name' => $info['name'],
                'type' => 'candies',
                'threshold' => $threshold,
            ];
        }
    }

    // Streak (mejor racha)
    $streakThresholds = [
        3  => ['code' => 'streak_3',  'name' => 'Racha Temprana'],
        7  => ['code' => 'streak_7',  'name' => 'Racha de 7 días'],
        14 => ['code' => 'streak_14', 'name' => 'Héroe de los Retos'],
        30 => ['code' => 'streak_30', 'name' => 'Maratonista del Inglés'],
    ];

    foreach ($streakThresholds as $threshold => $info) {
        if ($oldMejorRacha < $threshold && $newMejorRacha >= $threshold) {
            $newAchievements[] = [
                'code' => $info['code'],
                'name' => $info['name'],
                'type' => 'streak',
                'threshold' => $threshold,
            ];
        }
    }

    return $newAchievements;
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));

$index = array_search('gamificacion', $parts);
if ($index === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$seg1 = $parts[$index + 1] ?? null; // "estado", "reto-diario" o "mision"

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    $user = gamif_verify_jwt();
    if (!$user || !isset($user->user_id)) {
        http_response_code(401);
        echo json_encode(['success' => false, 'message' => 'Token inválido']);
        exit();
    }

    $userId = (int)$user->user_id;
    if ($userId <= 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Usuario inválido en token']);
        exit();
    }

    // ============ GET /gamificacion/estado/ ============
    if ($method === 'GET' && $seg1 === 'estado') {
        $stmt = $pdo->prepare('SELECT total_dulces, total_xp, reto_racha_actual, reto_mejor_racha, reto_ultima_fecha, reto_completados_total, reto_fallidos_total FROM api_customuser WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }

        $totalDulces = (int)($row['total_dulces'] ?? 0);
        $totalXp = (int)($row['total_xp'] ?? 0);
        $rachaActual = (int)($row['reto_racha_actual'] ?? 0);
        $mejorRacha = (int)($row['reto_mejor_racha'] ?? 0);
        $ultimaFecha = $row['reto_ultima_fecha'] ?: null;
        $retosCompletados = (int)($row['reto_completados_total'] ?? 0);
        $retosFallidos = (int)($row['reto_fallidos_total'] ?? 0);

        $titleInfo = gamif_get_title_for_xp($totalXp);
        $achievements = gamif_get_achievements($totalDulces, $mejorRacha);

        echo json_encode([
            'success' => true,
            'data' => [
                'total_dulces' => $totalDulces,
                'total_xp' => $totalXp,
                'reto_racha_actual' => $rachaActual,
                'reto_mejor_racha' => $mejorRacha,
                'reto_ultima_fecha' => $ultimaFecha,
                'reto_completados_total' => $retosCompletados,
                'reto_fallidos_total' => $retosFallidos,
                'title' => $titleInfo['name'],
                'title_code' => $titleInfo['code'],
                'next_title_xp' => $titleInfo['next_xp'],
                'achievements' => $achievements,
            ],
        ]);
        return;
    }

    // ============ GET /gamificacion/ranking-retos/ ============
    if ($method === 'GET' && $seg1 === 'ranking-retos') {
        // Ranking global de estudiantes por retos diarios
        // Opcionalmente filtra por nivel de inglés (?nivel=A1, A2+, etc.)

        $nivel = isset($_GET['nivel']) ? trim($_GET['nivel']) : '';

        $sql = "SELECT
                    id,
                    first_name,
                    last_name,
                    email,
                    english_level,
                    total_dulces,
                    total_xp,
                    reto_mejor_racha,
                    COALESCE(reto_completados_total, 0) AS reto_completados_total,
                    COALESCE(reto_fallidos_total, 0)   AS reto_fallidos_total
                FROM api_customuser
                WHERE role = 'student'
                  AND is_active = 1";

        $params = [];
        if ($nivel !== '') {
            $sql .= " AND english_level = ?";
            $params[] = $nivel;
        }

        $sql .= " ORDER BY
                    reto_completados_total DESC,
                    reto_mejor_racha DESC,
                    total_xp DESC,
                    last_name ASC,
                    first_name ASC
                  LIMIT 100";

        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $ranking = [];
        foreach ($rows as $row) {
            $ranking[] = [
                'id' => (int)($row['id'] ?? 0),
                'full_name' => trim(($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '')),
                'email' => $row['email'] ?? '',
                'nivel' => $row['english_level'] ?? '',
                'total_dulces' => (int)($row['total_dulces'] ?? 0),
                'total_xp' => (int)($row['total_xp'] ?? 0),
                'reto_mejor_racha' => (int)($row['reto_mejor_racha'] ?? 0),
                'reto_completados_total' => (int)($row['reto_completados_total'] ?? 0),
                'reto_fallidos_total' => (int)($row['reto_fallidos_total'] ?? 0),
            ];
        }

        echo json_encode([
            'success' => true,
            'data' => $ranking,
        ]);
        return;
    }

    // ============ POST /gamificacion/reto-diario/ ============
    if ($method === 'POST' && $seg1 === 'reto-diario') {
        $stmt = $pdo->prepare('SELECT total_dulces, total_xp, reto_racha_actual, reto_mejor_racha, reto_ultima_fecha, reto_completados_total, reto_fallidos_total FROM api_customuser WHERE id = ? FOR UPDATE');
        $pdo->beginTransaction();
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }

        $totalDulces = (int)($row['total_dulces'] ?? 0);
        $totalXp = (int)($row['total_xp'] ?? 0);
        $rachaActual = (int)($row['reto_racha_actual'] ?? 0);
        $mejorRacha = (int)($row['reto_mejor_racha'] ?? 0);
        $ultimaFecha = $row['reto_ultima_fecha'] ?: null;

        // Valores antiguos para calcular nuevos logros
        $oldTotalDulces = $totalDulces;
        $oldMejorRacha = $mejorRacha;

        $hoy = new DateTime(date('Y-m-d'));
        $hoyStr = $hoy->format('Y-m-d');

        if ($ultimaFecha === $hoyStr) {
            // Ya reclamó hoy
            $pdo->commit();
            $titleInfo = gamif_get_title_for_xp($totalXp);
            $achievements = gamif_get_achievements($totalDulces, $mejorRacha);
            echo json_encode([
                'success' => false,
                'message' => 'Ya reclamaste la recompensa del reto diario hoy',
                'data' => [
                    'total_dulces' => $totalDulces,
                    'total_xp' => $totalXp,
                    'reto_racha_actual' => $rachaActual,
                    'reto_mejor_racha' => $mejorRacha,
                    'reto_ultima_fecha' => $ultimaFecha,
                    'title' => $titleInfo['name'],
                    'title_code' => $titleInfo['code'],
                    'next_title_xp' => $titleInfo['next_xp'],
                    'achievements' => $achievements,
                ],
            ]);
            return;
        }

        if ($ultimaFecha !== null) {
            $ultima = DateTime::createFromFormat('Y-m-d', $ultimaFecha);
        } else {
            $ultima = null;
        }

        $ayer = clone $hoy;
        $ayer->modify('-1 day');
        $ayerStr = $ayer->format('Y-m-d');

        if ($ultima && $ultima->format('Y-m-d') === $ayerStr) {
            $rachaActual += 1;
        } else {
            $rachaActual = 1;
        }

        if ($rachaActual > $mejorRacha) {
            $mejorRacha = $rachaActual;
        }

        $dulcesBase = 5;
        $xpBase = 15;
        $dulcesBonus = 0;
        $xpBonus = 0;
        $bonusAplicado = false;

        if ($rachaActual >= 15) {
            $dulcesBonus += 25;
            $xpBonus += 80;
            $rachaActual = 0; // Reiniciar racha tras ciclo completo
            $bonusAplicado = true;
        }

        $ganados = $dulcesBase + $dulcesBonus;
        $ganadosXp = $xpBase + $xpBonus;

        $totalDulces += $ganados;
        $totalXp += $ganadosXp;
        $retosCompletados += 1;

        $update = $pdo->prepare('UPDATE api_customuser SET total_dulces = ?, total_xp = ?, reto_racha_actual = ?, reto_mejor_racha = ?, reto_ultima_fecha = ?, reto_completados_total = ? WHERE id = ?');
        $update->execute([
            $totalDulces,
            $totalXp,
            $rachaActual,
            $mejorRacha,
            $hoyStr,
            $retosCompletados,
            $userId,
        ]);

        $pdo->commit();

        $titleInfo = gamif_get_title_for_xp($totalXp);
        $achievements = gamif_get_achievements($totalDulces, $mejorRacha);
        $newAchievements = gamif_get_new_achievements($oldTotalDulces, $oldMejorRacha, $totalDulces, $mejorRacha);

        echo json_encode([
            'success' => true,
            'message' => 'Recompensa de reto diario aplicada',
            'data' => [
                'total_dulces' => $totalDulces,
                'total_xp' => $totalXp,
                'reto_racha_actual' => $rachaActual,
                'reto_mejor_racha' => $mejorRacha,
                'reto_ultima_fecha' => $hoyStr,
                'reto_completados_total' => $retosCompletados,
                'reto_fallidos_total' => $retosFallidos,
                'dulces_ganados' => $ganados,
                'xp_ganado' => $ganadosXp,
                'bonus_aplicado' => $bonusAplicado,
                'title' => $titleInfo['name'],
                'title_code' => $titleInfo['code'],
                'next_title_xp' => $titleInfo['next_xp'],
                'achievements' => $achievements,
                'new_achievements' => $newAchievements,
            ],
        ]);
        return;
    }

    // ============ POST /gamificacion/reto-diario-fallo/ ============
    if ($method === 'POST' && $seg1 === 'reto-diario-fallo') {
        // Solo incrementa el contador de fallos, no modifica racha ni dulces/XP
        $stmt = $pdo->prepare('SELECT reto_fallidos_total FROM api_customuser WHERE id = ? FOR UPDATE');
        $pdo->beginTransaction();
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            $pdo->rollBack();
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }

        $retosFallidos = (int)($row['reto_fallidos_total'] ?? 0);
        $retosFallidos += 1;

        $update = $pdo->prepare('UPDATE api_customuser SET reto_fallidos_total = ? WHERE id = ?');
        $update->execute([$retosFallidos, $userId]);

        $pdo->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Fallo de reto diario registrado',
            'data' => [
                'reto_fallidos_total' => $retosFallidos,
            ],
        ]);
        return;
    }

    // ============ POST /gamificacion/mision/ ============
    if ($method === 'POST' && $seg1 === 'mision') {
        $dulcesMision = 20;
        $xpMision = 30;

        $stmt = $pdo->prepare('SELECT total_dulces, total_xp, reto_mejor_racha FROM api_customuser WHERE id = ?');
        $stmt->execute([$userId]);
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            http_response_code(404);
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            return;
        }

        $oldTotalDulces = (int)($row['total_dulces'] ?? 0);
        $oldMejorRacha = (int)($row['reto_mejor_racha'] ?? 0);

        $totalDulces = $oldTotalDulces + $dulcesMision;
        $totalXp = (int)($row['total_xp'] ?? 0) + $xpMision;

        $update = $pdo->prepare('UPDATE api_customuser SET total_dulces = ?, total_xp = ? WHERE id = ?');
        $update->execute([$totalDulces, $totalXp, $userId]);

        $titleInfo = gamif_get_title_for_xp($totalXp);
        $achievements = gamif_get_achievements($totalDulces, $oldMejorRacha);
        $newAchievements = gamif_get_new_achievements($oldTotalDulces, $oldMejorRacha, $totalDulces, $oldMejorRacha);

        echo json_encode([
            'success' => true,
            'message' => 'Recompensa de misión aplicada',
            'data' => [
                'total_dulces' => $totalDulces,
                'total_xp' => $totalXp,
                'dulces_ganados' => $dulcesMision,
                'xp_ganado' => $xpMision,
                'title' => $titleInfo['name'],
                'title_code' => $titleInfo['code'],
                'next_title_xp' => $titleInfo['next_xp'],
                'achievements' => $achievements,
                'new_achievements' => $newAchievements,
            ],
        ]);
        return;
    }

    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Ruta o método no permitido en /gamificacion',
    ]);

} catch (Exception $e) {
    if ($pdo && $pdo->inTransaction()) {
        $pdo->rollBack();
    }
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error en el servidor de gamificación',
        'error' => $e->getMessage(),
    ]);
}
