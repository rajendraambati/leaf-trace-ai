# Document Generation System

## Overview

The Document Generation System enables automatic creation of TPD-compliant labels, dispatch manifests, GST invoices, customs declarations, and packing lists. All documents include embedded QR codes for tracking and verification.

## Features

### TPD-Compliant Labels
- **EU TPD 2014/40/EU Compliance**: Health warnings covering 65% of label
- **Product Information**: Batch number, nicotine content, manufacture/expiry dates
- **QR Code**: For product verification and traceability
- **Standardized Format**: 100mm x 150mm label size

### Dispatch Manifests
- **Route Information**: Origin and destination tracking
- **Vehicle & Driver Details**: Complete transport information
- **Batch Details**: Quantity, grade, and batch identification
- **Compliance Documents**: Checklist of required documents (EMD, BG, GST, Tender)
- **QR Code**: Real-time shipment tracking

### GST Invoices
- **Complete Billing**: Customer information and line items
- **GST Calculation**: Automatic tax computation (default 18%)
- **Payment Terms**: Configurable payment conditions
- **QR Code**: Invoice verification and payment tracking

### Customs Declarations
- **International Compliance**: HS code classification (2401.20 for tobacco)
- **Consignor/Consignee**: Complete shipping party information
- **Goods Description**: Detailed product information
- **Value Declaration**: Quantity and monetary value
- **QR Code**: Customs verification

### Packing Lists
- **Package Tracking**: Individual package identification
- **Weight & Dimensions**: Complete shipping specifications
- **Handling Instructions**: Special care requirements
- **QR Code**: Package verification

## Database Schema

