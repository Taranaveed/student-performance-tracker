import { useState, useEffect } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { usePerformance } from '../../hooks/usePerformance';
import { PDFGenerator } from './PDFGenerator';
import { Calendar, TrendingUp, AlertCircle } from 'lucide-react';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function calcWeekTotal(rec) {
  if (!rec) return 0;
  const dr  = rec.dailyRoutine    ? Object.values(rec.dailyRoutine).reduce((a,b)=>a+Number(b||0),0)     : 0;
  const hy  = rec.hygiene         ? Object.values(rec.hygiene).reduce((a,b)=>a+Number(b||0),0)          : 0;
  const sd  = rec.studyDiscipline ? Object.values(rec.studyDiscipline).reduce((a,b)=>a+Number(b||0),0)  : 0;
  const acF = rec.academics?.marks? Object.values(rec.academics.marks).reduce((a,b)=>a+Number(b||0),0)  : 0;
  const acP = rec.academics?.penalties?.classBunking ? -1 : 0;
  const sk  = rec.skillsProgram?.days ? Object.values(rec.skillsProgram.days).reduce((a,b)=>a+Number(b||0),0):0;
  let pen = 0;
  if (rec.penalties) {
    Object.values(rec.penalties).forEach(sub => {
      if (typeof sub === 'object') Object.values(sub).forEach(v => { if (v) pen -= 1; });
    });
  }
  const bon = rec.bonus ? Object.values(rec.bonus).reduce((a,b)=>a+Number(b||0),0) : 0;
  return dr + hy + sd + acF + acP + sk + pen + bon;
}

