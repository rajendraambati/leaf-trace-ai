import jsPDF from 'jspdf';
import QRCode from 'qrcode';

interface BatchDetails {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  status: string;
  quantity_kg: number;
  grade: string;
  price_per_kg: number;
  total_price: number;
  procurement_date: string;
}

interface TPDLabelData {
  product_name: string;
  batch_number: string;
  health_warning: string;
  nicotine_content: string;
  manufacture_date: string;
  expiry_date: string;
  manufacturer_info: string;
  qr_code_data?: string;
}

interface DispatchManifestData {
  manifest_number: string;
  dispatch_date: string;
  origin: string;
  destination: string;
  vehicle_info: any;
  batch_details: any;
  compliance_docs: string[];
  qr_code_data?: string;
}

interface InvoiceData {
  invoice_number: string;
  invoice_date: string;
  customer_info: any;
  line_items?: any[];
  subtotal: number;
  gst_rate: number;
  gst_amount: number;
  total: number;
  payment_terms: string;
  qr_code_data?: string;
}

interface CustomsDeclarationData {
  declaration_number: string;
  consignor: string;
  consignee: string;
  goods_description: string;
  hs_code: string;
  quantity: number;
  value: number;
  origin_country: string;
  destination_country: string;
  qr_code_data?: string;
}

