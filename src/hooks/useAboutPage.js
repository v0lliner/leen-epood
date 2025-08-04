import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { aboutPageService } from '../utils/supabase/aboutPage'

/**
 * Custom hook for managing about page content
 * Falls back to static data if Supabase is not available
 * Supports bilingual content (Estonian and English)
 */
export const useAboutPage = () => {
  const { i18n } = useTranslation()
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fallback content for both languages
  const fallbackContent = {
    et: {
      intro: {
        title: 'Sissejuhatus',
        content: 'Olen Leen Väränen – keraamik ja rõivadisainer, kelle looming sünnib südamest ja mälestustest. Minu tee keraamikani sai alguse juba lapsepõlvekodus, kus saviesemed olid alati au sees. Armastuse keraamika vastu pärisin oma emalt – see kasvas minuga koos ja jõudis lõpuks minu tööde tuumani.\n\nJoonistan, lõikan, põletan ja õmblen – iga ese, mille loon, kannab endas midagi isiklikku. Inspiratsiooni leian loodusest, lihtsatest vormidest ja elu vahehetkedest. Mulle on olulised rahulikud jooned, puhas disain ning taimemotiivid, mis lisavad esemetele elu ja rütmi.',
        image_url: ''
      },
      story: {
        title: 'Minu lugu',
        content: 'Minu looming ühendab mineviku pärandi ja kaasaegse esteetika. Tulemuseks on ainulaadsed käsitöötooted, mis sobivad nii argipäeva kui ka erilisteks hetkedeks. Olgu selleks tass, millel on lapsepõlve varju, või kimono, mis jutustab loo – igas töös on midagi, mis puudutab.'
      },
      education: {
        title: 'Haridus',
        content: '• Tallinna Tööstushariduskeskus\n• Vana-Vigala Tehnika- ja Teeninduskool\n• Täiendavad kunstikursused lastekunstikoolis ja tarbekunsti suunal'
      },
      experience: {
        title: 'Kogemus',
        content: '• Pikaaegne õpetaja\n• Rätsep ja rõivadisaini praktiseerija\n• Aktiivselt tegutsev keraamik'
      },
      inspiration: {
        title: 'Inspiratsioon',
        content: '• Taimede motiivid, varjud ja mustrid\n• Vormid, värvid ja elatud mälestused\n• Igapäeva ilu ja looduslike materjalide tundlikkus'
      },
      cta: {
        title: 'Kutse',
        content: 'Huvitatud minu loomingust? Vaata, millised tööd on praegu saadaval.'
      }
    },
    en: {
      intro: {
        title: 'Introduction',
        content: 'I am Leen Väränen – a ceramicist and clothing designer whose work is born from the heart and memories. My journey to ceramics began in my childhood home, where clay objects were always held in high regard. I inherited my love for ceramics from my mother – it grew with me and eventually became the core of my work.\n\nI draw, cut, fire and sew – every object I create carries something personal within it. I find inspiration in nature, simple forms and life\'s fleeting moments. What matters to me are calm lines, clean design and plant motifs that add life and rhythm to objects.',
        image_url: ''
      },
      story: {
        title: 'My Story',
        content: 'My work combines the heritage of the past with contemporary aesthetics. The result is unique handcrafted products that suit both everyday life and special moments. Whether it\'s a cup that carries childhood shadows or a kimono that tells a story – there\'s something touching in every piece.'
      },
      education: {
        title: 'Education',
        content: '• Tallinn Industrial Education Centre\n• Vana-Vigala Technical and Service School\n• Additional art courses at children\'s art school and applied arts'
      },
      experience: {
        title: 'Experience',
        content: '• Long-time teacher\n• Tailor and clothing design practitioner\n• Actively working ceramicist'
      },
      inspiration: {
        title: 'Inspiration',
        content: '• Plant motifs, shadows and patterns\n• Forms, colors and lived memories\n• Everyday beauty and sensitivity of natural materials'
      },
      cta: {
        title: 'Call to Action',
        content: 'Interested in my work? See what pieces are currently available.'
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
      const { data, error } = await aboutPageService.getBilingualContent()
      
      if (error) {
        if (import.meta.env.DEV) {
          console.warn('Failed to load about page content from Supabase, using fallback data:', error)
        }
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
      if (import.meta.env.DEV) {
        console.warn('Error loading about page content, using fallback:', err)
      }
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
