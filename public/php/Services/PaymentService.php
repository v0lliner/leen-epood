<?php
namespace Services;

/**
 * Service for payment processing
 */
class PaymentService {
    private $maksekeskusClient;
    private $orderRepository;
    private $logger;
    
    /**
     * Create a new payment service
     * 
     * @param \Clients\MaksekeskusClient $maksekeskusClient Maksekeskus client
     * @param \Repositories\OrderRepository $orderRepository Order repository
     * @param \Utils\Logger $logger Logger instance
     */
    public function __construct($maksekeskusClient, $orderRepository, $logger) {
        $this->maksekeskusClient = $maksekeskusClient;
        $this->orderRepository = $orderRepository;
        $this->logger = $logger;
    }
    
    /**
     * Create a payment transaction
     * 
     * @param array $paymentData Payment data from frontend
     * @return array Transaction data with payment URL
     * @throws \Exception if transaction creation fails
     */
    public function createTransaction($paymentData) {
        $this->logger->info("Creating payment transaction", [
            'amount' => $paymentData['amount'] ?? 'unknown',
            'reference' => $paymentData['reference'] ?? 'unknown'
        ]);
        
        // Define proper country code mapping
        $countryCodeMap = [
            'Estonia' => 'ee',
            'Latvia' => 'lv',
            'Lithuania' => 'lt',
            'Finland' => 'fi'
        ];
        
        // Get the correct country code from the map, default to 'ee' if not found
        $countryCode = $countryCodeMap[$paymentData['country'] ?? 'Estonia'] ?? 'ee';
        
        // Prepare transaction data
        $transactionData = [
            'transaction' => [
                'amount' => (float)$paymentData['amount'],
                'currency' => 'EUR',
                'reference' => $paymentData['reference'],
                'merchant_data' => json_encode([
                    'customer_name' => $paymentData['firstName'] . ' ' . $paymentData['lastName'],
                    'customer_email' => $paymentData['email'],
                    'customer_phone' => $paymentData['phone'] ?? '',
                    'shipping_address' => $paymentData['shipping_address'] ?? '',
                    'shipping_city' => $paymentData['shipping_city'] ?? '',
                    'shipping_postal_code' => $paymentData['shipping_postal_code'] ?? '',
                    'shipping_country' => $paymentData['country'] ?? 'Estonia',
                    'items' => $paymentData['items'] ?? [],
                    'deliveryMethod' => $paymentData['deliveryMethod'] ?? null,
                    'omnivaParcelMachineId' => $paymentData['omnivaParcelMachineId'] ?? null,
                    'omnivaParcelMachineName' => $paymentData['omnivaParcelMachineName'] ?? null
                ]),
                'return_url' => 'https://leen.ee/checkout/success?reference=' . $paymentData['reference'],
                'cancel_url' => 'https://leen.ee/checkout',
                'notification_url' => 'https://leen.ee/php/payment-notification.php'
            ],
            'customer' => [
                'email' => $paymentData['email'],
                'country' => $countryCode,
                'locale' => 'et'
            ]
        ];
        
        // If return_url is provided in the request, use it instead of the default
        if (isset($paymentData['return_url']) && !empty($paymentData['return_url'])) {
            $transactionData['transaction']['return_url'] = $paymentData['return_url'];
        }
        
        // If cancel_url is provided in the request, use it instead of the default
        if (isset($paymentData['cancel_url']) && !empty($paymentData['cancel_url'])) {
            $transactionData['transaction']['cancel_url'] = $paymentData['cancel_url'];
        }
        
        // Add IP address if available
        if (isset($_SERVER['REMOTE_ADDR'])) {
            $transactionData['customer']['ip'] = $_SERVER['REMOTE_ADDR'];
        }
        
        // Create transaction
        $transaction = $this->maksekeskusClient->createTransaction($transactionData);
        
        // Extract payment URL based on the selected payment method
        $paymentUrl = null;
        $paymentMethod = $paymentData['paymentMethod'];
        
        // For test card, we need to handle it differently
        if ($paymentMethod === 'test_card') {
            $this->logger->info("Processing test_card payment method");
            // For test cards, we should have a direct URL in the transaction response
            if (isset($transaction->payment_url)) {
                $this->logger->info("Found direct payment_url for test_card", [
                    'payment_url' => $transaction->payment_url
                ]);
                $paymentUrl = $transaction->payment_url;
            } else {
                $this->logger->info("No direct payment_url found for test_card, checking redirect URL");
                // Fallback to redirect URL if available
                foreach ($transaction->payment_methods->other as $other) {
                    if ($other->name === 'redirect') {
                        $this->logger->info("Found redirect URL for test_card", [
                            'redirect_url' => $other->url
                        ]);
                        $paymentUrl = $other->url;
                        break;
                    }
                }
            }
        } else {
            $this->logger->info("Processing regular payment method: " . $paymentMethod);
            // Normal payment method processing
            // Check if we have banklinks in the response
            if (isset($transaction->payment_methods->banklinks) && is_array($transaction->payment_methods->banklinks)) {
                $this->logger->info("Checking banklinks for payment method", [
                    'available_banklinks' => json_encode(array_map(function($b) { return $b->name; }, $transaction->payment_methods->banklinks))
                ]);
                // Look for the selected bank in banklinks
                foreach ($transaction->payment_methods->banklinks as $banklink) {
                    if ($banklink->name === $paymentMethod) {
                        $this->logger->info("Found matching banklink", [
                            'bank' => $banklink->name,
                            'url' => $banklink->url
                        ]);
                        $paymentUrl = $banklink->url;
                        break;
                    }
                }
            }
            
            // If not found in banklinks, check cards section
            if (!$paymentUrl && isset($transaction->payment_methods->cards) && is_array($transaction->payment_methods->cards)) {
                $this->logger->info("Checking cards for payment method", [
                    'available_cards' => json_encode(array_map(function($c) { return $c->name; }, $transaction->payment_methods->cards))
                ]);
                foreach ($transaction->payment_methods->cards as $card) {
                    if ($card->name === $paymentMethod) {
                        $this->logger->info("Found matching card", [
                            'card' => $card->name,
                            'url' => $card->url
                        ]);
                        $paymentUrl = $card->url;
                        break;
                    }
                }
            }
            
            // If still not found, check other payment methods
            if (!$paymentUrl && isset($transaction->payment_methods->other) && is_array($transaction->payment_methods->other)) {
                $this->logger->info("Checking other payment methods", [
                    'available_methods' => json_encode(array_map(function($o) { return $o->name; }, $transaction->payment_methods->other))
                ]);
                foreach ($transaction->payment_methods->other as $other) {
                    if ($other->name === $paymentMethod) {
                        $this->logger->info("Found matching other payment method", [
                            'method' => $other->name,
                            'url' => $other->url
                        ]);
                        $paymentUrl = $other->url;
                        break;
                    }
                }
            }
            
            // Fallback to redirect URL if available
            if (!$paymentUrl && isset($transaction->payment_methods->other) && is_array($transaction->payment_methods->other)) {
                $this->logger->info("No specific payment method found, looking for redirect URL");
                foreach ($transaction->payment_methods->other as $other) {
                    if ($other->name === 'redirect') {
                        $this->logger->info("Found redirect URL as fallback", [
                            'url' => $other->url
                        ]);
                        $paymentUrl = $other->url;
                        break;
                    }
                }
            }
        }
        
        // If no payment URL was found, return an error
        if (!$paymentUrl) {
            $this->logger->error("No payment URL found for the selected payment method", [
                'payment_method' => $paymentMethod,
                'transaction_id' => $transaction->id ?? 'unknown'
            ]);
            throw new \Exception('Payment URL not found for the selected payment method: ' . $paymentMethod);
        }
        
        $this->logger->info("Payment URL extracted", [
            'payment_method' => $paymentMethod,
            'payment_url' => $paymentUrl
        ]);
        
        // Return the transaction ID and payment URL
        return [
            'transactionId' => $transaction->id,
            'paymentUrl' => $paymentUrl
        ];
    }
    
