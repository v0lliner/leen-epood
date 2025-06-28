import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import ImageUpload from '../../components/Admin/ImageUpload'
import { productService } from '../../utils/supabase/products'
import { categoryService } from '../../utils/supabase/categories'
import { storageService } from '../../utils/supabase/storage'

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
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    price: '',
    image: '',
    image_path: '',
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
    const { data, error } = await productService.getProduct(id)
    
    if (error) {
      setError(error.message)
    } else if (data) {
      setFormData({
        ...data,
        dimensions: data.dimensions || { height: '', width: '', depth: '' }
      })
    }
    
    setLoading(false)
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

  const handleImageChange = (imageUrl, imagePath) => {
    setFormData(prev => ({
      ...prev,
      image: imageUrl,
      image_path: imagePath
    }))
  }

  const handleImageRemove = async () => {
    // Delete old image from storage if it exists
    if (formData.image_path) {
      await storageService.deleteImage(formData.image_path)
    }
    
    setFormData(prev => ({
      ...prev,
      image: '',
      image_path: ''
    }))
  }

  const getSubcategories = () => {
    const parentCategory = categories.find(cat => cat.slug === formData.category)
    return parentCategory?.children || []
  }

  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Toote pealkiri on kohustuslik')
      return false
    }
    if (!formData.price.trim()) {
      setError('Hind on kohustuslik')
      return false
    }
    if (!formData.image.trim()) {
      setError('Toote pilt on kohustuslik')
      return false
    }
    if (!formData.category) {
      setError('Kategooria on kohustuslik')
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
      const productData = {
        ...formData,
        price: formData.price.includes('€') ? formData.price : `${formData.price}€`,
        dimensions: {
          height: parseInt(formData.dimensions.height) || 0,
          width: parseInt(formData.dimensions.width) || 0,
          depth: parseInt(formData.dimensions.depth) || 0
        }
      }

      if (isEdit) {
        productData.id = id
      }

      const { data, error } = await productService.upsertProduct(productData)
      
      if (error) {
        setError(error.message)
      } else {
        setSuccess(isEdit ? 'Toode edukalt uuendatud!' : 'Toode edukalt lisatud!')
        setTimeout(() => {
          navigate('/admin/products')
        }, 1500)
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    } finally {
      setLoading(false)
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
          <h1>{isEdit ? 'Muuda toodet' : 'Lisa uus toode'}</h1>
          <button 
            onClick={() => navigate('/admin/products')}
            className="btn btn-secondary"
          >
            Tagasi
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
                <label htmlFor="title">Toote pealkiri *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="Nt. Käsitöövaas 'Mälestus'"
                />
              </div>

              <div className="form-group">
                <label htmlFor="slug">URL slug</label>
                <input
                  type="text"
                  id="slug"
                  name="slug"
                  value={formData.slug}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="kasitoo-vaas-malestus"
                />
                <small>Genereeritakse automaatselt pealkirjast</small>
              </div>

              <div className="form-group">
                <label htmlFor="description">Kirjeldus</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="4"
                  className="form-input"
                  placeholder="Toote detailne kirjeldus..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="price">Hind *</label>
                <input
                  type="text"
                  id="price"
                  name="price"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  className="form-input"
                  placeholder="85€"
                />
              </div>

              {/* Image Upload */}
              <div className="form-group">
                <label>Toote pilt *</label>
                <ImageUpload
                  currentImage={formData.image}
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="form-column">
              <div className="form-group">
                <label htmlFor="category">Kategooria *</label>
                {categoriesLoading ? (
                  <div className="loading-text">Kategooriate laadimine...</div>
                ) : (
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleCategoryChange}
                    required
                    className="form-input"
                  >
                    <option value="">Vali kategooria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.slug}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="subcategory">Alamkategooria</label>
                <select
                  id="subcategory"
                  name="subcategory"
                  value={formData.subcategory}
                  onChange={handleInputChange}
                  className="form-input"
                  disabled={!formData.category}
                >
                  <option value="">Vali alamkategooria</option>
                  {getSubcategories().map(sub => (
                    <option key={sub.id} value={sub.slug}>
                      {sub.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Mõõdud (cm)</label>
                <div className="dimensions-grid">
                  <input
                    type="number"
                    name="dimensions.height"
                    value={formData.dimensions.height}
                    onChange={handleInputChange}
                    placeholder="Kõrgus"
                    className="form-input"
                  />
                  <input
                    type="number"
                    name="dimensions.width"
                    value={formData.dimensions.width}
                    onChange={handleInputChange}
                    placeholder="Laius"
                    className="form-input"
                  />
                  <input
                    type="number"
                    name="dimensions.depth"
                    value={formData.dimensions.depth}
                    onChange={handleInputChange}
                    placeholder="Sügavus"
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
                  <span>Toode on saadaval</span>
                </label>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button 
              type="button"
              onClick={() => navigate('/admin/products')}
              className="btn btn-secondary"
            >
              Tühista
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Salvestamine...' : (isEdit ? 'Uuenda toode' : 'Lisa toode')}
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