export function ReportCard() {
  const { students } = useStudents();
  const { getMonthlyRecords } = usePerformance();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedMonth,   setSelectedMonth]   = useState(new Date().getMonth() + 1);
  const [selectedYear,    setSelectedYear]    = useState(new Date().getFullYear());
  const [records,         setRecords]         = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState(null);

  useEffect(() => {
    if (!selectedStudent) { setRecords([]); return; }
    setLoading(true);
    setError(null);
    getMonthlyRecords(selectedStudent, selectedYear, selectedMonth)
      .then(data => { setRecords(data); setLoading(false); })
      .catch(err => { setError(err.message); setLoading(false); });
  }, [selectedStudent, selectedMonth, selectedYear, getMonthlyRecords]);

  const currentStudent = students.find(s => s.id === selectedStudent);
  const years = [new Date().getFullYear(), new Date().getFullYear()-1, new Date().getFullYear()+1];

  // Monthly totals per section
  const sectionAverages = records.length > 0 ? {
    'Daily Routine':    (records.reduce((s,r) => s + (r.dailyRoutine?Object.values(r.dailyRoutine).reduce((a,b)=>a+Number(b||0),0):0), 0) / records.length).toFixed(1),
    'Hygiene':          (records.reduce((s,r) => s + (r.hygiene?Object.values(r.hygiene).reduce((a,b)=>a+Number(b||0),0):0), 0) / records.length).toFixed(1),
    'Study Discipline': (records.reduce((s,r) => s + (r.studyDiscipline?Object.values(r.studyDiscipline).reduce((a,b)=>a+Number(b||0),0):0), 0) / records.length).toFixed(1),
    'Academics':        (records.reduce((s,r) => s + (r.academics?.marks?Object.values(r.academics.marks).reduce((a,b)=>a+Number(b||0),0):0), 0) / records.length).toFixed(1),
  } : null;

  return (
    <div className="space-y-4 md:space-y-6 px-2 md:px-0">

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
            <select value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]">
              <option value="">Choose student…</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Month</label>
            <select value={selectedMonth} onChange={e => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]">
              {MONTHS.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Year</label>
            <select value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm">{error}</div>
      )}

      {selectedStudent && currentStudent && (
        <>
          {/* Student info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-wrap gap-4 items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">{currentStudent.name}</h2>
              <p className="text-sm text-gray-500">
                Roll: {currentStudent.rollNumber}
                {currentStudent.grade && ` · Grade ${currentStudent.grade}`}
                {currentStudent.house && ` · ${currentStudent.house} House`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{MONTHS[selectedMonth-1]} {selectedYear}</span>
              {currentStudent && (
                <PDFGenerator student={currentStudent} records={records} month={selectedMonth} year={selectedYear} />
              )}
            </div>
          </div>

          {/* Section averages */}
          {sectionAverages && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {Object.entries(sectionAverages).map(([key, val]) => (
                <div key={key} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-600">{key}</span>
                    <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{val}</p>
                  <p className="text-xs text-gray-400 mt-0.5">avg / week</p>
                </div>
              ))}
            </div>
          )}

          {/* Weekly table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Weekly Breakdown ({records.length} week{records.length !== 1 ? 's' : ''} logged)
              </h3>
            </div>

            {loading ? (
              <div className="h-32 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 px-4">
                <table className="w-full text-sm min-w-[700px]">
                  <thead className="text-xs text-gray-600 uppercase bg-gray-50">
                    <tr>
                      <th className="px-3 py-3 text-left rounded-l-lg">Week</th>
                      <th className="px-3 py-3 text-center">Routine<br/>/50</th>
                      <th className="px-3 py-3 text-center">Hygiene<br/>/35</th>
                      <th className="px-3 py-3 text-center">Study<br/>/12</th>
                      <th className="px-3 py-3 text-center">Sports</th>
                      <th className="px-3 py-3 text-center">Acad<br/>/25</th>
                      <th className="px-3 py-3 text-center">Skills</th>
                      <th className="px-3 py-3 text-center text-red-600">Pen</th>
                      <th className="px-3 py-3 text-center text-green-600">Bonus</th>
                      <th className="px-3 py-3 text-center font-bold text-blue-700 rounded-r-lg">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[1,2,3,4].map(w => {
                      const rec = records.find(r => r.week === w);
                      const dr  = rec?.dailyRoutine    ? Object.values(rec.dailyRoutine).reduce((a,b)=>a+Number(b||0),0)    : null;
                      const hy  = rec?.hygiene         ? Object.values(rec.hygiene).reduce((a,b)=>a+Number(b||0),0)          : null;
                      const sd  = rec?.studyDiscipline ? Object.values(rec.studyDiscipline).reduce((a,b)=>a+Number(b||0),0)  : null;
                      const ac  = rec?.academics?.marks? Object.values(rec.academics.marks).reduce((a,b)=>a+Number(b||0),0)  : null;
                      const sk  = rec?.skillsProgram?.days ? Object.values(rec.skillsProgram.days).reduce((a,b)=>a+Number(b||0),0) : null;
                      const sp  = rec?.sportsActivities?.sportsParticipation ?? null;
                      let pen = 0;
                      if (rec?.penalties) {
                        Object.values(rec.penalties).forEach(sub => {
                          if (typeof sub === 'object') Object.values(sub).forEach(v => { if (v) pen -= 1; });
                        });
                      }
                      const bon = rec?.bonus ? Object.values(rec.bonus).reduce((a,b)=>a+Number(b||0),0) : null;
                      const total = rec ? calcWeekTotal(rec) : null;

                      return (
                        <tr key={w} className={`border-b border-gray-100 ${rec ? 'hover:bg-gray-50' : 'text-gray-300'}`}>
                          <td className="px-3 py-3 font-medium">Week {w}</td>
                          <td className="px-3 py-3 text-center">{dr ?? '—'}</td>
                          <td className="px-3 py-3 text-center">{hy ?? '—'}</td>
                          <td className="px-3 py-3 text-center">{sd ?? '—'}</td>
                          <td className="px-3 py-3 text-center text-xs">{sp ?? '—'}</td>
                          <td className="px-3 py-3 text-center">{ac ?? '—'}</td>
                          <td className="px-3 py-3 text-center">{sk !== null && sk > 0 ? sk : '—'}</td>
                          <td className="px-3 py-3 text-center text-red-500">{pen !== 0 ? pen : '—'}</td>
                          <td className="px-3 py-3 text-center text-green-500">{bon !== null && bon > 0 ? bon : '—'}</td>
                          <td className="px-3 py-3 text-center font-bold text-blue-700">{total ?? '—'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  {records.length > 0 && (
                    <tfoot>
                      <tr className="bg-blue-50 font-semibold">
                        <td className="px-3 py-3 text-blue-700 rounded-l-lg">Monthly Total</td>
                        <td colSpan={8} />
                        <td className="px-3 py-3 text-center text-blue-700 text-lg rounded-r-lg">
                          {records.reduce((s, r) => s + calcWeekTotal(r), 0)}
                        </td>
                      </tr>
                    </tfoot>
                  )}
                </table>

                {records.length === 0 && !loading && (
                  <div className="text-center py-10 text-gray-400">
                    <AlertCircle className="w-6 h-6 mx-auto mb-2" />
                    <p>No records found for {MONTHS[selectedMonth-1]} {selectedYear}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Academic details per week */}
          {records.some(r => r.academics?.subject) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Academic Details</h3>
              <div className="space-y-2">
                {records.filter(r => r.academics?.subject).map(r => (
                  <div key={r.id} className="flex flex-wrap items-center gap-2 text-sm py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Week {r.week}</span>
                    <span className="text-gray-500">·</span>
                    <span className="text-purple-700">{r.academics.subject}</span>
                    <span className="text-gray-400">by {r.academics.teacherName}</span>
                    <span className="ml-auto font-bold text-purple-700">
                      {Object.values(r.academics.marks).reduce((a,b)=>a+Number(b||0),0)} / 25
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Events */}
          {records.some(r => r.events && Object.values(r.events).some(e => e.position)) && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-3">Events Participated</h3>
              <div className="space-y-1">
                {records.flatMap(r =>
                  r.events ? Object.entries(r.events).filter(([,v]) => v.position).map(([key, v]) => (
                    <div key={key + r.week} className="flex items-center gap-3 text-sm py-1.5 border-b border-gray-100">
                      <span className="text-gray-500">Week {r.week}</span>
                      <span className="text-gray-800 flex-1">{key.replace(/([A-Z])/g,' $1')}</span>
                      <span className="font-medium text-pink-700">{v.position}</span>
                      {v.marksPercent && <span className="text-gray-500">{v.marksPercent}%</span>}
                    </div>
                  )) : []
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