    /**
     * Process a payment notification
     * 
     * @param array $request Request data (typically $_REQUEST)
     * @return array Processing result
     */
    public function processNotification($request) {
        $this->logger->info("Processing payment notification", [
            'request' => json_encode($request)
        ]);
        
        // Verify the MAC signature
        if (!$this->maksekeskusClient->verifyMac($request)) {
            $this->logger->error("Invalid MAC signature");
            return [
                'success' => false,
                'message' => 'Invalid MAC signature'
            ];
        }
        
        // Extract payment data
        $paymentData = $this->maksekeskusClient->extractRequestData($request);
        if (!$paymentData) {
            $this->logger->error("Failed to extract payment data");
            return [
                'success' => false,
                'message' => 'Failed to extract payment data'
            ];
        }
        
        $this->logger->info("Payment data extracted", [
            'transaction' => $paymentData->transaction ?? null,
            'status' => $paymentData->status ?? null,
            'reference' => $paymentData->reference ?? null
        ]);
        
        // Only process completed payments
        if ($paymentData->status !== 'COMPLETED') {
            $this->logger->info("Payment not completed, status: " . ($paymentData->status ?? 'unknown'));
            return [
                'success' => false,
                'message' => 'Payment not completed',
                'status' => $paymentData->status ?? 'unknown'
            ];
        }
        
        // Extract transaction details
        $transactionId = $paymentData->transaction ?? null;
        $reference = $paymentData->reference ?? null;
        
        if (!$transactionId && !$reference) {
            $this->logger->error("Missing transaction ID and reference");
            return [
                'success' => false,
                'message' => 'Missing transaction ID and reference'
            ];
        }
        
        // Extract merchant data (customer and order details)
        $merchantData = null;
        if (isset($paymentData->merchant_data)) {
            try {
                $merchantData = json_decode($paymentData->merchant_data);
                $this->logger->info("Merchant data decoded successfully");
            } catch (\Exception $e) {
                $this->logger->exception($e, "Failed to decode merchant data");
                $merchantData = null;
            }
        }
        
        if (!$merchantData) {
            $this->logger->error("Missing or invalid merchant data");
            return [
                'success' => false,
                'message' => 'Missing or invalid merchant data'
            ];
        }
        
        // Check if order already exists
        $existingOrder = null;
        if ($reference) {
            $existingOrder = $this->orderRepository->getOrderByReference($reference);
            
            if ($existingOrder) {
                $this->logger->info("Order already exists", [
                    'order_id' => $existingOrder['id'],
                    'reference' => $reference
                ]);
                
                // Update existing order
                $this->orderRepository->updateOrderStatus($existingOrder['id'], 'PAID');
                
                // Create payment record
                $this->orderRepository->createPayment($existingOrder['id'], $paymentData);
                
                return [
                    'success' => true,
                    'message' => 'Order updated successfully',
                    'order_id' => $existingOrder['id']
                ];
            }
        }
        
        // Create new order
        $orderData = $this->prepareOrderData($merchantData, $paymentData);
        
        $newOrder = $this->orderRepository->createOrder($orderData);
        
        if (!$newOrder) {
            $this->logger->error("Failed to create order", [
                'order_data' => $orderData
            ]);
            return [
                'success' => false,
                'message' => 'Failed to create order'
            ];
        }
        
        $this->logger->info("Order created successfully", [
            'order_id' => $newOrder['id']
        ]);
        
        // Create order items
        if (isset($merchantData->items) && is_array($merchantData->items)) {
            $this->orderRepository->createOrderItems($newOrder['id'], $merchantData->items);
        }
        
        // Create payment record
        $this->orderRepository->createPayment($newOrder['id'], $paymentData);
        
        return [
            'success' => true,
            'message' => 'Order created successfully',
            'order_id' => $newOrder['id']
        ];
    }
    
