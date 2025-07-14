import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  PaymentElement, 
  useStripe, 
  useElements,
  LinkAuthenticationElement,
  AddressElement
} from '@stripe/react-stripe-js';

const StripePaymentForm = ({ 
  clientSecret, 
  onPaymentSuccess, 
  onPaymentError,
  customerEmail
}) => {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [email, setEmail] = useState(customerEmail || '');
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe) {
      return;
    }

    if (!clientSecret) {
      return;
    }

    // Check the payment intent status on component mount
    stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
      switch (paymentIntent.status) {
        case "succeeded":
          setMessage("Makse õnnestus!");
          onPaymentSuccess && onPaymentSuccess(paymentIntent);
          break;
        case "processing":
          setMessage("Makse töötlemine...");
          break;
        case "requires_payment_method":
          setMessage("Valige makseviis");
          break;
        default:
          setMessage("Midagi läks valesti.");
          break;
      }
    });
  }, [stripe, clientSecret, onPaymentSuccess]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      // Stripe.js hasn't yet loaded.
      return;
    }

    setIsLoading(true);

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/makse/korras`,
        receipt_email: email,
      },
    });

    // This point will only be reached if there is an immediate error when
    // confirming the payment. Otherwise, your customer will be redirected to
    // your `return_url`.
    if (error.type === "card_error" || error.type === "validation_error") {
      setMessage(error.message);
      onPaymentError && onPaymentError(error);
    } else {
      setMessage("Tekkis ootamatu viga.");
      onPaymentError && onPaymentError(error);
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs",
    defaultValues: {
      billingDetails: {
        email: email,
      }
    }
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit}>
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      <button 
        disabled={isLoading || !stripe || !elements} 
        id="submit"
        className="checkout-button"
      >
        <span id="button-text">
          {isLoading ? <div className="spinner" id="spinner"></div> : t('checkout.form.pay')}
        </span>
      </button>
      
      {message && <div id="payment-message">{message}</div>}
      
      <style jsx>{`
        #payment-form {
          width: 100%;
          margin: 0 auto;
        }
        
        .checkout-button {
          width: 100%;
          padding: 16px;
          margin-top: 24px;
          background-color: var(--color-ultramarine);
          color: white;
          border: none;
          border-radius: 4px;
          font-family: var(--font-heading);
          font-weight: 600;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s ease;
        }
        
        .checkout-button:hover:not(:disabled) {
          opacity: 0.9;
        }
        
        .checkout-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        #payment-message {
          color: rgb(105, 115, 134);
          font-size: 16px;
          line-height: 20px;
          padding-top: 12px;
          text-align: center;
        }
        
        #payment-element {
          margin-bottom: 24px;
        }
        
        /* spinner/processing state, errors */
        .spinner,
        .spinner:before,
        .spinner:after {
          border-radius: 50%;
        }
        
        .spinner {
          color: #ffffff;
          font-size: 22px;
          text-indent: -99999px;
          margin: 0px auto;
          position: relative;
          width: 20px;
          height: 20px;
          box-shadow: inset 0 0 0 2px;
          -webkit-transform: translateZ(0);
          -ms-transform: translateZ(0);
          transform: translateZ(0);
        }
        
        .spinner:before,
        .spinner:after {
          position: absolute;
          content: '';
        }
        
        .spinner:before {
          width: 10.4px;
          height: 20.4px;
          background: var(--color-ultramarine);
          border-radius: 20.4px 0 0 20.4px;
          top: -0.2px;
          left: -0.2px;
          -webkit-transform-origin: 10.4px 10.2px;
          transform-origin: 10.4px 10.2px;
          -webkit-animation: loading 2s infinite ease 1.5s;
          animation: loading 2s infinite ease 1.5s;
        }
        
        .spinner:after {
          width: 10.4px;
          height: 10.2px;
          background: var(--color-ultramarine);
          border-radius: 0 10.2px 10.2px 0;
          top: -0.1px;
          left: 10.2px;
          -webkit-transform-origin: 0px 10.2px;
          transform-origin: 0px 10.2px;
          -webkit-animation: loading 2s infinite ease;
          animation: loading 2s infinite ease;
        }
        
        @keyframes loading {
          0% {
            -webkit-transform: rotate(0deg);
            transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
            transform: rotate(360deg);
          }
        }
      `}</style>
    </form>
  );
};

export default StripePaymentForm;