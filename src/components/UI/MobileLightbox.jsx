import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const MobileLightbox = ({ image, onClose }) => {
  // Prevent body scrolling when lightbox is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  // Handle swipe to close
  const handleTouchStart = (e) => {
    const touchY = e.touches[0].clientY;
    const touchThreshold = window.innerHeight * 0.2; // 20% of screen height
    
    const handleTouchMove = (e) => {
      const currentY = e.touches[0].clientY;
      const deltaY = currentY - touchY;
      
      if (deltaY > touchThreshold) {
        cleanup();
        onClose();
      }
    };
    
    const handleTouchEnd = () => {
      cleanup();
    };
    
    const cleanup = () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };

  return createPortal(
    <div className="mobile-lightbox" onClick={onClose}>
      <div 
        className="lightbox-content" 
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
      >
        <img src={image} alt="Product full view" />
        <button className="close-button" onClick={onClose}>×</button>
        <div className="swipe-indicator">
          <span>Swipe down to close</span>
        </div>
      </div>

      <style jsx>{`
        .mobile-lightbox {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.9);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fade-in 0.3s ease;
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .lightbox-content {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .lightbox-content img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          padding: 20px;
          border-radius: 4px;
        }

        .close-button {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: rgba(255, 255, 255, 0.3);
          color: white;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }

        .close-button:hover {
          background-color: rgba(255, 255, 255, 0.5);
        }

        .swipe-indicator {
          position: absolute;
          bottom: 30px;
          left: 0;
          right: 0;
          text-align: center;
          color: rgba(255, 255, 255, 0.7);
          font-size: 14px;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>,
    document.body
  );
};

export default MobileLightbox;