    /**
     * Prepare order data from merchant data and payment data
     * 
     * @param object $merchantData Merchant data from payment
     * @param object $paymentData Payment data from Maksekeskus
     * @return array Order data for database
     */
    private function prepareOrderData($merchantData, $paymentData) {
        $orderData = [
            'customer_name' => $merchantData->customer_name ?? null,
            'customer_email' => $merchantData->customer_email ?? null,
            'customer_phone' => $merchantData->customer_phone ?? null,
            'shipping_address' => $merchantData->shipping_address ?? null,
            'shipping_city' => $merchantData->shipping_city ?? null,
            'shipping_postal_code' => $merchantData->shipping_postal_code ?? null,
            'shipping_country' => $merchantData->shipping_country ?? null,
            'total_amount' => (float)($paymentData->amount ?? 0),
            'currency' => $paymentData->currency ?? 'EUR',
            'status' => 'PAID',
            'reference' => $paymentData->reference ?? null,
            'omniva_parcel_machine_id' => $merchantData->omnivaParcelMachineId ?? null,
            'omniva_parcel_machine_name' => $merchantData->omnivaParcelMachineName ?? null
        ];
        
        // Ensure string types for fields that require it
        if (isset($orderData['omniva_parcel_machine_id'])) {
            $orderData['omniva_parcel_machine_id'] = (string)$orderData['omniva_parcel_machine_id'];
        }
        
        if (isset($orderData['customer_phone'])) {
            $orderData['customer_phone'] = (string)$orderData['customer_phone'];
        }
        
        if (isset($orderData['customer_email'])) {
            $orderData['customer_email'] = (string)$orderData['customer_email'];
        }
        
        $this->logger->info("Prepared order data", [
            'reference' => $orderData['reference']
        ]);
        
        return $orderData;
    }
}