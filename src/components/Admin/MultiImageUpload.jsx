import { useState, useRef } from 'react'
import { storageService } from '../../utils/supabase/storage'
import { productImageService } from '../../utils/supabase/productImages'

const MultiImageUpload = ({ 
  productId,
  images = [],
  onImagesChange,
  maxImages = 4,
  className = ''
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [draggedIndex, setDraggedIndex] = useState(null)
  const fileInputRef = useRef(null)

  const handleFileSelect = async (files) => {
    setError('')
    
    const fileArray = Array.from(files)
    const remainingSlots = maxImages - images.length
    
    if (fileArray.length > remainingSlots) {
      setError(`Saate lisada veel ainult ${remainingSlots} pilti`)
      return
    }

    setUploading(true)

    try {
      const uploadPromises = fileArray.map(async (file, index) => {
        // Validate file
        const validation = storageService.validateImage(file)
        if (!validation.valid) {
          throw new Error(validation.error)
        }

        const { data, error } = await storageService.uploadImage(file, 'products')
        if (error) throw new Error(error.message)

        // Add to database if productId exists
        if (productId) {
          const isPrimary = images.length === 0 && index === 0 // First image is primary
          const displayOrder = images.length + index
          
          const { data: imageData, error: dbError } = await productImageService.addProductImage(
            productId,
            data.url,
            data.path,
            isPrimary,
            displayOrder
          )
          
          if (dbError) {
            console.error('Database error when adding image:', dbError)
            throw new Error(dbError.message)
          }
          
          console.log('Successfully added image to database:', imageData)
          return imageData
        } else {
          // Return image data for form preview
          return {
            id: `temp-${Date.now()}-${index}`,
            image_url: data.url,
            image_path: data.path,
            is_primary: images.length === 0 && index === 0,
            display_order: images.length + index
          }
        }
      })

      const newImages = await Promise.all(uploadPromises)
      console.log('All images uploaded successfully:', newImages)
      
      // Update the images state
      const updatedImages = [...images, ...newImages]
      console.log('Updated images array:', updatedImages)
      onImagesChange(updatedImages)
      
    } catch (err) {
      console.error('Error uploading images:', err)
      setError(err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    )
    
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files)
    if (files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleRemoveImage = async (imageIndex) => {
    const image = images[imageIndex]
    console.log('Removing image:', image)
    
    try {
      // Delete from storage
      if (image.image_path) {
        console.log('Deleting from storage:', image.image_path)
        await storageService.deleteImage(image.image_path)
      }
      
      // Delete from database if it has a real ID
      if (productId && image.id && !image.id.startsWith('temp-')) {
        console.log('Deleting from database:', image.id)
        const { error } = await productImageService.deleteProductImage(image.id)
        if (error) {
          console.error('Error deleting from database:', error)
        }
      }
      
      const newImages = images.filter((_, index) => index !== imageIndex)
      
      // If we removed the primary image, make the first remaining image primary
      if (image.is_primary && newImages.length > 0) {
        newImages[0].is_primary = true
        if (productId && newImages[0].id && !newImages[0].id.startsWith('temp-')) {
          await productImageService.setPrimaryImage(productId, newImages[0].id)
        }
      }
      
      console.log('Images after removal:', newImages)
      onImagesChange(newImages)
    } catch (err) {
      console.error('Error removing image:', err)
      setError('Pildi eemaldamine ebaõnnestus')
    }
  }

  const handleSetPrimary = async (imageIndex) => {
    const newImages = images.map((img, index) => ({
      ...img,
      is_primary: index === imageIndex
    }))
    
    if (productId && images[imageIndex].id && !images[imageIndex].id.startsWith('temp-')) {
      try {
        await productImageService.setPrimaryImage(productId, images[imageIndex].id)
      } catch (err) {
        console.error('Error setting primary image:', err)
        setError('Peamise pildi määramine ebaõnnestus')
        return
      }
    }
    
    onImagesChange(newImages)
  }

  const handleDragStart = (e, index) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
  }

  const handleImageDrop = async (e, dropIndex) => {
    e.preventDefault()
    
    if (draggedIndex === null || draggedIndex === dropIndex) return
    
    const newImages = [...images]
    const draggedImage = newImages[draggedIndex]
    
    // Remove dragged image and insert at new position
    newImages.splice(draggedIndex, 1)
    newImages.splice(dropIndex, 0, draggedImage)
    
    // Update display orders
    const updatedImages = newImages.map((img, index) => ({
      ...img,
      display_order: index
    }))
    
    // Update in database if productId exists
    if (productId) {
      try {
        const imageOrders = updatedImages
          .filter(img => img.id && !img.id.startsWith('temp-'))
          .map(img => ({ id: img.id, display_order: img.display_order }))
        
        if (imageOrders.length > 0) {
          await productImageService.reorderImages(imageOrders)
        }
      } catch (err) {
        console.error('Error reordering images:', err)
        setError('Piltide järjestamine ebaõnnestus')
        return
      }
    }
    
    onImagesChange(updatedImages)
    setDraggedIndex(null)
  }

  const canAddMore = images.length < maxImages

  console.log('MultiImageUpload render - images:', images, 'productId:', productId)

  return (
    <div className={`multi-image-upload ${className}`}>
      <div className="images-grid">
        {images.map((image, index) => (
          <div 
            key={image.id}
            className={`image-item ${draggedIndex === index ? 'dragging' : ''}`}
            draggable
            onDragStart={(e) => handleDragStart(e, index)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => handleImageDrop(e, index)}
          >
            <img src={image.image_url} alt={`Toote pilt ${index + 1}`} />
            
            <div className="image-overlay">
              <div className="image-controls">
                {!image.is_primary && (
                  <button 
                    type="button"
                    onClick={() => handleSetPrimary(index)}
                    className="btn btn-small btn-primary"
                    title="Määra peamiseks"
                  >
                    ⭐ Peamine
                  </button>
                )}
                <button 
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="btn btn-small btn-danger"
                  title="Eemalda pilt"
                >
                  🗑️
                </button>
              </div>
            </div>
            
            {image.is_primary && (
              <div className="primary-badge">
                ⭐ Peamine
              </div>
            )}
            
            <div className="drag-handle">
              ⋮⋮
            </div>
          </div>
        ))}
        
        {canAddMore && (
          <div 
            className={`upload-slot ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? (
              <div className="upload-progress">
                <div className="loading-spinner"></div>
                <p>Üleslaadimine...</p>
              </div>
            ) : (
              <div className="upload-content">
                <div className="upload-icon">📷</div>
                <p>Lisa pilt</p>
                <p className="upload-hint">
                  {images.length + 1}/{maxImages}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        multiple
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <div className="upload-info">
        <p>Saate lisada kuni {maxImages} pilti. Lohistage pilte ümber järjestamiseks.</p>
        <p>Esimene pilt on vaikimisi peamine pilt, mida kuvatakse tootekaardil.</p>
      </div>

      <style jsx>{`
        .multi-image-upload {
          width: 100%;
        }

        .images-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }

        .image-item {
          position: relative;
          aspect-ratio: 4/3;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
          cursor: move;
          transition: transform 0.2s ease;
        }

        .image-item:hover {
          transform: scale(1.02);
        }

        .image-item.dragging {
          opacity: 0.5;
          transform: rotate(5deg);
        }

        .image-item img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .image-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .image-item:hover .image-overlay {
          opacity: 1;
        }

        .image-controls {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
        }

        .primary-badge {
          position: absolute;
          top: 8px;
          left: 8px;
          background: var(--color-ultramarine);
          color: white;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 0.7rem;
          font-weight: 500;
        }

        .drag-handle {
          position: absolute;
          top: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.5);
          color: white;
          padding: 4px 6px;
          border-radius: 4px;
          font-size: 0.8rem;
          cursor: move;
        }

        .upload-slot {
          aspect-ratio: 4/3;
          border: 2px dashed #ddd;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .upload-slot:hover {
          border-color: var(--color-ultramarine);
          background: #f0f4ff;
        }

        .upload-slot.drag-over {
          border-color: var(--color-ultramarine);
          background: #f0f4ff;
          transform: scale(1.02);
        }

        .upload-slot.uploading {
          pointer-events: none;
          opacity: 0.7;
        }

        .upload-content {
          text-align: center;
        }

        .upload-icon {
          font-size: 2rem;
          margin-bottom: 8px;
          opacity: 0.5;
        }

        .upload-content p {
          margin: 4px 0;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .upload-hint {
          font-size: 0.7rem !important;
          color: #666 !important;
        }

        .upload-progress {
          text-align: center;
        }

        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 2px solid #f3f3f3;
          border-top: 2px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 8px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .upload-error {
          background-color: #fee;
          color: #c33;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 16px;
          font-size: 0.9rem;
        }

        .upload-info {
          background: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          border-left: 3px solid var(--color-ultramarine);
        }

        .upload-info p {
          margin: 4px 0;
          font-size: 0.85rem;
          color: #666;
          line-height: 1.4;
        }

        .btn {
          padding: 4px 8px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.7rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn-small {
          padding: 3px 6px;
          font-size: 0.65rem;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        @media (max-width: 768px) {
          .images-grid {
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 12px;
          }

          .image-overlay {
            opacity: 1;
            background: rgba(0, 0, 0, 0.5);
          }

          .image-controls {
            flex-direction: column;
            align-items: center;
          }

          .upload-icon {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  )
}

export default MultiImageUpload