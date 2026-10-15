import { defineConfig } from 'astro/config';
import { siteConfig } from './src/config/site.js';

// https://astro.build/config
export default defineConfig({
  // Canonical origin. Comes from src/config/site.js so a new client changes one
  // file. This is a design-to-review placeholder: swap it for the real domain
  // only once the restaurant confirms it.
  site: siteConfig.deployment.siteUrl,

  // Emit /menu/index.html so URLs are /menu/ rather than /menu.html.
  // Every internal link in the site uses that trailing-slash form.
  build: { format: 'directory' },

  // Static output: no server, no runtime, hostable on the restaurant's existing
  // Apache/PHP hosting or any static host.
  output: 'static',

  devToolbar: { enabled: false },

  compressHTML: true,
});
