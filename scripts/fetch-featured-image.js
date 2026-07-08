// Fetch featured image for blog posts using Pexels + fallbacks
// Usage: node scripts/fetch-featured-image.js [slug] [--all] [--dry-run]
//   slug: specific post to process (default: all posts without images)
//   --all: reprocess all posts even if they have images
//   --dry-run: analyze and show results without downloading

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createProviders, searchAll } from '../src/utils/image-providers/index.js';
import { generateSearchQueries } from '../src/utils/image-analyzer.js';
import { selectBest } from '../src/utils/image-scorer.js';
import { downloadImage, clearCache } from '../src/utils/image-cache.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
const BLOG = join(__dirname, '..', 'src', 'content', 'blog');

const args = process.argv.slice(2);
const SPECIFIC_SLUG = args.find((a) => !a.startsWith('--'));
const ALL = args.includes('--all');
const DRY_RUN = args.includes('--dry-run');

function slugify(title) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/-+/g, '-');
}

function parseMdx(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return null;

  const frontmatter = {};
  const lines = match[1].split('\n');
  for (const line of lines) {
    const kv = line.match(/^(\w+):\s*(.+)$/);
    if (kv) {
      let value = kv[2].trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      }
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      frontmatter[kv[1]] = value;
    }
  }

  return { ...frontmatter, body: match[2], rawFrontmatter: match[1], _file: filePath };
}

function updateFrontmatter(filePath, image, attribution) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return;

  const lines = match[1].split('\n');
  const hasImage = lines.some((l) => /^image:/.test(l));
  const hasAttr = lines.some((l) => /^imageAttribution:/.test(l));

  const result = [];
  let inserted = false;
  for (const line of lines) {
    if (/^image:/.test(line)) {
      result.push(`image: "${image}"`);
      inserted = true;
    } else if (/^imageAttribution:/.test(line)) {
      // skip, we'll add at end
    } else {
      result.push(line);
    }
  }

  if (!inserted) {
    result.push(`image: "${image}"`);
  }

  if (attribution && !hasAttr) {
    result.push(`imageAttribution: "${attribution}"`);
  }

  writeFileSync(filePath, `---\n${result.join('\n')}\n---\n${match[2]}`, 'utf-8');
}

function loadEnv() {
  const envPath = join(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
      const match = line.match(/^\s*([^#=]+?)\s*=\s*["']?(.+?)["']?\s*$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    }
  }
}

async function generateAiFallback(title, slug) {
  console.log('  Falling back to AI-generated image (Pollinations.ai)...');
  const prompt = `Blog header image for "${title}". Clean, modern, minimalist, flat vector illustration, warm colors. No text, no words, no letters. Professional blog featured image, 16:9 aspect ratio.`;
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&nofeed=true&model=flux`;

  const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
  if (!resp.ok) throw new Error(`Pollinations.ai returned ${resp.status}`);

  const ext = 'jpg';
  const filename = `${slug}.${ext}`;
  const publicPath = join(PUBLIC, filename);
  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(publicPath, buffer);

  return { path: `/${filename}`, filename };
}

async function processPost(file, allMode) {
  const filePath = join(BLOG, file);
  const post = parseMdx(filePath);
  if (!post) {
    console.error(`  [${file}] SKIPPED: could not parse frontmatter`);
    return null;
  }

  const title = post.title || file;
  const slug = slugify(title);
  const hasImage = !!post.image;
  const imageExists = hasImage && existsSync(join(PUBLIC, post.image.replace(/^\//, '')));

  if (!allMode && hasImage && imageExists) {
    console.log(`  Skipped (image exists: ${post.image})`);
    return null;
  }

  const body = post.body || '';
  const queries = generateSearchQueries(title, post.description || '', post.category || 'tech', post.tags || [], body);

  console.log(`\n  Analyzing: ${title}`);
  console.log(`  Queries:`);
  queries.forEach((q, i) => console.log(`    ${i + 1}. ${q}`));

  if (DRY_RUN) {
    return { slug, title, queries, action: 'dry-run' };
  }

  // Try stock providers
  const providers = createProviders();
  let allImages = [];
  for (const q of queries) {
    try {
      const results = await searchAll(providers, q, 8);
      allImages.push(...results);
      if (results.length > 0) {
        console.log(`  Query "${q.slice(0, 50)}": ${results.length} images`);
      }
    } catch {
      // skip failed queries
    }
    if (allImages.length >= 30) break;
  }

  // Deduplicate by URL
  const seen = new Set();
  allImages = allImages.filter((img) => {
    if (seen.has(img.url)) return false;
    seen.add(img.url);
    return true;
  });

  if (allImages.length > 0) {
    console.log(`  Total unique images from providers: ${allImages.length}`);
  }

  if (allImages.length > 0) {
    const best = selectBest(allImages, queries);
    if (best) {
      const { image, score } = best;
      console.log(`  Best stock image: ${image.url} (score: ${score.total})`);
      console.log(`    Relevancy: ${score.breakdown.relevancy} | Quality: ${score.breakdown.quality} | Aspect: ${score.breakdown.aspect} | Source: ${score.breakdown.source} | License: ${score.breakdown.license}`);

      const downloadResult = await downloadImage(image.url, slug, 0);

      const attrParts = [`Photo by ${image.photographer}`];
      if (image.photographerUrl) attrParts.push(image.photographerUrl);
      attrParts.push(`Source: ${image.source}`);
      attrParts.push(`License: ${image.license}`);
      const attribution = attrParts.join(' | ');

      updateFrontmatter(filePath, downloadResult.path, attribution);
      console.log(`  Saved: ${downloadResult.path}`);
      console.log(`  Attribution: ${attribution}`);
      return { slug, title, image, score, downloadResult, action: 'success' };
    }
  }

  // Fallback: AI-generated image
  console.log('  No suitable stock photos found.');
  const fallback = await generateAiFallback(title, slug);
  updateFrontmatter(filePath, fallback.path, 'AI-generated image via Pollinations.ai');
  console.log(`  Saved (AI): ${fallback.path}`);
  return { slug, title, action: 'ai-fallback' };
}

async function main() {
  loadEnv();

  console.log('=== Featured Image Fetcher ===\n');

  const files = readdirSync(BLOG).filter((f) => f.endsWith('.mdx'));

  let filesToProcess;
  if (SPECIFIC_SLUG) {
    filesToProcess = files.filter((f) => f.includes(SPECIFIC_SLUG));
    if (filesToProcess.length === 0) {
      console.error(`No post found matching slug "${SPECIFIC_SLUG}"`);
      process.exit(1);
    }
  } else {
    filesToProcess = files;
  }

  console.log(`Found ${filesToProcess.length} post(s)\n`);

  let success = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of filesToProcess) {
    console.log(`\n[${file}]`);
    try {
      const result = await processPost(file, ALL || !!SPECIFIC_SLUG);
      if (!result) {
        skipped++;
      } else if (result.action === 'success') {
        success++;
      } else {
        errors++;
      }
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      errors++;
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Success: ${success}`);
  console.log(`  Skipped: ${skipped}`);
  console.log(`  Errors:  ${errors}`);

  if (DRY_RUN) {
    console.log('\n  (Dry run — no API calls made, no files downloaded)');
  }

  console.log('\nTo use API keys, create a .env file:');
  console.log('  PEXELS_API_KEY=your_key   (https://www.pexels.com/api/)');
  console.log('  UNSPLASH_ACCESS_KEY=key    (https://unsplash.com/developers)');
  console.log('  PIXABAY_API_KEY=key        (https://pixabay.com/api/docs/)');
}

main().catch(console.error);
