import { PageRoutes } from '@/lib/pageroutes'

export type Navigation = {
  title: string
  href: string
  external?: boolean
}

export const Navigations: Navigation[] = [
  {
    title: 'Docs',
    href: `/docs${PageRoutes[0].href}`,
  },
]

export const GitHubLink = {
  href: '',
}
