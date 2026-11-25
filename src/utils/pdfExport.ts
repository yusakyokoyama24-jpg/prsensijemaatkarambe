import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AppSettings, AttendanceRecord, UserProfile } from '../types';

export interface MonthlyPdfOptions {
  records: AttendanceRecord[];
  employees: UserProfile[];
  settings: AppSettings;
  monthName: string;
  periodFilterText?: string;
  departmentFilter?: string;
}

export function exportAttendanceToPDF({
  records,
  employees,
  settings,
  monthName,
  periodFilterText,
  departmentFilter,
}: MonthlyPdfOptions) {
  // Create A4 Landscape PDF for structured, readable presentation
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // 1. Header & Kop Surat Gereja (Toraja Crimson & Gold Accents)
  doc.setFillColor(153, 27, 27); // Dark Crimson #991b1b
  doc.rect(0, 0, pageWidth, 5, 'F');

  doc.setFillColor(217, 119, 6); // Amber Gold #d97706
  doc.rect(0, 5, pageWidth, 1.5, 'F');

  // Church Name Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(settings.churchName.toUpperCase(), pageWidth / 2, 16, { align: 'center' });

  // Church Subtitle & Address
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105); // Slate 600
  doc.text(settings.churchSubtitle, pageWidth / 2, 21, { align: 'center' });
  doc.setFontSize(8);
  doc.text(
    `${settings.churchAddress} • Telp/WA: ${settings.churchContact} • Email: ${settings.churchEmail}`,
    pageWidth / 2,
    25.5,
    { align: 'center' }
  );

  // Decorative Double Divider Line
  doc.setDrawColor(203, 213, 225); // Slate 300
  doc.setLineWidth(0.6);
  doc.line(14, 28, pageWidth - 14, 28);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.25);
  doc.line(14, 29, pageWidth - 14, 29);

  // 2. Official Document Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(153, 27, 27);
  doc.text('LAPORAN REKAPITULASI PRESENSI KEPEGAWAIAN BULANAN', pageWidth / 2, 36, {
    align: 'center',
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const filterDesc = periodFilterText || `Bulan: ${monthName}`;
  const deptDesc =
    departmentFilter && departmentFilter !== 'ALL'
      ? ` • Unit Pelayanan: ${departmentFilter}`
      : ' • Seluruh Unit Pelayanan';
  doc.text(`Periode: ${filterDesc}${deptDesc}`, pageWidth / 2, 41, { align: 'center' });

  // 3. Summary Statistics Box
  const total = records.length;
  const onTime = records.filter((r) => r.status === 'ON_TIME').length;
  const late = records.filter((r) => r.status === 'LATE').length;
  const outside = records.filter((r) => r.status === 'OUTSIDE_RADIUS').length;
  const onTimePercent = total > 0 ? Math.round((onTime / total) * 100) : 0;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 45, pageWidth - 28, 13, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);

  const colW = (pageWidth - 28) / 5;
  const statsY = 53;

  doc.text(`Total Kehadiran: ${total}`, 14 + 5, statsY);
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`Tepat Waktu: ${onTime} (${onTimePercent}%)`, 14 + colW + 5, statsY);
  doc.setTextColor(234, 88, 12); // Orange
  doc.text(`Terlambat: ${late}`, 14 + colW * 2 + 5, statsY);
  doc.setTextColor(225, 29, 72); // Rose
  doc.text(`Luar Radius: ${outside}`, 14 + colW * 3 + 5, statsY);
  doc.setTextColor(100, 116, 139); // Slate
  doc.text(`Pegawai Aktif: ${employees.length} Orang`, 14 + colW * 4 + 5, statsY);

  // 4. Data Table
  const tableRows = records.map((r, idx) => {
    let statusLabel = 'Tepat Waktu';
    if (r.status === 'LATE') statusLabel = `Terlambat (+${r.latenessMinutes || 0}m)`;
    else if (r.status === 'OUTSIDE_RADIUS') statusLabel = 'Luar Radius';
    else if (r.status === 'PENDING_REVIEW') statusLabel = 'Perlu Review';
    else if (r.status === 'REJECTED') statusLabel = 'Ditolak';

    return [
      idx + 1,
      r.workDate,
      r.sessionType === 'MORNING' ? 'Pagi (Masuk)' : 'Sore (Pulang)',
      r.employeeName,
      r.employeeNip,
      r.department,
      r.localTimeStr,
      `${Math.round(r.distanceMeters)} m`,
      statusLabel,
      r.notes || '-',
    ];
  });

  autoTable(doc, {
    startY: 61,
    head: [
      [
        'No',
        'Tanggal',
        'Sesi',
        'Nama Pegawai',
        'NIP',
        'Unit Pelayanan',
        'Jam Presensi',
        'Jarak GPS',
        'Status',
        'Keterangan',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [153, 27, 27], // Dark Crimson
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 1.8,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 20, halign: 'center' },
      2: { cellWidth: 24, halign: 'center' },
      3: { cellWidth: 42, fontStyle: 'bold' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 44 },
      6: { cellWidth: 26, halign: 'center' },
      7: { cellWidth: 18, halign: 'center' },
      8: { cellWidth: 28, halign: 'center' },
      9: { cellWidth: 'auto' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 8) {
        const text = String(data.cell.raw);
        if (text.includes('Tepat Waktu')) {
          data.cell.styles.textColor = [16, 149, 100];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('Terlambat')) {
          data.cell.styles.textColor = [194, 65, 12];
          data.cell.styles.fontStyle = 'bold';
        } else if (text.includes('Luar Radius') || text.includes('Ditolak')) {
          data.cell.styles.textColor = [190, 18, 60];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 14, right: 14, bottom: 35 },
  });

  // 5. Signature Section (Bottom of document)
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  let signatureY = finalY + 10;

  if (signatureY + 35 > pageHeight) {
    doc.addPage();
    signatureY = 22;
  }

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);

  // Left Column (Administrator Kepegawaian)
  const leftX = 35;
  doc.text(`Karambe, ${currentDateFormatted}`, leftX, signatureY, { align: 'center' });
  doc.text('Dibuat Oleh,', leftX, signatureY + 4.5, { align: 'center' });
  doc.text('Tata Usaha & Kepegawaian Gereja', leftX, signatureY + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('Martha Pabuntang, S.Kom', leftX, signatureY + 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('NIP: PGR-2022-002', leftX, signatureY + 30, { align: 'center' });

  // Right Column (Pendeta Jemaat / Pimpinan Majelis)
  const rightX = pageWidth - 45;
  doc.setFontSize(8);
  doc.text('Mengetahui / Mengesahkan,', rightX, signatureY + 4.5, { align: 'center' });
  doc.text('Pendeta Jemaat / Majelis Gereja', rightX, signatureY + 8.5, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.text('Pdt. Markus Sampe, M.Th', rightX, signatureY + 26, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('NIP: PGR-2021-001', rightX, signatureY + 30, { align: 'center' });

  // Page Numbers Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `Dokumen Resmi Presensi Pegawai — ${settings.churchName} | Halaman ${i} dari ${totalPages}`,
      pageWidth / 2,
      pageHeight - 5,
      { align: 'center' }
    );
  }

  // Save PDF file
  const safeMonth = monthName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Presensi_Bulanan_Gereja_Toraja_Karambe_${safeMonth}.pdf`;
  doc.save(fileName);
}
