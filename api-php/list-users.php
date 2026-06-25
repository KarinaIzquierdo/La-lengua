<?php
// Listar usuarios existentes
require_once 'config/database.php';

$db = getConnection();

if ($db) {
    try {
        $query = "SELECT 
                    id, username, email, first_name, last_name, role, is_profesor, is_active,
                    correo_personal, bloque_asignado, english_level, date_joined
                  FROM api_customuser
                  ORDER BY id";
        $stmt = $db->prepare($query);
        $stmt->execute();
        
        $users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach ($users as &$u) {
            $u['correo_personal'] = $u['correo_personal'] ?? null;
            $u['bloque_asignado'] = $u['bloque_asignado'] ?? null;
            $u['english_level']   = $u['english_level'] ?? null;
            $u['date_joined']     = $u['date_joined'] ?? null;
            if (!isset($u['especializacion'])) {
                $u['especializacion'] = null;
            }
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Usuarios encontrados: ' . count($users),
            'users' => $users
        ]);
    } catch (Exception $e) {
        echo json_encode([
            'success' => false,
            'message' => 'Error: ' . $e->getMessage()
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Error de conexión a la base de datos'
    ]);
}
?>
