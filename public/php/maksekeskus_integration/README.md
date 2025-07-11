# Maksekeskus Integration Module

This module implements payment processing using the Maksekeskus payment gateway.

## Files

- `process_payment.php`: Handles payment initialization and creates transactions
- `notification.php`: Processes payment notifications from Maksekeskus
- `success.php`: Handles successful payment redirects
- `cancel.php`: Handles cancelled payment redirects

## Configuration

The module requires the following environment variables:

```
MAKSEKESKUS_SHOP_ID=your_shop_id
MAKSEKESKUS_PUBLISHABLE_KEY=your_publishable_key
MAKSEKESKUS_SECRET_KEY=your_secret_key
MAKSEKESKUS_TEST_MODE=true|false
```

## Usage

The module is accessed through the main router at `/php/index.php`, which routes requests to the appropriate handler based on the path.

### Endpoints

- `/php/maksekeskus_integration/process_payment`: Process a new payment
- `/php/maksekeskus_integration/notification`: Handle payment notifications
- `/php/maksekeskus_integration/success`: Handle successful payments
- `/php/maksekeskus_integration/cancel`: Handle cancelled payments

### Example Request

```json
{
  "amount": "120.00",
  "reference": "leen-1234567890",
  "email": "customer@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+37255555555",
  "country": "Estonia",
  "paymentMethod": "swedbank",
  "items": [
    {
      "id": "product-123",
      "title": "Ceramic Vase",
      "price": "120.00",
      "quantity": 1
    }
  ],
  "deliveryMethod": "omniva",
  "omnivaParcelMachineId": "12345",
  "omnivaParcelMachineName": "Tallinn Kristiine",
  "notes": "Please handle with care",
  "customerName": "John Doe",
  "bankCountry": "ee"
}
```

### Example Response

```json
{
  "success": true,
  "paymentUrl": "https://payment.maksekeskus.ee/pay/1/link.html?shop=12345&transaction=abcdef123456"
}
```

## Error Handling

The module returns JSON responses with appropriate HTTP status codes:

- `200 OK`: Request processed successfully
- `400 Bad Request`: Invalid request data or signature
- `500 Internal Server Error`: Server-side error

Error responses include an `error` field with a description of the error.

## Dependencies

- Maksekeskus PHP SDK (located in `/public/php/maksekeskus/`)