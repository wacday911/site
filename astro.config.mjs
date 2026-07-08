import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import mdx from '@astrojs/mdx';

export default defineConfig({
  site: 'https://fyi.wisp.uno',
  integrations: [
    sitemap({
      serialize(item) {
        if (item.url?.includes('/categories/') || item.url === 'https://fyi.wisp.uno/') {
          item.changefreq = 'daily';
          item.priority = 1.0;
        } else if (item.url?.includes('/search') || item.url?.includes('/about')) {
          item.changefreq = 'monthly';
          item.priority = 0.3;
        } else {
          item.changefreq = 'weekly';
          item.priority = 0.8;
        }
        return item;
      },
      lastmod: new Date(),
    }),
    mdx(),
  ],
  vite: {
    plugins: [tailwindcss()],
    preview: {
      allowedHosts: ['fyi.wisp.uno'],
    },
  },
  devToolbar: {
    enabled: false,
  },
});
