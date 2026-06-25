<?php
// contact.php - Endpoint para formulario de contacto (Request Information)

require_once __DIR__ . '/config/database.php';

// Headers CORS básicos
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido',
    ]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true) ?: [];

$first_name     = trim($input['firstName'] ?? '');
$last_name      = trim($input['lastName'] ?? '');
$email          = trim($input['email'] ?? '');
$phone          = trim($input['phone'] ?? '');
$country        = trim($input['country'] ?? '');
$city           = trim($input['city'] ?? '');
$level          = trim($input['level'] ?? '');
$reason         = trim($input['reason'] ?? '');
$source         = trim($input['source'] ?? '');
$contact_method = trim($input['contactMethod'] ?? '');

if ($first_name === '' || $last_name === '' || $email === '') {
    http_response_code(400);
    echo json_encode([
        'success' => false,
        'message' => 'Por favor, completa todos los campos requeridos',
    ]);
    exit();
}

// Preparar email (versión simplificada de la plantilla Django)
$subject   = '📬 Nueva Solicitud de Contacto - ' . $first_name . ' ' . $last_name;
$fromEmail = 'no-reply@lalenguacolombia.co';
$fromName  = 'La Lengua';
// Buzón del dominio donde ya se ve el estado 'Aceptado' en Seguimiento de entregas
$toEmail   = 'lalengua@lalenguacolombia.co';

$headers  = 'From: ' . $fromName . ' <' . $fromEmail . "\r\n";
$headers .= 'Reply-To: ' . $fromEmail . "\r\n";
$headers .= 'MIME-Version: 1.0' . "\r\n";
$headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";

$safeFirst  = htmlspecialchars($first_name, ENT_QUOTES, 'UTF-8');
$safeLast   = htmlspecialchars($last_name, ENT_QUOTES, 'UTF-8');
$safeEmail  = htmlspecialchars($email, ENT_QUOTES, 'UTF-8');
$safePhone  = htmlspecialchars($phone, ENT_QUOTES, 'UTF-8');
$safeCountry= htmlspecialchars($country, ENT_QUOTES, 'UTF-8');
$safeCity   = htmlspecialchars($city, ENT_QUOTES, 'UTF-8');
$safeLevel  = htmlspecialchars($level, ENT_QUOTES, 'UTF-8');
$safeReason = htmlspecialchars($reason, ENT_QUOTES, 'UTF-8');
$safeSource = htmlspecialchars($source, ENT_QUOTES, 'UTF-8');
$safeContact= htmlspecialchars($contact_method, ENT_QUOTES, 'UTF-8');

$body = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nueva Solicitud - La Lengua</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
        .content { padding: 40px 30px; }
        .info-box { background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%); padding: 20px; border-left: 4px solid #667eea; border-radius: 5px; margin: 20px 0; }
        .info-item { margin: 15px 0; padding: 10px 0; border-bottom: 1px solid #e0e0e0; }
        .info-item:last-child { border-bottom: none; }
        .info-label { font-weight: 600; color: #667eea; display: block; margin-bottom: 5px; }
        .info-value { color: #333; font-size: 16px; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; }
        .footer p { margin: 5px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📬 Nueva Solicitud de Contacto</h1>
            <p>Un usuario ha enviado sus datos</p>
        </div>
        <div class="content">
            <p>Has recibido una nueva solicitud de contacto desde <strong>La Lengua</strong>.</p>
            <div class="info-box">
                <div class="info-item">
                    <span class="info-label">👤 Nombre:</span>
                    <span class="info-value">{$safeFirst} {$safeLast}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📧 Email:</span>
                    <span class="info-value">{$safeEmail}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📱 Teléfono:</span>
                    <span class="info-value">{$safePhone}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📚 Programa:</span>
                    <span class="info-value">{$safeLevel}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">💡 Razón:</span>
                    <span class="info-value">{$safeReason}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">📢 Medio:</span>
                    <span class="info-value">{$safeSource}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">💬 Contacto preferido:</span>
                    <span class="info-value">{$safeContact}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🌍 País:</span>
                    <span class="info-value">{$safeCountry}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">🏙️ Ciudad:</span>
                    <span class="info-value">{$safeCity}</span>
                </div>
            </div>
            <p style="margin-top: 30px; color: #666;">
                <strong>Nota:</strong> Responde a este usuario lo antes posible para brindar un excelente servicio.
            </p>
        </div>
        <div class="footer">
            <p><strong>La Lengua</strong></p>
            <p>Tu plataforma de aprendizaje de inglés</p>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">© 2025 La Lengua. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
HTML;

// Enviar email y verificar resultado
$sent = @mail($toEmail, $subject, $body, $headers);

if (!$sent) {
    // Registrar en el log del servidor para depuración
    error_log('❌ contact.php: fallo al enviar email de contacto a ' . $toEmail);
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'No se pudo enviar el email en este momento. Por favor, intenta nuevamente más tarde.',
    ]);
    exit();
}

echo json_encode([
    'success' => true,
    'message' => 'Email enviado correctamente. Nos pondremos en contacto contigo pronto.',
]);
