import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import MultiImageUpload from '../../components/Admin/MultiImageUpload'
import { productService } from '../../utils/supabase/products'
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
        setFormData({
          ...productData,
          dimensions: productData.dimensions || { height: '', width: '', depth: '' }
        })

        // Load product images
        console.log('Loading images for product:', id)
        const { data: imagesData, error: imagesError } = await productImageService.getProductImages(id)
        
        if (imagesError) {
          console.warn('Failed to load product images:', imagesError)
          setImages([])
        } else {
          console.log('Loaded product images:', imagesData)
          setImages(imagesData || [])
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
      setFormData(prev => ({
        ...prev,
        dimensions: {
          ...prev.dimensions,
          [dimensionKey]: value
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
    if (!formData.price.trim()) {
      setError(t('admin.products.form.price_required'))
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

      const productData = {
        ...formData,
        slug: uniqueSlug, // Use the guaranteed unique slug
        price: formData.price.includes('€') ? formData.price : `${formData.price}€`,
        dimensions: {
          height: parseInt(formData.dimensions.height) || 0,
          width: parseInt(formData.dimensions.width) || 0,
          depth: parseInt(formData.dimensions.depth) || 0
        },
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

  // Handle images change with logging
  const handleImagesChange = (newImages) => {
    console.log('Images changed in ProductForm:', newImages)
    setImages(newImages)
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
                <label>{t('admin.products.form.dimensions')}</label>
                <div className="dimensions-grid">
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleInputChange}
                    placeholder={t('admin.products.form.height')}
                    className="form-input"
                  />
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleInputChange}
                    placeholder={t('admin.products.form.width')}
                    className="form-input"
                  />
                  <input
                    type="number"
                    name="dimensions.depth"
                    value={formData.dimensions.depth}
                    onChange={handleInputChange}
                    placeholder={t('admin.products.form.depth')}
                    className="form-input"
                  />
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
          grid-template-columns: 1fr 1fr 1fr;
          gap: 8px;
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
            gap: 8px;
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