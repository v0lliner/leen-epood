import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import MultiImageUpload from '../../components/Admin/MultiImageUpload'
import { productService } from '../../utils/supabase/products'
import { parsePriceToAmount } from '../../utils/formatPrice'
import { categoryService } from '../../utils/supabase/categories'
import { productImageService } from '../../utils/supabase/productImages'

const ProductForm = () => {
  const { t } = useTranslation()
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [categories, setCategories] = useState([])
  const [images, setImages] = useState([])
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    category: '',
    subcategory: '',
    dimensions: {
      height: '',
      width: '',
      width2: '', // Second width measurement for asymmetric products (will be shown as "Pikkus")
      depth: ''
    },
    available: true
  })

  useEffect(() => {
    loadCategories()
    if (isEdit && id) {
      loadProduct()
    }
  }, [id, isEdit])

  const loadCategories = async () => {
    setCategoriesLoading(true)
    const { data, error } = await categoryService.getCategories()
    
    if (error) {
      console.warn('Failed to load categories:', error)
      setCategories([])
    } else {
      setCategories(data)
    }
    
    setCategoriesLoading(false)
  }

  const loadProduct = async () => {
    setLoading(true)
    
    try {
      // Load product data
      const { data: productData, error: productError } = await productService.getProduct(id)
      
      if (productError) {
        setError(productError.message)
        setLoading(false)
        return
      }

      if (productData) {
        // Ensure dimensions object has all required fields
        const dimensions = productData.dimensions || {}
        setFormData({
          ...productData,
          dimensions: {
            height: dimensions.height || '',
            width: dimensions.width || '',
            width2: dimensions.width2 || '', // Support for second width (shown as "Pikkus")
            depth: dimensions.depth || ''
          }
        })

        // Load product images with retry mechanism
        console.log('Loading images for product:', id)
        let retryCount = 0
        const maxRetries = 3
        
        while (retryCount < maxRetries) {
          const { data: imagesData, error: imagesError } = await productImageService.getProductImages(id)
          
          if (imagesError) {
            console.warn(`Failed to load product images (attempt ${retryCount + 1}):`, imagesError)
            retryCount++
            if (retryCount < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second before retry
            } else {
              setImages([])
            }
          } else {
            console.log('Loaded product images:', imagesData)
            setImages(imagesData || [])
            break
          }
        }
      }
    } catch (err) {
      console.error('Error loading product:', err)
      setError('Andmete laadimine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }

  const generateSlug = (title) => {
    return title
      .toLowerCase()
      .replace(/[äöüõ]/g, (match) => {
        const map = { 'ä': 'a', 'ö': 'o', 'ü': 'u', 'õ': 'o' }
        return map[match] || match
      })
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-')
  }

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'title') {
      setFormData(prev => ({
        ...prev,
        title: value,
        slug: generateSlug(value)
      }))
    } else if (name.startsWith('dimensions.')) {
      const dimensionKey = name.split('.')[1]
      // Allow decimal numbers for dimensions
      const numericValue = value === '' ? '' : value
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionKey]: numericValue
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }

    // Clear messages when user starts typing
    if (error) setError('')
    if (success) setSuccess('')
  }

  const handleCategoryChange = (e) => {
    const newCategory = e.target.value
    setFormData(prev => ({
      ...prev,
      category: newCategory,
      subcategory: '' // Reset subcategory when category changes
    }))
  }

  const getSubcategories = () => {
    const parentCategory = categories.find(cat => cat.slug === formData.category)
    return parentCategory?.children || []
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError(t('admin.products.form.title_required'))
      return false
    }
    // Validate price - must be non-empty and greater than zero
    if (!formData.price.trim()) {
      setError(t('admin.products.form.price_required'))
      return false
    }
    // Parse price to check if it's a valid number greater than zero
    const priceValue = parsePriceToAmount(formData.price)
    if (isNaN(priceValue) || priceValue <= 0) {
      setError('Hind peab olema suurem kui 0')
      return false
    }
    if (images.length === 0) {
      setError('Vähemalt üks pilt on kohustuslik')
      return false
    }
    if (!formData.category) {
      setError(t('admin.products.form.category_required'))
      return false
    }
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setLoading(true)
    setError('')

    try {
      // Generate unique slug before saving
      const { data: uniqueSlug, error: slugError } = await productService.generateUniqueSlug(
        formData.slug || generateSlug(formData.title),
        isEdit ? id : null
      )

      if (slugError) {
        setError(slugError.message)
        setLoading(false)
        return
      }

      // Process dimensions - convert to numbers where possible, keep as strings for decimals
      const processedDimensions = {}
      Object.keys(formData.dimensions).forEach(key => {
        const value = formData.dimensions[key]
        if (value !== '') {
          // Parse as float to support decimal values
          const numValue = parseFloat(value)
          processedDimensions[key] = isNaN(numValue) ? 0 : numValue
        }
      })

      const productData = {
        ...formData,
        slug: uniqueSlug,
        // Ensure price has € symbol and is properly formatted
        price: formData.price.includes('€') 
          ? formData.price 
          : `${parseFloat(formData.price.replace(',', '.')).toFixed(2)}€`,
        dimensions: processedDimensions,
        // Set primary image for backward compatibility
        image: images.find(img => img.is_primary)?.image_url || images[0]?.image_url || '',
        image_path: images.find(img => img.is_primary)?.image_path || images[0]?.image_path || ''
      }

      if (isEdit) {
        productData.id = id
      }

      console.log('Saving product with data:', productData)
      console.log('Current images:', images)

      const { data, error } = await productService.upsertProduct(productData)
      
      if (error) {
        setError(error.message)
      } else {
        console.log('Product saved successfully:', data)
        
        // If this is a new product and we have temporary images, we need to associate them
        if (!isEdit && data?.id && images.some(img => img.id.startsWith('temp-'))) {
          console.log('Associating temporary images with new product...')
          try {
            // Re-upload images for the new product
            const tempImages = images.filter(img => img.id.startsWith('temp-'))
            for (let i = 0; i < tempImages.length; i++) {
              const tempImage = tempImages[i]
              await productImageService.addProductImage(
                data.id,
                tempImage.image_url,
                tempImage.image_path,
                tempImage.is_primary,
                tempImage.display_order
              )
            }
            console.log('Successfully associated all images with new product')
          } catch (imageError) {
            console.error('Error associating images with new product:', imageError)
          }
        }
        
        setSuccess(isEdit ? t('admin.products.form.updated_success') : t('admin.products.form.created_success'))
        setTimeout(() => {
          navigate('/admin/products')
        }, 1500)
      }
    } catch (err) {
      console.error('Error saving product:', err)
      setError(t('admin.products.form.network_error'))
    } finally {
      setLoading(false)
    }
  }

  // Handle images change with logging and validation
  const handleImagesChange = (newImages) => {
    console.log('Images changed in ProductForm:', newImages)
    setImages(newImages)
    
    // Clear error if we now have images
    if (newImages.length > 0 && error === 'Vähemalt üks pilt on kohustuslik') {
      setError('')
    }
  }

  if (loading && isEdit) {
    return (
      <AdminLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>{t('admin.loading')}</p>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="product-form-container">
        <div className="form-header">
          <h1>{isEdit ? t('admin.products.form.edit_title') : t('admin.products.form.create_title')}</h1>
          <button 
            onClick={() => navigate('/admin/products')}
            className="btn btn-secondary"
          >
            {t('admin.back')}
          </button>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="product-form">
          <div className="form-grid">
            {/* Left Column */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="title">{t('admin.products.form.title')} *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder={t('admin.products.form.title_placeholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="slug">{t('admin.products.form.slug')}</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder={t('admin.products.form.slug_placeholder')}
                />
                <small>{t('admin.products.form.slug_help')}</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">{t('admin.products.form.description')}</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="form-input"
                  placeholder={t('admin.products.form.description_placeholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">{t('admin.products.form.price')} *</label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder={t('admin.products.form.price_placeholder')}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="category">{t('admin.products.form.category')} *</label>
                {categoriesLoading ? (
                  <div className="loading-text">{t('admin.products.form.loading_categories')}</div>
                ) : (
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    required
                    className="form-input"
                  >
                    <option value="">{t('admin.products.form.select_category')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="subcategory">{t('admin.products.form.subcategory')}</label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={!formData.category}
                >
                  <option value="">{t('admin.products.form.select_subcategory')}</option>
                  {getSubcategories().map(sub => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>{t('admin.products.form.dimensions')} (cm)</label>
                <div className="dimensions-grid">
                  <div className="dimension-input">
                    <label htmlFor="height" className="dimension-label">Kõrgus</label>
                    <input
                      type="number"
                      id="height"
                      name="dimensions.height"
                      value={formData.dimensions.height}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      placeholder="nt. 25.5"
                      className="form-input"
                    />
                  </div>
                  <div className="dimension-input">
                    <label htmlFor="width" className="dimension-label">Laius</label>
                    <input
                      type="number"
                      id="width"
                      name="dimensions.width"
                      value={formData.dimensions.width}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      placeholder="nt. 15.2"
                      className="form-input"
                    />
                  </div>
                  <div className="dimension-input">
                    <label htmlFor="width2" className="dimension-label">Pikkus</label>
                    <input
                      type="number"
                      id="width2"
                      name="dimensions.width2"
                      value={formData.dimensions.width2}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      placeholder="nt. 12.8"
                      className="form-input"
                    />
                    <small className="dimension-help">Mittesümmeetriliste toodete jaoks</small>
                  </div>
                  <div className="dimension-input">
                    <label htmlFor="depth" className="dimension-label">Sügavus</label>
                    <input
                      type="number"
                      id="depth"
                      name="dimensions.depth"
                      value={formData.dimensions.depth}
                      onChange={handleInputChange}
                      step="0.1"
                      min="0"
                      placeholder="nt. 8.3"
                      className="form-input"
                    />
                  </div>
                </div>
                <div className="dimensions-help">
                  <small>Sisestage mõõdud sentimeetrites. Komakohad on lubatud (nt. 2.3).</small>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="available"
                    checked={formData.available}
                    onChange={handleInputChange}
                    className="form-checkbox"
                  />
                  <span>{t('admin.products.form.available')}</span>
                </label>
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="images-section">
            <h3>Toote pildid * (kuni 4 pilti)</h3>
            <MultiImageUpload
              productId={isEdit ? id : null}
              images={images}
              onImagesChange={handleImagesChange}
              maxImages={4}
            />
          </div>

          <div className="form-actions">
            <button 
              type="button"
              onClick={() => navigate('/admin/products')}
              className="btn btn-secondary"
            >
              {t('admin.cancel')}
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? t('admin.saving') : (isEdit ? t('admin.products.form.update') : t('admin.products.form.create'))}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .product-form-container {
          padding: 32px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .form-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin: 0;
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 64px;
          gap: 16px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid var(--color-ultramarine);
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          padding: 12px 16px;
          color: #666;
          font-style: italic;
        }

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
        }

        .success-message {
          background-color: #efe;
          color: #363;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #cfc;
          margin-bottom: 24px;
        }

        .product-form {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 32px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 32px;
          margin-bottom: 32px;
        }

        .form-column {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-family: var(--font-heading);
          font-weight: 500;
          color: var(--color-text);
          font-size: 0.9rem;
        }

        .form-input {
          padding: 12px 16px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-family: var(--font-body);
          font-size: 1rem;
          transition: border-color 0.2s ease;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--color-ultramarine);
          box-shadow: 0 0 0 3px rgba(47, 62, 156, 0.1);
        }

        .form-input:disabled {
          background-color: #f5f5f5;
          cursor: not-allowed;
        }

        .form-input::placeholder {
          color: #999;
        }

        .form-group small {
          color: #666;
          font-size: 0.8rem;
        }

        .dimensions-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .dimension-input {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .dimension-label {
          font-family: var(--font-heading) !important;
          font-weight: 500 !important;
          color: var(--color-text) !important;
          font-size: 0.8rem !important;
          margin-bottom: 4px;
        }

        .dimension-help {
          font-size: 0.7rem !important;
          color: #888 !important;
          font-style: italic;
          margin-top: 2px;
        }

        .dimensions-help {
          margin-top: 12px;
          padding: 12px;
          background: #f8f9fa;
          border-radius: 4px;
          border-left: 3px solid var(--color-ultramarine);
        }

        .dimensions-help small {
          color: #666;
          font-size: 0.85rem;
          line-height: 1.4;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          font-family: var(--font-body) !important;
          font-weight: normal !important;
          font-size: 1rem !important;
        }

        .form-checkbox {
          width: 18px;
          height: 18px;
          accent-color: var(--color-ultramarine);
        }

        .images-section {
          margin-bottom: 32px;
          padding: 24px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          background: #f8f9fa;
        }

        .images-section h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 16px;
          font-size: 1.125rem;
        }

        .form-actions {
          display: flex;
          gap: 16px;
          justify-content: flex-end;
          padding-top: 24px;
          border-top: 1px solid #eee;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 4px;
          font-family: var(--font-body);
          font-weight: 500;
          text-decoration: none;
          cursor: pointer;
          transition: opacity 0.2s ease;
          font-size: 1rem;
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

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        @media (max-width: 768px) {
          .product-form-container {
            padding: 24px 16px;
          }

          .form-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }

          .form-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .dimensions-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default ProductForm