import { useStudents } from '../hooks/useStudents';
import { usePerformance } from '../hooks/usePerformance';
import { Users, ClipboardCheck, TrendingUp, Calendar } from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatDate } from '../lib/utils';

export function DashboardPage() {
  const { students } = useStudents();
  const { getMonthlyLogs } = usePerformance();
  const [todayLogs, setTodayLogs] = useState(0);
  const [monthlyAverage, setMonthlyAverage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (students.length === 0) {
        setLoading(false);
        return;
      }

      const today = formatDate(new Date());
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();

      let totalLogs = 0;
      let totalRatings = 0;
      let todayLogCount = 0;

      for (const student of students) {
        try {
          const logs = await getMonthlyLogs(student.id, currentYear, currentMonth);
          
          // Count today's logs
          const studentTodayLog = logs.find(log => log.date === today);
          if (studentTodayLog) todayLogCount++;

          // Calculate average ratings
          logs.forEach(log => {
            const avg = (
              log.ratings.assembly +
              log.ratings.meals +
              log.ratings.studies +
              log.ratings.social
            ) / 4;
            totalRatings += avg;
            totalLogs++;
          });
        } catch (error) {
          console.error('Error fetching logs for student:', student.id, error);
        }
      }

      setTodayLogs(todayLogCount);
      
      // Calculate overall monthly average percentage
      const overallAvg = totalLogs > 0 ? (totalRatings / totalLogs) / 5 * 100 : 0;
      setMonthlyAverage(Math.round(overallAvg));
      setLoading(false);
    };

    fetchStats();
  }, [students, getMonthlyLogs]);

  const stats = [
    {
      title: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: "Today's Logs",
      value: todayLogs,
      icon: ClipboardCheck,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'This Month Avg',
      value: loading ? '...' : `${monthlyAverage}%`,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Pending Reviews',
      value: students.length - todayLogs,
      icon: Calendar,
      color: 'bg-orange-50 text-orange-600'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a href="/tracker" className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
              <ClipboardCheck className="w-5 h-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Log Daily Performance</p>
                <p className="text-sm text-blue-700">Record today's student ratings</p>
              </div>
            </a>
            <a href="/roster" className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <Users className="w-5 h-5 text-gray-600" />
              <div>
                <p className="font-medium text-gray-900">Manage Roster</p>
                <p className="text-sm text-gray-600">Add or edit students</p>
              </div>
            </a>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <p className="text-gray-500 text-center py-8">Activity tracking coming soon</p>
        </div>
      </div>
    </div>
  );
}