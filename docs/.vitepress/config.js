import { defineConfig } from 'vitepress'

export default defineConfig({
  title: "Furniture Designer",
  description: "Parametric 3D furniture designer and cutlist generator",
  base: '/Furniture-Designer/',
  srcExclude: ['plans/**/*.md'],
  ignoreDeadLinks: true,
  locales: {
    root: {
      label: 'English',
      lang: 'en',
      themeConfig: {
        nav: [
          { text: 'Home', link: '/' },
          { text: 'Guide', link: '/design' }
        ],
        sidebar: [
          {
            text: 'User Guide',
            items: [
              { text: '1. 3D Design', link: '/design' },
              { text: '2. Manufacturing', link: '/manufacturing' },
              { text: '3. Assembly Tools', link: '/assembly' }
            ]
          }
        ]
      }
    },
    fr: {
      label: 'Français',
      lang: 'fr',
      title: 'Concepteur de Meubles',
      description: 'Conception 3D paramétrique et générateur de plan de découpe',
      themeConfig: {
        nav: [
          { text: 'Accueil', link: '/fr/' },
          { text: 'Guide', link: '/fr/design' }
        ],
        sidebar: [
          {
            text: 'Guide Utilisateur',
            items: [
              { text: '1. Conception 3D', link: '/fr/design' },
              { text: '2. Fabrication', link: '/fr/manufacturing' },
              { text: '3. Outils Numériques', link: '/fr/assembly' }
            ]
          }
        ]
      }
    }
  }
})
