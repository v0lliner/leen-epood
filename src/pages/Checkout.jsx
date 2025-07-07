The script has several missing closing brackets. Here's the fixed version with the added closing brackets:

```javascript
// After the handleDeliveryMethodChange function
const handleDeliveryMethodChange = (method) => {
  setDeliveryMethod(method);
  setDeliveryMethodError('');
  
  // Load parcel machines if Omniva is selected
  if (method === 'omniva-parcel-machine') {
    loadParcelMachines(selectedCountry);
  }
}; // Added closing bracket

// After the handlePaymentMethodSelection function
const handlePaymentMethodSelection = (method) => {
  // Clear any previous errors when changing payment method
  setError('');
  setSelectedPaymentMethod(method);
}; // Added closing bracket

// After the loadParcelMachines function
const loadParcelMachines = async (country) => {
  setLoadingParcelMachines(true);
  setParcelMachineError('');
  
  try {
    // Convert country name to country code
    const countryCode = getCountryCode(country);
    
    // Fetch parcel machines from API
    const response = await fetch(`/php/get-omniva-parcel-machines.php?country=${countryCode}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.success && data.parcelMachines) {
      setParcelMachines(data.parcelMachines);
    } else {
      setParcelMachineError('Pakiautomaatide laadimine ebaõnnestus');
      setParcelMachines([]);
    }
  } catch (err) {
    console.error('Error loading parcel machines:', err);
    setParcelMachineError('Pakiautomaatide laadimine ebaõnnestus');
    setParcelMachines([]);
  } finally {
    setLoadingParcelMachines(false);
  }
}; // Added closing bracket
```

The rest of the code appears to be properly closed. These were the main missing closing brackets that needed to be added.