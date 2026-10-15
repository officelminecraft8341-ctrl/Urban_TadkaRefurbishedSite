import { siteConfig } from '../config/site.js';

/**
 * Sitemap, generated from an explicit route list rather than hand-maintained
 * XML, so adding a page cannot leave the sitemap stale.
 *
 * The restaurant's current site has no sitemap.xml and no robots.txt at all
 * (both return 404), so this is new ground rather than a repair.
 */
const ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'monthly' },
  { path: '/menu/', priority: '0.9', changefreq: 'weekly' },
  { path: '/visit/', priority: '0.8', changefreq: 'monthly' },
  { path: '/catering/', priority: '0.7', changefreq: 'monthly' },
  { path: '/about/', priority: '0.6', changefreq: 'yearly' },
  { path: '/gallery/', priority: '0.6', changefreq: 'monthly' },
  { path: '/privacy/', priority: '0.2', changefreq: 'yearly' },
];

export function GET() {
  const origin = siteConfig.deployment.siteUrl.replace(/\/$/, '');
  const lastmod = new Date().toISOString().slice(0, 10);

  const urlEntries = ROUTES.map(
    (route) => `  <url>
    <loc>${origin}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`,
  ).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}
