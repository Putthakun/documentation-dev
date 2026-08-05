import { buttonVariants } from '@/components/ui/button'
import { PageRoutes } from '@/lib/pageroutes'
import { Link } from '@/lib/transition'

export default function Home() {
  return (
    <section className="flex min-h-[86.5vh] flex-col items-center justify-center px-2 py-8 text-center">
      <h1 className="mb-4 text-4xl font-bold sm:text-7xl">Dev Notes</h1>
      <p className="mb-8 max-w-150 text-foreground sm:text-base">
        My personal backend & DevOps knowledge base — Git, Golang, PostgreSQL, architecture, and
        the tools I use, explained so future-me never has to look it up twice.
      </p>

      <div className="flex items-center gap-5">
        <Link
          className={buttonVariants({ className: 'px-6', size: 'lg' })}
          href={`/docs${PageRoutes[0].href}`}
        >
          Get Started
        </Link>
      </div>
    </section>
  )
}
