import { useState, useEffect } from 'react'
import { productService } from '../utils/supabase/products'
import { products as fallbackProducts } from '../data/products'

/**
 * Custom hook for managing products data
 * Falls back to static data if Supabase is not available
 */
export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await productService.getProducts()
      
      if (error) {
        console.warn('Failed to load products from Supabase, using fallback data:', error)
        setProducts(fallbackProducts)
      } else {
        // If no products in database, use fallback data
        setProducts(data.length > 0 ? data : fallbackProducts)
      }
    } catch (err) {
      console.warn('Error loading products, using fallback data:', err)
      setProducts(fallbackProducts)
    } finally {
      setLoading(false)
    }
  }

  const getProductBySlug = (slug) => {
    return products.find(product => product.slug === slug)
  }

  const getProductsByCategory = (category) => {
    return products.filter(product => product.category === category)
  }

  const getRelatedProducts = (product, limit = 3) => {
    return products
      .filter(p => p.category === product.category && p.id !== product.id)
      .slice(0, limit)
  }

  return {
    products,
    loading,
    error,
    getProductBySlug,
    getProductsByCategory,
    getRelatedProducts,
    refetch: loadProducts
  }
}