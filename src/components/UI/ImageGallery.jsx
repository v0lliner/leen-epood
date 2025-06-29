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
    
    // Lock body scroll and position
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.overflow = 'hidden'
    document.body.style.width = '100%'
    document.body.dataset.scrollY = scrollY.toString()
  }

  const closeModal = () => {
    setIsModalOpen(false)
    
    // Restore body scroll and position
    const scrollY = parseInt(document.body.dataset.scrollY || '0')
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.overflow = ''
    document.body.style.width = ''
    delete document.body.dataset.scrollY
    
    // Restore scroll position
    window.scrollTo(0, scrollY)
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isModalOpen) {
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.overflow = ''
        document.body.style.width = ''
        delete document.body.dataset.scrollY
      }
    }
  }, [])

  const handleModalBackdropClick = (e) => {
    // Close modal when clicking on backdrop
    if (e.target === e.currentTarget) {
      closeModal()
    }
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
        <div className="modal-overlay" onClick={handleModalBackdropClick}>
          <div className="modal-container">
            {/* Close button */}
            <button 
              className="modal-close" 
              onClick={closeModal} 
              aria-label="Sulge"
            >
              ×
            </button>

            {/* Image container */}
            <div className="modal-image-container">
              <img 
                src={sortedImages[selectedIndex].image_url} 
                alt={`${productTitle} pilt ${selectedIndex + 1}`}
              />
            </div>

            {/* Navigation arrows - only show if more than 1 image */}
            {sortedImages.length > 1 && (
              <>
                <button 
                  className="modal-nav modal-prev" 
                  onClick={prevImage}
                  aria-label="Eelmine pilt"
                >
                  ‹
                </button>
                <button 
                  className="modal-nav modal-next" 
                  onClick={nextImage}
                  aria-label="Järgmine pilt"
                >
                  ›
                </button>
              </>
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

        /* MODAL STYLES - PROFESSIONAL IMPLEMENTATION */
        .modal-overlay {
          /* Fixed positioning - always centered on screen */
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          
          /* Maximum z-index to ensure nothing appears above */
          z-index: 2147483647;
          
          /* Dark backdrop */
          background-color: rgba(0, 0, 0, 0.95);
          
          /* Center content */
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Prevent any scrolling or movement */
          overflow: hidden;
          
          /* Cursor indicates clickable backdrop */
          cursor: pointer;
        }

        .modal-container {
          /* Container for modal content */
          position: relative;
          
          /* Size constraints - smaller than viewport */
          width: 85vw;
          height: 85vh;
          max-width: 1200px;
          max-height: 800px;
          
          /* Center the container */
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Remove cursor pointer from container */
          cursor: default;
        }

        .modal-image-container {
          /* Image container */
          position: relative;
          max-width: 100%;
          max-height: 100%;
          
          /* Center image within container */
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-image-container img {
          /* Image sizing - maintain aspect ratio, no cropping */
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          
          /* Visual enhancements */
          border-radius: 8px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
          
          /* Prevent image from being clickable */
          cursor: default;
          pointer-events: none;
        }

        /* CLOSE BUTTON - Top right of image */
        .modal-close {
          position: absolute;
          top: -30px;
          right: -30px;
          
          /* Styling */
          width: 80px;
          height: 80px;
          border-radius: 50%;
          border: none;
          
          /* Background with blur effect */
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          
          /* Text styling */
          color: #333;
          font-size: 3rem;
          font-weight: 300;
          line-height: 1;
          
          /* Layout */
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Interactions */
          cursor: pointer;
          transition: all 0.3s ease;
          
          /* Layering */
          z-index: 2147483648;
          
          /* Shadow */
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.4);
        }

        /* NAVIGATION ARROWS */
        .modal-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          
          /* Styling */
          width: 70px;
          height: 70px;
          border-radius: 50%;
          border: none;
          
          /* Background with blur effect */
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          
          /* Text styling */
          color: #333;
          font-size: 2.5rem;
          font-weight: 300;
          line-height: 1;
          
          /* Layout */
          display: flex;
          align-items: center;
          justify-content: center;
          
          /* Interactions */
          cursor: pointer;
          transition: all 0.3s ease;
          
          /* Layering */
          z-index: 2147483648;
          
          /* Shadow */
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .modal-nav:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .modal-prev {
          left: -100px;
        }

        .modal-next {
          right: -100px;
        }

        /* RESPONSIVE ADJUSTMENTS */
        @media (max-width: 768px) {
          /* Hide desktop gallery, show mobile carousel */
          .desktop-gallery {
            display: none;
          }

          .mobile-carousel {
            display: block;
          }
        }

        @media (max-width: 1400px) {
          .modal-container {
            width: 90vw;
            height: 90vh;
          }
          
          .modal-prev {
            left: -80px;
          }

          .modal-next {
            right: -80px;
          }
        }

        @media (max-width: 1200px) {
          .modal-container {
            width: 95vw;
            height: 95vh;
          }
          
          .modal-close {
            width: 70px;
            height: 70px;
            font-size: 2.5rem;
            top: -25px;
            right: -25px;
          }
          
          .modal-nav {
            width: 60px;
            height: 60px;
            font-size: 2rem;
          }
          
          .modal-prev {
            left: -60px;
          }

          .modal-next {
            right: -60px;
          }
        }

        @media (max-width: 900px) {
          .modal-container {
            width: 98vw;
            height: 98vh;
          }
          
          .modal-close {
            width: 60px;
            height: 60px;
            font-size: 2rem;
            top: -20px;
            right: -20px;
          }
          
          .modal-nav {
            width: 50px;
            height: 50px;
            font-size: 1.5rem;
          }
          
          .modal-prev {
            left: -40px;
          }

          .modal-next {
            right: -40px;
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
      `}</style>
    </>
  )
}

export default ImageGallery