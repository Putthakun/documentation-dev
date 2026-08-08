# Bilingual (EN/TH) Routing Infrastructure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stand up the routing/i18n plumbing decided in `docs/adr/0001-bilingual-en-th-architecture.md` — English unprefixed at `/docs/...`, Thai explicit at `/th/docs/...`, `title_th` in the sidebar, a `generate-content-json` build gate that fails on missing `index.th.mdx` — without translating any of the 68 existing page bodies. Sidebar/UI labels ARE translated as part of this plan (they're short strings, not page content); page bodies are explicitly out of scope and are separate follow-up work.

**Architecture:** Adopt `next-intl` on top of Next.js 16's App Router. Routes move under `app/[locale]/...`; a root `proxy.ts` (Next 16's renamed `middleware.ts`) resolves the locale and rewrites internally. `app/[locale]/layout.tsx` becomes the sole root layout (owns `<html lang>`), replacing today's `app/layout.tsx`. Existing href-construction call sites (`Navigations`, `PageRoutes`, breadcrumb, pagination, sidebar) are left untouched — locale-prefixing is centralized in two low-level primitives (`lib/transition`'s `Link`/`useRouter`, `usePathname` used for active-link matching) so the rest of the app stays locale-agnostic. `scripts/content.ts` gets a hard gate: any documented `href` missing its `index.th.mdx` fails `generate-content-json` (and therefore `pnpm run build`, via the `prebuild` hook).

**Tech Stack:** Next.js 16.3.0 (App Router, Proxy convention), `next-intl` (new dependency), existing `lib/transition` view-transition router, `tsx` for the content script, `pnpm`.

## Global Constraints

- English stays canonical and unprefixed at `/docs/...` — no existing URL changes.
- Thai is always explicit at `/th/docs/...` — no bare `/en/...` prefix.
- Every entry in `settings/documents.ts` (including nested `items`) needs both `title` and `title_th`.
- `contents/docs/<slug>/index.th.mdx` is what makes a page "shipped" in Thai — the gate checks file existence, not content quality.
- **This branch's `pnpm run build` is EXPECTED TO FAIL after Task 9** (0 of 68 pages have `index.th.mdx` yet) — that's the gate working as designed, not a bug. Do not "fix" it by relaxing the gate. Verification past Task 9 uses `pnpm run dev` + targeted checks, not a full production build.
- All work happens on a feature branch (`feat/bilingual-routing-infra`) — `main` is untouched and continues auto-deploying to production from its current state.
- Read `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md` before writing routing code — this Next.js version renamed `middleware.ts` → `proxy.ts` (`export function proxy(...)`, not `middleware`). Don't rely on training-data knowledge of "Next.js middleware."

---

### Task 0: Create the feature branch

**Files:** none (git only)

- [ ] **Step 1: Confirm a clean working tree and branch off `main`**

```bash
git status
git checkout -b feat/bilingual-routing-infra
```

Expected: `git status` shows a clean tree (this repo was clean as of the last check); the new branch is created and checked out.

---

### Task 1: Install next-intl and verify its current API

**Files:**
- Modify: `package.json`, `pnpm-lock.yaml` (via install)

**Interfaces:**
- Produces: confirmation that `defineRouting`, `createNavigation`, `createMiddleware`, `getRequestConfig`, `hasLocale`, `NextIntlClientProvider`, and `next-intl/plugin`'s default export exist with the signatures used in Tasks 2–4 below.

- [ ] **Step 1: Install**

```bash
pnpm add next-intl
```

- [ ] **Step 2: Verify the API surface actually installed matches what this plan assumes**

```bash
cat node_modules/next-intl/package.json | grep '"version"'
ls node_modules/next-intl/dist/types/*.d.ts 2>/dev/null || find node_modules/next-intl -maxdepth 2 -iname "*.md"
```

Read `node_modules/next-intl/README.md` (or the App Router getting-started doc it links to) and confirm: `defineRouting` lives at `next-intl/routing`, `createNavigation` at `next-intl/navigation`, `createMiddleware` at `next-intl/middleware`, `getRequestConfig` at `next-intl/server`, `hasLocale` at `next-intl`, and a default-exported plugin factory at `next-intl/plugin`. If any of these have moved or been renamed in the installed version, adjust the import paths in Tasks 2–4 accordingly before writing them — everything else in this plan (the routing/locale logic itself) is unaffected by where the import lives.

- [ ] **Step 3: Commit**

```bash
git add package.json pnpm-lock.yaml
git commit -m "Add next-intl dependency"
```

---

### Task 2: Add the i18n config module and message catalogs

**Files:**
- Create: `i18n/routing.ts`
- Create: `i18n/navigation.ts`
- Create: `i18n/request.ts`
- Create: `messages/en.json`
- Create: `messages/th.json`
- Modify: `next.config.ts`

**Interfaces:**
- Produces: `routing` (from `i18n/routing.ts`, exposes `.locales`, `.defaultLocale`), `Link`, `usePathname`, `useRouter`, `getPathname`, `redirect` (from `i18n/navigation.ts`) — these are what Tasks 5–7 import instead of `next/link` / `next/navigation`.

- [ ] **Step 1: `i18n/routing.ts`**

```ts
import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  locales: ['en', 'th'],
  defaultLocale: 'en',
  localePrefix: 'as-needed',
})

export type Locale = (typeof routing.locales)[number]
```

- [ ] **Step 2: `i18n/navigation.ts`**

```ts
import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
```

- [ ] **Step 3: `i18n/request.ts`**

```ts
import { hasLocale } from 'next-intl'
import { getRequestConfig } from 'next-intl/server'

import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  }
})
```

- [ ] **Step 4: `messages/en.json`**

