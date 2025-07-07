<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 0); // Don't display errors to users, but log them

// Set content type to JSON
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Log file for debugging
$logFile = __DIR__ . '/mailer_log.txt';

// Function to log messages
function logMessage($message, $data = null) {
    global $logFile;
    $timestamp = date('Y-m-d H:i:s');
    $logEntry = "$timestamp - $message";
    
    if ($data !== null) {
        $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
    }
    
    file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
}

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    logMessage("Method not allowed: " . $_SERVER['REQUEST_METHOD']);
    exit();
}

try {
    // Get the raw POST data
    $rawData = file_get_contents('php://input');
    logMessage("Received data", $rawData);
    
    // Decode the JSON data
    $data = json_decode($rawData, true);
    
    // Check if JSON is valid
    if (json_last_error() !== JSON_ERROR_NONE) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid JSON data']);
        logMessage("Invalid JSON data: " . json_last_error_msg());
        exit();
    }
    
    // Validate required fields (phone is optional)
    if (empty($data['name']) || empty($data['email']) || empty($data['message'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Required fields missing']);
        logMessage("Required fields missing", $data);
        exit();
    }
    
    // Sanitize input data
    $name = htmlspecialchars($data['name'], ENT_QUOTES, 'UTF-8');
    $email = filter_var($data['email'], FILTER_SANITIZE_EMAIL);
    $phone = !empty($data['phone']) ? htmlspecialchars($data['phone'], ENT_QUOTES, 'UTF-8') : 'Pole määratud';
    $message = htmlspecialchars($data['message'], ENT_QUOTES, 'UTF-8');
    
    // Validate email format
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Invalid email format']);
        logMessage("Invalid email format: $email");
        exit();
    }
    
    $serverName = $_SERVER['SERVER_NAME'] ?? 'leen.ee';
    
    // Prepare email message
    $emailMessage = '
        <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { border-collapse: collapse; width: 100%; }
                    td { padding: 8px; border-bottom: 1px solid #ddd; }
                    .header { background-color: #f5f5f5; font-weight: bold; }
                </style>
            </head>
            <body>
                <h2>Uus kontaktivorm - ' . $serverName . '</h2>
                <table>
                    <tr class="header"><td><b>Nimi:</b></td><td>' . $name . '</td></tr>
                    <tr><td><b>Email:</b></td><td>' . $email . '</td></tr>
                    <tr><td><b>Telefon:</b></td><td>' . $phone . '</td></tr>
                    <tr><td colspan="2" class="header"><b>Sõnum:</b></td></tr>
                    <tr><td colspan="2">' . nl2br($message) . '</td></tr>
                </table>
                <br>
                <p><small>Saadetud: ' . date('Y-m-d H:i:s') . '</small></p>
            </body>
        </html>
    ';

    // Set up email headers
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Leen.ee <noreply@leen.ee>\r\n";
    $headers .= "Reply-To: $email\r\n";
    
    // Send email
    $to = "leen@leen.ee";
    $subject = "[$serverName]: Kontaktivorm - $name";
    
    logMessage("Attempting to send email", [
        'to' => $to,
        'subject' => $subject,
        'headers' => $headers
    ]);
    
    $mailSent = mail($to, $subject, $emailMessage, $headers);
    
    if ($mailSent) {
        logMessage("Email sent successfully");
        echo json_encode(['success' => true, 'message' => 'Sõnum edukalt saadetud!']);
    } else {
        logMessage("Email sending failed");
        throw new Exception('Email sending failed');
    }
    
} catch (Exception $e) {
    logMessage("Exception occurred", $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Serveri viga sõnumi saatmisel. Palun proovige hiljem uuesti.']);
}
?>