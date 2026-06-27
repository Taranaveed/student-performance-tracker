import { useMemo, useState } from 'react';
import {
  AlertTriangle, TrendingUp, TrendingDown, CalendarRange,
  LayoutGrid, Users, Download,
} from 'lucide-react';
import { useStudents } from '../../hooks/useStudents';
import { useBulkMonthlyRecords } from '../../hooks/useBulkMonthlyRecords';
import { buildAdminInsights, formatPeriodLabel } from '../../lib/adminAnalytics';
import { exportAdminInsightsPdf } from '../../lib/exportAdminInsights';

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const VIEW_TABS = [
  { id: 'all',        label: 'Overview',    icon: LayoutGrid },
  { id: 'behavior',   label: 'Behavioral',  icon: AlertTriangle },
  { id: 'top',        label: 'Top 3',       icon: TrendingUp },
  { id: 'bottom',     label: 'Bottom 3',    icon: TrendingDown },
];

function getCurrentWeek() {
  const day = new Date().getDate();
  return Math.min(4, Math.ceil(day / 7));
}

function RankRow({ rank, student, avgScore, variant }) {
  const styles = variant === 'top'
    ? { badge: 'text-green-700', bg: 'bg-green-50 border-green-100', score: 'text-green-800' }
    : { badge: 'text-orange-700', bg: 'bg-orange-50 border-orange-100', score: 'text-orange-800' };

  return (
    <div className={`flex items-center justify-between text-sm px-3 py-2.5 rounded-lg border ${styles.bg}`}>
      <div className="min-w-0">
        <span className={`font-semibold mr-2 ${styles.badge}`}>#{rank}</span>
        <span className="text-gray-800">{student.name}</span>
        <p className="text-xs text-gray-400 mt-0.5 ml-6">{student.house} · Roll {student.rollNumber}</p>
      </div>
      <span className={`font-bold shrink-0 ml-3 ${styles.score}`}>{avgScore}</span>
    </div>
  );
}

