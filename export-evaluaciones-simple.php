<?php
/**
 * Script simplificado para exportar tablas de evaluaciones
 * Genera archivos SQL que puedes copiar y pegar
 */

// Configuración de la base de datos LOCAL
$local_host = '127.0.0.1:3306';
$local_dbname = 'la_lengua';
$local_username = 'root';
$local_password = 'Sena2025';

// Crear archivo de salida
$output_file = 'evaluaciones_export.sql';
$sql_content = "-- Exportación de tablas de evaluaciones\n";
$sql_content .= "-- Generado el " . date('Y-m-d H:i:s') . "\n\n";

try {
    // Conectar a la base de datos local
    $local_pdo = new PDO("mysql:host=$local_host;dbname=$local_dbname;charset=utf8", $local_username, $local_password);
    $local_pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✅ Conexión exitosa a la base de datos local\n";
    
    // Tablas a exportar
    $tablas = [
        'api_evaluacion',
        'api_evaluacion_estudiante', 
        'api_respuestaevaluacion'
    ];
    
    foreach ($tablas as $tabla) {
        echo "📋 Procesando tabla: $tabla\n";
        
        $sql_content .= "-- ================================================\n";
        $sql_content .= "-- Tabla: $tabla\n";
        $sql_content .= "-- ================================================\n\n";
        
        // Obtener estructura de la tabla
        $stmt = $local_pdo->query("SHOW CREATE TABLE `$tabla`");
        $create_table = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($create_table) {
            // Agregar DROP TABLE si existe
            $sql_content .= "DROP TABLE IF EXISTS `$tabla`;\n";
            $sql_content .= $create_table['Create Table'] . ";\n\n";
            
            // Obtener datos de la tabla
            $stmt = $local_pdo->query("SELECT * FROM `$tabla`");
            $datos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            echo "   📊 Encontrados " . count($datos) . " registros\n";
            
            if (count($datos) > 0) {
                $sql_content .= "-- Datos para la tabla $tabla\n";
                
                // Generar INSERTs
                $columns = array_keys($datos[0]);
                $columns_str = '`' . implode('`, `', $columns) . '`';
                
                foreach ($datos as $row) {
                    $values = array_map(function($value) use ($local_pdo) {
                        return $value === null ? 'NULL' : $local_pdo->quote($value);
                    }, array_values($row));
                    
                    $values_str = implode(', ', $values);
                    $sql_content .= "INSERT INTO `$tabla` ($columns_str) VALUES ($values_str);\n";
                }
                $sql_content .= "\n";
            } else {
                $sql_content .= "-- No hay datos en esta tabla\n\n";
            }
        } else {
            echo "   ❌ No se pudo obtener la estructura de la tabla $tabla\n";
            $sql_content .= "-- ERROR: No se pudo obtener la estructura de $tabla\n\n";
        }
    }
    
    // Guardar archivo
    file_put_contents($output_file, $sql_content);
    
    echo "\n🎉 ¡Exportación completada!\n";
    echo "📁 Archivo generado: $output_file\n";
    echo "📏 Tamaño: " . number_format(filesize($output_file)) . " bytes\n\n";
    
    echo "🚀 Próximos pasos:\n";
    echo "1. Abre el archivo $output_file\n";
    echo "2. Copia todo el contenido SQL\n";
    echo "3. Dímelo para crear el script de importación\n";
    
} catch (PDOException $e) {
    echo "❌ Error de conexión: " . $e->getMessage() . "\n";
    echo "\n🔧 Verifica:\n";
    echo "- Que MySQL esté corriendo\n";
    echo "- Que la base de datos 'la_lengua' exista\n";
    echo "- Usuario y contraseña correctos\n";
}
?>
