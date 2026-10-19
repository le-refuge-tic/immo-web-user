import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Pages publiques déclarées dans le sitemap (les annonces sont rendues côté client). */
const PAGES_PUBLIQUES = ['/', '/search', '/login', '/register', '/mentions-legales', '/confidentialite']

/**
 * SEO selon l'environnement :
 * - VITE_SITE_URL : domaine public (https://…) pour les URL absolues (og:image, canonical, sitemap) ;
 * - VITE_ALLOW_INDEXING=true : seule la production l'active. Sinon (staging, previews)
 *   robots.txt interdit tout et chaque page porte noindex.
 */
function seo(siteUrl: string, allowIndexing: boolean): Plugin {
  const base = siteUrl.replace(/\/+$/, '')
  return {
    name: 'refuge-seo',
    transformIndexHtml(html) {
      const extra = allowIndexing
        ? (base ? `<link rel="canonical" href="${base}/" />\n    <meta property="og:url" content="${base}/" />` : '')
        : '<meta name="robots" content="noindex, nofollow" />'
      return html.replaceAll('%SITE_URL%', base).replace('</head>', `    ${extra}\n  </head>`)
    },
    generateBundle() {
      const robots = allowIndexing
        ? `User-agent: *\nAllow: /\nDisallow: /proprietaire\nDisallow: /demarcheur\nDisallow: /locataire\nDisallow: /profil\n${base ? `\nSitemap: ${base}/sitemap.xml\n` : ''}`
        : 'User-agent: *\nDisallow: /\n'
      this.emitFile({ type: 'asset', fileName: 'robots.txt', source: robots })
      if (allowIndexing && base) {
        const urls = PAGES_PUBLIQUES.map(p => `  <url><loc>${base}${p}</loc></url>`).join('\n')
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
        })
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // FE-F-006 : un build de production sans VITE_API_URL (ou en HTTP) doit échouer.
  if (mode === 'production') {
    const apiUrl = env.VITE_API_URL
    if (!apiUrl || !/^https:\/\//.test(apiUrl)) {
      throw new Error('VITE_API_URL doit être définie en HTTPS pour un build de production (ex: https://api.example.com/api/v1).')
    }
  }
  return { plugins: [react(), seo(env.VITE_SITE_URL ?? '', env.VITE_ALLOW_INDEXING === 'true')] }
})
