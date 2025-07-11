<?php
namespace Services;

/**
 * Service for Omniva shipping operations
 */
class OmnivaService {
    private $omnivaClient;
    private $orderRepository;
    private $logger;
    
    /**
     * Create a new Omniva service
     * 
     * @param \Clients\OmnivaClient $omnivaClient Omniva client
     * @param \Repositories\OrderRepository $orderRepository Order repository
     * @param \Utils\Logger $logger Logger instance
     */
    public function __construct($omnivaClient, $orderRepository, $logger) {
        $this->omnivaClient = $omnivaClient;
        $this->orderRepository = $orderRepository;
        $this->logger = $logger;
    }
    
    /**
     * Get parcel machines for a country
     * 
     * @param string $country Country code (ee, lv, lt, fi)
     * @return array Parcel machines
     */
    public function getParcelMachines($country = 'ee') {
        $this->logger->info("Getting parcel machines for country", [
            'country' => $country
        ]);
        
        return $this->omnivaClient->getParcelMachines($country);
    }
    
    /**
     * Register a shipment for an order
     * 
     * @param string $orderId Order ID
     * @param bool $sendNotification Whether to send notification email
     * @return array Result with barcode and tracking info
     * @throws \Exception if shipment registration fails
     */
    public function registerShipment($orderId, $sendNotification = false) {
        $this->logger->info("Registering shipment for order", [
            'order_id' => $orderId,
            'send_notification' => $sendNotification ? 'true' : 'false'
        ]);
        
        // Get order details
        $order = $this->orderRepository->getOrderById($orderId);
        if (!$order) {
            $this->logger->error("Order not found", [
                'order_id' => $orderId
            ]);
            throw new \Exception("Order not found");
        }
        
        // Check if this order has a parcel machine ID
        if (empty($order['omniva_parcel_machine_id'])) {
            $this->logger->error("Not an Omniva parcel machine order", [
                'order_id' => $orderId
            ]);
            throw new \Exception("Not an Omniva parcel machine order");
        }
        
        // Check if shipment is already registered
        if (!empty($order['omniva_barcode'])) {
            $this->logger->info("Shipment already registered", [
                'barcode' => $order['omniva_barcode']
            ]);
            
            // If notification requested, generate label and send notification
            if ($sendNotification && !empty($order['omniva_barcode'])) {
                $labelUrl = $this->omnivaClient->generateLabel($order['omniva_barcode'], $order['order_number']);
                
                if ($labelUrl) {
                    // Update order with label URL
                    $this->orderRepository->update('orders', $orderId, [
                        'label_url' => $labelUrl
                    ]);
                    
                    // TODO: Send notification email
                    // $this->sendShipmentNotification($order, $order['omniva_barcode'], $trackingUrl, $labelUrl);
                }
            }
            
            return [
                'success' => true,
                'message' => 'Shipment already registered',
                'barcode' => $order['omniva_barcode'],
                'tracking_url' => $order['tracking_url'] ?? null,
                'label_url' => $order['label_url'] ?? null
            ];
        }
        
        // Register shipment with Omniva
        $result = $this->omnivaClient->registerShipment($order);
        
        if (isset($result['barcodes']) && !empty($result['barcodes'])) {
            $barcode = $result['barcodes'][0];
            
            // Create tracking URL
            $trackingUrl = "https://www.omniva.ee/track?barcode={$barcode}";
            
            // Generate and save PDF label
            $labelUrl = $this->omnivaClient->generateLabel($barcode, $order['order_number']);
            
            // Update order with tracking details
            $this->orderRepository->updateOrderWithShipmentDetails(
                $orderId,
                $barcode,
                $trackingUrl,
                $labelUrl
            );
            
            // TODO: Send notification email if requested
            // if ($sendNotification && $labelUrl) {
            //     $this->sendShipmentNotification($order, $barcode, $trackingUrl, $labelUrl);
            // }
            
            return [
                'success' => true,
                'message' => 'Shipment registered successfully',
                'barcode' => $barcode,
                'tracking_url' => $trackingUrl,
                'label_url' => $labelUrl
            ];
        } else {
            $this->logger->error("No barcode received from Omniva API", [
                'result' => $result
            ]);
            throw new \Exception('Omniva API ei tagastanud triipkoodi');
        }
    }
    
    /**
     * Send notification email with shipment details
     * 
     * @param array $order Order data
     * @param string $barcode Omniva barcode
     * @param string $trackingUrl Tracking URL
     * @param string $labelUrl Label URL
     * @return bool Success status
     */
    private function sendShipmentNotification($order, $barcode, $trackingUrl, $labelUrl) {
        // TODO: Implement email sending logic
        // This would typically use PHPMailer or similar library
        return true;
    }
}