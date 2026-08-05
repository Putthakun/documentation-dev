# Dev Notes

My personal backend & DevOps documentation site — Git, Golang, PostgreSQL, architecture patterns, and production practices, written up as I learn them so I don't have to relearn them later.

Built with Next.js, MDX, and Tailwind CSS.

## Running locally

```bash
pnpm install
pnpm generate-content-json
pnpm run dev
```

## Adding a new page

Content lives under `contents/docs/<slug>/index.mdx`. Add the page to the sidebar by editing `settings/documents.ts`. After adding or editing content, regenerate the search index:

```bash
pnpm run generate-content-json
```
