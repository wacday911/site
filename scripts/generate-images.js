// Generate blog images from post frontmatter using Pollinations.ai (free, no API key)
// Usage: node scripts/generate-images.js [--all] [--dry-run]
//   --all: regenerate images for all posts (default: only missing)
//   --dry-run: show what would be generated without making API calls

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = join(__dirname, '..', 'public');
const BLOG = join(__dirname, '..', 'src', 'content', 'blog');

const WIDTH = 1200;
const HEIGHT = 630;

const args = process.argv.slice(2);
const ALL = args.includes('--all');
const DRY_RUN = args.includes('--dry-run');

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .replace(/-+/g, '-');
}

function buildPrompt(post) {
  const tags = post.tags || [];
  const tagText = tags.slice(0, 4).join(', ');
  return `Blog header image for "${post.title}". ${post.description || ''} Style: clean, modern, minimalist, flat vector illustration, warm colors, suitable for a blog post about ${post.category || 'tech'}.${tagText ? ` Themes: ${tagText}.` : ''} No text, no words, no letters. Professional blog featured image, 16:9 aspect ratio, high quality.`;
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
      // Remove quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Parse arrays
      if (value.startsWith('[') && value.endsWith(']')) {
        value = value.slice(1, -1).split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
      }
      // Parse booleans
      if (value === 'true') value = true;
      if (value === 'false') value = false;
      frontmatter[kv[1]] = value;
    }
  }

  return { ...frontmatter, _body: match[2], _rawFrontmatter: match[1] };
}

function updateFrontmatter(filePath, newImage) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return false;

  const fmLines = match[1].split('\n');
  let hasImage = false;
  const newFmLines = fmLines.map((line) => {
    if (/^image:/.test(line)) {
      hasImage = true;
      return `image: "${newImage}"`;
    }
    return line;
  });

  if (!hasImage) {
    // Find insertion point: before closing --- markers or after last field
    newFmLines.push(`image: "${newImage}"`);
  }

  const newContent = `---\n${newFmLines.join('\n')}\n---\n${match[2]}`;
  writeFileSync(filePath, newContent, 'utf-8');
  return true;
}

async function generateImage(prompt, outputPath) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${WIDTH}&height=${HEIGHT}&nofeed=true&model=flux`;

  if (DRY_RUN) {
    console.log(`  [DRY-RUN] Would fetch Pollinations.ai`);
    return true;
  }

  const resp = await fetch(url);
  if (!resp.ok) {
    throw new Error(`API returned ${resp.status}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  writeFileSync(outputPath, buffer);
  return true;
}

async function main() {
  console.log('=== Blog Image Generator ===\n');

  const files = readdirSync(BLOG).filter((f) => f.endsWith('.mdx'));
  console.log(`Found ${files.length} post(s)\n`);

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const file of files) {
    const filePath = join(BLOG, file);
    const post = parseMdx(filePath);
    if (!post) {
      console.error(`  [${file}] SKIPPED: could not parse frontmatter`);
      errors++;
      continue;
    }

    const title = post.title || file;
    const slug = slugify(title);
    const imageFile = `${slug}.jpg`;
    const imagePath = join(PUBLIC, imageFile);

    console.log(`\n[${file}]`);
    console.log(`  Title: ${title}`);

    const hasImageField = !!post.image;
    const slugImageExists = existsSync(imagePath);
    const existingImageExists = hasImageField && existsSync(join(PUBLIC, post.image.replace(/^\//, '')));

    if (!ALL && (slugImageExists || existingImageExists)) {
      console.log(`  Skipped (image exists: ${existingImageExists ? post.image : imageFile})`);
      skipped++;
      continue;
    }

    const prompt = buildPrompt(post);

    if (!DRY_RUN) {
      console.log(`  Generating: ${imageFile}`);
    }

    try {
      await generateImage(prompt, imagePath);
      if (!DRY_RUN) {
        const updated = updateFrontmatter(filePath, `/${imageFile}`);
        if (updated) {
          console.log(`  Updated frontmatter: image: "/${imageFile}"`);
        }
        console.log(`  Saved: public/${imageFile}`);
      } else {
        console.log(`  Prompt: ${prompt.slice(0, 120)}...`);
      }
      generated++;
    } catch (err) {
      console.error(`  ERROR: ${err.message}`);
      errors++;
    }

    if (!DRY_RUN) {
      await new Promise((r) => setTimeout(r, 600));
    }
  }

  console.log('\n=== Summary ===');
  console.log(`  Generated/ready: ${generated}`);
  console.log(`  Skipped:         ${skipped}`);
  console.log(`  Errors:          ${errors}`);

  if (DRY_RUN) {
    console.log('\n  (Dry run — no API calls made, no files written)');
  }
}

main().catch(console.error);
