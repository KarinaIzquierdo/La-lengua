<?php
/**
 * Auth simplificado con CORS
 */

// Headers CORS primero
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
$input = json_decode(file_get_contents('php://input'), true) ?: [];

function send_welcome_email($toEmail, $toName, $userRole, $institutionalEmail, $plainPassword = null, $loginUrl = 'https://lalenguacolombia.co')
{
    if (!$toEmail || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return;
    }

    // Mapeo de roles a nombres en español (similar a Django)
    $roleNames = [
        'student'    => 'Estudiante',
        'profesor'   => 'Profesor',
        'admin'      => 'Administrador',
        'financiero' => 'Financiero',
    ];
    $roleDisplay = isset($roleNames[$userRole]) ? $roleNames[$userRole] : $userRole;

    $subject = '¡Bienvenido a La Lengua! - Tus credenciales de acceso';
    $fromEmail = 'no-reply@lalenguacolombia.co';
    $fromName  = 'La Lengua';

    $headers  = 'From: ' . $fromName . ' <' . $fromEmail . '>' . "\r\n";
    $headers .= 'Reply-To: ' . $fromEmail . "\r\n";
    $headers .= 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";

    $safeName          = htmlspecialchars($toName, ENT_QUOTES, 'UTF-8');
    $safeLoginEmail    = htmlspecialchars($toEmail, ENT_QUOTES, 'UTF-8');
    $safeRole          = htmlspecialchars($roleDisplay, ENT_QUOTES, 'UTF-8');
    $safeLoginUrl      = htmlspecialchars($loginUrl, ENT_QUOTES, 'UTF-8');
    $safeInstitutional = $institutionalEmail ? htmlspecialchars($institutionalEmail, ENT_QUOTES, 'UTF-8') : '';
    $safePassword      = $plainPassword !== null ? htmlspecialchars($plainPassword, ENT_QUOTES, 'UTF-8') : '';

    // HTML inspirado en la plantilla Django welcome_email.html (incluye contraseña temporal)
    $body = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a La Lengua</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f4f4; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; text-align: center; }
        .header h1 { margin: 0; font-size: 28px; font-weight: 600; }
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; color: #333; margin-bottom: 20px; }
        .credentials-box { background: linear-gradient(135deg, #f0f4ff 0%, #e8f0ff 100%); padding: 25px; border-left: 4px solid #667eea; border-radius: 5px; margin: 25px 0; }
        .credentials-box h3 { margin-top: 0; color: #667eea; font-size: 18px; }
        .credential-item { margin: 15px 0; padding: 10px; background: white; border-radius: 5px; }
        .credential-label { font-weight: 600; color: #555; display: block; margin-bottom: 5px; font-size: 14px; }
        .credential-value { font-size: 16px; color: #333; font-family: 'Courier New', monospace; background: #f8f9fa; padding: 8px 12px; border-radius: 4px; display: inline-block; }
        .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .warning-box strong { color: #856404; }
        .button { display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 50px; margin: 25px 0; font-weight: 600; font-size: 16px; transition: transform 0.2s; }
        .button:hover { transform: translateY(-2px); }
        .steps { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
        .steps h3 { color: #667eea; margin-top: 0; }
        .steps ol { margin: 10px 0; padding-left: 20px; }
        .steps li { margin: 10px 0; color: #555; }
        .footer { background: #f8f9fa; padding: 30px; text-align: center; color: #666; font-size: 14px; border-top: 1px solid #e0e0e0; }
        .footer p { margin: 5px 0; }
        .social-links { margin: 15px 0; }
        .social-links a { color: #667eea; text-decoration: none; margin: 0 10px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>La Lengua</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">¡Bienvenido a tu plataforma de inglés!</p>
        </div>
        <div class="content">
            <p class="greeting">Hola <strong>{$safeName}</strong>,</p>
            <p>¡Nos alegra muchísimo tenerte con nosotros! Tu cuenta ha sido creada exitosamente con el rol de <strong>{$safeRole}</strong>.</p>
            <div class="credentials-box">
                <h3>📋 Tus Credenciales de Acceso</h3>
                <div class="credential-item">
                    <span class="credential-label">Correo Personal (Login):</span>
                    <span class="credential-value">{$safeLoginEmail}</span>
                </div>
HTML;

    if ($safePassword !== '') {
        $body .= <<<HTML
                <div class="credential-item">
                    <span class="credential-label">Contraseña temporal:</span>
                    <span class="credential-value">{$safePassword}</span>
                </div>
HTML;
    }

    if ($safeInstitutional) {
        $body .= <<<HTML
                <div class="credential-item">
                    <span class="credential-label">Correo institucional:</span>
                    <span class="credential-value">{$safeInstitutional}</span>
                </div>
HTML;
    }

    $body .= <<<HTML
            </div>
            <div class="warning-box">
                <strong>⚠️ Importante:</strong> Por tu seguridad, te recomendamos cambiar tu contraseña después de iniciar sesión por primera vez. Si no recuerdas tu contraseña, puedes usar la opción de "Olvidé mi contraseña" en la página de inicio de sesión.
            </div>
            <center>
                <a href="{$safeLoginUrl}" class="button">Iniciar Sesión Ahora</a>
            </center>
            <div class="steps">
                <h3>🚀 Próximos Pasos</h3>
                <ol>
                    <li>Haz clic en el botón de arriba para acceder a la plataforma</li>
                    <li>Inicia sesión con tu correo personal</li>
                    <li>Completa tu perfil con tu información personal</li>
                    <li>Cambia tu contraseña desde la configuración de tu perfil</li>
                </ol>
            </div>
            <p>Si tienes alguna pregunta o necesitas ayuda, no dudes en contactarnos. Estamos aquí para apoyarte en tu proceso de aprendizaje.</p>
            <p>¡Que tengas un excelente día! 🌟</p>
            <p style="margin-top: 30px;">
                Saludos cordiales,<br>
                <strong>El equipo de La Lengua</strong>
            </p>
        </div>
        <div class="footer">
            <p><strong>La Lengua</strong></p>
            <p>Tu camino hacia el dominio del inglés</p>
            <div class="social-links">
                <a href="#">Instagram</a> | 
                <a href="#">Facebook</a> | 
                <a href="#">WhatsApp</a>
            </div>
            <p style="margin-top: 15px; font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p style="font-size: 12px; color: #999;">© 2025 La Lengua. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>
HTML;

    @mail($toEmail, $subject, $body, $headers);
}

/**
 * Enviar email de restablecimiento de contraseña
 */
function send_password_reset_email_php($toEmail, $toName, $resetLink)
{
    if (!$toEmail || !filter_var($toEmail, FILTER_VALIDATE_EMAIL)) {
        return;
    }

    $subject = '🔐 Recuperación de Contraseña - La Lengua';
    $fromEmail = 'no-reply@lalenguacolombia.co';
    $fromName  = 'La Lengua';

    $headers  = 'From: ' . $fromName . ' <' . $fromEmail . '>' . "\r\n";
    $headers .= 'Reply-To: ' . $fromEmail . "\r\n";
    $headers .= 'MIME-Version: 1.0' . "\r\n";
    $headers .= 'Content-Type: text/html; charset=UTF-8' . "\r\n";

    $safeName  = htmlspecialchars($toName, ENT_QUOTES, 'UTF-8');
    $safeLink  = htmlspecialchars($resetLink, ENT_QUOTES, 'UTF-8');

    $body = <<<HTML
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Recuperación de contraseña</title>
  <style>
    body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
    .content { padding: 30px; color: #333; }
    .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 30px; margin: 20px 0; font-weight: 600; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #777; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Recuperación de Contraseña</h1>
    </div>
    <div class="content">
      <p>Hola <strong>{$safeName}</strong>,</p>
      <p>Hemos recibido una solicitud para restablecer tu contraseña en <strong>La Lengua</strong>.</p>
      <p>Haz clic en el siguiente botón para crear una nueva contraseña. Si no fuiste tú quien solicitó este cambio, puedes ignorar este correo.</p>
      <p style="text-align:center;">
        <a href="{$safeLink}" class="button">Restablecer contraseña</a>
      </p>
      <p>También puedes copiar y pegar este enlace en tu navegador:</p>
      <p style="word-break: break-all;">{$safeLink}</p>
      <p>Por seguridad, este enlace expirará en aproximadamente 1 hora.</p>
      <p>Saludos,<br>El equipo de La Lengua</p>
    </div>
    <div class="footer">
      <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
    </div>
  </div>
</body>
</html>
HTML;

    @mail($toEmail, $subject, $body, $headers);
}

$request_method = $_SERVER['REQUEST_METHOD'];

switch ($request_method) {
    case 'POST':
        // LOGIN
        if (isset($segments[1]) && $segments[1] === 'login') {
            // Login real con base de datos
            if (!isset($input['email']) || !isset($input['password'])) {
                echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                exit();
            }
            
            // En el frontend el campo se llama "email", pero puede ser
            // tanto el correo institucional (email) como el correo_personal.
            $identifier = trim($input['email']);
            $password = (string)$input['password'];
            
            try {
                // Buscar usuario por email institucional O por correo_personal
                $query = "SELECT * FROM api_customuser WHERE email = :identifier OR correo_personal = :identifier LIMIT 1";
                $stmt = $db->prepare($query);
                $stmt->bindParam(':identifier', $identifier);
                $stmt->execute();
                
                $user = $stmt->fetch(PDO::FETCH_ASSOC);
                
                if ($user) {
                    if (isset($user['is_active']) && !$user['is_active']) {
                        http_response_code(401);
                        echo json_encode(['success' => false, 'message' => 'La cuenta de usuario está desactivada']);
                        exit();
                    }
                    // Verificar contraseña hasheada con PHP
                    if (password_verify($password, $user['password'])) {
                        $payload = [
                            'user_id' => $user['id'],
                            'username' => $user['username'],
                            'email' => $user['email'],
                            'role' => $user['role'],
                            'is_profesor' => $user['is_profesor'],
                            'exp' => time() + (24 * 60 * 60)
                        ];
                        
                        $token = jwt_encode_simple($payload);
                        
                        echo json_encode([
                            'success' => true,
                            'message' => 'Login exitoso',
                            'token' => $token,
                            'user' => [
                                'id' => $user['id'],
                                'username' => $user['username'],
                                'email' => $user['email'],
                                'first_name' => $user['first_name'],
                                'last_name' => $user['last_name'],
                                'role' => $user['role'],
                                'is_profesor' => $user['is_profesor']
                            ]
                        ]);
                    } else {
                        http_response_code(401);
                        echo json_encode(['success' => false, 'message' => 'Contraseña incorrecta']);
                    }
                } else {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                }
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error en el servidor',
                    'error' => $e->getMessage()
                ]);
            }
            exit();
        }

        // CONFIRMAR RESTABLECIMIENTO DE CONTRASEÑA: POST /auth/reset-password/
        if (isset($segments[1]) && $segments[1] === 'reset-password') {
            $token = trim((string)($input['token'] ?? ''));
            $newPassword = (string)($input['new_password'] ?? '');

            if ($token === '') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Token requerido',
                ]);
                exit();
            }

            if ($newPassword === '' || strlen($newPassword) < 8) {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Contraseña inválida (mínimo 8 caracteres)',
                ]);
                exit();
            }

            try {
                $decoded = jwt_decode_simple($token);
                if (!$decoded || !isset($decoded['user_id']) || ($decoded['purpose'] ?? '') !== 'password_reset') {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Token inválido',
                    ]);
                    exit();
                }

                $userId = (int)$decoded['user_id'];
                if ($userId <= 0) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Usuario inválido en token',
                    ]);
                    exit();
                }

                $stmt = $db->prepare('SELECT id FROM api_customuser WHERE id = :id');
                $stmt->execute([':id' => $userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    http_response_code(404);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Usuario no encontrado',
                    ]);
                    exit();
                }

                $hash = password_hash($newPassword, PASSWORD_DEFAULT);
                $upd = $db->prepare('UPDATE api_customuser SET password = :password, updated_at = NOW() WHERE id = :id');
                $upd->execute([
                    ':password' => $hash,
                    ':id' => $userId,
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Contraseña actualizada correctamente.',
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error en el servidor al restablecer contraseña',
                    'error' => $e->getMessage(),
                ]);
            }
            exit();
        }

        // SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA: POST /auth/request-password-reset/
        if (isset($segments[1]) && $segments[1] === 'request-password-reset') {
            $email = strtolower(trim($input['email'] ?? ''));

            if ($email === '') {
                http_response_code(400);
                echo json_encode([
                    'success' => false,
                    'message' => 'Email requerido',
                ]);
                exit();
            }

            try {
                // Buscar primero por correo_personal
                $stmt = $db->prepare('SELECT * FROM api_customuser WHERE LOWER(correo_personal) = LOWER(:email) LIMIT 1');
                $stmt->execute([':email' => $email]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    // Buscar por email institucional
                    $stmt = $db->prepare('SELECT * FROM api_customuser WHERE LOWER(email) = LOWER(:email) LIMIT 1');
                    $stmt->execute([':email' => $email]);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                }

                if (!$user) {
                    // Intentar mapear por parte local a dominios institucionales
                    $local = strtolower(substr($email, 0, strpos($email, '@') ?: strlen($email)));
                    $candidates = [
                        $local . '@thelanguage.co',
                        $local . '@soy.thelanguage.co',
                    ];
                    $in  = str_repeat('?,', count($candidates) - 1) . '?';
                    $sql = 'SELECT * FROM api_customuser WHERE email IN (' . $in . ') LIMIT 1';
                    $stmt = $db->prepare($sql);
                    $stmt->execute($candidates);
                    $user = $stmt->fetch(PDO::FETCH_ASSOC);
                }

                if (!$user) {
                    // No devolver detalle para evitar enumeración; el frontend mostrará mensaje genérico
                    echo json_encode([
                        'success' => false,
                        'message' => 'No encontramos este correo o no pudimos generar el enlace.',
                    ]);
                    exit();
                }

                // Generar token JWT de restablecimiento (1 hora)
                $payload = [
                    'user_id' => $user['id'],
                    'purpose' => 'password_reset',
                    'exp' => time() + 3600,
                ];
                $token = jwt_encode_simple($payload);

                // Enlace que usará el frontend para nueva contraseña
                $resetLink = 'https://lalenguacolombia.co/new-password?token=' . urlencode($token);

                // Determinar correo destino (personal primero)
                $emailDestino = $user['correo_personal'] ?: $user['email'];
                $nombreUsuario = trim(($user['first_name'] ?? '') . ' ' . ($user['last_name'] ?? ''));
                if ($nombreUsuario === '') {
                    $nombreUsuario = $user['username'] ?? '';
                }

                // Enviar email (si falla, solo se registrará en logs)
                try {
                    send_password_reset_email_php($emailDestino, $nombreUsuario, $resetLink);
                } catch (Exception $e) {
                    error_log('Error enviando email de recuperación: ' . $e->getMessage());
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Se han enviado instrucciones a tu correo.',
                    'reset_link' => $resetLink, // para que el frontend pueda usarlo directamente
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'No se pudo generar el enlace de restablecimiento',
                    'error' => $e->getMessage(),
                ]);
            }
            exit();
        }

        // REGISTRO DESDE DASHBOARD ADMIN: POST /auth/register/
        if (isset($segments[1]) && $segments[1] === 'register') {
            try {
                $errors = [];

                $first_name = trim($input['first_name'] ?? '');
                $last_name = trim($input['last_name'] ?? '');
                $correo_personal = trim($input['correo_personal'] ?? '');
                $role = trim($input['role'] ?? '');
                $password = (string)($input['password'] ?? '');
                $email = trim($input['email'] ?? ''); // Institucional (opcional)
                $bloque_asignado = isset($input['bloque_asignado']) ? trim((string)$input['bloque_asignado']) : null;
                $especializacion = $input['especializacion'] ?? null; // ID o null

                // Validaciones básicas
                if ($first_name === '') {
                    $errors['first_name'] = 'El nombre es obligatorio.';
                }
                if ($last_name === '') {
                    $errors['last_name'] = 'Los apellidos son obligatorios.';
                }
                if ($correo_personal === '') {
                    $errors['correo_personal'] = 'El correo personal es obligatorio.';
                } elseif (!filter_var($correo_personal, FILTER_VALIDATE_EMAIL)) {
                    $errors['correo_personal'] = 'El formato del correo personal no es válido.';
                }
                if ($role === '') {
                    $errors['role'] = 'El rol es obligatorio.';
                }
                if ($password === '' || strlen($password) < 8) {
                    $errors['password'] = 'La contraseña debe tener al menos 8 caracteres.';
                }

                if (!empty($errors)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Errores de validación',
                        'errors' => $errors,
                    ]);
                    exit();
                }

                // Verificar unicidad de correo_personal
                $stmt = $db->prepare('SELECT COUNT(*) FROM api_customuser WHERE correo_personal = :correo');
                $stmt->execute([':correo' => $correo_personal]);
                if ((int)$stmt->fetchColumn() > 0) {
                    $errors['correo_personal'] = 'Ya existe un usuario con este correo personal.';
                }

                // Verificar unicidad de email institucional si se proporciona
                if ($email !== '') {
                    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
                        $errors['email'] = 'El formato del correo institucional no es válido.';
                    } else {
                        $stmt = $db->prepare('SELECT COUNT(*) FROM api_customuser WHERE email = :email');
                        $stmt->execute([':email' => $email]);
                        if ((int)$stmt->fetchColumn() > 0) {
                            $errors['email'] = 'Ya existe un usuario con este correo institucional.';
                        }
                    }
                }

                if (!empty($errors)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Errores de validación',
                        'errors' => $errors,
                    ]);
                    exit();
                }

                // Generar email institucional si viene vacío
                if ($email === '') {
                    $local_part = strtolower(substr($correo_personal, 0, strpos($correo_personal, '@') ?: strlen($correo_personal)));
                    $local_part = preg_replace('/[^a-z0-9._-]/', '', $local_part);
                    if ($local_part === '') {
                        $local_part = 'usuario';
                    }
                    $email = $local_part . '@thelanguage.co';
                }

                // Normalizar rol y flag de profesor
                $valid_roles = ['student', 'profesor', 'admin', 'financiero'];
                if (!in_array($role, $valid_roles, true)) {
                    $role = 'student';
                }
                $is_profesor = ($role === 'profesor') ? 1 : 0;

                // Username basado en correo personal
                $username = strtolower(substr($correo_personal, 0, strpos($correo_personal, '@') ?: strlen($correo_personal)));
                if ($username === '') {
                    $username = strtolower(preg_replace('/\s+/', '.', $first_name . '.' . $last_name));
                }

                // Hashear contraseña con algoritmo por defecto (compatible con Django)
                $password_hash = password_hash($password, PASSWORD_DEFAULT);

                $now = date('Y-m-d H:i:s');
                $especializacion_id = null;
                if ($especializacion !== null && $especializacion !== '') {
                    $especializacion_id = (int)$especializacion;
                }

                // Insertar usuario incluyendo la columna existente `especializacion` (FK a api_especializacion)
                $insert = $db->prepare('INSERT INTO api_customuser (
                    username, email, first_name, last_name, role, is_profesor, is_active,
                    correo_personal, bloque_asignado, especializacion,
                    password, date_joined, created_at, updated_at
                ) VALUES (
                    :username, :email, :first_name, :last_name, :role, :is_profesor, 1,
                    :correo_personal, :bloque_asignado, :especializacion,
                    :password, :date_joined, :created_at, :updated_at
                )');

                $insert->execute([
                    ':username' => $username,
                    ':email' => $email,
                    ':first_name' => $first_name,
                    ':last_name' => $last_name,
                    ':role' => $role,
                    ':is_profesor' => $is_profesor,
                    ':correo_personal' => $correo_personal,
                    ':bloque_asignado' => $bloque_asignado,
                    ':especializacion' => $especializacion_id,
                    ':password' => $password_hash,
                    ':date_joined' => $now,
                    ':created_at' => $now,
                    ':updated_at' => $now,
                ]);

                $newId = (int)$db->lastInsertId();

                try {
                    $fullName = trim($first_name . ' ' . $last_name);
                    // Enviar email de bienvenida usando plantilla HTML similar a Django
                    send_welcome_email($correo_personal, $fullName, $role, $email, $password);
                } catch (Exception $e) {
                    error_log('Error enviando correo de bienvenida: ' . $e->getMessage());
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Usuario registrado exitosamente',
                    'user' => [
                        'id' => $newId,
                        'username' => $username,
                        'email' => $email,
                        'first_name' => $first_name,
                        'last_name' => $last_name,
                        'role' => $role,
                        'correo_personal' => $correo_personal,
                        'bloque_asignado' => $bloque_asignado,
                        'especializacion' => $especializacion_id,
                    ],
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error en el servidor al registrar usuario',
                    'error' => $e->getMessage(),
                ]);
            }
            exit();
        }

        // CAMBIAR CONTRASEÑA: POST /auth/change-password/
        if (isset($segments[1]) && $segments[1] === 'change-password') {
            try {
                // Verificar JWT en el header Authorization
                $headers = function_exists('getallheaders') ? getallheaders() : [];
                if (!isset($headers['Authorization']) && isset($headers['authorization'])) {
                    $headers['Authorization'] = $headers['authorization'];
                }

                if (!isset($headers['Authorization'])) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token requerido']);
                    exit();
                }

                $token = str_replace('Bearer ', '', $headers['Authorization']);
                $decoded = jwt_decode_simple($token);

                if (!$decoded || !isset($decoded['user_id'])) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token inválido']);
                    exit();
                }

                $userId = (int)$decoded['user_id'];
                if ($userId <= 0) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Usuario inválido en token']);
                    exit();
                }

                // Validar datos de entrada
                $current_password = (string)($input['current_password'] ?? '');
                $new_password = (string)($input['new_password'] ?? '');

                $errors = [];
                if ($current_password === '') {
                    $errors['current_password'] = 'La contraseña actual es obligatoria.';
                }
                if ($new_password === '' || strlen($new_password) < 8) {
                    $errors['new_password'] = 'La nueva contraseña debe tener al menos 8 caracteres.';
                }

                if (!empty($errors)) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Error al cambiar contraseña',
                        'errors' => $errors,
                    ]);
                    exit();
                }

                // Obtener usuario actual
                $stmt = $db->prepare('SELECT id, password FROM api_customuser WHERE id = :id');
                $stmt->execute([':id' => $userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                    exit();
                }

                // Verificar contraseña actual
                if (!password_verify($current_password, $user['password'])) {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => 'Error al cambiar contraseña',
                        'errors' => ['current_password' => ['La contraseña actual es incorrecta.']],
                    ]);
                    exit();
                }

                // Actualizar contraseña
                $newHash = password_hash($new_password, PASSWORD_DEFAULT);
                $update = $db->prepare('UPDATE api_customuser SET password = :password, updated_at = NOW() WHERE id = :id');
                $update->execute([
                    ':password' => $newHash,
                    ':id' => $userId,
                ]);

                echo json_encode([
                    'success' => true,
                    'message' => 'Contraseña cambiada exitosamente',
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error en el servidor al cambiar contraseña',
                    'error' => $e->getMessage(),
                ]);
            }
            exit();
        }

        // ACTUALIZAR PERFIL: POST /auth/update-profile/
        if (isset($segments[1]) && $segments[1] === 'update-profile') {
            try {
                // Verificar JWT en el header Authorization
                $headers = function_exists('getallheaders') ? getallheaders() : [];
                if (!isset($headers['Authorization']) && isset($headers['authorization'])) {
                    $headers['Authorization'] = $headers['authorization'];
                }

                if (!isset($headers['Authorization'])) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token requerido']);
                    exit();
                }

                $token = str_replace('Bearer ', '', $headers['Authorization']);
                $decoded = jwt_decode_simple($token);

                if (!$decoded || !isset($decoded['user_id'])) {
                    http_response_code(401);
                    echo json_encode(['success' => false, 'message' => 'Token inválido']);
                    exit();
                }

                $userId = (int)$decoded['user_id'];
                if ($userId <= 0) {
                    http_response_code(400);
                    echo json_encode(['success' => false, 'message' => 'Usuario inválido en token']);
                    exit();
                }

                // Obtener usuario actual
                $stmt = $db->prepare('SELECT * FROM api_customuser WHERE id = :id');
                $stmt->execute([':id' => $userId]);
                $user = $stmt->fetch(PDO::FETCH_ASSOC);

                if (!$user) {
                    http_response_code(404);
                    echo json_encode(['success' => false, 'message' => 'Usuario no encontrado']);
                    exit();
                }

                // Actualizar campos del perfil (soportar camelCase y snake_case)
                $first_name = (isset($input['firstName']) || isset($input['first_name']))
                    ? ($input['firstName'] ?? $input['first_name'])
                    : ($user['first_name'] ?? '');

                $last_name = (isset($input['lastName']) || isset($input['last_name']))
                    ? ($input['lastName'] ?? $input['last_name'])
                    : ($user['last_name'] ?? '');

                $birth_date = (isset($input['birthDate']) || isset($input['birth_date']))
                    ? ($input['birthDate'] ?? $input['birth_date'])
                    : ($user['birth_date'] ?? null);

                $cedula = $input['cedula'] ?? ($user['cedula'] ?? '');
                $phone = $input['phone'] ?? ($user['phone'] ?? '');
                $address = $input['address'] ?? ($user['address'] ?? '');
                $city = $input['city'] ?? ($user['city'] ?? '');
                $country = $input['country'] ?? ($user['country'] ?? '');

                $emergency_contact = ($input['emergencyContact'] ?? $input['emergency_contact'] ?? ($user['emergency_contact'] ?? ''));
                $emergency_phone = ($input['emergencyPhone'] ?? $input['emergency_phone'] ?? ($user['emergency_phone'] ?? ''));

                $english_level = ($input['englishLevel'] ?? $input['english_level'] ?? ($user['english_level'] ?? ''));
                $learning_goals = ($input['learningGoals'] ?? $input['learning_goals'] ?? ($user['learning_goals'] ?? ''));

                $correo_personal = ($input['correoPersonal'] ?? $input['correo_personal'] ?? ($user['correo_personal'] ?? ''));

                // Ejecutar actualización de forma dinámica según las columnas existentes
                // para evitar errores tipo "Unknown column 'birth_date' in 'SET'" en MySQL
                $colsStmt = $db->query('SHOW COLUMNS FROM api_customuser');
                $availableCols = $colsStmt ? $colsStmt->fetchAll(PDO::FETCH_COLUMN) : [];
                $available = array_flip($availableCols);

                $setParts = [];
                $params = [':id' => $userId];

                if (isset($available['first_name'])) {
                    $setParts[] = 'first_name = :first_name';
                    $params[':first_name'] = $first_name;
                }
                if (isset($available['last_name'])) {
                    $setParts[] = 'last_name = :last_name';
                    $params[':last_name'] = $last_name;
                }
                if (isset($available['birth_date'])) {
                    $setParts[] = 'birth_date = :birth_date';
                    $params[':birth_date'] = $birth_date;
                }
                if (isset($available['cedula'])) {
                    $setParts[] = 'cedula = :cedula';
                    $params[':cedula'] = $cedula;
                }
                if (isset($available['phone'])) {
                    $setParts[] = 'phone = :phone';
                    $params[':phone'] = $phone;
                }
                if (isset($available['address'])) {
                    $setParts[] = 'address = :address';
                    $params[':address'] = $address;
                }
                if (isset($available['city'])) {
                    $setParts[] = 'city = :city';
                    $params[':city'] = $city;
                }
                if (isset($available['country'])) {
                    $setParts[] = 'country = :country';
                    $params[':country'] = $country;
                }
                if (isset($available['emergency_contact'])) {
                    $setParts[] = 'emergency_contact = :emergency_contact';
                    $params[':emergency_contact'] = $emergency_contact;
                }
                if (isset($available['emergency_phone'])) {
                    $setParts[] = 'emergency_phone = :emergency_phone';
                    $params[':emergency_phone'] = $emergency_phone;
                }
                if (isset($available['english_level'])) {
                    $setParts[] = 'english_level = :english_level';
                    $params[':english_level'] = $english_level;
                }
                if (isset($available['learning_goals'])) {
                    $setParts[] = 'learning_goals = :learning_goals';
                    $params[':learning_goals'] = $learning_goals;
                }
                if (isset($available['correo_personal'])) {
                    $setParts[] = 'correo_personal = :correo_personal';
                    $params[':correo_personal'] = $correo_personal;
                }
                if (isset($available['profile_completed'])) {
                    $setParts[] = 'profile_completed = 1';
                }
                if (isset($available['updated_at'])) {
                    $setParts[] = 'updated_at = NOW()';
                }

                if (!empty($setParts)) {
                    $sql = 'UPDATE api_customuser SET ' . implode(",\n                    ", $setParts) . ' WHERE id = :id';
                    $update = $db->prepare($sql);
                    $update->execute($params);
                }

                echo json_encode([
                    'success' => true,
                    'message' => 'Perfil actualizado exitosamente'
                ]);
            } catch (Exception $e) {
                http_response_code(500);
                echo json_encode([
                    'success' => false,
                    'message' => 'Error en el servidor al actualizar perfil',
                    'error' => $e->getMessage(),
                ]);
            }
            exit();
        }

        // Cualquier otra subruta de /auth
        echo json_encode(['success' => false, 'message' => 'Endpoint no encontrado']);
        break;
        
    default:
        echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}
exit();
?>
