/**
 * Utilidades para SEO y URLs canónicas
 */

export const SITE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.VITE_SITE_URL || 'https://tiquetera.com';

/**
 * Genera una URL canónica para una página específica
 */
export function getCanonicalUrl(path: string = ''): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${cleanPath}`;
}

/**
 * Genera una URL canónica para un evento específico
 */
export function getEventCanonicalUrl(eventId: number, eventTitle?: string): string {
  const slug = eventTitle 
    ? eventTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    : `event-${eventId}`;
  return `${SITE_URL}/eventos/${slug}-${eventId}`;
}

/**
 * Genera una URL canónica para la página de eventos con filtros
 */
export function getEventsCanonicalUrl(filters?: {
  category?: string;
  city?: string;
  search?: string;
}): string {
  const params = new URLSearchParams();
  
  if (filters?.category && filters.category !== 'all') {
    params.append('categoria', filters.category);
  }
  
  if (filters?.city) {
    params.append('ciudad', filters.city);
  }
  
  if (filters?.search) {
    params.append('busqueda', filters.search);
  }
  
  const queryString = params.toString();
  return `${SITE_URL}/eventos${queryString ? `?${queryString}` : ''}`;
}

/**
 * Genera un sitemap básico en formato XML
 */
export function generateSitemapXml(pages: Array<{
  url: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}>): string {
  const urls = pages.map(page => {
    const lastmod = page.lastmod || new Date().toISOString().split('T')[0];
    const changefreq = page.changefreq || 'weekly';
    const priority = page.priority || 0.8;
    
    return `  <url>
    <loc>${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

/**
 * Genera robots.txt básico
 */
export function generateRobotsTxt(sitemapUrl?: string): string {
  const sitemapLine = sitemapUrl ? `\nSitemap: ${sitemapUrl}` : '';
  
  return `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/${sitemapLine}`;
}

/**
 * Genera structured data para breadcrumbs
 */
export function generateBreadcrumbStructuredData(items: Array<{
  name: string;
  url: string;
}>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Genera structured data para FAQ
 */
export function generateFAQStructuredData(questions: Array<{
  question: string;
  answer: string;
}>): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: questions.map(q => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  };
}









