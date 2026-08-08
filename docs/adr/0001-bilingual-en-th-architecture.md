# Bilingual (EN/TH) documentation architecture

The owner wants the site available in both English and Thai. We decided: English stays the
**canonical, default locale with no URL prefix** (`/docs/...` is unchanged from every URL that
exists today); Thai is explicit and prefixed (`/th/docs/...`). Content is stored as a file pair
per page (`index.mdx` + `index.th.mdx`) in the same folder rather than a mirrored `th/` tree, so a
missing translation is visible as a missing file next to its English sibling. UI chrome (navbar,
sidebar, buttons) is translated separately via `next-intl`, not through the MDX files. A page —
including stub/placeholder pages — does not ship in Thai until both files exist, and
`generate-content-json` is expected to enforce that at build time rather than relying on manual
diligence across a 68-page backlog.

## Considered options

- **Routing**: locale prefix before `/docs` (chosen) vs. after `/docs` (`/docs/th/...`) vs.
  subdomain (`th.antdocumentation.vercel.app`) vs. no URL distinction (cookie/localStorage only).
  Prefix-before-`/docs` was chosen because it's the standard Next.js i18n routing shape, keeps
  each locale independently indexable/shareable, and pairs cleanly with `next-intl`'s
  `localePrefix: 'as-needed'` mode for a prefix-less default locale.
- **Default locale**: English unprefixed (chosen) vs. redirecting every existing URL to an
  explicit `/en/...` prefix. Unprefixed was chosen specifically to avoid breaking URLs already
  shared or indexed (e.g. linked from external videos/posts) before this decision was made.
- **Rollout gating**: require 100% translation coverage before the Thai locale is reachable
  (chosen) vs. incremental rollout with an English-fallback banner on untranslated pages. Full
  gating was chosen over fallback to avoid a long-lived "half-translated site" state and the
  extra fallback-rendering logic that state would require.
- **i18n library for UI chrome**: `next-intl` (chosen) over a hand-rolled dictionary object,
  anticipating that locale-aware routing/middleware needs (default-locale-without-prefix,
  `generateStaticParams` per locale) are non-trivial enough to be worth the dependency rather than
  reimplementing them.

## Consequences

- Every future "add a page" workflow step gains a second required file and a second required
  sidebar field (`title_th`) — see `AGENTS.md`.
- The existing 68 English-only pages have no Thai counterpart yet. Until that backlog is
  translated, the Thai locale cannot launch under the gating rule above; translating it is
  deliberately scoped as separate follow-up work, not a side effect of this architectural change.
