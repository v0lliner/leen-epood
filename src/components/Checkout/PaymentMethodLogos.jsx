import React from 'react';

/**
 * Component to display payment method logos in the footer or other informational areas
 */
const PaymentMethodLogos = () => {
  // Common Estonian payment methods
  const paymentMethods = [
    { name: 'Swedbank', channel: 'swedbank' },
    { name: 'SEB', channel: 'seb' },
    { name: 'LHV', channel: 'lhv' },
    { name: 'Coop Pank', channel: 'coop' },
    { name: 'Luminor', channel: 'luminor' }
  ];

  return (
    <div className="payment-logos">
      <div className="logos-container">
        {paymentMethods.map(method => (
          <div key={method.channel} className="logo-item">
            <img 
              src={`https://static.maksekeskus.ee/img/channel/lnd/${method.channel}.png`} 
              alt={method.name}
              title={method.name}
            />
          </div>
        ))}
      </div>

      <style jsx>{`
        .payment-logos {
          margin: 24px 0;
        }

        .logos-container {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          justify-content: center;
          align-items: center;
        }

        .logo-item {
          height: 32px;
          display: flex;
          align-items: center;
        }

        .logo-item img {
          height: 100%;
          width: auto;
          object-fit: contain;
          filter: grayscale(100%);
          opacity: 0.7;
          transition: all 0.2s ease;
        }

        .logo-item:hover img {
          filter: grayscale(0%);
          opacity: 1;
        }

        @media (max-width: 768px) {
          .logo-item {
            height: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default PaymentMethodLogos;