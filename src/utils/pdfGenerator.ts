import jsPDF from 'jspdf';

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
