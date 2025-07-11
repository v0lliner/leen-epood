<?php
namespace Controllers;

use Services\OmnivaService;
use Clients\OmnivaClient;
use Repositories\OrderRepository;

/**
 * Controller for Omniva operations
 */
class OmnivaController {
    private $logger;
    private $envLoader;
    private $supabase;
    
    /**
     * Create a new Omniva controller
     * 
     * @param \Utils\Logger $logger Logger instance
     * @param \Utils\EnvLoader $envLoader Environment loader
     * @param \Repositories\SupabaseRepository $supabase Supabase client
     */
    public function __construct($logger, $envLoader, $supabase) {
        $this->logger = $logger;
        $this->envLoader = $envLoader;
        $this->supabase = $supabase;
    }
    
    /**
     * Get parcel machines
     * 
     * @return void Outputs JSON response
     */
    public function getParcelMachines() {
        $this->logger->info("Parcel machines request received", [
            'time' => date('Y-m-d H:i:s'),
            'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        try {
            // Get country from query parameter, default to 'ee' (Estonia)
            $country = isset($_GET['country']) ? strtolower($_GET['country']) : 'ee';
            $validCountries = ['ee', 'lv', 'lt', 'fi'];
            
            if (!in_array($country, $validCountries)) {
                $country = 'ee'; // Default to Estonia if invalid country provided
            }
            
            // Initialize repositories
            require_once __DIR__ . '/../Repositories/OrderRepository.php';
            $orderRepository = new \Repositories\OrderRepository($this->supabase, $this->logger);
            
            // Initialize clients
            require_once __DIR__ . '/../Clients/OmnivaClient.php';
            $omnivaClient = new \Clients\OmnivaClient(
                $this->envLoader->get('OMNIVA_USERNAME', '247723'),
                $this->envLoader->get('OMNIVA_PASSWORD', 'Ddg(8?e:$A'),
                $this->envLoader->get('OMNIVA_CUSTOMER_CODE', '247723'),
                $this->envLoader->get('OMNIVA_TEST_MODE', 'false') === 'true',
                $this->logger
            );
            
            // Initialize services
            require_once __DIR__ . '/../Services/OmnivaService.php';
            $omnivaService = new \Services\OmnivaService(
                $omnivaClient,
                $orderRepository,
                $this->logger
            );
            
            // Get parcel machines
            $parcelMachines = $omnivaService->getParcelMachines($country);
            
            // Return the parcel machines
            echo json_encode([
                'success' => true,
                'country' => $country,
                'parcelMachines' => $parcelMachines
            ]);
            
        } catch (\Exception $e) {
            // Log the error
            $this->logger->exception($e, "Parcel machines request failed");
            
            // Return error response
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
        
        // Final log entry to confirm script completion
        $this->logger->info("Parcel machines request completed");
    }
    
    /**
     * Register a shipment
     * 
     * @return void Outputs JSON response
     */
    public function registerShipment() {
        $this->logger->info("Shipment registration request received", [
            'time' => date('Y-m-d H:i:s'),
            'remote_addr' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
        ]);
        
        // Check if it's a POST request
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['success' => false, 'error' => 'Method not allowed']);
            $this->logger->error("Invalid request method", ['method' => $_SERVER['REQUEST_METHOD'] ?? 'unknown']);
            return;
        }
        
        try {
            // Get the raw POST data
            $rawData = file_get_contents('php://input');
            $this->logger->info("Received shipment registration data", ['raw_data_length' => strlen($rawData)]);
            
            // Decode the JSON data
            $data = json_decode($rawData, true);
            
            // Check if JSON is valid
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Invalid JSON data: ' . json_last_error_msg()]);
                $this->logger->error("Invalid JSON data", ['error' => json_last_error_msg()]);
                return;
            }
            
            // Validate required fields
            if (empty($data['orderId'])) {
                http_response_code(400);
                echo json_encode(['success' => false, 'error' => 'Order ID is required']);
                $this->logger->error("Missing orderId in request");
                return;
            }
            
            // Initialize repositories
            require_once __DIR__ . '/../Repositories/OrderRepository.php';
            $orderRepository = new \Repositories\OrderRepository($this->supabase, $this->logger);
            
            // Initialize clients
            require_once __DIR__ . '/../Clients/OmnivaClient.php';
            $omnivaClient = new \Clients\OmnivaClient(
                $this->envLoader->get('OMNIVA_USERNAME', '247723'),
                $this->envLoader->get('OMNIVA_PASSWORD', 'Ddg(8?e:$A'),
                $this->envLoader->get('OMNIVA_CUSTOMER_CODE', '247723'),
                $this->envLoader->get('OMNIVA_TEST_MODE', 'false') === 'true',
                $this->logger
            );
            
            // Initialize services
            require_once __DIR__ . '/../Services/OmnivaService.php';
            $omnivaService = new \Services\OmnivaService(
                $omnivaClient,
                $orderRepository,
                $this->logger
            );
            
            // Register shipment
            $sendNotification = isset($data['sendNotification']) ? (bool)$data['sendNotification'] : false;
            $result = $omnivaService->registerShipment($data['orderId'], $sendNotification);
            
            // Return the result
            echo json_encode($result);
            
        } catch (\Exception $e) {
            // Log the error
            $this->logger->exception($e, "Shipment registration failed");
            
            // Return error response
            http_response_code(500);
            echo json_encode([
                'success' => false,
                'error' => $e->getMessage()
            ]);
        }
        
        // Final log entry to confirm script completion
        $this->logger->info("Shipment registration request completed");
    }
}