export const generateBatchPDF = (batch: BatchDetails) => {
  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Batch Details Report', 105, 20, { align: 'center' });
  
  // Line separator
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  // Batch Information
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  
  let yPosition = 40;
  const lineHeight = 10;
  
  // Batch ID
  doc.setFont('helvetica', 'bold');
  doc.text('Batch ID:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.id, 80, yPosition);
  yPosition += lineHeight;
  
  // Status
  doc.setFont('helvetica', 'bold');
  doc.text('Status:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.status.toUpperCase(), 80, yPosition);
  yPosition += lineHeight;
  
  // Farmer Name
  doc.setFont('helvetica', 'bold');
  doc.text('Farmer Name:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.farmer_name || 'N/A', 80, yPosition);
  yPosition += lineHeight;
  
  // Farmer ID
  doc.setFont('helvetica', 'bold');
  doc.text('Farmer ID:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.farmer_id, 80, yPosition);
  yPosition += lineHeight;
  
  // Date & Time
  doc.setFont('helvetica', 'bold');
  doc.text('Date & Time:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.procurement_date, 80, yPosition);
  yPosition += lineHeight;
  
  // Quantity
  doc.setFont('helvetica', 'bold');
  doc.text('Quantity:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`${batch.quantity_kg} kg`, 80, yPosition);
  yPosition += lineHeight;
  
  // Grade
  doc.setFont('helvetica', 'bold');
  doc.text('Grade:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(batch.grade, 80, yPosition);
  yPosition += lineHeight;
  
  // Price per kg
  doc.setFont('helvetica', 'bold');
  doc.text('Price per kg:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${batch.price_per_kg}`, 80, yPosition);
  yPosition += lineHeight;
  
  // Total Price
  doc.setFont('helvetica', 'bold');
  doc.text('Total Price:', 20, yPosition);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${batch.total_price.toFixed(2)}`, 80, yPosition);
  
  // Footer
  yPosition = 280;
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated on ${new Date().toLocaleString()}`, 105, yPosition, { align: 'center' });
  
  // Save the PDF
  doc.save(`batch-${batch.id}.pdf`);
};

export const generateTPDLabelPDF = async (data: TPDLabelData) => {
  const doc = new jsPDF({ format: [100, 150] }); // TPD Label size
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TPD COMPLIANT LABEL', 50, 15, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  let yPos = 25;
  doc.text(`Product: ${data.product_name}`, 10, yPos);
  yPos += 7;
  doc.text(`Batch: ${data.batch_number}`, 10, yPos);
  yPos += 7;
  doc.text(`Nicotine: ${data.nicotine_content}`, 10, yPos);
  yPos += 7;
  doc.text(`Mfg Date: ${new Date(data.manufacture_date).toLocaleDateString()}`, 10, yPos);
  yPos += 7;
  doc.text(`Exp Date: ${new Date(data.expiry_date).toLocaleDateString()}`, 10, yPos);
  
  // Health Warning (prominent)
  yPos += 12;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 0, 0);
  const warning = doc.splitTextToSize(data.health_warning, 80);
  doc.text(warning, 50, yPos, { align: 'center' });
  
  // QR Code
  if (data.qr_code_data) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.qr_code_data, { width: 150 });
      doc.addImage(qrDataUrl, 'PNG', 25, yPos + 15, 50, 50);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Manufacturer info at bottom
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(data.manufacturer_info, 50, 140, { align: 'center' });
  
  doc.save(`TPD-Label-${data.batch_number}.pdf`);
};

export const generateDispatchManifestPDF = async (data: DispatchManifestData) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('DISPATCH MANIFEST', 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  let yPos = 35;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Manifest No: ${data.manifest_number}`, 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date(data.dispatch_date).toLocaleString()}`, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('ROUTE INFORMATION', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`From: ${data.origin}`, 20, yPos);
  yPos += 7;
  doc.text(`To: ${data.destination}`, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('VEHICLE & DRIVER', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Vehicle ID: ${data.vehicle_info?.vehicle_id || 'N/A'}`, 20, yPos);
  yPos += 7;
  doc.text(`Driver: ${data.vehicle_info?.driver_name || 'N/A'}`, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('BATCH DETAILS', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Batch ID: ${data.batch_details?.batch_id || 'N/A'}`, 20, yPos);
  yPos += 7;
  doc.text(`Quantity: ${data.batch_details?.quantity_kg || 0} kg`, 20, yPos);
  yPos += 7;
  doc.text(`Grade: ${data.batch_details?.grade || 'N/A'}`, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('COMPLIANCE DOCUMENTS', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  data.compliance_docs.forEach(docName => {
    doc.text(`✓ ${docName}`, 25, yPos);
    yPos += 6;
  });
  
  // QR Code
  if (data.qr_code_data) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.qr_code_data, { width: 200 });
      doc.addImage(qrDataUrl, 'PNG', 150, 180, 40, 40);
      doc.setFontSize(8);
      doc.text('Scan for tracking', 170, 225, { align: 'center' });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
  
  doc.save(`Manifest-${data.manifest_number}.pdf`);
};

export const generateInvoicePDF = async (data: InvoiceData) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('GST INVOICE', 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  let yPos = 35;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Invoice No: ${data.invoice_number}`, 20, yPos);
  doc.text(`Date: ${new Date(data.invoice_date).toLocaleDateString()}`, 140, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('BILL TO:', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(data.customer_info?.name || 'N/A', 20, yPos);
  yPos += 6;
  doc.text(data.customer_info?.location || '', 20, yPos);
  yPos += 6;
  doc.text(data.customer_info?.phone || '', 20, yPos);
  
  // Line items table
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('ITEMS', 20, yPos);
  doc.text('QTY', 110, yPos);
  doc.text('RATE', 140, yPos);
  doc.text('AMOUNT', 170, yPos, { align: 'right' });
  
  yPos += 7;
  doc.line(20, yPos, 190, yPos);
  yPos += 8;
  
  doc.setFont('helvetica', 'normal');
  if (data.line_items && data.line_items.length > 0) {
    data.line_items.forEach(item => {
      doc.text(item.description || 'Item', 20, yPos);
      doc.text(item.quantity?.toString() || '1', 110, yPos);
      doc.text(item.unit_price?.toFixed(2) || '0.00', 140, yPos);
      doc.text(item.line_total?.toFixed(2) || '0.00', 190, yPos, { align: 'right' });
      yPos += 7;
    });
  }
  
  yPos += 5;
  doc.line(20, yPos, 190, yPos);
  
  // Totals
  yPos += 10;
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal:', 140, yPos);
  doc.text(`₹${data.subtotal.toFixed(2)}`, 190, yPos, { align: 'right' });
  yPos += 7;
  doc.text(`GST (${data.gst_rate}%):`, 140, yPos);
  doc.text(`₹${data.gst_amount.toFixed(2)}`, 190, yPos, { align: 'right' });
  yPos += 7;
  doc.setFontSize(14);
  doc.text('TOTAL:', 140, yPos);
  doc.text(`₹${data.total.toFixed(2)}`, 190, yPos, { align: 'right' });
  
  // Payment terms
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.text(`Payment Terms: ${data.payment_terms}`, 20, yPos);
  
  // QR Code
  if (data.qr_code_data) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.qr_code_data, { width: 200 });
      doc.addImage(qrDataUrl, 'PNG', 20, 220, 40, 40);
      doc.setFontSize(8);
      doc.text('Scan for verification', 40, 265, { align: 'center' });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
  
  doc.save(`Invoice-${data.invoice_number}.pdf`);
};

export const generateCustomsDeclarationPDF = async (data: CustomsDeclarationData) => {
  const doc = new jsPDF();
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMS DECLARATION', 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  let yPos = 35;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Declaration No: ${data.declaration_number}`, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIGNOR', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(data.consignor, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('CONSIGNEE', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(data.consignee, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('GOODS DESCRIPTION', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(data.goods_description, 20, yPos);
  yPos += 7;
  doc.text(`HS Code: ${data.hs_code}`, 20, yPos);
  yPos += 7;
  doc.text(`Quantity: ${data.quantity} kg`, 20, yPos);
  yPos += 7;
  doc.text(`Value: $${data.value.toFixed(2)}`, 20, yPos);
  
  yPos += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('ORIGIN & DESTINATION', 20, yPos);
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`From: ${data.origin_country}`, 20, yPos);
  yPos += 7;
  doc.text(`To: ${data.destination_country}`, 20, yPos);
  
  // QR Code
  if (data.qr_code_data) {
    try {
      const qrDataUrl = await QRCode.toDataURL(data.qr_code_data, { width: 200 });
      doc.addImage(qrDataUrl, 'PNG', 150, 180, 40, 40);
      doc.setFontSize(8);
      doc.text('Scan for verification', 170, 225, { align: 'center' });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  }
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
  
  doc.save(`CustomsDeclaration-${data.declaration_number}.pdf`);
};

interface BIReportData {
  metrics: {
    dispatchSuccessRate: number;
    complianceScore: number;
    inventoryTurnover: number;
    fleetUtilization: number;
    totalShipments: number;
    onTimeDeliveries: number;
    avgDeliveryTime: number;
  };
  filters: {
    startDate: Date;
    endDate: Date;
    region?: string;
    productType?: string;
  };
  trendData: any[];
}

export const generateBIReportPDF = async (data: BIReportData) => {
  const doc = new jsPDF();
  
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BUSINESS INTELLIGENCE REPORT', 105, 20, { align: 'center' });
  
  doc.setLineWidth(0.5);
  doc.line(20, 25, 190, 25);
  
  let yPos = 35;
  
  // Report Period
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Report Period:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.filters.startDate.toLocaleDateString()} - ${data.filters.endDate.toLocaleDateString()}`, 70, yPos);
  yPos += 10;
  
  if (data.filters.region) {
    doc.setFont('helvetica', 'bold');
    doc.text('Region:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(data.filters.region, 70, yPos);
    yPos += 10;
  }
  
  // Key Performance Indicators
  yPos += 5;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('KEY PERFORMANCE INDICATORS', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  const kpis = [
    { label: 'Dispatch Success Rate', value: `${data.metrics.dispatchSuccessRate.toFixed(1)}%` },
    { label: 'Compliance Score', value: `${data.metrics.complianceScore.toFixed(1)}%` },
    { label: 'Inventory Turnover', value: data.metrics.inventoryTurnover.toFixed(2) },
    { label: 'Fleet Utilization', value: `${data.metrics.fleetUtilization.toFixed(1)}%` },
  ];
  
  kpis.forEach(kpi => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${kpi.label}:`, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(kpi.value, 100, yPos);
    yPos += 8;
  });
  
  // Operational Metrics
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('OPERATIONAL METRICS', 20, yPos);
  yPos += 10;
  
  doc.setFontSize(12);
  const metrics = [
    { label: 'Total Shipments', value: data.metrics.totalShipments.toString() },
    { label: 'On-Time Deliveries', value: data.metrics.onTimeDeliveries.toString() },
    { label: 'Average Delivery Time', value: `${data.metrics.avgDeliveryTime.toFixed(1)} hours` },
  ];
  
  metrics.forEach(metric => {
    doc.setFont('helvetica', 'bold');
    doc.text(`${metric.label}:`, 25, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.value, 100, yPos);
    yPos += 8;
  });
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(128, 128, 128);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 105, 280, { align: 'center' });
  doc.text('Confidential - For Internal Use Only', 105, 285, { align: 'center' });
  
  doc.save(`BI-Report-${new Date().toISOString().split('T')[0]}.pdf`);
};
