import { ImageProvider, ImageResult, ImageProviderError } from './provider-base.js';

const BASE = 'https://pixabay.com/api';

export class PixabayProvider extends ImageProvider {
  constructor(config = {}) {
    super(config);
    this.name = 'pixabay';
    this.apiKey = config.pixabayKey || process.env.PIXABAY_API_KEY;
  }

  isAvailable() {
    return !!this.apiKey;
  }

  async search(query, count = 10) {
    if (!this.isAvailable()) {
      return [];
    }

    const url = `${BASE}/?key=${this.apiKey}&q=${encodeURIComponent(query)}&per_page=${count}&orientation=horizontal&image_type=photo`;
    const resp = await fetch(url, {
      signal: AbortSignal.timeout(8000),
    });

    if (!resp.ok) {
      throw new ImageProviderError(`Pixabay API error: ${resp.status}`, this.name, resp.status);
    }

    const data = await resp.json();
    return (data.hits || []).map((p) => new ImageResult({
      url: p.largeImageURL,
      photographer: p.user,
      photographerUrl: `https://pixabay.com/users/${p.user}-${p.user_id}/`,
      alt: p.tags || '',
      width: p.imageWidth,
      height: p.imageHeight,
      source: this.name,
      license: 'Pixabay License (free to use, no attribution required)',
    }));
  }
}
