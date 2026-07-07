export interface AffiliateConfig {
  tag: string;
  domain: string;
}

export const AMAZON: AffiliateConfig = {
  tag: 'wispybyte-21',
  domain: 'amazon.in',
};

export function buildAmazonUrl(path: string): string {
  const base = `https://www.${AMAZON.domain}/dp/`;
  const asin = path.replace(/[/?&]/g, '');
  return `${base}${asin}?tag=${AMAZON.tag}&linkCode=ogi&th=1&psc=1`;
}

export const affiliateLinks: Record<string, string> = {
  // Predefined short codes for common products
  // 'macbook-air': 'B0XXXXX',
};
