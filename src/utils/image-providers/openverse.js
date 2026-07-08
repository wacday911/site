import { ImageProvider, ImageResult } from './provider-base.js';

const SEARCH_URL = 'https://api.openverse.engineering/v1/images';

export class OpenverseProvider extends ImageProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'openverse';
    this._rateLimit = 0;
  }

  async search(query, count = 10) {
    const now = Date.now();
    if (now < this._rateLimit) return [];
    this._rateLimit = now + 1100;

    try {
      const url = `${SEARCH_URL}?q=${encodeURIComponent(query)}&page_size=${Math.min(count, 20)}&license=cc0,cc-by,pdm&aspect_ratio=wide`;
      const resp = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000),
      });

      if (!resp.ok) {
        return [];
      }

      const data = await resp.json();
      return (data.results || []).map((p) => {
        const url = p.url || (p.thumbnail && p.thumbnail.split('?')[0]) || '';
        return new ImageResult({
          url,
          photographer: p.creator || 'Unknown',
          photographerUrl: p.creator_url || '',
          alt: p.title || '',
          width: p.width || p.filetype_width || 1200,
          height: p.height || p.filetype_height || 630,
          source: this.name,
          license: p.license_name || p.license || 'CC',
        });
      });
    } catch {
      return [];
    }
  }
}
