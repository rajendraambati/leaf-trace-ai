# Multi-Country Compliance & Reporting System

## Overview

A comprehensive multi-country dispatch system with tailored compliance frameworks, parameterized reporting to regulatory authorities, and customer/target market management.

## Features

### 1. Multi-Country Support
- **Country Configuration**: Manage compliance frameworks for each country
- **Tax & Currency**: Country-specific tax rates and currencies
- **Regulatory Authorities**: Configure reporting endpoints per country
- **HS Codes**: Custom harmonized system codes by region
- **Compliance Frameworks**: TPD, FCTC, GCC, FDA support

### 2. Customer Management
- **Customer Profiles**: Complete company information
- **Multi-Country Customers**: Link customers to specific countries
- **Credit Management**: Credit limits and payment terms
- **Customer Types**: Distributors, retailers, wholesalers, manufacturers
- **Contact Management**: Email, phone, and address tracking

### 3. Target Market Management
- **Market Segmentation**: Premium, mid-market, economy
- **Volume Targets**: Track target vs current volumes
- **Distribution Channels**: Configure per market
- **Pricing Strategies**: Market-specific pricing
- **Compliance Requirements**: Market-specific regulatory needs

### 4. Parameterized Reporting
- **Authority Configuration**: Define reporting endpoints for each authority
- **Custom Report Formats**: JSON, XML, CSV support
- **Authentication Methods**: API key, OAuth, custom
- **Scheduled Reporting**: Automated submission to authorities
- **Report Tracking**: Monitor submission status and responses

### 5. Automated Compliance Reporting
- **Event-Triggered Reports**: Auto-generate on key events
- **Scheduled Submissions**: Daily, weekly, monthly reports
- **Multi-Authority Support**: Submit to multiple authorities simultaneously
- **Response Tracking**: Monitor acknowledgments and errors
- **Audit Trail**: Complete submission history

## Database Schema