```json
{
  "navbar": {
    "docsLink": "Docs",
    "githubLink": "View the repository on GitHub"
  },
  "search": {
    "placeholder": "Search..."
  }
}
```

- [ ] **Step 5: `messages/th.json`**

```json
{
  "navbar": {
    "docsLink": "เอกสาร",
    "githubLink": "ดู repository บน GitHub"
  },
  "search": {
    "placeholder": "ค้นหา..."
  }
}
```

- [ ] **Step 6: Wrap `next.config.ts` with the next-intl plugin**

```ts
import { type NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./i18n/request.ts')

const nextConfig: NextConfig = {
  experimental: {
    inlineCss: true,
    useTypeScriptCli: true,
  },
}

export default withNextIntl(nextConfig)
```

- [ ] **Step 7: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no new errors from the files created in this task (unrelated pre-existing errors, if any, are not this task's concern).

- [ ] **Step 8: Commit**

```bash
git add i18n messages next.config.ts
git commit -m "Add next-intl config, routing, and message catalogs"
```

---

### Task 3: Add the locale-resolving proxy

**Files:**
- Create: `proxy.ts`

**Interfaces:**
- Consumes: `routing` from `i18n/routing.ts` (Task 2).

- [ ] **Step 1: `proxy.ts`**

```ts
import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

export const proxy = createMiddleware(routing)

export const config = {
  // Skip _next internals, Vercel internals, and any request for a file with an extension
  // (favicon.ico, sitemap.xml, robots.txt, images, ...).
  matcher: '/((?!_next|_vercel|.*\\..*).*)',
}
```

Note the export name: this Next.js version calls this file convention "Proxy" (`export function proxy`), not "Middleware" — see the constraint at the top of this plan. `createMiddleware` is still next-intl's own function name; only the file/export it's assigned to changed.

- [ ] **Step 2: Commit**

```bash
git add proxy.ts
git commit -m "Add locale-resolving proxy"
```

---

### Task 4: Move routes under `app/[locale]/`

**Files:**
- Create: `app/[locale]/layout.tsx` (content moved from `app/layout.tsx`, plus locale handling)
- Delete: `app/layout.tsx`
- Move: `app/page.tsx` → `app/[locale]/page.tsx`
- Move: `app/not-found.tsx` → `app/[locale]/not-found.tsx`
- Move: `app/error.tsx` → `app/[locale]/error.tsx`
- Move: `app/docs/` → `app/[locale]/docs/` (directory move; contents touched in Task 5)

**Interfaces:**
- Consumes: `routing.locales` from `i18n/routing.ts`.
- Produces: every page under `app/[locale]/` now receives `params: Promise<{ locale: string }>` (merged with any of its own dynamic segments).

- [ ] **Step 1: Move the untouched files**

```bash
mkdir -p "app/[locale]"
git mv app/page.tsx "app/[locale]/page.tsx"
git mv app/not-found.tsx "app/[locale]/not-found.tsx"
git mv app/error.tsx "app/[locale]/error.tsx"
git mv app/docs "app/[locale]/docs"
```

- [ ] **Step 2: Write `app/[locale]/layout.tsx`**

This replaces `app/layout.tsx` — same metadata/providers/Navbar/Footer wiring as before, plus `<html lang={locale}>`, `NextIntlClientProvider`, and `generateStaticParams` for the two locales.

```tsx
import { type ReactNode } from 'react'
import { type Metadata } from 'next'
import { hasLocale } from 'next-intl'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { Inter } from 'next/font/google'
import { GoogleTagManager } from '@next/third-parties/google'

import { Footer } from '@/components/navigation/footer'
import { Navbar } from '@/components/navigation/navbar'
import { routing } from '@/i18n/routing'
import { Providers } from '@/providers'
import { Settings } from '@/types/settings'

import '@/styles/globals.css'

const inter = Inter({
  adjustFontFallback: true,
  display: 'swap',
  preload: true,
  subsets: ['latin'],
  variable: '--font-inter',
})

const baseUrl = Settings.metadataBase

export const metadata: Metadata = {
  title: Settings.title,
  metadataBase: new URL(baseUrl),
  description: Settings.description,
  keywords: Settings.keywords,
  openGraph: {
    type: Settings.openGraph.type,
    url: baseUrl,
    title: Settings.openGraph.title,
    description: Settings.openGraph.description,
    siteName: Settings.openGraph.siteName,
    images: Settings.openGraph.images.map((image) => ({
      ...image,
      url: `${baseUrl}${image.url}`,
    })),
  },
  twitter: {
    card: Settings.twitter.card,
    title: Settings.twitter.title,
    description: Settings.twitter.description,
    site: Settings.twitter.site,
    images: Settings.twitter.images.map((image) => ({
      ...image,
      url: `${baseUrl}${image.url}`,
    })),
  },
  publisher: Settings.name,
  alternates: {
    canonical: baseUrl,
  },
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

interface LocaleLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) notFound()

  const messages = await getMessages()

  return (
    <html data-scroll-behavior="smooth" lang={locale} suppressHydrationWarning>
      {Settings.gtmconnected && <GoogleTagManager gtmId={Settings.gtm} />}
      <body className={`${inter.variable} font-regular antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <Providers>
            <Navbar />
            <main className="h-auto px-5 sm:px-8">{children}</main>
            <Footer />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
```

- [ ] **Step 3: Delete the old root layout**

```bash
git rm app/layout.tsx
```

- [ ] **Step 4: Commit**

```bash
git add "app/[locale]"
git commit -m "Move routes under app/[locale] and make it the root layout"
```

(Task 5 fixes the doc page's own `params` type and `lib/markdown.ts` — the app won't build cleanly until that lands. That's expected mid-refactor; don't stop to verify a build here.)

---

### Task 5: Locale-aware content loading

**Files:**
- Modify: `lib/markdown.ts`
- Modify: `app/[locale]/docs/[[...slug]]/page.tsx`

**Interfaces:**
- Consumes: `getPathname` from `i18n/navigation.ts` (Task 2).
- Produces: `getDocument(slug: string, locale: string)`, `getTable(slug: string, locale: string)` — both now take a required `locale` param that Task 4's page component supplies.

- [ ] **Step 1: Update `lib/markdown.ts`'s path resolution to pick the file for the requested locale**

Change `documentPath`, `getDocumentPath`, `getDocument`, and `getTable`:

```ts
const documentPath = (slug: string, locale: string) => {
  const filename = locale === 'en' ? 'index.mdx' : `index.${locale}.mdx`
  return Settings.gitload
    ? `${GitHubLink.href}/raw/main/contents/docs/${slug}/${filename}`
    : path.join(process.cwd(), '/contents/docs/', `${slug}/${filename}`)
}

const getDocumentPath = (() => {
  const cache = new Map<string, string>()

  return (slug: string, locale: string) => {
    const key = `${locale}:${slug}`
    if (!cache.has(key)) {
      cache.set(key, documentPath(slug, locale))
    }
    return cache.get(key)!
  }
})()

export const getDocument = cache(async (slug: string, locale: string) => {
  try {
    const contentPath = getDocumentPath(slug, locale)

    let mdx = ''
    let lastUpdated: string | null = null

    if (Settings.gitload) {
      const response = await fetch(contentPath)

      if (!response.ok) {
        throw new Error(`Failed to fetch content`)
      }

      mdx = await response.text()
      lastUpdated = response.headers.get('Last-Modified') ?? null
    } else {
      mdx = await fs.readFile(contentPath, 'utf-8')

      const stats = await fs.stat(contentPath)
      lastUpdated = stats.mtime.toISOString()
    }

    const parsedMdx = await parseMdx<MdxHeaders>(mdx)
    const tocs = await getTable(slug, locale)

    return {
      frontmatter: parsedMdx.frontmatter,
      content: parsedMdx.content,
      tocs,
      lastUpdated,
    }
  } catch (err) {
    console.error(err)
    return null
  }
})
```

And `getTable`'s signature/body:

```ts
export async function getTable(
  slug: string,
  locale: string
): Promise<{ level: number; text: string; href: string }[]> {
  const extractedHeadings: {
    level: number
    text: string
    href: string
  }[] = []

  const filename = locale === 'en' ? 'index.mdx' : `index.${locale}.mdx`

  let mdx = ''
  if (Settings.gitload) {
    const contentPath = `${GitHubLink.href}/raw/main/contents/docs/${slug}/${filename}`
    try {
      const response = await fetch(contentPath)
      if (!response.ok) {
        throw new Error(`Failed to fetch content from GitHub: ${response.statusText}`)
      }
      mdx = await response.text()
    } catch (error) {
      console.error('Error fetching content from GitHub:', error)
      return []
    }
  } else {
    const contentPath = path.join(process.cwd(), '/contents/docs/', `${slug}/${filename}`)
    try {
      const stream = createReadStream(contentPath, { encoding: 'utf-8' })
      for await (const chunk of stream) {
        mdx += chunk
      }
    } catch (error) {
      console.error('Error reading local file:', error)
      return []
    }
  }

  headingsRegex.lastIndex = 0

  let match = headingsRegex.exec(mdx)

  while (match !== null) {
    const level = match[1].length
    const text = match[2].trim()

    extractedHeadings.push({
      level,
      text,
      href: `#${innerslug(text)}`,
    })

    match = headingsRegex.exec(mdx)
  }

  return extractedHeadings
}
```

`getPreviousNext` is unchanged — page order is the same in both locales, it only reorders `PageRoutes` (structure), not content.

- [ ] **Step 2: Update `app/[locale]/docs/[[...slug]]/page.tsx` to read and pass `locale`**

```tsx
import { notFound } from 'next/navigation'

import { ArticleBreadcrumb } from '@/components/article/breadcrumb'
import { Pagination } from '@/components/article/pagination'
import { TableOfContents } from '@/components/toc'
import { Separator } from '@/components/ui/separator'
import { Typography } from '@/components/ui/typography'
import { getDocument } from '@/lib/markdown'
import { PageRoutes } from '@/lib/pageroutes'
import { Settings } from '@/types/settings'

interface PageProps {
  params: Promise<{ locale: string; slug: string[] }>
}

export default async function Pages({ params }: PageProps) {
  const { locale, slug = [] } = await params
  const pathName = slug.join('/')
  const res = await getDocument(pathName, locale)

  if (!res) notFound()

  const { frontmatter, content, tocs } = res

  return (
    <div className="flex items-start gap-10">
      <section className="flex-3">
        <ArticleBreadcrumb paths={slug} />
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold">{frontmatter.title}</h1>
          <p className="text-sm">{frontmatter.description}</p>
          <Separator />
        </div>
        <Typography>
          <section>{content}</section>
          <Pagination pathname={pathName} />
        </Typography>
      </section>
      <TableOfContents frontmatter={frontmatter} pathName={pathName} tocs={{ tocs }} />
    </div>
  )
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, slug = [] } = await params
  const pathName = slug.join('/')
  const res = await getDocument(pathName, locale)

  if (!res) return null

  const { frontmatter, lastUpdated } = res
  const localePrefix = locale === 'en' ? '' : `/${locale}`

  return {
    title: `${frontmatter.title} - ${Settings.title}`,
    description: frontmatter.description,
    keywords: frontmatter.keywords,
    ...(lastUpdated && {
      lastModified: new Date(lastUpdated).toISOString(),
    }),
    openGraph: {
      title: `${frontmatter.title} - ${Settings.openGraph.title}`,
      description: frontmatter.description || Settings.openGraph.description,
      url: `${Settings.metadataBase}${localePrefix}/docs/${pathName}`,
      siteName: Settings.openGraph.siteName,
      type: 'article',
      images: Settings.openGraph.images.map((image) => ({
        ...image,
        url: `${Settings.metadataBase}${image.url}`,
      })),
    },
    twitter: {
      title: `${frontmatter.title} - ${Settings.twitter.title}`,
      description: frontmatter.description || Settings.twitter.description,
      card: Settings.twitter.card,
      site: Settings.twitter.site,
      images: Settings.twitter.images.map((image) => ({
        ...image,
        url: `${Settings.metadataBase}${image.url}`,
      })),
    },
    alternates: {
      canonical: `${Settings.metadataBase}${localePrefix}/docs/${pathName}`,
    },
  }
}

