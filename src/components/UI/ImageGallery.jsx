import { useState } from 'react'

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

  const openModal = (index) => {
    setSelectedIndex(index)
    setIsModalOpen(true)
    // Prevent body scroll when modal is open
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

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') closeModal()
    if (e.key === 'ArrowRight') nextImage()
    if (e.key === 'ArrowLeft') prevImage()
  }

  const handleOverlayClick = (e) => {
    // Close modal when clicking on overlay (not on image)
    if (e.target === e.currentTarget) {
      closeModal()
    }
  }

  return (
    <>
      <div className="image-gallery">
        {/* Main Image */}
        <div className="main-image" onClick={() => openModal(0)}>
          <img 
            src={primaryImage.image_url} 
            alt={productTitle}
          />
        </div>

        {/* Thumbnail Grid */}
        {sortedImages.length > 1 && (
          <div className="thumbnails">
            {sortedImages.map((image, index) => (
              <div 
                key={image.id}
                className={`thumbnail ${index === 0 ? 'active' : ''}`}
                onClick={() => openModal(index)}
              >
                <img 
                  src={image.image_url} 
                  alt={`${productTitle} pilt ${index + 1}`}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={handleOverlayClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
            
            <div className="modal-image-container">
              <img 
                src={sortedImages[selectedIndex].image_url} 
                alt={`${productTitle} pilt ${selectedIndex + 1}`}
                onClick={(e) => e.stopPropagation()}
              />
            </div>

            {sortedImages.length > 1 && (
              <>
                <button className="modal-nav modal-prev" onClick={prevImage}>
                  ‹
                </button>
                <button className="modal-nav modal-next" onClick={nextImage}>
                  ›
                </button>
                
                <div className="modal-thumbnails">
                  {sortedImages.map((image, index) => (
                    <div 
                      key={image.id}
                      className={`modal-thumbnail ${index === selectedIndex ? 'active' : ''}`}
                      onClick={() => setSelectedIndex(index)}
                    >
                      <img 
                        src={image.image_url} 
                        alt={`${productTitle} pilt ${index + 1}`}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .image-gallery {
          width: 100%;
        }

        .main-image {
          position: relative;
          width: 100%;
          aspect-ratio: 4/3;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          margin-bottom: 16px;
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

        .thumbnails {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 8px;
          max-width: 300px;
        }

        .thumbnail {
          aspect-ratio: 1;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s ease;
        }

        .thumbnail:hover,
        .thumbnail.active {
          border-color: var(--color-ultramarine);
        }

        .thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.95);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          cursor: pointer;
        }

        .modal-content {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          cursor: default;
        }

        .modal-close {
          position: absolute;
          top: -50px;
          right: 0;
          background: none;
          border: none;
          color: white;
          font-size: 2rem;
          cursor: pointer;
          z-index: 10001;
          padding: 8px;
          line-height: 1;
          transition: opacity 0.2s ease;
        }

        .modal-close:hover {
          opacity: 0.7;
        }

        .modal-image-container {
          max-width: 80vw;
          max-height: 70vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 4px;
          cursor: default;
        }

        .modal-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          font-size: 2rem;
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 4px;
          transition: background-color 0.2s ease;
          z-index: 10000;
        }

        .modal-nav:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .modal-prev {
          left: 20px;
        }

        .modal-next {
          right: 20px;
        }

        .modal-thumbnails {
          display: flex;
          gap: 8px;
          margin-top: 20px;
          max-width: 80vw;
          overflow-x: auto;
          padding: 8px;
        }

        .modal-thumbnail {
          width: 60px;
          height: 60px;
          border-radius: 4px;
          overflow: hidden;
          cursor: pointer;
          border: 2px solid transparent;
          transition: border-color 0.2s ease;
          flex-shrink: 0;
        }

        .modal-thumbnail:hover,
        .modal-thumbnail.active {
          border-color: white;
        }

        .modal-thumbnail img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        @media (max-width: 768px) {
          .thumbnails {
            grid-template-columns: repeat(auto-fit, minmax(60px, 1fr));
            gap: 6px;
          }

          .modal-nav {
            font-size: 1.5rem;
            padding: 8px 12px;
          }

          .modal-prev {
            left: 10px;
          }

          .modal-next {
            right: 10px;
          }

          .modal-thumbnails {
            margin-top: 16px;
          }

          .modal-thumbnail {
            width: 50px;
            height: 50px;
          }

          .modal-close {
            top: -40px;
            font-size: 1.5rem;
          }

          .modal-overlay {
            padding: 10px;
          }
        }
      `}</style>
    </>
  )
}

export default ImageGallery