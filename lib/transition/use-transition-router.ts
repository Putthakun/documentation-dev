import { startTransition, useCallback, useMemo } from 'react'
import {
  type AppRouterInstance,
  type NavigateOptions,
} from 'next/dist/shared/lib/app-router-context.shared-runtime'
import { useRouter as useNextRouter } from '@/i18n/navigation'

import { useSetFinishViewTransition } from './transition-context'

export interface TransitionOptions {
  onTransitionReady?: () => void
}

type NavigateOptionsWithTransition = NavigateOptions & TransitionOptions

export type TransitionRouter = AppRouterInstance & {
  push: (href: string, options?: NavigateOptionsWithTransition) => void
  replace: (href: string, options?: NavigateOptionsWithTransition) => void
}

export function useTransitionRouter() {
  const router = useNextRouter()
  const finishViewTransition = useSetFinishViewTransition()

  const triggerTransition = useCallback(
    (cb: () => void, { onTransitionReady }: TransitionOptions = {}) => {
      if ('startViewTransition' in document) {
        const transition = document.startViewTransition(
          () =>
            new Promise<void>((resolve) => {
              startTransition(() => {
                cb()
                finishViewTransition(() => resolve)
              })
            })
        )

        if (onTransitionReady) {
          transition.ready.then(onTransitionReady)
        }
      } else {
        cb()
      }
    },
    [finishViewTransition]
  )

  const push = useCallback(
    (href: string, { onTransitionReady, ...options }: NavigateOptionsWithTransition = {}) => {
      triggerTransition(() => router.push(href, options), {
        onTransitionReady,
      })
    },
    [triggerTransition, router]
  )

  const replace = useCallback(
    (href: string, { onTransitionReady, ...options }: NavigateOptionsWithTransition = {}) => {
      triggerTransition(() => router.replace(href, options), {
        onTransitionReady,
      })
    },
    [triggerTransition, router]
  )

  return useMemo<TransitionRouter>(
    () => ({
      ...router,
      // next-intl's useRouter wraps the underlying Next.js router and forwards
      // all of its properties at runtime, but its declared type omits
      // `bfcacheId` (unused in this app) — fall back to keep this assignable
      // to `AppRouterInstance` without widening the type or using `any`.
      bfcacheId: (router as unknown as { bfcacheId?: string }).bfcacheId ?? '',
      push,
      replace,
    }),
    [push, replace, router]
  )
}
