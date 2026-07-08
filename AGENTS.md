## Workflow

### Auto-deploy (Wisp production server)

The production server at `fyi.wisp.uno` runs `scripts/start.js` which:
- Keeps `astro dev` running with hot-reload
- Runs `git pull` every 2 minutes

New posts auto-deploy ~2 minutes after push. **No manual restart needed.**

The Wisp startup command should be set to:
```
cd /home/container && npm install && node scripts/start.js
```

### Writing & previewing new posts (local dev)

The dev server auto-detects new `.mdx` files and hot-reloads in the browser:

```
astro dev
```

For background mode (keeps terminal free):

```
astro dev --background
```

Manage with `astro dev stop`, `astro dev status`, and `astro dev logs`.
No restart needed when adding or editing posts.

### Generating blog images

Auto-generate featured images for posts that don't have one:

```
npm run gen-images
```

Uses Pollinations.ai (free, no API key). Generates a 1200×630 image based on the post title/description/tags, saves to `public/{slug}.jpg`, and updates frontmatter.

To regenerate all images (overwrites existing):

```
npm run gen-images:all
```

### Fetching real stock photos (Pexels/Unsplash/Pixabay)

For higher-quality real photos from stock image providers:

```
npm run fetch-image <slug>       # specific post
npm run fetch-image -- --all     # all posts without images
npm run fetch-image -- --dry-run # preview without downloading
```

Requires an API key in `.env`:
- `PEXELS_API_KEY` (preferred, free: https://www.pexels.com/api/)
- `UNSPLASH_ACCESS_KEY` (fallback, free: https://unsplash.com/developers)
- `PIXABAY_API_KEY` (fallback, free: https://pixabay.com/api/docs/)

Without any API key, falls back to Openverse (free CC-licensed images, no key needed).

The system:
1. Analyzes full blog content (title, description, tags, body)
2. Generates 5-10 search queries ranked by relevance
3. Searches providers in order (Pexels → Unsplash → Pixabay → Openverse)
4. Scores every image (0-100) based on relevance, quality, aspect ratio, source, and license
5. Downloads the top image to `public/`
6. Updates frontmatter with `image` and `imageAttribution` fields
7. Caches downloaded images in `.image-cache/`

### Building for production

Only run build when deploying to the live site:

```
npm run build
```

After deploy, ping search engines for faster indexing:

```
npm run ping:indexnow
```

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
