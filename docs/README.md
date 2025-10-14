# TobaccoTrace Platform - Developer Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Documentation Index](#documentation-index)
5. [Development Workflow](#development-workflow)

## Project Overview

TobaccoTrace is an enterprise-grade tobacco supply chain traceability platform built on React, TypeScript, and Lovable Cloud (Supabase). The platform provides end-to-end visibility from farmer procurement to warehouse management, with AI-powered quality grading, ESG scoring, and compliance reporting.

### Key Features

- **Farmer Management**: Registration, certification tracking, document management
- **Procurement**: Batch tracking with QR codes, AI grading, quality testing
- **Logistics**: Real-time shipment tracking, route optimization, GPS monitoring
- **Warehouse**: Inventory management, capacity monitoring, temperature control
- **Processing**: Batch processing, quality scoring, progress tracking
- **Compliance**: Audit management, certifications, automated reporting
- **AI/ML**: Image-based grading, ESG scoring, crop health prediction
- **IoT Integration**: MQTT device handling, GPS tracking, weighbridge data
- **Analytics**: Real-time dashboards, anomaly detection, performance metrics
- **Security**: Role-based access control (RBAC), Row-Level Security (RLS)

### Tech Stack

**Frontend:**
- React 18 + TypeScript
- Vite (build tool)
- TanStack Query (data fetching)
- React Router (routing)
- Tailwind CSS + shadcn/ui (styling)
- Recharts (visualizations)
- Leaflet (maps)

**Backend:**
- Lovable Cloud (Supabase)
- PostgreSQL (database)
- Deno Edge Functions (serverless)
- Storage (file uploads)
- Authentication (JWT + RLS)

**AI/ML:**
- Lovable AI Gateway (Google Gemini, OpenAI GPT-5)
- Azure ML (custom grading models)
- Image analysis and classification

**IoT:**
- MQTT protocol
- GPS tracking
- Weighbridge integration
- Temperature/humidity sensors

## Quick Start

### Prerequisites

- Node.js 18+ or Bun
- Access to Lovable Cloud project
- Basic understanding of React and TypeScript

### Installation

```bash
# Clone the repository (if connected to GitHub)
git clone <your-repo-url>
cd tobacco-trace

# Install dependencies
npm install
# or
bun install

# Start development server
npm run dev
# or
bun dev
```

### Environment Variables

The project uses Lovable Cloud which automatically provides:

```env
VITE_SUPABASE_URL=<auto-configured>
VITE_SUPABASE_PUBLISHABLE_KEY=<auto-configured>
VITE_SUPABASE_PROJECT_ID=<auto-configured>
```

Additional secrets are managed in Lovable Cloud:
- `LOVABLE_API_KEY` - AI functionality
- `AZURE_ML_GRADING_ENDPOINT` - Custom ML grading
- `AZURE_ML_GRADING_API_KEY` - ML authentication
- `MQTT_BROKER_URL` - IoT device integration
- `MQTT_USERNAME` / `MQTT_PASSWORD` - MQTT authentication

## Architecture

### System Architecture

```
┌─────────────────┐
│   React SPA     │ ← User Interface
│  (Vite + TS)    │
└────────┬────────┘
         │
         ├──────────┐
         │          │
    ┌────▼────┐  ┌──▼──────────┐
    │ Lovable │  │   Storage   │
    │ Cloud   │  │   Buckets   │
    │  (API)  │  │  (Images)   │
    └────┬────┘  └─────────────┘
         │
    ┌────▼──────────────────┐
    │  Edge Functions       │
    │  (Deno Runtime)       │
    ├───────────────────────┤
    │ • AI Grading          │
    │ • Route Optimization  │
    │ • ESG Scoring         │
    │ • MQTT Handler        │
    │ • Reports             │
    │ • Analytics           │
    └────┬──────────────────┘
         │
    ┌────▼─────────────┐
    │   PostgreSQL     │
    │   (Supabase)     │
    │   • RLS Enabled  │
    │   • RBAC         │
    └──────────────────┘
```

### Data Flow

1. **User Action** → React Component
2. **Component** → TanStack Query Hook
3. **Query Hook** → Supabase Client
4. **Supabase Client** → Database/Edge Function/Storage
5. **Response** → Query Cache → Component Re-render

### Authentication Flow

```
User Login → Supabase Auth → JWT Token
                               │
                               ▼
                    ┌──────────────────┐
                    │  Auth Context    │
                    │  (useAuth hook)  │
                    └────────┬─────────┘
                             │
                    ┌────────▼──────────┐
                    │  Protected Routes │
                    │  (RoleGuard)      │
                    └───────────────────┘
```

## Documentation Index

### Core Documentation

1. **[API Documentation](./docs/API.md)** - Edge function APIs, endpoints, request/response formats
2. **[Database Schema](./docs/DATABASE.md)** - Tables, relationships, RLS policies
3. **[AI/ML Documentation](./docs/AI_ML.md)** - AI features, model integration, training
4. **[Security Documentation](./docs/SECURITY.md)** - RBAC, RLS, authentication, compliance
5. **[Deployment Guide](./DEPLOYMENT_MONITORING.md)** - Deployment, monitoring, scaling

### Feature Documentation

6. **[Frontend Components](./docs/COMPONENTS.md)** - React component architecture
7. **[State Management](./docs/STATE_MANAGEMENT.md)** - TanStack Query patterns
8. **[IoT Integration](./docs/IOT.md)** - MQTT, device management, data handling
9. **[Testing Guide](./docs/TESTING.md)** - Unit, integration, E2E testing

### Developer Guides

10. **[Onboarding Guide](./docs/ONBOARDING.md)** - New developer setup
11. **[Contributing Guide](./docs/CONTRIBUTING.md)** - Code standards, PR process
12. **[Troubleshooting](./docs/TROUBLESHOOTING.md)** - Common issues and solutions

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch (if using GitHub)
git checkout -b feature/your-feature-name

# Make changes in Lovable or local IDE
# Changes auto-sync if GitHub connected

# Test locally
npm run dev

# Run tests
npm test

# Commit and push
git add .
git commit -m "feat: add feature description"
git push origin feature/your-feature-name
```

### 2. Database Changes

Always use migrations for schema changes:

```typescript
// Use the migration tool in Lovable
// Or create migration SQL file
```

**Important**: After migrations, the `src/integrations/supabase/types.ts` file auto-updates.

### 3. Edge Function Development

Create edge functions in `supabase/functions/`:

```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  // Function logic
  return new Response(JSON.stringify({ success: true }), {
    headers: { "Content-Type": "application/json" }
  });
});
```

Functions deploy automatically when code is saved.

### 4. Code Standards

**TypeScript:**
- Strict mode enabled
- No `any` types without justification
- Interfaces over types for objects
- Use `zod` for runtime validation

**React:**
- Functional components only
- Custom hooks for logic reuse
- Proper dependency arrays in `useEffect`
- TanStack Query for data fetching

**Styling:**
- Use Tailwind semantic tokens from `index.css`
- No inline styles
- Shadcn/ui components for UI elements
- Responsive design (mobile-first)

**Naming Conventions:**
- Components: PascalCase (`UserProfile.tsx`)
- Hooks: camelCase with `use` prefix (`useAuth.ts`)
- Utilities: camelCase (`formatDate.ts`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

### 5. Testing Requirements

- Unit tests for utilities and hooks
- Integration tests for critical workflows
- E2E tests for main user journeys
- Minimum 70% code coverage for new features

### 6. Pull Request Process

1. Create descriptive PR title: `feat:`, `fix:`, `docs:`, `refactor:`
2. Fill out PR template with:
   - Description of changes
   - Testing performed
   - Screenshots (if UI changes)
   - Breaking changes (if any)
3. Request review from team members
4. Address review comments
5. Merge after approval

## Project Structure

```
tobacco-trace/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # Shadcn UI components
│   │   ├── Layout.tsx   # Main layout wrapper
│   │   └── ...          # Feature components
│   ├── pages/           # Route-level components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities and helpers
│   ├── integrations/    # External service integrations
│   │   └── supabase/    # Auto-generated Supabase types
│   ├── test/            # Test files
│   │   ├── unit/        # Unit tests
│   │   ├── integration/ # Integration tests
│   │   └── mocks/       # Test mocks
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles + design tokens
├── supabase/
│   ├── functions/       # Edge functions
│   ├── migrations/      # Database migrations (read-only)
│   └── config.toml      # Supabase configuration
├── public/              # Static assets
├── docs/                # Documentation
├── README.md            # This file
└── package.json         # Dependencies
```

## Key Concepts

### 1. Row-Level Security (RLS)

All database tables have RLS enabled with policies based on user roles:

```sql
CREATE POLICY "Users can view their own data"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id);
```

See [Security Documentation](./docs/SECURITY.md) for details.

### 2. Role-Based Access Control (RBAC)

Available roles:
- `admin` - Full system access
- `auditor` - Read access + compliance management
- `technician` - Farmer management, procurement
- `procurement_agent` - Procurement operations
- `logistics_manager` - Shipment management
- `factory_manager` - Processing and warehouse

### 3. AI Integration

AI features use Lovable AI Gateway:

```typescript
const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${LOVABLE_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'google/gemini-2.5-flash',
    messages: [...]
  })
});
```

## Common Tasks

### Adding a New Page

1. Create component in `src/pages/NewPage.tsx`
2. Add route in `src/App.tsx`
3. Add navigation link in `src/components/Layout.tsx`
4. Protect route with `<ProtectedRoute>` if needed

### Creating an Edge Function

1. Create directory: `supabase/functions/function-name/`
2. Create `index.ts` with function logic
3. Function auto-deploys on save
4. Call from frontend using `supabase.functions.invoke()`

### Adding a Database Table

1. Use migration tool to create table
2. Enable RLS and create policies
3. Types auto-generate in `src/integrations/supabase/types.ts`
4. Create React queries/mutations to interact with table

## Getting Help

- **Documentation**: Check relevant doc files in `/docs`
- **Troubleshooting**: See [TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)
- **Lovable Docs**: https://docs.lovable.dev
- **Team Support**: Contact your team lead or senior developer

## Next Steps

New developers should:

1. ✅ Read this README thoroughly
2. ✅ Follow [Onboarding Guide](./docs/ONBOARDING.md)
3. ✅ Review [Security Documentation](./docs/SECURITY.md)
4. ✅ Study [Database Schema](./docs/DATABASE.md)
5. ✅ Explore [API Documentation](./docs/API.md)
6. ✅ Set up local development environment
7. ✅ Run tests and ensure they pass
8. ✅ Pick up a "good first issue" ticket

Welcome to the TobaccoTrace development team! 🚀
