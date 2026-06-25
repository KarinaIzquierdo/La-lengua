<?php
/**
 * Test súper simple
 */

header('Content-Type: application/json');

echo json_encode([
    'success' => true,
    'message' => '¡API funcionando!',
    'timestamp' => date('Y-m-d H:i:s'),
    'server' => $_SERVER['SERVER_NAME'],
    'path' => $_SERVER['REQUEST_URI']
]);
?>
