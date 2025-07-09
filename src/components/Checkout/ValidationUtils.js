/**
 * Centralized validation utilities for checkout forms
 */

/**
 * Validate contact information
 * @param {Object} contact - Contact information object
 * @returns {Object} Validation errors
 */
export const validateContact = (contact) => {
  const errors = {};
  
  if (!contact.firstName?.trim()) {
    errors.firstName = 'Nimi on kohustuslik';
  }
  
  if (!contact.email?.trim()) {
    errors.email = 'E-post on kohustuslik';
  } else if (!/\S+@\S+\.\S+/.test(contact.email)) {
    errors.email = 'Palun sisestage korrektne e-posti aadress';
  }
  
  if (!contact.phone?.trim()) {
    errors.phone = 'Telefon on kohustuslik';
  }
  
  return errors;
};

/**
 * Validate shipping information
 * @param {Object} shipping - Shipping information object
 * @param {string} deliveryMethod - Selected delivery method
 * @returns {Object} Validation errors
 */
export const validateShipping = (shipping, deliveryMethod) => {
  const errors = {};
  
  if (deliveryMethod === 'omniva') {
    if (!shipping.omnivaLocation) {
      errors.omnivaLocation = 'Palun valige pakiautomaat';
    }
  } else if (deliveryMethod === 'courier') {
    if (!shipping.street?.trim()) {
      errors.street = 'Aadress on kohustuslik';
    }
    
    if (!shipping.city?.trim()) {
      errors.city = 'Linn on kohustuslik';
    }
    
    if (!shipping.postalCode?.trim()) {
      errors.postalCode = 'Postiindeks on kohustuslik';
    }
  }
  
  return errors;
};

/**
 * Validate payment information
 * @param {Object} payment - Payment information object
 * @returns {Object} Validation errors
 */
export const validatePayment = (payment) => {
  const errors = {};
  
  if (!payment.method) {
    errors.method = 'Palun valige makseviis';
  }
  
  return errors;
};

/**
 * Validate terms agreement
 * @param {boolean} agreedToTerms - Whether user agreed to terms
 * @returns {Object} Validation errors
 */
export const validateTerms = (agreedToTerms) => {
  const errors = {};
  
  if (!agreedToTerms) {
    errors.terms = 'Müügitingimustega nõustumine on vajalik tellimuse vormistamiseks';
  }
  
  return errors;
};

/**
 * Validate entire checkout form
 * @param {Object} formData - Complete form data
 * @param {string} deliveryMethod - Selected delivery method
 * @param {boolean} agreedToTerms - Whether user agreed to terms
 * @returns {Object} All validation errors
 */
export const validateCheckoutForm = (formData, deliveryMethod, agreedToTerms) => {
  return {
    contact: validateContact(formData.contact),
    shipping: validateShipping(formData.shipping, deliveryMethod),
    payment: validatePayment(formData.payment),
    terms: validateTerms(agreedToTerms)
  };
};

/**
 * Check if any section has validation errors
 * @param {Object} errors - Validation errors object
 * @returns {boolean} True if there are any errors
 */
export const hasErrors = (errors) => {
  return Object.values(errors).some(section => 
    section && Object.keys(section).length > 0
  );
};