import { siteConfig } from '../config/site.js';

/**
 * robots.txt, generated from the site config so the rules can never drift from
 * the noindex meta tag emitted by BaseHead.
 *
 * While this is an unapproved concept it disallows everything: a design concept
 * must never be indexed alongside — or above — the restaurant's live site.
 * Flipping siteConfig.deployment.allowIndexing to true switches both this file
 * and every page's meta robots tag over together.
 */
export function GET() {
  const origin = siteConfig.deployment.siteUrl.replace(/\/$/, '');

  const body = siteConfig.deployment.allowIndexing
    ? [
        '# All crawlers welcome.',
        'User-agent: *',
        'Allow: /',
        '',
        `Sitemap: ${origin}/sitemap.xml`,
        '',
      ].join('\n')
    : [
        '# UNAPPROVED DESIGN CONCEPT — deliberately excluded from search.',
        '# Urban Tadka\'s live website is at http://www.urbantadkadallas.com/',
        '# Set siteConfig.deployment.allowIndexing = true to publish.',
        'User-agent: *',
        'Disallow: /',
        '',
      ].join('\n');

  return new Response(body, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}
