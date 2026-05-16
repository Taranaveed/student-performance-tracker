import { useState } from 'react';
import { useStudents } from '../../hooks/useStudents';
import { usePerformance } from '../../hooks/usePerformance';
import { Save, CheckCircle } from 'lucide-react';
import { MARKS_SYSTEM } from '../../config/marksSystem';
import { formatDate } from '../../lib/utils';

export function DetailedMarksForm() {
  const { students, loading: studentsLoading } = useStudents();
  const { saveDetailedMarks, loading } = usePerformance();
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [marks, setMarks] = useState(initializeEmptyMarks());
  const [notes, setNotes] = useState('');
  const [saved, setSaved] = useState(false);

  function initializeEmptyMarks() {
    const empty = {};
    ['dailyRoutine', 'hygiene', 'studyDiscipline', 'sportsActivities', 'academics', 'bonus'].forEach(cat => {
      empty[cat] = {};
      MARKS_SYSTEM[cat].factors.forEach(f => {
        empty[cat][f.key] = 0;
      });
    });
    empty.penalties = {};
    Object.entries(MARKS_SYSTEM.penalties.subcategories).forEach(([sub, data]) => {
      empty.penalties[sub] = {};
      data.factors.forEach(f => {
        empty.penalties[sub][f.key] = false;
      });
    });
    return empty;
  }

  const handleMarkChange = (category, factor, value) => {
    const max = getMaxForFactor(category, factor);
    const clamped = Math.max(0, Math.min(max, Number(value)));
    setMarks(prev => ({
      ...prev,
      [category]: { ...prev[category], [factor]: clamped }
    }));
  };

  const handlePenaltyToggle = (subcategory, factor) => {
    setMarks(prev => ({
      ...prev,
      penalties: {
        ...prev.penalties,
        [subcategory]: { ...prev.penalties[subcategory], [factor]: !prev.penalties[subcategory][factor] }
      }
    }));
  };

  const getMaxForFactor = (category, factor) => {
    if (category === 'penalties') return 0;
    const cat = MARKS_SYSTEM[category];
    const f = cat.factors.find(f => f.key === factor);
    return f?.max || 0;
  };

  const calculateTotals = () => {
    let totals = { dailyRoutine: 0, hygiene: 0, studyDiscipline: 0, sportsActivities: 0, academics: 0, bonus: 0, penalties: 0, grandTotal: 0 };
    ['dailyRoutine', 'hygiene', 'studyDiscipline', 'sportsActivities', 'academics', 'bonus'].forEach(cat => {
      totals[cat] = Object.values(marks[cat]).reduce((a, b) => a + b, 0);
    });
    Object.entries(marks.penalties).forEach(([sub, factors]) => {
      Object.entries(factors).forEach(([factor, isApplied]) => {
        if (isApplied) {
          const penaltyData = MARKS_SYSTEM.penalties.subcategories[sub].factors.find(f => f.key === factor);
          totals.penalties += penaltyData.deduction;
        }
      });
    });
    totals.grandTotal = totals.dailyRoutine + totals.hygiene + totals.studyDiscipline + totals.sportsActivities + totals.academics + totals.penalties + totals.bonus;
    return totals;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { alert('Please select a student'); return; }
    const totals = calculateTotals();
    const logData = { studentId: selectedStudent, date: selectedDate, marksAllocation: marks, weeklyTotals: totals, notes };
    try {
      await saveDetailedMarks(logData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setMarks(initializeEmptyMarks());
      setNotes('');
      setSelectedStudent('');
    } catch (error) {
      console.error('Failed to save:', error);
      alert('Failed to save: ' + error.message);
    }
  };

  const totals = calculateTotals();

  if (studentsLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-6xl mx-auto space-y-4 md:space-y-6 px-2 md:px-0">
      {/* Header Controls - STACK ON MOBILE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
            <select
              required
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
            >
              <option value="">Select student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.rollNumber})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Date</label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none min-h-[44px]"
            />
          </div>
          <div className="flex items-end">
            <div className="bg-blue-50 rounded-lg p-3 w-full">
              <span className="text-sm text-blue-600 font-medium">Grand Total: </span>
              <span className="text-xl md:text-2xl font-bold text-blue-700">{totals.grandTotal}</span>
              <span className="text-sm text-blue-500"> / 100</span>
            </div>
          </div>
        </div>
      </div>

      {/* Category Sections */}
      <MarksCategorySection title="A. Daily Routine Discipline" subtitle="Max: 50" factors={MARKS_SYSTEM.dailyRoutine.factors} values={marks.dailyRoutine} onChange={(f, v) => handleMarkChange('dailyRoutine', f, v)} total={totals.dailyRoutine} maxTotal={50} />
      <MarksCategorySection title="B. Hygiene & Turnout" subtitle="Max: 35" factors={MARKS_SYSTEM.hygiene.factors} values={marks.hygiene} onChange={(f, v) => handleMarkChange('hygiene', f, v)} total={totals.hygiene} maxTotal={35} />
      <MarksCategorySection title="C. Study Discipline (Toye)" subtitle="Max: 12" factors={MARKS_SYSTEM.studyDiscipline.factors} values={marks.studyDiscipline} onChange={(f, v) => handleMarkChange('studyDiscipline', f, v)} total={totals.studyDiscipline} maxTotal={12} />
      <MarksCategorySection title="D. Sports & Activities" subtitle="Max: 10" factors={MARKS_SYSTEM.sportsActivities.factors} values={marks.sportsActivities} onChange={(f, v) => handleMarkChange('sportsActivities', f, v)} total={totals.sportsActivities} maxTotal={10} />
      <MarksCategorySection title="E. Academics" subtitle="Max: 25" factors={MARKS_SYSTEM.academics.factors} values={marks.academics} onChange={(f, v) => handleMarkChange('academics', f, v)} total={totals.academics} maxTotal={25} />

      {/* Penalties - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 md:p-6">
        <h3 className="text-base md:text-lg font-semibold text-red-700 mb-1">F. Penalty System</h3>
        <p className="text-xs md:text-sm text-red-500 mb-3 md:mb-4">Check applicable offences</p>
        
        {Object.entries(MARKS_SYSTEM.penalties.subcategories).map(([subKey, subData]) => (
          <div key={subKey} className="mb-4">
            <h4 className="text-sm font-medium text-gray-800 mb-2">{subData.label}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
              {subData.factors.map(f => (
                <label key={f.key} className="flex items-center gap-2.5 p-3 md:p-3 border rounded-lg cursor-pointer hover:bg-red-50 min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={marks.penalties[subKey][f.key]}
                    onChange={() => handlePenaltyToggle(subKey, f.key)}
                    className="w-5 h-5 text-red-600 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <span className="text-sm text-gray-700 block truncate">{f.label}</span>
                    <span className="text-xs text-red-500">{f.deduction} pts</span>
                  </div>
                </label>
              ))}
            </div>
          </div>
        ))}
        
        <div className="mt-3 md:mt-4 p-2.5 md:p-3 bg-red-50 rounded-lg">
          <span className="text-red-600 font-medium text-sm">Total Deductions: {totals.penalties}</span>
        </div>
      </div>

      {/* Bonus */}
      <MarksCategorySection title="G. Bonus (Optional)" subtitle="Max: 16" factors={MARKS_SYSTEM.bonus.factors} values={marks.bonus} onChange={(f, v) => handleMarkChange('bonus', f, v)} total={totals.bonus} maxTotal={16} accentColor="green" />

      {/* Notes */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
          placeholder="Any observations..."
        />
      </div>

      {/* Submit */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-6">
        {saved && (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium text-sm">Saved successfully!</span>
          </div>
        )}
        <div className="flex-1"></div>
        <button
          type="submit"
          disabled={loading || !selectedStudent}
          className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px] text-base"
        >
          <Save className="w-5 h-5" />
          {loading ? 'Saving...' : 'Save Weekly Marks'}
        </button>
      </div>
    </form>
  );
}

function MarksCategorySection({ title, subtitle, factors, values, onChange, total, maxTotal, accentColor = 'blue' }) {
  const colorClasses = { blue: 'border-blue-200', green: 'border-green-200' };
  const headerColors = { blue: 'text-blue-700', green: 'text-green-700' };

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${colorClasses[accentColor]} p-4 md:p-6`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 md:mb-4 gap-1">
        <div>
          <h3 className={`text-base md:text-lg font-semibold ${headerColors[accentColor]}`}>{title}</h3>
          <p className="text-xs md:text-sm text-gray-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <span className="text-xl md:text-2xl font-bold text-gray-900">{total}</span>
          <span className="text-sm text-gray-500"> / {maxTotal}</span>
        </div>
      </div>
      
      {/* 1 column mobile, 2 columns tablet, 4 columns desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {factors.map(f => (
          <div key={f.key}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {f.label}
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max={f.max}
                value={values[f.key]}
                onChange={(e) => onChange(f.key, e.target.value)}
                className="w-20 px-3 py-2.5 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center min-h-[44px]"
              />
              <span className="text-sm text-gray-500">/ {f.max}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}