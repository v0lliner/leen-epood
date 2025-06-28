import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import AdminLayout from '../../components/Admin/AdminLayout'
import { categoryService } from '../../utils/supabase/categories'

const AdminCategories = () => {
  const { t } = useTranslation()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    parent_id: null,
    display_order: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    setLoading(true)
    const { data, error } = await categoryService.getCategories()
    
    if (error) {
      setError(error.message)
    } else {
      setCategories(data)
    }
    
    setLoading(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Kategooria nimi on kohustuslik')
      return
    }

    try {
      const slug = await categoryService.generateSlug(
        formData.name, 
        editingCategory?.id
      )

      const categoryData = {
        ...formData,
        slug,
        parent_id: formData.parent_id || null
      }

      if (editingCategory) {
        categoryData.id = editingCategory.id
      }

      const { error } = await categoryService.upsertCategory(categoryData)
      
      if (error) {
        setError(error.message)
      } else {
        await loadCategories()
        resetForm()
      }
    } catch (err) {
      setError('Võrguühenduse viga')
    }
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      parent_id: category.parent_id,
      display_order: category.display_order
    })
  }

  const handleDelete = async (id) => {
    if (!confirm('Kas olete kindel, et soovite selle kategooria kustutada?')) {
      return
    }

    const { error } = await categoryService.deleteCategory(id)
    
    if (error) {
      setError(error.message)
    } else {
      await loadCategories()
    }
  }

  const resetForm = () => {
    setEditingCategory(null)
    setFormData({
      name: '',
      parent_id: null,
      display_order: 0
    })
  }

  const getParentOptions = () => {
    return categories.filter(cat => 
      !editingCategory || cat.id !== editingCategory.id
    )
  }

  if (loading) {
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
      <div className="categories-container">
        <div className="categories-header">
          <h1>Kategooriate haldus</h1>
          <p>Hallake toodete kategooriaid ja alamkategooriaid</p>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="categories-layout">
          {/* Category Form */}
          <div className="category-form-section">
            <div className="form-card">
              <h3>{editingCategory ? 'Muuda kategooriat' : 'Lisa uus kategooria'}</h3>
              
              <form onSubmit={handleSubmit} className="category-form">
                <div className="form-group">
                  <label htmlFor="name">Kategooria nimi *</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    required
                    className="form-input"
                    placeholder="Nt. Vaasid"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="parent_id">Ülemkategooria</label>
                  <select
                    id="parent_id"
                    value={formData.parent_id || ''}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      parent_id: e.target.value || null
                    }))}
                    className="form-input"
                  >
                    <option value="">Peakategooria</option>
                    {getParentOptions().map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="display_order">Järjekord</label>
                  <input
                    type="number"
                    id="display_order"
                    value={formData.display_order}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      display_order: parseInt(e.target.value) || 0
                    }))}
                    className="form-input"
                    min="0"
                  />
                </div>

                <div className="form-actions">
                  {editingCategory && (
                    <button 
                      type="button"
                      onClick={resetForm}
                      className="btn btn-secondary"
                    >
                      Tühista
                    </button>
                  )}
                  <button 
                    type="submit"
                    className="btn btn-primary"
                  >
                    {editingCategory ? 'Uuenda' : 'Lisa kategooria'}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Categories List */}
          <div className="categories-list-section">
            <div className="list-card">
              <h3>Olemasolevad kategooriad</h3>
              
              <div className="categories-tree">
                {categories.map(category => (
                  <div key={category.id} className="category-group">
                    <div className="category-item parent-category">
                      <div className="category-info">
                        <h4>{category.name}</h4>
                        <span className="category-slug">/{category.slug}</span>
                      </div>
                      <div className="category-actions">
                        <button 
                          onClick={() => handleEdit(category)}
                          className="btn btn-small btn-secondary"
                        >
                          ✏️ Muuda
                        </button>
                        <button 
                          onClick={() => handleDelete(category.id)}
                          className="btn btn-small btn-danger"
                        >
                          🗑️ Kustuta
                        </button>
                      </div>
                    </div>
                    
                    {category.children && category.children.length > 0 && (
                      <div className="subcategories">
                        {category.children.map(child => (
                          <div key={child.id} className="category-item child-category">
                            <div className="category-info">
                              <h5>{child.name}</h5>
                              <span className="category-slug">/{child.slug}</span>
                            </div>
                            <div className="category-actions">
                              <button 
                                onClick={() => handleEdit(child)}
                                className="btn btn-small btn-secondary"
                              >
                                ✏️ Muuda
                              </button>
                              <button 
                                onClick={() => handleDelete(child.id)}
                                className="btn btn-small btn-danger"
                              >
                                🗑️ Kustuta
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {categories.length === 0 && (
                <div className="empty-state">
                  <div className="empty-icon">📁</div>
                  <h4>Kategooriaid pole veel lisatud</h4>
                  <p>Alustage esimese kategooria lisamisega</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .categories-container {
          padding: 32px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .categories-header {
          margin-bottom: 32px;
        }

        .categories-header h1 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 8px;
        }

        .categories-header p {
          color: #666;
          font-size: 1rem;
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

        .error-message {
          background-color: #fee;
          color: #c33;
          padding: 12px 16px;
          border-radius: 4px;
          border: 1px solid #fcc;
          margin-bottom: 24px;
        }

        .categories-layout {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 32px;
        }

        .form-card,
        .list-card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          padding: 24px;
        }

        .form-card h3,
        .list-card h3 {
          font-family: var(--font-heading);
          color: var(--color-ultramarine);
          margin-bottom: 24px;
          font-size: 1.25rem;
        }

        .category-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
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

        .form-actions {
          display: flex;
          gap: 12px;
          margin-top: 8px;
        }

        .categories-tree {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .category-group {
          border: 1px solid #e9ecef;
          border-radius: 8px;
          overflow: hidden;
        }

        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
        }

        .parent-category {
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
        }

        .child-category {
          background: white;
          border-bottom: 1px solid #f0f0f0;
          padding-left: 32px;
        }

        .child-category:last-child {
          border-bottom: none;
        }

        .category-info h4,
        .category-info h5 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 4px;
          font-size: 1rem;
        }

        .category-info h5 {
          font-size: 0.9rem;
        }

        .category-slug {
          font-family: var(--font-heading);
          font-size: 0.8rem;
          color: #666;
          background: #e9ecef;
          padding: 2px 8px;
          border-radius: 12px;
        }

        .category-actions {
          display: flex;
          gap: 8px;
        }

        .empty-state {
          text-align: center;
          padding: 48px 24px;
          color: #666;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 16px;
        }

        .empty-state h4 {
          font-family: var(--font-heading);
          color: var(--color-text);
          margin-bottom: 8px;
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

        .btn:hover {
          opacity: 0.9;
        }

        .btn-primary {
          background-color: var(--color-ultramarine);
          color: white;
        }

        .btn-secondary {
          background-color: #6c757d;
          color: white;
        }

        .btn-danger {
          background-color: #dc3545;
          color: white;
        }

        .btn-small {
          padding: 4px 8px;
          font-size: 0.8rem;
        }

        @media (max-width: 768px) {
          .categories-container {
            padding: 24px 16px;
          }

          .categories-layout {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .category-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 12px;
          }

          .category-actions {
            align-self: stretch;
            justify-content: flex-end;
          }
        }
      `}</style>
    </AdminLayout>
  )
}

export default AdminCategories