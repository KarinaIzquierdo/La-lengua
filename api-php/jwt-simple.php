<?php
/**
 * JWT simplificado para compatibilidad
 */

// Configuración
$jwt_secret = "lalengua_secret_key_2024_super_secure";

function jwt_encode_simple($payload) {
    global $jwt_secret;
    
    $header = base64_encode('{"typ":"JWT","alg":"HS256"}');
    $payload = base64_encode(json_encode($payload));
    
    $signature = base64_encode(hash_hmac('sha256', $header . "." . $payload, $jwt_secret, true));
    
    return $header . "." . $payload . "." . $signature;
}

function jwt_decode_simple($jwt) {
    global $jwt_secret;
    
    $parts = explode('.', $jwt);
    if (count($parts) != 3) return false;
    
    $header = base64_decode($parts[0]);
    $payload = base64_decode($parts[1]);
    $signature = $parts[2];
    
    // Verificar firma
    $expected_signature = base64_encode(hash_hmac('sha256', $parts[0] . "." . $parts[1], $jwt_secret, true));
    
    if ($signature !== $expected_signature) return false;
    
    $data = json_decode($payload, true);
    
    // Verificar expiración
    if (isset($data['exp']) && $data['exp'] < time()) return false;
    
    return $data;
}

function jwt_verify_simple($jwt) {
    return jwt_decode_simple($jwt) !== false;
}
?>
