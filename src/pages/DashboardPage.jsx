import { useStudents } from '../hooks/useStudents';
import { usePerformance } from '../hooks/usePerformance';
import { Users, ClipboardCheck, TrendingUp, Calendar, BookOpen } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../config/marksSystem';
import bannerImg from '../assets/chand-bagh-banner.png';
import schoolLogo from '../assets/chand-bagh-logo.png';

const CURRENT_YEAR  = new Date().getFullYear();
const CURRENT_MONTH = new Date().getMonth() + 1;

function getCurrentWeek() {
  const day = new Date().getDate();
  return Math.min(4, Math.ceil(day / 7));
}

export function DashboardPage() {
  const { students } = useStudents();
  const { getMonthlyRecords } = usePerformance();
  const { profile, role } = useAuth();

  const [thisWeekLogs, setThisWeekLogs]     = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (students.length === 0) { setLoading(false); return; }

      const currentWeek = getCurrentWeek();
      let totalGrand = 0;
      let totalWeeks = 0;
      let thisWeekCount = 0;

      const allMonthly = await Promise.all(
        students.map(s =>
          getMonthlyRecords(s.id, CURRENT_YEAR, CURRENT_MONTH).catch(() => [])
        )
      );

      allMonthly.forEach(records => {
        const thisWeekRec = records.find(r => r.week === currentWeek);
        if (thisWeekRec) thisWeekCount++;

        records.forEach(rec => {
          const grand = (rec.weeklyTotals?.grandTotal) ?? (
            (rec.dailyRoutine    ? Object.values(rec.dailyRoutine).reduce((a,b)=>a+b,0)    : 0) +
            (rec.hygiene         ? Object.values(rec.hygiene).reduce((a,b)=>a+b,0)         : 0) +
            (rec.studyDiscipline ? Object.values(rec.studyDiscipline).reduce((a,b)=>a+b,0) : 0) +
            (rec.academics?.marks ? Object.values(rec.academics.marks).reduce((a,b)=>a+b,0): 0)
          );
          totalGrand += grand;
          totalWeeks++;
        });
      });

      setThisWeekLogs(thisWeekCount);
      setMonthlyAverage(totalWeeks > 0 ? Math.round(totalGrand / totalWeeks) : 0);
      setLoading(false);
    };

    fetchStats();
  }, [students, getMonthlyRecords]);

  const stats = [
    { title: 'Total Students',    value: students.length,                      icon: Users,         color: 'bg-blue-50 text-blue-600'   },
    { title: 'This Week Logged',  value: thisWeekLogs,                          icon: ClipboardCheck,color: 'bg-green-50 text-green-600'  },
    { title: 'Monthly Avg Score', value: loading ? '…' : `${monthlyAverage}`,  icon: TrendingUp,    color: 'bg-purple-50 text-purple-600'},
    { title: 'Pending This Week', value: students.length - thisWeekLogs,        icon: Calendar,      color: 'bg-orange-50 text-orange-600'},
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
              Chand Bagh School — Student Performance Tracker
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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 md:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs md:text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
              </div>
              <div className={`p-2.5 md:p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>
        ))}
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
              { label: 'A. Daily Routine Discipline', max: 50,  color: 'bg-blue-500'   },
              { label: 'B. Hygiene & Turnout',        max: 35,  color: 'bg-teal-500'   },
              { label: 'C. Study Discipline (Toye)',  max: 12,  color: 'bg-indigo-500' },
              { label: 'E. Academics',                max: 25,  color: 'bg-purple-500' },
              { label: 'F. Skills Program',           max: '5/day', color: 'bg-yellow-500'},
              { label: 'G. Events & Activities',      max: '%', color: 'bg-pink-500'   },
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
    </div>
  );
}
