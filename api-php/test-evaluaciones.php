<?php
/**
 * Test simple para verificar evaluaciones
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

require_once 'config/database.php';

echo "<h2>🧪 Test de Evaluaciones</h2>";

try {
    $pdo = getConnection();
    if (!$pdo) {
        throw new Exception('Error de conexión a la base de datos');
    }
    
    echo "<h3>✅ Conexión BD exitosa</h3>";
    
    // Contar evaluaciones
    $stmt = $pdo->query("SELECT COUNT(*) as total FROM api_evaluacion");
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    echo "<p>📊 <strong>Total evaluaciones:</strong> {$result['total']}</p>";
    
    // Mostrar algunas evaluaciones
    $stmt = $pdo->query("SELECT * FROM api_evaluacion LIMIT 3");
    $evaluaciones = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    echo "<h3>📋 Evaluaciones de ejemplo:</h3>";
    echo "<pre>";
    echo json_encode($evaluaciones, JSON_PRETTY_PRINT);
    echo "</pre>";
    
    echo "<h3>🚀 API Response:</h3>";
    echo "<pre>";
    echo json_encode([
        'success' => true,
        'data' => $evaluaciones,
        'total' => $result['total']
    ], JSON_PRETTY_PRINT);
    echo "</pre>";
    
} catch (Exception $e) {
    echo "<div style='background: #f8d7da; color: #721c24; padding: 15px; border-radius: 5px;'>";
    echo "<h3>❌ Error:</h3>";
    echo "<p>" . $e->getMessage() . "</p>";
    echo "</div>";
}
?>

<style>
body { font-family: Arial, sans-serif; margin: 20px; }
h2 { color: #333; }
h3 { color: #666; }
pre { background: #f5f5f5; padding: 10px; border-radius: 4px; }
</style>
