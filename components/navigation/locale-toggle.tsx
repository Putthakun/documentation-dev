'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { cn } from '@/lib/utils'
import { type Locale, routing } from '@/i18n/routing'

export function LocaleToggle() {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('navbar')

  return (
    <div
      aria-label={t('languageToggle')}
      className="flex h-9 items-center gap-0.5 rounded-md border p-0.5"
      role="group"
    >
      {routing.locales.map((loc) => (
        <LocaleLink active={locale === loc} href={pathname} key={loc} locale={loc} />
      ))}
    </div>
  )
}

function LocaleLink({ active, href, locale }: { active: boolean; href: string; locale: Locale }) {
  return (
    <Link
      aria-current={active ? 'true' : undefined}
      className={cn(
        'rounded-sm px-2 py-1 text-xs font-semibold uppercase transition-colors',
        active
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-neutral-100 dark:hover:bg-neutral-900'
      )}
      href={href}
      locale={locale}
    >
      {locale}
    </Link>
  )
}