### document_templates
```sql
CREATE TABLE document_templates (
  id UUID PRIMARY KEY,
  template_type TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_config JSONB NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Default Templates:**
- TPD Label: EU TPD 2014/40/EU compliant
- Dispatch Manifest: Standard A4 format with QR
- GST Invoice: INR currency, 18% default GST
- Customs Declaration: International format with HS codes
- Packing List: Standard shipping format

### generated_documents
```sql
CREATE TABLE generated_documents (
  id UUID PRIMARY KEY,
  document_type TEXT NOT NULL,
  document_number TEXT UNIQUE NOT NULL,
  template_id UUID REFERENCES document_templates(id),
  entity_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  document_data JSONB NOT NULL,
  qr_code_data TEXT,
  pdf_url TEXT,
  status TEXT DEFAULT 'draft',
  generated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### invoice_line_items
```sql
CREATE TABLE invoice_line_items (
  id UUID PRIMARY KEY,
  invoice_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  item_description TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  unit_price NUMERIC NOT NULL,
  tax_rate NUMERIC DEFAULT 18,
  tax_amount NUMERIC NOT NULL,
  line_total NUMERIC NOT NULL,
  batch_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## API Integration

### Generate Document
**Endpoint:** `generate-document`

**Request:**
```typescript
{
  document_type: 'tpd_label' | 'dispatch_manifest' | 'invoice' | 'customs_declaration' | 'packing_list',
  entity_id: string,
  entity_type: 'batch' | 'shipment' | 'order' | 'warehouse',
  template_id?: string,
  custom_data?: any
}
```

**Response:**
```typescript
{
  success: boolean,
  document: {
    id: string,
    document_number: string,
    document_type: string,
    document_data: object,
    qr_code_data: string,
    status: string,
    created_at: string
  },
  qr_code_data: string,
  pdf_generation_url: string
}
```

### Generate PDF
**Endpoint:** `generate-document-pdf`

**Parameters:**
- `document_id`: UUID of the generated document

**Client-Side PDF Generation:**
```typescript
import { 
  generateTPDLabelPDF,
  generateDispatchManifestPDF,
  generateInvoicePDF,
  generateCustomsDeclarationPDF
} from '@/utils/pdfGenerator';

// Generate TPD Label
await generateTPDLabelPDF({
  product_name: "Tobacco Product",
  batch_number: "BATCH-123",
  health_warning: "Smoking kills - quit now",
  nicotine_content: "12mg",
  manufacture_date: "2025-01-01",
  expiry_date: "2026-01-01",
  manufacturer_info: "LeafTrace Supply Chain",
  qr_code_data: qrData
});
```

## QR Code System

### QR Code Data Structure
```typescript
{
  documentNumber: string,
  documentType: string,
  entityId: string,
  type: 'document_verification',
  timestamp: string,
  verifyUrl: string
}
```

### Generation Utilities
```typescript
// Generate document QR code
import { generateDocumentQRData } from '@/utils/qrcode';

const qrData = generateDocumentQRData(
  documentNumber,
  documentType,
  entityId
);

// Parse QR code data
import { parseDocumentQRData } from '@/utils/qrcode';

const data = parseDocumentQRData(qrCodeString);
```

## Security & Compliance

### Row-Level Security (RLS)

**document_templates:**
- Public: Read active templates
- Admins: Full management

**generated_documents:**
- Users: View their own documents
- Authorized users: Create documents (admin, technician, warehouse_manager)
- Users: Update their own documents
- Admins: Update any document

**invoice_line_items:**
- Users: View line items for their invoices
- Authorized users: Manage line items

### Compliance Features

1. **TPD Compliance**
   - Health warnings covering 65% of label area
   - Required product information fields
   - Standardized label dimensions
   - Trackable via QR codes

2. **GST Compliance**
   - Automatic tax calculation
   - Invoice numbering system
   - Line item tracking
   - Digital verification via QR

3. **Customs Compliance**
   - HS code classification
   - Origin/destination tracking
   - Value declaration
   - International standards

4. **Traceability**
   - QR codes on all documents
   - Verification URLs
   - Timestamp tracking
   - Audit trail

## Usage Examples

### Generate TPD Label
```typescript
const { data } = await supabase.functions.invoke('generate-document', {
  body: {
    document_type: 'tpd_label',
    entity_id: 'BATCH-123',
    entity_type: 'batch'
  }
});
```

### Generate Dispatch Manifest
```typescript
const { data } = await supabase.functions.invoke('generate-document', {
  body: {
    document_type: 'dispatch_manifest',
    entity_id: 'SHP-456',
    entity_type: 'shipment'
  }
});
```

### Generate Invoice with Line Items
```typescript
const { data } = await supabase.functions.invoke('generate-document', {
  body: {
    document_type: 'invoice',
    entity_id: 'BATCH-789',
    entity_type: 'batch',
    custom_data: {
      line_items: [
        {
          description: 'Tobacco Grade A',
          quantity: 1000,
          unit_price: 150,
          tax_rate: 18,
          batch_id: 'BATCH-789'
        }
      ]
    }
  }
});
```

### Generate Customs Declaration
```typescript
const { data } = await supabase.functions.invoke('generate-document', {
  body: {
    document_type: 'customs_declaration',
    entity_id: 'BATCH-101',
    entity_type: 'batch',
    custom_data: {
      consignee: 'International Buyer Ltd',
      destination_country: 'UAE'
    }
  }
});
```

## Document Workflow

1. **Generation**
   - Select document type
   - Specify entity (batch, shipment, etc.)
   - Optionally provide custom data
   - System generates document with unique number

2. **QR Code Creation**
   - Automatic QR code generation
   - Embedded verification URL
   - Timestamp and metadata

3. **PDF Export**
   - Client-side PDF generation
   - QR code embedded in PDF
   - TPD-compliant formatting

4. **Verification**
   - Scan QR code
   - Retrieve document details
   - Verify authenticity

5. **Tracking**
   - Document status updates
   - Access history
   - Audit trail

## Integration Points

### With Procurement System
- Generate labels for new batches
- Link to farmer information
- Grade and quality tracking

### With Logistics System
- Generate manifests for shipments
- Track dispatch progress
- Compliance documentation

### With Warehouse System
- Packing lists for inventory
- Stock verification
- Batch tracking

### With Processing System
- Product documentation
- Quality certificates
- Batch traceability

## Best Practices

1. **Always include QR codes** for traceability
2. **Use templates** for consistency
3. **Validate data** before generation
4. **Store PDFs** for archival
5. **Track document status** throughout lifecycle
6. **Maintain audit trail** for compliance
7. **Regular template updates** for regulatory changes
8. **Backup generated documents** regularly

## Monitoring & Analytics

### Document Statistics
- Total documents generated
- Documents by type
- Generation trends
- Error rates

### Compliance Metrics
- TPD compliance rate
- GST invoice accuracy
- Customs declaration completeness
- QR code scan rates

### Performance Metrics
- Generation time
- PDF creation time
- API response times
- System availability

## Future Enhancements

- [ ] Blockchain-based document verification
- [ ] Multi-language support for international compliance
- [ ] Automated compliance checking
- [ ] Batch document generation
- [ ] Email/SMS document delivery
- [ ] Digital signatures
- [ ] Template designer UI
- [ ] Advanced analytics dashboard