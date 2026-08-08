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
