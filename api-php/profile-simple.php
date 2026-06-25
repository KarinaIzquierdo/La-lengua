<?php
/**
 * Profile endpoint simplificado
 */

// Headers CORS
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json");

// Manejar preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

$db = getConnection();

switch ($request_method) {
    case 'GET':
        // Obtener perfil del usuario
        $headers = getallheaders();
        $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';
        
        if (empty($authHeader) || !str_starts_with($authHeader, 'Bearer ')) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token requerido']);
            exit();
        }
        
        $token = substr($authHeader, 7); // Remover "Bearer "
        $decoded = jwt_decode_simple($token);
        
        if (!$decoded) {
            http_response_code(401);
            echo json_encode(['success' => false, 'message' => 'Token inválido']);
            exit();
        }
        
        try {
            // Obtener datos actualizados del usuario
            $query = "SELECT * FROM api_customuser WHERE id = :id";
            $stmt = $db->prepare($query);
            $stmt->bindParam(':id', $decoded['user_id']);
            $stmt->execute();
            
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($user) {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'email' => $user['email'],
                        'first_name' => $user['first_name'],
                        'last_name' => $user['last_name'],
                        'role' => $user['role'],
                        'is_profesor' => $user['is_profesor'],
                        'phone' => $user['phone'],
                        'country' => $user['country'],
                        'city' => $user['city'],
                        'english_level' => $user['english_level'],
                        'bloque_asignado' => $user['bloque_asignado'],
                        'correo_personal' => $user['correo_personal'],
                        // Campos de perfil adicionales
                        'birth_date' => $user['birth_date'] ?? null,
                        'cedula' => $user['cedula'] ?? '',
                        'address' => $user['address'] ?? '',
                        'emergency_contact' => $user['emergency_contact'] ?? '',
                        'emergency_phone' => $user['emergency_phone'] ?? '',
                        'learning_goals' => $user['learning_goals'] ?? '',
                        'profile_completed' => isset($user['profile_completed']) ? (bool)$user['profile_completed'] : false,
                    ]
                ]);
            } else {
                http_response_code(404);
                echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Error en el servidor', 'error' => $e->getMessage()]);
        }
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
exit();
?>
