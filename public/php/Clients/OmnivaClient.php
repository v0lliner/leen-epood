<?php
namespace Clients;

require_once __DIR__ . '/../omniva/vendor/autoload.php';

use Mijora\Omniva\OmnivaException;
use Mijora\Omniva\Shipment\Package\Address;
use Mijora\Omniva\Shipment\Package\Contact;
use Mijora\Omniva\Shipment\Package\Measures;
use Mijora\Omniva\Shipment\Package\Package;
use Mijora\Omniva\Shipment\Shipment;
use Mijora\Omniva\Shipment\ShipmentHeader;
use Mijora\Omniva\Shipment\Label;

/**
 * Client for interacting with Omniva shipping API
 */
class OmnivaClient {
    private $username;
    private $password;
    private $customerCode;
    private $testMode;
    private $logger;
    
    /**
     * Create a new Omniva client
     * 
     * @param string $username Omniva API username
     * @param string $password Omniva API password
     * @param string $customerCode Omniva customer code
     * @param bool $testMode Whether to use test mode
     * @param \Utils\Logger $logger Logger instance
     */
    public function __construct($username, $password, $customerCode, $testMode, $logger) {
        $this->username = $username;
        $this->password = $password;
        $this->customerCode = $customerCode;
        $this->testMode = $testMode;
        $this->logger = $logger;
        
        $this->logger->info("Omniva client initialized", [
            'username' => $username,
            'customer_code' => $customerCode,
            'test_mode' => $testMode ? 'true' : 'false'
        ]);
    }
    
    /**
     * Register a shipment with Omniva
     * 
     * @param array $orderData Order data
     * @return array Result with barcodes and status
     * @throws \Exception if shipment registration fails
     */
    public function registerShipment($orderData) {
        try {
            $this->logger->info("Registering shipment with Omniva", [
                'order_id' => $orderData['id'] ?? 'unknown',
                'order_number' => $orderData['order_number'] ?? 'unknown'
            ]);
            
            // Create shipment
            $shipment = new Shipment();
            $shipment->setComment("Order #{$orderData['order_number']}");
            $shipment->setShowReturnCodeEmail(true);
            
            // Set shipment header
            $shipmentHeader = new ShipmentHeader();
            $shipmentHeader->setSenderCd($this->customerCode)
                          ->setFileId(date('Ymdhis'));
            $shipment->setShipmentHeader($shipmentHeader);
            
            // Create package
            $package = new Package();
            $package->setId($orderData['order_number'])
                   ->setService('PU'); // Parcel machine service
            
            // Set package measurements
            $measures = new Measures();
            $measures->setWeight($this->calculateTotalWeight($orderData))
                    ->setLength(0.3) // Default values in meters
                    ->setWidth(0.3)
                    ->setHeight(0.3);
            $package->setMeasures($measures);
            
            // Set receiver contact info
            $receiverContact = new Contact();
            $receiverAddress = new Address();
            $receiverAddress->setCountry('EE') // Hardcoded to Estonia for now
                           ->setOffloadPostcode($orderData['omniva_parcel_machine_id']);
            
            $receiverContact->setAddress($receiverAddress)
                           ->setMobile($orderData['customer_phone'])
                           ->setEmail($orderData['customer_email'])
                           ->setPersonName($orderData['customer_name']);
            
            $package->setReceiverContact($receiverContact);
            
            // Set sender contact info
            $senderContact = new Contact();
            $senderAddress = new Address();
            $senderAddress->setCountry('EE')
                         ->setPostcode('79631')
                         ->setDeliverypoint('Märjamaa')
                         ->setStreet('Jõeääre, Kuku küla');
            
            $senderContact->setAddress($senderAddress)
                         ->setMobile('+37253801413')
                         ->setEmail('leen@leen.ee')
                         ->setPersonName('Leen Väränen')
                         ->setCompanyName('PopLeen OÜ');
            
            $package->setSenderContact($senderContact);
            
            // Add package to shipment
            $shipment->setPackages([$package]);
            
            // Set authentication
            $shipment->setAuth($this->username, $this->password);
            
            // Register shipment
            $result = $shipment->registerShipment();
            
            $this->logger->info("Shipment registered successfully", [
                'barcodes' => $result['barcodes'] ?? []
            ]);
            
            return $result;
        } catch (OmnivaException $e) {
            $this->logger->exception($e, "Failed to register shipment with Omniva");
            throw new \Exception("Failed to register shipment: " . $e->getMessage(), 0, $e);
        }
    }
    
