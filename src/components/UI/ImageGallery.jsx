import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import MobileLightbox from './MobileLightbox'

const ImageGallery = ({ images = [], productTitle = '' }) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [touchStart, setTouchStart] = useState(null)
  const [touchEnd, setTouchEnd] = useState(null)
  const [mobileLightboxOpen, setMobileLightboxOpen] = useState(false)
  const carouselRef = useRef(null)

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
    
    // Lock body scroll
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    
    // Restore body scroll
    document.body.style.overflow = 'unset'
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
        document.body.style.overflow = 'unset'
      }
    }
  }, [])

  // Open mobile lightbox
  const openMobileLightbox = () => {
    if (isMobile()) {
      setMobileLightboxOpen(true)
    }
  }

  // Touch swipe handling for mobile carousel
  const minSwipeDistance = 50

  const onTouchStart = (e) => {
    setTouchEnd(null) // Reset touchEnd
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance
    
    if (isLeftSwipe) {
      nextCarouselImage()
    }
    
    if (isRightSwipe) {
      prevCarouselImage()
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

  // **MODAL COMPONENT - ERALDI KOMPONENT PORTALI JAOKS**
  const Modal = () => (
    <div className="modal-portal">
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-container">
          {/* Close button */}
          <button 
            className="modal-close" 
            onClick={(e) => {
              e.stopPropagation();
              closeModal();
            }} 
            aria-label="Sulge"
          >
            ×
          </button>

          {/* Image */}
          <div className="modal-image-wrapper">
            <img 
              src={sortedImages[selectedIndex].image_url} 
              alt={`${productTitle} pilt ${selectedIndex + 1}`}
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Navigation arrows - only show if more than 1 image */}
          {sortedImages.length > 1 && (
            <>
              <button 
                className="modal-nav modal-prev" 
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                aria-label="Eelmine pilt"
              >
                ‹
              </button>
              <button 
                className="modal-nav modal-next" 
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                aria-label="Järgmine pilt"
              >
                ›
              </button>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .modal-portal {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          z-index: 9999;
        }

        .modal-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .modal-container {
          position: relative;
          width: 90vw;
          height: 90vh;
          max-width: 1200px;
          max-height: 800px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
        }

        .modal-image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-image-wrapper img {
          max-width: 100%;
          max-height: 100%;
          width: auto;
          height: auto;
          object-fit: contain;
          border-radius: 8px;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.8);
        }

        .modal-close {
          position: absolute;
          top: -60px;
          right: -60px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.95);
          color: #333;
          font-size: 2rem;
          font-weight: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10001;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4);
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
        }

        .modal-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: none;
          background: rgba(255, 255, 255, 0.9);
          color: #333;
          font-size: 1.5rem;
          font-weight: 300;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s ease;
          z-index: 10001;
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        .modal-nav:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-50%) scale(1.1);
        }

        .modal-prev {
          left: -80px;
        }

        .modal-next {
          right: -80px;
        }

        @media (max-width: 1200px) {
          .modal-container {
            width: 95vw;
            height: 95vh;
          }
          
          .modal-close {
            top: -50px;
            right: -50px;
            width: 50px;
            height: 50px;
            font-size: 1.8rem;
          }
          
          .modal-prev {
            left: -60px;
          }

          .modal-next {
            right: -60px;
          }
        }

        @media (max-width: 1000px) {
          .modal-container {
            width: 98vw;
            height: 98vh;
          }
          
          .modal-close {
            top: -40px;
            right: -40px;
            width: 45px;
            height: 45px;
            font-size: 1.6rem;
          }
          
          .modal-prev {
            left: -50px;
          }

          .modal-next {
            right: -50px;
          }
        }
      `}</style>
    </div>
  )

  return (
    <>
      <div className="image-gallery">
        {/* Desktop Gallery - Default */}
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

          {/* Additional Images */}
          {additionalImages.length > 0 && (
            <div className="additional-images">
              {additionalImages.map((image, index) => (
                <div 
                  key={image.id}
                  className="additional-image clickable"
                  onClick={() => openModal(index + 1)}
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
          <div 
            className="carousel-container"
            ref={carouselRef}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <div 
              className="carousel-track"
              style={{ transform: `translateX(-${selectedIndex * 100}%)` }}
            >
              {sortedImages.map((image, index) => (
                <div 
                  key={image.id} 
                  className="carousel-slide"
                  onClick={openMobileLightbox}
                >
                  <img 
                    src={image.image_url} 
                    alt={`${productTitle} pilt ${index + 1}`}
                  />
                </div>
              ))}
            </div>

            {/* Navigation arrows */}
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

          {/* Dots indicator */}
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

      {/* **PORTAL MODAL - AVANEB VÄLJASPOOL E-POOD KOMPONENTI** */}
      {isModalOpen && !isMobile() && createPortal(
        <Modal />,
        document.body
      )}

      {/* Mobile Lightbox */}
      {mobileLightboxOpen && (
        <MobileLightbox 
          image={sortedImages[selectedIndex].image_url}
          onClose={() => setMobileLightboxOpen(false)}
        />
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
          touch-action: pan-y;
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
          cursor: pointer;
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

        @media (max-width: 768px) {
          /* Hide desktop gallery, show mobile carousel */
          .desktop-gallery {
            display: none;
          }

          .mobile-carousel {
            display: block;
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