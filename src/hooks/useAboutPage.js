import { useState, useEffect } from 'react'
import { aboutPageService } from '../utils/supabase/aboutPage'

/**
 * Custom hook for managing about page content
 * Falls back to static data if Supabase is not available
 */
export const useAboutPage = () => {
  const [content, setContent] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Fallback content matching current About page structure
  const fallbackContent = {
    intro: {
      title: 'Sissejuhatus',
      content: 'Olen Leen Väränen – keraamik ja rõivadisainer, kelle looming sünnib südamest ja mälestustest. Minu tee keraamikani sai alguse juba lapsepõlvekodus, kus saviesemed olid alati au sees. Armastuse keraamika vastu pärisin oma emalt – see kasvas minuga koos ja jõudis lõpuks minu tööde tuumani.\n\nJoonistan, lõikan, põletan ja õmblen – iga ese, mille loon, kannab endas midagi isiklikku. Inspiratsiooni leian loodusest, lihtsatest vormidest ja elu vahehetkedest. Mulle on olulised rahulikud jooned, puhas disain ning taimemotiivid, mis lisavad esemetele elu ja rütmi.',
      image_url: 'https://images.pexels.com/photos/6185765/pexels-photo-6185765.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
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
  }

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await aboutPageService.getOrganizedContent()
      
      if (error) {
        console.warn('Failed to load about page content from Supabase, using fallback data:', error)
        setContent(fallbackContent)
      } else {
        // If no content in database, use fallback data
        const hasContent = Object.keys(data).length > 0
        setContent(hasContent ? data : fallbackContent)
      }
    } catch (err) {
      console.warn('Error loading about page content, using fallback:', err)
      setContent(fallbackContent)
    } finally {
      setLoading(false)
    }
  }

  const getSection = (sectionKey) => {
    return content[sectionKey] || fallbackContent[sectionKey] || {}
  }

  return {
    content,
    loading,
    error,
    getSection,
    refetch: loadContent
  }
}