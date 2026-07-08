## Workflow

### Writing & previewing new posts (dev mode)

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
