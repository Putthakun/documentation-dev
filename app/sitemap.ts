import { type MetadataRoute } from 'next/types'

import { PageRoutes } from '@/lib/pageroutes'
import { Settings } from '@/types/settings'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date().toISOString()

  return [
    {
      url: `${Settings.metadataBase}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 1,
    },
    // Doc pages are served under /docs, so page.href needs that prefix.
    ...PageRoutes.map((page) => ({
      url: `${Settings.metadataBase}/docs${page.href}`,
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    })),
  ]
}