function BehavioralList({ students: list, compact = false }) {
  if (list.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No serious or major offences for the current filters.
      </p>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? 'max-h-64' : 'max-h-96'} overflow-y-auto`}>
      {list.map(({ student, offences }) => (
        <div
          key={student.id}
          className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 p-3 rounded-lg border border-red-100 bg-red-50/60"
        >
          <div>
            <p className="text-sm font-medium text-gray-900">{student.name}</p>
            <p className="text-xs text-gray-500">
              {student.grade?.toUpperCase()} · {student.house} · Roll {student.rollNumber}
            </p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {offences.map(o => (
              <span
                key={o.key}
                className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200"
                title={o.category}
              >
                {o.label}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function RankingsList({ rankings, variant }) {
  if (rankings.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-8">
        No scored records for the current filters.
      </p>
    );
  }

  const items = variant === 'top'
    ? rankings.map(r => ({ grade: r.grade, list: r.top }))
    : rankings.map(r => ({ grade: r.grade, list: r.bottom }));

  const accent = variant === 'top' ? 'text-green-700' : 'text-orange-700';

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {items.map(({ grade, list }) => (
        <div key={grade}>
          <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${accent}`}>
            Class {grade.toUpperCase()}
          </p>
          <div className="space-y-1.5">
            {list.map(({ student, avgScore }, idx) => (
              <RankRow key={student.id} rank={idx + 1} student={student} avgScore={avgScore} variant={variant} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminInsightsPanel({ filterGrade = '', filterHouse = '' }) {
  const { students } = useStudents();

  const [viewTab, setViewTab]       = useState('all');
  const [periodType, setPeriodType] = useState('week');
  const [year, setYear]             = useState(CURRENT_YEAR);
  const [month, setMonth]           = useState(CURRENT_MONTH);
  const [week, setWeek]             = useState(getCurrentWeek());

  const { recordsByStudentId, loading } = useBulkMonthlyRecords(students, year, month);

  const filters = useMemo(
    () => ({ filterGrade, filterHouse }),
    [filterGrade, filterHouse]
  );

  const { behavioralStudents, rankingsByGrade } = useMemo(
    () => buildAdminInsights(students, recordsByStudentId, periodType, week, filters),
    [students, recordsByStudentId, periodType, week, filters]
  );

  const periodLabel = formatPeriodLabel(periodType, year, month, week);

  const years = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR + 1];
  const hasScopeFilter = filterGrade !== '' || filterHouse !== '';

  const studentsInScope = useMemo(
    () => students.filter(s => {
      if (filterGrade && s.grade !== filterGrade) return false;
      if (filterHouse && s.house !== filterHouse) return false;
      return true;
    }).length,
    [students, filterGrade, filterHouse]
  );

  const handleExportPdf = () => {
    exportAdminInsightsPdf({
      behavioralStudents,
      rankingsByGrade,
      periodLabel,
      filterGrade,
      filterHouse,
      studentsInScope,
    });
  };

  const summaryStats = [
    {
      label: 'Behavioral flags',
      value: behavioralStudents.length,
      color: 'bg-red-50 text-red-700 border-red-100',
      tab: 'behavior',
    },
    {
      label: 'Classes ranked',
      value: rankingsByGrade.length,
      color: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      tab: 'top',
    },
    {
      label: 'Students in scope',
      value: studentsInScope,
      color: 'bg-blue-50 text-blue-700 border-blue-100',
      tab: 'all',
    },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Admin Insights</h3>
            <p className="text-xs text-gray-500 mt-0.5">{periodLabel}</p>
          </div>
          <button
            type="button"
            onClick={handleExportPdf}
            disabled={loading || students.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 shrink-0"
          >
            <Download className="w-4 h-4" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 space-y-4 bg-gray-50/50">
        {/* View tabs */}
        <div className="flex flex-wrap gap-2">
          {VIEW_TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViewTab(id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-colors border ${
                viewTab === id
                  ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                  : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Period filters */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide shrink-0">
            <CalendarRange className="w-3.5 h-3.5" />
            Period
          </span>
          <select
            value={periodType}
            onChange={e => setPeriodType(e.target.value)}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="week">Week</option>
            <option value="month">Month</option>
          </select>
          <select
            value={month}
            onChange={e => setMonth(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
          <select
            value={year}
            onChange={e => setYear(Number(e.target.value))}
            className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
          {periodType === 'week' && (
            <select
              value={week}
              onChange={e => setWeek(Number(e.target.value))}
              className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {[1, 2, 3, 4].map(w => (
                <option key={w} value={w}>W{w}</option>
              ))}
            </select>
          )}
        </div>

        {/* Synced scope from dashboard filters */}
        {hasScopeFilter && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Using dashboard filters:
            </span>
            {filterGrade && (
              <span className="text-xs bg-indigo-100 text-indigo-800 px-2.5 py-1 rounded-full font-medium">
                Class {filterGrade.toUpperCase()}
              </span>
            )}
            {filterHouse && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2.5 py-1 rounded-full font-medium">
                {filterHouse} House
              </span>
            )}
          </div>
        )}

        {/* Quick summary */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex flex-wrap gap-2 ml-auto">
            {summaryStats.map(stat => (
              <button
                key={stat.label}
                type="button"
                onClick={() => setViewTab(stat.tab)}
                className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${stat.color} hover:opacity-90`}
              >
                {stat.value} {stat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : viewTab === 'all' ? (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1 rounded-xl border border-red-200 p-4 bg-red-50/30">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-red-500" />
                <h4 className="text-sm font-semibold text-gray-900">Behavioral</h4>
                <button
                  type="button"
                  onClick={() => setViewTab('behavior')}
                  className="ml-auto text-xs text-red-600 hover:underline"
                >
                  View all
                </button>
              </div>
              <BehavioralList students={behavioralStudents.slice(0, 3)} compact />
            </div>
            <div className="rounded-xl border border-green-200 p-4 bg-green-50/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <h4 className="text-sm font-semibold text-gray-900">Top 3</h4>
                <button
                  type="button"
                  onClick={() => setViewTab('top')}
                  className="ml-auto text-xs text-green-700 hover:underline"
                >
                  View all
                </button>
              </div>
              <RankingsList rankings={rankingsByGrade.slice(0, 2)} variant="top" />
            </div>
            <div className="rounded-xl border border-orange-200 p-4 bg-orange-50/30">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="w-4 h-4 text-orange-600" />
                <h4 className="text-sm font-semibold text-gray-900">Bottom 3</h4>
                <button
                  type="button"
                  onClick={() => setViewTab('bottom')}
                  className="ml-auto text-xs text-orange-700 hover:underline"
                >
                  View all
                </button>
              </div>
              <RankingsList rankings={rankingsByGrade.slice(0, 2)} variant="bottom" />
            </div>
          </div>
        ) : viewTab === 'behavior' ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-red-500" />
              <h4 className="text-sm font-semibold text-gray-900">
                Serious & major offences
              </h4>
              <span className="ml-auto text-xs bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full">
                {behavioralStudents.length} students
              </span>
            </div>
            <BehavioralList students={behavioralStudents} />
          </div>
        ) : viewTab === 'top' ? (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-green-600" />
              <h4 className="text-sm font-semibold text-gray-900">Top 3 per class</h4>
            </div>
            <RankingsList rankings={rankingsByGrade} variant="top" />
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingDown className="w-4 h-4 text-orange-600" />
              <h4 className="text-sm font-semibold text-gray-900">Bottom 3 per class</h4>
            </div>
            <RankingsList rankings={rankingsByGrade} variant="bottom" />
          </div>
        )}
      </div>
    </div>
  );
}
