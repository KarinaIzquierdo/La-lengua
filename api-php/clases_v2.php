<?php
/**
 * API de clases con soporte para estudiantes (tabla many-to-many api_clase_estudiantes)
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once 'config/database.php';

function obtenerEstudiantesPorClase($pdo, $claseId) {
    try {
        $stmt = $pdo->prepare('SELECT customuser_id FROM api_clase_estudiantes WHERE clase_id = ?');
        $stmt->execute([$claseId]);
        $rows = $stmt->fetchAll(PDO::FETCH_COLUMN);
        $ids = [];
        foreach ($rows as $sid) {
            $sidInt = intval($sid);
            if ($sidInt > 0) {
                $ids[$sidInt] = $sidInt;
            }
        }
        return array_values($ids);
    } catch (Exception $e) {
        return [];
    }
}

function sincronizarEstudiantesPorClase($pdo, $claseId, $estudiantesIds) {
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

    $del = $pdo->prepare('DELETE FROM api_clase_estudiantes WHERE clase_id = ?');
    $del->execute([$claseId]);

    if (empty($idsLimpios)) {
        return;
    }

    $ins = $pdo->prepare('INSERT INTO api_clase_estudiantes (clase_id, customuser_id) VALUES (?, ?)');
    foreach ($idsLimpios as $sidInt) {
        $ins->execute([$claseId, $sidInt]);
    }
}

$method = $_SERVER['REQUEST_METHOD'];
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$parts = explode('/', trim($uri, '/'));
$clasesIndex = array_search('clases', $parts);

if ($clasesIndex === false) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
    exit();
}

$id = null;
$action = null;

if (isset($parts[$clasesIndex + 1]) && is_numeric($parts[$clasesIndex + 1])) {
    $id = intval($parts[$clasesIndex + 1]);
    $action = $parts[$clasesIndex + 2] ?? null;
} elseif (isset($parts[$clasesIndex + 1])) {
    $action = $parts[$clasesIndex + 1];
}

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }

    switch ($method) {
        case 'GET':
            $where = [];
            $params = [];

            if (isset($_GET['profesor']) && $_GET['profesor'] !== '') {
                $where[] = 'profesor = ?';
                $params[] = $_GET['profesor'];
            }

            $sql = 'SELECT * FROM api_clase';
            if (!empty($where)) {
                $sql .= ' WHERE ' . implode(' AND ', $where);
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

            $mapped = [];
            foreach ($rows as $row) {
                if ((isset($row['COL 1']) && $row['COL 1'] === 'id') || (isset($row['id']) && $row['id'] === 'id')) {
                    continue;
                }

                if (isset($row['id'])) {
                    $mappedRow = [
                        'id' => $row['id'],
                        'nombre' => $row['nombre'] ?? null,
                        'profesor' => $row['profesor'] ?? null,
                        'fecha' => $row['fecha'] ?? null,
                        'created_at' => $row['created_at'] ?? null,
                        'updated_at' => $row['updated_at'] ?? null,
                        'descripcion' => $row['descripcion'] ?? null,
                        'duracion' => $row['duracion'] ?? null,
                        'hora' => $row['hora'] ?? null,
                        'meet_link' => $row['meet_link'] ?? null,
                        'modalidad' => $row['modalidad'] ?? null,
                        'tema' => $row['tema'] ?? null,
                        'tipo_clase' => $row['tipo_clase'] ?? null,
                        'estado' => $row['estado'] ?? null,
                    ];
                    $mappedRow['estudiantes'] = obtenerEstudiantesPorClase($pdo, $mappedRow['id']);
                    $mapped[] = $mappedRow;
                } elseif (isset($row['COL 1'])) {
                    $mappedRow = [
                        'id' => $row['COL 1'],
                        'nombre' => $row['COL 2'] ?? null,
                        'profesor' => $row['COL 3'] ?? null,
                        'fecha' => $row['COL 4'] ?? null,
                        'created_at' => $row['COL 5'] ?? null,
                        'updated_at' => $row['COL 6'] ?? null,
                        'descripcion' => $row['COL 7'] ?? null,
                        'duracion' => $row['COL 8'] ?? null,
                        'hora' => $row['COL 9'] ?? null,
                        'meet_link' => $row['COL 10'] ?? null,
                        'modalidad' => $row['COL 11'] ?? null,
                        'tema' => $row['COL 12'] ?? null,
                        'tipo_clase' => $row['COL 13'] ?? null,
                        'estado' => $row['COL 14'] ?? null,
                    ];
                    $mappedRow['estudiantes'] = obtenerEstudiantesPorClase($pdo, $mappedRow['id']);
                    $mapped[] = $mappedRow;
                } else {
                    $mapped[] = $row;
                }
            }

            echo json_encode([
                'success' => true,
                'data' => $mapped,
                'total' => count($mapped),
            ]);
            break;

        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                throw new Exception('JSON inválido');
            }

            if (empty($input['nombre']) || empty($input['profesor']) || empty($input['fecha'])) {
                throw new Exception('Campos requeridos: nombre, profesor, fecha');
            }

            $usaColumnasGenericas = false;
            try {
                $checkCols = $pdo->query("SHOW COLUMNS FROM api_clase LIKE 'COL 1'");
                $usaColumnasGenericas = $checkCols->fetch(PDO::FETCH_ASSOC) ? true : false;
            } catch (Exception $e) {
                $usaColumnasGenericas = false;
            }

            if ($usaColumnasGenericas) {
                $stmtMax = $pdo->query("SELECT MAX(CAST(`COL 1` AS UNSIGNED)) AS max_id FROM api_clase WHERE `COL 1` <> 'id'");
            } else {
                $stmtMax = $pdo->query('SELECT MAX(id) AS max_id FROM api_clase');
            }

            $maxRow = $stmtMax->fetch(PDO::FETCH_ASSOC);
            $newId = ($maxRow && isset($maxRow['max_id']) && is_numeric($maxRow['max_id'])) ? ((int)$maxRow['max_id'] + 1) : 1;

            $now = date('Y-m-d H:i:s');

            if ($usaColumnasGenericas) {
                $sql = 'INSERT INTO api_clase (`COL 1`, `COL 2`, `COL 3`, `COL 4`, `COL 5`, `COL 6`, `COL 7`, `COL 8`, `COL 9`, `COL 10`, `COL 11`, `COL 12`, `COL 13`, `COL 14`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $newId,
                    $input['nombre'],
                    $input['profesor'],
                    $input['fecha'],
                    $now,
                    $now,
                    $input['descripcion'] ?? '',
                    $input['duracion'] ?? 60,
                    $input['hora'] ?? '08:00',
                    $input['meet_link'] ?? '',
                    $input['modalidad'] ?? 'virtual',
                    $input['tema'] ?? $input['nombre'],
                    $input['tipo_clase'] ?? 'individual',
                    $input['estado'] ?? 'programada',
                ]);
            } else {
                $sql = 'INSERT INTO api_clase (id, nombre, profesor, fecha, created_at, updated_at, descripcion, duracion, hora, meet_link, modalidad, tema, tipo_clase, estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
                $stmt = $pdo->prepare($sql);
                $stmt->execute([
                    $newId,
                    $input['nombre'],
                    $input['profesor'],
                    $input['fecha'],
                    $now,
                    $now,
                    $input['descripcion'] ?? '',
                    $input['duracion'] ?? 60,
                    $input['hora'] ?? '08:00',
                    $input['meet_link'] ?? '',
                    $input['modalidad'] ?? 'virtual',
                    $input['tema'] ?? $input['nombre'],
                    $input['tipo_clase'] ?? 'individual',
                    $input['estado'] ?? 'programada',
                ]);
            }

            $estudiantesIds = [];
            if (isset($input['estudiantes']) && is_array($input['estudiantes'])) {
                $estudiantesIds = $input['estudiantes'];
            } elseif (isset($input['estudiantesSeleccionados']) && is_array($input['estudiantesSeleccionados'])) {
                $estudiantesIds = $input['estudiantesSeleccionados'];
            }

            if (!empty($estudiantesIds)) {
                sincronizarEstudiantesPorClase($pdo, $newId, $estudiantesIds);
            }

            if ($usaColumnasGenericas) {
                $stmt = $pdo->prepare('SELECT * FROM api_clase WHERE `COL 1` = ?');
            } else {
                $stmt = $pdo->prepare('SELECT * FROM api_clase WHERE id = ?');
            }
            $stmt->execute([$newId]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);

            $row['estudiantes'] = obtenerEstudiantesPorClase($pdo, $newId);

            echo json_encode([
                'success' => true,
                'data' => $row,
                'message' => 'Clase creada exitosamente',
            ]);
            break;

        case 'PUT':
        case 'PATCH':
            if (!$id) {
                throw new Exception('ID de clase requerido');
            }

            $input = json_decode(file_get_contents('php://input'), true);
            if (!$input) {
                throw new Exception('JSON inválido');
            }

            $usaColumnasGenericas = false;
            try {
                $checkCols = $pdo->query("SHOW COLUMNS FROM api_clase LIKE 'COL 1'");
                $usaColumnasGenericas = $checkCols->fetch(PDO::FETCH_ASSOC) ? true : false;
            } catch (Exception $e) {
                $usaColumnasGenericas = false;
            }

            if ($action === 'cambiar_estado') {
                if (empty($input['estado'])) {
                    throw new Exception('Campo estado es requerido');
                }
                if ($usaColumnasGenericas) {
                    $stmt = $pdo->prepare('UPDATE api_clase SET `COL 14` = ?, `COL 6` = NOW() WHERE `COL 1` = ?');
                } else {
                    $stmt = $pdo->prepare('UPDATE api_clase SET estado = ?, updated_at = NOW() WHERE id = ?');
                }
                $stmt->execute([$input['estado'], $id]);
            } else {
                $fields = [];
                $params = [];

                if ($usaColumnasGenericas) {
                    $fieldMap = [
                        'nombre' => 'COL 2',
                        'profesor' => 'COL 3',
                        'fecha' => 'COL 4',
                        'descripcion' => 'COL 7',
                        'duracion' => 'COL 8',
                        'hora' => 'COL 9',
                        'meet_link' => 'COL 10',
                        'modalidad' => 'COL 11',
                        'tema' => 'COL 12',
                        'tipo_clase' => 'COL 13',
                        'estado' => 'COL 14',
                    ];
                } else {
                    $fieldMap = [
                        'nombre' => 'nombre',
                        'profesor' => 'profesor',
                        'fecha' => 'fecha',
                        'descripcion' => 'descripcion',
                        'duracion' => 'duracion',
                        'hora' => 'hora',
                        'meet_link' => 'meet_link',
                        'modalidad' => 'modalidad',
                        'tema' => 'tema',
                        'tipo_clase' => 'tipo_clase',
                        'estado' => 'estado',
                    ];
                }

                foreach ($fieldMap as $logical => $column) {
                    if (array_key_exists($logical, $input)) {
                        $fields[] = "`$column` = ?";
                        $params[] = $input[$logical];
                    }
                }

                if (!empty($fields)) {
                    if ($usaColumnasGenericas) {
                        $sql = 'UPDATE api_clase SET ' . implode(', ', $fields) . ', `COL 6` = NOW() WHERE `COL 1` = ?';
                    } else {
                        $sql = 'UPDATE api_clase SET ' . implode(', ', $fields) . ', updated_at = NOW() WHERE id = ?';
                    }
                    $params[] = $id;
                    $stmt = $pdo->prepare($sql);
                    $stmt->execute($params);
                }

                $estudiantesIds = null;
                if (isset($input['estudiantes']) && is_array($input['estudiantes'])) {
                    $estudiantesIds = $input['estudiantes'];
                } elseif (isset($input['estudiantesSeleccionados']) && is_array($input['estudiantesSeleccionados'])) {
                    $estudiantesIds = $input['estudiantesSeleccionados'];
                }

                if ($estudiantesIds !== null) {
                    sincronizarEstudiantesPorClase($pdo, $id, $estudiantesIds);
                }
            }

            if ($usaColumnasGenericas) {
                $stmt = $pdo->prepare('SELECT * FROM api_clase WHERE `COL 1` = ?');
            } else {
                $stmt = $pdo->prepare('SELECT * FROM api_clase WHERE id = ?');
            }
            $stmt->execute([$id]);
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $row['estudiantes'] = obtenerEstudiantesPorClase($pdo, $id);

            echo json_encode([
                'success' => true,
                'data' => $row,
                'message' => 'Clase actualizada correctamente',
            ]);
            break;

        case 'DELETE':
            if (!$id) {
                throw new Exception('ID de clase requerido');
            }

            $usaColumnasGenericas = false;
            try {
                $checkCols = $pdo->query("SHOW COLUMNS FROM api_clase LIKE 'COL 1'");
                $usaColumnasGenericas = $checkCols->fetch(PDO::FETCH_ASSOC) ? true : false;
            } catch (Exception $e) {
                $usaColumnasGenericas = false;
            }

            $delM2M = $pdo->prepare('DELETE FROM api_clase_estudiantes WHERE clase_id = ?');
            $delM2M->execute([$id]);

            if ($usaColumnasGenericas) {
                $stmt = $pdo->prepare('DELETE FROM api_clase WHERE `COL 1` = ?');
            } else {
                $stmt = $pdo->prepare('DELETE FROM api_clase WHERE id = ?');
            }
            $stmt->execute([$id]);

            echo json_encode([
                'success' => true,
                'message' => 'Clase eliminada correctamente',
            ]);
            break;

        default:
            http_response_code(405);
            echo json_encode([
                'success' => false,
                'message' => 'Método no permitido',
            ]);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage(),
    ]);
}
