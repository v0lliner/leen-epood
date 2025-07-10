<?php
// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type to HTML
header('Content-Type: text/html; charset=UTF-8');

// Define log files to check
$logFiles = [
    'payment_notification.log' => __DIR__ . '/../../logs/payment_notification.log',
    'payment_notification_redirect.log' => __DIR__ . '/../../logs/payment_notification_redirect.log',
    'maksekeskus_webhook_test.log' => __DIR__ . '/../../logs/maksekeskus_webhook_test.log',
    'webhook_simulator.log' => __DIR__ . '/../../logs/webhook_simulator.log',
    'payment_log.txt' => __DIR__ . '/payment_log.txt',
    'process_payment.log' => __DIR__ . '/../../logs/process_payment.log'
];

// Function to read the last N lines of a file
function tailFile($filepath, $lines = 50) {
    if (!file_exists($filepath)) {
        return "File does not exist: $filepath";
    }
    
    $file = file($filepath);
    if (count($file) < $lines) {
        return implode("", $file);
    } else {
        return implode("", array_slice($file, -$lines));
    }
}

// Function to extract references from log content
function extractReferences($content) {
    $references = [];
    
    // Match "reference" values
    if (preg_match_all('/reference["\']?\s*[:=]\s*["\']?([^"\',\s\}]+)/i', $content, $matches)) {
        $references = array_merge($references, $matches[1]);
    }
    
    // Match "Transaction reference" log entries
    if (preg_match_all('/Transaction reference["\']?:\s*["\']?([^"\',\s\}]+)/i', $content, $matches)) {
        $references = array_merge($references, $matches[1]);
    }
    
    return array_unique($references);
}

// Function to check if webhook is working
function checkWebhookStatus($logContent) {
    if (strpos($logContent, 'Notification received') !== false) {
        return true;
    }
    return false;
}

// Function to check if MAC signature was validated
function checkSignatureValidation($logContent) {
    if (strpos($logContent, 'MAC signature verified successfully') !== false) {
        return true;
    }
    return false;
}

// Function to check if content reached logs
function checkContentLogged($logContent) {
    if (strpos($logContent, 'Extracted data') !== false || 
        strpos($logContent, 'Transaction details fetched') !== false) {
        return true;
    }
    return false;
}

// Get the last reference from logs
function getLastReference($logContent) {
    $references = extractReferences($logContent);
    return !empty($references) ? end($references) : 'None found';
}