    /**
     * Generate and save a label for a shipment
     * 
     * @param string $barcode Shipment barcode
     * @param string $orderNumber Order number for filename
     * @return string|null URL to the saved label or null on failure
     */
    public function generateLabel($barcode, $orderNumber) {
        try {
            $this->logger->info("Generating label for barcode", [
                'barcode' => $barcode,
                'order_number' => $orderNumber
            ]);
            
            // Create PDF labels directory if it doesn't exist
            $pdfDir = dirname(dirname(__DIR__)) . '/pdf_labels';
            if (!is_dir($pdfDir)) {
                mkdir($pdfDir, 0755, true);
            }
            
            // Initialize Omniva label class
            $label = new Label();
            $label->setAuth($this->username, $this->password);
            
            // Generate filename
            $filename = "omniva-{$orderNumber}";
            
            // Download label and save to file
            $label->downloadLabels([$barcode], false, 'F', $filename);
            
            // Return public URL path
            $labelUrl = "/pdf_labels/{$filename}.pdf";
            
            $this->logger->info("Label generated successfully", [
                'label_url' => $labelUrl
            ]);
            
            return $labelUrl;
        } catch (\Exception $e) {
            $this->logger->exception($e, "Failed to generate label");
            return null;
        }
    }
    
    /**
     * Calculate total weight of an order
     * 
     * @param array $orderData Order data with items
     * @return float Total weight in kg
     */
    private function calculateTotalWeight($orderData) {
        $totalWeight = 0;
        
        if (isset($orderData['items']) && is_array($orderData['items'])) {
            foreach ($orderData['items'] as $item) {
                $itemWeight = 0;
                
                if (isset($item['products']) && isset($item['products']['weight']) && $item['products']['weight'] > 0) {
                    $itemWeight = $item['products']['weight'];
                } else {
                    // Default weight if not specified
                    $itemWeight = 0.5;
                }
                
                $totalWeight += $itemWeight * ($item['quantity'] ?? 1);
            }
        }
        
        // Ensure minimum weight
        return max(1.0, $totalWeight);
    }
    
    /**
     * Get parcel machines from Omniva API
     * 
     * @param string $country Country code (ee, lv, lt)
     * @return array Parcel machines
     */
    public function getParcelMachines($country = 'ee') {
        try {
            $this->logger->info("Fetching parcel machines for country", [
                'country' => $country
            ]);
            
            // Cache settings
            $cacheFile = dirname(dirname(__DIR__)) . '/omniva_locations_cache.json';
            $cacheExpiry = 86400; // 24 hours in seconds
            
            // Check if we have a valid cache file
            $useCache = false;
            if (file_exists($cacheFile)) {
                $cacheTime = filemtime($cacheFile);
                if (time() - $cacheTime < $cacheExpiry) {
                    $useCache = true;
                }
            }
            
            if ($useCache) {
                $this->logger->info("Using cached parcel machine data");
                $locationsData = file_get_contents($cacheFile);
                $locations = json_decode($locationsData, true);
            } else {
                $this->logger->info("Fetching fresh parcel machine data from Omniva API");
                
                // Fetch data from Omniva API
                $apiUrl = 'https://www.omniva.ee/locationsfull.json';
                $ch = curl_init($apiUrl);
                curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($ch, CURLOPT_TIMEOUT, 10); // 10 seconds timeout
                curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
                
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                $error = curl_error($ch);
                
                curl_close($ch);
                
                if ($error) {
                    throw new \Exception("cURL Error: $error");
                }
                
                if ($httpCode !== 200) {
                    throw new \Exception("API returned HTTP code $httpCode");
                }
                
                $locations = json_decode($response, true);
                
                if (!$locations || !is_array($locations)) {
                    throw new \Exception("Invalid response from Omniva API");
                }
                
                // Cache the response
                file_put_contents($cacheFile, $response);
                $this->logger->info("Cached fresh parcel machine data");
            }
            
            // Filter locations by country and type (parcel machines only)
            $filteredLocations = array_filter($locations, function($location) use ($country) {
                return isset($location['A0_NAME']) && 
                       strtolower($location['A0_NAME']) === $country && 
                       isset($location['TYPE']) && 
                       $location['TYPE'] === '0'; // TYPE 0 = parcel machines
            });
            
            // Reindex array to get sequential numeric keys
            $filteredLocations = array_values($filteredLocations);
            
            // Format the data for easier consumption by the frontend
            $formattedLocations = array_map(function($location) {
                $address = '';
                
                // Build address from available components
                $addressParts = [];
                if (!empty($location['A2_NAME'])) {
                    $addressParts[] = $location['A2_NAME']; // City
                }
                if (!empty($location['A5_NAME'])) {
                    $addressParts[] = $location['A5_NAME']; // Street
                }
                
                $address = implode(', ', $addressParts);
                
                return [
                    'id' => $location['ZIP'],
                    'name' => $location['NAME'],
                    'address' => $address
                ];
            }, $filteredLocations);
            
            // Sort by name
            usort($formattedLocations, function($a, $b) {
                return strcmp($a['name'], $b['name']);
            });
            
            $this->logger->info("Returning parcel machines", [
                'count' => count($formattedLocations),
                'country' => $country
            ]);
            
            return $formattedLocations;
        } catch (\Exception $e) {
            $this->logger->exception($e, "Failed to get parcel machines");
            throw $e;
        }
    }
}