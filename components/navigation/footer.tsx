import Link from 'next/link'

import { Settings } from '@/types/settings'

export function Footer() {
  return (
    <footer className="flex h-16 w-full flex-wrap items-center justify-center gap-4 border-t px-2 py-3 text-sm text-foreground sm:justify-between sm:gap-0 sm:px-4 sm:py-0 lg:px-8">
      <p className="items-center">
        &copy; {new Date().getFullYear()}{' '}
        <Link
          aria-label={Settings.name}
          className="font-semibold"
          href={Settings.link}
          title={Settings.name}
        >
          {Settings.name}
        </Link>
        .
      </p>
    </footer>
  )
}