export function generateStaticParams() {
  return PageRoutes.filter((item) => item.href).map((item) => ({
    slug: item.href.split('/').slice(1),
  }))
}
```

(`generateStaticParams` here returns only `slug` — Next.js takes the Cartesian product with the parent layout's `locale` params from Task 4.)

- [ ] **Step 3: Commit**

```bash
git add lib/markdown.ts "app/[locale]/docs/[[...slug]]/page.tsx"
git commit -m "Make document loading locale-aware"
```

---

### Task 6: Locale-prefix links and active-route matching at the primitive level

**Files:**
- Modify: `lib/transition/link.tsx`
- Modify: `lib/transition/use-transition-router.ts`
- Modify: `lib/transition/browser-native.ts`
- Modify: `components/anchor.tsx`
- Modify: `components/sidebar/sublink.tsx`
- Modify: `components/navigation/search.tsx`

**Interfaces:**
- Consumes: `Link`, `usePathname`, `useRouter` from `i18n/navigation.ts` (Task 2).
- Produces: every existing caller of the app's `Link` (from `@/lib/transition`) and `Anchor` keeps passing plain, unprefixed hrefs (e.g. `/docs/git-workflow`) — no call site outside this task changes.

This is the only task that touches locale-prefixing logic. Everywhere else in the app builds hrefs like `/docs${...}` exactly as it does today; these six files are where that gets turned into `/th/docs/...` when the current locale is Thai.

- [ ] **Step 1: `lib/transition/link.tsx`** — swap the underlying `next/link` for next-intl's locale-aware `Link`

```tsx
import { type UrlObject } from 'node:url'
import { type ComponentProps, type MouseEvent, useCallback } from 'react'

