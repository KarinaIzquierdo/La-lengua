<?php
/**
 * Conexión a base de datos MySQL
 */

function getConnection() {
    $host = 'localhost';
    $dbname = 'lalengua_the_language';    // ✅ Nombre real de la BD creada
    $username = 'lalengua_lalengua_api';  // ✅ Usuario correcto
    $password = 'ApiUser2024°';            // ✅ Contraseña nueva
    
    try {
        $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", $username, $password);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $pdo;
    } catch (PDOException $e) {
        return null;
    }
}
?>
