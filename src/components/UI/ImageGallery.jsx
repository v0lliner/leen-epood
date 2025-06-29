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

  // Get additional images (excluding primary)
  const additionalImages = sortedImages.filter(img => !img.is_primary)

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

  const handleModalClick = (e) => {
    // Close modal when clicking anywhere in the modal
    closeModal()
  }

  const handleImageClick = (e) => {
    // Prevent modal from closing when clicking on the image itself
    e.stopPropagation()
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

        {/* Additional Images - Below main image, same width */}
        {additionalImages.length > 0 && (
          <div className="additional-images">
            {additionalImages.map((image, index) => (
              <div 
                key={image.id}
                className="additional-image"
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

      {/* Modal */}
      {isModalOpen && (
        <div 
          className="modal-overlay" 
          onClick={handleModalClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <div className="modal-image-container">
            <img 
              src={sortedImages[selectedIndex].image_url} 
              alt={`${productTitle} pilt ${selectedIndex + 1}`}
              onClick={handleImageClick}
            />
            
            {/* Close button positioned at top-right of image */}
            <button className="modal-close" onClick={closeModal}>
              ×
            </button>
          </div>

          {sortedImages.length > 1 && (
            <>
              <button className="modal-nav modal-prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                ‹
              </button>
              <button className="modal-nav modal-next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                ›
              </button>
              
              <div className="modal-thumbnails" onClick={handleImageClick}>
                {sortedImages.map((image, index) => (
                  <div 
                    key={image.id}
                    className={`modal-thumbnail ${index === selectedIndex ? 'active' : ''}`}
                    onClick={(e) => { e.stopPropagation(); setSelectedIndex(index); }}
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
          cursor: pointer;
          transition: transform 0.2s ease;
        }

        .additional-image:hover {
          transform: scale(1.02);
        }

        .additional-image img {
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
          z-index: 99999; /* Very high z-index to ensure it's on top */
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          cursor: pointer;
          background-color: rgba(0, 0, 0, 0.95); /* Darker background */
        }

        .modal-image-container {
          position: relative;
          max-width: 90vw;
          max-height: 90vh;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: default;
          z-index: 100000; /* Even higher for the image container */
        }

        .modal-image-container img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          border-radius: 4px;
          cursor: default;
        }

        .modal-close {
          position: absolute;
          top: -20px;
          right: -20px;
          background: rgba(255, 255, 255, 0.95);
          border: none;
          color: #333;
          font-size: 3rem;
          cursor: pointer;
          z-index: 100001; /* Highest z-index for close button */
          padding: 12px 16px;
          line-height: 1;
          transition: all 0.2s ease;
          border-radius: 50%;
          width: 72px;
          height: 72px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .modal-close:hover {
          background: rgba(255, 255, 255, 1);
          transform: scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .modal-nav {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255, 255, 255, 0.9);
          border: none;
          color: #333;
          font-size: 2rem;
          padding: 12px 16px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.2s ease;
          z-index: 100000;
        }

        .modal-nav:hover {
          background: rgba(255, 255, 255, 1);
          transform: translateY(-50%) scale(1.1);
        }

        .modal-prev {
          left: 20px;
        }

        .modal-next {
          right: 20px;
        }

        .modal-thumbnails {
          position: absolute;
          bottom: 20px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 8px;
          max-width: 80vw;
          overflow-x: auto;
          padding: 8px;
          cursor: default;
          z-index: 100000;
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
          .additional-images {
            grid-template-columns: repeat(2, 1fr);
            gap: 6px;
          }

          .modal-close {
            top: -15px;
            right: -15px;
            font-size: 2.5rem;
            width: 60px;
            height: 60px;
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
            bottom: 10px;
          }

          .modal-thumbnail {
            width: 50px;
            height: 50px;
          }
        }

        @media (max-width: 480px) {
          .additional-images {
            grid-template-columns: 1fr;
            gap: 8px;
          }
        }
      `}</style>
    </>
  )
}

export default ImageGallery