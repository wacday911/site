import { PexelsProvider } from './pexels.js';
import { UnsplashProvider } from './unsplash.js';
import { PixabayProvider } from './pixabay.js';
import { OpenverseProvider } from './openverse.js';

const PROVIDERS = [
  PexelsProvider,
  UnsplashProvider,
  PixabayProvider,
  OpenverseProvider,
];

export function createProviders(config = {}) {
  return PROVIDERS.map((P) => new P(config));
}

export async function searchAll(providers, query, count = 10) {
  const results = [];
  for (const provider of providers) {
    try {
      const images = await provider.search(query, count);
      results.push(...images);
    } catch {
      // provider failed — skip
    }
  }
  return results;
}
