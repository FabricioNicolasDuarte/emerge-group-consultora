export default defineEventHandler(async (event) => {
  const { public: { appUrl } } = useRuntimeConfig()
  const base = String(appUrl || '').replace(/\/$/, '')

  const paths = [
    '/',
    '/campus',
    '/nosotros',
    '/faq',
    '/privacidad',
    '/terminos',
    '/cookies',
  ]

  try {
    const supabase = serverSupabaseServiceRole(event)
    const { data } = await supabase
      .from('course_catalog')
      .select('slug')
      .order('title')

    for (const row of data ?? []) {
      if (row.slug) paths.push(`/campus/cursos/${row.slug}`)
    }
  } catch {
    // Sitemap estático si Supabase no está disponible en build/runtime
  }

  const urls = paths.map((path) => `
  <url>
    <loc>${base}${path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${path === '/' ? '1.0' : path === '/campus' ? '0.9' : '0.8'}</priority>
  </url>`).join('')

  setHeader(event, 'Content-Type', 'application/xml; charset=utf-8')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>`
})
