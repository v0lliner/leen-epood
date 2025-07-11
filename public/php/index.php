@@ .. @@
 $handlerFound = false;
 
 // Handle different API endpoints
-if (strpos($path, 'get-omniva-parcel-machines') === 0) {
-    // Omniva parcel machines endpoint
-    require_once __DIR__ . '/omniva/vendor/autoload.php'; // Load Omniva autoloader
-    require_once __DIR__ . '/get-omniva-parcel-machines.php';
+if (strpos($path, 'omniva_integration/get_locations') === 0) {
+    // New modular Omniva parcel machines endpoint
+    require_once __DIR__ . '/omniva_integration/get_locations.php';
     $handlerFound = true;
 } else if (strpos($path, 'process-payment') === 0) {
     // Payment processing endpoint
@@ .. @@