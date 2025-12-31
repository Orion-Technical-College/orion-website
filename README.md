# EMC Workspace

A Progressive Web App (PWA) for recruiter workflow automation and leadership training, built for [EMC Support](https://emcsupport.com/).

## Overview

EMC Workspace is a multi-tenant platform supporting two primary workspaces:

1. **Recruiter Workspace**: Streamlines candidate outreach by automating personalized SMS messaging
2. **ELITE Leadership**: Full LMS for delivering the ELITE Leadership Training Program

### Recruiter Features

- **Data Workspace**: Upload and manage candidate data with sortable, filterable tables
- **SMS Campaigns**: Create personalized message templates with merge tags (`{{name}}`, `{{role}}`, `{{calendly_link}}`)
- **Quick Send**: One-tap SMS sending via native Messages app (personal number)
- **AI Assistant**: Natural language queries and CSV upload via chat
- **PWA**: Installable on mobile/desktop with offline support

### ELITE Leadership Features

- **Curriculum Delivery**: Course → Module → Item structure with multiple activity types
- **Activity Types**: Read It, Learn It (quiz), Discuss It, Practice It, Demonstrate It, Survey
- **Progress Tracking**: Item, module, and course-level completion tracking
- **Quiz Mastery**: Score-based completion with retry support
- **Discussion Forums**: Peer discussion with participation requirements
- **Submission Workflow**: Coach approval gates for capstone assignments
- **Coach Dashboard**: Review queue and at-risk learner monitoring

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js (App Router) | 14.2.x |
| UI Library | React | 18.3.x |
| Language | TypeScript | 5.x |
| Styling | Tailwind CSS | 3.4.x |
| UI Components | shadcn/ui, Radix UI | Latest |
| Data Table | TanStack Table | 8.x |
| Database | Azure SQL + Prisma | 5.x |
| AI | Azure OpenAI | GPT-4o |
| Auth | NextAuth.js | 4.x |
| Hosting | Azure App Service | - |

## Security

This project uses pinned dependencies to avoid [CVE-2025-55182](https://snyk.io/blog/security-advisory-critical-rce-vulnerabilities-react-server-components/) ("React2Shell") vulnerability affecting React Server Components in React 19.x and Next.js 15+.

**Safe versions used:**
- Next.js 14.2.18
- React 18.3.1
- React DOM 18.3.1

## Getting Started

### Prerequisites

- Node.js 20.x or later
- npm 10.x or later
- Azure SQL Database (for production)

### Installation

```bash
# Clone the repository
git clone https://github.com/Orion-Technical-College/orion-website.git
cd orion-website

# Install dependencies
npm install

# Copy environment file and configure
cp env.example .env.local

# Generate Prisma client
npx prisma generate

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Copy `env.example` to `.env.local` and configure:

- `DATABASE_URL`: Azure SQL connection string
- `NEXTAUTH_SECRET`: Random string for session encryption
- `AZURE_OPENAI_*`: Azure OpenAI credentials for AI assistant
- `AZURE_STORAGE_*`: Azure Blob Storage for file uploads

## Project Structure

```
emc-workspace/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── elite/              # ELITE Leadership workspace routes
│   │   ├── admin/              # Platform admin routes
│   │   ├── workspaces/         # Workspace selector
│   │   ├── api/                # API routes
│   │   │   └── elite/          # ELITE-specific APIs
│   │   └── page.tsx            # Main workspace page
│   ├── components/
│   │   ├── ui/                 # Reusable UI components
│   │   ├── layout/             # Sidebar, AI Assistant
│   │   ├── workspace/          # Data table, workspace shell
│   │   ├── campaigns/          # SMS campaign builder
│   │   ├── import/             # CSV import wizard
│   │   └── elite/              # ELITE-specific components
│   │       ├── course/         # Course map, navigation
│   │       ├── delivery/       # Activity type viewers
│   │       ├── coach/          # Coach dashboard
│   │       ├── cohorts/        # Cohort management
│   │       └── sessions/       # Session management
│   ├── lib/
│   │   ├── elite/              # ELITE domain logic
│   │   │   ├── kernel/         # Context, Policy, Audit, Events
│   │   │   ├── services/       # Business logic services
│   │   │   └── permissions.ts  # Role-based permissions
│   │   ├── workspace/          # Workspace resolution
│   │   └── modules/            # Module registry
│   └── types/                  # TypeScript definitions
├── prisma/
│   ├── schema.prisma           # Database schema
│   ├── seed.ts                 # Base seed script
│   └── seed-elite-module1.ts   # ELITE Module 1 content
├── docs/                       # Documentation
│   ├── ELITE_CURRICULUM.md     # Curriculum system docs
│   └── adr/                    # Architecture Decision Records
├── public/
│   ├── manifest.json           # PWA manifest
│   └── icons/                  # PWA icons
└── _legacy/                    # Original ASP.NET code (reference)
```

## SMS Quick Send

Messages are sent from the recruiter's personal phone number using the `sms:` URI scheme:

1. Create a campaign with a message template
2. Select candidates from the data table
3. Click "Send" on each candidate
4. Native Messages app opens with pre-filled text
5. One tap to send

This approach maintains the personal feel that candidates expect while saving hours of manual typing.

## Deployment

The app deploys to Azure App Service via GitHub Actions:

1. Push to `main` branch triggers deployment
2. Security audit runs first (npm audit)
3. Build and deploy to staging slot
4. Swap staging to production

See `.github/workflows/azure-deploy.yml` for details.

## Development

```bash
# Run development server
npm run dev

# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm run start
```

## License

Copyright © 2025 EMC Support. All rights reserved.
