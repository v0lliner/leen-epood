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
        color: '#32325d',
        fontFamily: 'var(--font-body), sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
      invalid: {
        color: '#fa755a',
        iconColor: '#fa755a',
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
        }
        
        .card-element-wrapper:focus-within {
          border-color: var(--color-ultramarine);
        }
      `}</style>
    </div>
  );
};

export default StripeCardElement;