// Ping IndexNow after deployment
// Usage: node scripts/ping-indexnow.js <url>
// Example: node scripts/ping-indexnow.js https://fyi.wisp.uno

const siteUrl = process.argv[2] || 'https://fyi.wisp.uno';
const key = process.argv[3] || 'YOUR_INDEXNOW_KEY';

async function main() {
  console.log(`Pinging IndexNow for: ${siteUrl}`);
  const resp = await fetch(`https://api.indexnow.org/indexnow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      host: new URL(siteUrl).host,
      key,
      urlList: [`${siteUrl}/`, `${siteUrl}/sitemap-index.xml`],
    }),
  });
  console.log(`Status: ${resp.status}`);
  if (!resp.ok) {
    const text = await resp.text();
    console.error(`Error: ${text}`);
    process.exit(1);
  }
  console.log('IndexNow ping successful');
}

main();
