const IDEAL_ASPECT = 1200 / 630;
const IDEAL_WIDTH = 1920;
const MIN_WIDTH = 800;
const MIN_HEIGHT = 400;

function relevancyScore(image, queries) {
  const text = [image.alt, image.photographer, image.source].join(' ').toLowerCase();
  let score = 0;
  for (const q of queries) {
    const words = q.toLowerCase().split(/\s+/);
    for (const w of words) {
      if (w.length > 2 && text.includes(w)) score += 2;
    }
  }
  return Math.min(score, 40);
}

function qualityScore(image) {
  let score = 0;
  if (image.width >= IDEAL_WIDTH) score += 15;
  else if (image.width >= 1200) score += 10;
  else if (image.width >= MIN_WIDTH) score += 5;

  if (image.height >= 800) score += 5;
  else if (image.height >= MIN_HEIGHT) score += 2;

  return score;
}

function aspectScore(image) {
  const ar = image.aspectRatio;
  if (!ar) return 0;
  const diff = Math.abs(ar - IDEAL_ASPECT);
  if (diff < 0.1) return 25;
  if (diff < 0.3) return 20;
  if (diff < 0.5) return 10;
  return 5;
}

function sourceScore(image) {
  switch (image.source) {
    case 'pexels': return 20;
    case 'unsplash': return 18;
    case 'pixabay': return 15;
    case 'openverse': return 10;
    default: return 5;
  }
}

function licenseScore(image) {
  const license = (image.license || '').toLowerCase();
  if (!license) return 0;
  if (license.includes('pexels') || license.includes('pixabay')) return 10;
  if (license.includes('unsplash')) return 8;
  if (license.includes('cc0') || license.includes('public domain')) return 8;
  if (license.includes('cc-by') || license.includes('creative commons')) return 5;
  return 3;
}

export function scoreImage(image, queries) {
  const r = relevancyScore(image, queries);
  const q = qualityScore(image);
  const a = aspectScore(image);
  const s = sourceScore(image);
  const l = licenseScore(image);

  return {
    total: r + q + a + s + l,
    breakdown: { relevancy: r, quality: q, aspect: a, source: s, license: l },
  };
}

export function selectBest(images, queries) {
  let best = null;
  let bestScore = -1;

  for (const img of images) {
    const result = scoreImage(img, queries);
    if (result.total > bestScore) {
      bestScore = result.total;
      best = { image: img, score: result };
    }
  }

  return best;
}
