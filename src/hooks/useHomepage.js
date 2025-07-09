import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { homepageContentService } from '../utils/supabase/homepageContent'

/**
 * Custom hook for managing homepage content
 * Falls back to static data if Supabase is not available
 * Supports bilingual content (Estonian and English)
 */
export const useHomepage = () => {
  const { i18n } = useTranslation()
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fallback content for both languages
  const fallbackContent = {
    et: {
      hero: {
        title: 'Leen Väränen',
        content: 'Keraamika ja disain, mis kannab isiklikku sõnumit.',
        image_url: ''
      },
      value1: {
        title: 'Praktiline esteetika',
        content: 'Iga ese on loodud kasutamiseks – esteetika tuleb lihtsusest, materjalist ja läbimõeldud vormist.'
      },
      value2: {
        title: 'Isikupärane käekiri',
        content: 'Looming on äratuntav detailide, materjalitunde ja tasakaaluka vormikeele kaudu.'
      },
      value3: {
        title: 'Visuaalne proportsioon',
        content: 'Tervik tekib siis, kui vormi osad toetavad üksteist – tasakaal on vaadeldav ja tajutav.'
      }
    },
    en: {
      hero: {
        title: 'Leen Väränen',
        content: 'Ceramics and design that carries a personal message.',
        image_url: ''
      },
      value1: {
        title: 'Practical beauty',
        content: 'Each piece is made to be used – its beauty comes from simplicity, material, and thoughtful form.'
      },
      value2: {
        title: 'Distinctive style',
        content: 'The work is recognizable through its details, feel for materials, and balanced design language.'
      },
      value3: {
        title: 'Visual proportions',
        content: 'A whole emerges when the parts of a form support each other – balance is something you can see and feel.'
      }
    }
  }

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setLoading(true)
    setError(null)

    try {
      // Get content for both languages
      const { data, error } = await homepageContentService.getBilingualContent()
      
      if (error) {
        console.warn('Failed to load homepage content from Supabase, using fallback data:', error)
        setContent(fallbackContent)
      } else {
        // If no content in database, use fallback data
        const hasEtContent = Object.keys(data.et || {}).length > 0
        const hasEnContent = Object.keys(data.en || {}).length > 0
        
        setContent({
          et: hasEtContent ? data.et : fallbackContent.et,
          en: hasEnContent ? data.en : fallbackContent.en
        })
      }
    } catch (err) {
      console.warn('Error loading homepage content, using fallback:', err)
      setContent(fallbackContent)
    } finally {
      setLoading(false)
    }
  }

  const getSection = (sectionKey) => {
    const currentLanguage = i18n.language || 'et'
    const languageContent = content[currentLanguage] || content.et || fallbackContent.et
    return languageContent[sectionKey] || fallbackContent[currentLanguage]?.[sectionKey] || fallbackContent.et[sectionKey] || {}
  }

  const getCurrentLanguageContent = () => {
    const currentLanguage = i18n.language || 'et'
    return content[currentLanguage] || content.et || fallbackContent.et
  }

  return {
    content,
    loading,
    error,
    getSection,
    getCurrentLanguageContent,
    refetch: loadContent
  }
}