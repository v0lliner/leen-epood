// This file now serves as a fallback for static data
// In production, products will be loaded from Supabase database

export const products = [
  {
    id: 1,
    slug: 'kasitoo-vaas-malestus',
    category: 'keraamika',
    subcategory: 'vaasid',
    title: 'Käsitöövaas "Mälestus"',
    price: '85€',
    description: 'Käsitsi vormitud ja glasuuritud vaas, iga ese on ainulaadne. Inspireeritud lapsepõlvemälestustest ja looduse vormidest.',
    image: 'https://images.pexels.com/photos/4207892/pexels-photo-4207892.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 25,
      width: 15,
      depth: 15
    },
    available: true
  },
  {
    id: 2,
    slug: 'linane-suvekleit',
    category: 'omblus',
    subcategory: 'roivad',
    title: 'Linane suvekleit',
    price: '120€',
    description: 'Käsitsi õmmeldud kleit looduslikust linasest kangast. Mugav ja hingav, sobib igapäevaseks kandmiseks.',
    image: 'https://images.pexels.com/photos/7148430/pexels-photo-7148430.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 110,
      width: 50,
      depth: 2
    },
    available: true
  },
  {
    id: 3,
    slug: 'kohvitasside-komplekt',
    category: 'keraamika',
    subcategory: 'tassid',
    title: 'Kohvitasside komplekt',
    price: '65€',
    description: 'Dreitud tasside komplekt 4 tükki, mattkasiin. Iga tass on käsitsi vormitud ja ainulaadne.',
    image: 'https://images.pexels.com/photos/4226894/pexels-photo-4226894.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 8,
      width: 8,
      depth: 8
    },
    available: false
  },
  {
    id: 4,
    slug: 'kasitoo-ehed-korvarõngad',
    category: 'omblus',
    subcategory: 'kaunistused',
    title: 'Käsitööehed kõrvarõngad',
    price: '35€',
    description: 'Keraamikast kõrvarõngad, käsitsi vormitud ja maalitud. Kerged ja mugavad igapäevaseks kandmiseks.',
    image: 'https://images.pexels.com/photos/6069062/pexels-photo-6069062.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 3,
      width: 2,
      depth: 1
    },
    available: true
  },
  {
    id: 5,
    slug: 'villane-kimono',
    category: 'omblus',
    subcategory: 'kimonod',
    title: 'Villane kimono',
    price: '180€',
    description: 'Käsitööna kootud kimono looduslikust villast. Soe ja mugav, sobib nii kodus kui väljas kandmiseks.',
    image: 'https://images.pexels.com/photos/6069101/pexels-photo-6069101.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 120,
      width: 60,
      depth: 3
    },
    available: true
  },
  {
    id: 6,
    slug: 'savi-kausid-komplekt',
    category: 'keraamika',
    subcategory: 'kausid',
    title: 'Savikausid komplekt',
    price: '95€',
    description: 'Käsitsi vormitud kausid, sobivad nii toidu serveerimiseks kui dekoratsiooniks. Komplektis 3 erinevat suurust.',
    image: 'https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 6,
      width: 20,
      depth: 20
    },
    available: true
  },
  {
    id: 7,
    slug: 'keraamika-alused',
    category: 'keraamika',
    subcategory: 'alused',
    title: 'Keraamika alused',
    price: '45€',
    description: 'Käsitsi valmistatud alused kuumade nõude jaoks. Praktiline ja ilus lahendus köögis.',
    image: 'https://images.pexels.com/photos/6479546/pexels-photo-6479546.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 1,
      width: 15,
      depth: 15
    },
    available: true
  },
  {
    id: 8,
    slug: 'looduslik-vest',
    category: 'omblus',
    subcategory: 'roivad',
    title: 'Looduslik vest',
    price: '90€',
    description: 'Käsitsi õmmeldud vest looduslikest materjalidest. Stiilne ja mugav, sobib erinevate riiete peale.',
    image: 'https://images.pexels.com/photos/7261706/pexels-photo-7261706.jpeg?auto=compress&cs=tinysrgb&w=800&h=600&dpr=2',
    dimensions: {
      height: 65,
      width: 45,
      depth: 2
    },
    available: true
  }
];

export const getProductBySlug = (slug) => {
  return products.find(product => product.slug === slug);
};

export const getProductsByCategory = (category) => {
  return products.filter(product => product.category === category);
};

export const getRelatedProducts = (product, limit = 3) => {
  return products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, limit);
};