### countries
```sql
CREATE TABLE countries (
  id UUID PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,        -- ISO country code
  name TEXT NOT NULL,
  region TEXT,
  compliance_framework TEXT,        -- TPD, FCTC, GCC, FDA
  hs_code_prefix TEXT,              -- Harmonized system code
  tax_rate NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  regulatory_authority TEXT,
  reporting_endpoint TEXT,          -- API endpoint for submissions
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### compliance_rules
```sql
CREATE TABLE compliance_rules (
  id UUID PRIMARY KEY,
  country_id UUID REFERENCES countries(id),
  rule_type TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_description TEXT,
  rule_config JSONB NOT NULL,
  severity TEXT DEFAULT 'medium',   -- low, medium, high, critical
  is_mandatory BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### customers
```sql
CREATE TABLE customers (
  id UUID PRIMARY KEY,
  customer_code TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country_id UUID REFERENCES countries(id),
  postal_code TEXT,
  tax_id TEXT,
  customer_type TEXT DEFAULT 'distributor',
  credit_limit NUMERIC DEFAULT 0,
  payment_terms TEXT DEFAULT 'Net 30',
  is_active BOOLEAN DEFAULT true,
  metadata JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### target_markets
```sql
CREATE TABLE target_markets (
  id UUID PRIMARY KEY,
  market_name TEXT NOT NULL,
  country_id UUID REFERENCES countries(id),
  market_segment TEXT,              -- premium, mid-market, economy
  target_volume_kg NUMERIC,
  current_volume_kg NUMERIC DEFAULT 0,
  market_share_percentage NUMERIC,
  primary_products JSONB,
  distribution_channels JSONB,
  pricing_strategy TEXT,
  compliance_requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### reporting_authorities
```sql
CREATE TABLE reporting_authorities (
  id UUID PRIMARY KEY,
  authority_name TEXT NOT NULL,
  authority_code TEXT UNIQUE NOT NULL,
  country_id UUID REFERENCES countries(id),
  authority_type TEXT NOT NULL,
  reporting_frequency TEXT DEFAULT 'monthly',
  endpoint_url TEXT,
  api_key_name TEXT,                -- Environment variable name for API key
  authentication_method TEXT DEFAULT 'api_key',
  report_format TEXT DEFAULT 'json',
  required_fields JSONB,
  is_active BOOLEAN DEFAULT true,
  last_report_date TIMESTAMPTZ,
  next_report_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### compliance_reports
```sql
CREATE TABLE compliance_reports (
  id UUID PRIMARY KEY,
  report_number TEXT UNIQUE NOT NULL,
  authority_id UUID REFERENCES reporting_authorities(id),
  country_id UUID REFERENCES countries(id),
  report_type TEXT NOT NULL,
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  report_data JSONB NOT NULL,
  submission_status TEXT DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  submitted_by UUID REFERENCES auth.users(id),
  acknowledgment_number TEXT,
  response_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### customer_orders
```sql
CREATE TABLE customer_orders (
  id UUID PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  customer_id UUID REFERENCES customers(id),
  target_market_id UUID REFERENCES target_markets(id),
  order_date DATE NOT NULL,
  delivery_date DATE,
  order_status TEXT DEFAULT 'pending',
  total_quantity_kg NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  payment_status TEXT DEFAULT 'pending',
  shipping_address TEXT,
  special_instructions TEXT,
  order_items JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

### country_document_templates
```sql
CREATE TABLE country_document_templates (
  id UUID PRIMARY KEY,
  country_id UUID REFERENCES countries(id),
  document_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_config JSONB NOT NULL,
  compliance_fields JSONB,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Default Countries

Pre-configured countries with compliance frameworks:

| Country | Code | Framework | Tax Rate | Currency | Authority |
|---------|------|-----------|----------|----------|-----------|
| India | IN | FCTC | 18% | INR | Central Board of Indirect Taxes and Customs |
| UAE | UAE | GCC | 5% | AED | Federal Tax Authority |
| Saudi Arabia | SA | GCC | 15% | SAR | General Authority of Zakat and Tax |
| United Kingdom | GB | TPD | 20% | GBP | HMRC |
| Germany | DE | TPD | 19% | EUR | Federal Ministry of Finance |
| United States | US | FDA | 0% | USD | Food and Drug Administration |

## API Integration

### Submit Compliance Report
**Endpoint:** `submit-compliance-report`

**Request:**
```typescript
{
  authority_id: string,
  report_type: 'shipment_summary' | 'batch_tracking' | 'tax_report' | 'volume_report' | 'compliance_audit',
  period_start: string,  // ISO date
  period_end: string,    // ISO date
  entity_ids?: string[]  // Optional filter
}
```

**Response:**
```typescript
{
  success: boolean,
  report: {
    id: string,
    report_number: string,
    submission_status: 'draft' | 'submitted' | 'failed',
    report_data: object
  },
  submission_response?: object
}
```

### Auto-Generate Documents
**Endpoint:** `auto-generate-documents`

**Request:**
```typescript
{
  trigger_type: 'shipment_created' | 'batch_approved' | 'delivery_confirmed',
  entity_id: string,
  entity_type: 'batch' | 'shipment' | 'order',
  document_types?: string[]
}
```

**Response:**
```typescript
{
  success: boolean,
  documents_generated: number,
  documents: Array<Document>
}
```

## Compliance Frameworks

### EU TPD (Tobacco Products Directive)
- **Health Warnings**: 65% label coverage
- **Traceability**: Unit-level tracking required
- **Reporting**: Quarterly submissions
- **Documentation**: TPD labels mandatory

### WHO FCTC (Framework Convention on Tobacco Control)
- **Tracking System**: Supply chain transparency
- **Health Warnings**: Graphic warnings
- **Reporting**: Annual country reports
- **Documentation**: Batch certificates

### GCC Standards (Gulf Cooperation Council)
- **Tax Compliance**: Country-specific VAT/GST
- **Labeling**: Arabic language requirements
- **Reporting**: Monthly tax reports
- **Documentation**: Customs declarations

### FDA Regulations (US)
- **Product Registration**: Pre-market approval
- **Facility Registration**: Manufacturing sites
- **Reporting**: Adverse event reporting
- **Documentation**: FDA forms and certificates

## Usage Examples

### Configure New Country
```typescript
const { error } = await supabase
  .from('countries')
  .insert({
    code: 'FR',
    name: 'France',
    region: 'Europe',
    compliance_framework: 'TPD',
    hs_code_prefix: '2401',
    tax_rate: 20,
    currency: 'EUR',
    regulatory_authority: 'Direction générale des douanes',
    reporting_endpoint: 'https://api.douane.gouv.fr/reports'
  });
```

### Create Customer
```typescript
const { error } = await supabase
  .from('customers')
  .insert({
    customer_code: 'CUST-UAE-001',
    company_name: 'Dubai Tobacco Distributors',
    email: 'contact@dtd.ae',
    country_id: uaeCountryId,
    customer_type: 'distributor',
    credit_limit: 100000,
    payment_terms: 'Net 30'
  });
```

### Define Target Market
```typescript
const { error } = await supabase
  .from('target_markets')
  .insert({
    market_name: 'Premium UAE Market',
    country_id: uaeCountryId,
    market_segment: 'premium',
    target_volume_kg: 50000,
    pricing_strategy: 'Premium positioning',
    compliance_requirements: ['GCC labeling', 'Arabic warnings']
  });
```

### Submit Compliance Report
```typescript
const { data } = await supabase.functions.invoke('submit-compliance-report', {
  body: {
    authority_id: authorityId,
    report_type: 'shipment_summary',
    period_start: '2025-01-01',
    period_end: '2025-01-31'
  }
});
```

### Configure Reporting Authority
```typescript
const { error } = await supabase
  .from('reporting_authorities')
  .insert({
    authority_name: 'UAE Federal Tax Authority',
    authority_code: 'UAE-FTA',
    country_id: uaeCountryId,
    authority_type: 'tax',
    reporting_frequency: 'monthly',
    endpoint_url: 'https://api.tax.gov.ae/submit',
    api_key_name: 'UAE_FTA_API_KEY',
    authentication_method: 'api_key',
    report_format: 'json',
    required_fields: ['tax_id', 'period', 'transactions']
  });
```

## Country-Specific Workflows

### India (FCTC)
1. Configure GST (18%) and INR currency
2. Set up Central Board reporting
3. Generate TPD labels with Hindi warnings
4. Submit monthly GST reports
5. Annual FCTC compliance reports

### UAE (GCC)
1. Configure VAT (5%) and AED currency
2. Set up Federal Tax Authority reporting
3. Generate Arabic-language documents
4. Submit monthly VAT returns
5. Quarterly volume reports

### UK (TPD)
1. Configure VAT (20%) and GBP currency
2. Set up HMRC reporting endpoint
3. Generate TPD-compliant labels
4. Submit quarterly tobacco returns
5. Annual product notifications

### US (FDA)
1. Configure no federal tax and USD
2. Set up FDA reporting
3. Generate FDA-compliant labels
4. Submit product listings
5. Adverse event reporting

## Report Types

### Shipment Summary
- Total shipments by destination
- Quantity and value tracking
- Compliance document verification
- Vehicle and driver information

### Batch Tracking
- Batch-level traceability
- Quality grades and testing results
- Origin (farmer) information
- Processing and storage history

### Tax Report
- Sales by tax jurisdiction
- Tax collected and payable
- Invoice reconciliation
- Customer tax IDs

### Volume Report
- Quantities by product type
- Market distribution
- Import/export volumes
- Inventory levels

### Compliance Audit
- Document completeness check
- Regulatory violations
- Remediation actions
- Certification status

## Integration Points

### With Document Generation
- Country-specific templates
- Tax calculations per country
- Multi-language support
- Compliance field validation

### With Logistics System
- Country destination routing
- Customs documentation
- Cross-border tracking
- Duty calculation

### With Customer System
- Country-based pricing
- Currency conversion
- Credit management
- Order fulfillment

### With Compliance System
- Framework validation
- Rule enforcement
- Audit trails
- Report generation

## Security & Access Control

### Role-Based Access
- **Admin/System Admin**: Full access to all configurations
- **Logistics Manager**: Customer and market management
- **Auditor**: Compliance reporting and review
- **Technician**: View customers and markets
- **Factory Manager**: Order management

### Data Protection
- Row-Level Security on all tables
- Encrypted reporting endpoints
- Secure API key storage
- Audit logging

## Monitoring & Analytics

### Country Metrics
- Active countries
- Compliance frameworks in use
- Tax rates by region
- Reporting authorities configured

### Customer Metrics
- Total customers by country
- Customer types distribution
- Credit utilization
- Payment terms analysis

### Market Metrics
- Target vs actual volumes
- Market share tracking
- Segment performance
- Growth trends

### Reporting Metrics
- Reports submitted by authority
- Submission success rate
- Response times
- Compliance scores

## Best Practices

1. **Country Setup**
   - Configure all mandatory fields
   - Test reporting endpoints
   - Verify tax calculations
   - Update compliance frameworks regularly

2. **Customer Management**
   - Maintain accurate contact information
   - Review credit limits periodically
   - Track payment performance
   - Update tax IDs as needed

3. **Market Segmentation**
   - Define clear segment criteria
   - Set realistic volume targets
   - Monitor market performance
   - Adjust strategies based on data

4. **Regulatory Reporting**
   - Schedule reports in advance
   - Verify data accuracy before submission
   - Monitor submission status
   - Maintain backup of all reports

5. **Compliance Validation**
   - Regular rule updates
   - Framework version tracking
   - Document completeness checks
   - Authority response monitoring

## Troubleshooting

### Report Submission Failures
- **Check endpoint URL**: Verify authority endpoint is correct
- **Verify API keys**: Ensure authentication credentials are valid
- **Review data format**: Confirm format matches authority requirements
- **Check network**: Ensure endpoint is accessible

### Missing Compliance Data
- **Verify country setup**: All required fields configured
- **Check rule definitions**: Rules active and properly defined
- **Review document templates**: Country-specific templates exist
- **Validate entity data**: Source data complete

### Customer Order Issues
- **Confirm customer active**: Customer status is active
- **Check country**: Country properly configured
- **Verify market**: Target market exists and active
- **Review credit**: Credit limit not exceeded

## Future Enhancements

- [ ] Real-time compliance monitoring
- [ ] Predictive compliance alerts
- [ ] Multi-language document generation
- [ ] Blockchain-based reporting verification
- [ ] AI-powered compliance checking
- [ ] Automated currency conversion
- [ ] Dynamic tax rate updates
- [ ] Integration with customs systems
- [ ] Mobile compliance app
- [ ] Advanced analytics dashboard

## API Reference

### Country Management
- GET `/countries` - List all countries
- POST `/countries` - Create country
- PUT `/countries/:id` - Update country
- DELETE `/countries/:id` - Deactivate country

### Customer Management
- GET `/customers` - List customers
- POST `/customers` - Create customer
- PUT `/customers/:id` - Update customer
- GET `/customers/:id/orders` - Customer orders

### Reporting
- POST `/submit-compliance-report` - Submit report
- GET `/compliance-reports` - List reports
- GET `/compliance-reports/:id` - Get report details
- POST `/auto-generate-documents` - Auto-generate docs

### Market Management
- GET `/target-markets` - List markets
- POST `/target-markets` - Create market
- PUT `/target-markets/:id` - Update market
- GET `/target-markets/:id/performance` - Market analytics

---

**System Status**: ✅ Multi-Country Support Enabled

**Supported Countries**: 6 (India, UAE, Saudi Arabia, UK, Germany, US)

**Compliance Frameworks**: 4 (TPD, FCTC, GCC, FDA)

**Last Updated**: 2025-10-29

**Version**: 1.0.0