import { Link as LocaleLink } from '@/i18n/navigation'

import { useTransitionRouter } from './use-transition-router'

function isModifiedEvent(event: MouseEvent): boolean {
  const eventTarget = event.currentTarget as HTMLAnchorElement | SVGAElement
  const target = eventTarget.getAttribute('target')
  return (
    (target && target !== '_self') ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    (event.nativeEvent && event.button === 1)
  )
}

function shouldPreserveDefault(e: MouseEvent<HTMLAnchorElement>): boolean {
  const { nodeName } = e.currentTarget

  const isAnchorNodeName = nodeName.toUpperCase() === 'A'

  if (isAnchorNodeName && isModifiedEvent(e)) {
    return true
  }

  return false
}

const formatUrl = (url: string | UrlObject): string =>
  typeof url === 'string' ? url : new URL(url.pathname || '', window.location.href).toString()

export function Link(props: ComponentProps<typeof LocaleLink>) {
  const router = useTransitionRouter()

  const { as, href, onClick, replace, scroll, ...rest } = props

  const handleClick = useCallback(
    (e: MouseEvent<HTMLAnchorElement>) => {
      if (onClick) {
        onClick(e)
      }

      if (e.defaultPrevented) {
        return
      }

      if ('startViewTransition' in document) {
        if (shouldPreserveDefault(e)) {
          return
        }

        e.preventDefault()

        const navigate = replace ? router.replace : router.push
        navigate(formatUrl(as ?? href), { scroll: scroll ?? true })
      }
    },
    [onClick, href, as, replace, scroll, router]
  )

  return <LocaleLink {...rest} as={as} href={href} onClick={handleClick} />
}
```

- [ ] **Step 2: `lib/transition/use-transition-router.ts`** — swap `useRouter` from `next/navigation` to `i18n/navigation`

Change only the import line:

```ts
import { useRouter as useNextRouter } from '@/i18n/navigation'
```

(replacing `import { useRouter as useNextRouter } from 'next/navigation'`). Everything else in the file is unchanged — next-intl's `useRouter` is a superset of the same `push`/`replace` interface and auto-localizes relative paths.

- [ ] **Step 3: `lib/transition/browser-native.ts`** — swap `usePathname`

Change only the import line:

```ts
import { usePathname } from '@/i18n/navigation'
```

(replacing `import { usePathname } from 'next/navigation'`). The rest of the file only uses `pathname` as a change-detection value, not for comparison against unprefixed hrefs, so this swap is purely for consistency.

- [ ] **Step 4: `components/anchor.tsx`** — swap `usePathname` so active-link matching compares against unprefixed hrefs regardless of locale

Change only the import line:

```ts
import { usePathname } from '@/i18n/navigation'
```

(replacing `import { usePathname } from 'next/navigation'`). next-intl's `usePathname` strips the locale prefix, so on `/th/docs/git-workflow` it still returns `/docs/git-workflow` — matching the plain hrefs `Anchor` is compared against exactly like on the English site.

- [ ] **Step 5: `components/sidebar/sublink.tsx`** — same swap, same reason (the sidebar's own `path.includes(props.href)` expand-on-active logic has the identical prefix problem)

Change only the import line:

```ts
import { usePathname } from '@/i18n/navigation'
```

(replacing `import { usePathname } from 'next/navigation'`).

- [ ] **Step 6: `components/navigation/search.tsx`** — fix the one hard navigation that bypasses `Link` entirely

Find:

```ts
window.location.href = `/docs${selected.href}`
```

Replace with a locale-aware version using `getPathname` from `i18n/navigation.ts` and the current locale (via `useLocale` from `next-intl`):

```ts
import { useLocale } from 'next-intl'
import { getPathname } from '@/i18n/navigation'
```

add `const locale = useLocale()` inside the `Search` component, then:

```ts
window.location.href = getPathname({ locale, href: `/docs${selected.href}` })
```

- [ ] **Step 7: Commit**

```bash
git add lib/transition components/anchor.tsx components/sidebar/sublink.tsx components/navigation/search.tsx
git commit -m "Localize navigation primitives (Link, useRouter, usePathname)"
```

---

### Task 7: Locale-aware sitemap and canonical URLs

**Files:**
- Modify: `app/sitemap.ts`

**Interfaces:**
- Consumes: `getPathname` from `i18n/navigation.ts`, `routing.locales` from `i18n/routing.ts`.

- [ ] **Step 1: Emit one entry per locale per page, with hreflang alternates**

```ts
import { type MetadataRoute } from 'next/types'

import { getPathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'
import { PageRoutes } from '@/lib/pageroutes'
import { Settings } from '@/types/settings'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString()

  const entries: MetadataRoute.Sitemap = [
    {
      url: `${Settings.metadataBase}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
  ]

  for (const page of PageRoutes) {
    const languages = Object.fromEntries(
      routing.locales.map((locale) => [
        locale,
        `${Settings.metadataBase}${getPathname({ locale, href: `/docs${page.href}` })}`,
      ])
    )

    for (const locale of routing.locales) {
      entries.push({
        url: languages[locale],
        lastModified,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: { languages },
      })
    }
  }

  return entries
}
```

`app/robots.ts` needs no change — it only references `Settings.metadataBase`, which is locale-independent.

- [ ] **Step 2: Commit**

```bash
git add app/sitemap.ts
git commit -m "Emit per-locale sitemap entries with hreflang alternates"
```

---

### Task 8: `title_th` in the sidebar config

**Files:**
- Modify: `lib/pageroutes.ts`
- Modify: `settings/documents.ts`
- Modify: `components/sidebar/sublink.tsx`

**Interfaces:**
- Produces: `Paths` type now requires `title_th: string` alongside `title` on every route entry.

- [ ] **Step 1: Add `title_th` to the `Paths` type in `lib/pageroutes.ts`**

```ts
export type Paths =
  | {
      title: string
      title_th: string
      href: string
      noLink?: true
      heading?: string
      heading_th?: string
      items?: Paths[]
    }
  | {
      spacer: true
    }
```

(`heading_th` added alongside `heading` for the same reason — section headings are UI chrome/sidebar labels too.)

- [ ] **Step 2: Populate `title_th`/`heading_th` for every entry in `settings/documents.ts`**

Replace the full file body with the Thai-labeled version (English `title`/`heading` values unchanged, Thai added):

```ts
import { type Paths } from '@/lib/pageroutes'

export const Documents: Paths[] = [
  {
    heading: 'Foundations',
    heading_th: 'พื้นฐาน',
    title: 'Git Workflow',
    title_th: 'การทำงานกับ Git',
    href: '/git-workflow',
    items: [
      { title: 'Introduction to Version Control', title_th: 'รู้จัก Version Control', href: '/introduction' },
      { title: 'Git Basics', title_th: 'พื้นฐาน Git', href: '/basics' },
      { title: 'Branching & Merging', title_th: 'Branching และ Merging', href: '/branching-merging' },
      { title: 'Rebase vs Merge', title_th: 'Rebase กับ Merge', href: '/rebase-vs-merge' },
      { title: 'Working with Remotes', title_th: 'การทำงานกับ Remote', href: '/remotes' },
      { title: 'Resolving Merge Conflicts', title_th: 'การแก้ Merge Conflict', href: '/resolving-conflicts' },
      { title: 'Undoing Changes', title_th: 'การย้อนกลับการเปลี่ยนแปลง', href: '/undoing-changes' },
      { title: 'Git Workflow Strategies', title_th: 'กลยุทธ์ Git Workflow', href: '/workflow-strategies' },
      { title: '.gitignore & Git Hooks', title_th: '.gitignore และ Git Hooks', href: '/gitignore-hooks' },
      { title: 'Best Practices Cheatsheet', title_th: 'Cheatsheet แนวทางปฏิบัติที่ดี', href: '/best-practices' },
    ],
  },
  {
    title: 'SQL / PostgreSQL Basics',
    title_th: 'พื้นฐาน SQL / PostgreSQL',
    href: '/sql-postgresql-basics',
    items: [
      { title: 'Introduction & Setup', title_th: 'เริ่มต้นและติดตั้ง', href: '/introduction' },
      { title: 'Tables & Data Types', title_th: 'Table และ Data Type', href: '/tables-data-types' },
      { title: 'Constraints & Keys', title_th: 'Constraint และ Key', href: '/constraints-keys' },
      { title: 'Querying Data', title_th: 'การ Query ข้อมูล', href: '/querying' },
      { title: 'Joins', title_th: 'Join', href: '/joins' },
      { title: 'Aggregation & Grouping', title_th: 'Aggregation และ Grouping', href: '/aggregation' },
      { title: 'Modifying Data', title_th: 'การแก้ไขข้อมูล', href: '/modifying-data' },
      { title: 'Transactions', title_th: 'Transaction', href: '/transactions' },
      { title: 'Indexes: The Basics', title_th: 'Index: พื้นฐาน', href: '/indexes' },
      { title: 'Using PostgreSQL from Go', title_th: 'การใช้ PostgreSQL จาก Go', href: '/using-from-go' },
    ],
  },
  {
    title: 'Golang Fundamentals',
    title_th: 'พื้นฐาน Golang',
    href: '/golang-fundamentals',
    items: [
      { title: 'Introduction & Setup', title_th: 'เริ่มต้นและติดตั้ง', href: '/introduction' },
      { title: 'Variables, Types & Constants', title_th: 'ตัวแปร ชนิดข้อมูล และค่าคงที่', href: '/variables-types' },
      { title: 'Control Flow', title_th: 'Control Flow', href: '/control-flow' },
      { title: 'Functions', title_th: 'ฟังก์ชัน', href: '/functions' },
      { title: 'Arrays, Slices & Maps', title_th: 'Array, Slice และ Map', href: '/collections' },
      { title: 'Pointers', title_th: 'Pointer', href: '/pointers' },
      { title: 'Structs & Methods', title_th: 'Struct และ Method', href: '/structs-methods' },
      { title: 'Interfaces', title_th: 'Interface', href: '/interfaces' },
      { title: 'Packages & Modules', title_th: 'Package และ Module', href: '/packages-modules' },
      { title: 'Errors: The Basics', title_th: 'Error: พื้นฐาน', href: '/errors-basics' },
    ],
  },
  {
    spacer: true,
  },
  {
    heading: 'Architecture & Design',
    heading_th: 'สถาปัตยกรรมและการออกแบบ',
    title: 'Software Architecture Patterns',
    title_th: 'Software Architecture Patterns',
    href: '/software-architecture-patterns',
  },
  {
    title: 'Design Patterns',
    title_th: 'Design Patterns',
    href: '/design-patterns',
  },
  {
    title: 'SOLID Principles',
    title_th: 'หลักการ SOLID',
    href: '/solid-principles',
  },
  {
    spacer: true,
  },
  {
    heading: 'Golang Best Practices',
    heading_th: 'แนวทางปฏิบัติที่ดีของ Golang',
    title: 'Code Organization',
    title_th: 'การจัดระเบียบโค้ด',
    href: '/code-organization',
  },
  {
    title: 'Error Handling',
    title_th: 'การจัดการ Error',
    href: '/error-handling',
  },
  {
    title: 'Concurrency',
    title_th: 'Concurrency',
    href: '/concurrency',
  },
  {
    title: 'Testing',
    title_th: 'การเขียน Test',
    href: '/testing',
  },
  {
    spacer: true,
  },
  {
    heading: 'Database',
    heading_th: 'ฐานข้อมูล',
    title: 'PostgreSQL Advanced',
    title_th: 'PostgreSQL ขั้นสูง',
    href: '/postgresql-advanced',
  },
  {
    title: 'Query Optimization',
    title_th: 'การปรับแต่ง Query',
    href: '/query-optimization',
  },
  {
    title: 'Migration Strategies',
    title_th: 'กลยุทธ์การทำ Migration',
    href: '/migration-strategies',
  },
  {
    spacer: true,
  },
  {
    heading: 'DevOps & Infrastructure',
    heading_th: 'DevOps และ Infrastructure',
    title: 'Linux & Shell Basics',
    title_th: 'พื้นฐาน Linux และ Shell',
    href: '/linux-shell',
  },
  {
    title: 'Docker & Containers',
    title_th: 'Docker และ Container',
    href: '/docker',
  },
  {
    title: 'Kubernetes',
    title_th: 'Kubernetes',
    href: '/kubernetes',
  },
  {
    title: 'CI/CD Pipelines',
    title_th: 'CI/CD Pipeline',
    href: '/ci-cd',
  },
  {
    title: 'Monitoring & Observability',
    title_th: 'Monitoring และ Observability',
    href: '/monitoring-observability',
  },
  {
    spacer: true,
  },
  {
    heading: 'Claude Code',
    heading_th: 'Claude Code',
    title: 'Slash Commands',
    title_th: 'Slash Command',
    href: '/slash-commands',
  },
  {
    title: 'Memory - CLAUDE.md',
    title_th: 'Memory - CLAUDE.md',
    href: '/claude-md',
  },
  {
    title: 'Context Window',
    title_th: 'Context Window',
    href: '/context-window',
  },
  {
    title: 'Hooks',
    title_th: 'Hook',
    href: '/hooks',
  },
  {
    title: 'Status Line',
    title_th: 'Status Line',
    href: '/status-line',
  },
  {
    title: 'Agent Skills',
    title_th: 'Agent Skill',
    href: '/agent-skills',
  },
  {
    title: 'Skills Ecosystem (skills.sh)',
    title_th: 'ระบบนิเวศ Skills (skills.sh)',
    href: '/skills-ecosystem',
  },
  {
    title: 'Subagents',
    title_th: 'Subagent',
    href: '/subagents',
  },
  {
    title: 'Agent Teams',
    title_th: 'Agent Team',
    href: '/agent-teams',
  },
  {
    title: 'tmux - Terminal Multiplexer',
    title_th: 'tmux - Terminal Multiplexer',
    href: '/tmux',
  },
  {
    title: 'Agent Teams with tmux',
    title_th: 'Agent Team กับ tmux',
    href: '/agent-teams-tmux',
  },
  {
    spacer: true,
  },
  {
    heading: 'Real-world Applications',
    heading_th: 'การประยุกต์ใช้งานจริง',
    title: 'Building APIs',
    title_th: 'การสร้าง API',
    href: '/building-apis',
  },
  {
    title: 'Microservices',
    title_th: 'Microservice',
    href: '/microservices',
  },
  {
    title: 'Production Checklist',
    title_th: 'Checklist สำหรับ Production',
    href: '/production-checklist',
  },
]
```

- [ ] **Step 3: Render `title_th` in the sidebar when the current locale is Thai**

In `components/sidebar/sublink.tsx`, import `useLocale` from `next-intl` and use it to pick the label:

```ts
import { useLocale } from 'next-intl'
```

Inside `SubLink`, after `const [isOpen, setIsOpen] = useState(true)`:

```ts
const locale = useLocale()
```

Change the destructure and render to use the locale-appropriate title:

```ts
const { title, title_th, href, items, noLink, level, isSheet } = props
const label = locale === 'th' ? title_th : title
```

and use `label` everywhere `title` was rendered (the `Comp` anchor's children, and the `<h2>` for `noLink` entries).

- [ ] **Step 4: Type-check**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors — every entry now satisfies the widened `Paths` type.

- [ ] **Step 5: Commit**

```bash
git add lib/pageroutes.ts settings/documents.ts components/sidebar/sublink.tsx
git commit -m "Add title_th/heading_th to the sidebar config and render it in Thai"
```

---

### Task 9: Content pipeline — locale-aware search index + the build gate

**Files:**
- Modify: `scripts/content.ts`

**Interfaces:**
- Produces: `generate-content-json` exits non-zero (and prints the list of missing files) if any documented route lacks `contents/docs/<slug>/index.th.mdx`. Also stops mis-slugging `index.th.mdx` files once they start to exist.

- [ ] **Step 1: Fix `createSlug` to recognize the `.th` locale suffix**

Currently `parsed.name === 'index'` is the only recognized index filename, so `index.th.mdx` (whose `path.parse` name is `'index.th'`) falls through to the generic branch and produces a wrong slug. Update:

```ts
function createSlug(filePath: string): string {
  const relativePath = path.relative(docsDir, filePath)
  const parsed = path.parse(relativePath)

  const isIndex = parsed.name === 'index' || parsed.name === 'index.th'

  if (isIndex) {
    const dir = parsed.dir.replace(/\\/g, '/')
    return dir ? `/${dir}` : '/'
  }

  const slugPath = parsed.dir ? `${parsed.dir}/${parsed.name}` : parsed.name
  return `/${slugPath.replace(/\\/g, '/')}`
}
```

- [ ] **Step 2: Track locale in `processMdxFile`'s output** so the search index doesn't silently merge English and Thai content under one slug

```ts
function localeOf(filePath: string): 'en' | 'th' {
  return path.basename(filePath) === 'index.th.mdx' ? 'th' : 'en'
}
```

In `processMdxFile`, compute `const locale = localeOf(filePath)` and add `locale` to the returned object:

```ts
return {
  slug,
  locale,
  title: frontmatter.title || (matchedDoc && isRoute(matchedDoc) ? matchedDoc.title : 'Untitled'),
  description: frontmatter.description || '',
  content: documentContent,
  _searchMeta: {
    cleanContent: cleanContentForSearch(documentContent),
    headings,
    keywords: Array.from(extractedKeywords),
  },
}
```

- [ ] **Step 3: Add the build gate** — walk every route in `Documents` (including nested `items`) and require a matching `index.th.mdx`

Add near the top-level helpers (reusing the existing `isRoute` type guard):

```ts
function collectDocSlugs(docs: Paths[], parentHref = ''): string[] {
  const slugs: string[] = []

  for (const doc of docs) {
    if (!isRoute(doc)) continue

    const fullHref = `${parentHref}${doc.href}`
    if (!doc.noLink) slugs.push(fullHref)

    if (doc.items) {
      slugs.push(...collectDocSlugs(doc.items, fullHref))
    }
  }

  return slugs
}

async function assertThaiTranslationsExist() {
  const slugs = collectDocSlugs(Documents)
  const missing: string[] = []

  for (const slug of slugs) {
    const thPath = path.join(docsDir, slug, 'index.th.mdx')
    try {
      await fs.access(thPath)
    } catch {
      missing.push(slug)
    }
  }

  if (missing.length > 0) {
    console.error(
      `generate-content-json: ${missing.length} page(s) are missing contents/docs/<slug>/index.th.mdx:`
    )
    for (const slug of missing) {
      console.error(`  - contents/docs${slug}/index.th.mdx`)
    }
    process.exit(1)
  }
}
```

- [ ] **Step 4: Call the gate at the start of `convertMdxToJson`**

```ts
async function convertMdxToJson() {
  try {
    await assertThaiTranslationsExist()
    await ensureDirectoryExists(outputDir)

    const mdxFiles = await getMdxFiles(docsDir)
    const combinedData = []

    for (const file of mdxFiles) {
      const jsonData = await processMdxFile(file)
      combinedData.push(jsonData)
    }

    const combinedOutputPath = path.join(outputDir, 'documents.json')
    await fs.writeFile(combinedOutputPath, JSON.stringify(combinedData, null, 2))
  } catch (err) {
    console.error('Error processing MDX files:', err)
  }
}
```

- [ ] **Step 5: Run it and confirm the gate fires as designed**

```bash
pnpm run generate-content-json
```

Expected: exit code `1`, with a printed list of all currently-untranslated `contents/docs/<slug>/index.th.mdx` paths (all 68, since none exist yet). This is correct — see the Global Constraints note. Do not weaken the gate to make this pass; the next phase of work (translating pages, tracked separately) is what turns it green.

- [ ] **Step 6: Commit**

```bash
git add scripts/content.ts
git commit -m "Gate generate-content-json on Thai translation coverage"
```

---

### Task 10: Wire the UI-chrome translation demo into the Navbar

**Files:**
- Modify: `components/navigation/navbar.tsx`

**Interfaces:**
- Consumes: `useTranslations` from `next-intl`, the `navbar.githubLink` message key (Task 2).

This closes the loop end-to-end: `messages/*.json` → `NextIntlClientProvider` (Task 4) → a real translated string on screen. Only the GitHub link's `aria-label`/`title` are wired here as the proof; translating every remaining UI string is left as follow-up (see the plan's Goal).

- [ ] **Step 1: Use the message key in `Navbar`**

```tsx
'use client'

import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { LuArrowUpRight, LuGithub } from 'react-icons/lu'

import { Anchor } from '@/components/anchor'
import { Logo } from '@/components/navigation/logo'
import { Search } from '@/components/navigation/search'
import { SheetLeft } from '@/components/sidebar'
import { buttonVariants } from '@/components/ui/button'
import { SheetClose } from '@/components/ui/sheet'
import { ModeToggle } from '@/components/ui/theme-toggle'
import { GitHubLink, Navigations } from '@/settings/navigation'

export function Navbar() {
  const t = useTranslations('navbar')

  return (
    <nav className="bg-opacity-5 sticky top-0 z-50 mx-auto flex h-16 w-full items-center justify-between border-b p-1 px-2 backdrop-blur-xl backdrop-filter sm:p-3 md:gap-2 md:px-4">
      <div className="flex items-center gap-5">
        <SheetLeft />
        <Logo />
        <div className="hidden items-center gap-5 text-sm font-medium text-muted-foreground md:flex">
          <NavMenu />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Search />
        <div className="flex gap-2 sm:ml-0">
          {GitHubLink.href && (
            <Link
              aria-label={t('githubLink')}
              className={buttonVariants({ variant: 'outline', size: 'icon-lg' })}
              href={GitHubLink.href}
              rel="noopener noreferrer"
              target="_blank"
              title={t('githubLink')}
            >
              <LuGithub className="size-4" />
            </Link>
          )}
          <ModeToggle />
        </div>
      </div>
    </nav>
  )
}

export function NavMenu({ isSheet = false }) {
  return (
    <>
      {Navigations.map((item) => {
        const Comp = (
          <Anchor
            absolute
            activeClassName="font-bold text-primary"
            className="flex items-center gap-1 text-sm"
            href={item.href}
            key={item.title + item.href}
            rel={item.external ? 'noopener noreferrer' : undefined}
            target={item.external ? '_blank' : undefined}
          >
            {item.title}{' '}
            {item.external && <LuArrowUpRight className="h-3 w-3 align-super" strokeWidth={3} />}
          </Anchor>
        )
        return isSheet ? (
          <SheetClose asChild key={item.title + item.href}>
            {Comp}
          </SheetClose>
        ) : (
          Comp
        )
      })}
    </>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add components/navigation/navbar.tsx
git commit -m "Translate the GitHub link via next-intl as the UI-chrome pattern"
```

---

### Task 11: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Type-check the whole project**

```bash
pnpm exec tsc --noEmit
```

Expected: no errors.

- [ ] **Step 2: Confirm the build gate is still (correctly) red**

```bash
pnpm run generate-content-json
```

Expected: exit code `1`, listing all untranslated pages — same as Task 9 Step 5. This confirms nothing later in the plan accidentally weakened the gate.

- [ ] **Step 3: Start the dev server and manually verify routing** (the gate only runs in `prebuild`/`generate-content-json`, not `next dev`, so this works despite Step 2)

```bash
pnpm run dev &
sleep 3
curl -sI http://localhost:3000/docs/git-workflow/introduction | head -1
curl -sI http://localhost:3000/th/docs/git-workflow/introduction | head -1
curl -sI http://localhost:3000/ | head -1
curl -sI http://localhost:3000/th | head -1
```

Expected:
- `/docs/git-workflow/introduction` → `200` (English content unchanged).
- `/th/docs/git-workflow/introduction` → `200` for the route (page renders, `notFound()` fires inside because `index.th.mdx` doesn't exist yet — this is a graceful 404 body, not a crash; check the terminal running `pnpm run dev` for a clean `getDocument` catch, not a stack trace).
- `/` → `200`.
- `/th` → `200`, with `<html lang="th">` in the response body and the sidebar showing Thai `title_th` labels.

- [ ] **Step 4: Manually open `http://localhost:3000/th` in a browser and confirm:**
  - The sidebar renders Thai labels (e.g. "การทำงานกับ Git" instead of "Git Workflow").
  - The GitHub icon's tooltip/aria-label reads "ดู repository บน GitHub".
  - Clicking a sidebar link navigates to `/th/docs/...` (stays in Thai), not back to `/docs/...`.
  - Then open `http://localhost:3000/docs/git-workflow/introduction` and confirm English is fully unchanged from before this branch.

- [ ] **Step 5: Stop the dev server**

```bash
kill %1
```

- [ ] **Step 6: Push the branch**

```bash
git push -u origin feat/bilingual-routing-infra
```

Do **not** merge to `main` yet — per the Global Constraints, `main` auto-deploys and this branch's `pnpm run build` is expected to fail until the translation backlog (separate, future work) lands.

---

## Summary of what's deliberately NOT in this plan

- Translating any of the 68 pages' `index.th.mdx` bodies — tracked as separate follow-up work per the ADR.
- Translating every remaining UI string (search dialog contents, footer, breadcrumb "Home" label, pagination "Previous"/"Next", 404/error page copy) — Task 10 establishes the pattern with one string; the rest is mechanical repetition of that pattern once someone works through the page-translation backlog anyway.
- Enabling `th` as reachable in production — that's a consequence of the build gate (Task 9) staying red until translations exist, not a separate switch to flip.
