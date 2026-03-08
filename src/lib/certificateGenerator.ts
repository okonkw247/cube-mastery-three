import jsPDF from 'jspdf';

export function generateCertificatePDF(
  studentName: string,
  courseName: string,
  completedAt: string,
  certificateId: string
): jsPDF {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Gold border
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(3);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setLineWidth(1);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // Inner decorative corners
  doc.setDrawColor(212, 175, 55);
  const cornerSize = 15;
  // Top-left
  doc.line(16, 20, 16, 20 + cornerSize);
  doc.line(16, 20, 16 + cornerSize, 20);
  // Top-right
  doc.line(pageWidth - 16, 20, pageWidth - 16, 20 + cornerSize);
  doc.line(pageWidth - 16, 20, pageWidth - 16 - cornerSize, 20);
  // Bottom-left
  doc.line(16, pageHeight - 20, 16, pageHeight - 20 - cornerSize);
  doc.line(16, pageHeight - 20, 16 + cornerSize, pageHeight - 20);
  // Bottom-right
  doc.line(pageWidth - 16, pageHeight - 20, pageWidth - 16, pageHeight - 20 - cornerSize);
  doc.line(pageWidth - 16, pageHeight - 20, pageWidth - 16 - cornerSize, pageHeight - 20);

  // Title
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('CUBE MASTERY', pageWidth / 2, 35, { align: 'center' });

  // Certificate of Completion
  doc.setFontSize(32);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(212, 175, 55);
  doc.text('Certificate of Completion', pageWidth / 2, 55, { align: 'center' });

  // Decorative line
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.5);
  doc.line(pageWidth / 2 - 60, 60, pageWidth / 2 + 60, 60);

  // "This certifies that"
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('This is to certify that', pageWidth / 2, 75, { align: 'center' });

  // Student name
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 30, 30);
  doc.text(studentName, pageWidth / 2, 92, { align: 'center' });

  // Underline for name
  const nameWidth = doc.getTextWidth(studentName);
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(pageWidth / 2 - nameWidth / 2, 95, pageWidth / 2 + nameWidth / 2, 95);

  // "has successfully completed"
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('has successfully completed the course', pageWidth / 2, 108, { align: 'center' });

  // Course name
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 150, 136);
  doc.text(courseName, pageWidth / 2, 122, { align: 'center' });

  // Date
  const dateStr = new Date(completedAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`Completed on ${dateStr}`, pageWidth / 2, 138, { align: 'center' });

  // Signature area
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.3);
  // Left: Instructor
  doc.line(pageWidth / 2 - 80, 165, pageWidth / 2 - 20, 165);
  doc.setFontSize(9);
  doc.text('Instructor', pageWidth / 2 - 50, 172, { align: 'center' });

  // Right: Platform
  doc.line(pageWidth / 2 + 20, 165, pageWidth / 2 + 80, 165);
  doc.text('Cube Mastery', pageWidth / 2 + 50, 172, { align: 'center' });

  // Certificate ID
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Certificate ID: ${certificateId.toUpperCase()}`, pageWidth / 2, pageHeight - 25, { align: 'center' });
  doc.text(`Verify at: ${window.location.origin}/verify/${certificateId}`, pageWidth / 2, pageHeight - 20, { align: 'center' });

  return doc;
}
