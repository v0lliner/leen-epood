import { CardElement } from '@stripe/react-stripe-js';

const StripeCardElement = ({ onChange }) => {
  const handleChange = (event) => {
    if (onChange) {
      onChange(event);
    }
  };

  const cardElementOptions = {
    style: {
      base: {
        color: 'var(--color-text)',
        fontFamily: 'var(--font-body), sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#dc3545',
        iconColor: '#dc3545',
      },
    },
    hidePostalCode: true,
  };

  return (
    <div className="card-element-wrapper">
      <CardElement 
        id="card-element"
        options={cardElementOptions} 
        onChange={handleChange}
      />
      
      <style jsx>{`
        .card-element-wrapper {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          background-color: white;
          transition: border-color 0.2s ease;
          min-height: 24px;
        }
        
        .card-element-wrapper:focus-within {
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 3px rgba(47, 62, 156, 0.1);
        }
      `}</style>
    </div>
  );
};

export default StripeCardElement;