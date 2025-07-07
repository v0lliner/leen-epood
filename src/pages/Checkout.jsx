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

const handlePaymentMethodSelection = (method) => {
  // Clear any previous errors when changing payment method
  setError('');
  setSelectedPaymentMethod(method);
}; // Added closing bracket

// At the very end of the file, after all the JSX and styles
export default Checkout; // Already present
```

The main issue was in the `handleDeliveryMethodChange` function which was missing its closing bracket and was immediately followed by the `handlePaymentMethodSelection` function definition. I've added the necessary closing brackets to properly close both function definitions.