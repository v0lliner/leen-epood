import { useState, useEffect } from 'react'
import { productService } from '../utils/supabase/products'
import { categoryService } from '../utils/supabase/categories'
import { products as fallbackProducts } from '../data/products'

/**
 * Custom hook for managing products data
 * Falls back to static data if Supabase is not available
 */
export const useProducts = () => {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Load products and categories in parallel
      const [productsResult, categoriesResult] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ])
      
      if (productsResult.error) {
        console.warn('Failed to load products from Supabase, using fallback data:', productsResult.error)
        setProducts(fallbackProducts)
      } else {
        // If no products in database, use fallback data
        setProducts(productsResult.data.length > 0 ? productsResult.data : fallbackProducts)
      }

      if (categoriesResult.error) {
        console.warn('Failed to load categories from Supabase:', categoriesResult.error)
        setCategories([])
      } else {
        setCategories(categoriesResult.data)
      }
    } catch (err) {
      console.warn('Error loading data, using fallback:', err)
      setProducts(fallbackProducts)
      setCategories([])
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
      .filter(p => p.category === product.category && p.id !== product.id && p.available) // Filter available products first
      .slice(0, limit) // Then apply the limit
  }

  const getCategoryBySlug = (slug) => {
    // Search in both parent and child categories
    for (const category of categories) {
      if (category.slug === slug) return category
      if (category.children) {
        const child = category.children.find(child => child.slug === slug)
        if (child) return child
      }
    }
    return null
  }

  return {
    products,
    categories,
    loading,
    error,
    getProductBySlug,
    getProductsByCategory,
    getRelatedProducts,
    getCategoryBySlug,
    refetch: loadData
  }
}