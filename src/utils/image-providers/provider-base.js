export class ImageProviderError extends Error {
  constructor(message, provider, status) {
    super(message);
    this.name = 'ImageProviderError';
    this.provider = provider;
    this.status = status;
  }
}

export class ImageResult {
  constructor({ url, photographer, photographerUrl, alt, width, height, source, license, blurHash }) {
    this.url = url;
    this.photographer = photographer;
    this.photographerUrl = photographerUrl;
    this.alt = alt;
    this.width = width;
    this.height = height;
    this.source = source;
    this.license = license;
    this.blurHash = blurHash;
    this.aspectRatio = width && height ? width / height : null;
  }
}

export class ImageProvider {
  constructor(config = {}) {
    this.config = config;
    this.name = 'base';
  }

  isAvailable() {
    return true;
  }

  async search(query, count = 10) {
    throw new Error('search() must be implemented by subclass');
  }
}
