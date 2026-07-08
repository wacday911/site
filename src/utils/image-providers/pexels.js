import { ImageProvider, ImageResult, ImageProviderError } from './provider-base.js';

const BASE = 'https://api.pexels.com/v1/search';

export class PexelsProvider extends ImageProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'pexels';
    this.apiKey = config.pexelsKey || process.env.PEXELS_API_KEY;
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async search(query, count = 10) {
    if (!this.isAvailable()) {
      return [];
    }

    const url = `${BASE}?query=${encodeURIComponent(query)}&per_page=${count}&orientation=landscape`;
    const resp = await fetch(url, {
      headers: { Authorization: this.apiKey },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      throw new ImageProviderError(`Pexels API error: ${resp.status}`, this.name, resp.status);
    }

    const data = await resp.json();
    return (data.photos || []).map((p) => new ImageResult({
      url: p.src.original,
      photographer: p.photographer,
      photographerUrl: p.photographer_url,
      alt: p.alt || '',
      width: p.width,
      height: p.height,
      source: this.name,
      license: 'Pexels Free License (free to use, no attribution required)',
    }));
  }
}