// HTML output
echo "<!DOCTYPE html>
<html>
<head>
    <title>Maksekeskus Webhook Log Check</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1, h2, h3 { color: #2f3e9c; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .failure { background-color: #f8d7da; color: #721c24; }
        .log-container { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        pre { white-space: pre-wrap; overflow-x: auto; }
        .summary { background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
    </style>
</head>
<body>
    <h1>Maksekeskus Webhook Log Check</h1>";

// Summary section
echo "<div class='summary'>";
echo "<h2>Webhook Status Summary</h2>";
echo "<table>";
echo "<tr><th>Check</th><th>Status</th><th>Details</th></tr>";

// Initialize variables for overall status
$webhookWorks = false;
$signatureValidated = false;
$contentLogged = false;
$lastReference = 'None found';
$allLogContent = '';

// Check each log file
foreach ($logFiles as $name => $path) {
    $logContent = file_exists($path) ? tailFile($path) : "File not found";
    $allLogContent .= $logContent;
    
    // Update status based on log content
    if (checkWebhookStatus($logContent)) {
        $webhookWorks = true;
    }
    
    if (checkSignatureValidation($logContent)) {
        $signatureValidated = true;
    }
    
    if (checkContentLogged($logContent)) {
        $contentLogged = true;
    }
    
    // Get references from this log
    $references = extractReferences($logContent);
    if (!empty($references)) {
        $lastReference = end($references);
    }
}

// Output summary results
echo "<tr><td>Webhook töötab?</td><td class='" . ($webhookWorks ? "success" : "failure") . "'>" . 
     ($webhookWorks ? "✅" : "❌") . "</td><td>" . 
     ($webhookWorks ? "Webhook teavitused jõuavad serverisse" : "Webhook teavitusi ei leitud logidest") . "</td></tr>";

echo "<tr><td>Signatuur valideeriti?</td><td class='" . ($signatureValidated ? "success" : "failure") . "'>" . 
     ($signatureValidated ? "✅" : "❌") . "</td><td>" . 
     ($signatureValidated ? "MAC signatuur valideeriti edukalt" : "MAC signatuuri valideerimist ei leitud logidest") . "</td></tr>";

echo "<tr><td>Sisu jõudis logidesse?</td><td class='" . ($contentLogged ? "success" : "failure") . "'>" . 
     ($contentLogged ? "✅" : "❌") . "</td><td>" . 
     ($contentLogged ? "Teavituse sisu on logitud" : "Teavituse sisu ei leitud logidest") . "</td></tr>";

echo "<tr><td>Viimane reference</td><td colspan='2'><strong>$lastReference</strong></td></tr>";
echo "</table>";
echo "</div>";

// Display log content
foreach ($logFiles as $name => $path) {
    echo "<h2>$name</h2>";
    if (file_exists($path)) {
        $logContent = tailFile($path);
        $references = extractReferences($logContent);
        
        echo "<div class='log-container'>";
        echo "<h3>Viimased kirjed</h3>";
        echo "<pre>" . htmlspecialchars($logContent) . "</pre>";
        
        if (!empty($references)) {
            echo "<h3>Leitud reference väärtused:</h3>";
            echo "<ul>";
            foreach ($references as $ref) {
                echo "<li>" . htmlspecialchars($ref) . "</li>";
            }
            echo "</ul>";
        } else {
            echo "<p>Logist ei leitud ühtegi reference väärtust.</p>";
        }
        
        echo "</div>";
    } else {
        echo "<div class='status failure'>Logifaili ei leitud: $path</div>";
    }
}

// Add links to test tools
echo "<h2>Testimise tööriistad</h2>";
echo "<p><a href='webhook-simulator.php' target='_blank'>Käivita webhook simulaator</a> - Saadab testpäringu maksekeskuse teavituse testimiseks</p>";
echo "<p><a href='maksekeskus-test.php' target='_blank'>Testi maksekeskus-test.php endpointi</a> - Kontrollib, kas endpoint on kättesaadav</p>";
echo "<p><a href='debug-notify.php' target='_blank'>Käivita debug-notify.php</a> - Simuleerib Maksekeskuse teavitust payment-notification.php skriptile</p>";
echo "<p><a href='test-webhook.php' target='_blank'>Käivita test-webhook.php</a> - Teine simulaator maksekeskuse teavituse testimiseks</p>";
echo "<p><a href='test-makse-tagastus.php' target='_blank'>Käivita test-makse-tagastus.php</a> - Simuleerib makse tagastust</p>";

// Add file permissions check
echo "<h2>Logifailide õigused</h2>";
echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Fail</th><th>Eksisteerib</th><th>Kirjutatav</th><th>Õigused</th><th>Omanik</th></tr>";

foreach ($logFiles as $name => $path) {
    $exists = file_exists($path);
    $writable = $exists ? is_writable($path) : false;
    $perms = $exists ? substr(sprintf('%o', fileperms($path)), -4) : 'N/A';
    $owner = $exists ? (function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($path))['name'] : fileowner($path)) : 'N/A';
    
    echo "<tr>";
    echo "<td>$name</td>";
    echo "<td>" . ($exists ? '✅' : '❌') . "</td>";
    echo "<td>" . ($writable ? '✅' : '❌') . "</td>";
    echo "<td>$perms</td>";
    echo "<td>$owner</td>";
    echo "</tr>";
}

echo "</table>";

// Add directory permissions check
echo "<h2>Kataloogide õigused</h2>";
$directories = [
    'logs' => __DIR__ . '/../../logs',
    'php' => __DIR__ . '/..',
    'project' => __DIR__ . '/../..'
];

echo "<table border='1' cellpadding='5'>";
echo "<tr><th>Kataloog</th><th>Eksisteerib</th><th>Kirjutatav</th><th>Õigused</th><th>Omanik</th></tr>";

foreach ($directories as $name => $path) {
    $exists = is_dir($path);
    $writable = $exists ? is_writable($path) : false;
    $perms = $exists ? substr(sprintf('%o', fileperms($path)), -4) : 'N/A';
    $owner = $exists ? (function_exists('posix_getpwuid') ? posix_getpwuid(fileowner($path))['name'] : fileowner($path)) : 'N/A';
    
    echo "<tr>";
    echo "<td>$name</td>";
    echo "<td>" . ($exists ? '✅' : '❌') . "</td>";
    echo "<td>" . ($writable ? '✅' : '❌') . "</td>";
    echo "<td>$perms</td>";
    echo "<td>$owner</td>";
    echo "</tr>";
}

echo "</table>";

echo "</body></html>";