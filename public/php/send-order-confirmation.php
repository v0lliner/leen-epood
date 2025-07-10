<?php
// This file contains the sendOrderConfirmation function used by process-order.php

/**
 * Send order confirmation email to customer
 * 
 * @param string $orderId Order ID
 * @param string $orderNumber Order number
 * @param string $customerEmail Customer email
 * @param string $customerName Customer name
 * @param array $items Order items
 * @return bool Success status
 */
function sendOrderConfirmation($orderId, $orderNumber, $customerEmail, $customerName, $items) {
    // Set up logging
    $logDir = __DIR__ . '/../../logs';
    if (!is_dir($logDir)) {
        mkdir($logDir, 0755, true);
    }
    $logFile = $logDir . '/email_sending.log';
    
    // Function to log messages
    function emailLog($message, $data = null) {
        global $logFile;
        $timestamp = date('Y-m-d H:i:s');
        $logEntry = "$timestamp - $message";
        
        if ($data !== null) {
            $logEntry .= ": " . (is_string($data) ? $data : json_encode($data));
        }
        
        file_put_contents($logFile, $logEntry . "\n", FILE_APPEND);
    }
    
    try {
        // Load PHPMailer
        require_once __DIR__ . '/phpmailer/PHPMailer.php';
        require_once __DIR__ . '/phpmailer/SMTP.php';
        require_once __DIR__ . '/phpmailer/Exception.php';
        
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        
        // Server settings
        $mail->isSMTP();
        $mail->Host = 'smtp.zone.eu';
        $mail->SMTPAuth = true;
        $mail->Username = 'leen@leen.ee';
        $mail->Password = 'Leeeen484!';
        $mail->SMTPSecure = 'tls';
        $mail->Port = 587;
        $mail->CharSet = 'UTF-8';
        
        // Recipients
        $mail->setFrom('leen@leen.ee', 'Leen.ee');
        $mail->addAddress($customerEmail, $customerName);
        $mail->addReplyTo('leen@leen.ee', 'Leen Väränen');
        
        // Also send a copy to admin
        $mail->addBCC('leen@leen.ee', 'Leen Väränen');
        
        // Get order details from database
        function supabaseRequest($endpoint, $method = 'GET', $data = null) {
            $supabaseUrl = 'https://epcenpirjkfkgdgxktrm.supabase.co';
            $supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVwY2VucGlyamtma2dkZ3hrdHJtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTExMzgwNCwiZXhwIjoyMDY2Njg5ODA0fQ.wbsLJEL_U-EHNkDe4CFt6-dPNpWHe50WKCQqsoyYdLs';
            
            $url = $supabaseUrl . $endpoint;
            
            $ch = curl_init($url);
            
            $headers = [
                'Content-Type: application/json',
                'Authorization: Bearer ' . $supabaseKey,
                'apikey: ' . $supabaseKey
            ];
            
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            
            if ($method === 'POST') {
                curl_setopt($ch, CURLOPT_POST, true);
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
            } else if ($method === 'PATCH' || $method === 'PUT') {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
                if ($data) {
                    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                }
            } else if ($method === 'DELETE') {
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
            }
            
            $response = curl_exec($ch);
            $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            
            curl_close($ch);
            
            if ($error) {
                emailLog("cURL Error", $error);
                return ['error' => $error, 'status' => $statusCode];
            }
            
            return [
                'data' => json_decode($response, true),
                'status' => $statusCode
            ];
        }
        
        $orderResult = supabaseRequest("/rest/v1/orders?id=eq.$orderId&select=*", 'GET');
        $order = $orderResult['status'] === 200 && !empty($orderResult['data']) ? $orderResult['data'][0] : null;
        
        if (!$order) {
            emailLog("Tellimuse andmeid ei leitud", $orderId);
            return false;
        }
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = "Teie tellimus #{$orderNumber} on kinnitatud - Leen.ee";
        
        // Build HTML email
        $message = "
        <html>
            <head>
                <title>Tellimuse kinnitus</title>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    h1 { color: #2f3e9c; }
                    .order-details { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0; }
                    .item { margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #eee; }
                    .total { font-weight: bold; margin-top: 15px; }
                    .footer { margin-top: 30px; font-size: 0.9em; color: #777; }
                </style>
            </head>
            <body>
                <div class='container'>
                    <h1>Täname teid ostu eest!</h1>
                    <p>Teie tellimus #{$orderNumber} on edukalt kinnitatud.</p>
                    
                    <div class='order-details'>
                        <h2>Tellimuse andmed:</h2>
                        <p><strong>Nimi:</strong> {$customerName}</p>
                        <p><strong>E-post:</strong> {$customerEmail}</p>
                        <p><strong>Telefon:</strong> {$order['customer_phone']}</p>
                        <p><strong>Summa:</strong> {$order['total_amount']} {$order['currency']}</p>";
        
        // Display Omniva parcel machine info if applicable
        if (!empty($order['omniva_parcel_machine_name'])) {
            $message .= "
                        <p><strong>Tarneviis:</strong> Omniva pakiautomaat</p>
                        <p><strong>Pakiautomaat:</strong> " . htmlspecialchars($order['omniva_parcel_machine_name']) . "</p>";
        }
        
        $message .= "
                    </div>
                    
                    <h2>Tellitud tooted:</h2>";
        
        // Add items to email
        $totalAmount = 0;
        foreach ($items as $item) {
            $itemPrice = is_numeric($item['price']) ? $item['price'] : floatval(str_replace(['€', ','], ['', '.'], $item['price']));
            $itemQuantity = $item['quantity'] ?? 1;
            $itemTotal = $itemPrice * $itemQuantity;
            $totalAmount += $itemTotal;
            
            $message .= "
                <div class='item'>
                    <p><strong>{$item['title']}</strong></p>
                    <p>Kogus: {$itemQuantity} × " . number_format($itemPrice, 2, '.', ' ') . "€</p>
                </div>";
        }
        
        $message .= "
                    <p class='total'>Kokku: " . number_format($totalAmount, 2, '.', ' ') . "€</p>
                    
                    <p>Täname, et valisite Leen.ee! Kui teil on küsimusi, võtke meiega ühendust aadressil leen@leen.ee.</p>
                    
                    <div class='footer'>
                        <p>Leen Väränen - Keraamika ja Rõivadisain</p>
                        <p>Jõeääre, Märjamaa, Rapla maakond</p>
                        <p><a href='https://leen.ee'>leen.ee</a></p>
                    </div>
                </div>
            </body>
        </html>";
        
        // Plain text alternative
        $textBody = "Täname teid ostu eest!\n\n" .
                   "Teie tellimus #{$orderNumber} on edukalt kinnitatud.\n\n" .
                   "Tellimuse andmed:\n" .
                   "- Nimi: {$customerName}\n" .
                   "- E-post: {$customerEmail}\n" .
                   "- Telefon: {$order['customer_phone']}\n" .
                   "- Summa: {$order['total_amount']} {$order['currency']}\n";
        
        if (!empty($order['omniva_parcel_machine_name'])) {
            $textBody .= "- Tarneviis: Omniva pakiautomaat\n" .
                        "- Pakiautomaat: {$order['omniva_parcel_machine_name']}\n";
        }
        
        $textBody .= "\nTellitud tooted:\n";
        
        foreach ($items as $item) {
            $itemPrice = is_numeric($item['price']) ? $item['price'] : floatval(str_replace(['€', ','], ['', '.'], $item['price']));
            $itemQuantity = $item['quantity'] ?? 1;
            $textBody .= "- {$item['title']}: {$itemQuantity} × " . number_format($itemPrice, 2, '.', ' ') . "€\n";
        }
        
        $textBody .= "\nKokku: " . number_format($totalAmount, 2, '.', ' ') . "€\n\n" .
                    "Täname, et valisite Leen.ee! Kui teil on küsimusi, võtke meiega ühendust aadressil leen@leen.ee.\n\n" .
                    "Leen Väränen - Keraamika ja Rõivadisain\n" .
                    "Jõeääre, Märjamaa, Rapla maakond\n" .
                    "https://leen.ee";
        
        $mail->Body = $message;
        $mail->AltBody = $textBody;
        
        $mail->send();
        emailLog("Kinnituskiri edukalt saadetud", $customerEmail);
        return true;
    } catch (Exception $e) {
        emailLog("Viga kinnituskirja saatmisel", $e->getMessage());
        return false;
    }
}