import { ImageProvider, ImageResult, ImageProviderError } from './provider-base.js';

const BASE = 'https://api.unsplash.com/search/photos';

export class UnsplashProvider extends ImageProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'unsplash';
    this.apiKey = config.unsplashKey || process.env.UNSPLASH_ACCESS_KEY;
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
      headers: { Authorization: `Client-ID ${this.apiKey}` },
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      throw new ImageProviderError(`Unsplash API error: ${resp.status}`, this.name, resp.status);
    }

    const data = await resp.json();
    return (data.results || []).map((p) => new ImageResult({
      url: p.urls.regular,
      photographer: p.user.name,
      photographerUrl: p.user.links.html,
      alt: p.alt_description || '',
      width: p.width,
      height: p.height,
      source: this.name,
      license: 'Unsplash License (free to use, attribution appreciated)',
    }));
  }
}
