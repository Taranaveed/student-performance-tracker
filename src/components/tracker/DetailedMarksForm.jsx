import { useState, useEffect, useCallback, useRef } from 'react';
import { Save, CheckCircle, Lock } from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { usePerformance } from '../../hooks/usePerformance';
import { useAuth } from '../../context/AuthContext';
import { MARKS_SYSTEM } from '../../config/marksSystem';

// ── Helpers ──────────────────────────────────────────────────────────────────

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

function emptyAcademics() {
  const marks = {};
  MARKS_SYSTEM.academics.factors.forEach(f => { marks[f.key] = 0; });
  return { teacherName: '', subject: '', marks, penalties: { classBunking: false } };
}

function emptyNumericSection(cat) {
  const vals = {};
  MARKS_SYSTEM[cat].factors.forEach(f => { vals[f.key] = 0; });
  return vals;
}

function emptyPenalties() {
  const p = {};
  Object.entries(MARKS_SYSTEM.penalties.subcategories).forEach(([sub, data]) => {
    p[sub] = {};
    data.factors.forEach(f => { p[sub][f.key] = false; });
  });
  return p;
}

function emptyBonus() {
  const b = {};
  MARKS_SYSTEM.bonus.factors.forEach(f => { b[f.key] = 0; });
  return b;
}

function emptySports() {
  const s = {};
  MARKS_SYSTEM.sportsActivities.fields.forEach(f => { s[f.key] = ''; });
  return s;
}

function emptySkills() {
  const days = {};
  for (let i = 1; i <= MARKS_SYSTEM.skillsProgram.totalDays; i++) {
    days[`day${i}`] = '';
  }
  return { activityName: '', teacherName: '', days };
}

function emptyEvents() {
  const e = {};
  MARKS_SYSTEM.events.eventList.forEach(ev => { e[ev.key] = { position: '', marksPercent: '' }; });
  return e;
}

// ── Full-marks defaults (used when no saved record exists for a week) ─────────

function fullNumericSection(cat) {
  const vals = {};
  MARKS_SYSTEM[cat].factors.forEach(f => { vals[f.key] = f.max; });
  return vals;
}

function fullAcademics() {
  const marks = {};
  MARKS_SYSTEM.academics.factors.forEach(f => { marks[f.key] = f.max; });
  return { teacherName: '', subject: '', marks, penalties: { classBunking: false } };
}

function fullSports() {
  const s = {};
  MARKS_SYSTEM.sportsActivities.fields.forEach(f => {
    s[f.key] = f.type === 'select' ? f.options[0] : '';
  });
  return s;
}

function fullSkills() {
  const days = {};
  for (let i = 1; i <= MARKS_SYSTEM.skillsProgram.totalDays; i++) {
    days[`day${i}`] = MARKS_SYSTEM.skillsProgram.maxPerDay;
  }
  return { activityName: '', teacherName: '', days };
}

function buildFullDefaults() {
  return {
    dailyRoutine:     fullNumericSection('dailyRoutine'),
    hygiene:          fullNumericSection('hygiene'),
    studyDiscipline:  fullNumericSection('studyDiscipline'),
    sportsActivities: fullSports(),
    academics:        fullAcademics(),
    skillsProgram:    fullSkills(),
    penalties:        emptyPenalties(),
    bonus:            emptyBonus(),
  };
}

// ── Section-level helpers ─────────────────────────────────────────────────────

function calcNumericTotal(cat, vals) {
  return MARKS_SYSTEM[cat].factors.reduce((sum, f) => sum + (Number(vals[f.key]) || 0), 0);
}

function calcAcademicsTotal(acad) {
  const pos = MARKS_SYSTEM.academics.factors.reduce((s, f) => s + (Number(acad.marks[f.key]) || 0), 0);
  const pen = acad.penalties.classBunking ? -1 : 0;
  return pos + pen;
}

