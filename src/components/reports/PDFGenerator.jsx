import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

export function PDFGenerator({ student, logs, month, year }) {
  const generatePDF = () => {
    if (!logs || logs.length === 0) {
      alert('No data to export. Please log some ratings first.');
      return;
    }

    const doc = new jsPDF();
    
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('Student Performance Report', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student: ${student.name}`, 20, 40);
    doc.text(`Roll Number: ${student.rollNumber}`, 20, 48);
    doc.text(`Period: ${month}/${year}`, 20, 56);
    doc.text(`Total Days Logged: ${logs.length}`, 20, 64);
    
    // Calculate averages from detailed marks
    const totals = logs.reduce((acc, log) => {
      const t = log.weeklyTotals || {};
      acc.dailyRoutine += t.dailyRoutine || 0;
      acc.hygiene += t.hygiene || 0;
      acc.studyDiscipline += t.studyDiscipline || 0;
      acc.sportsActivities += t.sportsActivities || 0;
      acc.academics += t.academics || 0;
      acc.penalties += t.penalties || 0;
      acc.bonus += t.bonus || 0;
      acc.grandTotal += t.grandTotal || 0;
      return acc;
    }, { 
      dailyRoutine: 0, hygiene: 0, studyDiscipline: 0, 
      sportsActivities: 0, academics: 0, penalties: 0, bonus: 0, grandTotal: 0 
    });
    
    const count = logs.length;
    
    // Summary Table
    let y = 80;
    doc.setFontSize(11);
    doc.setFillColor(37, 99, 235);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, y - 6, 170, 10, 'F');
    doc.text('Category', 25, y);
    doc.text('Average', 80, y);
    doc.text('Max', 110, y);
    doc.text('% Score', 145, y);
    
    y += 10;
    doc.setTextColor(0, 0, 0);
    
    const categories = [
      ['Daily Routine', (totals.dailyRoutine / count).toFixed(1), '50', ((totals.dailyRoutine / count) / 50 * 100).toFixed(0)],
      ['Hygiene & Turnout', (totals.hygiene / count).toFixed(1), '35', ((totals.hygiene / count) / 35 * 100).toFixed(0)],
      ['Study Discipline', (totals.studyDiscipline / count).toFixed(1), '12', ((totals.studyDiscipline / count) / 12 * 100).toFixed(0)],
      ['Sports & Activities', (totals.sportsActivities / count).toFixed(1), '10', ((totals.sportsActivities / count) / 10 * 100).toFixed(0)],
      ['Academics', (totals.academics / count).toFixed(1), '25', ((totals.academics / count) / 25 * 100).toFixed(0)]
    ];
    
    categories.forEach(([cat, avg, max, pct], index) => {
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y - 5, 170, 10, 'F');
      }
      
      doc.text(cat, 25, y);
      doc.text(avg, 82, y);
      doc.text(max, 112, y);
      doc.text(pct + '%', 147, y);
      y += 10;
    });
    
    // Penalties and Bonus
    y += 5;
    doc.setFillColor(254, 226, 226);
    doc.rect(20, y - 5, 170, 10, 'F');
    doc.setTextColor(220, 38, 38);
    doc.text(`Penalties: ${(totals.penalties / count).toFixed(1)} avg`, 25, y);
    doc.text(`Bonus: ${(totals.bonus / count).toFixed(1)} avg`, 100, y);
    
    y += 15;
    doc.setTextColor(37, 99, 235);
    doc.setFontSize(14);
    doc.text(`GRAND TOTAL: ${(totals.grandTotal / count).toFixed(1)} / 100`, 105, y, { align: 'center' });
    
    // Detailed Logs Table
    y += 20;
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('Detailed Log Entries:', 20, y);
    
    y += 10;
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    
    // Header
    doc.setFillColor(229, 231, 235);
    doc.rect(20, y - 4, 170, 7, 'F');
    doc.text('Date', 22, y);
    doc.text('Routine', 45, y);
    doc.text('Hygiene', 65, y);
    doc.text('Study', 85, y);
    doc.text('Sports', 103, y);
    doc.text('Acad', 121, y);
    doc.text('Pen', 137, y);
    doc.text('Bon', 150, y);
    doc.text('Total', 163, y);
    
    y += 7;
    
    logs.forEach((log, index) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      
      if (index % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(20, y - 3, 170, 6, 'F');
      }
      
      const t = log.weeklyTotals || {};
      
      doc.text(log.date, 22, y);
      doc.text(String(t.dailyRoutine || 0), 47, y);
      doc.text(String(t.hygiene || 0), 67, y);
      doc.text(String(t.studyDiscipline || 0), 87, y);
      doc.text(String(t.sportsActivities || 0), 105, y);
      doc.text(String(t.academics || 0), 123, y);
      doc.setTextColor(220, 38, 38);
      doc.text(String(t.penalties || 0), 139, y);
      doc.setTextColor(22, 163, 74);
      doc.text(String(t.bonus || 0), 152, y);
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(8);
      doc.text(String(t.grandTotal || 0), 165, y);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      
      y += 6;
    });
    
    doc.save(`${student.name}_Report_${month}_${year}.pdf`);
  };

  return (
    <button
      onClick={generatePDF}
      disabled={!logs || logs.length === 0}
      className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <Download className="w-4 h-4" />
      Export PDF
    </button>
  );
}