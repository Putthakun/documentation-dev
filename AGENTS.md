<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Dev Notes — personal backend/DevOps documentation

A personal knowledge base built on the `rubix-documents` Next.js template (MDX + Tailwind).
The owner is a first-job backend/DevOps engineer writing this to learn and to avoid
re-looking-up the same things.

- Repo: `github.com/Putthakun/documentation-dev`
- Live: https://antdocumentation.vercel.app — Vercel deploys from `main` automatically,
  so **pushing to `main` deploys to production**.

## Communication

The owner prefers replies in **Thai**. Technical terms, commands, and code stay in English.
Documentation **content** is written in English only.

## Adding or editing a page

1. Content lives at `contents/docs/<slug>/index.mdx` — one folder per page, file-based routing.
2. **The sidebar is not automatic.** Every page must be declared in `settings/documents.ts`
   (`Paths[]`, type in `lib/pageroutes.ts`). Nested pages use `items:` with hrefs relative to
   the parent; `heading:` starts a section; `{ spacer: true }` divides groups.
3. Run `pnpm run generate-content-json` to rebuild the search index
   (`public/search-data/documents.json`). It also runs automatically via `prebuild`.

### Front matter

```yaml
---
title: Page Title
description: One sentence.
keywords: ["term", "term"]
---
```

**Quote any title containing a colon** — `title: "Errors: The Basics"`. An unquoted colon
breaks YAML parsing and fails `generate-content-json`.

### Gotchas that have already bitten

- **`<Card href>` needs the `/docs` prefix** (`/docs/git-workflow/basics`). The relative-href
  rule applies only to `settings/documents.ts`, not to Cards inside MDX.
- **Typing config arrays**: `Navigations` in `settings/navigation.ts` is explicitly typed so
  optional fields like `external` survive even when no entry uses them. Removing the last entry
  that used a field previously narrowed the inferred type and broke `navbar.tsx`'s type check.
  Run `pnpm run build` before pushing — `next dev` does not type-check.

### Available MDX components

Registered in `lib/components.ts`: `Mermaid`, `Note` (types: default / `success` / `warning` /
`danger`), `Card` / `CardGrid`, `Step` / `StepItem`, `Tabs`, `FileTree` / `Folder` / `File`.
Code fences support `showLineNumbers` and `title="file.go"`, and get a copy button automatically.

## Content style

Each page follows: **what it is → how to use it → best practices → a real example.** Medium
depth — enough to actually use the thing, not a language spec. Add a `<Mermaid>` diagram only
where it genuinely clarifies (slice memory layout, a decision tree, a git branch graph), not
decoratively. Close each page with a `<CardGrid>` card linking to the next page.

Topics with a dedicated page later in the taxonomy are deliberately **not** covered in depth
earlier — cover the mechanics and link forward instead (e.g. Golang Fundamentals covers
`if err != nil` but leaves wrapping and custom error types to the Error Handling page).

## Section status

Written in full (10 sub-pages each, nested under a parent with `items:`): **Git Workflow**,
**Golang Fundamentals**, **SQL / PostgreSQL Basics**.

Written in full (flat top-level pages, no `items:` nesting): **Architecture & Design** (3) —
Software Architecture Patterns, Design Patterns, SOLID Principles. **Golang Best Practices** (4) —
Code Organization, Error Handling, Concurrency, Testing.

Still placeholder stubs: Database (3), DevOps & Infrastructure (5), Real-world Applications (3).
Stubs use a `<Note type="warning">` work-in-progress block plus a "What to expect here" bullet
list, and carry `keywords` front matter like every other page.

Go code in the docs is verified against the local Go toolchain before committing — a snippet that
looked fine once shipped a `row, err := db.QueryRow(...)` that cannot compile. Paste self-contained
examples into a scratch module and run `go build ./... && go vet ./...`; check version-specific
claims against `$(go env GOROOT)/api/go1.N.txt` (that's how `sync.WaitGroup.Go` was pinned to
Go 1.25).

Note the two shapes: the three Foundations sections nest sub-pages under one parent entry, while
every later section is a flat list of top-level pages sharing one `heading:`. Keep whichever
shape a section already has — converting between them means restructuring
`settings/documents.ts` and moving folders.

## Commands

```bash
pnpm run dev                    # local dev server on :3000
pnpm run build                  # production build — ALWAYS run before pushing
pnpm run generate-content-json  # rebuild the search index
```