function calcPenaltiesTotal(penalties) {
  let total = 0;
  Object.entries(MARKS_SYSTEM.penalties.subcategories).forEach(([sub, data]) => {
    data.factors.forEach(f => {
      if (penalties[sub]?.[f.key]) total += f.deduction;
    });
  });
  return total;
}

function calcBonusTotal(bonus) {
  return MARKS_SYSTEM.bonus.factors.reduce((s, f) => s + (Number(bonus[f.key]) || 0), 0);
}

function calcSkillsTotal(skills) {
  return Object.values(skills.days).reduce((s, v) => s + (Number(v) || 0), 0);
}

// ── Main Component ────────────────────────────────────────────────────────────

export function DetailedMarksForm() {
  const { students, loading: studentsLoading } = useStudents();
  const { saveWeeklySection, getWeeklyRecord, loading } = usePerformance();
  const { canEditSection, profile, role } = useAuth();

  const [selectedStudent, setSelectedStudent] = useState('');
  const [year,  setYear]  = useState(CURRENT_YEAR);
  const [month, setMonth] = useState(CURRENT_MONTH);
  const [week,  setWeek]  = useState(1);

  // Section state — initialised to full marks so a blank week shows maximum values
  const [dailyRoutine,    setDailyRoutine]    = useState(() => fullNumericSection('dailyRoutine'));
  const [hygiene,         setHygiene]         = useState(() => fullNumericSection('hygiene'));
  const [studyDiscipline, setStudyDiscipline] = useState(() => fullNumericSection('studyDiscipline'));
  const [sportsActivities,setSportsActivities]= useState(fullSports);
  const [academics,       setAcademics]       = useState(fullAcademics);
  const [skillsProgram,   setSkillsProgram]   = useState(fullSkills);
  const [events,          setEvents]          = useState(emptyEvents);
  const [penalties,       setPenalties]       = useState(emptyPenalties);
  const [bonus,           setBonus]           = useState(emptyBonus);
  const [notes,           setNotes]           = useState('');

  // Baseline values last loaded from Firestore (or full-mark defaults for a new week).
  // Non-teacher roles may only decrease marks relative to this baseline.
  const savedValuesRef = useRef(buildFullDefaults());

  const [loadingRecord, setLoadingRecord] = useState(false);
  const [saved, setSaved] = useState(false);

  // Load existing record when student/year/month/week changes
  useEffect(() => {
    if (!selectedStudent) return;
    let cancelled = false;
    setLoadingRecord(true);
    const defaults = buildFullDefaults();
    getWeeklyRecord(selectedStudent, year, month, week).then(rec => {
      if (cancelled) { setLoadingRecord(false); return; }
      if (!rec) {
        // No saved record for this week — reset everything to full-mark defaults
        setDailyRoutine(defaults.dailyRoutine);
        setHygiene(defaults.hygiene);
        setStudyDiscipline(defaults.studyDiscipline);
        setSportsActivities(defaults.sportsActivities);
        setAcademics(defaults.academics);
        setSkillsProgram(defaults.skillsProgram);
        setEvents(emptyEvents());
        setPenalties(defaults.penalties);
        setBonus(defaults.bonus);
        setNotes('');
        savedValuesRef.current = defaults;
      } else {
        // Existing record — restore saved values and update the baseline ref
        savedValuesRef.current = {
          dailyRoutine:     rec.dailyRoutine     ?? defaults.dailyRoutine,
          hygiene:          rec.hygiene          ?? defaults.hygiene,
          studyDiscipline:  rec.studyDiscipline  ?? defaults.studyDiscipline,
          sportsActivities: rec.sportsActivities ?? defaults.sportsActivities,
          academics:        rec.academics        ?? defaults.academics,
          skillsProgram:    rec.skillsProgram    ?? defaults.skillsProgram,
          penalties:        rec.penalties        ?? defaults.penalties,
          bonus:            rec.bonus            ?? defaults.bonus,
        };
        if (rec.dailyRoutine)    setDailyRoutine(rec.dailyRoutine);
        if (rec.hygiene)         setHygiene(rec.hygiene);
        if (rec.studyDiscipline) setStudyDiscipline(rec.studyDiscipline);
        if (rec.sportsActivities)setSportsActivities(rec.sportsActivities);
        if (rec.academics)       setAcademics(rec.academics);
        if (rec.skillsProgram)   setSkillsProgram(rec.skillsProgram);
        if (rec.events)          setEvents(rec.events);
        if (rec.penalties)       setPenalties(rec.penalties);
        if (rec.bonus)           setBonus(rec.bonus);
        if (rec.notes != null)   setNotes(rec.notes);
      }
      setLoadingRecord(false);
    });
    return () => { cancelled = true; };
  }, [selectedStudent, year, month, week, getWeeklyRecord]);

  // Reset all sections when student changes (optimistic reset while record loads)
  const resetSections = useCallback(() => {
    const d = buildFullDefaults();
    setDailyRoutine(d.dailyRoutine);
    setHygiene(d.hygiene);
    setStudyDiscipline(d.studyDiscipline);
    setSportsActivities(d.sportsActivities);
    setAcademics(d.academics);
    setSkillsProgram(d.skillsProgram);
    setEvents(emptyEvents());
    setPenalties(d.penalties);
    setBonus(d.bonus);
    setNotes('');
    savedValuesRef.current = d;
  }, []);

  const handleStudentChange = (id) => { setSelectedStudent(id); resetSections(); };

  // Section-specific save
  const handleSave = async (sectionKey, sectionPayload) => {
    if (!selectedStudent) { alert('Please select a student first'); return; }
    try {
      await saveWeeklySection(selectedStudent, year, month, week, { [sectionKey]: sectionPayload, notes });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  // Full save (all accessible sections at once)
  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (!selectedStudent) { alert('Please select a student'); return; }
    const payload = {};
    if (canEditSection('A')) payload.dailyRoutine    = dailyRoutine;
    if (canEditSection('B')) payload.hygiene         = hygiene;
    if (canEditSection('C')) payload.studyDiscipline = studyDiscipline;
    if (canEditSection('D')) payload.sportsActivities= sportsActivities;
    if (canEditSection('E')) payload.academics       = academics;
    if (canEditSection('F')) payload.skillsProgram   = skillsProgram;
    if (canEditSection('G')) payload.events          = events;
    if (canEditSection('penalties')) payload.penalties = penalties;
    if (canEditSection('bonus'))     payload.bonus     = bonus;
    payload.notes = notes;

    try {
      await saveWeeklySection(selectedStudent, year, month, week, payload);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert('Save failed: ' + err.message);
    }
  };

  const totals = {
    dailyRoutine:    calcNumericTotal('dailyRoutine',    dailyRoutine),
    hygiene:         calcNumericTotal('hygiene',         hygiene),
    studyDiscipline: calcNumericTotal('studyDiscipline', studyDiscipline),
    academics:       calcAcademicsTotal(academics),
    skills:          calcSkillsTotal(skillsProgram),
    penalties:       calcPenaltiesTotal(penalties),
    bonus:           calcBonusTotal(bonus),
  };
  totals.grandTotal = totals.dailyRoutine + totals.hygiene + totals.studyDiscipline + totals.academics + totals.penalties + totals.bonus;

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const years  = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR + 1];

  if (studentsLoading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" /></div>;
  }

  if (students.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <p className="text-lg font-medium">No students found</p>
        <p className="text-sm mt-1">Add students in the Roster section first.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8 px-2 md:px-0">

      {/* ── Header Controls ── */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Student</label>
            <select value={selectedStudent} onChange={e => handleStudentChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]">
              <option value="">Select student...</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name} · {s.rollNumber}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Month / Year</label>
            <div className="flex gap-2">
              <select value={month} onChange={e => setMonth(Number(e.target.value))}
                className="flex-1 px-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]">
                {months.map((m, i) => <option key={m} value={i+1}>{m}</option>)}
              </select>
              <select value={year} onChange={e => setYear(Number(e.target.value))}
                className="w-20 px-2 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]">
                {years.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Week</label>
            <select value={week} onChange={e => setWeek(Number(e.target.value))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm min-h-[44px]">
              {[1,2,3,4].map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
          <div className="flex items-end">
            <div className="bg-blue-50 rounded-lg p-3 w-full text-center">
              <p className="text-xs text-blue-500 mb-0.5">Grand Total</p>
              {loadingRecord
                ? <p className="text-blue-400 text-sm italic">Loading…</p>
                : <p className="text-2xl font-bold text-blue-700">{totals.grandTotal}<span className="text-sm font-normal text-blue-400"> / 137</span></p>
              }
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSaveAll} className="space-y-4">

        {/* ── A. Daily Routine ── */}
        {canEditSection('A') ? (
          <NumericSection
            title="A. Daily Routine Discipline" subtitle="Max: 50" accentColor="blue"
            factors={MARKS_SYSTEM.dailyRoutine.factors} values={dailyRoutine}
            total={totals.dailyRoutine} maxTotal={50}
            onChange={(k, v) => {
              const sv = savedValuesRef.current?.dailyRoutine?.[k];
              const val = role !== 'teacher' && sv != null ? Math.min(Number(v), Number(sv)) : Number(v);
              setDailyRoutine(prev => ({ ...prev, [k]: val }));
            }}
          />
        ) : <LockedSection title="A. Daily Routine Discipline" filledBy="Housemaster / AHM" />}

        {/* ── B. Hygiene & Turnout ── */}
        {canEditSection('B') ? (
          <NumericSection
            title="B. Hygiene & Turnout" subtitle="Max: 35" accentColor="teal"
            factors={MARKS_SYSTEM.hygiene.factors} values={hygiene}
            total={totals.hygiene} maxTotal={35}
            onChange={(k, v) => {
              const sv = savedValuesRef.current?.hygiene?.[k];
              const val = role !== 'teacher' && sv != null ? Math.min(Number(v), Number(sv)) : Number(v);
              setHygiene(prev => ({ ...prev, [k]: val }));
            }}
          />
        ) : <LockedSection title="B. Hygiene & Turnout" filledBy="Housemistress" />}

        {/* ── C. Study Discipline ── */}
        {canEditSection('C') ? (
          <NumericSection
            title="C. Study Discipline (Toye)" subtitle="Max: 12" accentColor="indigo"
            factors={MARKS_SYSTEM.studyDiscipline.factors} values={studyDiscipline}
            total={totals.studyDiscipline} maxTotal={12}
            onChange={(k, v) => {
              const sv = savedValuesRef.current?.studyDiscipline?.[k];
              const val = role !== 'teacher' && sv != null ? Math.min(Number(v), Number(sv)) : Number(v);
              setStudyDiscipline(prev => ({ ...prev, [k]: val }));
            }}
          />
        ) : <LockedSection title="C. Study Discipline (Toye)" filledBy="House Team" />}

        {/* ── D. Sports & Activities ── */}
        {canEditSection('D') ? (
          <SportsSection
            values={sportsActivities}
            onChange={(k, v) => setSportsActivities(prev => ({ ...prev, [k]: v }))}
            role={role}
            savedValues={savedValuesRef.current?.sportsActivities}
          />
        ) : <LockedSection title="D. Sports & Activities" filledBy="PE Head" />}

        {/* ── E. Academics ── */}
        {canEditSection('E') ? (
          <AcademicsSection
            data={academics} total={totals.academics}
            onMarksChange={(k, v) => {
              const sv = savedValuesRef.current?.academics?.marks?.[k];
              const val = role !== 'teacher' && sv != null ? Math.min(Number(v), Number(sv)) : Number(v);
              setAcademics(prev => ({ ...prev, marks: { ...prev.marks, [k]: val } }));
            }}
            onMetaChange={(k, v) => setAcademics(prev => ({ ...prev, [k]: v }))}
            onPenaltyChange={(k, v) => setAcademics(prev => ({ ...prev, penalties: { ...prev.penalties, [k]: v } }))}
            defaultTeacher={profile?.name} defaultSubject={profile?.subjectAssignment}
          />
        ) : <LockedSection title="E. Academics" filledBy="Class Teacher" />}

        {/* ── F. Skills Program ── */}
        {canEditSection('F') ? (
          <SkillsSection data={skillsProgram} total={totals.skills}
            onChange={(k, v) => setSkillsProgram(prev => ({ ...prev, [k]: v }))}
            onDayChange={(k, v) => {
              const sv = savedValuesRef.current?.skillsProgram?.days?.[k];
              const val = role !== 'teacher' && sv != null ? Math.min(Number(v), Number(sv)) : Number(v);
              setSkillsProgram(prev => ({ ...prev, days: { ...prev.days, [k]: val } }));
            }}
          />
        ) : <LockedSection title="F. Skills Program" filledBy="HOD Skills" />}

        {/* ── G. Events & Activities ── */}
        {canEditSection('G') ? (
          <EventsSection data={events}
            onChange={(evKey, field, val) => setEvents(prev => ({ ...prev, [evKey]: { ...prev[evKey], [field]: val } }))}
          />
        ) : <LockedSection title="G. Events & Activities" filledBy="Activities Head" />}

        {/* ── Penalties ── */}
        {canEditSection('penalties') ? (
          <PenaltiesSection values={penalties} total={totals.penalties}
            onToggle={(sub, key) => setPenalties(prev => ({
              ...prev,
              [sub]: { ...prev[sub], [key]: !prev[sub][key] }
            }))}
          />
        ) : <LockedSection title="Penalty System" filledBy="Housemaster / AHM" />}

        {/* ── Bonus ── */}
        {canEditSection('bonus') ? (
          <NumericSection
            title="Bonus Points (Optional)" subtitle="Max: 16" accentColor="green"
            factors={MARKS_SYSTEM.bonus.factors} values={bonus}
            total={totals.bonus} maxTotal={16}
            onChange={(k, v) => {
              const sv = savedValuesRef.current?.bonus?.[k];
              const val = role !== 'teacher' && sv != null ? Math.min(Number(v), Number(sv)) : Number(v);
              setBonus(prev => ({ ...prev, [k]: val }));
            }}
          />
        ) : <LockedSection title="Bonus Points" filledBy="Housemaster" />}

        {/* ── Notes + Submit ── */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Additional Notes</label>
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
            placeholder="Any observations for this week…" />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-2">
          {saved && (
            <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
              <CheckCircle className="w-5 h-5" />
              Saved successfully!
            </div>
          )}
          <div className="flex-1" />
          <button type="submit" disabled={loading || !selectedStudent}
            className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]">
            <Save className="w-5 h-5" />
            {loading ? 'Saving…' : 'Save Week'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function LockedSection({ title, filledBy }) {
  return (
    <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 flex items-center gap-3 text-gray-400">
      <Lock className="w-4 h-4 flex-shrink-0" />
      <span className="text-sm"><strong className="text-gray-500">{title}</strong> — filled by {filledBy}</span>
    </div>
  );
}

function NumericSection({ title, subtitle, factors, values, onChange, total, maxTotal, accentColor = 'blue' }) {
  const colors = {
    blue:   { border: 'border-blue-200',  header: 'text-blue-700'  },
    teal:   { border: 'border-teal-200',  header: 'text-teal-700'  },
    indigo: { border: 'border-indigo-200',header: 'text-indigo-700'},
    green:  { border: 'border-green-200', header: 'text-green-700' },
  };
  const c = colors[accentColor] ?? colors.blue;

  const clamp = (key, val) => {
    const f = factors.find(f => f.key === key);
    const clamped = Math.max(0, Math.min(f?.max ?? 0, Number(val)));
    onChange(key, clamped);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border ${c.border} p-4 md:p-6`}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className={`text-base font-semibold ${c.header}`}>{title}</h3>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-gray-900">{total}</span>
          <span className="text-sm text-gray-500"> / {maxTotal}</span>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {factors.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label} <span className="text-gray-400">/ {f.max}</span></label>
            <input type="number" min={0} max={f.max} value={values[f.key]}
              onChange={e => clamp(f.key, e.target.value)}
              className="w-full px-3 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-center min-h-[44px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SportsSection({ values, onChange, role, savedValues }) {
  const { fields } = MARKS_SYSTEM.sportsActivities;
  return (
    <div className="bg-white rounded-xl shadow-sm border border-orange-200 p-4 md:p-6">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-orange-700">D. Sports &amp; Activities</h3>
        <p className="text-xs text-gray-500">Qualitative tracking — PE Head</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fields.map(f => {
          // For select fields, compute the saved option's index so we can prevent
          // non-teacher roles from selecting a "better" (lower-index) option.
          const savedIdx = (role !== 'teacher' && f.type === 'select' && savedValues?.[f.key])
            ? f.options.indexOf(savedValues[f.key])
            : -1;
          return (
            <div key={f.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{f.label}</label>
              {f.type === 'select' ? (
                <select value={values[f.key]} onChange={e => onChange(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm min-h-[44px]">
                  <option value="">Select…</option>
                  {f.options.map((o, idx) => (
                    <option key={o} value={o} disabled={savedIdx >= 0 && idx < savedIdx}>{o}</option>
                  ))}
                </select>
              ) : (
                <input type={f.type} value={values[f.key]} onChange={e => onChange(f.key, e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 outline-none text-sm min-h-[44px]"
                  placeholder={f.type === 'number' ? '0.0' : 'Enter…'} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AcademicsSection({ data, total, onMarksChange, onMetaChange, onPenaltyChange, defaultTeacher, defaultSubject }) {
  const { factors, penalties } = MARKS_SYSTEM.academics;

  const clamp = (key, val) => {
    const f = factors.find(f => f.key === key);
    onMarksChange(key, Math.max(0, Math.min(f?.max ?? 0, Number(val))));
  };

  // Pre-fill teacher name and subject on first render
  useEffect(() => {
    if (!data.teacherName && defaultTeacher) onMetaChange('teacherName', defaultTeacher);
    if (!data.subject    && defaultSubject)  onMetaChange('subject',     defaultSubject);
  }, []);  // eslint-disable-line

  return (
    <div className="bg-white rounded-xl shadow-sm border border-purple-200 p-4 md:p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-purple-700">E. Academics</h3>
          <p className="text-xs text-gray-500">Max: 25 per subject</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-gray-900">{total}</span>
          <span className="text-sm text-gray-500"> / 25</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teacher Name</label>
          <input type="text" value={data.teacherName} onChange={e => onMetaChange('teacherName', e.target.value)}
            className="input-field text-sm" placeholder="Mr. / Ms. Name" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Subject</label>
          <input type="text" value={data.subject} onChange={e => onMetaChange('subject', e.target.value)}
            className="input-field text-sm" placeholder="e.g. English" />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {factors.map(f => (
          <div key={f.key}>
            <label className="block text-xs font-medium text-gray-600 mb-1">{f.label} <span className="text-gray-400">/ {f.max}</span></label>
            <input type="number" min={0} max={f.max} value={data.marks[f.key]}
              onChange={e => clamp(f.key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400 outline-none text-center text-base min-h-[44px]" />
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2">
        {penalties.map(p => (
          <label key={p.key} className="flex items-center gap-2 p-2 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50 text-sm">
            <input type="checkbox" checked={data.penalties[p.key]}
              onChange={e => onPenaltyChange(p.key, e.target.checked)}
              className="w-4 h-4 text-red-600" />
            <span className="text-red-700">{p.label}</span>
            <span className="text-red-400 text-xs">{p.deduction}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function SkillsSection({ data, total, onChange, onDayChange }) {
  const { maxPerDay, totalDays } = MARKS_SYSTEM.skillsProgram;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-4 md:p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-yellow-700">F. Skills Program</h3>
          <p className="text-xs text-gray-500">{maxPerDay} marks / day · up to {totalDays} days</p>
        </div>
        <div className="text-right">
          <span className="text-xl font-bold text-gray-900">{total}</span>
          <span className="text-sm text-gray-500"> pts</span>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Activity Name</label>
          <input type="text" value={data.activityName} onChange={e => onChange('activityName', e.target.value)}
            className="input-field text-sm" placeholder="e.g. Woodworking" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Teacher Name</label>
          <input type="text" value={data.teacherName} onChange={e => onChange('teacherName', e.target.value)}
            className="input-field text-sm" placeholder="Mr. / Ms. Name" />
        </div>
      </div>
      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
        {Array.from({ length: totalDays }, (_, i) => i + 1).map(d => (
          <div key={d} className="text-center">
            <label className="block text-xs text-gray-500 mb-1">D{d}</label>
            <input type="number" min={0} max={maxPerDay} value={data.days[`day${d}`]}
              onChange={e => onDayChange(`day${d}`, Math.max(0, Math.min(maxPerDay, Number(e.target.value))))}
              className="w-full px-1 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none text-center text-sm min-h-[40px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EventsSection({ data, onChange }) {
  const { eventList } = MARKS_SYSTEM.events;
  const filled = eventList.filter(ev => data[ev.key]?.position || data[ev.key]?.marksPercent);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-pink-200 p-4 md:p-6">
      <div className="mb-3">
        <h3 className="text-base font-semibold text-pink-700">G. Events &amp; Activities</h3>
        <p className="text-xs text-gray-500">Enter position and marks % for participated events</p>
      </div>
      <div className="space-y-2">
        {eventList.map(ev => (
          <div key={ev.key} className="grid grid-cols-3 gap-2 items-center">
            <label className="text-sm text-gray-700 col-span-1 truncate">{ev.label}</label>
            <input type="text" value={data[ev.key]?.position ?? ''}
              onChange={e => onChange(ev.key, 'position', e.target.value)}
              placeholder="Position" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-400 outline-none min-h-[40px]" />
            <input type="number" min={0} max={100} value={data[ev.key]?.marksPercent ?? ''}
              onChange={e => onChange(ev.key, 'marksPercent', e.target.value)}
              placeholder="Marks %" className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-pink-400 outline-none min-h-[40px]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PenaltiesSection({ values, total, onToggle }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200 p-4 md:p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-base font-semibold text-red-700">Penalty System</h3>
          <p className="text-xs text-red-500">Check applicable offences</p>
        </div>
        <span className="text-red-600 font-medium text-sm">{total} pts</span>
      </div>
      {Object.entries(MARKS_SYSTEM.penalties.subcategories).map(([sub, subData]) => (
        <div key={sub} className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">{subData.label}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {subData.factors.map(f => (
              <label key={f.key} className="flex items-center gap-2.5 p-2.5 border rounded-lg cursor-pointer hover:bg-red-50 min-h-[44px]">
                <input type="checkbox" checked={values[sub]?.[f.key] ?? false}
                  onChange={() => onToggle(sub, f.key)}
                  className="w-4 h-4 text-red-600 flex-shrink-0" />
                <div>
                  <span className="text-sm text-gray-700 block">{f.label}</span>
                  <span className="text-xs text-red-500">{f.deduction}</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
