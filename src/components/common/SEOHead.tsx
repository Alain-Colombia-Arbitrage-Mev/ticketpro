import { useEffect } from 'react';
import { useLanguage } from '../../hooks/useLanguage';

export interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'event' | 'article';
  event?: {
    name: string;
    startDate: string;
    endDate?: string;
    location: {
      name: string;
      address: string;
    };
    price?: string;
    image?: string;
  };
  noindex?: boolean;
  nofollow?: boolean;
}

const DEFAULT_SEO = {
  siteName: 'TicketPro',
  defaultTitle: 'TicketPro - Tu plataforma de eventos y boletos',
  defaultDescription: 'Descubre y compra boletos para los mejores eventos: conciertos, deportes, teatro, comedia y más. Compra segura y rápida.',
  defaultImage: '/og-image.jpg',
  twitterHandle: '@ticketpro',
  siteUrl: typeof window !== 'undefined' ? window.location.origin : 'https://tiquetera.com',
};

export function SEOHead({ seo }: { seo: SEOData }) {
  const { language } = useLanguage();
  
  useEffect(() => {
    const langCode = language === 'es' ? 'es' : language === 'pt' ? 'pt' : 'en';
    
    // Actualizar título
    document.title = seo.title || DEFAULT_SEO.defaultTitle;
    
    // Actualizar lang del HTML
    document.documentElement.lang = langCode;
    
    // Función auxiliar para actualizar o crear meta tags
    const updateMetaTag = (property: string, content: string, isProperty = false) => {
      if (!content) return;
      
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${property}"]`) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, property);
        document.head.appendChild(tag);
      }
      
      tag.content = content;
    };
    
    // Función para actualizar o crear link tags
    const updateLinkTag = (rel: string, href: string, attributes?: Record<string, string>) => {
      if (!href) return;
      
      let tag = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!tag) {
        tag = document.createElement('link');
        tag.rel = rel;
        document.head.appendChild(tag);
      }
      
      tag.href = href;
      
      if (attributes) {
        Object.entries(attributes).forEach(([key, value]) => {
          tag.setAttribute(key, value);
        });
      }
    };
    
    // Meta tags básicos
    updateMetaTag('description', seo.description || DEFAULT_SEO.defaultDescription);
    updateMetaTag('keywords', seo.keywords || 'eventos, boletos, conciertos, deportes, teatro, tickets, compra online');
    updateMetaTag('author', DEFAULT_SEO.siteName);
    updateMetaTag('robots', `${seo.noindex ? 'noindex' : 'index'}, ${seo.nofollow ? 'nofollow' : 'follow'}`);
    updateMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    
    // Open Graph tags
    updateMetaTag('og:title', seo.title || DEFAULT_SEO.defaultTitle, true);
    updateMetaTag('og:description', seo.description || DEFAULT_SEO.defaultDescription, true);
    updateMetaTag('og:image', seo.image || seo.event?.image || DEFAULT_SEO.defaultImage, true);
    updateMetaTag('og:url', seo.url || window.location.href, true);
    updateMetaTag('og:type', seo.type || (seo.event ? 'event' : 'website'), true);
    updateMetaTag('og:site_name', DEFAULT_SEO.siteName, true);
    updateMetaTag('og:locale', langCode === 'es' ? 'es_MX' : langCode === 'pt' ? 'pt_BR' : 'en_US', true);
    
    // Twitter Card tags
    updateMetaTag('twitter:card', 'summary_large_image');
    updateMetaTag('twitter:title', seo.title || DEFAULT_SEO.defaultTitle);
    updateMetaTag('twitter:description', seo.description || DEFAULT_SEO.defaultDescription);
    updateMetaTag('twitter:image', seo.image || seo.event?.image || DEFAULT_SEO.defaultImage);
    updateMetaTag('twitter:site', DEFAULT_SEO.twitterHandle);
    updateMetaTag('twitter:creator', DEFAULT_SEO.twitterHandle);
    
    // Canonical URL
    updateLinkTag('canonical', seo.url || window.location.href.split('?')[0].split('#')[0]);
    
    // Event-specific Open Graph tags
    if (seo.event) {
      updateMetaTag('event:start_time', seo.event.startDate, true);
      if (seo.event.endDate) {
        updateMetaTag('event:end_time', seo.event.endDate, true);
      }
      updateMetaTag('event:location', seo.event.location.address, true);
    }
    
    // Datos estructurados JSON-LD
    let structuredDataScript = document.getElementById('structured-data') as HTMLScriptElement;
    if (!structuredDataScript) {
      structuredDataScript = document.createElement('script');
      structuredDataScript.id = 'structured-data';
      structuredDataScript.type = 'application/ld+json';
      document.head.appendChild(structuredDataScript);
    }
    
    const structuredData: any = {
      '@context': 'https://schema.org',
      '@type': seo.event ? 'Event' : 'WebSite',
      name: seo.title || DEFAULT_SEO.defaultTitle,
      description: seo.description || DEFAULT_SEO.defaultDescription,
      url: seo.url || window.location.href.split('?')[0].split('#')[0],
    };
    
    if (seo.event) {
      structuredData['@type'] = 'Event';
      structuredData.name = seo.event.name;
      structuredData.startDate = seo.event.startDate;
      if (seo.event.endDate) {
        structuredData.endDate = seo.event.endDate;
      }
      structuredData.location = {
        '@type': 'Place',
        name: seo.event.location.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: seo.event.location.address,
        },
      };
      if (seo.event.image) {
        structuredData.image = seo.event.image;
      }
      if (seo.event.price) {
        structuredData.offers = {
          '@type': 'Offer',
          price: seo.event.price.replace(/[^0-9.]/g, ''),
          priceCurrency: 'MXN',
          availability: 'https://schema.org/InStock',
          url: seo.url || window.location.href,
        };
      }
    } else {
      structuredData.potentialAction = {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: `${window.location.origin}/#events?q={search_term_string}`,
        },
        'query-input': 'required name=search_term_string',
      };
    }
    
    structuredDataScript.textContent = JSON.stringify(structuredData);
    
    // Alternate languages
    const alternateLinks = ['es', 'en', 'pt'].filter(lang => lang !== langCode);
    alternateLinks.forEach(lang => {
      const href = `${window.location.origin}${window.location.pathname}?lang=${lang}`;
      updateLinkTag('alternate', href, { hreflang: lang });
    });
    
  }, [seo, language]);
  
  return null;
}

