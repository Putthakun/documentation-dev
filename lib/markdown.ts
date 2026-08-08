import { createReadStream, promises as fs } from 'node:fs'
import path from 'node:path'
import { cache } from 'react'
import { compileMDX } from 'next-mdx-remote/rsc'
import { type Element, type Text } from 'hast'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import rehypeCodeTitles from 'rehype-code-titles'
import rehypeKatex from 'rehype-katex'
import rehypePrism from 'rehype-prism-plus'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import { type Node } from 'unist'
import { visit } from 'unist-util-visit'

import { components } from '@/lib/components'
import { PageRoutes } from '@/lib/pageroutes'
import { GitHubLink } from '@/settings/navigation'
import { Settings } from '@/types/settings'

declare module 'hast' {
  interface Element {
    raw?: string
  }
}

interface MdxHeaders {
  description: string
  keywords: string
  title: string
}

async function parseMdx<Frontmatter>(rawMdx: string) {
  return await compileMDX<Frontmatter>({
    source: rawMdx,
    options: {
      parseFrontmatter: true,
      mdxOptions: {
        rehypePlugins: [
          preCopy,
          rehypeCodeTitles,
          rehypeKatex,
          rehypePrism,
          rehypeSlug,
          rehypeAutolinkHeadings,
          postCopy,
        ],
        remarkPlugins: [remarkGfm],
      },
    },
    components,
  })
}

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

const headingsRegex = /^(#{2,4})\s(.+)$/gm

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

function innerslug(text: string) {
  return text
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5\-_]/g, '')
}

const pathIndexMap = new Map(PageRoutes.map((route, index) => [route.href, index]))

export function getPreviousNext(path: string) {
  const index = pathIndexMap.get(`/${path}`)

  if (index === undefined || index === -1) {
    return { prev: null, next: null }
  }

  const prev = index > 0 ? PageRoutes[index - 1] : null
  const next = index < PageRoutes.length - 1 ? PageRoutes[index + 1] : null

  return { prev, next }
}

const preCopy = () => (tree: Node) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName === 'pre') {
      const [codeEl] = node.children as Element[]
      if (codeEl?.tagName === 'code') {
        const textNode = codeEl.children?.[0] as Text
        node.raw = textNode?.value || ''
      }
    }
  })
}

const postCopy = () => (tree: Node) => {
  visit(tree, 'element', (node: Element) => {
    if (node.tagName === 'pre' && node.raw) {
      node.properties = node.properties || {}
      node.properties.raw = node.raw
    }
  })
}
