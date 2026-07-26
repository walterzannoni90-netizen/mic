// Configurazione centralizzata del sito.
// Edita questo file per cambiare contatti, brand e contenuti statici.

export const siteConfig = {
  brand: {
    name: 'Back in Shape',
    tagline: 'Personal Training · Marzia Micillo',
    logoSrc: 'images/logo.jpeg',
    heroSrc: 'images/hero-marzia.jpeg',
  },
  contact: {
    address: 'Via Tullio Ostilio 8, Milano',
    email: 'marzia.micillo91@gmail.com',
    phone: '333 932 4861',
    phoneHref: 'tel:+393339324861',
    instagram: 'https://instagram.com/backinshape_marziamicillo',
    instagramHandle: '@backinshape_marziamicillo',
  },
  hours: {
    weekday: 'Lun – Ven: 8:00 – 20:00',
    weekdayBreak: 'Pausa: 13:00 – 14:00',
    saturday: 'Sabato: 8:00 – 13:00',
    sunday: 'Domenica: chiuso',
  },
  legal: {
    copyright: (year: number) => `© ${year} Marzia Micillo — Back in Shape`,
    privacyUrl: '/privacy',
    termsUrl: '/termini',
  },
} as const
