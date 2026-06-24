import jsPDF from 'jspdf';
import { Download } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function sectionSum(obj) {
  if (!obj || typeof obj !== 'object') return 0;
  return Object.values(obj).reduce((s, v) => s + (Number(v) || 0), 0);
}

function weekTotal(rec) {
  if (!rec) return 0;
  const dr  = sectionSum(rec.dailyRoutine);
  const hy  = sectionSum(rec.hygiene);
  const sd  = sectionSum(rec.studyDiscipline);
  const ac  = sectionSum(rec.academics?.marks);
  const acP = rec.academics?.penalties?.classBunking ? -1 : 0;
  const sk  = rec.skillsProgram?.days ? sectionSum(rec.skillsProgram.days) : 0;
  let pen = 0;
  if (rec.penalties) {
    Object.values(rec.penalties).forEach(sub => {
      if (typeof sub === 'object') Object.values(sub).forEach(v => { if (v) pen -= 1; });
    });
  }
  const bon = sectionSum(rec.bonus);
  return dr + hy + sd + ac + acP + sk + pen + bon;
}

export function PDFGenerator({ student, records = [], month, year }) {
  const generatePDF = () => {
    if (!records || records.length === 0) {
      alert('No weekly data to export.');
      return;
    }

    const doc   = new jsPDF();
    const count = records.length;

    // School header
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Chand Bagh School', 105, 10, { align: 'center' });

    // Title
    doc.setFontSize(18);
    doc.setTextColor(37, 99, 235);
    doc.text('Student Performance Report', 105, 18, { align: 'center' });

    // Student info
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`Student:     ${student.name}`, 20, 34);
    doc.text(`Roll No:     ${student.rollNumber}`, 20, 42);
    if (student.grade) doc.text(`Grade:       ${student.grade}`, 20, 50);
    if (student.house) doc.text(`House:       ${student.house}`, 20, 58);
    doc.text(`Period:      ${MONTHS[month-1]} ${year}`, 110, 34);
    doc.text(`Weeks logged: ${count}`, 110, 42);

    // Section averages
    let y = 72;
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235);
    doc.text('Monthly Section Averages', 20, y);
    y += 8;

    const rows = [
      ['A. Daily Routine',    records.reduce((s,r)=>s+sectionSum(r.dailyRoutine),0)/count, 50 ],
      ['B. Hygiene & Turnout',records.reduce((s,r)=>s+sectionSum(r.hygiene),0)/count,      35 ],
      ['C. Study Discipline', records.reduce((s,r)=>s+sectionSum(r.studyDiscipline),0)/count,12],
      ['E. Academics',        records.reduce((s,r)=>s+sectionSum(r.academics?.marks),0)/count,25],
      ['F. Skills',           records.reduce((s,r)=>s+(r.skillsProgram?.days?sectionSum(r.skillsProgram.days):0),0)/count, '—'],
    ];

    // Header row
    doc.setFontSize(10);
    doc.setFillColor(37, 99, 235);
    doc.setTextColor(255, 255, 255);
    doc.rect(20, y-5, 170, 9, 'F');
    doc.text('Category', 25, y);
    doc.text('Avg / Week', 100, y);
    doc.text('Max', 140, y);
    doc.text('% Score', 160, y);
    y += 9;
    doc.setTextColor(0, 0, 0);

    rows.forEach(([cat, avg, max], i) => {
      if (i % 2 === 0) { doc.setFillColor(245, 247, 250); doc.rect(20, y-5, 170, 8, 'F'); }
      doc.text(cat, 25, y);
      doc.text(avg.toFixed(1), 105, y);
      doc.text(String(max), 143, y);
      doc.text(typeof max === 'number' ? (avg/max*100).toFixed(0)+'%' : '—', 163, y);
      y += 9;
    });

    // Grand total
    const grandAvg = records.reduce((s,r)=>s+weekTotal(r),0)/count;
    y += 4;
    doc.setFontSize(13);
    doc.setTextColor(37, 99, 235);
    doc.text(`Average Grand Total: ${grandAvg.toFixed(1)} / 137`, 105, y, { align: 'center' });

    // Weekly breakdown table
    y += 14;
    doc.setFontSize(12);
    doc.text('Weekly Breakdown', 20, y);
    y += 8;

    doc.setFontSize(9);
    doc.setFillColor(229, 231, 235);
    doc.setTextColor(0, 0, 0);
    doc.rect(20, y-4, 170, 7, 'F');
    ['Week','Routine','Hygiene','Study','Acad','Skills','Pen','Bon','Total'].forEach((h, i) => {
      doc.text(h, 22 + i * 19, y);
    });
    y += 7;

    [1,2,3,4].forEach((w, idx) => {
      const rec = records.find(r => r.week === w);
      if (idx % 2 === 0) { doc.setFillColor(248, 250, 252); doc.rect(20, y-3, 170, 6, 'F'); }
      const dr  = rec ? sectionSum(rec.dailyRoutine) : '—';
      const hy  = rec ? sectionSum(rec.hygiene) : '—';
      const sd  = rec ? sectionSum(rec.studyDiscipline) : '—';
      const ac  = rec ? sectionSum(rec.academics?.marks) : '—';
      const sk  = rec?.skillsProgram?.days ? sectionSum(rec.skillsProgram.days) : '—';
      let pen = rec ? 0 : '—';
      if (rec?.penalties) { Object.values(rec.penalties).forEach(s => { if (typeof s==='object') Object.values(s).forEach(v=>{if(v)pen-=1;}); }); }
      const bon   = rec ? sectionSum(rec.bonus) : '—';
      const total = rec ? weekTotal(rec) : '—';
      [w, dr, hy, sd, ac, sk, pen, bon, total].forEach((v, i) => {
        doc.text(String(v), 22 + i * 19, y);
      });
      y += 6;
    });

    doc.save(`${student.name}_${MONTHS[month-1]}_${year}.pdf`);
  };

  return (
    <button onClick={generatePDF} disabled={!records || records.length === 0}
      className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm">
      <Download className="w-4 h-4" />
      Export PDF
    </button>
  );
}
