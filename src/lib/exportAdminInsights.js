import jsPDF from 'jspdf';

const PAGE_WIDTH = 210;
const MARGIN = 20;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const PAGE_BOTTOM = 285;

function truncate(text, maxLen = 42) {
  const str = String(text ?? '');
  return str.length > maxLen ? `${str.slice(0, maxLen - 1)}…` : str;
}

function ensureSpace(doc, y, needed, top = 20) {
  if (y + needed > PAGE_BOTTOM) {
    doc.addPage();
    return top;
  }
  return y;
}

function drawSectionTitle(doc, title, y) {
  doc.setFontSize(12);
  doc.setTextColor(37, 99, 235);
  doc.text(title, MARGIN, y);
  return y + 8;
}

function drawTableHeader(doc, columns, y) {
  doc.setFontSize(9);
  doc.setFillColor(37, 99, 235);
  doc.setTextColor(255, 255, 255);
  doc.rect(MARGIN, y - 5, CONTENT_WIDTH, 8, 'F');
  columns.forEach(({ label, x }) => doc.text(label, x, y));
  return y + 9;
}

function drawTableRow(doc, cells, y, shaded = false) {
  if (shaded) {
    doc.setFillColor(248, 250, 252);
    doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 7, 'F');
  }
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  cells.forEach(({ text, x, maxWidth }) => {
    const value = maxWidth ? truncate(text, maxWidth) : String(text ?? '');
    doc.text(value, x, y);
  });
  return y + 7;
}

/**
 * Export Admin Insights data as a formatted PDF report.
 */
export function exportAdminInsightsPdf({
  behavioralStudents,
  rankingsByGrade,
  periodLabel,
  filterGrade = '',
  filterHouse = '',
  studentsInScope = 0,
}) {
  const doc = new jsPDF();
  const generatedAt = new Date().toLocaleString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Header
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text('Chand Bagh School', PAGE_WIDTH / 2, 12, { align: 'center' });

  doc.setFontSize(18);
  doc.setTextColor(37, 99, 235);
  doc.text('Admin Insights Report', PAGE_WIDTH / 2, 22, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  let y = 36;
  doc.text(`Period: ${periodLabel}`, MARGIN, y);
  doc.text(`Generated: ${generatedAt}`, 120, y);
  y += 8;
  doc.text(`Class filter: ${filterGrade ? filterGrade.toUpperCase() : 'All classes'}`, MARGIN, y);
  doc.text(`House filter: ${filterHouse || 'All houses'}`, 120, y);
  y += 8;

  doc.setFillColor(239, 246, 255);
  doc.setDrawColor(191, 219, 254);
  doc.rect(MARGIN, y - 4, CONTENT_WIDTH, 14, 'FD');
  doc.setFontSize(10);
  doc.setTextColor(30, 64, 175);
  doc.text(`Behavioral flags: ${behavioralStudents.length}`, MARGIN + 4, y + 2);
  doc.text(`Classes ranked: ${rankingsByGrade.length}`, 78, y + 2);
  doc.text(`Students in scope: ${studentsInScope}`, 138, y + 2);
  y += 20;

  // Behavioral concerns
  y = drawSectionTitle(doc, 'Behavioral Concerns (Serious + Major)', y);

  if (behavioralStudents.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No serious or major offences for the current filters.', MARGIN, y);
    y += 12;
  } else {
    const behaviorCols = [
      { label: 'Name', x: MARGIN + 2 },
      { label: 'Class', x: 62 },
      { label: 'House', x: 82 },
      { label: 'Roll', x: 112 },
      { label: 'Offences', x: 132 },
    ];
    y = drawTableHeader(doc, behaviorCols, y);

    behavioralStudents.forEach(({ student, offences }, idx) => {
      y = ensureSpace(doc, y, 10);
      if (y === 20) y = drawTableHeader(doc, behaviorCols, y);

      y = drawTableRow(doc, [
        { text: student.name, x: MARGIN + 2, maxWidth: 28 },
        { text: student.grade?.toUpperCase(), x: 62 },
        { text: student.house, x: 82, maxWidth: 12 },
        { text: student.rollNumber, x: 112 },
        { text: offences.map(o => o.label).join(', '), x: 132, maxWidth: 38 },
      ], y, idx % 2 === 0);
    });
    y += 6;
  }

  // Top 3 per class
  y = ensureSpace(doc, y, 24);
  y = drawSectionTitle(doc, 'Top 3 Per Class', y);

  if (rankingsByGrade.every(r => r.top.length === 0)) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No scored records for the current filters.', MARGIN, y);
    y += 12;
  } else {
    const rankCols = [
      { label: 'Class', x: MARGIN + 2 },
      { label: 'Rank', x: 38 },
      { label: 'Name', x: 52 },
      { label: 'House', x: 112 },
      { label: 'Roll', x: 142 },
      { label: 'Avg', x: 168 },
    ];
    y = drawTableHeader(doc, rankCols, y);

    let rowIdx = 0;
    rankingsByGrade.forEach(({ grade, top }) => {
      top.forEach(({ student, avgScore }, idx) => {
        y = ensureSpace(doc, y, 10);
        if (y === 20) y = drawTableHeader(doc, rankCols, y);

        y = drawTableRow(doc, [
          { text: grade.toUpperCase(), x: MARGIN + 2 },
          { text: `#${idx + 1}`, x: 38 },
          { text: student.name, x: 52, maxWidth: 28 },
          { text: student.house, x: 112, maxWidth: 12 },
          { text: student.rollNumber, x: 142 },
          { text: avgScore, x: 168 },
        ], y, rowIdx % 2 === 0);
        rowIdx += 1;
      });
    });
    y += 6;
  }

  // Bottom 3 per class
  y = ensureSpace(doc, y, 24);
  y = drawSectionTitle(doc, 'Bottom 3 Per Class', y);

  if (rankingsByGrade.every(r => r.bottom.length === 0)) {
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('No scored records for the current filters.', MARGIN, y);
  } else {
    const rankCols = [
      { label: 'Class', x: MARGIN + 2 },
      { label: 'Rank', x: 38 },
      { label: 'Name', x: 52 },
      { label: 'House', x: 112 },
      { label: 'Roll', x: 142 },
      { label: 'Avg', x: 168 },
    ];
    y = drawTableHeader(doc, rankCols, y);

    let rowIdx = 0;
    rankingsByGrade.forEach(({ grade, bottom }) => {
      bottom.forEach(({ student, avgScore }, idx) => {
        y = ensureSpace(doc, y, 10);
        if (y === 20) y = drawTableHeader(doc, rankCols, y);

        y = drawTableRow(doc, [
          { text: grade.toUpperCase(), x: MARGIN + 2 },
          { text: `#${idx + 1}`, x: 38 },
          { text: student.name, x: 52, maxWidth: 28 },
          { text: student.house, x: 112, maxWidth: 12 },
          { text: student.rollNumber, x: 142 },
          { text: avgScore, x: 168 },
        ], y, rowIdx % 2 === 0);
        rowIdx += 1;
      });
    });
  }

  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`admin-insights-${stamp}.pdf`);
}
