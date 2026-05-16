import { useMemo } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

const COLORS = {
  dailyRoutine: '#3b82f6',
  hygiene: '#10b981',
  studyDiscipline: '#f59e0b',
  sportsActivities: '#8b5cf6'
};

export function MonthlyChart({ logs }) {
  const data = useMemo(() => {
    return logs.map(log => {
      const t = log.weeklyTotals || {};
      
      return {
        date: new Date(log.date).getDate(),
        'Daily Routine': t.dailyRoutine || 0,
        'Hygiene': t.hygiene || 0,
        'Study Discipline': t.studyDiscipline || 0,
        'Sports & Activities': t.sportsActivities || 0
      };
    });
  }, [logs]);

  if (logs.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        No data available for this period
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            label={{ value: 'Day of Month', position: 'insideBottom', offset: -5 }}
          />
          <YAxis />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'white', 
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
          <Line type="monotone" dataKey="Daily Routine" stroke={COLORS.dailyRoutine} strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Hygiene" stroke={COLORS.hygiene} strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Study Discipline" stroke={COLORS.studyDiscipline} strokeWidth={2} dot={{ r: 4 }} />
          <Line type="monotone" dataKey="Sports & Activities" stroke={COLORS.sportsActivities} strokeWidth={2} dot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}