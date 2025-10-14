# Tobacco Supply Chain Traceability Platform

Enterprise-grade supply chain management system for tobacco procurement, processing, and compliance with comprehensive traceability.

## Features

- **Farmer Management**: Complete farmer registration and certification tracking
- **Procurement**: Batch tracking with QR codes and AI-powered grading
- **Logistics**: Real-time shipment tracking with GPS and IoT sensors
- **Warehouse**: Inventory management with environmental monitoring
- **Processing**: Production workflow management and quality control
- **Compliance**: Automated GST, FCTC, and ESG reporting
- **AI Grading**: Computer vision-based quality assessment
- **IoT Integration**: Real-time sensor data monitoring
- **RBAC**: Role-based access control with comprehensive audit logging
- **Automated Reports**: Scheduled compliance report generation and portal submission

## Project info

**URL**: https://lovable.dev/projects/2e63e385-e367-4b4a-a2d3-4ad6e3f65216

## Technology Stack

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + shadcn/ui components
- **Backend**: Lovable Cloud (Supabase)
- **State Management**: TanStack Query
- **Authentication**: Supabase Auth with RLS
- **Real-time**: Supabase Realtime
- **Testing**: Vitest + React Testing Library
- **Maps**: Leaflet
- **QR Codes**: qrcode.react

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start development server
npm run dev
```

### Testing

Run the comprehensive test suite:

```bash
# Run all tests
npm test

# Run tests with UI (interactive)
npm run test:ui

# Generate coverage report
npm run test:coverage

# Run tests once (CI mode)
npm run test:run
```

### Test Structure

```
src/test/
├── setup.ts                    # Test environment setup
├── utils/
│   └── test-utils.tsx         # Custom render utilities
├── mocks/
│   └── supabase.ts            # Supabase client mocks
├── unit/
│   └── utils/                 # Utility function tests
└── integration/
    ├── data-integrity.test.ts # Data validation tests
    └── edge-functions/        # API endpoint tests
```

## Security Features

- **Row Level Security (RLS)**: All database tables protected
- **Role-Based Access Control**: Admin, Auditor, Technician, Farmer roles
- **Audit Logging**: Comprehensive action tracking with timestamps
- **Data Encryption**: AES-256 at rest, TLS 1.3 in transit (via Lovable Cloud)
- **Input Validation**: Client and server-side validation
- **JWT Authentication**: Secure token-based auth

## Database Schema

### Core Tables
- **farmers**: Farmer profiles and farm data
- **procurement_batches**: Procurement records with QR tracking
- **shipments**: Logistics tracking with GPS
- **warehouses**: Storage facility management
- **warehouse_inventory**: Inventory tracking
- **processing_batches**: Production workflows
- **processing_units**: Processing equipment

### Compliance & Analytics
- **compliance_audits**: Audit records
- **compliance_certifications**: Certification management
- **esg_scores**: ESG assessment data
- **ai_gradings**: AI quality assessments
- **audit_logs**: Comprehensive action logging

### Reporting & Automation
- **scheduled_reports**: Automated report scheduling
- **report_submissions**: Report generation history

### Access Control
- **user_roles**: RBAC role assignments
- **role_permissions**: Permission matrix
- **profiles**: User profile data

## User Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Admin** | Full system access | All CRUD operations, user management |
| **Auditor** | Read-only + compliance | View all data, manage audits and reports |
| **Technician** | Field operations | Farmer registration, procurement, IoT management |
| **Farmer** | Own data only | View own batches and procurement history |

## API Documentation

### Edge Functions

- **generate-compliance-report**: Generate GST/FCTC/ESG reports in JSON/CSV/XML
- **submit-government-report**: Submit reports to government portals
- **ai-grading**: AI-powered tobacco quality assessment
- **compliance-reporting**: Compliance report generation
- **crop-health-prediction**: ML-based crop health analysis
- **esg-scoring**: ESG assessment calculations
- **farmer-management**: Farmer CRUD operations
- **inventory-management**: Warehouse inventory tracking
- **logistics-tracking**: Shipment tracking and updates
- **procurement-management**: Batch procurement workflows

## Deployment

Simply open [Lovable](https://lovable.dev/projects/2e63e385-e367-4b4a-a2d3-4ad6e3f65216) and click on Share -> Publish.

### Custom Domain

To connect a custom domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more: [Setting up a custom domain](https://docs.lovable.dev/features/custom-domain#custom-domain)

## How to Edit This Code

### Using Lovable

Simply visit the [Lovable Project](https://lovable.dev/projects/2e63e385-e367-4b4a-a2d3-4ad6e3f65216) and start prompting. Changes are automatically committed to this repo.

### Using Your IDE

Clone the repo and push changes. All changes sync with Lovable automatically. Requires Node.js & npm - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Using GitHub

- **Direct editing**: Click "Edit" button on any file
- **GitHub Codespaces**: Launch a cloud development environment from the "Code" dropdown

## Contributing

1. Create a feature branch
2. Write tests for new features  
3. Ensure all tests pass (`npm test`)
4. Submit a pull request

## License

Proprietary - All rights reserved
