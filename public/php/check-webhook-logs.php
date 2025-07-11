<?php
/**
 * Webhook log checker
 * 
 * This utility script checks the webhook logs to help diagnose
 * issues with payment notifications.
 */

// Enable error reporting for development
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Set content type to HTML
header('Content-Type: text/html; charset=UTF-8');

// Define log files to check
$logFiles = [
    'payment_notification.log' => dirname(__DIR__) . '/logs/payment_notification.log',
    'payment_redirect.log' => dirname(__DIR__) . '/logs/payment_redirect.log',
    'webhook_simulator.log' => dirname(__DIR__) . '/logs/webhook_simulator.log',
    'env_loader.log' => dirname(__DIR__) . '/logs/env_loader.log',
    'payment_processor.log' => dirname(__DIR__) . '/logs/payment_processor.log'
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
    if (strpos($logContent, 'Payment notification received') !== false) {
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
    if (strpos($logContent, 'Payment data extracted successfully') !== false || 
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

// Function to create/fix log files
function fixLogFiles() {
    global $logFiles;
    
    $logDir = dirname(__DIR__) . '/logs';
    
    // Create logs directory if it doesn't exist
    if (!is_dir($logDir)) {
        if (mkdir($logDir, 0777, true)) {
            echo "<div class='status success'>Created logs directory: $logDir</div>";
        } else {
            echo "<div class='status failure'>Failed to create logs directory: $logDir</div>";
            return;
        }
    } else {
        echo "<div class='status success'>Logs directory already exists: $logDir</div>";
        // Ensure directory is writable
        chmod($logDir, 0777);
    }
    
    // Create/check each log file
    foreach ($logFiles as $name => $path) {
        if (!file_exists($path)) {
            if (touch($path)) {
                chmod($path, 0666);
                echo "<div class='status success'>Created log file: $name</div>";
            } else {
                echo "<div class='status failure'>Failed to create log file: $name</div>";
            }
        } else {
            echo "<div class='status success'>Log file already exists: $name</div>";
            // Ensure file is writable
            chmod($path, 0666);
        }
    }
}

// Check if maintenance action was requested
if (isset($_GET['action']) && $_GET['action'] === 'fix_logs') {
    fixLogFiles();
}

// HTML output
?>
<!DOCTYPE html>
<html>
<head>
    <title>Maksekeskus Webhook Log Check</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 1200px; margin: 0 auto; }
        h1, h2, h3 { color: #2f3e9c; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; }
        .failure { background-color: #f8d7da; color: #721c24; }
        .warning { background-color: #fff3cd; color: #856404; }
        .log-container { background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }
        pre { white-space: pre-wrap; overflow-x: auto; }
        .summary { background: #e9ecef; padding: 20px; border-radius: 5px; margin: 20px 0; }
        table { width: 100%; border-collapse: collapse; }
        table, th, td { border: 1px solid #ddd; }
        th, td { padding: 12px; text-align: left; }
        th { background-color: #f2f2f2; }
        .maintenance { margin: 20px 0; padding: 15px; background-color: #e9ecef; border-radius: 5px; }
        .btn { display: inline-block; padding: 10px 15px; background-color: #2f3e9c; color: white; text-decoration: none; border-radius: 5px; }
        .btn:hover { background-color: #232d75; }
    </style>
</head>
<body>
    <h1>Maksekeskus Webhook Log Check</h1>
    
    <div class="maintenance">
        <h2>Maintenance</h2>
        <p>If you're having issues with logs not appearing, click the button below to create/fix log files:</p>
        <a href="?action=fix_logs" class="btn">Create/Fix Log Files</a>
    </div>

    <!-- Summary section -->
    <div class="summary">
        <h2>Webhook Status Summary</h2>
        <table>
            <tr><th>Check</th><th>Status</th><th>Details</th></tr>

<?php
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
?>
        </table>
    </div>

    <!-- Directory and file status -->
    <div class="summary">
        <h2>Directory and File Status</h2>
        <table>
            <tr>
                <th>Path</th>
                <th>Exists</th>
                <th>Permissions</th>
                <th>Size</th>
                <th>Last Modified</th>
            </tr>
            <tr>
                <td><?php echo dirname(__DIR__) . '/logs'; ?></td>
                <td><?php echo is_dir(dirname(__DIR__) . '/logs') ? '✅' : '❌'; ?></td>
                <td><?php echo is_dir(dirname(__DIR__) . '/logs') ? substr(sprintf('%o', fileperms(dirname(__DIR__) . '/logs')), -4) : 'N/A'; ?></td>
                <td>Directory</td>
                <td><?php echo is_dir(dirname(__DIR__) . '/logs') ? date('Y-m-d H:i:s', filemtime(dirname(__DIR__) . '/logs')) : 'N/A'; ?></td>
            </tr>
            <?php foreach ($logFiles as $name => $path): ?>
            <tr>
                <td><?php echo $path; ?></td>
                <td><?php echo file_exists($path) ? '✅' : '❌'; ?></td>
                <td><?php echo file_exists($path) ? substr(sprintf('%o', fileperms($path)), -4) : 'N/A'; ?></td>
                <td><?php echo file_exists($path) ? filesize($path) . ' bytes' : 'N/A'; ?></td>
                <td><?php echo file_exists($path) ? date('Y-m-d H:i:s', filemtime($path)) : 'N/A'; ?></td>
            </tr>
            <?php endforeach; ?>
        </table>
    </div>

    <!-- Display log content -->
    <?php foreach ($logFiles as $name => $path): ?>
    <h2><?php echo $name; ?></h2>
    <?php if (file_exists($path)): ?>
        <div class="log-container">
            <h3>Last 50 log entries</h3>
            <pre><?php echo htmlspecialchars(tailFile($path)); ?></pre>
            
            <?php
            $references = extractReferences(tailFile($path));
            if (!empty($references)):
            ?>
            <h3>Found references:</h3>
            <ul>
                <?php foreach ($references as $ref): ?>
                <li><?php echo htmlspecialchars($ref); ?></li>
                <?php endforeach; ?>
            </ul>
            <?php else: ?>
            <p>No references found in this log.</p>
            <?php endif; ?>
        </div>
    <?php else: ?>
        <div class="status failure">Log file not found: <?php echo $path; ?></div>
    <?php endif; ?>
    <?php endforeach; ?>

    <!-- Testing tools -->
    <h2>Testing Tools</h2>
    <ul>
        <li><a href="webhook-simulator.php">Run webhook simulator</a> - Sends a test webhook notification</li>
        <li><a href="webhook-simulator.php?target=production">Test production endpoint</a> - Tests the payment-notification.php endpoint</li>
        <li><a href="test-webhook.php">Run test-webhook.php</a> - Simulates a Maksekeskus webhook with real API credentials</li>
    </ul>
</body>
</html>