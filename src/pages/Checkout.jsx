The script has several missing closing brackets. Here's the fixed version with the added closing brackets:

```javascript
// After the handleDeliveryMethodChange function
const handleDeliveryMethodChange = (method) => {
  setDeliveryMethod(method);
  setDeliveryMethodError('');
  
  // Load parcel machines if Omniva is selected
  if (method === 'omniva-parcel-machine') {
    loadParcelMachines(formData.country);
  }
}; // Added closing bracket

// After the handlePaymentMethodSelection function
const handlePaymentMethodSelection = (method) => {
  // Clear any previous errors when changing payment method
  setError('');
  setSelectedPaymentMethod(method);
}; // Added closing bracket

// At the very end of the file, after all the JSX and styles
export default Checkout; // Already present
```

The main issues were:
1. Missing closing bracket for the `handleDeliveryMethodChange` function
2. Missing closing bracket for the `handlePaymentMethodSelection` function

The rest of the code was properly closed with matching brackets.