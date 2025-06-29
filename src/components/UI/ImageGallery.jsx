import { useState, useEffect } from 'react'

const ImageGallery = ({ images = [], productTitle = '' }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  if (!images || images.length === 0) {
    return null
  }

  const primaryImage = images.find(img => img.is_primary) || images[0]
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_primary) return -1
    if (b.is_primary) return 1
    return a.display_order - b.display_order
  })

  // Get additional images (excluding primary)
  const additionalImages = sortedImages.filter(img => !img.is_primary)

  // Check if we're on mobile
  const isMobile = () => window.innerWidth <= 768

  const openModal = (index) => {
    // Don't open modal on mobile
    if (isMobile()) return
    
    setSelectedIndex(index)
    setIsModalOpen(true)
    
    // Prevent body scroll and ensure modal is always centered
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = '0'
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.bottom = '0'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    
    // Restore body scroll and positioning
    document.body.style.overflow = 'unset'
    document.body.style.position = 'unset'
    document.body.style.top = 'unset'
    document.body.style.left = 'unset'
    document.body.style.right = 'unset'
    document.body.style.bottom = 'unset'
  }

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % sortedImages.length)
  }

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
  }

  // Handle keyboard events
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return
      
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowRight') nextImage()
      if (e.key === 'ArrowLeft') prevImage()
    }

    if (isModalOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen])

  // Handle window resize to close modal on mobile
  useEffect(() => {
    const handleResize = () => {
      if (isModalOpen && isMobile()) {
        closeModal()
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [isModalOpen])

  const handleModalClick = (e) => {
    // Close modal when clicking anywhere in the modal background
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  const handleImageClick = (e) => {
    // Prevent modal from closing when clicking on the image itself
    e.stopPropagation()
  }

  // Mobile carousel navigation
  const nextCarouselImage = () => {
    setSelectedIndex((prev) => (prev + 1) % sortedImages.length)
  }

  const prevCarouselImage = () => {
    setSelectedIndex((prev) => (prev - 1 + sortedImages.length) % sortedImages.length)
  }

  const goToSlide = (index) => {
    setSelectedIndex(index)
  }

  return (
    <>
      <div className="image-gallery">
        {/* Desktop Layout */}
        <div className="desktop-gallery">
          {/* Main Image */}
          <div 
            className="main-image clickable"
            onClick={() => openModal(0)}
          >
            <img 
              src={primaryImage.image_url} 
              alt={productTitle}
            />
          </div>

          {/* Additional Images - Below main image, same width */}
          {additionalImages.length > 0 && (
            <div className="additional-images">
              {additionalImages.map((image, index) => (
                <div 
                  key={image.id}
                  className="additional-image clickable"
                  onClick={() => openModal(index + 1)} // +1 because primary is at index 0
                >
                  <img 
                    src={image.image_url} 
                    alt={`${productTitle} pilt ${index + 2}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Mobile Carousel */}
        <div className="mobile-carousel">
          <div className="carousel-container">
            <div 
              className="carousel-track"
              style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
            >
              {sortedImages.map((image, index) => (
                <div key={image.id} className="carousel-slide">
                  <img 
                    src={image.image_url} 
                    alt={`${productTitle} pilt ${index + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* Navigation arrows - only show if more than 1 image */}
            {sortedImages.length > 1 && (
              <>
                <button 
                  className="carousel-nav carousel-prev"
                  onClick={prevCarouselImage}
                  aria-label="Eelmine pilt"
                >
                  ‹
                </button>
                <button 
                  className="carousel-nav carousel-next"
                  onClick={nextCarouselImage}
                  aria-label="Järgmine pilt"
                >
                  ›
                </button>
              </>
            )}
          </div>

          {/* Dots indicator - only show if more than 1 image */}
          {sortedImages.length > 1 && (
            <div className="carousel-dots">
              {sortedImages.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-dot ${index === selectedIndex ? 'active' : ''}`}
                  onClick={() => goToSlide(index)}
                  aria-label={`Mine pildile ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal - Only on desktop */}
      {isModalOpen && !isMobile() && (
        <div 
          className="modal-overlay" 
          onClick={handleModalClick}
          tabIndex={0}
        >
          <div className="modal-content">
            <div className="modal-image-container">
              <img 
                src={sortedImages[selectedIndex].image_url} 
                alt={`${productTitle} pilt ${selectedIndex + 1}`}
                onClick={handleImageClick}
              />
            </div>
            
            {/* Close button */}
            <button className="modal-close" onClick={closeModal} aria-label="Sulge">
              ×
            </button>

            {/* Navigation arrows */}
            {sortedImages.length > 1 && (
              <>
                <button 
                  className="modal-nav modal-prev" 
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  aria-label="Eelmine pilt"
                >
                  ‹
                </button>
                <button 
                  className="modal-nav modal-next" 
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  aria-label="Järgmine pilt"
                >
                  ›
                </button>
              </>
            )}

            {/* Image counter */}
            {sortedImages.length > 1 && (
              <div className="modal-counter">
                {selectedIndex + 1} / {sortedImages.length}
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .image-gallery {
          width: 100%;
        }

        /* Desktop Gallery - Default */
        .desktop-gallery {
          display: block;
        }

        .mobile-carousel {
          display: none;
        }

        .main-image {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 16px;
          cursor: pointer;
        }

        .main-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .main-image:hover img {
          transform: scale(1.05);
        }

        .additional-images {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          width: 100%;
        }

        .additional-image {
          aspect-ratio: 4/3;
          border-radius: 4px;
          overflow: hidden;
          transition: transform 0.2s ease;
          cursor: pointer;
        }

        .additional-image:hover {
          transform: scale(1.02);
        }

        .additional-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Mobile Carousel Styles */
        .carousel-container {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          overflow: hidden;
          border-radius: 4px;
          background: #f5f5f5;
        }

        .carousel-track {
          display: flex;
          width: 100%;
          height: 100%;
          transition: transform 0.3s ease;
        }

        .carousel-slide {
          flex: 0 0 100%;
          width: 100%;
          height: 100%;
        }

        .carousel-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .carousel-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          color: #333;
          font-size: 1.5rem;
          padding: 8px 12px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          z-index: 10;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .carousel-nav:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-50%) scale(1.1);
        }

        .carousel-prev {
          left: 12px;
        }

        .carousel-next {
          right: 12px;
        }

        .carousel-dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }

        .carousel-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: none;
          background: #ddd;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .carousel-dot.active {
          background: var(--color-ultramarine);
          transform: scale(1.2);
        }

        .carousel-dot:hover {
          background: var(--color-ultramarine);
          opacity: 0.7;
        }

        /* Modal Styles - HIGHEST Z-INDEX */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 999999;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          padding: 0;
          margin: 0;
        }

        .modal-content {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          max-width: 100vw;
          max-height: 100vh;
          cursor: default;
        }

        .modal-image-container {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000000;
        }

        .modal-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 4px;
          cursor: default;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }

        .modal-close {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          color: #333;
          font-size: 2.5rem;
          cursor: pointer;
          z-index: 1000001;
          padding: 8px 12px;
          line-height: 1;
          transition: all 0.2s ease;
          border-radius: 50%;
          width: 60px;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          font-weight: 300;
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .modal-nav {
          position: fixed;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          color: #333;
          font-size: 2rem;
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
          z-index: 1000001;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
          font-weight: 300;
        }

        .modal-nav:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
        }

        .modal-prev {
          left: 20px;
        }

        .modal-next {
          right: 20px;
        }

        .modal-counter {
          position: fixed;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.9rem;
          font-weight: 500;
          z-index: 1000001;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          /* Hide desktop gallery, show mobile carousel */
          .desktop-gallery {
            display: none;
          }

          .mobile-carousel {
            display: block;
          }

          /* Adjust additional images grid for smaller screens when desktop is shown */
          .additional-images {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }
        }

        @media (max-width: 480px) {
          .carousel-nav {
            font-size: 1.2rem;
            padding: 6px 10px;
          }

          .carousel-prev {
            left: 8px;
          }

          .carousel-next {
            right: 8px;
          }

          .carousel-dots {
            gap: 6px;
            margin-top: 12px;
          }

          .carousel-dot {
            width: 10px;
            height: 10px;
          }
        }

        /* Ensure modal is always on top of everything */
        @media (min-width: 769px) {
          .modal-overlay {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            z-index: 999999 !important;
          }
        }
      `}</style>
    </>
  )
}

export default ImageGallery