import { type Paths } from '@/lib/pageroutes'

export const Documents: Paths[] = [
  {
    heading: 'Foundations',
    title: 'Git Workflow',
    href: '/git-workflow',
    items: [
      { title: 'Introduction to Version Control', href: '/introduction' },
      { title: 'Git Basics', href: '/basics' },
      { title: 'Branching & Merging', href: '/branching-merging' },
      { title: 'Rebase vs Merge', href: '/rebase-vs-merge' },
      { title: 'Working with Remotes', href: '/remotes' },
      { title: 'Resolving Merge Conflicts', href: '/resolving-conflicts' },
      { title: 'Undoing Changes', href: '/undoing-changes' },
      { title: 'Git Workflow Strategies', href: '/workflow-strategies' },
      { title: '.gitignore & Git Hooks', href: '/gitignore-hooks' },
      { title: 'Best Practices Cheatsheet', href: '/best-practices' },
    ],
  },
  {
    title: 'SQL / PostgreSQL Basics',
    href: '/sql-postgresql-basics',
    items: [
      { title: 'Introduction & Setup', href: '/introduction' },
      { title: 'Tables & Data Types', href: '/tables-data-types' },
      { title: 'Constraints & Keys', href: '/constraints-keys' },
      { title: 'Querying Data', href: '/querying' },
      { title: 'Joins', href: '/joins' },
      { title: 'Aggregation & Grouping', href: '/aggregation' },
      { title: 'Modifying Data', href: '/modifying-data' },
      { title: 'Transactions', href: '/transactions' },
      { title: 'Indexes: The Basics', href: '/indexes' },
      { title: 'Using PostgreSQL from Go', href: '/using-from-go' },
    ],
  },
  {
    title: 'Golang Fundamentals',
    href: '/golang-fundamentals',
    items: [
      { title: 'Introduction & Setup', href: '/introduction' },
      { title: 'Variables, Types & Constants', href: '/variables-types' },
      { title: 'Control Flow', href: '/control-flow' },
      { title: 'Functions', href: '/functions' },
      { title: 'Arrays, Slices & Maps', href: '/collections' },
      { title: 'Pointers', href: '/pointers' },
      { title: 'Structs & Methods', href: '/structs-methods' },
      { title: 'Interfaces', href: '/interfaces' },
      { title: 'Packages & Modules', href: '/packages-modules' },
      { title: 'Errors: The Basics', href: '/errors-basics' },
    ],
  },
  {
    spacer: true,
  },
  {
    heading: 'Architecture & Design',
    title: 'Software Architecture Patterns',
    href: '/software-architecture-patterns',
  },
  {
    title: 'Design Patterns',
    href: '/design-patterns',
  },
  {
    title: 'SOLID Principles',
    href: '/solid-principles',
  },
  {
    spacer: true,
  },
  {
    heading: 'Golang Best Practices',
    title: 'Code Organization',
    href: '/code-organization',
  },
  {
    title: 'Error Handling',
    href: '/error-handling',
  },
  {
    title: 'Concurrency',
    href: '/concurrency',
  },
  {
    title: 'Testing',
    href: '/testing',
  },
  {
    spacer: true,
  },
  {
    heading: 'Database',
    title: 'PostgreSQL Advanced',
    href: '/postgresql-advanced',
  },
  {
    title: 'Query Optimization',
    href: '/query-optimization',
  },
  {
    title: 'Migration Strategies',
    href: '/migration-strategies',
  },
  {
    spacer: true,
  },
  {
    heading: 'DevOps & Infrastructure',
    title: 'Linux & Shell Basics',
    href: '/linux-shell',
  },
  {
    title: 'Docker & Containers',
    href: '/docker',
  },
  {
    title: 'Kubernetes',
    href: '/kubernetes',
  },
  {
    title: 'CI/CD Pipelines',
    href: '/ci-cd',
  },
  {
    title: 'Monitoring & Observability',
    href: '/monitoring-observability',
  },
  {
    spacer: true,
  },
  {
    heading: 'Real-world Applications',
    title: 'Building APIs',
    href: '/building-apis',
  },
  {
    title: 'Microservices',
    href: '/microservices',
  },
  {
    title: 'Production Checklist',
    href: '/production-checklist',
  },
]
