import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { shippingSettingsService } from '../utils/supabase/shippingSettings';

/**
 * Custom hook to manage checkout form state and validation
 */
export const useCheckoutForm = (cartItems, cartTotal) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    // Contact info
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    companyName: '',
    
    // Shipping
    country: 'Estonia',
    shippingMethod: 'pickup', // 'pickup' or 'omniva'
    omnivaParcelMachineId: '',
    omnivaParcelMachineName: '',
    
    // Payment
    bankCountry: 'ee',
    paymentMethod: '',
    
    // Additional
    notes: '',
    termsAccepted: false
  });
  
  const [validationErrors, setValidationErrors] = useState({});
  const [omnivaShippingPrice, setOmnivaShippingPrice] = useState(0.1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch Omniva shipping price on mount
  useEffect(() => {
    const fetchShippingPrice = async () => {
      try {
        const { data, error } = await shippingSettingsService.getOmnivaShippingSettings();
        if (!error && data) {
          setOmnivaShippingPrice(parseFloat(data.price));
        }
      } catch (err) {
        console.error('Error fetching Omniva shipping price:', err);
      }
    };
    
    fetchShippingPrice();
  }, []);
  
  // Calculate shipping cost based on selected method
  const getShippingCost = () => {
    if (formData.shippingMethod === 'pickup') {
      return 0; // Free pickup
    } else if (formData.shippingMethod === 'omniva') {
      return omnivaShippingPrice;
    }
    return 0;
  };
  
  // Calculate total order amount
  const calculateTotal = () => {
    return cartTotal + getShippingCost();
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear validation error when field is changed
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };
  
  // Handle shipping method change
  const handleShippingMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      shippingMethod: method
    }));
    
    // Clear parcel machine selection if not using Omniva
    if (method !== 'omniva') {
      setFormData(prev => ({
        ...prev,
        omnivaParcelMachineId: '',
        omnivaParcelMachineName: ''
      }));
    }
  };
  
  // Handle parcel machine selection
  const handleParcelMachineSelect = (id, name) => {
    setFormData(prev => ({
      ...prev,
      omnivaParcelMachineId: id,
      omnivaParcelMachineName: name
    }));
    
    // Clear validation error
    if (validationErrors.omnivaParcelMachineId) {
      setValidationErrors(prev => ({
        ...prev,
        omnivaParcelMachineId: ''
      }));
    }
  };
  
  // Handle payment method selection
  const handlePaymentMethodChange = (method) => {
    setFormData(prev => ({
      ...prev,
      paymentMethod: method
    }));
    
    // Clear validation error
    if (validationErrors.paymentMethod) {
      setValidationErrors(prev => ({
        ...prev,
        paymentMethod: ''
      }));
    }
  };
  
  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    // Required fields validation
    if (!formData.email) errors.email = t('checkout.error.required_fields');
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errors.email = t('checkout.error.invalid_email');
    
    if (!formData.firstName) errors.firstName = t('checkout.error.required_fields');
    if (!formData.lastName) errors.lastName = t('checkout.error.required_fields');
    if (!formData.phone) errors.phone = t('checkout.error.required_fields');
    
    // Shipping method validation
    if (formData.shippingMethod === 'omniva' && !formData.omnivaParcelMachineId) {
      errors.omnivaParcelMachineId = t('checkout.shipping.omniva.required');
    }
    
    // Payment method validation
    if (!formData.paymentMethod) {
      errors.paymentMethod = t('checkout.payment.method_required');
    }
    
    // Terms acceptance validation
    if (!formData.termsAccepted) {
      errors.termsAccepted = t('checkout.terms.required');
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Prepare data for submission - placeholder for future implementation
  const getPayloadForSubmission = () => {
    return {
      // Basic order information
      amount: calculateTotal().toFixed(2),
      email: formData.email,
      firstName: formData.firstName,
      lastName: formData.lastName,
      phone: formData.phone,
      companyName: formData.companyName,
      country: formData.country,
      
      // Shipping information
      shippingMethod: formData.shippingMethod,
      omnivaParcelMachineId: formData.omnivaParcelMachineId,
      omnivaParcelMachineName: formData.omnivaParcelMachineName,
      shippingCost: getShippingCost(),
      
      // Payment information
      paymentMethod: formData.paymentMethod,
      
      // Additional information
      notes: formData.notes,
      
      // Cart items
      items: cartItems
    };
  };
  
  return {
    formData,
    setFormData,
    validationErrors,
    setValidationErrors,
    handleInputChange,
    handleShippingMethodChange,
    handleParcelMachineSelect,
    handlePaymentMethodChange,
    validateForm,
    getPayloadForSubmission,
    getShippingCost,
    calculateTotal,
    omnivaShippingPrice,
    isSubmitting,
    setIsSubmitting
  };
};