import { useStudents } from '../hooks/useStudents';
import { useBulkMonthlyRecords } from '../hooks/useBulkMonthlyRecords';
import { Users, ClipboardCheck, TrendingUp, Calendar, BookOpen, Filter } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS, FULL_VIEW_ROLES, HEAD_ROLES, HOUSES, GRADES } from '../config/marksSystem';
import { AdminInsightsPanel } from '../components/dashboard/AdminInsightsPanel';
import { calcWeekGrandTotal } from '../lib/adminAnalytics';
import bannerImg  from '../assets/chand-bagh-banner.png';
import schoolLogo from '../assets/chand-bagh-logo.png';

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

function getCurrentWeek() {
  const day = new Date().getDate();
  return Math.min(4, Math.ceil(day / 7));
}

export function DashboardPage() {
  const { students } = useStudents();
  const { profile, role } = useAuth();
  const { recordsByStudentId, loading: recordsLoading } = useBulkMonthlyRecords(
    students,
    CURRENT_YEAR,
    CURRENT_MONTH
  );

  // ── Global filters (visible to Admin + Head roles) ───────────────────────────
  const [filterGrade, setFilterGrade] = useState('');
  const [filterHouse, setFilterHouse] = useState('');

  const isFullViewRole = FULL_VIEW_ROLES.includes(role);
  const isHeadRole     = HEAD_ROLES.includes(role);
  const isAdminView    = role === 'admin';

  // Filtered students for the overview panel
  const filteredStudents = useMemo(() => {
    if (!isFullViewRole) return students;
    return students.filter(s => {
      if (filterGrade && s.grade !== filterGrade) return false;
      if (filterHouse && s.house !== filterHouse) return false;
      return true;
    });
  }, [students, isFullViewRole, filterGrade, filterHouse]);

  const { thisWeekLogs, monthlyAverage } = useMemo(() => {
    const currentWeek = getCurrentWeek();
    let totalGrand = 0;
    let totalWeeks = 0;
    let thisWeekCount = 0;

    students.forEach(student => {
      const records = recordsByStudentId[student.id] ?? [];
      const thisWeekRec = records.find(r => r.week === currentWeek);
      if (thisWeekRec) thisWeekCount++;

      records.forEach(rec => {
        totalGrand += calcWeekGrandTotal(rec);
        totalWeeks++;
      });
    });

    return {
      thisWeekLogs: thisWeekCount,
      monthlyAverage: totalWeeks > 0 ? Math.round(totalGrand / totalWeeks) : 0,
    };
  }, [students, recordsByStudentId]);

  const displayStudents = isFullViewRole ? filteredStudents : students;

  const houseBreakdown = useMemo(() =>
    HOUSES.map(h => ({ house: h, count: displayStudents.filter(s => s.house === h).length })),
    [displayStudents]
  );

  const gradeBreakdown = useMemo(() =>
    GRADES.map(g => ({ grade: g, count: displayStudents.filter(s => s.grade === g).length })),
    [displayStudents]
  );

  const stats = [
    { title: 'Total Students',    value: displayStudents.length,                      icon: Users,          color: 'bg-blue-50 text-blue-600',    to: '/roster' },
    { title: 'This Week Logged',  value: thisWeekLogs,                                icon: ClipboardCheck, color: 'bg-green-50 text-green-600'  },
    { title: 'Monthly Avg Score', value: recordsLoading ? '…' : `${monthlyAverage}`, icon: TrendingUp,     color: 'bg-purple-50 text-purple-600' },
    { title: 'Pending This Week', value: displayStudents.length - thisWeekLogs,       icon: Calendar,       color: 'bg-orange-50 text-orange-600' },
  ];

  return (
    <div className="space-y-6">

      {/* School header banner */}
      <div className="relative rounded-xl overflow-hidden shadow-sm">
        <img
          src={bannerImg}
          alt="Chand Bagh School – Jilani Block"
          className="w-full h-36 object-cover object-center"
        />
        <div className="absolute inset-0 bg-blue-950/65" />
        <div className="absolute inset-0 flex items-center gap-4 px-5 md:px-8">
          <img
            src={schoolLogo}
            alt="Chand Bagh School"
            className="w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-white/40 flex-shrink-0 shadow"
          />
          <div className="min-w-0">
            <p className="text-blue-200 text-xs font-medium tracking-widest uppercase">
              Chand Bagh School — CBS Portal
            </p>
            <h2 className="text-xl md:text-2xl font-bold text-white mt-0.5 truncate">
              Welcome, {profile?.name?.split(' ')[0] ?? 'there'}
            </h2>
            <p className="text-blue-200/80 text-xs mt-0.5">
              {ROLE_LABELS[role] ?? 'Staff'}{profile?.houseAssignment ? ` · ${profile.houseAssignment} House` : ''}
              {' · '}
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </div>

      {/* ── Global Filters (Admin + Head roles) ── */}
      {isFullViewRole && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Filter className="w-4 h-4" />
              Filter View:
            </div>
            <select
              value={filterGrade}
              onChange={e => setFilterGrade(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[38px]"
            >
              <option value="">All Classes</option>
              {GRADES.map(g => <option key={g} value={g}>Grade {g.toUpperCase()}</option>)}
            </select>
            <select
              value={filterHouse}
              onChange={e => setFilterHouse(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none min-h-[38px]"
            >
              <option value="">All Houses</option>
              {HOUSES.map(h => <option key={h} value={h}>{h} House</option>)}
            </select>
            {(filterGrade || filterHouse) && (
              <button
                onClick={() => { setFilterGrade(''); setFilterHouse(''); }}
                className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear
              </button>
            )}
            <span className="ml-auto text-sm text-gray-400">
              Showing <span className="font-semibold text-gray-600">{displayStudents.length}</span> of{' '}
              <span className="font-semibold text-gray-600">{students.length}</span> students
              {isAdminView && (filterGrade || filterHouse) && (
                <span className="hidden sm:inline"> · insights synced</span>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => {
          const content = (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2.5 md:p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          );

          if (stat.to) {
            return (
              <Link
                key={i}
                to={stat.to}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6 block hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
              >
                {content}
              </Link>
            );
          }

          return (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
              {content}
            </div>
          );
        })}
      </div>

      {/* Quick actions + info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link to="/tracker" className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <ClipboardCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-900 text-sm">Log Weekly Marks</p>
                <p className="text-xs text-blue-600">Record this week's student marks</p>
              </div>
            </Link>
            <Link to="/roster" className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Users className="w-5 h-5 text-gray-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-900 text-sm">Manage Roster</p>
                <p className="text-xs text-gray-500">Add or edit students</p>
              </div>
            </Link>
            <Link to="/reports" className="flex items-center gap-4 p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
              <BookOpen className="w-5 h-5 text-purple-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-purple-900 text-sm">View Reports</p>
                <p className="text-xs text-purple-600">Monthly performance overview</p>
              </div>
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Marks System Overview</h3>
          <div className="space-y-2 text-sm">
            {[
              { label: 'A. Daily Routine Discipline', max: 50,      color: 'bg-blue-500'   },
              { label: 'B. Hygiene & Turnout',        max: 35,      color: 'bg-teal-500'   },
              { label: 'C. Study Discipline (Toye)',  max: 12,      color: 'bg-indigo-500' },
              { label: 'E. Academics',                max: 25,      color: 'bg-purple-500' },
              { label: 'F. Skills Program',           max: '5/day', color: 'bg-yellow-500' },
              { label: 'G. Events & Activities',      max: '%',     color: 'bg-pink-500'   },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${row.color}`} />
                  <span className="text-gray-700">{row.label}</span>
                </div>
                <span className="text-gray-500 font-medium">{row.max}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Admin-only insights (behavior + top/bottom 3 per class) ── */}
      {isAdminView && (
        <AdminInsightsPanel filterGrade={filterGrade} filterHouse={filterHouse} />
      )}

      {/* ── Student Overview — Admin + Head roles ── */}
      {isFullViewRole && displayStudents.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-gray-900">Student Overview</h3>
            {isHeadRole && (
              <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full font-medium">
                Read-only · Grading limited to your domain
              </span>
            )}
          </div>

          {/* By House */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By House</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              {houseBreakdown.map(({ house, count }) => (
                <button
                  key={house}
                  onClick={() => setFilterHouse(filterHouse === house ? '' : house)}
                  className={`flex flex-col items-center justify-center rounded-lg py-3 px-2 transition-colors border ${
                    filterHouse === house
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-blue-50 border-blue-100 hover:bg-blue-100'
                  }`}
                >
                  <span className={`text-xl font-bold ${filterHouse === house ? 'text-white' : 'text-blue-800'}`}>{count}</span>
                  <span className={`text-xs font-medium mt-0.5 text-center leading-tight ${filterHouse === house ? 'text-blue-100' : 'text-blue-600'}`}>{house}</span>
                </button>
              ))}
            </div>
          </div>

          {/* By Grade */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">By Class</p>
            <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3">
              {gradeBreakdown.map(({ grade, count }) => (
                <button
                  key={grade}
                  onClick={() => setFilterGrade(filterGrade === grade ? '' : grade)}
                  className={`flex flex-col items-center justify-center rounded-lg py-3 px-2 transition-colors border ${
                    filterGrade === grade
                      ? 'bg-indigo-600 border-indigo-600 text-white'
                      : 'bg-indigo-50 border-indigo-100 hover:bg-indigo-100'
                  }`}
                >
                  <span className={`text-xl font-bold ${filterGrade === grade ? 'text-white' : 'text-indigo-800'}`}>{count}</span>
                  <span className={`text-xs font-medium mt-0.5 uppercase ${filterGrade === grade ? 'text-indigo-100' : 'text-indigo-600'}`}>{grade}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
