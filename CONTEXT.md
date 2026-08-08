# Dev Notes — documentation-backend-devops

Personal backend/DevOps knowledge base built on Next.js (MDX + Tailwind). This context covers the
site's own domain vocabulary — how pages, sections, and (as of the bilingual effort) languages
are modeled — not the backend/DevOps subject matter the docs teach.

## Language

**Locale**:
The language variant of a page — `en` or `th` — selected by a path segment that comes before
`/docs` in the URL (e.g. `/en/docs/hooks`, `/th/docs/hooks`).
_Avoid_: Language (too generic — use Locale when referring to the URL-level selector)

**Canonical language**:
English. Every page's content is authored and technically verified in English first; the Thai
locale is a translation derived from it, never the other way around.
_Avoid_: Source language, primary language

**Default locale**:
English. Resolves at the unprefixed URL (`/docs/...`), unchanged from every URL that exists
today. Thai is always explicit (`/th/docs/...`); there is no unprefixed `/en/...`.
_Avoid_: Primary locale (use Canonical language for the content-authoring sense, Default locale
for the URL-routing sense — they're the same language today but are different concerns)
