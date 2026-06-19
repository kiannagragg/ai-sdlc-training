# Meridian LMS

Leave Management System for Meridian Corp — an employee self-service platform for submitting, approving, and managing leave requests across the organization.

## Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org) (strict mode)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL, RLS, Auth, Storage)
- **Email**: [Resend](https://resend.com)
- **Hosting**: [Vercel](https://vercel.com) (ap-southeast-1)

## Prerequisites

- Node.js >= 22
- npm or pnpm
- Supabase CLI (for local development)
- A Supabase project (local or cloud)

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local

# Fill in your Supabase project credentials in .env.local

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check formatting without writing |

## Project Structure

```
meridian-lms/
├── app/                    # Next.js App Router pages & API routes
│   ├── (auth)/             # Login & callback routes
│   ├── (dashboard)/        # Role-based dashboards
│   └── api/                # Route Handlers
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── lms/                # Domain-specific components
│   └── shared/             # Cross-cutting patterns
├── lib/
│   ├── supabase/           # Supabase client instances
│   ├── notifications/      # Email notification dispatcher
│   ├── utils.ts            # Utility functions
│   ├── validators.ts       # Zod schemas
│   └── errors.ts           # AppError class
├── types/                  # Supabase-generated types
├── supabase/               # Migrations, seed, config
└── knowledge/              # AI-assistance knowledge base
```

## Role-Based Access

| Route | Role | Permissions |
|-------|------|-------------|
| `/employee/*` | Employee | Submit & view own leaves |
| `/manager/*` | Manager | Approve/reject direct reports |
| `/admin/*` | HR Admin | Full leave & balance management |
| `/sysadmin/*` | System Admin | User profile & role management |

## Supabase Projects

| Environment | Project Name        | Region         | Project Ref          |
|-------------|--------------------|-----------------|-----------------------|
| Staging     | LMS-MC-Staging     | ap-southeast-1  | `your-staging-ref`   |
| Production  | LMS-MC-Production  | ap-southeast-1  | `your-production-ref`|

### Connection Strings

Both environments use Supabase's built-in Supavisor pooler in transaction mode (port 6543)
for application queries and session mode (port 5432) for migrations.

### Local Development

The staging project is linked to this repository for local CLI operations:

```bash
npx supabase link --project-ref your-staging-ref
npx supabase db push  # applies migrations to staging
```

Production is deployed exclusively via GitHub Actions CI/CD (see `.github/workflows/deploy.yml`).
Never run `supabase db push` against production from a local machine.

## Rollback Procedure

### App code rollback (Vercel)

Navigate to the Vercel dashboard → **Deployments** tab → find the last known-good deployment → click **Promote to Production**. This is instant and requires no code change. Use this for logic bugs, UI regressions, or any bad deploy that passed CI.

### Schema rollback (Supabase)

A Vercel rollback alone is not sufficient once a migration has been applied to production. Schema changes must be reversed by writing a **new forward migration** that undoes the undesired change (e.g., `DROP COLUMN`, `ALTER TABLE ... DROP CONSTRAINT`). Never delete or revert a committed migration file — the `supabase_migrations` history table tracks applied filenames, and removing a file creates drift between the codebase and the database.

The rollback migration follows the normal flow: author the file locally, commit it to a branch, open a PR (which validates it against staging via CI), then merge to main (which applies it to production before deploying the updated app code).

### PgBouncer / Supavisor Note

TASK-003 originally specified enabling PgBouncer in transaction mode. As of 2025,
Supabase replaced PgBouncer with Supavisor on all new projects. Transaction mode
on port 6543 is enabled by default — no manual configuration required.