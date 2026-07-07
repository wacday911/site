// Ping Google & Bing to notify them of sitemap updates
// Usage: node scripts/ping-search-engines.js

const siteUrl = 'https://fyi.wisp.uno';
const sitemapUrl = `${siteUrl}/sitemap-index.xml`;

async function main() {
  const engines = [
    { name: 'Google', url: `https://www.google.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
    { name: 'Bing', url: `https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}` },
  ];

  for (const engine of engines) {
    try {
      const resp = await fetch(engine.url);
      console.log(`${engine.name}: ${resp.status} ${resp.statusText}`);
    } catch (err) {
      console.error(`${engine.name}: Failed — ${err.message}`);
    }
  }
}

main();
