// Sitemap submission for Google & Bing
// Google deprecated sitemap pings in 2023.
// Submit manually at:
//   Google: https://search.google.com/search-console
//   Bing:   https://www.bing.com/webmasters
//
// IndexNow (used below) handles Bing + other participating search engines.

const siteUrl = 'https://fyi.wisp.uno';
const sitemapUrl = `${siteUrl}/sitemap-index.xml`;

async function main() {
  console.log(`Sitemap: ${sitemapUrl}`);
  console.log('');
  console.log('Google: Submit sitemap manually at https://search.google.com/search-console');
  console.log('Bing:   IndexNow is used instead (run: npm run ping:indexnow)');
  console.log('');
  console.log('Done.');
}

main();
