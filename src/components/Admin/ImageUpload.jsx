import { useState, useRef } from 'react'
import { storageService } from '../../utils/supabase/storage'

const ImageUpload = ({ 
  currentImage, 
  onImageChange, 
  onImageRemove,
  className = '',
  placeholder = 'Lohistage pilt siia või klõpsake valimiseks'
}) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const fileInputRef = useRef(null)

  const handleFileSelect = async (file) => {
    setError('')
    
    // Validate file
    const validation = storageService.validateImage(file)
    if (!validation.valid) {
      setError(validation.error)
      return
    }

    setUploading(true)

    try {
      const { data, error } = await storageService.uploadImage(file, 'products')
      
      if (error) {
        setError(error.message)
      } else {
        onImageChange(data.url, data.path)
      }
    } catch (err) {
      setError('Pildi üleslaadimine ebaõnnestus')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileSelect(files[0])
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
      handleFileSelect(files[0])
    }
  }

  const handleRemoveImage = () => {
    if (onImageRemove) {
      onImageRemove()
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className={`image-upload ${className}`}>
      {currentImage ? (
        <div className="image-preview">
          <img src={currentImage} alt="Toote pilt" />
          <div className="image-overlay">
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn btn-secondary"
              disabled={uploading}
            >
              📷 Muuda pilti
            </button>
            <button 
              type="button"
              onClick={handleRemoveImage}
              className="btn btn-danger"
              disabled={uploading}
            >
              🗑️ Eemalda
            </button>
          </div>
        </div>
      ) : (
        <div 
          className={`upload-area ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="upload-progress">
              <div className="loading-spinner"></div>
              <p>Pildi üleslaadimine...</p>
            </div>
          ) : (
            <div className="upload-content">
              <div className="upload-icon">📷</div>
              <p>{placeholder}</p>
              <p className="upload-hint">JPEG, PNG või WebP, max 5MB</p>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="upload-error">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        style={{ display: 'none' }}
      />

      <style jsx>{`
        .image-upload {
          width: 100%;
        }

        .upload-area {
          border: 2px dashed #ddd;
          border-radius: 8px;
          padding: 48px 24px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fafafa;
        }

        .upload-area:hover {
          border-color: var(--color-ultramarine);
          background: #f0f4ff;
        }

        .upload-area.drag-over {
          border-color: var(--color-ultramarine);
          background: #f0f4ff;
          transform: scale(1.02);
        }

        .upload-area.uploading {
          pointer-events: none;
          opacity: 0.7;
        }

        .upload-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .upload-icon {
          font-size: 3rem;
          opacity: 0.5;
        }

        .upload-content p {
          margin: 0;
          color: var(--color-text);
        }

        .upload-hint {
          font-size: 0.8rem;
          color: #666 !important;
        }

        .upload-progress {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .image-preview {
          position: relative;
          border-radius: 8px;
          overflow: hidden;
          background: #f5f5f5;
        }

        .image-preview img {
          width: 100%;
          height: 300px;
          object-fit: cover;
          display: block;
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
          gap: 12px;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .image-preview:hover .image-overlay {
          opacity: 1;
        }

        .upload-error {
          background-color: #fee;
          color: #c33;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-top: 8px;
          font-size: 0.9rem;
        }

        .btn {
          padding: 8px 16px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 0.9rem;
          text-decoration: none;
          display: inline-block;
          text-align: center;
        }

        .btn:hover:not(:disabled) {
          opacity: 0.9;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        @media (max-width: 768px) {
          .upload-area {
            padding: 32px 16px;
          }

          .upload-icon {
            font-size: 2rem;
          }

          .image-overlay {
            opacity: 1;
            background: rgba(0, 0, 0, 0.5);
          }

          .image-overlay .btn {
            font-size: 0.8rem;
            padding: 6px 12px;
          }
        }
      `}</style>
    </div>
  )
}

export default ImageUpload